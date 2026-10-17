import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const TABS = ['Leads', 'Bookings', 'FollowUp', 'Subscribers'];
// Match the per-tab spellings in legacy-compatibility/Code.gs, without requiring
// optional backend columns to be present in the caller's audit projection.
const CANONICAL_HEADERS = {
  Leads: ['Timestamp', 'Lead ID', 'Name', 'WhatsApp', 'Email', 'Location', 'Adult/Child',
    'Package', 'Rentals Needed', 'Preferred Time', 'Source Page', 'UTM Source',
    'UTM Campaign', 'Marketing Consent', 'WhatsApp Opened', 'Status', 'Notes', 'Tags',
    'Lead Type', 'UTM Medium', 'Referrer', 'Legacy Review Required'],
  Bookings: ['Timestamp', 'Lead ID', 'Name', 'WhatsApp', 'Email', 'Location', 'Adult/Child',
    'Package', 'Rentals Needed', 'Preferred Time', 'Source Page', 'Marketing Consent',
    'WhatsApp Opened', 'Status', 'Tags', 'Notes', 'Legacy Review Required'],
  FollowUp: ['Lead ID', 'Email', 'Name', 'WhatsApp', 'Lead Type', 'Status',
    'First Follow Up Due', 'Reminder Due', 'Weekly Update Eligible', 'Last Contacted',
    'Notes', 'Legacy Review Required'],
  Subscribers: ['Timestamp', 'Lead ID', 'Email', 'Name', 'Location', 'Source Page',
    'Tags', 'Marketing Consent', 'Status', 'Last Updated']
};
const NAMES = new Map([
  ['Leads', 'Leads'], ['Bookings', 'Bookings'], ['FollowUp', 'FollowUp'],
  ['Follow Up Status', 'FollowUp'], ['Subscribers', 'Subscribers'],
  ['Email Subscribers', 'Subscribers']
]);
const STATUS_NAMES = ['New Lead', 'WhatsApp Opened', 'Replied', 'Confirmed', 'Paid',
  'No Response', 'Follow Up Needed', 'Subscribed', 'Unsubscribed', 'Active', 'Inactive'];
const text = value => typeof value === 'string' ? value.trim() : '';
const normalized = value => text(value).toLowerCase();
const refs = rows => Object.fromEntries(TABS.map(tab => [tab,
  rows.filter(row => row.tab === tab).map(row => row.rowNumber).sort((a, b) => a - b)
]).filter(([, numbers]) => numbers.length));

/**
 * Pure, offline audit. Input: {spreadsheetId?, readAt?, tabs (or ranges):
 * [{name, headers: string[], rows: [{rowNumber, leadId, leadType?, status, hasData?}]}]}.
 * Headers must be nonempty, trimmed, canonically unique labels; known backend
 * labels must use the exact per-tab spelling.
 * Rows are already shaped by the caller; this function never infers cell offsets.
 * Metadata and arbitrary cell values are deliberately excluded from the report.
 */
