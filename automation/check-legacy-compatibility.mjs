// Offline only. No browser, network, Google services, real mail or trigger access.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const inspection = JSON.parse(readFileSync(new URL('LEGACY_ENDPOINT_INSPECTION.json', import.meta.url)));
const pinned = execFileSync('git', ['show', inspection.source.matchingRepositoryBlob], {cwd: root, encoding: 'utf8'}).replace(/\r\n/g, '\n');
assert.equal(inspection.source.matchingRepositoryBlob, '51ddd8f4f17318c3537544a1ab58ae51ede090dd:automation/google-apps-script/Code.gs');
assert.equal(createHash('sha256').update(pinned).digest('hex'), inspection.source.sha256Lf);
const source = readFileSync(new URL('legacy-compatibility/Code.gs', import.meta.url), 'utf8');
const tabs = ['Leads','Bookings','Follow Up Status'];
const allTabs = [...tabs,'Email Subscribers'];
const base = {
  action: 'lead_submit', leadType: 'booking', leadId: 'TSG-OFFLINE-LEGACY',
  timestamp: '2000-01-01T12:00:00Z', name: 'Synthetic Legacy', whatsapp: '+18685550100',
  email: 'synthetic@example.test', location: 'Tobago', skaterType: 'Child',
  package: 'Historical package TT$999', rentalsNeeded: 'Yes', preferredTime: 'Saturday afternoon',
  marketingConsent: 'No', sourcePage: 'old-book.html', utmSource: 'offline', utmMedium: 'test',
  utmCampaign: 'legacy', referrer: 'offline-fixture', notes: 'Staff must call', tags: 'legacy-fixture'
};
const clone = value => JSON.parse(JSON.stringify(value));
const formulaCell = (formula, value) => ({formula, value});
let checks = 0;
function test(name, work) {
  work(); checks++;
  console.log(`PASS ${name}`);
}
function world() {
  return {sheets: new Map(), emails: [], properties: new Map([['TSG_LEADS_SPREADSHEET_ID','OFFLINE-ONLY']]),
    held: false, waits: 0, releases: 0, flushes: 0, writes: [], readHook: null, writeHook: null, mailHook: null,
    failMail: false, strict: true, beforeAppend: null, failAppend: null, created: [], deleted: [],
    triggers: [{getHandlerFunction: () => 'runTSGFollowUpReminders'}, {getHandlerFunction: () => 'unrelatedTask'}]};
}
class Sheet {
  constructor(name, w) { this.name = name; this.w = w; this.rows = []; this.maxColumns = 26; }
  getName() { return this.name; }
  getParent() { return {getSheetByName: name => this.w.sheets.get(name)}; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return Math.max(0, ...this.rows.map(row => row.length)); }
  getMaxRows() { return 1000; }
  getMaxColumns() { return this.maxColumns; }
  insertColumnsAfter(_after, count) { this.mutation('columns'); this.maxColumns += count; }
  setFrozenRows() {}
  getFilter() { return true; }
  mutation(kind, details = {}) {
    if (this.w.strict) assert.equal(this.w.held, true, `${this.name} ${kind} requires script lock`);
    this.w.writes.push({tab: this.name, kind, ...details});
    this.w.writeHook?.({tab: this.name, kind, ...details});
  }
  appendRow(values) {
    this.mutation('append');
    this.w.beforeAppend?.(this.name);
    if (this.w.failAppend === this.name) throw new Error('MOCK partial append failure');
    this.rows.push([...values]);
  }
  getRange(row, column, height = 1, width = 1) {
    assert.ok(row > 0 && column > 0 && height > 0 && width > 0);
    const read = kind => {
      const values = Array.from({length: height}, (_, r) => Array.from({length: width}, (_, c) => this.rows[row - 1 + r]?.[column - 1 + c] ?? ''));
      this.w.readHook?.({tab: this.name, row, column, height, width, kind, header: this.rows[0]?.[column - 1]});
      return values.map(cells => cells.map(value => value && typeof value === 'object' && 'formula' in value
        ? (kind === 'formula' ? value.formula : value.value) : value));
    };
    const write = values => {
      this.mutation('cell', {row, column, height, width, values});
      values.forEach((cells, r) => cells.forEach((value, c) => {
        this.rows[row - 1 + r] ||= [];
        this.rows[row - 1 + r][column - 1 + c] = value;
      }));
    };
    const range = {getValues: () => read('values'), getDisplayValues: () => read('display').map(r => r.map(String)),
      getValue: () => read('value')[0][0], getFormula: () => {
        const value = read('formula')[0][0];
        return typeof value === 'string' && value.startsWith('=') ? value : '';
      }, setValue: value => write([[value]]), setValues: write,
      setFontWeight: () => range, setBackground: () => range, setFontColor: () => range};
    return range;
  }
}
function harness(code = source, w = world()) {
  const spreadsheet = {
    getSheetByName: name => w.sheets.get(name),
    insertSheet: name => {
      if (w.strict) assert.equal(w.held, true, 'Sheet creation locked');
      const sheet = new Sheet(name, w); w.sheets.set(name, sheet); return sheet;
    }
  };
  const builder = {timeBased() { return this; }, everyDays() { return this; }, atHour() { return this; }, create() {
    assert.equal(w.held, true); w.created.push('runTSGFollowUpReminders');
  }};
  const context = vm.createContext({
    console: {error() {}, log() {}},
    LockService: {getScriptLock: () => ({waitLock() {
      w.waits++;
      if (w.held) throw new Error('MOCK lock contention');
      w.held = true;
    }, releaseLock() { assert.equal(w.held, true); w.held = false; w.releases++; }})},
    PropertiesService: {getScriptProperties: () => ({getProperty: name => w.properties.get(name) ?? null})},
    SpreadsheetApp: {openById: id => { assert.equal(id, 'OFFLINE-ONLY'); return spreadsheet; },
      getActiveSpreadsheet: () => spreadsheet,
      flush() { assert.equal(w.held,true,'Flush must complete before releasing the script lock'); w.flushes++; }},
    ScriptApp: {getProjectTriggers: () => w.triggers, deleteTrigger: trigger => {
      assert.equal(w.held, true); w.deleted.push(trigger);
    }, newTrigger: () => builder},
    MailApp: {sendEmail: message => {
      if (w.strict) assert.equal(w.held, true, 'Mail remains in the same locked transaction');
      assert.match(message.to, /@example\.test$/);
      if (w.failMail) throw new Error('MOCK mail failure');
      w.emails.push(message); w.mailHook?.(message);
    }},
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput: text => ({setMimeType: () => JSON.parse(text)})}
  }, {codeGeneration: {strings: false, wasm: false}});
  vm.runInContext(code, context, {timeout: 1000});
  const call = (name, ...args) => {
    context.args = args;
    try { return vm.runInContext(`${name}(...args)`, context, {timeout: 3000}); }
    finally { delete context.args; }
  };
  const post = payload => call('doPost', {postData: {contents: JSON.stringify(payload)}});
  const definitions = vm.runInContext('TSG_SHEETS', context);
  const row = (tab, id = base.leadId) => {
    const sheet = w.sheets.get(tab);
    return sheet?.rows.slice(1).find(r => String(r[sheet.rows[0].indexOf('Lead ID')]).trim() === id);
  };
  const get = (tab, header, id = base.leadId) => row(tab, id)?.[w.sheets.get(tab).rows[0].indexOf(header)];
  const set = (tab, header, value, id = base.leadId) => { row(tab, id)[w.sheets.get(tab).rows[0].indexOf(header)] = value; };
  const remove = tab => { w.sheets.get(tab).rows.splice(1); };
  const seed = () => { assert.deepEqual(post(base), {ok: true, leadId: base.leadId, status: 'New Lead'}); w.emails.length = 0; w.writes.length = 0; };
  return {w, spreadsheet, call, post, definitions, row, get, set, remove, seed,
    enabled() { w.properties.set('TSG_AUTOMATIC_REMINDERS_ENABLED','true'); },
    lead(payload = base) { return call('normalizeLead_', payload); }};
}

