// Narrow local integrity/HTTP tests only. No browser, Google, rows or email.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { once } from 'node:events';
import { test } from 'node:test';
import { bind } from '../bind-booking-rollback-isolated.mjs';
import { checkIsolated } from '../check-booking-rollback-isolated.mjs';
import { CONFIG, ENDPOINT, IDENTITY, TEMPLATE, bindingOutput, exactEndpoint, privateFixture, verifiedTemplate } from './binding.mjs';
import { contract, hash, ignoredOutput, json, regularFile, root } from './lib.mjs';
import { createPreview } from './serve.mjs';

test('isolated binding guards and read-only loopback serving', async t => {
  const artifact = `output/rollback/isolated-binding-test-${process.pid}-${Date.now()}`;
  const original = await verifiedTemplate();
  const templateHashes = [...original.files].map(([file, bytes]) => [file, hash(bytes)]);
  const result = await bind({ out: artifact });
  const filePath = file => path.join(result.destination, file);
  await t.test('43 exact files; endpoint-only config delta; explicit provenance and parent gate', async () => {
    const manifest = await checkIsolated({ artifact });
    assert.equal(manifest.files.length, 43);
    assert.deepEqual(manifest.binding, IDENTITY);
    assert.equal(manifest.productionReady, false);
    assert.equal(manifest.automaticReminders.requiredEnabledValue, false);
    assert.equal(manifest.automaticReminders.automatedProof, false);
    assert.equal(manifest.automaticReminders.verification, 'PARENT_READ_VERIFICATION_REQUIRED');
    for (const entry of manifest.files) {
      assert.equal(entry.templateSHA256, hash(original.files.get(entry.artifactPath)));
      assert.equal(entry.boundSHA256, hash(await fs.readFile(filePath(entry.artifactPath))));
      if (entry.artifactPath !== CONFIG) assert.equal(entry.boundSHA256, entry.templateSHA256);
    }
    const boundConfig = await fs.readFile(filePath(CONFIG), 'utf8');
    assert.equal(boundConfig.replace(ENDPOINT, ''), original.files.get(CONFIG).toString());
    assert.match(boundConfig, /requestTimeoutMs: 25000/);
  });
  await t.test('reject production/arbitrary variants, wrong paths, overwrite and offline mode', async () => {
    for (const endpoint of [contract.trackedEndpoint, 'https://example.com/exec', `${ENDPOINT}?x=1`, ENDPOINT.replace('https:', 'http:'), ENDPOINT.replace('/exec', '/dev'), `${ENDPOINT}#x`]) {
      assert.throws(() => exactEndpoint(endpoint), /exact allowlisted/);
      await assert.rejects(bind({ out: `${artifact}-rejected`, endpoint }), /exact allowlisted/);
    }
    for (const out of [TEMPLATE, 'output/rollback/isolated-x/child', 'output/rollback/isolated-x/../x', 'output/acceptance/x', '../isolated-x', path.join(root, artifact)]) {
      await assert.rejects(bindingOutput(out));
    }
    await assert.rejects(bind({ out: artifact }), /EEXIST/);
    await assert.rejects(createPreview({ artifact }), /Choose exactly one/);
    await assert.rejects(createPreview({ artifact, isolatedBinding: true, sourceSHA: 'HEAD' }), /cannot use/);
    await assert.rejects(createPreview({ artifact, privateFixturePath: 'output/acceptance/private.json' }), /requires explicit/);
    await assert.rejects(privateFixture('assets/lead-config.js'));
    await assert.rejects(privateFixture('output/acceptance/../private.json'));
  });
  await t.test('reject altered payload even when manifest and checksum are rehashed', async () => {
    const config = await fs.readFile(filePath(CONFIG));
    const manifestBytes = await fs.readFile(filePath('manifest.json'));
    const checksum = await fs.readFile(filePath('manifest.sha256'));
    try {
      const changed = Buffer.from(config.toString().replace(ENDPOINT, contract.trackedEndpoint));
      await fs.writeFile(filePath(CONFIG), changed);
      const forged = JSON.parse(manifestBytes);
      forged.binding.endpoint = contract.trackedEndpoint;
      forged.files.find(entry => entry.artifactPath === CONFIG).boundSHA256 = hash(changed);
      const bytes = json(forged);
      await fs.writeFile(filePath('manifest.json'), bytes);
      await fs.writeFile(filePath('manifest.sha256'), `${hash(bytes)}  manifest.json\n`);
      await assert.rejects(checkIsolated({ artifact }), /mismatch/);
    } finally {
      await fs.writeFile(filePath(CONFIG), config);
      await fs.writeFile(filePath('manifest.json'), manifestBytes);
      await fs.writeFile(filePath('manifest.sha256'), checksum);
    }
    const html = await fs.readFile(filePath('website/book.html'));
    await fs.appendFile(filePath('website/book.html'), '\nchanged');
    await assert.rejects(checkIsolated({ artifact }), /mismatch/);
    await fs.writeFile(filePath('website/book.html'), html);
    await fs.writeFile(filePath('website/private.json'), '{}');
    await assert.rejects(checkIsolated({ artifact }), /allowlist/);
    await fs.unlink(filePath('website/private.json'));
    await fs.mkdir(filePath('website/unexpected-empty'));
    await assert.rejects(checkIsolated({ artifact }), /empty directory/);
    await fs.rmdir(filePath('website/unexpected-empty'));
  });
  await t.test('HTTP identity/CSP, exact Host, no POST/private/backend/docs, post-start hash guard', async () => {
    // A local ephemeral listener reserves a free port; actual preview still enforces its exact port.
    const probe = http.createServer();
    probe.listen(0, '127.0.0.1');
    await once(probe, 'listening');
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    const server = await createPreview({ artifact, isolatedBinding: true, port });
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    const request = (url, method = 'GET', headers = {}) => new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path: url, method, headers }, res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
      });
      req.on('error', reject); req.end();
    });
    try {
      const response = await request('/book.html');
      assert.equal(response.status, 200);
      assert.equal(response.headers['content-security-policy'].split(';')[0], `connect-src 'self' ${ENDPOINT} https://script.googleusercontent.com`);
      const identity = JSON.parse((await request('/isolated-test-manifest.json')).body);
      assert.equal(identity.mode, 'isolated-rollback-binding');
      assert.equal(identity.endpoint, ENDPOINT);
      assert.equal(identity.copiedSheetId, IDENTITY.copiedSheetId);
      assert.equal(identity.version, 2);
      assert.equal(identity.requestTimeoutMs, 25000);
      assert.equal(identity.boundManifestSHA256, hash(await fs.readFile(filePath('manifest.json'))));
      for (const url of ['/backend/Code.gs', '/manifest.json', '/README.md', '/.git/config', '/output/acceptance/private.json', '/isolated-retry-fixture.json', '/%2e%2e/backend/Code.gs']) {
        assert.equal((await request(url)).status, 403);
      }
      assert.equal((await request('/book.html', 'POST')).status, 403);
      assert.equal((await request('/isolated-test-manifest.json', 'POST')).status, 403);
      assert.equal((await request('/book.html', 'GET', { Host: `evil.example:${port}` })).status, 403);
      assert.equal((await request('/book.html', 'GET', { Host: '127.0.0.1:1' })).status, 403);
      assert.equal((await request('/book.html', 'GET', { Origin: 'https://evil.example' })).status, 403);
      assert.equal((await request('/book.html', 'GET', { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
      assert.equal((await request('http://evil.example/book.html')).status, 403);
      assert.equal((await request('/book.html', 'HEAD')).body, '');
      const config = await fs.readFile(filePath(CONFIG));
      try {
        await fs.appendFile(filePath(CONFIG), '\nchanged');
        assert.equal((await request('/assets/lead-config.js')).status, 404);
      } finally { await fs.writeFile(filePath(CONFIG), config); }
    } finally { await new Promise(resolve => server.close(resolve)); }
    const fixtureName = `output/acceptance/binding-fixture-test-${process.pid}-${Date.now()}.json`;
    const fixturePath = path.join(root, fixtureName);
    await fs.writeFile(fixturePath, '{"syntheticFixture":true}', { flag: 'wx' });
    let optedIn;
    try {
      optedIn = await createPreview({ artifact, isolatedBinding: true, port, privateFixturePath: fixtureName });
      optedIn.listen(port, '127.0.0.1');
      await once(optedIn, 'listening');
      const explicit = await request('/isolated-retry-fixture.json');
      assert.equal(explicit.status, 200);
      assert.equal(explicit.headers['cache-control'], 'no-store');
      assert.deepEqual(JSON.parse(explicit.body), { syntheticFixture: true });
      assert.equal((await request(`/${fixtureName}`)).status, 403);
      assert.equal((await request('/isolated-retry-fixture.json', 'POST')).status, 403);
      assert.equal((await request('/isolated-retry-fixture.json', 'GET', { Origin: 'https://evil.example' })).status, 403);
    } finally {
      if (optedIn?.listening) await new Promise(resolve => optedIn.close(resolve));
      await fs.unlink(fixturePath);
    }
  });
  await checkIsolated({ artifact });
  const templateBase = await ignoredOutput(TEMPLATE);
  for (const [file, expectedHash] of templateHashes) assert.equal(hash(await regularFile(templateBase, file)), expectedHash);
  console.log('PASS: template unchanged; local integrity/HTTP only. No browser or external request.');
});
