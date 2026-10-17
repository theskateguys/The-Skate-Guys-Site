import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {auditLiveLeadIntegrity} from './audit-live-lead-integrity.mjs';

const row = (rowNumber, leadId, leadType = '', status = 'New Lead', hasData = true) =>
  ({rowNumber, leadId, leadType, status, hasData});
const input = () => ({spreadsheetId: 'PRIVATE-SHEET', readAt: 'PRIVATE-METADATA', tabs: [
  {name: 'Leads', headers: ['Lead ID', 'Lead Type', 'Status'], rows: [
    row(2, ' PRIVATE-BOOKING ', 'booking'), row(3, 'PRIVATE-BOOKING', ' booking ', ' Paid '),
    row(4, 'PRIVATE-EMAIL', 'email'), row(5, '', '', '', true), row(6, 'PRIVATE-UNKNOWN', 'other')]},
  {name: 'Bookings', headers: ['Status', 'Lead ID'], rows: [
    row(2, 'PRIVATE-BOOKING'), row(3, 'PRIVATE-ORPHAN'), row(4, 'PRIVATE-BOOKING', '', 'Paid')]},
  {name: 'Follow Up Status', headers: ['Lead ID', 'Status'], rows: [
    row(2, 'PRIVATE-BOOKING'), row(3, 'PRIVATE-BOOKING', '', 'Paid')]},
  {name: 'Email Subscribers', headers: ['Lead ID', 'Status'], rows: [
    row(2, 'PRIVATE-EMAIL'), row(3, 'PRIVATE-EMAIL')]}
]});

const source = input();
const before = JSON.stringify(source);
const audit = auditLiveLeadIntegrity(source);
assert.equal(JSON.stringify(source), before, 'Pure audit does not mutate input');
assert.deepEqual(audit, auditLiveLeadIntegrity(source), 'Deterministic report');
assert.equal(audit.counts.duplicateGroups, 2);
assert.equal(audit.counts.extraRows, 4);
for (const tab of ['Leads', 'Bookings', 'FollowUp', 'Subscribers']) {
  assert.equal(audit.counts.tabs[tab].duplicateGroups, 1);
  assert.equal(audit.counts.tabs[tab].extraRows, 1);
}
assert.equal(audit.counts.missingCompanionRows, 2);
assert.deepEqual(audit.missingCompanions[0].missingTabs, ['Leads', 'FollowUp']);
assert.equal(audit.orphanGroups.length, 1);
assert.equal(audit.statusConflicts.length, 1);
assert.equal(audit.statusConflicts[0].rows.length, 6, 'Includes mixed-status duplicates from all three tabs');
assert.equal(audit.blankIdRows.length, 1);
assert.deepEqual(audit.unknownLeadTypeRows, [{tab: 'Leads', rowNumber: 5}, {tab: 'Leads', rowNumber: 6}]);
assert.ok(!JSON.stringify(audit).includes('PRIVATE'));
assert.equal(audit.complete, true, 'Canonical headers remain accepted');

// Use the candidate definitions as a local-only oracle for every known spelling.
const definitions = runInNewContext(`${readFileSync(new URL('./legacy-compatibility/Code.gs', import.meta.url), 'utf8')}
  Object.values(TSG_SHEETS).map(definition => ({name: definition.name, headers: definition.headers}));`);
for (const definition of definitions) {
  const canonical = input();
  const tab = canonical.tabs.find(item => item.name === definition.name);
  tab.headers = [...definition.headers];
  assert.equal(auditLiveLeadIntegrity(canonical).complete, true, definition.name);
  for (let column = 0; column < tab.headers.length; column++) {
    const original = tab.headers[column];
    tab.headers[column] = original.toLowerCase();
    const result = auditLiveLeadIntegrity(canonical);
    assert.equal(result.complete, false, `${definition.name}: ${original}`);
    assert.ok(result.issues.some(issue => issue.code === 'noncanonicalHeader' && issue.column === column + 1));
    tab.headers[column] = original;
  }
}
for (const extra of ['status', ' Status ', 'Notes', ' notes ', '', ' \t ',
  'PRIVATE-CUSTOM@example.test', ' PRIVATE-WHITESPACE@example.test ']) {
  const headers = input();
  headers.tabs[0].headers.push('Notes');
  if (extra === 'PRIVATE-CUSTOM@example.test') headers.tabs[0].headers.push(extra.toLowerCase());
  headers.tabs[0].headers.push(extra);
  const result = auditLiveLeadIntegrity(headers);
  assert.equal(result.complete, false, `Reject unsafe extra header: ${extra}`);
  assert.ok(result.issues.some(issue => ['emptyHeader', 'canonicalHeaderCollision', 'noncanonicalHeader'].includes(issue.code)));
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  assert.ok(!JSON.stringify(result).includes('@'));
}
const custom = input();
custom.tabs[0].headers.push('PRIVATE-CUSTOM@example.test', 'Notes');
assert.deepEqual(auditLiveLeadIntegrity(custom), audit, 'Unique trimmed custom headers do not alter canonical report');
const idCollision = input();
idCollision.tabs[1].headers.push(' lead id ');
const collided = auditLiveLeadIntegrity(idCollision);
assert.equal(collided.complete, false);
assert.equal(collided.counts.tabs.Bookings.uniqueIDs, null, 'Canonical ID collision is unreadable');
assert.ok(collided.missingCompanions.some(group => group.uncheckedTabs.includes('Bookings')));
const statusCollision = input();
statusCollision.tabs[0].headers.push('status');
assert.ok(auditLiveLeadIntegrity(statusCollision).statusConflicts.every(group =>
  group.rows.every(item => item.tab !== 'Leads')), 'Colliding status columns are not interpreted');