const sheetState = h => clone([...h.w.sheets].map(([name, sheet]) => [name, sheet.rows]));
function duplicateRows(h, tab, id) {
  const sheet = h.w.sheets.get(tab);
  const copy = [...h.row(tab, id)];
  copy[sheet.rows[0].indexOf('Lead ID')] = ` ${id} `;
  sheet.rows.push(copy);
  return copy;
}
function unrelatedDuplicates(h) {
  const id = 'UNRELATED-AMBIGUOUS';
  assert.equal(h.post({...base, leadId: id, email: 'ambiguous@example.test', marketingConsent: 'Yes'}).ok, true);
  for (const tab of allTabs) {
    const copy = duplicateRows(h, tab, id);
    copy[h.w.sheets.get(tab).rows[0].indexOf('Status')] = 'Paid';
  }
  h.w.writes.length = 0; h.w.emails.length = 0;
  return () => clone(allTabs.map(tab => {
    const sheet = h.w.sheets.get(tab);
    return sheet.rows.slice(1).filter(row => String(row[sheet.rows[0].indexOf('Lead ID')]).trim() === id);
  }));
}

test('pinned source and exact known legacy envelopes/validation', () => {
  for (const mutate of [
    {}, {leadId: ''}, {email: 'bad'}, {name: ''}, {whatsapp: ''}, {package: ''},
    {leadType: 'email', marketingConsent: 'No'}, {leadType: 'email', marketingConsent: 'Yes'},
    {leadType: 'unexpected', marketingConsent: 'Yes'}, {website: 'honeypot'}, {action: 'unknown'}
  ]) {
    const oldWorld = world(); oldWorld.strict = false;
    const old = harness(pinned, oldWorld); const candidate = harness();
    assert.deepEqual(candidate.post({...base, ...mutate}), old.post({...base, ...mutate}));
  }
  const oldWorld = world(); oldWorld.strict = false;
  const old = harness(pinned, oldWorld); const candidate = harness();
  old.post(base); candidate.post(base);
  assert.deepEqual(candidate.post(base), old.post(base));
  for (const id of [base.leadId, 'UNKNOWN']) assert.deepEqual(candidate.post({action: 'whatsapp_opened', leadId: id}), old.post({action: 'whatsapp_opened', leadId: id}));
  assert.deepEqual(candidate.call('doPost', {}), {ok: false, error: 'Missing request body.'});
  assert.deepEqual(candidate.post({action: 'whatsapp_opened'}), {ok: false, error: 'Lead ID is required.'});
  assert.equal(candidate.call('doGet').service, 'TSG Website Leads');
});

test('approved blank-email booking saves three rows and unchanged retry has no mail/subscriber/writes', () => {
  for (const email of ['', '   ', undefined]) {
    const h = harness();
    const request = {...base, email};
    assert.deepEqual(h.post(request), {ok: true, leadId: base.leadId, status: 'New Lead'});
    for (const tab of tabs) {
      assert.equal(h.w.sheets.get(tab).rows.length, 2);
      assert.equal(h.get(tab,'Email'), '');
      assert.equal(h.get(tab,'Status'), 'New Lead');
    }
    assert.equal(h.w.sheets.has('Email Subscribers'), false);
    assert.equal(h.w.emails.length, 0);
    const before = clone([...h.w.sheets].map(([name, sheet]) => [name, sheet.rows]));
    h.w.writes.length = 0;
    assert.deepEqual(h.post(request), {ok: true, leadId: base.leadId, status: 'duplicate_ignored'});
    assert.deepEqual(clone([...h.w.sheets].map(([name, sheet]) => [name, sheet.rows])), before);
    assert.equal(h.w.writes.length, 0);
    assert.equal(h.w.emails.length, 0);
    assert.equal(h.w.sheets.has('Email Subscribers'), false);
  }
});

test('malformed nonblank booking email fails before writes or mail', () => {
  for (const email of ['bad', 'missing@domain', 'two addresses@example.test', '@example.test']) {
    const h = harness();
    assert.deepEqual(h.post({...base, email}), {ok: false, error: 'A valid email is required.'});
    assert.equal(h.w.sheets.size, 0);
    assert.equal(h.w.writes.length, 0);
    assert.equal(h.w.emails.length, 0);
  }
});

test('newsletter still requires valid email and affirmative consent before writes', () => {
  for (const [email, marketingConsent, error] of [
    ['', 'Yes', 'A valid email is required.'],
    ['bad', 'Yes', 'A valid email is required.'],
    ['synthetic@example.test', 'No', 'Email consent is required.']
  ]) {
    const h = harness();
    assert.deepEqual(h.post({...base, leadType: 'email', email, marketingConsent}), {ok: false, error});
    assert.equal(h.w.sheets.size, 0);
    assert.equal(h.w.writes.length, 0);
    assert.equal(h.w.emails.length, 0);
  }
});

