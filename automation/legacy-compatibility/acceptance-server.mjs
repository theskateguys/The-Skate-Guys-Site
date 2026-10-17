// Read-only loopback source/fixture portal. No submissions or Google calls.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { parseArgs } from 'node:util';
import { createAcceptanceFixtures } from './acceptance-fixtures.mjs';

const { values } = parseArgs({options: {
  port: {type: 'string', default: '4197'},
  timestamp: {type: 'string'}, endpoint: {type: 'string', default: ''}
}});
const fixtures = createAcceptanceFixtures(values.timestamp);
const port = Number(values.port);
assert.ok(Number.isInteger(port) && port > 1024 && port < 65536);
const projectId = '1qXXCOqzdedWiuwjdR1bcJHp7T517fbXUlFl_s9NVfNKlytGmNpWrVKU9';
const copiedSheetId = '1CuA0uWDnUu-EK0XseYxNNpEK4lX5SZ7S5UuTdy-HCyM';
const excluded = [
  'AKfycbymjXSnhFomwbFB7aHQXMffD73hKy7dXr80rixGOuDumRcnLoPOjN6L8bj1rGUMUVkC8g',
  'AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g',
  'AKfycbw755w_Pso18XZhhkqyywTngGDKNIJRYnl1vf7N5rxAUYtJBtxNhp38pFPQQt8q0y1Nuw'
];
if (values.endpoint) {
  assert.match(values.endpoint, /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/);
  assert.ok(!excluded.some(id => values.endpoint.includes(id)), 'Never use an existing production/strict deployment');
}
const source = (await readFile(new URL('Code.gs', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const sourceSHA256 = createHash('sha256').update(source).digest('hex');
const manifest = {purpose: 'ISOLATED_LEGACY_ACCEPTANCE_ONLY', productionReady: false,
  projectId, copiedSheetId, endpoint: values.endpoint, sourceSHA256, timestamp: fixtures.timestamp,
  runPrefix: fixtures.runPrefix, remoteVerification: 'Parent must verify actual deployment/project/Sheet and disabled reminders.'};
const routes = new Map([
  ['/', ['text/html', '<!doctype html><meta charset="utf-8"><title>TEST ONLY - Legacy API acceptance</title><h1>TEST ONLY - isolated legacy acceptance</h1><p>No automatic submissions. Browser API checks run only under the parent\'s explicit control.</p>']],
  ['/candidate.gs', ['text/plain', source]],
  ['/manifest.json', ['application/json', JSON.stringify(manifest)]],
  ['/fixtures.json', ['application/json', JSON.stringify(fixtures)]]
]);
createServer((request, response) => {
  const origin = `http://127.0.0.1:${port}`;
  if (request.headers.host !== `127.0.0.1:${port}` || !['GET','HEAD'].includes(request.method) ||
      (request.headers.origin && request.headers.origin !== origin) ||
      request.headers['sec-fetch-site'] === 'cross-site' || !routes.has(request.url)) {
    response.writeHead(403).end(); return;
  }
  const [type, body] = routes.get(request.url);
  response.writeHead(200, {'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': `default-src 'none'; connect-src 'self' ${values.endpoint || "'none'"} ${values.endpoint ? 'https://script.googleusercontent.com' : ''}; frame-ancestors 'none'; form-action 'none'`});
  response.end(request.method === 'HEAD' ? undefined : body);
}).listen(port, '127.0.0.1', () => console.log(JSON.stringify({localOnly: true,port,sourceSHA256,...manifest})));
