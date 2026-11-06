// Offline reproduction only: no Google services, network, triggers, or real email.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const blob = '51ddd8f4f17318c3537544a1ab58ae51ede090dd:automation/google-apps-script/Code.gs';
const expectedHash = '8a66986cf87ce39024a929a34b1e4c710606ecbc58c7a354c233a15d44b82dd2';
const legacy = execFileSync('git', ['show', blob], {cwd: root, encoding: 'utf8'}).replace(/\r\n/g, '\n');
assert.equal(createHash('sha256').update(legacy).digest('hex'), expectedHash, 'Pinned LF source must match parent-provided production-source hash');
assert.equal(legacy.split('\n').length, 298, '298 split lines including terminal empty line');
const current = readFileSync(new URL('google-apps-script/Code.gs', import.meta.url), 'utf8');
const tabs = ['Leads', 'Bookings', 'Follow Up Status'];
const id = 'TSG-OFFLINE-LEGACY-RISK';

class Sheet {
  constructor(name) { this.name = name; this.rows = []; this.failAppend = false; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return Math.max(0, ...this.rows.map(row => row.length)); }
  getMaxRows() { return 1000; }
  getMaxColumns() { return 100; }
  getFilter() { return true; }
  setFrozenRows() {}
  appendRow(row) {
    if (this.failAppend) throw new Error(`MOCK append failure: ${this.name}`);
    this.rows.push([...row]);
  }
  getRange(row, column, height = 1, width = 1) {
    assert.ok(row > 0 && column > 0 && height > 0 && width > 0);
    const read = () => Array.from({length: height}, (_, r) => Array.from({length: width}, (_, c) => this.rows[row - 1 + r]?.[column - 1 + c] ?? ''));
    const write = values => values.forEach((cells, r) => cells.forEach((value, c) => {
      this.rows[row - 1 + r] ||= [];
      this.rows[row - 1 + r][column - 1 + c] = value;
    }));
    const range = {
      getValues: read, getDisplayValues: () => read().map(cells => cells.map(String)),
      getValue: () => read()[0][0], setValue: value => write([[value]]), setValues: write,
      setFontWeight: () => range, setBackground: () => range, setFontColor: () => range
    };
    return range;
  }
}

function harness(source) {
  const sheets = new Map();
  const emails = [];
  const spreadsheet = {
    getSheetByName: name => sheets.get(name),
    insertSheet: name => { const sheet = new Sheet(name); sheets.set(name, sheet); return sheet; }
  };
  const context = vm.createContext({
    console: {error() {}, log() {}},
    PropertiesService: {getScriptProperties: () => ({getProperty: key => key === 'TSG_LEADS_SPREADSHEET_ID' ? 'OFFLINE-MOCK-ONLY' : null})},
    SpreadsheetApp: {openById: destination => {
      assert.equal(destination, 'OFFLINE-MOCK-ONLY');
      return spreadsheet;
    }},
    MailApp: {sendEmail: message => {
      assert.equal(message.to, 'synthetic@example.test');
      emails.push(message);
    }},
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput: value => ({setMimeType: () => JSON.parse(value)})}
    // No ScriptApp, fetch, UrlFetchApp, require, or network APIs are supplied.
  }, {codeGeneration: {strings: false, wasm: false}});
  vm.runInContext(source, context, {timeout: 1000});
  const call = (name, ...args) => {
    context.mockArguments = args;
    try { return vm.runInContext(`${name}(...mockArguments)`, context, {timeout: 1000}); }
    finally { delete context.mockArguments; }
  };
  const definitions = vm.runInContext('TSG_SHEETS', context);
  for (const definition of Object.values(definitions)) call('ensureSheet_', spreadsheet, definition);
  const lead = call('normalizeLead_', {
    leadId: id, leadType: 'booking', timestamp: '2000-01-01T12:00:00Z',
    email: 'synthetic@example.test', name: 'Offline Synthetic', whatsapp: '18685550100',
    package: 'Offline fixture', marketingConsent: 'No', participants: []
  });
  const row = tab => {
    const sheet = sheets.get(tab);
    return sheet.rows.slice(1).find(cells => cells[sheet.rows[0].indexOf('Lead ID')] === id);
  };
  const get = (tab, header) => row(tab)?.[sheets.get(tab).rows[0].indexOf(header)];
  const set = (tab, header, value) => { row(tab)[sheets.get(tab).rows[0].indexOf(header)] = value; };
  return {call, sheets, emails, spreadsheet, lead, row, get, set,
    seed() { assert.equal(call('saveLead_', lead).status, 'New Lead'); }};
}