test('legacy data, one review column, plain current-offer acknowledgement and duplicate no-mail', () => {
  const h = harness();
  assert.equal(h.post(base).ok, true);
  for (const tab of ['Leads','Bookings']) {
    assert.equal(h.get(tab,'Package'), base.package);
    assert.equal(h.get(tab,'Preferred Time'), base.preferredTime);
    assert.equal(h.get(tab,'Adult/Child'), 'Child');
    assert.equal(h.get(tab,'Notes'), base.notes);
    assert.match(h.get(tab,'Legacy Review Required'), /collect participant details/);
    const headers = h.w.sheets.get(tab).rows[0];
    assert.ok(!headers.includes('Participants JSON') && !headers.includes('Participant Count'));
    assert.deepEqual(headers.filter(x => x.startsWith('Legacy ')), ['Legacy Review Required']);
  }
  assert.equal(h.w.sheets.has('Email Subscribers'), false);
  assert.equal(h.w.emails.length, 1);
  const message = h.w.emails[0];
  assert.match(message.body, /not a confirmed class/);
  assert.match(message.body, /TT\$80 per person \/ 75 minutes \/ skate rental included/);
  assert.match(message.body, /No payment has been taken/);
  assert.doesNotMatch(message.body, /999|Elite/i);
  assert.equal(message.htmlBody, undefined);
  const before = clone([...h.w.sheets].map(([name, sheet]) => [name, sheet.rows]));
  assert.deepEqual(h.post({...base, name: 'Changed retry', package: 'Different offer'}), {ok: true, leadId: base.leadId, status: 'duplicate_ignored'});
  assert.deepEqual(clone([...h.w.sheets].map(([name, sheet]) => [name, sheet.rows])), before);
  assert.equal(h.w.emails.length, 1);
});

for (const protectedTab of tabs) for (const state of ['Confirmed','Paid','Replied']) {
  test(`${protectedTab} ${state}: tracking/helper/reminder/retry/direct append protection`, () => {
    const h = harness(); h.seed(); h.enabled(); h.set(protectedTab,'Status',state);
    const before = tabs.map(tab => h.get(tab,'Status'));
    h.call('markWhatsAppOpened_', base.leadId);
    h.call('updateLeadStatus_', h.spreadsheet, base.leadId, 'Follow Up Needed');
    h.call('updateLeadStatus_', h.spreadsheet, base.leadId, 'New Lead');
    h.call('runTSGFollowUpReminders'); h.call('runFollowUpReminders_');
    h.call('writeReminderContact_', h.spreadsheet, base.leadId);
    h.call('sendLeadConfirmation_', h.lead());
    assert.equal(h.post(base).status, 'duplicate_ignored');
    h.call('appendFollowUp_', h.spreadsheet, h.lead());
    assert.deepEqual(tabs.map(tab => h.get(tab,'Status')), before);
    assert.equal(h.w.emails.length, 0);
    assert.equal(h.get('Follow Up Status','Last Contacted'), '');
    for (const tab of ['Leads','Bookings']) assert.equal(h.get(tab,'WhatsApp Opened'), 'Yes');
  });
}

for (const survivor of tabs) for (const state of ['Confirmed','Paid','Replied']) {
  test(`${survivor} sole ${state}: missing parent/children repaired, no ack`, () => {
    const h = harness(); h.seed(); h.set(survivor,'Status',state);
    for (const tab of tabs) if (tab !== survivor) h.remove(tab);
    // The survivor, not a changed retry, is the historical source of truth.
    assert.equal(h.post({...base, email: 'changed@example.test', name: 'Changed retry', package: 'Changed'}).status, 'duplicate_ignored');
    for (const tab of tabs) {
      assert.equal(h.get(tab,'Status'), state);
      assert.equal(h.get(tab,'Email'), base.email);
      assert.equal(h.w.sheets.get(tab).rows.length, 2);
    }
    if (survivor !== 'Follow Up Status') assert.equal(h.get('Leads','Package'), base.package);
    assert.equal(h.w.emails.length, 0);
  });
}

test('all nonempty tab-presence subsets repair without replacing existing states', () => {
  for (let mask = 1; mask < 8; mask++) {
    const h = harness(); h.seed();
    tabs.forEach((tab, i) => mask & (1 << i) ? h.set(tab,'Status', i === 0 ? 'Confirmed' : 'Paid') : h.remove(tab));
    const before = tabs.map(tab => h.get(tab,'Status'));
    h.post(base);
    const inherited = before.includes('Paid') ? 'Paid' : 'Confirmed';
    tabs.forEach((tab, i) => assert.equal(h.get(tab,'Status'), before[i] || inherited));
    assert.equal(h.w.emails.length, 0);
  }
});

test('Paid beats Confirmed for newly missing rows; existing Confirmed is never promoted/overwritten', () => {
  for (const missing of tabs) {
    const h = harness(); h.seed(); h.remove(missing);
    const others = tabs.filter(tab => tab !== missing);
    h.set(others[0],'Status','Confirmed'); h.set(others[1],'Status','Paid');
    h.post(base);
    assert.equal(h.get(missing,'Status'),'Paid');
    assert.equal(h.get(others[0],'Status'),'Confirmed');
    assert.equal(h.get(others[1],'Status'),'Paid');
  }
});

for (const failed of ['Bookings','Follow Up Status']) {
  test(`partial ${failed} append failure and duplicate repair preserve ID/data/status/no mail`, () => {
    const h = harness(); h.w.failAppend = failed;
    assert.deepEqual(h.post(base), {ok: false, error: 'MOCK partial append failure'});
    assert.equal(h.w.held, false);
    assert.ok(h.row('Leads')); h.set('Leads','Status','Paid');
    h.w.failAppend = null;
    assert.equal(h.post({...base, name: 'Changed'}).status,'duplicate_ignored');
    assert.equal(h.get(failed,'Status'),'Paid');
    assert.equal(h.get(failed,'Name'), base.name);
    tabs.forEach(tab => assert.equal(h.w.sheets.get(tab).rows.length, 2));
    assert.equal(h.w.emails.length, 0);
  });
}

test('mail failure after fresh save remains a duplicate/manual reconciliation, not a resend', () => {
  const h = harness(); h.w.failMail = true;
  assert.deepEqual(h.post(base), {ok: false, error: 'MOCK mail failure'});
  assert.equal(h.w.held, false);
  h.w.failMail = false;
  assert.equal(h.post(base).status,'duplicate_ignored');
  assert.equal(h.w.emails.length,0);
});

