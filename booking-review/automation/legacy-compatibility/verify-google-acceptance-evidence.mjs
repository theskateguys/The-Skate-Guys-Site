// Offline consistency check of recorded evidence, not a new Google verification.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read = name => JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));
const v1 = read('CLEAN_LEGACY_VERSION1_ACCEPTANCE.json');
const v2 = read('LEGACY_DUPLICATE_ISOLATION_ACCEPTANCE.json');
assert.equal(v1.requestCount, 39);
assert.equal(v1.fixtureRemovals, 9);
assert.equal(v1.productionVerified, false);
assert.equal(v1.backup.properties.TSG_AUTOMATIC_REMINDERS_ENABLED, 'false');
assert.deepEqual(v1.backup.triggers, []);
assert.equal(v1.steps.filter(step => step.response).length, 39);
assert.ok(v1.steps.every(step => step.readbackPassed));
for (const step of v1.steps.filter(step => step.response)) {
  assert.equal(step.response.pass, true);
  assert.equal(step.response.json.ok, true);
  assert.equal(step.response.json.leadId, step.leadId);
}
assert.equal(v2.deployment.version, 2);
assert.equal(v2.deployment.projectId, '1PwInosoMgf7Cp0mHH97SlAQ1j1BnJqs2ycis75awxIkBiAS6CPWWh7dU');
assert.equal(v2.deployment.sheetId, '1jt4AZNBfIv0SOwWzalfMRiTdqdjzpWn6--g91db11e8');
assert.equal(v2.deployment.immutableVerified, true);
assert.equal(v2.finalSettings.reminders, 'false');
assert.equal(v2.finalSettings.triggers, 0);
assert.equal(v2.websiteTimeoutMs, 25000);
assert.equal(v2.productionChanged, false);
assert.equal(v2.nativeMainMatrixPassed, true);
assert.equal(v2.focusedRecoveryPassed, true);
const passed = v2.steps.filter(step => step.response?.pass);
const failed = v2.steps.filter(step => step.response && !step.response.pass);
assert.equal(passed.length, 39);
assert.equal(failed.length, 2, 'Initial timeout and health response must stay recorded as failures');
const ambiguity = passed.filter(step => step.case.startsWith('AMB'));
assert.equal(ambiguity.length, 8);
for (const step of passed) {
  assert.equal(step.readbackPassed, true);
  assert.equal(step.response.httpStatus, 200);
  assert.equal(step.response.corsType, 'cors');
  assert.equal(step.network.filter(line => /\[POST\]/.test(line)).length, 1);
  assert.ok(step.network.every(line => !line.includes('user_content_key=')));
  if (step.case.startsWith('AMB')) {
    assert.equal(step.response.json.ok, false);
    assert.match(step.response.json.error, /^Ambiguous target Lead ID in /);
    assert.deepEqual(step.targetRowsAfter, step.targetRowsBefore);
    assert.deepEqual(step.afterCounts, step.beforeCounts);
  } else {
    assert.equal(step.response.json.ok, true);
    assert.equal(step.response.json.leadId, step.leadId);
  }
}
assert.ok(v2.latency.nativeOver25000 > 0);
assert.equal(v2.productionDecision, 'NO_GO');
assert.equal(v2.emailBearingGoogleCaseRun, false);
for (const [tab, data] of Object.entries(v2.final)) {
  assert.equal(data.rows.length, tab === 'Email Subscribers' ? 2 : 16);
  assert.ok(data.rows.every(row => row.cells.Email === ''));
  const ids = new Map();
  for (const row of data.rows) ids.set(row.cells['Lead ID'], (ids.get(row.cells['Lead ID']) || 0) + 1);
  assert.equal([...ids.values()].filter(count => count > 1).length, 1);
  assert.ok([...ids.values()].every(count => count === 1 || count === 2));
}
const source = readFileSync(new URL('Code.gs', import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
assert.equal(createHash('sha256').update(source).digest('hex'), v2.deployment.sourceSHA256LF);
console.log('PASS recorded-artifact consistency only: V1 39 requests; V2 39 native contract passes plus 2 retained failed attempts; four intentional duplicate groups, no unexpected duplicates. No network or fresh Google verification.');