const missing = input();
missing.tabs[1].headers = ['Lead ID', 'Lead ID', 'Status'];
const unsafe = auditLiveLeadIntegrity(missing);
assert.equal(unsafe.complete, false);
assert.equal(unsafe.counts.tabs.Bookings.uniqueIDs, null);
assert.ok(unsafe.issues.some(issue => issue.code === 'ambiguousHeader'));
assert.ok(unsafe.missingCompanions.every(group => !group.missingTabs.includes('Bookings')));
assert.ok(unsafe.missingCompanions.some(group => group.uncheckedTabs.includes('Bookings')));

const exact = input();
exact.tabs[0].headers = [' lead id ', 'Lead Type', 'Status'];
assert.ok(auditLiveLeadIntegrity(exact).issues.some(issue => issue.header === 'Lead ID'));
const secret = input();
secret.tabs[0].rows[0].status = 'private-contact@example.test';
secret.tabs[0].rows[1].status = 'another-private-contact@example.test';
const sanitized = JSON.stringify(auditLiveLeadIntegrity(secret));
assert.ok(!sanitized.includes('@'));
assert.ok(sanitized.includes('unknownStatus1'));
assert.ok(sanitized.includes('unknownStatus2'));

const normalized = input();
for (const tab of normalized.tabs) for (const item of tab.rows) item.status = ' new lead ';
assert.equal(auditLiveLeadIntegrity(normalized).statusConflicts.length, 0);
const unavailable = input();
unavailable.tabs = unavailable.tabs.filter(tab => tab.name !== 'Leads');
assert.equal(auditLiveLeadIntegrity(unavailable).orphanGroups.length, 0);
const aliases = input();
aliases.ranges = aliases.tabs;
delete aliases.tabs;
assert.deepEqual(auditLiveLeadIntegrity(aliases), audit);
const bad = input();
bad.tabs[0].rows.push(row(2, 'PRIVATE-DUPLICATE-REFERENCE'));
assert.equal(auditLiveLeadIntegrity(bad).complete, false);

const loneBooking = input();
loneBooking.tabs.forEach(tab => { tab.rows = []; });
loneBooking.tabs[0].rows = [row(2, 'PRIVATE-LONE', 'booking')];
assert.deepEqual(auditLiveLeadIntegrity(loneBooking).missingCompanions[0].missingTabs, ['Bookings', 'FollowUp']);
loneBooking.tabs[0].rows[0].leadType = 'email';
assert.equal(auditLiveLeadIntegrity(loneBooking).missingCompanions.length, 0);
loneBooking.tabs[0].rows[0].leadType = 'unknown';
assert.equal(auditLiveLeadIntegrity(loneBooking).missingCompanions.length, 0);
loneBooking.tabs[1].rows = [row(2, 'PRIVATE-LONE')];
assert.deepEqual(auditLiveLeadIntegrity(loneBooking).missingCompanions[0].missingTabs, ['FollowUp']);
loneBooking.tabs[0].headers = ['Lead ID', 'Status'];
assert.ok(auditLiveLeadIntegrity(loneBooking).issues.some(issue => issue.header === 'Lead Type'));
loneBooking.tabs[0].rows.push(row(3, '', '', '', false));
assert.equal(auditLiveLeadIntegrity(loneBooking).blankIdRows.length, 0);
const duplicateTab = input();
duplicateTab.tabs.push({...duplicateTab.tabs[1]});
assert.ok(auditLiveLeadIntegrity(duplicateTab).issues.some(issue => issue.code === 'ambiguousTab'));
const hostile = input();
hostile.tabs.push({name: 'private-contact@example.test', headers: ['PRIVATE'], rows: []});
hostile.tabs[0].headers = ['private-contact@example.test'];
assert.ok(!JSON.stringify(auditLiveLeadIntegrity(hostile)).includes('private-contact'));

const cli = spawnSync(process.execPath, [new URL('./audit-live-lead-integrity.mjs', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''),
  'PRIVATE-NONEXISTENT-INPUT.json'], {encoding: 'utf8'});
assert.equal(cli.status, 1);
assert.equal(cli.stdout, '');
assert.ok(!cli.stderr.includes('PRIVATE'));
console.log('PASS: fabricated offline integrity audit, header safety, sanitization, purity, and CLI error tests');
