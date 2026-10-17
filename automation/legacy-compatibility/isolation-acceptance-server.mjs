// Read-only loopback portal. No outbound client or remote verification.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
import {
  assertApprovedEndpoint, createIsolationAcceptanceFixtures, createManifest, ORIGIN, SOURCE_SHA256
} from './isolation-acceptance-fixtures.mjs';

// Parent fills only after independently verifying the new Google version 2 deployment.
export const APPROVED_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw7On5pvG1ohVzbESEu_JkOyhGt1EIHyWaYJt_moU16A6VEq7NM6QI4pq8idYfF1NCW7g/exec';

export function isAllowedLocalRequest(request, routes) {
  return request.method === 'GET' && request.headers.host === '127.0.0.1:4198' &&
    (request.headers.origin === undefined || request.headers.origin === ORIGIN) &&
    request.headers['sec-fetch-site'] !== 'cross-site' && routes.has(request.url);
}

export function createRequestHandler(routes, endpoint) {
  assertApprovedEndpoint(endpoint, APPROVED_ENDPOINT);
  return (request, response) => {
    if (!isAllowedLocalRequest(request, routes)) {
      response.writeHead(403).end();
      return;
    }
    const [type, body] = routes.get(request.url);
    response.writeHead(200, {
      'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': `default-src 'none'; connect-src 'self' ${endpoint} https://script.googleusercontent.com/macros/echo; frame-ancestors 'none'; form-action 'none'; base-uri 'none'`
    });
    response.end(body);
  };
}

export async function startPortal(args = process.argv.slice(2)) {
  const {values} = parseArgs({args, options: {endpoint: {type: 'string'}}});
  assertApprovedEndpoint(values.endpoint, APPROVED_ENDPOINT);
  const source = (await readFile(new URL('Code.gs', import.meta.url), 'utf8')).replace(/\r\n?/g, '\n');
  assert.equal(createHash('sha256').update(source).digest('hex'), SOURCE_SHA256, 'Candidate LF SHA-256 mismatch');
  const manifest = createManifest(values.endpoint);
  const routes = new Map([
    ['/', ['text/html', '<!doctype html><meta charset="utf-8"><title>TEST ONLY - Isolated v2 acceptance</title><h1>TEST ONLY - Isolated v2 acceptance</h1>']],
    ['/manifest.json', ['application/json', JSON.stringify(manifest)]],
    ['/fixtures.json', ['application/json', JSON.stringify(createIsolationAcceptanceFixtures())]],
    ['/candidate.gs', ['text/plain', source]]
  ]);
  const server = createServer(createRequestHandler(routes, values.endpoint));
  server.listen(4198, '127.0.0.1', () => console.log(JSON.stringify({localOnly: true, ...manifest})));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startPortal();
}
