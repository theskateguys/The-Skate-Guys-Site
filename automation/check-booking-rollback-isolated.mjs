import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { bindingOutput, isolatedPackage, verifyFiles } from './rollback/binding.mjs';

export async function checkIsolated({ artifact } = {}) {
  const destination = await bindingOutput(artifact);
  const expected = await isolatedPackage();
  await verifyFiles(destination, expected.files);
  return expected.manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { artifact: { type: 'string' } } });
  const manifest = await checkIsolated({ artifact: values.artifact });
  console.log(`PASS: ${manifest.files.length} reconstructed files; only config endpoint bound; template immutable; productionReady=false. Local integrity only, NOT Google/Sheet/inbox verification.`);
}
