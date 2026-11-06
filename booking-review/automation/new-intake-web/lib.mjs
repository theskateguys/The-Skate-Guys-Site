import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const contract = JSON.parse(await fs.readFile(new URL('./contract.json', import.meta.url)));
export const json = value => `${JSON.stringify(value, null, 2)}\n`;
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const git = (...args) => execFileSync('git', args, {cwd: root, maxBuffer: 32 * 1024 * 1024});
const normalize = bytes => bytes.toString().replace(/\r\n/g, '\n');
export const CUSTOMER_POLICY = "If TSG cannot offer a replacement before expiry, we extend the credit to give you a reasonable opportunity to attend. We'll confirm your revised credit expiry with you.";
const INTERNAL_POLICY = 'If TSG cannot offer a replacement before expiry, we extend the credit to give you a reasonable opportunity to attend and record the agreed new expiry.';
export const trees = ['release', 'compliant-fallback', 'whatsapp-fallback'];
const blobs = new Map();

export function gitFile(sha, file) {
  const key = `${sha}:${file}`;
  if (blobs.has(key)) return Buffer.from(blobs.get(key));
  assert.match(git('ls-tree', sha, '--', file).toString(), /^100644 blob /, `Regular Git blob required: ${file}`);
  const bytes = git('show', key);
  blobs.set(key, bytes);
  return Buffer.from(bytes);
}

export async function regularFile(base, relative) {
  assert.ok(!path.isAbsolute(relative), 'Relative file required');
  let current = base;
  const baseStat = await fs.lstat(base);
  assert.ok(baseStat.isDirectory() && !baseStat.isSymbolicLink(), 'Regular base required');
  for (const part of relative.split('/')) {
    assert.ok(part && part !== '.' && part !== '..' && !part.includes('\\'), 'Unsafe path');
    current = path.join(current, part);
    assert.ok(!(await fs.lstat(current)).isSymbolicLink(), `Symlink forbidden: ${relative}`);
  }
  assert.ok((await fs.lstat(current)).isFile(), `Regular file required: ${relative}`);
  return fs.readFile(current);
}

export async function outputPath(relative) {
  assert.equal(typeof relative, 'string', 'Explicit output path required');
  assert.match(relative, /^output\/new-intake-web\/[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Use output/new-intake-web/<fresh-name>');
  assert.ok(git('check-ignore', '--', `${relative}/binding-manifest.json`).length, 'Output must be ignored');
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try {
      const stat = await fs.lstat(current);
      assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), 'Output must use regular directories');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return current;
}

export async function inventory(base, prefix = '') {
  const files = [];
  for (const entry of await fs.readdir(path.join(base, prefix), {withFileTypes: true})) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    assert.ok(!entry.isSymbolicLink(), `Symlink forbidden: ${relative}`);
    if (entry.isDirectory()) {
      const nested = await inventory(base, relative);
      assert.ok(nested.length, `Empty directory forbidden: ${relative}`);
      files.push(...nested);
    } else {
      assert.ok(entry.isFile(), `Regular file required: ${relative}`);
      files.push(relative);
    }
  }
  return files.sort();
}

export function validateBinding(binding) {
  if (binding === null) return null;
  const keys = ['purpose', 'endpoint', 'deploymentId', 'version', 'projectId', 'spreadsheetId',
    'newCleanSheet', 'newProjectAndDeployment', 'automaticRemindersDisabled', 'submissionsRequireSeparateRunnerApproval',
    'verifiedBy', 'verifiedAt', 'authorizationReference'];
  assert.deepEqual(Object.keys(binding).sort(), keys.sort(), 'Exact binding schema required');
  assert.equal(binding.purpose, 'NEW_CLEAN_INTAKE_ISOLATED_ONLY');
  assert.match(binding.endpoint, /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/, 'Canonical HTTPS exec URL required');
  assert.equal(binding.deploymentId, binding.endpoint.split('/')[5], 'Endpoint/deployment mismatch');
  assert.ok(Number.isInteger(binding.version) && binding.version > 0, 'Explicit version required');
  for (const field of ['projectId', 'spreadsheetId']) assert.match(binding[field], /^[A-Za-z0-9_-]{20,}$/, `${field} required`);
  assert.notEqual(binding.spreadsheetId, contract.reservedFutureSpreadsheetId, 'Reserved future Sheet is NOT authorized for staging');
  assert.equal(binding.projectId, contract.isolatedProjectId, 'Only parent-specified new isolated project allowed');
  assert.equal(binding.spreadsheetId, contract.isolatedSpreadsheetId, 'Only parent-specified clean TEST Sheet allowed');
  assert.notEqual(binding.projectId, binding.spreadsheetId);
  // Deny every previously recorded destination, not only the tracked production config.
  const known = git('grep', '-I', '-h', '-o', '-E', 'https://script[.]google[.]com/macros/s/[A-Za-z0-9_-]+/exec', contract.reviewSHA).toString();
  assert.ok(!known.split(/\r?\n/).includes(binding.endpoint), 'Legacy, production and previous test URLs forbidden');
  const priorBinding = gitFile(contract.reviewSHA, 'automation/rollback/binding.mjs').toString();
  for (const field of ['projectId', 'spreadsheetId']) assert.ok(!priorBinding.includes(binding[field]), 'Previous isolated identity forbidden');
  for (const field of ['newCleanSheet', 'newProjectAndDeployment', 'automaticRemindersDisabled', 'submissionsRequireSeparateRunnerApproval']) {
    assert.equal(binding[field], true, `${field} must be explicitly attested`);
  }
  for (const field of ['verifiedBy', 'authorizationReference']) assert.ok(typeof binding[field] === 'string' && binding[field].trim().length >= 3, `${field} required`);
  assert.match(binding.verifiedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/);
  assert.ok(Number.isFinite(Date.parse(binding.verifiedAt)), 'Valid verification time required');
  return structuredClone(binding);
}

