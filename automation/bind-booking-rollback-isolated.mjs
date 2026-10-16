import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { bindingOutput, isolatedPackage, writeFresh } from './rollback/binding.mjs';

export async function bind({ out, endpoint } = {}) {
  const destination = await bindingOutput(out);
  const expected = await isolatedPackage({ endpoint });
  await writeFresh(destination, expected.files);
  return { destination, manifest: expected.manifest };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { out: { type: 'string' } } });
  const result = await bind({ out: values.out });
  console.log(`ISOLATED_ONLY: ${result.destination}\nproductionReady=false; remote settings NOT verified; parent read verification required before retry.`);
}
