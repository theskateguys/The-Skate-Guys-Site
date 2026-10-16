// Loopback-only, read-only website preview. Never serves backend, manifest or repo files.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { check } from '../check-booking-rollback.mjs';
import { ignoredOutput, regularFile } from './lib.mjs';

const { values } = parseArgs({ options: {
  artifact: { type: 'string' }, source: { type: 'string' },
  'working-tree-test': { type: 'boolean', default: false }, port: { type: 'string', default: '4188' }
} });
const manifest = await check({ artifact: values.artifact, sourceSHA: values.source, workingTreeTest: values['working-tree-test'] });
const base = await ignoredOutput(values.artifact);
const allowed = new Set(manifest.files.filter(file => file.artifactPath.startsWith('website/')).map(file => file.artifactPath.slice(8)));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.xml': 'application/xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const port = Number(values.port);
assert.ok(Number.isInteger(port) && port > 1024 && port < 65536, 'Invalid local port');
createServer(async (request, response) => {
  try {
    const file = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).slice(1) || 'index.html';
    if (!['GET', 'HEAD'].includes(request.method) || !allowed.has(file)) {
      response.writeHead(403).end(); return;
    }
    const bytes = await regularFile(path.join(base, 'website'), file);
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "connect-src 'self' https://tsg-booking-test.invalid https://tsg-delay-test.invalid https://tsg-timeout-test.invalid; form-action 'none'" });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch { response.writeHead(404).end(); }
}).listen(port, '127.0.0.1', () => console.log(`OFFLINE endpoint-disabled preview: http://127.0.0.1:${port}/book.html`));