test('default/false/nonliteral true disables BOTH runner and direct worker, no trigger creation or mutation', () => {
  for (const setting of [undefined,'false','TRUE','1',' true ',true]) {
    const h = harness(); h.seed();
    if (setting !== undefined) h.w.properties.set('TSG_AUTOMATIC_REMINDERS_ENABLED', setting);
    h.call('installTSGAutomationTriggers');
    assert.equal(h.w.created.length,0);
    assert.equal(h.w.deleted.length,1);
    assert.equal(h.w.deleted[0].getHandlerFunction(),'runTSGFollowUpReminders');
    h.call('runTSGFollowUpReminders'); h.call('runFollowUpReminders_');
    assert.equal(h.w.emails.length,0); assert.equal(h.w.writes.length,0);
  }
  const h = harness(); h.call('setupTSGLeadSystem');
  assert.equal(h.w.created.length,0);
});

test('explicit true installs mocked trigger and due reminder sends once under lock', () => {
  const h = harness(); h.seed(); h.enabled(); h.call('installTSGAutomationTriggers');
  assert.equal(h.w.created.length,1);
  h.call('runTSGFollowUpReminders');
  assert.equal(h.w.emails.length,1);
  tabs.forEach(tab => assert.equal(h.get(tab,'Status'),'Follow Up Needed'));
  assert.ok(h.get('Follow Up Status','Last Contacted'));
  h.call('runFollowUpReminders_'); assert.equal(h.w.emails.length,1);
});

test('reminders reject missing rows, cross-tab email mismatch, future/invalid due and prior contact', () => {
  const mutations = [
    ...tabs.map(tab => h => h.remove(tab)),
    ...tabs.map(tab => h => h.set(tab,'Email','different@example.test')),
    h => h.set('Follow Up Status','Reminder Due','not-date'),
    h => h.set('Follow Up Status','Reminder Due','2999-01-01'),
    h => h.set('Follow Up Status','Last Contacted','already contacted'),
    h => h.set('Leads','Status','Staff custom state')
  ];
  for (const mutate of mutations) {
    const h = harness(); h.seed(); h.enabled(); mutate(h);
    h.call('runFollowUpReminders_'); assert.equal(h.w.emails.length,0);
  }
});

test('missing Last Contacted header blocks both reminder runs without mail or writes', () => {
  const h = harness(); h.seed(); h.enabled();
  const sheet = h.w.sheets.get('Follow Up Status');
  const column = sheet.rows[0].indexOf('Last Contacted');
  sheet.rows.forEach(row => row.splice(column,1));
  const before = clone(sheet.rows);
  for (const runner of ['runTSGFollowUpReminders','runFollowUpReminders_']) {
    h.call(runner);
    assert.equal(h.w.emails.length,0); assert.equal(h.w.writes.length,0);
    assert.deepEqual(clone(sheet.rows),before);
  }
});

test('blank-result Last Contacted formula blocks both reminder runs without mail or writes', () => {
  const h = harness(); h.seed(); h.enabled();
  h.set('Follow Up Status','Last Contacted',formulaCell('=""',''));
  const sheet = h.w.sheets.get('Follow Up Status');
  const cell = sheet.getRange(2,sheet.rows[0].indexOf('Last Contacted') + 1);
  assert.equal(cell.getValue(),''); assert.equal(cell.getDisplayValues()[0][0],'');
  assert.equal(cell.getFormula(),'=""');
  const before = clone(sheet.rows);
  for (const runner of ['runTSGFollowUpReminders','runFollowUpReminders_']) {
    h.call(runner);
    assert.equal(h.w.emails.length,0); assert.equal(h.w.writes.length,0);
    assert.deepEqual(clone(sheet.rows),before);
  }
});

test('formula inserted during final eligibility read blocks both reminder runs without mail or writes', () => {
  const h = harness(); h.seed(); h.enabled(); let reads = 0;
  h.w.readHook = event => {
    if (event.tab === 'Follow Up Status' && event.row === 2 &&
        event.header === 'Last Contacted' && event.kind === 'value' && ++reads === 2) {
      h.w.readHook = null;
      h.set('Follow Up Status','Last Contacted',formulaCell('=""',''));
    }
  };
  h.call('runTSGFollowUpReminders');
  assert.equal(reads,2,'Formula arrives on the second, final pre-send candidate read');
  assert.equal(h.w.emails.length,0); assert.equal(h.w.writes.length,0);
  const before = clone(h.w.sheets.get('Follow Up Status').rows);
  h.call('runFollowUpReminders_');
  assert.equal(h.w.emails.length,0); assert.equal(h.w.writes.length,0);
  assert.deepEqual(clone(h.w.sheets.get('Follow Up Status').rows),before);
});

test('rechecks cross-tab statuses/email AFTER reading reminder details', () => {
  for (const tab of tabs) for (const field of ['Status','Email']) {
    const h = harness(); h.seed(); h.enabled(); let reads = 0;
    h.w.readHook = event => {
      if (event.tab === 'Follow Up Status' && event.row === 2 && event.width > 1 && ++reads === 2) {
        h.w.readHook = null; h.set(tab,field,field === 'Status' ? 'Paid' : 'changed@example.test');
      }
    };
    h.call('runFollowUpReminders_'); assert.equal(reads,2);
    assert.equal(h.w.emails.length,0);
    if (field === 'Status') assert.equal(h.get(tab,'Status'),'Paid');
  }
});

test('manual edits during mocked send prevent every later status/contact write', () => {
  for (const tab of tabs) for (const state of ['Paid','Confirmed','Replied']) {
    const h = harness(); h.seed(); h.enabled();
    h.w.mailHook = () => h.set(tab,'Status',state);
    h.call('runFollowUpReminders_');
    assert.equal(h.w.emails.length,1,'Edit during send cannot unsend a message');
    tabs.forEach(name => assert.equal(h.get(name,'Status'), name === tab ? state : 'New Lead'));
    assert.equal(h.get('Follow Up Status','Last Contacted'),'');
  }
});

test('fresh target status immediately before write protects a late Replied/Confirmed/Paid edit', () => {
  for (const state of ['Replied','Confirmed','Paid']) {
    const h = harness(); h.seed();
    h.w.readHook = event => {
      if (event.tab === 'Leads' && event.row === 2 && event.header === 'Status' && event.kind === 'formula') {
        h.w.readHook = null; h.set('Leads','Status',state);
      }
    };
    h.call('updateLeadStatus_',h.spreadsheet,base.leadId,'Follow Up Needed');
    assert.equal(h.get('Leads','Status'),state);
    assert.equal(h.get('Bookings','Status'),'New Lead');
  }
});