export function auditLiveLeadIntegrity(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid audit input');
  }
  const sources = input.tabs ?? input.ranges;
  if (!Array.isArray(sources)) throw new Error('Expected tabs or ranges array');
  const issues = [];
  const states = new Map();
  const allRows = [];
  const blankIdRows = [];
  const unknownLeadTypeRows = [];
  const invalidTypeRows = [];
  const unknownStatuses = new Map();
  const statusLabel = value => {
    const key = normalized(value);
    if (!key) return 'blank';
    const known = STATUS_NAMES.find(name => normalized(name) === key);
    if (known) return known;
    if (!unknownStatuses.has(key)) unknownStatuses.set(key, `unknownStatus${unknownStatuses.size + 1}`);
    return unknownStatuses.get(key);
  };

  for (const tab of TABS) {
    const matches = sources.filter(source => NAMES.get(source?.name) === tab);
    const state = {idReadable: false, statusReadable: false, typeReadable: false, rows: []};
    states.set(tab, state);
    if (matches.length !== 1) {
      issues.push({tab, code: matches.length ? 'ambiguousTab' : 'missingTab'});
      continue;
    }
    const source = matches[0];
    if (!Array.isArray(source.headers) || !source.headers.every(header => typeof header === 'string')) {
      issues.push({tab, code: 'invalidHeaders'});
      continue;
    }
    const seenHeaders = new Set();
    source.headers.forEach((header, index) => {
      const key = normalized(header);
      const canonical = CANONICAL_HEADERS[tab].find(value => normalized(value) === key);
      const column = index + 1;
      if (!key) issues.push({tab, code: 'emptyHeader', column});
      if (key && seenHeaders.has(key)) issues.push({tab, code: 'canonicalHeaderCollision', column});
      if (header !== header.trim() || (canonical && header !== canonical)) {
        issues.push({tab, code: 'noncanonicalHeader', column});
      }
      seenHeaders.add(key);
    });
    for (const [field, header] of [['idReadable', 'Lead ID'], ['statusReadable', 'Status'],
      ...(tab === 'Leads' ? [['typeReadable', 'Lead Type']] : [])]) {
      const count = source.headers.filter(value => value === header).length;
      state[field] = count === 1 && source.headers.filter(value => normalized(value) === normalized(header)).length === 1;
      if (count !== 1) issues.push({tab, code: count ? 'ambiguousHeader' : 'missingHeader', header});
    }
    if (!Array.isArray(source.rows)) {
      state.idReadable = false;
      issues.push({tab, code: 'invalidRows'});
      continue;
    }
    const rowNumbers = new Set();
    for (const item of source.rows) {
      if (!item || !Number.isSafeInteger(item.rowNumber) || item.rowNumber < 2 || rowNumbers.has(item.rowNumber)) {
        issues.push({tab, code: 'invalidOrRepeatedRowReference'});
        state.idReadable = false;
        continue;
      }
      rowNumbers.add(item.rowNumber);
      const populated = item.hasData === true || [item.leadId, item.leadType, item.status].some(value =>
        value !== undefined && value !== null && value !== '');
      if (!populated) continue;
      const row = {tab, rowNumber: item.rowNumber, id: text(item.leadId),
        type: state.typeReadable ? normalized(item.leadType) : '',
        status: state.statusReadable ? normalized(item.status) : null};
      state.rows.push(row);
      if (state.idReadable && !row.id) blankIdRows.push({tab, rowNumber: row.rowNumber,
        code: typeof item.leadId === 'string' || item.leadId == null ? 'blankIdPopulatedRow' : 'invalidIdType'});
      if (state.statusReadable && item.status != null && typeof item.status !== 'string') {
        row.status = null;
        invalidTypeRows.push({tab, rowNumber: row.rowNumber, field: 'Status'});
      }
      if (tab === 'Leads' && !['booking', 'email'].includes(row.type)) {
        unknownLeadTypeRows.push({tab, rowNumber: row.rowNumber});
      }
    }
    state.rows.sort((a, b) => a.rowNumber - b.rowNumber);
    if (state.idReadable) allRows.push(...state.rows.filter(row => row.id));
  }

  const groups = new Map();
  for (const row of allRows) {
    if (!groups.has(row.id)) groups.set(row.id, []);
    groups.get(row.id).push(row);
  }
  const duplicateGroups = [];
  const missingCompanions = [];
  const orphanGroups = [];
  const statusConflicts = [];
  const ambiguousLeadTypes = [];
  const unknownStatusRows = [];
  let groupIndex = 0;
  for (const rows of groups.values()) {
    const group = `leadGroup${++groupIndex}`;
    const duplicates = TABS.filter(tab => rows.filter(row => row.tab === tab).length > 1);
    if (duplicates.length) duplicateGroups.push({group: `duplicateGroup${duplicateGroups.length + 1}`,
      leadGroup: group, rowsByTab: refs(rows.filter(row => duplicates.includes(row.tab)))});
    const leads = rows.filter(row => row.tab === 'Leads');
    const children = rows.filter(row => row.tab !== 'Leads');
    if (!leads.length && children.length && states.get('Leads').idReadable) {
      orphanGroups.push({group, rowsByTab: refs(children)});
    }
    const types = new Set(leads.map(row => row.type));
    if (types.size > 1) ambiguousLeadTypes.push({group, rowsByTab: refs(leads)});
    const bookingExpected = types.has('booking') || rows.some(row => ['Bookings', 'FollowUp'].includes(row.tab));
    if (bookingExpected) {
      const missingTabs = ['Leads', 'Bookings', 'FollowUp'].filter(tab =>
        states.get(tab).idReadable && !rows.some(row => row.tab === tab));
      const uncheckedTabs = ['Leads', 'Bookings', 'FollowUp'].filter(tab => !states.get(tab).idReadable);
      if (missingTabs.length || uncheckedTabs.length) missingCompanions.push({group,
        rowsByTab: refs(rows), missingTabs, uncheckedTabs});
    }
    const statusRows = rows.filter(row => row.tab !== 'Subscribers' && row.status !== null);
    const statuses = statusRows.map(row => ({tab: row.tab, rowNumber: row.rowNumber, status: statusLabel(row.status)}));
    unknownStatusRows.push(...statuses.filter(row => row.status.startsWith('unknownStatus')));
    if (new Set(statusRows.map(row => row.status)).size > 1) statusConflicts.push({group, rows: statuses});
  }
  const tabs = Object.fromEntries(TABS.map(tab => {
    const state = states.get(tab);
    const counts = new Map();
    if (state.idReadable) for (const row of state.rows.filter(row => row.id)) counts.set(row.id, (counts.get(row.id) ?? 0) + 1);
    return [tab, {rows: state.rows.length, uniqueIDs: state.idReadable ? counts.size : null,
      duplicateGroups: state.idReadable ? [...counts.values()].filter(count => count > 1).length : null,
      extraRows: state.idReadable ? [...counts.values()].reduce((sum, count) => sum + count - 1, 0) : null}];
  }));
  return {schemaVersion: 1, complete: issues.length === 0 && invalidTypeRows.length === 0,
    notes: ['Local read-only audit; no production writes performed.',
      'Atomic snapshot not guaranteed; tabs may have been read at different times.',
      'Counts cover supplied populated rows only; source completeness is caller-owned.',
      'Email Leads and Subscribers alone do not require booking companions.',
      'Unknown status values are replaced with opaque labels; metadata is not echoed.',
      'Blank IDs cannot be matched; unknown Lead Type does not alone imply booking.'],
    counts: {tabs, uniqueIDs: groups.size, duplicateGroups: duplicateGroups.length,
      extraRows: Object.values(tabs).reduce((sum, tab) => sum + (tab.extraRows ?? 0), 0),
      missingCompanionRows: missingCompanions.reduce((sum, item) => sum + item.missingTabs.length, 0),
      orphanGroups: orphanGroups.length, statusConflictGroups: statusConflicts.length,
      blankIdPopulatedRows: blankIdRows.length},
    issues, duplicateGroups, missingCompanions, orphanGroups, statusConflicts,
    blankIdRows, unknownLeadTypeRows, ambiguousLeadTypes, invalidTypeRows, unknownStatusRows};
}

export function runCli(args = process.argv.slice(2)) {
  try {
    if (args.length < 1 || args.length > 2 || args[0].startsWith('-')) throw new Error('Invalid arguments');
    if (args[1] && resolve(args[0]) === resolve(args[1])) throw new Error('Input must not be overwritten');
    const result = `${JSON.stringify(auditLiveLeadIntegrity(JSON.parse(readFileSync(args[0], 'utf8'))), null, 2)}\n`;
    if (args[1]) writeFileSync(args[1], result, {encoding: 'utf8', flag: 'wx', mode: 0o600});
    else process.stdout.write(result);
    return 0;
  } catch {
    process.stderr.write('Audit failed. Check private input shape and local paths; no input details are reported.\n');
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = runCli();
}
