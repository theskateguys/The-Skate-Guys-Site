// Local file packaging only. No network, Git writes, deployment, or live endpoint binding.
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { ignoredOutput, packaged, sources } from './rollback/lib.mjs';

export async function build(options) {
  const artifact = packaged(await sources(options));
  const destination = await ignoredOutput(options.out);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.mkdir(destination); // Never overwrite or delete a previous artifact.
  for (const [file, bytes] of artifact.files) {
    const target = path.join(destination, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes, { flag: 'wx' });
  }
  return { destination, manifest: artifact.manifest };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: {
    source: { type: 'string' }, out: { type: 'string' },
    'working-tree-test': { type: 'boolean', default: false },
    'email-patch-reviewed': { type: 'boolean', default: false }
  } });
  const result = await build({ sourceSHA: values.source, out: values.out,
    workingTreeTest: values['working-tree-test'], emailPatchReviewed: values['email-patch-reviewed'] });
  console.log(`OFFLINE ONLY: ${result.destination}\nsourceSHA=${result.manifest.sourceSHA}; productionReady=false`);
}
