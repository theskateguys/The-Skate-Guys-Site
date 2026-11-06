// Prepare a runner only. Never reads the private payload, opens a browser or contacts Google.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { Script } from 'node:vm';
import { checkIsolated } from '../check-booking-rollback-isolated.mjs';
import { IDENTITY, SOURCE_SHA } from './binding.mjs';
import { git, hash, json, regularFile, root } from './lib.mjs';

const { values } = parseArgs({ options: { artifact: { type: 'string' } } });
const manifest = await checkIsolated({ artifact: values.artifact });
const previous = await regularFile(root, 'output/acceptance/run-email-acceptance.js');
assert.equal(hash(previous), 'f164fa3dab50ec4e27fc8f8ed1e0f4e989111e462e107e579bf016c20591e20b', 'Parent runner source changed; review adaptation before preparing');
let runner = previous.toString('utf8').replace(/\r\n/g, '\n');
const replace = (before, after) => {
  assert.equal(runner.split(before).length, 2, 'Runner adaptation anchor changed');
  runner = runner.replace(before, after);
};
replace('// Prepared only. Evaluating this expression returns a runner; invoking it can send ONE email.',
  '// Prepared only. Parent-authorized ONE unchanged blank-email duplicate retry; never invoke automatically.');
replace("const base = 'http://127.0.0.1:4192';", "const base = 'http://127.0.0.1:4196';");
replace("getJson('/output/optimized-acceptance-private.json')", "getJson('/isolated-retry-fixture.json')");
replace(`  assert(manifest.mode === 'optimized-candidate' && manifest.endpoint === endpoint &&
    manifest.expectedCandidateEndpoint === endpoint && manifest.requestTimeoutMs === 25000,
  'Exact isolated version2 manifest and 25s timeout required');`,
`  assert(manifest.mode === 'isolated-rollback-binding' && manifest.purpose === 'ISOLATED_ONLY' &&
    manifest.productionReady === false && manifest.endpoint === endpoint && manifest.requestTimeoutMs === 25000 &&
    manifest.sourceSHA === '${SOURCE_SHA}' && manifest.version === 2 && manifest.contract === 'strict-v2' &&
    manifest.copiedSheetId === '${IDENTITY.copiedSheetId}' && manifest.projectId === '${IDENTITY.projectId}' &&
    manifest.boundManifestSHA256 === '${hash(json(manifest))}',
  'Exact reconstructed isolated rollback identity and 25s timeout required');`);
replace('    fixture.approvedTransactionalEmail === true && fixture.automaticRemindersDisabled === true &&',
  '    fixture.approvedUnchangedRetry === true && fixture.automaticRemindersDisabled === true &&');
replace("  'Explicit isolated transactional-email approval and parent baseline verification required');",
`  'Explicit isolated unchanged-retry approval and parent baseline verification required');
  assert(fixture.leadId === 'TSG-OPTIMIZED-NOEMAIL-1792187088270' &&
    fixture.timestamp === '2026-10-16T21:44:48.270Z', 'Only the parent-verified existing record is permitted');`);
replace("  assert(['NewLead', 'duplicate_ignored'].includes(fixture.expectedStatus), 'Explicit expectedStatus required');",
  "  assert(fixture.expectedStatus === 'duplicate_ignored', 'Fresh submissions forbidden: duplicate_ignored only');");
replace("  const retry = fixture.expectedStatus === 'duplicate_ignored';", '  const retry = true;');
replace(`  assert(retry ? fixture.duplicateReadbackVerified === true : fixture.freshApproved === true,
    'Fresh approval or parent-verified Sheet/inbox readback required');`,
`  assert(fixture.duplicateReadbackVerified === true, 'Parent-verified unchanged Sheet/inbox readback required');`);
replace(`    p.name === 'TEST ONLY - Dylon optimized email acceptance' && p.email === 'redacted-contact@example.test' &&
    p.marketingConsent === 'No', 'Exact approved TEST ONLY identity, email and consent No required');`,
`    p.name === 'TEST ONLY - Dylon optimized blank-email acceptance' && p.email === '' &&
    p.marketingConsent === 'No' && p.sourcePage === 'book.html' &&
    p.utmSource === '' && p.utmCampaign === '' && p.utmMedium === '' && p.referrer === '',
    'Exact approved existing blank-email record and unchanged attribution required');`);
replace("const expectedNativeStatus = retry ? 'duplicate_ignored' : 'New Lead';", "const expectedNativeStatus = 'duplicate_ignored';");
replace("const screenshot = `output/acceptance/email-${retry ? 'retry' : 'fresh'}-status.png`;",
  "const screenshot = 'output/acceptance/rollback-isolated-blank-retry-status.png';");
replace('Parent must verify rows and inbox before authorizing unchanged retry.',
  'Parent must compare all rows/cell values, counts and zero-email reference baseline after this attempt. No automatic second attempt.');
new Script(`(${runner})`); // Syntax only; do not evaluate or invoke this email-capable browser harness.
const output = 'output/acceptance/run-rollback-isolated-blank-retry.js';
assert.ok(git('check-ignore', '--', output).length);
// Validate the existing parent directory without reading any private fixture.
const directory = path.dirname(path.join(root, output));
assert.ok((await fs.lstat(directory)).isDirectory());
assert.ok(!(await fs.lstat(path.join(root, 'output'))).isSymbolicLink());
await fs.writeFile(path.join(root, output), runner, { flag: 'wx' });
console.log(`PREPARED ONLY: ${output}; port 4196; fixture route opt-in required; no browser/Google invocation.`);