test('reordered/custom headers, Notes and formulas survive setup, repair, tracking and subscriber update', () => {
  const h = harness(); h.seed();
  for (const [tab, sheet] of h.w.sheets) {
    sheet.rows = sheet.rows.map(row => [...row].reverse());
    sheet.rows[0].splice(2,0,'Custom Formula','Custom Staff');
    sheet.rows[1].splice(2,0,'=1+1','untouched');
    h.set(tab,'Notes','=STAFF_FORMULA()');
  }
  const originals = new Map([...h.w.sheets].map(([tab, sheet]) => [tab, clone(sheet.rows)]));
  h.call('setupTSGLeadSystem'); h.post(base);
  for (const [tab, rows] of originals) assert.deepEqual(clone(h.w.sheets.get(tab).rows), rows);
  h.post({action: 'whatsapp_opened',leadId: base.leadId});
  for (const tab of tabs) {
    const sheet = h.w.sheets.get(tab);
    assert.equal(sheet.rows[1][2],'=1+1'); assert.equal(sheet.rows[1][3],'untouched');
    assert.equal(h.get(tab,'Notes'),'=STAFF_FORMULA()');
  }
  h.post({...base, leadId: 'OPTIN-ONE', marketingConsent: 'Yes'});
  const sheet = h.w.sheets.get('Email Subscribers');
  sheet.rows = sheet.rows.map(row => [...row].reverse());
  sheet.rows[0].splice(2,0,'Subscriber Formula'); sheet.rows[1].splice(2,0,'=A2');
  const column = sheet.rows[0].indexOf('Name'); sheet.rows[1][column] = '=STAFF_NAME()';
  const identity = h.get('Email Subscribers','Timestamp','OPTIN-ONE');
  h.post({...base, leadId: 'OPTIN-TWO', marketingConsent: 'Yes', name: 'Updated'});
  assert.equal(sheet.rows.length,2); assert.equal(sheet.rows[1][2],'=A2');
  assert.equal(sheet.rows[1][column],'=STAFF_NAME()');
  assert.equal(h.get('Email Subscribers','Timestamp','OPTIN-ONE'),identity);
  assert.equal(h.get('Email Subscribers','Lead ID','OPTIN-ONE'),'OPTIN-ONE');
});

test('additive migration preserves historical prefixes/rows and does not populate participant columns', () => {
  const h = harness();
  const sheet = new Sheet('Leads',h.w);
  sheet.rows = [['Notes','Lead ID','Status','Custom','Participants JSON'], ['keep','HISTORIC','Paid','=A2','[{"age":30}]']];
  h.w.sheets.set('Leads',sheet);
  const first = clone(sheet.rows);
  assert.equal(h.post(base).ok,true);
  assert.deepEqual(sheet.rows[0].slice(0,5),first[0]); assert.deepEqual(sheet.rows[1],first[1]);
  assert.equal(h.get('Leads','Participants JSON'),'');
  assert.equal(sheet.rows[0].filter(x => x === 'Legacy Review Required').length,1);
});

test('global schema guards still fail before mutations/mail despite unrelated target identity', () => {
  for (const tab of allTabs) for (const mutation of ['duplicate-header','blank-header','case-header','space-header','missing-id','missing-status', ...(tab === 'Email Subscribers' ? ['missing-email'] : [])]) {
    const h = harness(); h.seed();
    if (tab === 'Email Subscribers') h.post({...base,leadId: 'SUBSCRIBER',marketingConsent: 'Yes'});
    const sheet = h.w.sheets.get(tab);
    if (mutation === 'duplicate-header') sheet.rows[0].push('Status');
    if (mutation === 'blank-header') { sheet.rows[0].push(''); sheet.rows[1].push('orphan data'); }
    if (mutation === 'case-header') sheet.rows[0][sheet.rows[0].indexOf('Status')] = 'status';
    if (mutation === 'space-header') sheet.rows[0][sheet.rows[0].indexOf('Status')] = ' Status ';
    if (mutation === 'missing-id') sheet.rows[0][sheet.rows[0].indexOf('Lead ID')] = 'Unknown Identity';
    if (mutation === 'missing-status') sheet.rows[0][sheet.rows[0].indexOf('Status')] = 'Unknown State';
    if (mutation === 'missing-email') sheet.rows[0][sheet.rows[0].indexOf('Email')] = 'Unknown Email';
    h.w.writes.length = 0; h.w.emails.length = 0;
    const before = sheetState(h);
    assert.equal(h.post({...base,leadId:'ANOTHER'}).ok,false,`${tab} ${mutation}`);
    assert.equal(h.post({action:'whatsapp_opened',leadId:base.leadId}).ok,false);
    h.enabled();
    for (const runner of ['runTSGFollowUpReminders','runFollowUpReminders_']) assert.throws(() => h.call(runner), /header/);
    assert.equal(h.w.writes.length,0); assert.equal(h.w.emails.length,0);
    assert.deepEqual(sheetState(h),before);
    assert.equal(h.w.held,false);
  }
});

test('unrelated duplicates in all four tabs permit participantless old-form saves, tracks, retries and subscriber writes', () => {
  for (const email of [base.email, '']) {
    const h = harness(); const ambiguousRows = unrelatedDuplicates(h); const untouched = ambiguousRows();
    const request = {...base, email, marketingConsent: 'Yes'};
    assert.equal('participants' in request,false);
    assert.deepEqual(h.post(request),{ok:true,leadId:base.leadId,status:'New Lead'});
    tabs.forEach(tab => {
      assert.equal(h.get(tab,'Notes'),base.notes);
      assert.equal(h.get(tab,'Status'),'New Lead');
      assert.equal(h.get(tab,'Email'),email);
    });
    assert.equal(h.w.emails.length,email ? 1 : 0);
    assert.equal(Boolean(h.row('Email Subscribers')),Boolean(email));
    if (email) {
      assert.match(h.w.emails[0].body,/TT\$80 per person \/ 75 minutes \/ skate rental included/);
      assert.match(h.w.emails[0].body,/not a confirmed class/);
      assert.match(h.w.emails[0].body,/No payment has been taken/);
    }
    assert.deepEqual(h.post({action:'whatsapp_opened',leadId:base.leadId}),{ok:true,leadId:base.leadId,status:'WhatsApp Opened'});
    for (const tab of ['Leads','Bookings']) {
      assert.equal(h.get(tab,'WhatsApp Opened'),'Yes');
      assert.equal(h.get(tab,'Status'),'WhatsApp Opened');
    }
    const before = sheetState(h); h.w.writes.length = 0;
    assert.equal(h.post({...request,name:'Changed retry',notes:'Changed notes'}).status,'duplicate_ignored');
    assert.deepEqual(sheetState(h),before); assert.equal(h.w.writes.length,0);
    assert.equal(h.w.emails.length,email ? 1 : 0);
    assert.deepEqual(ambiguousRows(),untouched);
    assert.equal(h.w.held,false);
  }
});