let scenarios = 0;
for (const status of ['Confirmed', 'Paid']) {
  const old = harness(legacy);
  const candidate = harness(current);
  for (const test of [old, candidate]) {
    test.seed();
    for (const tab of ['Leads', 'Bookings']) test.set(tab, 'Status', status);
    test.call('markWhatsAppOpened_', id);
    for (const tab of ['Leads', 'Bookings']) assert.equal(test.get(tab, 'WhatsApp Opened'), 'Yes');
    assert.equal(test.emails.length, 0);
  }
  for (const tab of ['Leads', 'Bookings']) {
    assert.equal(old.get(tab, 'Status'), 'WhatsApp Opened');
    assert.equal(candidate.get(tab, 'Status'), status);
  }
  assert.equal(old.get('Follow Up Status', 'Status'), 'New Lead', 'Legacy WhatsApp write leaves follow-up stale');
  scenarios++;
}
console.log('CONFIRMED LEGACY RISK (mock): WhatsApp-open downgrades Confirmed/Paid Leads and Bookings; local candidate preserves them.');

for (const protectedTab of tabs) {
  for (const status of ['Confirmed', 'Paid']) {
    const old = harness(legacy);
    const candidate = harness(current);
    for (const test of [old, candidate]) {
      test.seed();
      test.set(protectedTab, 'Status', status);
      test.call('updateLeadStatus_', test.spreadsheet, id, 'Follow Up Needed');
    }
    for (const tab of ['Leads', 'Bookings']) assert.equal(old.get(tab, 'Status'), 'Follow Up Needed');
    for (const tab of tabs) assert.equal(candidate.get(tab, 'Status'), tab === protectedTab ? status : 'New Lead');
    scenarios++;
  }
}
console.log('CONFIRMED LEGACY RISK (mock): updateLeadStatus_ is unguarded, including when another tab is Confirmed/Paid; local candidate blocks the write.');

for (const protectedTab of ['Leads', 'Bookings']) {
  for (const status of ['Confirmed', 'Paid']) {
    const old = harness(legacy);
    old.seed();
    old.set(protectedTab, 'Status', status);
    assert.equal(old.get('Follow Up Status', 'Status'), 'New Lead');
    // Explicit manual invocation against mocks only; never a real trigger invocation.
    old.call('runTSGFollowUpReminders');
    assert.equal(old.emails.length, 1);
    assert.equal(old.emails[0].subject, 'Still ready to roll with TSG?');
    for (const tab of tabs) assert.equal(old.get(tab, 'Status'), 'Follow Up Needed');
    assert.ok(old.get('Follow Up Status', 'Last Contacted'));
    old.call('runTSGFollowUpReminders');
    assert.equal(old.emails.length, 1, 'Mock last-contacted check prevents a second reminder');

    const candidate = harness(current);
    candidate.seed();
    candidate.set(protectedTab, 'Status', status);
    candidate.call('runTSGFollowUpReminders');
    assert.equal(candidate.emails.length, 0, 'Automatic reminders remain disabled in local mock properties');
    // Exercise the guarded worker directly, without enabling automatic reminders.
    candidate.call('runFollowUpReminders_');
    assert.equal(candidate.emails.length, 0);
    for (const tab of tabs) assert.equal(candidate.get(tab, 'Status'), tab === protectedTab ? status : 'New Lead');
    scenarios++;
  }
}
console.log('CONFIRMED LEGACY RISK (MOCK REMINDER CALLS): stale New Lead follow-up sends one captured mock email and downgrades Confirmed/Paid on another tab. Local candidate worker suppresses it; automatic reminders were never enabled.');

