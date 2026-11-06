// Read-only local portal. This process never submits requests to Google.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createAcceptanceFixtures } from './acceptance-fixtures.mjs';

const { values } = parseArgs({options: {endpoint: {type: 'string'}, 'baseline-v1': {type: 'boolean', default: false}}});
const approvedEndpoint = 'https://script.google.com/macros/s/AKfycbyWtXY4AYK4wjgLeDDn60APzI_fF1VYpBdZ0PS30eYqEoBrvzVmqKQxYjR38jwMZF0MLg/exec';
const excluded = [
  'AKfycbymjXSnhFomwbFB7aHQXMffD73hKy7dXr80rixGOuDumRcnLoPOjN6L8bj1rGUMUVkC8g',
  'AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g',
  'AKfycbw755w_Pso18XZhhkqyywTngGDKNIJRYnl1vf7N5rxAUYtJBtxNhp38pFPQQt8q0y1Nuw',
  'AKfycbxNvwUUKELEdP4kQIMxdUapXfLu7XdG0EOLsX_o_fjD8EmVq4U7PHhg41j73Fmg-ZOwKg'
];
assert.equal(typeof values.endpoint, 'string', 'Explicit --endpoint required after user access approval');
assert.equal(values.endpoint, approvedEndpoint, 'Only the approved clean synthetic deployment is allowed');
assert.match(values.endpoint, /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/);
assert.ok(!excluded.some(id => values.endpoint.includes(id)), 'Production and all old test deployments forbidden');
const timestamp = '2026-10-17T00:30:00.000Z';
const fixtures = createAcceptanceFixtures(timestamp);
const source = (values['baseline-v1'] ? execFileSync('git', ['show', 'eff7a9be:automation/legacy-compatibility/Code.gs'],
  {cwd: fileURLToPath(new URL('../../', import.meta.url)), encoding: 'utf8'}) :
  await readFile(new URL('Code.gs', import.meta.url), 'utf8')).replace(/\r\n?/g, '\n');
const sourceSHA256 = createHash('sha256').update(source).digest('hex');
assert.equal(sourceSHA256, '8616a9d5fc098d1fe7408db21c25065b8748932b63bd6736b8f8acf1c84f7e35');
const manifest = {
  purpose: 'CLEAN_SYNTHETIC_LEGACY_ACCEPTANCE_ONLY', productionReady: false,
  projectId: '1PwInosoMgf7Cp0mHH97SlAQ1j1BnJqs2ycis75awxIkBiAS6CPWWh7dU',
  copiedSheetId: '1jt4AZNBfIv0SOwWzalfMRiTdqdjzpWn6--g91db11e8',
  endpoint: values.endpoint, sourceSHA256, timestamp, runTimestamp: timestamp,
  runPrefix: fixtures.runPrefix, sourceProvenance: 'Local Code.gs normalized to LF; SHA-256 checked at startup',
  endpointProvenance: 'Explicit operator --endpoint; declaration only, not remote deployment proof',
  remoteVerified: false, automaticRemindersRequiredDisabled: true,
  remoteVerification: 'Parent must independently verify endpoint/project/Sheet/source and disabled reminders before any submission.'
};
const origin = 'http://127.0.0.1:4198';
const routes = new Map([
  ['/', ['text/html', '<!doctype html><meta charset="utf-8"><title>TEST ONLY - Clean synthetic acceptance</title><h1>TEST ONLY - Clean synthetic acceptance</h1><p>No automatic submissions. Destination declarations are not remote verification.</p>']],
  ['/manifest.json', ['application/json', JSON.stringify(manifest)]],
  ['/fixtures.json', ['application/json', JSON.stringify(fixtures)]],
  ['/candidate.gs', ['text/plain', source]]
]);
createServer((request, response) => {
  if (request.headers.host !== '127.0.0.1:4198' || !['GET', 'HEAD'].includes(request.method) ||
      (request.headers.origin !== undefined && request.headers.origin !== origin) ||
      request.headers['sec-fetch-site'] === 'cross-site' || !routes.has(request.url)) {
    response.writeHead(403).end(); return;
  }
  const [type, body] = routes.get(request.url);
  response.writeHead(200, {
    'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': `default-src 'none'; connect-src 'self' ${values.endpoint} https://script.googleusercontent.com; frame-ancestors 'none'; form-action 'none'`
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}).listen(4198, '127.0.0.1', () => console.log(JSON.stringify({localOnly: true, port: 4198, ...manifest})));