test('unrelated all-tab duplicates permit partial append recovery for old forms including optional blank email', () => {
  for (const failed of ['Bookings','Follow Up Status']) for (const email of [base.email,'']) {
    const h = harness(); const ambiguousRows = unrelatedDuplicates(h); const untouched = ambiguousRows();
    const request = {...base,email}; h.w.failAppend = failed;
    assert.deepEqual(h.post(request),{ok:false,error:'MOCK partial append failure'});
    h.set('Leads','Status','Paid'); h.w.failAppend = null;
    const before = tabs.map(tab => h.get(tab,'Status'));
    assert.equal(h.post({...request,name:'Changed',notes:'Changed'}).status,'duplicate_ignored');
    for (const [index, tab] of tabs.entries()) {
      assert.equal(h.get(tab,'Status'),before[index] || 'Paid'); assert.equal(h.get(tab,'Name'),base.name);
      assert.equal(h.get(tab,'Notes'),base.notes); assert.equal(h.get(tab,'Email'),email);
      const sheet = h.w.sheets.get(tab);
      assert.equal(sheet.rows.slice(1).filter(row => row[sheet.rows[0].indexOf('Lead ID')] === base.leadId).length,1);
    }
    assert.equal(h.w.emails.length,0); assert.deepEqual(ambiguousRows(),untouched);
    assert.equal(h.w.held,false);
  }
});

test('unrelated duplicates never weaken any protected companion or resolve conflicting protected states by overwriting', () => {
  for (const protectedTab of tabs) for (const state of ['Confirmed','Paid','Replied']) {
    const h = harness(); h.seed(); const ambiguousRows = unrelatedDuplicates(h); const untouched = ambiguousRows();
    h.set(protectedTab,'Status',state);
    const others = tabs.filter(tab => tab !== protectedTab);
    h.set(others[0],'Status',state === 'Paid' ? 'Confirmed' : 'Paid');
    const before = tabs.map(tab => h.get(tab,'Status'));
    h.enabled(); h.post({action:'whatsapp_opened',leadId:base.leadId});
    h.call('updateLeadStatus_',h.spreadsheet,base.leadId,'Follow Up Needed');
    h.call('runTSGFollowUpReminders'); h.call('runFollowUpReminders_');
    h.call('sendLeadConfirmation_',h.lead());
    assert.equal(h.post({...base,notes:'Changed retry'}).status,'duplicate_ignored');
    assert.deepEqual(tabs.map(tab => h.get(tab,'Status')),before);
    tabs.forEach(tab => assert.equal(h.get(tab,'Notes'),base.notes));
    assert.equal(h.get('Follow Up Status','Last Contacted'),'');
    assert.equal(h.w.emails.length,0); assert.deepEqual(ambiguousRows(),untouched);
  }
});

for (const tab of allTabs) {
  test(`ambiguous target in ${tab}: every save/track/mutation/mail helper rejects before any write`, () => {
    for (const states of [['New Lead','Confirmed'],['Paid','New Lead'],['Replied','Paid']]) {
      const h = harness();
      assert.equal(h.post({...base,marketingConsent:'Yes'}).ok,true); h.enabled();
      const record = h.call('record_',h.w.sheets.get('Leads'),base.leadId);
      h.set(tab,'Status',states[0]);
      const copy = duplicateRows(h,tab,base.leadId);
      copy[h.w.sheets.get(tab).rows[0].indexOf('Status')] = states[1];
      // Missing review headers must not be appended before target ambiguity is detected.
      const leads = h.w.sheets.get('Leads'); const reviewColumn = leads.rows[0].indexOf('Legacy Review Required');
      leads.rows.forEach(row => row.splice(reviewColumn,1));
      const before = sheetState(h); h.w.writes.length = 0; h.w.emails.length = 0;
      for (const payload of [base,{...base,email:''},{action:'whatsapp_opened',leadId:base.leadId}]) {
        assert.deepEqual(h.post(payload),{ok:false,error:`Ambiguous target Lead ID in ${tab}: multiple rows; staff review required.`});
      }
      const operations = [
        () => h.call('saveLead_',h.lead()),
        () => h.call('appendFollowUp_',h.spreadsheet,h.lead()),
        () => h.call('appendMissingRecord_',h.spreadsheet,h.definitions.bookings,base.leadId,{}),
        () => h.call('markWhatsAppOpened_',base.leadId),
        () => h.call('writeNonStatusCell_',record,'WhatsApp Opened','Yes'),
        () => h.call('updateLeadStatus_',h.spreadsheet,base.leadId,'Follow Up Needed'),
        () => h.call('writeAutomaticStatus_',h.spreadsheet,base.leadId,'leads','No Response',false),
        () => h.call('upsertSubscriber_',h.spreadsheet,h.lead({...base,marketingConsent:'Yes'})),
        () => h.call('sendLeadConfirmation_',h.lead()),
        () => h.call('writeReminderContact_',h.spreadsheet,base.leadId)
      ];
      for (const run of operations) {
        assert.throws(run,error => error.code === 'TSG_AMBIGUOUS_LEAD_ID' && error.message.includes(tab));
        assert.equal(h.w.held,false);
      }
      assert.deepEqual(sheetState(h),before);
      assert.equal(h.w.writes.length,0); assert.equal(h.w.emails.length,0);
      assert.equal(h.w.waits,h.w.releases);
    }
  });
  test(`reminder loop skips target duplicate in ${tab}, continues unique IDs, never touches ambiguous rows`, () => {
    for (const runner of ['runTSGFollowUpReminders','runFollowUpReminders_']) {
      const h = harness(); h.seed();
      if (tab === 'Email Subscribers') h.call('upsertSubscriber_',h.spreadsheet,h.lead({...base,marketingConsent:'Yes'}));
      const copy = duplicateRows(h,tab,base.leadId);
      copy[h.w.sheets.get(tab).rows[0].indexOf('Status')] = 'Paid';
      const ambiguousBefore = sheetState(h);
      const unique = {...base,leadId:'UNIQUE-DUE',email:'unique@example.test'};
      assert.equal(h.post(unique).ok,true);
      h.enabled(); h.w.writes.length = 0; h.w.emails.length = 0;
      h.call(runner);
      assert.equal(h.w.emails.length,1); assert.equal(h.w.emails[0].to,unique.email);
      for (const [name, rows] of ambiguousBefore) assert.deepEqual(clone(h.w.sheets.get(name).rows.slice(0,rows.length)),rows);
      tabs.forEach(name => assert.equal(h.get(name,'Status',unique.leadId),'Follow Up Needed'));
      assert.ok(h.get('Follow Up Status','Last Contacted',unique.leadId));
      assert.ok(h.w.writes.every(write => write.row === h.w.sheets.get(write.tab).rows.length));
      h.call(runner); assert.equal(h.w.emails.length,1); assert.equal(h.w.held,false);
    }
  });
  test(`target duplicate in ${tab} blocks missing-companion recovery before append or header migration`, () => {
    const h = harness(); h.post({...base,marketingConsent:'Yes'});
    duplicateRows(h,tab,base.leadId);
    const missing = tab === 'Leads' ? 'Bookings' : 'Leads'; h.remove(missing);
    const before = sheetState(h); h.w.writes.length = 0; h.w.emails.length = 0;
    assert.equal(h.post({...base,name:'Changed participantless retry'}).ok,false);
    assert.throws(() => h.call('appendFollowUp_',h.spreadsheet,h.lead()),/Ambiguous target Lead ID/);
    assert.deepEqual(sheetState(h),before); assert.equal(h.w.writes.length,0); assert.equal(h.w.emails.length,0);
  });
}

