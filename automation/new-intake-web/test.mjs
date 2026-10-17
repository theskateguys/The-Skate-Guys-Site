import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import test from 'node:test';
import { contract, gitFile, hash, outputPath, reconstruct, root, validateBinding, verifyArtifact, writeFresh } from './lib.mjs';
import { LOCAL_CSP, startServer } from './web.mjs';

const syntheticBinding = () => ({purpose: 'NEW_CLEAN_INTAKE_ISOLATED_ONLY',
  endpoint: 'https://script.google.com/macros/s/LOCAL_MOCK_NOT_A_REAL_DEPLOYMENT/exec',
  deploymentId: 'LOCAL_MOCK_NOT_A_REAL_DEPLOYMENT', version: 1,
  projectId: contract.isolatedProjectId, spreadsheetId: contract.isolatedSpreadsheetId,
  newCleanSheet: true, newProjectAndDeployment: true, automaticRemindersDisabled: true, submissionsRequireSeparateRunnerApproval: true,
  verifiedBy: 'SYNTHETIC LOCAL UNIT TEST - NOT REMOTE VERIFICATION', verifiedAt: '2026-10-16T00:00:00Z',
  authorizationReference: 'SYNTHETIC LOCAL UNIT TEST ONLY'});
const artifact = `output/new-intake-web/unit-${process.pid}-${Date.now()}`;
const initial = await reconstruct();
await writeFresh(await outputPath(artifact), initial.files);

test('source scope and deterministic site-only inventories', async () => {
  const rebuilt = await reconstruct();
  assert.equal(hash(initial.files.get('binding-manifest.json')), hash(rebuilt.files.get('binding-manifest.json')));
  assert.equal(initial.manifest.bindingMode, 'UNBOUND_PLACEHOLDER');
  assert.equal(initial.manifest.productionReady, false);
  for (const [file, bytes] of initial.files) {
    assert.doesNotMatch(file, /(?:backend|\.gs$|README|private|\.git|test\.mjs)/);
    if (file.startsWith('release/')) assert.deepEqual(bytes, initial.files.get(file.replace('release/', 'compliant-fallback/')));
  }
  assert.ok(initial.files.get('release/assets/lead-config.js').toString().includes(contract.placeholderEndpoint));
  assert.equal(initial.manifest.whatsappProductionFallback.deploymentId, 'dpl_ChBmfxVVkecQ7XgSM7sQYssRbs8n');
  assert.notEqual(initial.manifest.whatsappProductionFallback.sourceSHA.slice(0, 7), 'd8a6a5a');
});

test('reviewed runtime and published fallback bytes retained', () => {
  for (const file of ['assets/lead-capture.js', 'assets/lead-capture.css']) {
    assert.deepEqual(initial.files.get(`release/${file}`), gitFile(contract.reviewSHA, file));
  }
  for (const entry of initial.manifest.files.filter(entry => entry.path.startsWith('whatsapp-fallback/'))) {
    assert.deepEqual(initial.files.get(entry.path), gitFile(contract.whatsappProductionSHA, entry.path.slice(18)));
  }
  const config = JSON.parse(initial.files.get('release/vercel.json'));
  const csp = config.headers[0].headers.find(item => item.key === 'Content-Security-Policy').value;
  const connect = csp.split(';').find(item => item.trim().startsWith('connect-src')).trim();
  assert.equal(connect, "connect-src 'self' https://plausible.io https://script.google.com https://script.googleusercontent.com");
  assert.ok(csp.includes('https://fonts.googleapis.com') && csp.includes('https://fonts.gstatic.com'));
});

test('isolated-only binding, no legacy, reserved Sheet or implicit defaults', async () => {
  const valid = syntheticBinding();
  assert.deepEqual(validateBinding(valid), valid);
  for (const mutation of [
    {endpoint: ''}, {endpoint: contract.placeholderEndpoint}, {endpoint: `${valid.endpoint}?x=1`},
    {deploymentId: 'wrong'}, {version: 0}, {newCleanSheet: false}, {newProjectAndDeployment: false},
    {automaticRemindersDisabled: false}, {submissionsRequireSeparateRunnerApproval: false}, {verifiedBy: ''},
    {authorizationReference: ''}, {purpose: 'PRODUCTION'}, {spreadsheetId: contract.reservedFutureSpreadsheetId},
    {projectId: 'OTHER_PROJECT_NOT_PARENT_APPROVED'}, {extra: true}
  ]) assert.throws(() => validateBinding({...valid, ...mutation}));
  const production = gitFile(contract.reviewSHA, 'assets/lead-config.js').toString().match(/endpoint: '([^']+)'/)[1];
  assert.throws(() => validateBinding({...valid, endpoint: production, deploymentId: production.split('/')[5]}), /previous test URLs forbidden/);
  const template = JSON.parse(await fs.readFile(new URL('./binding.template.json', import.meta.url)));
  assert.throws(() => validateBinding(template));
});

