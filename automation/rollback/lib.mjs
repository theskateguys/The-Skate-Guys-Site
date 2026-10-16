import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const contract = JSON.parse(await fs.readFile(new URL('./contract.json', import.meta.url), 'utf8'));
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const json = value => `${JSON.stringify(value, null, 2)}\n`;
export const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
export const gitBytes = (sha, file) => {
  const entry = git('ls-tree', sha, '--', file).toString();
  assert.match(entry, /^100644 blob /, `Expected regular Git blob: ${file}`);
  return git('show', `${sha}:${file}`);
};

export async function regularFile(base, file) {
  let current = base;
  assert.ok((await fs.lstat(current)).isDirectory(), `Not a regular directory: ${current}`);
  for (const part of file.split('/')) {
    assert.ok(part && part !== '.' && part !== '..', 'Unsafe relative path');
    current = path.join(current, part);
    const stat = await fs.lstat(current);
    assert.ok(!stat.isSymbolicLink(), `Symlink rejected: ${current}`);
  }
  assert.ok((await fs.lstat(current)).isFile(), `Not a regular file: ${current}`);
  return fs.readFile(current);
}

export async function ignoredOutput(relative) {
  assert.match(relative, /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/);
  assert.ok(relative.startsWith('output/rollback/') && !relative.endsWith('/'), 'Output must be under output/rollback/');
  assert.ok(relative.split('/').every(part => part && part !== '.' && part !== '..'), 'Unsafe output');
  assert.ok(!path.isAbsolute(relative), 'Relative output required');
  assert.ok(git('check-ignore', '--', `${relative}/manifest.json`).length, 'Output must be Git-ignored');
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try { assert.ok((await fs.lstat(current)).isDirectory(), `Not a regular directory: ${current}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return path.join(root, relative);
}

export async function sources({ sourceSHA = null, workingTreeTest = false, emailPatchReviewed = false }) {
  assert.ok(workingTreeTest !== Boolean(sourceSHA), 'Choose exactly one: full source SHA or working-tree test');
  const baseSHA = git('rev-parse', 'HEAD').toString().trim();
  if (sourceSHA) {
    assert.match(sourceSHA, /^[a-f0-9]{40}$/, 'An explicit full commit SHA is required; HEAD/short refs are rejected');
    assert.ok(!sourceSHA.startsWith(contract.forbiddenFallbackPrefix), 'd8a6a5a is never a fallback');
    assert.equal(git('rev-parse', '--verify', `${sourceSHA}^{commit}`).toString().trim(), sourceSHA);
    git('merge-base', '--is-ancestor', contract.approvedWebsiteSHA, sourceSHA);
    assert.equal(emailPatchReviewed, true, 'Wait for the parent email-patch review before pinning a versioned artifact');
  }
  const files = new Map();
  for (const file of [...contract.website, ...contract.backend].sort()) {
    const bytes = sourceSHA ? gitBytes(sourceSHA, file) : await regularFile(root, file);
    // Git bytes are canonical LF; tolerate checkout CRLF only for local test inputs.
    if (contract.website.includes(file)) {
      const approved = gitBytes(contract.approvedWebsiteSHA, file);
      const normalize = value => workingTreeTest && /\.(?:html|js|css|xml|svg)$/.test(file) ? value.toString().replace(/\r\n/g, '\n') : value;
      assert.deepEqual(normalize(bytes), normalize(approved), `Approved website changed: ${file}; requires a separately reviewed contract`);
    }
    files.set(file, bytes);
  }
  return { sourceSHA, baseSHA: sourceSHA ? null : baseSHA, workingTreeTest, emailPatchReviewed, files };
}

export function packaged(source) {
  const files = new Map();
  const entries = [];
  for (const [file, bytes] of source.files) {
    const artifactPath = contract.website.includes(file) ? `website/${file}` : `backend/${path.basename(file)}`;
    let output = bytes;
    if (file === 'assets/lead-config.js') {
      const text = bytes.toString();
      assert.equal((text.match(/endpoint:\s*'[^']*'/g) || []).length, 1);
      assert.ok(text.includes(`endpoint: '${contract.trackedEndpoint}'`), 'Tracked production endpoint must remain unchanged');
      assert.match(text, /requestTimeoutMs:\s*25000\b/);
      output = Buffer.from(text.replace(`endpoint: '${contract.trackedEndpoint}'`, "endpoint: ''"));
    }
    files.set(artifactPath, output);
    entries.push({ sourcePath: file, sourceSHA256: hash(bytes), artifactPath, artifactSHA256: hash(output), bytes: output.length,
      transformation: file === 'assets/lead-config.js' ? 'disable-endpoint-only' : 'exact-copy' });
  }
  const manifest = {
    schemaVersion: contract.schemaVersion,
    purpose: 'OFFLINE_UNBOUND_BOOKING_FALLBACK',
    sourceSHA: source.sourceSHA, workingTreeTest: source.workingTreeTest, baseSHA: source.baseSHA,
    emailPatchReviewed: source.emailPatchReviewed,
    approvedWebsiteSHA: contract.approvedWebsiteSHA,
    contractSHA256: hash(json(contract)),
    endpoint: { mode: 'disabled', value: '', releaseBinding: 'NOT_IMPLEMENTED_REQUIRES_SEPARATE_EXPLICIT_AUTHORIZATION' },
    productionReady: false,
    files: entries,
    payloadSHA256: hash(json(entries.map(({ artifactPath, artifactSHA256 }) => ({ artifactPath, artifactSHA256 }))))
  };
  files.set('manifest.json', Buffer.from(json(manifest)));
  files.set('manifest.sha256', Buffer.from(`${hash(files.get('manifest.json'))}  manifest.json\n`));
  return { manifest, files };
}

export async function inventory(base, prefix = '') {
  const files = [];
  for (const entry of await fs.readdir(path.join(base, prefix), { withFileTypes: true })) {
    const file = prefix ? `${prefix}/${entry.name}` : entry.name;
    assert.ok(!entry.isSymbolicLink(), `Symlink rejected: ${file}`);
    if (entry.isDirectory()) {
      const nested = await inventory(base, file);
      assert.ok(nested.length, `Unexpected empty directory: ${file}`);
      files.push(...nested);
    } else { assert.ok(entry.isFile(), `Not a regular file: ${file}`); files.push(file); }
  }
  return files.sort();
}