test('all-tab unrelated duplicates permit protected orphan recovery without changing any historical row', () => {
  for (const survivor of tabs) for (const state of ['Confirmed','Paid','Replied']) for (const email of [base.email,'']) {
    const h = harness(); h.post({...base,email});
    const ambiguousRows = unrelatedDuplicates(h); const untouched = ambiguousRows();
    h.set(survivor,'Status',state);
    const survivorRow = clone(h.row(survivor));
    for (const tab of tabs) if (tab !== survivor) {
      const sheet = h.w.sheets.get(tab); const idColumn = sheet.rows[0].indexOf('Lead ID');
      sheet.rows = sheet.rows.filter((row, index) => index === 0 || row[idColumn] !== base.leadId);
    }
    h.w.emails.length = 0;
    assert.equal(h.post({...base,email,name:'Changed retry',notes:'Changed'}).status,'duplicate_ignored');
    tabs.forEach(tab => {
      assert.equal(h.get(tab,'Status'),state); assert.equal(h.get(tab,'Email'),email);
      assert.equal(h.get(tab,'Notes'),base.notes);
    });
    assert.deepEqual(clone(h.row(survivor)),survivorRow);
    assert.deepEqual(ambiguousRows(),untouched); assert.equal(h.w.emails.length,0);
  }
});

test('reminders recheck newly ambiguous IDs before mail and after mail without later status/contact writes', () => {
  for (const tab of allTabs) for (const phase of ['candidate-read','during-send']) {
    const h = harness(); h.seed(); h.enabled();
    if (tab === 'Email Subscribers') h.call('upsertSubscriber_',h.spreadsheet,h.lead({...base,marketingConsent:'Yes'}));
    let reads = 0; let inserted = false;
    const insert = () => { duplicateRows(h,tab,base.leadId); inserted = true; };
    if (phase === 'during-send') h.w.mailHook = insert;
    else h.w.readHook = event => {
      if (event.tab === 'Follow Up Status' && event.row === 2 && event.width > 1 && ++reads === 2) {
        h.w.readHook = null; insert();
      }
    };
    h.w.writes.length = 0; h.w.emails.length = 0;
    h.call('runFollowUpReminders_');
    assert.equal(inserted,true); assert.equal(h.w.emails.length,phase === 'during-send' ? 1 : 0);
    assert.equal(h.w.writes.length,0);
    tabs.forEach(name => assert.equal(h.get(name,'Status'),'New Lead'));
    assert.equal(h.get('Follow Up Status','Last Contacted'),'');
    assert.equal(h.w.held,false);
  }
});

test('reminder isolation does not swallow mail/service errors as duplicate-ID skips', () => {
  const h = harness(); h.seed(); h.enabled(); h.w.failMail = true;
  assert.throws(() => h.call('runFollowUpReminders_'),/MOCK mail failure/);
  assert.equal(h.w.writes.length,0); assert.equal(h.w.emails.length,0); assert.equal(h.w.held,false);
});

test('subscriber email upsert cannot mutate a different ambiguous historical identity', () => {
  const h = harness(); h.seed();
  h.call('upsertSubscriber_',h.spreadsheet,h.lead({...base,marketingConsent:'Yes'}));
  duplicateRows(h,'Bookings',base.leadId);
  const before = sheetState(h); h.w.writes.length = 0; h.w.emails.length = 0;
  assert.throws(() => h.call('upsertSubscriber_',h.spreadsheet,h.lead({...base,leadId:'OTHER-ID',marketingConsent:'Yes'})),/Ambiguous target Lead ID in Bookings/);
  assert.deepEqual(sheetState(h),before); assert.equal(h.w.writes.length,0); assert.equal(h.w.emails.length,0);
});

