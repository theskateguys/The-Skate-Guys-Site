import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createAcceptanceFixtures } from './acceptance-fixtures.mjs';

const wrong = 'https://script.google.com/macros/s/UNAPPROVED_TEST_ENDPOINT/exec';
const server = spawnSync(process.execPath, [fileURLToPath(new URL('clean-acceptance-server.mjs', import.meta.url)), '--endpoint', wrong], {encoding: 'utf8'});
assert.notEqual(server.status, 0);
assert.match(server.stderr, /Only the approved clean synthetic deployment is allowed/);
const fixtures = createAcceptanceFixtures('2026-10-17T00:30:00.000Z');
const manifest = {
  purpose: 'CLEAN_SYNTHETIC_LEGACY_ACCEPTANCE_ONLY', productionReady: false,
  remoteVerified: false, automaticRemindersRequiredDisabled: true,
  projectId: '1PwInosoMgf7Cp0mHH97SlAQ1j1BnJqs2ycis75awxIkBiAS6CPWWh7dU',
  copiedSheetId: '1jt4AZNBfIv0SOwWzalfMRiTdqdjzpWn6--g91db11e8',
  sourceSHA256: '8616a9d5fc098d1fe7408db21c25065b8748932b63bd6736b8f8acf1c84f7e35',
  timestamp: fixtures.timestamp, runTimestamp: fixtures.timestamp, runPrefix: fixtures.runPrefix,
  sourceProvenance: 'Local Code.gs normalized to LF; SHA-256 checked at startup',
  endpointProvenance: 'Explicit operator --endpoint; declaration only, not remote deployment proof',
  endpoint: wrong
};
const run = vm.runInNewContext(`(${readFileSync(new URL('clean-acceptance-browser.js', import.meta.url), 'utf8')})`);
let routes = 0;
let evaluations = 0;
const page = {
  url: () => 'http://127.0.0.1:4198/#FRESH-fresh',
  request: {get: async url => ({status: () => 200, json: async () => url.endsWith('/manifest.json') ? manifest : fixtures})},
  route: async () => { routes++; },
  evaluate: async () => { evaluations++; }
};
await assert.rejects(run(page), /Only the exact approved clean synthetic deployment is allowed/);
assert.equal(routes, 0);
assert.equal(evaluations, 0);
console.log('PASS offline: server and browser reject an unapproved canonical URL before listening or submitting; no network/Google calls.');