export function vercelConfig() {
  const config = JSON.parse(gitFile(contract.whatsappProductionSHA, 'vercel.json'));
  const header = config.headers[0].headers.find(item => item.key === 'Content-Security-Policy');
  assert.ok(header.value.includes("connect-src 'self' https://plausible.io;"));
  header.value = header.value.replace("connect-src 'self' https://plausible.io;",
    "connect-src 'self' https://plausible.io https://script.google.com https://script.googleusercontent.com;");
  return Buffer.from(json(config));
}

export async function reconstruct(binding = null) {
  validateBinding(binding);
  assert.equal(git('branch', '--show-current').toString().trim(), 'codex/single-session-booking-review');
  const automated = new Map();
  const whatsapp = new Map();
  const provenance = new Map();
  for (const file of contract.website) {
    const original = gitFile(contract.reviewSHA, file);
    const source = file === 'book.html' ? Buffer.from(normalize(original).replace(INTERNAL_POLICY, CUSTOMER_POLICY)) : original;
    const checkout = await regularFile(root, file);
    assert.deepEqual(/\.(html|js|css|xml|svg)$/.test(file) ? normalize(checkout) : checkout,
      /\.(html|js|css|xml|svg)$/.test(file) ? normalize(source) : source, `Reviewed source drift: ${file}`);
    let bytes = source;
    if (file === 'assets/lead-config.js') {
      const text = source.toString();
      assert.equal((text.match(/endpoint:\s*'[^']*'/g) || []).length, 1);
      assert.match(text, /requestTimeoutMs:\s*25000\b/);
      assert.match(text, /whatsappNumber:\s*'18682766878'/);
      bytes = Buffer.from(text.replace(/endpoint:\s*'[^']*'/, `endpoint: '${binding?.endpoint || contract.placeholderEndpoint}'`));
    }
    automated.set(file, bytes);
    provenance.set(file, {sourceSHA: contract.reviewSHA, sourceSHA256: hash(original),
      transformation: file === 'assets/lead-config.js' ? 'generated-endpoint-only' : file === 'book.html' ? 'customer-policy-sentence-only' : 'exact-copy'});
    if (!/^assets\/lead-(?:capture|config)\./.test(file)) whatsapp.set(file, gitFile(contract.whatsappProductionSHA, file));
  }
  automated.set('vercel.json', vercelConfig());
  for (const file of ['assets/whatsapp-booking.js', 'assets/whatsapp-booking.css', 'assets/whatsapp-contact.css', 'vercel.json']) {
    whatsapp.set(file, gitFile(contract.whatsappProductionSHA, file));
  }
  const files = new Map();
  const entries = [];
  for (const tree of trees) {
    const contents = tree === 'whatsapp-fallback' ? whatsapp : automated;
    validateSite(contents, tree === 'whatsapp-fallback');
    for (const [file, bytes] of [...contents].sort(([a], [b]) => a.localeCompare(b))) {
      const relative = `${tree}/${file}`;
      files.set(relative, bytes);
      entries.push({path: relative, bytes: bytes.length, sha256: hash(bytes),
        ...(tree === 'whatsapp-fallback' ? {sourceSHA: contract.whatsappProductionSHA, sourceSHA256: hash(bytes), transformation: 'exact-copy'}
          : file === 'vercel.json' ? {sourceSHA: contract.whatsappProductionSHA, sourceSHA256: hash(gitFile(contract.whatsappProductionSHA, file)), transformation: 'allow-google-connect-origins-only'}
          : provenance.get(file))});
    }
  }
  const manifest = {
    schemaVersion: 1, purpose: 'NEW_CLEAN_INTAKE_WEBSITE_PREPARATION', productionReady: false,
    bindingMode: binding ? 'ISOLATED_ONLY' : 'UNBOUND_PLACEHOLDER', binding,
    pendingIsolatedIdentity: {projectId: contract.isolatedProjectId, spreadsheetId: contract.isolatedSpreadsheetId,
      endpoint: binding?.endpoint || null, reservedFutureSheetAuthorized: false},
    runtimeEndpoint: binding?.endpoint || contract.placeholderEndpoint,
    reviewSHA: contract.reviewSHA, contractSHA256: hash(json(contract)),
    requestTimeoutMs: 25000, whatsappNumber: '18682766878',
    remoteVerification: 'NOT_PERFORMED_OPERATOR_ATTESTATIONS_ARE_NOT_REMOTE_PROOF',
    submissionsAuthorized: false, emailAuthorized: false, deploymentAuthorized: false,
    compliantFallback: {directory: 'compliant-fallback', identicalTo: 'release',
      limitation: 'Same-code snapshot; does not cure shared integration defects. Use WhatsApp-only fallback for those.'},
    whatsappProductionFallback: {directory: 'whatsapp-fallback', sourceSHA: contract.whatsappProductionSHA,
      deploymentId: contract.whatsappProductionDeploymentId, identityEvidence: 'USER_SUPPLIED_NOT_REMOTELY_REVERIFIED',
      forbiddenReversion: 'd8a6a5a', promotionAuthorized: false},
    files: entries, payloadSHA256: hash(json(entries.map(({path: name, sha256}) => ({path: name, sha256}))))
  };
  if (binding) manifest.parentTemplateManifestSHA256 = hash((await reconstruct()).files.get('binding-manifest.json'));
  files.set('binding-manifest.json', Buffer.from(json(manifest)));
  files.set('binding-manifest.sha256', Buffer.from(`${hash(files.get('binding-manifest.json'))}  binding-manifest.json\n`));
  return {files, manifest};
}

export function validateSite(contents, whatsappOnly = false) {
  for (const page of ['index.html', 'book.html', 'merch.html', 'elite.html']) {
    const text = contents.get(page).toString();
    const ids = [...text.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page}: duplicate IDs`);
    for (const match of text.matchAll(/\b(?:src|href)="([^"<>]+)"/g)) {
      const ref = match[1];
      if (ref.includes('${') || /^(https?:|mailto:|tel:)/.test(ref)) {
        if (ref.startsWith('https://wa.me/')) assert.equal(new URL(ref.replaceAll('&amp;', '&')).pathname, '/18682766878');
        continue;
      }
      const [file, anchor] = ref.split('#');
      const target = file.split('?')[0] || page;
      assert.ok(contents.has(target), `${page}: unpublished reference ${ref}`);
      if (anchor) assert.ok(contents.get(target).toString().includes(`id="${anchor}"`), `${page}: missing anchor ${ref}`);
    }
    for (const match of text.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (!/\bsrc=|application\/ld\+json/i.test(match[1])) new vm.Script(match[2], {filename: page});
    }
    if (whatsappOnly) assert.doesNotMatch(text, /data-tsg-lead-form|assets\/lead-(capture|config)|script\.google\.com/);
  }
  for (const [file, bytes] of contents) {
    if (file.endsWith('.js')) new vm.Script(bytes.toString(), {filename: file});
    if (/\.(html|js|css|json|xml|svg)$/.test(file)) {
      assert.doesNotMatch(bytes.toString(), /https:\/\/script\.google\.com\/macros\/s\/(?![A-Za-z0-9_-]+\/exec)[^'"\s]+/);
    }
  }
  const policy = contents.get('book.html').toString();
  assert.ok(policy.includes(CUSTOMER_POLICY));
  assert.ok(policy.includes('<label>Preferred date<input') && policy.includes('<label>Preferred time<input'), 'Approved date/time labels preserved');
  if (whatsappOnly) {
    assert.doesNotMatch(contents.get('assets/whatsapp-booking.js').toString(), /fetch\s*\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/);
  } else {
    for (const file of ['index.html', 'book.html', 'merch.html']) assert.ok(contents.get(file).toString().includes('data-tsg-lead-form'));
    const script = contents.get('assets/lead-capture.js').toString();
    assert.ok(script.includes("acknowledgement.leadId === payload.leadId"));
    assert.ok(script.includes("['New Lead', 'duplicate_ignored']"));
    assert.ok(script.includes('const result = await postPayload(submittedPayload);'));
  }
}

export async function writeFresh(destination, files) {
  await fs.mkdir(path.dirname(destination), {recursive: true});
  await fs.mkdir(destination);
  for (const [relative, bytes] of files) {
    const file = path.join(destination, relative);
    await fs.mkdir(path.dirname(file), {recursive: true});
    await fs.writeFile(file, bytes, {flag: 'wx'});
  }
}

export async function verifyArtifact(relative) {
  const base = await outputPath(relative);
  const manifest = JSON.parse(await regularFile(base, 'binding-manifest.json'));
  const expected = await reconstruct(manifest.binding);
  assert.deepEqual(await inventory(base), [...expected.files.keys()].sort(), 'Unexpected, missing or private artifact files');
  for (const [file, bytes] of expected.files) assert.equal(hash(await regularFile(base, file)), hash(bytes), `Source/manifest mismatch: ${file}`);
  return {...expected, base};
}
