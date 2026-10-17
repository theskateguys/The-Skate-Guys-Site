import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { hash, json, outputPath, reconstruct, regularFile, trees, validateBinding, verifyArtifact, writeFresh } from './lib.mjs';

const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.xml': 'application/xml'};
export const LOCAL_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'";

export async function startServer({artifact, site = 'release', port = 0}) {
  assert.ok(trees.includes(site), 'Choose release, compliant-fallback or whatsapp-fallback');
  assert.ok(Number.isInteger(port) && port >= 0 && port <= 65535, 'Valid port required');
  const verified = await verifyArtifact(artifact);
  const allowed = new Map([...verified.files].filter(([file]) => file.startsWith(`${site}/`)));
  const server = createServer(async (req, res) => {
    const headers = {'Content-Security-Policy': LOCAL_CSP, 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer'};
    const reply = (code, body = '', type = 'text/plain') => {
      res.writeHead(code, {...headers, 'Content-Type': type});
      res.end(req.method === 'HEAD' ? '' : body);
    };
    const origin = `http://127.0.0.1:${server.address().port}`;
    if (req.headers.host !== origin.slice(7) || (req.headers.origin && req.headers.origin !== origin)) return reply(403);
    if (!['GET', 'HEAD'].includes(req.method)) return reply(405);
    let pathname;
    try {
      const rawPath = decodeURIComponent(req.url.split('?')[0]);
      if (!rawPath.startsWith('/') || rawPath.startsWith('//') || rawPath.includes('\\') ||
        rawPath.split('/').some(part => part === '.' || part === '..')) return reply(404);
      pathname = decodeURIComponent(new URL(req.url, origin).pathname);
    } catch { return reply(400); }
    if (pathname === '/local-package-identity.json') return reply(200, json({
      mode: 'LOCAL_OFFLINE_PREVIEW', site, bindingMode: verified.manifest.bindingMode,
      manifestSHA256: hash(verified.files.get('binding-manifest.json')),
      runtimeEndpoint: verified.manifest.runtimeEndpoint, requestTimeoutMs: 25000,
      networkDeliveryBlocked: true, submissionsAuthorized: false, emailAuthorized: false
    }), 'application/json');
    const file = `${site}/${pathname === '/' ? 'index.html' : pathname.slice(1)}`;
    if (!allowed.has(file)) return reply(404);
    try {
      const bytes = await regularFile(verified.base, file);
      assert.equal(hash(bytes), hash(allowed.get(file)), 'Artifact changed since startup');
      // Host configuration is not a public HTTP resource in this preview.
      if (file.endsWith('/vercel.json')) return reply(404);
      const extension = file.slice(file.lastIndexOf('.')).toLowerCase();
      reply(200, bytes, types[extension] || 'application/octet-stream');
    } catch { reply(409, 'Artifact integrity changed; stop and rebuild.'); }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const {values} = parseArgs({args, options: {out: {type: 'string'}, artifact: {type: 'string'},
    binding: {type: 'string'}, site: {type: 'string'}, port: {type: 'string'}}});
  const only = allowed => {
    for (const name of Object.keys(values)) assert.ok(allowed.includes(name), `--${name} is not allowed for ${command}`);
  };
  if (command === 'build') {
    only(['out']);
    const result = await reconstruct();
    await writeFresh(await outputPath(values.out), result.files);
    console.log(`PREPARATION ONLY: unbound intake + identical compliant snapshot + pinned WhatsApp-only fallback.\n${values.out}\nManifest SHA-256: ${hash(result.files.get('binding-manifest.json'))}`);
  } else if (command === 'check') {
    only(['artifact']);
    const result = await verifyArtifact(values.artifact);
    console.log(`PASS: exact source reconstruction, all three site-only inventories, manifests/hashes, links/anchors, JS syntax, CSP and fallback identity. ${result.manifest.files.length} public files total. ${result.manifest.bindingMode}. No remote verification.`);
  } else if (command === 'stage') {
    only(['artifact', 'out', 'binding']);
    assert.ok(values.binding, 'Explicit binding JSON required; no environment or legacy default');
    const template = await verifyArtifact(values.artifact);
    assert.equal(template.manifest.bindingMode, 'UNBOUND_PLACEHOLDER', 'Stage only from verified immutable unbound template');
    const binding = validateBinding(JSON.parse(await fs.readFile(values.binding)));
    const result = await reconstruct(binding);
    assert.equal(result.manifest.parentTemplateManifestSHA256, hash(template.files.get('binding-manifest.json')));
    await writeFresh(await outputPath(values.out), result.files);
    console.log(`ISOLATED ONLY: ${values.out}. No deployment, network request, Sheet creation, email or tracked endpoint edit. Operator attestations are not remote proof.`);
  } else if (command === 'serve') {
    only(['artifact', 'site', 'port']);
    assert.match(values.port || '', /^\d+$/, 'Explicit local port required');
    const server = await startServer({artifact: values.artifact, site: values.site, port: Number(values.port)});
    console.log(`LOCAL OFFLINE PREVIEW: http://127.0.0.1:${server.address().port}/book.html; CSP blocks all external delivery. No POST accepted.`);
    const stop = () => server.close(() => process.exit(0));
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  } else {
    throw new Error('Use build --out, check --artifact, stage --artifact --binding --out, or serve --artifact --site --port. Never deploy from this tool.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
