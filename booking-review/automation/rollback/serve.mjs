// Loopback-only, read-only preview. One private fixture requires explicit opt-in.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { check } from '../check-booking-rollback.mjs';
import { checkIsolated } from '../check-booking-rollback-isolated.mjs';
import { ENDPOINT, bindingOutput, privateFixture, publicIdentity } from './binding.mjs';
import { hash, ignoredOutput, json, regularFile } from './lib.mjs';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.xml': 'application/xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

export async function createPreview({ artifact, sourceSHA, workingTreeTest = false, isolatedBinding = false, port = 4188, privateFixturePath }) {
  assert.ok(Number.isInteger(port) && port > 1024 && port < 65536, 'Invalid local port');
  assert.ok(!isolatedBinding || (!sourceSHA && !workingTreeTest), 'Isolated binding cannot use offline source/test flags');
  assert.ok(!privateFixturePath || isolatedBinding, 'Private fixture requires explicit isolated-binding mode');
  // Only an explicitly named parent fixture is exposed; no directory browsing or automatic POST.
  const fixtureBytes = privateFixturePath ? await privateFixture(privateFixturePath) : null;
  const manifest = isolatedBinding ? await checkIsolated({ artifact }) : await check({ artifact, sourceSHA, workingTreeTest });
  const base = await (isolatedBinding ? bindingOutput(artifact) : ignoredOutput(artifact));
  const allowed = new Map(manifest.files.filter(file => file.artifactPath.startsWith('website/'))
    .map(file => [file.artifactPath.slice(8), file.boundSHA256 || file.artifactSHA256]));
  const csp = isolatedBinding
    ? `connect-src 'self' ${ENDPOINT} https://script.googleusercontent.com; form-action 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`
    : "connect-src 'self' https://tsg-booking-test.invalid https://tsg-delay-test.invalid https://tsg-timeout-test.invalid; form-action 'none'";
  return createServer(async (request, response) => {
    try {
      // Exact Host blocks DNS rebinding; origin-form requests cannot name another host.
      if (request.headers.host !== `127.0.0.1:${port}` || !request.url.startsWith('/') || request.url.startsWith('//') ||
          !['GET', 'HEAD'].includes(request.method) ||
          (request.headers.origin && request.headers.origin !== `http://127.0.0.1:${port}`) ||
          request.headers['sec-fetch-site'] === 'cross-site') {
        response.writeHead(403).end(); return;
      }
      const pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
      const file = pathname.slice(1) || 'index.html';
      const identity = isolatedBinding && pathname === '/isolated-test-manifest.json';
      const fixture = fixtureBytes && pathname === '/isolated-retry-fixture.json';
      if (!identity && !fixture && !allowed.has(file)) {
        response.writeHead(403).end(); return;
      }
      const bytes = identity ? Buffer.from(json(publicIdentity(manifest))) : fixture ? fixtureBytes : await regularFile(path.join(base, 'website'), file);
      if (!identity && !fixture) assert.equal(hash(bytes), allowed.get(file), 'Served file changed after verification');
      response.writeHead(200, { 'Content-Type': identity || fixture ? 'application/json' : types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': csp });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch { response.writeHead(404).end(); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: {
    artifact: { type: 'string' }, source: { type: 'string' },
    'working-tree-test': { type: 'boolean', default: false },
    'isolated-binding': { type: 'boolean', default: false }, port: { type: 'string', default: '4188' },
    'private-fixture': { type: 'string' }
  } });
  const port = Number(values.port);
  const server = await createPreview({ artifact: values.artifact, sourceSHA: values.source,
    workingTreeTest: values['working-tree-test'], isolatedBinding: values['isolated-binding'], port, privateFixturePath: values['private-fixture'] });
  server.listen(port, '127.0.0.1', () => console.log(`${values['isolated-binding'] ? 'ISOLATED_ONLY (parent remote read verification required)' : 'OFFLINE endpoint-disabled'} preview: http://127.0.0.1:${port}/book.html`));
}