test('binding changes generated config only in both automated trees', async () => {
  const staged = await reconstruct(syntheticBinding());
  const changes = [];
  for (const entry of initial.manifest.files) if (!initial.files.get(entry.path).equals(staged.files.get(entry.path))) changes.push(entry.path);
  assert.deepEqual(changes.sort(), ['compliant-fallback/assets/lead-config.js', 'release/assets/lead-config.js']);
  assert.equal(staged.manifest.parentTemplateManifestSHA256, hash(initial.files.get('binding-manifest.json')));
  assert.equal(staged.manifest.bindingMode, 'ISOLATED_ONLY');
  assert.equal(staged.manifest.emailAuthorized, false);
  assert.equal(staged.manifest.deploymentAuthorized, false);
});

test('fresh-only output, unsafe paths rejected', async () => {
  await assert.rejects(writeFresh(await outputPath(artifact), initial.files), /EEXIST/);
  for (const relative of ['../escape', 'output/new-intake-web/../bad', 'output/new-intake-web/a/b', root]) {
    await assert.rejects(outputPath(relative));
  }
});

test('checker rejects tampering, private extras, extra directories and manifest edits', async () => {
  const base = await outputPath(artifact);
  await verifyArtifact(artifact);
  const file = `${base}/release/book.html`;
  const original = initial.files.get('release/book.html');
  await fs.writeFile(file, Buffer.concat([original, Buffer.from('tampered')]));
  await assert.rejects(verifyArtifact(artifact), /mismatch/);
  await fs.writeFile(file, original);
  await fs.writeFile(`${base}/release/Code.gs`, 'PRIVATE TEST FIXTURE');
  await assert.rejects(verifyArtifact(artifact), /artifact files/);
  await fs.unlink(`${base}/release/Code.gs`);
  await fs.mkdir(`${base}/release/private`);
  await assert.rejects(verifyArtifact(artifact), /Empty directory/);
  await fs.rmdir(`${base}/release/private`);
  await fs.writeFile(`${base}/binding-manifest.json`, JSON.stringify({...initial.manifest, productionReady: true}));
  await assert.rejects(verifyArtifact(artifact), /mismatch/);
  await fs.writeFile(`${base}/binding-manifest.json`, initial.files.get('binding-manifest.json'));
  await verifyArtifact(artifact);
});

test('offline server blocks external delivery, private paths, mutations and Host/Origin attacks', async t => {
  const server = await startServer({artifact});
  t.after(() => new Promise(resolve => server.close(resolve)));
  const port = server.address().port;
  const request = (pathname, options = {}) => new Promise((resolve, reject) => {
    const req = http.request({hostname: '127.0.0.1', port, path: pathname, ...options}, res => {
      const chunks = [];
      res.on('data', bytes => chunks.push(bytes));
      res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString()}));
    });
    req.on('error', reject);
    req.end();
  });
  const page = await request('/book.html');
  assert.equal(page.status, 200);
  assert.equal(page.headers['content-security-policy'], LOCAL_CSP);
  assert.equal(page.headers['cache-control'], 'no-store');
  assert.equal((await request('/assets/lead-config.js')).body.includes(contract.placeholderEndpoint), true);
  for (const pathname of ['/binding-manifest.json', '/automation/google-apps-script/Code.gs', '/.git', '/vercel.json', '/%2e%2e/book.html', '/output/private.json']) {
    assert.equal((await request(pathname)).status, 404);
  }
  assert.equal((await request('/book.html', {method: 'POST'})).status, 405);
  assert.equal((await request('/book.html', {headers: {Host: 'attacker.example'}})).status, 403);
  assert.equal((await request('/book.html', {headers: {Origin: 'https://attacker.example'}})).status, 403);
  const identity = JSON.parse((await request('/local-package-identity.json')).body);
  assert.equal(identity.networkDeliveryBlocked, true);
  const base = await outputPath(artifact);
  await fs.writeFile(`${base}/release/book.html`, 'tamper after server start');
  assert.equal((await request('/book.html')).status, 409);
  await fs.writeFile(`${base}/release/book.html`, initial.files.get('release/book.html'));
});
