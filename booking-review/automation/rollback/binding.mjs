// Local-only derivative of one immutable offline template. No network operations.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { git, hash, ignoredOutput, inventory, json, packaged, regularFile, root, sources } from './lib.mjs';

export const SOURCE_SHA = '02639f8c7e0361b72d1a19d03bf5fc6579ca2839';
export const TEMPLATE = `output/rollback/${SOURCE_SHA}`;
export const TEMPLATE_MANIFEST_SHA256 = '95f5880b2f9a7a882c73cdf92a2a646135da0471969449f77f411643727bb0e2';
export const ENDPOINT = 'https://script.google.com/macros/s/AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g/exec';
export const IDENTITY = Object.freeze({
  endpoint: ENDPOINT,
  copiedSheetId: '1CuA0uWDnUu-EK0XseYxNNpEK4lX5SZ7S5UuTdy-HCyM',
  projectId: '1qXXCOqzdedWiuwjdR1bcJHp7T517fbXUlFl_s9NVfNKlytGmNpWrVKU9',
  deploymentId: ENDPOINT.split('/')[5],
  version: 2,
  contract: 'strict-v2'
});
export const CONFIG = 'website/assets/lead-config.js';

export function exactEndpoint(endpoint) {
  assert.equal(endpoint, ENDPOINT, 'Only the exact allowlisted isolated strict-v2 endpoint is permitted');
  const url = new URL(endpoint);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'script.google.com');
  return endpoint;
}

export async function bindingOutput(relative) {
  assert.equal(typeof relative, 'string', 'Explicit isolated output path required');
  assert.match(relative, /^output\/rollback\/isolated-[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Use a fresh output/rollback/isolated-* directory');
  return ignoredOutput(relative);
}

export async function privateFixture(relative) {
  assert.equal(typeof relative, 'string');
  assert.match(relative, /^output\/acceptance\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/, 'Explicit ignored acceptance JSON fixture required');
  assert.ok(git('check-ignore', '--', relative).length, 'Private fixture must be ignored');
  // regularFile rejects symlinks at every component, including output/acceptance.
  return regularFile(root, relative);
}

export async function verifyFiles(base, expected) {
  assert.deepEqual(await inventory(base), [...expected.keys()].sort(), 'Artifact allowlist mismatch');
  for (const [file, bytes] of expected) {
    assert.equal(hash(await regularFile(base, file)), hash(bytes), `Artifact/source or manifest hash mismatch: ${file}`);
  }
}

let reconstruction;
export async function verifiedTemplate() {
  // Cache immutable Git reconstruction only; re-read and verify the template on every call.
  reconstruction ??= sources({ sourceSHA: SOURCE_SHA, emailPatchReviewed: true }).then(packaged);
  const expected = await reconstruction;
  assert.equal(hash(expected.files.get('manifest.json')), TEMPLATE_MANIFEST_SHA256, 'Pinned reconstruction changed');
  assert.equal(expected.manifest.files.length, 43, 'Pinned payload count changed');
  await verifyFiles(await ignoredOutput(TEMPLATE), expected.files);
  return expected;
}

export async function isolatedPackage({ endpoint = ENDPOINT } = {}) {
  exactEndpoint(endpoint);
  const template = await verifiedTemplate();
  const files = new Map(template.files);
  const config = files.get(CONFIG).toString('utf8');
  assert.equal((config.match(/endpoint: ''/g) || []).length, 1);
  assert.match(config, /requestTimeoutMs: 25000\b/);
  files.set(CONFIG, Buffer.from(config.replace("endpoint: ''", `endpoint: '${endpoint}'`)));
  const entries = template.manifest.files.map(entry => ({
    sourcePath: entry.sourcePath,
    sourceSHA256: entry.sourceSHA256,
    artifactPath: entry.artifactPath,
    templateSHA256: entry.artifactSHA256,
    boundSHA256: hash(files.get(entry.artifactPath)),
    bytes: files.get(entry.artifactPath).length,
    transformation: entry.artifactPath === CONFIG ? 'bind-allowlisted-isolated-endpoint-only' : 'exact-copy'
  }));
  const manifest = {
    schemaVersion: 1,
    purpose: 'ISOLATED_ONLY',
    productionReady: false,
    sourceSHA: SOURCE_SHA,
    template: { artifact: TEMPLATE, manifestSHA256: TEMPLATE_MANIFEST_SHA256, payloadSHA256: template.manifest.payloadSHA256 },
    binding: { ...IDENTITY },
    requestTimeoutMs: 25000,
    automaticReminders: {
      requiredEnabledValue: false,
      verification: 'PARENT_READ_VERIFICATION_REQUIRED',
      operatorAttestation: 'Before retry, parent must read back exact deployed version/project, copied Sheet property, reminders=false and zero reminder triggers. Local hashes do not prove remote settings.',
      automatedProof: false
    },
    retryGate: 'Parent owns private fixture and must verify one existing complete labelled record, unchanged payload/Lead ID/timestamp, Sheet and inbox baseline; duplicate_ignored only. No fresh submission authorized.',
    files: entries,
    payloadSHA256: hash(json(entries.map(({ artifactPath, boundSHA256 }) => ({ artifactPath, boundSHA256 }))))
  };
  files.set('manifest.json', Buffer.from(json(manifest)));
  files.set('manifest.sha256', Buffer.from(`${hash(files.get('manifest.json'))}  manifest.json\n`));
  return { manifest, files };
}

export async function writeFresh(destination, files) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.mkdir(destination); // Existing artifacts, including the template, are never overwritten.
  for (const [file, bytes] of files) {
    const target = path.join(destination, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes, { flag: 'wx' });
  }
}

export function publicIdentity(manifest) {
  return {
    mode: 'isolated-rollback-binding', purpose: manifest.purpose, productionReady: false,
    sourceSHA: SOURCE_SHA, templateManifestSHA256: TEMPLATE_MANIFEST_SHA256,
    boundManifestSHA256: hash(json(manifest)), payloadSHA256: manifest.payloadSHA256,
    ...manifest.binding, requestTimeoutMs: 25000,
    automaticReminders: manifest.automaticReminders,
    retryGate: manifest.retryGate
  };
}
