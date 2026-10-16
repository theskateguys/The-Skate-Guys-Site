import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { ignoredOutput, inventory, packaged, regularFile, root, sources } from './rollback/lib.mjs';

export async function check({ artifact, sourceSHA, workingTreeTest = false, regressions = false }) {
  const destination = await ignoredOutput(artifact);
  const source = await sources({ sourceSHA, workingTreeTest, emailPatchReviewed: !workingTreeTest });
  const expected = packaged(source);
  assert.deepEqual(await inventory(destination), [...expected.files.keys()].sort(), 'Artifact allowlist mismatch');
  for (const [file, bytes] of expected.files) {
    assert.deepEqual(await regularFile(destination, file), bytes, `Artifact/source or manifest mismatch: ${file}`);
  }
  if (regressions) {
    // Private temporary verification tree, never inside the website publish directory.
    const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'tsg-rollback-check-'));
    try {
      await fs.cp(path.join(destination, 'website'), sandbox, { recursive: true });
      const backend = path.join(sandbox, 'automation/google-apps-script');
      await fs.mkdir(backend, { recursive: true });
      for (const file of ['Code.gs', 'EmailLogo.gs']) await fs.copyFile(path.join(destination, 'backend', file), path.join(backend, file));
      for (const file of ['check-booking-system.mjs', 'check-lead-flow.mjs', 'check-whatsapp-links.mjs']) {
        const target = path.join(sandbox, 'automation', file);
        await fs.copyFile(path.join(root, 'automation', file), target);
        console.log(execFileSync(process.execPath, [target], { cwd: sandbox, encoding: 'utf8' }).trim());
      }
    } finally {
      const resolved = await fs.realpath(sandbox);
      assert.equal(path.dirname(resolved), await fs.realpath(os.tmpdir()));
      assert.ok(path.basename(resolved).startsWith('tsg-rollback-check-'));
      await fs.rm(resolved, { recursive: true, force: true });
    }
  }
  console.log(`PASS: exact offline snapshot, approved website, 25000ms config, hashes and publish allowlist (${expected.manifest.files.length} files). No Google save, email or production verification.`);
  return expected.manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: {
    artifact: { type: 'string' }, source: { type: 'string' },
    'working-tree-test': { type: 'boolean', default: false }, regressions: { type: 'boolean', default: false }
  } });
  await check({ artifact: values.artifact, sourceSHA: values.source,
    workingTreeTest: values['working-tree-test'], regressions: values.regressions });
}
