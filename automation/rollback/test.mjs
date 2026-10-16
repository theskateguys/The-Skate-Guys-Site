// All writes stay in ignored output/rollback/. No external services.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { build } from '../build-booking-rollback.mjs';
import { check } from '../check-booking-rollback.mjs';
import { contract, git, hash, ignoredOutput, regularFile, sources } from './lib.mjs';

test('offline packaging safety, exactness, reproducibility and mocked regressions', async t => {
  const prefix = `output/rollback/selftest-${process.pid}-${Date.now()}`;
  const options = { workingTreeTest: true };
  const first = await build({ ...options, out: `${prefix}-a` });
  const second = await build({ ...options, out: `${prefix}-b` });
  await t.test('deterministic manifests, no final source SHA, patched backend exact', async () => {
    assert.deepEqual(first.manifest, second.manifest);
    assert.equal(first.manifest.sourceSHA, null);
    assert.equal(first.manifest.productionReady, false);
    assert.equal(first.manifest.workingTreeTest, true);
    const entry = first.manifest.files.find(file => file.artifactPath === 'backend/Code.gs');
    assert.equal(entry.sourceSHA256, hash(await regularFile(path.resolve(first.destination, '../../..'), 'automation/google-apps-script/Code.gs')));
    await check({ artifact: `${prefix}-a`, ...options, regressions: true });
    await check({ artifact: `${prefix}-b`, ...options });
  });
  await t.test('endpoint disabled without changing tracked files or 25-second deadline', async () => {
    const config = (await fs.readFile(path.join(first.destination, 'website/assets/lead-config.js'))).toString();
    assert.match(config, /endpoint: ''/);
    assert.match(config, /requestTimeoutMs: 25000/);
    assert.ok(!config.includes('script.google.com'));
    assert.ok(git('show', `${contract.approvedWebsiteSHA}:assets/lead-config.js`).toString().includes(contract.trackedEndpoint));
  });
  await t.test('reject changed HTML even if a manifest were rehashed', async () => {
    const file = path.join(first.destination, 'website/book.html');
    const original = await fs.readFile(file);
    await fs.appendFile(file, '\n<!-- changed -->');
    await assert.rejects(check({ artifact: `${prefix}-a`, ...options }), /mismatch/);
    await fs.writeFile(file, original);
  });
  await t.test('reject helpers/customer files and manifest tampering', async () => {
    const extra = path.join(first.destination, 'website/private-test.json');
    await fs.writeFile(extra, '{}');
    await assert.rejects(check({ artifact: `${prefix}-a`, ...options }), /allowlist/);
    await fs.unlink(extra);
    const file = path.join(first.destination, 'manifest.json');
    const original = await fs.readFile(file);
    await fs.writeFile(file, '{}');
    await assert.rejects(check({ artifact: `${prefix}-a`, ...options }), /mismatch/);
    await fs.writeFile(file, original);
  });
  await t.test('refuse overwrite, unsafe output, implicit SHA and premature final pin', async () => {
    await assert.rejects(build({ ...options, out: `${prefix}-a` }), /EEXIST/);
    await assert.rejects(ignoredOutput('output/rollback/../../book.html'));
    await assert.rejects(ignoredOutput('book.html'));
    await assert.rejects(sources({ sourceSHA: 'HEAD', emailPatchReviewed: true }), /full commit SHA/);
    const retired = git('rev-parse', 'd8a6a5a^{commit}').toString().trim();
    await assert.rejects(sources({ sourceSHA: retired, emailPatchReviewed: true }), /never a fallback/);
    await assert.rejects(sources({ sourceSHA: contract.approvedWebsiteSHA }), /email-patch review/);
  });
  await check({ artifact: `${prefix}-a`, ...options });
  console.log(`Retained local TEST ONLY artifacts: ${prefix}-a and ${prefix}-b`);
});