test('consented booking doPost saves three rows before cross-ID subscriber ambiguity; unchanged retry never recovers subscriber/mail', () => {
  for (const ambiguousTab of tabs) {
    const h = harness();
    const historicalId = 'TSG-OFFLINE-CONSENT-HISTORICAL';
    const request = {...base, leadId: 'TSG-OFFLINE-CONSENT-PARTIAL',
      email: 'consent-partial@example.test', marketingConsent: 'Yes',
      name: 'Synthetic Partial Booking', notes: 'New request provenance; not confirmed'};
    assert.deepEqual(h.post({...request, leadId: historicalId, name: 'Synthetic Historical Subscriber',
      notes: 'Historical staff Notes; preserve provenance'}),
    {ok: true, leadId: historicalId, status: 'New Lead'});
    assert.equal(h.w.emails.length, 1, 'Fixture setup sends only one mocked acknowledgement');
    tabs.forEach((tab, index) => h.set(tab, 'Status', ['Confirmed','Paid','Replied'][index], historicalId));
    const copy = duplicateRows(h, ambiguousTab, historicalId);
    copy[h.w.sheets.get(ambiguousTab).rows[0].indexOf('Status')] = 'Paid';
    copy[h.w.sheets.get(ambiguousTab).rows[0].indexOf('Notes')] = 'Ambiguous companion Notes; preserve provenance';
    const subscribers = h.w.sheets.get('Email Subscribers');
    subscribers.rows[0].push('Notes');
    subscribers.rows[1].push('Historical subscriber Notes; preserve provenance');
    assert.equal(h.get('Email Subscribers', 'Email', historicalId), request.email);
    const before = sheetState(h);
    const counts = Object.fromEntries(before.map(([tab, rows]) => [tab, rows.length]));
    assert.deepEqual(counts, Object.fromEntries(allTabs.map(tab =>
      [tab, tab === 'Email Subscribers' ? 2 : tab === ambiguousTab ? 3 : 2])));
    allTabs.forEach(tab => assert.equal(h.row(tab, request.leadId), undefined));
    assert.equal(h.w.properties.has('TSG_AUTOMATIC_REMINDERS_ENABLED'), false);
    h.w.writes.length = 0; h.w.emails.length = 0;

    assert.deepEqual(h.post(request), {ok: false,
      error: `Ambiguous target Lead ID in ${ambiguousTab}: multiple rows; staff review required.`});
    assert.deepEqual(h.w.writes, tabs.map(tab => ({tab, kind: 'append'})),
      'Only the three new booking rows are written before the cross-ID subscriber snapshot fails');
    for (const [tab, rows] of before) {
      assert.deepEqual(clone(h.w.sheets.get(tab).rows.slice(0, rows.length)), rows,
        `${tab}: historical rows, headers, Notes, statuses and subscriber remain unchanged`);
      assert.equal(h.w.sheets.get(tab).rows.length, counts[tab] + (tabs.includes(tab) ? 1 : 0));
    }
    tabs.forEach(tab => {
      assert.equal(h.get(tab, 'Email', request.leadId), request.email);
      assert.equal(h.get(tab, tab === 'Follow Up Status' ? 'Weekly Update Eligible' : 'Marketing Consent', request.leadId), 'Yes');
      assert.equal(h.get(tab, 'Name', request.leadId), request.name);
      assert.equal(h.get(tab, 'Notes', request.leadId), request.notes);
      assert.equal(h.get(tab, 'Status', request.leadId), 'New Lead');
      assert.match(h.get(tab, 'Legacy Review Required', request.leadId), /before confirmation\/payment/);
    });
    assert.equal(h.get('Follow Up Status', 'Last Contacted', request.leadId), '');
    assert.equal(h.row('Email Subscribers', request.leadId), undefined);
    assert.equal(h.w.emails.length, 0);
    assert.equal(h.w.held, false);

    const partial = sheetState(h); h.w.writes.length = 0;
    assert.deepEqual(h.post(request), {ok: true, leadId: request.leadId, status: 'duplicate_ignored'});
    assert.deepEqual(sheetState(h), partial, 'Unchanged same-ID retry changes no row or subscriber data');
    assert.equal(h.w.writes.length, 0);
    assert.equal(h.row('Email Subscribers', request.leadId), undefined);
    assert.equal(h.w.emails.length, 0, 'Neither failed submission nor retry sends a mocked email');
    assert.equal(h.w.created.length, 0); assert.equal(h.w.deleted.length, 0);
    assert.equal(h.w.held, false);
    assert.equal(h.w.waits, h.w.releases); assert.equal(h.w.flushes, h.w.releases);
  }
});

test('direct mutation helpers acquire one same-project lock, nested calls never reacquire', () => {
  const h = harness(); h.seed();
  const operations = [
    () => h.call('saveLead_',h.lead()),
    () => h.call('appendFollowUp_',h.spreadsheet,h.lead()),
    () => h.call('markWhatsAppOpened_',base.leadId),
    () => h.call('updateLeadStatus_',h.spreadsheet,base.leadId,'Follow Up Needed'),
    () => h.call('writeAutomaticStatus_',h.spreadsheet,base.leadId,'leads','No Response',false),
    () => h.call('runFollowUpReminders_'), () => h.call('runTSGFollowUpReminders'),
    () => h.call('writeReminderContact_',h.spreadsheet,base.leadId),
    () => h.call('sendLeadConfirmation_',h.lead()),
    () => h.call('setupTSGLeadSystem'), () => h.call('installTSGAutomationTriggers'),
    () => h.call('ensureSheet_',h.spreadsheet,h.definitions.leads),
    () => h.call('upsertSubscriber_',h.spreadsheet,h.lead({...base,marketingConsent:'Yes'})),
    () => h.call('appendMissingRecord_',h.spreadsheet,h.definitions.bookings,base.leadId,{}),
    () => h.call('writeNonStatusCell_',h.call('record_',h.w.sheets.get('Leads'),base.leadId),'WhatsApp Opened','Yes')
  ];
  for (const run of operations) {
    const before = h.w.waits; run(); assert.equal(h.w.waits,before+1); assert.equal(h.w.held,false);
  }
  assert.equal(h.w.waits,h.w.releases);
  assert.equal(h.w.flushes,h.w.releases);
  const record = h.call('record_',h.w.sheets.get('Leads'),base.leadId);
  assert.throws(() => h.call('writeNonStatusCell_',record,'Status','New Lead'),/guarded/);
  assert.equal(h.w.held,false);
});

test('two isolated executions contend on shared script lock; serialized submission/repair/tracking retry has no duplicate/mail', () => {
  const w = world(); const a = harness(source,w); const b = harness(source,w);
  let attempted = false;
  w.beforeAppend = tab => {
    if (attempted || tab !== 'Leads') return;
    attempted = true;
    assert.deepEqual(b.post(base), {ok:false,error:'MOCK lock contention'});
    assert.deepEqual(b.post({action:'whatsapp_opened',leadId:base.leadId}), {ok:false,error:'MOCK lock contention'});
    assert.equal(w.held,true,'Failed rival acquisition must not release owner lock');
  };
  assert.equal(a.post(base).ok,true); assert.equal(attempted,true);
  a.remove('Bookings'); a.set('Follow Up Status','Status','Paid');
  assert.equal(b.post(base).status,'duplicate_ignored');
  b.post({action:'whatsapp_opened',leadId:base.leadId});
  assert.equal(a.get('Bookings','Status'),'Paid');
  assert.equal(a.get('Follow Up Status','Status'),'Paid');
  tabs.forEach(tab => assert.equal(w.sheets.get(tab).rows.length,2));
  assert.equal(w.emails.length,1); assert.equal(w.held,false);
  assert.equal(w.waits,w.releases+2,'Only two refused contenders lack a release');
});

console.log(`\nPASS: ${checks} targeted offline groups (nested matrix cases included).`);
console.log('Pinned legacy contract compared; only replacement legacy source executed as candidate. Strict/new participant contract is outside this suite.');
console.log('Lock contention is simulated across isolated VM executions; no real parallel Apps Script/Google verification.');
console.log('Local source only, not deployed verification. No browser/network/Google/real mail/trigger/deployment/Git-write actions; Git reads pin the legacy comparison.');