for (const failedTab of ['Bookings', 'Follow Up Status']) {
  const old = harness(legacy);
  old.sheets.get(failedTab).failAppend = true;
  assert.throws(() => old.call('saveLead_', old.lead), /MOCK append failure/);
  assert.ok(old.row('Leads'), 'Earlier append survives later failure');
  assert.equal(old.row(failedTab), undefined);
  old.sheets.get(failedTab).failAppend = false;
  old.set('Leads', 'Status', 'Paid');
  assert.equal(old.call('saveLead_', old.lead).status, 'duplicate_ignored');
  assert.equal(old.row(failedTab), undefined, 'Legacy retry cannot repair missing cross-tab rows');

  const candidate = harness(current);
  candidate.sheets.get(failedTab).failAppend = true;
  assert.throws(() => candidate.call('saveLead_', candidate.lead), /MOCK append failure/);
  candidate.sheets.get(failedTab).failAppend = false;
  candidate.set('Leads', 'Status', 'Paid');
  assert.equal(candidate.call('saveLead_', candidate.lead).status, 'duplicate_ignored');
  assert.equal(candidate.get(failedTab, 'Status'), 'Paid');
  assert.equal(old.emails.length + candidate.emails.length, 0);
  scenarios++;
}

const orphan = harness(legacy);
orphan.seed();
orphan.sheets.get('Leads').rows.splice(1, 1);
orphan.sheets.get('Follow Up Status').rows.splice(1, 1);
orphan.set('Bookings', 'Status', 'Paid');
assert.equal(orphan.call('saveLead_', orphan.lead).status, 'New Lead');
assert.equal(orphan.get('Leads', 'Status'), 'New Lead');
assert.equal(orphan.get('Bookings', 'Status'), 'Paid');
assert.equal(orphan.get('Follow Up Status', 'Status'), 'New Lead');
scenarios++;
console.log('CONFIRMED LEGACY RISK (mock): partial appends survive failure, Leads duplicate retries skip repair, and an orphan Paid Booking can coexist with newly appended New Lead rows.');

const lines = legacy.split('\n');
function reference(functionName, fragment) {
  const start = lines.findIndex(line => line.startsWith(`function ${functionName}(`));
  assert.ok(start >= 0, functionName);
  let end = lines.findIndex((line, index) => index > start && line.startsWith('function '));
  if (end < 0) end = lines.length;
  const index = lines.findIndex((line, i) => i >= start && i < end && line.includes(fragment));
  assert.ok(index >= 0, `${functionName}: ${fragment}`);
  return `${functionName} L${start + 1}, write/reference L${index + 1}`;
}
const inventory = [
  ['normalizeLead_', "status: 'New Lead'", 'initial status, consumed by saveLead_'],
  ['saveLead_', 'lead.status, lead.notes', 'Leads append uses normalized New Lead'],
  ['saveLead_', 'lead.marketingConsent, lead.whatsappOpened, lead.status', 'Bookings append uses normalized New Lead'],
  ['saveLead_', "return {status: 'duplicate_ignored'}", 'early return skips all cross-tab repair'],
  ['appendFollowUp_', "lead.leadType, 'New Lead'", 'Follow Up Status append hard-codes New Lead'],
  ['upsertSubscriber_', "'Subscribed', new Date()", 'Email Subscribers append/full-row replacement writes Subscribed'],
  ['markWhatsAppOpened_', ".setValue('WhatsApp Opened')", 'unconditional Leads/Bookings status write; no follow-up sync'],
  ['runTSGFollowUpReminders', 'const status = String(row[5]', 'eligibility reads only follow-up status'],
  ['runTSGFollowUpReminders', 'MailApp.sendEmail', 'mocked reminder send precedes status writes'],
  ['runTSGFollowUpReminders', ".setValue('Follow Up Needed')", 'Follow Up Status write, followed by Last Contacted and updateLeadStatus_'],
  ['updateLeadStatus_', '.setValue(status)', 'unguarded Leads/Bookings write; no transaction across tabs']
];
console.log(`\nPinned legacy inventory: ${blob}\nLF SHA256: ${expectedHash}; 298 split lines including terminal empty line (297 content lines)`);
for (const [name, fragment, description] of inventory) console.log(`- ${reference(name, fragment)}: ${description}`);
console.log(`\nPASS: ${scenarios} offline reproduction/comparison scenarios. Old behavior is CONFIRMED RISK, not fixed production.`);
console.log('Scope: in-memory Sheet/MailApp only; current comparison is mutable LOCAL candidate source, not deployed verification. No real email, Sheet, browser, network, or trigger access.');
console.log('Production trigger ACTIVE is a parent-provided read-only finding, not checked or disabled by this test. No production state was changed.');
