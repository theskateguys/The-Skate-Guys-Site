// In-memory Apps Script tests. No Google services, email, or network requests.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

class Sheet {
  constructor(name, rows = []) { this.name = name; this.rows = rows; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return Math.max(0, ...this.rows.map(row => row.length)); }
  getMaxRows() { return 1000; }
  getMaxColumns() { return 26; }
  insertColumnsAfter() {}
  getFilter() { return true; }
  setFrozenRows() {}
  appendRow(row) { this.rows.push([...row]); }
  getRange(row, column, height = 1, width = 1) {
    assert.ok(row > 0 && column > 0);
    const read = () => Array.from({length: height}, (_, r) => Array.from({length: width}, (_, c) => this.rows[row - 1 + r]?.[column - 1 + c] ?? ''));
    const write = values => values.forEach((cells, r) => cells.forEach((value, c) => {
      this.rows[row - 1 + r] ||= [];
      this.rows[row - 1 + r][column - 1 + c] = value;
    }));
    const range = {
      getValues: read, getDisplayValues: () => read().map(cells => cells.map(String)),
      getValue: () => read()[0][0], setValue: value => write([[value]]), setValues: write,
      setFontWeight: () => range, setBackground: () => range, setFontColor: () => range,
      setDataValidation: () => range, createFilter: () => range
    };
    return range;
  }
}

const sheets = new Map();
const spreadsheet = {
  getSheetByName: name => sheets.get(name),
  insertSheet: name => { const sheet = new Sheet(name); sheets.set(name, sheet); return sheet; }
};
const emails = [];
const properties = new Map([['TSG_LEADS_SPREADSHEET_ID', 'test-only']]);
const removedTriggers = [];
const createdTriggers = [];
const oldReminderTrigger = {getHandlerFunction: () => 'runTSGFollowUpReminders'};
const unrelatedTrigger = {getHandlerFunction: () => 'unrelatedTask'};
const triggerBuilder = {timeBased() { return this; }, everyDays() { return this; }, atHour() { return this; }, create() { createdTriggers.push('runTSGFollowUpReminders'); }};
const rule = {requireValueInList() { return this; }, setAllowInvalid() { return this; }, build() { return this; }};
const context = vm.createContext({
  console: {error() {}, log() {}},
  PropertiesService: {getScriptProperties: () => ({getProperty: name => properties.get(name) || null})},
  ScriptApp: {getProjectTriggers: () => [oldReminderTrigger, unrelatedTrigger], deleteTrigger: trigger => removedTriggers.push(trigger), newTrigger: () => triggerBuilder},
  SpreadsheetApp: {openById: () => spreadsheet, newDataValidation: () => rule},
  LockService: {getScriptLock: () => ({waitLock() {}, releaseLock() {}})},
  MailApp: {sendEmail: message => emails.push(message)},
  Utilities: {base64Decode: value => Buffer.from(value, 'base64'), newBlob: (bytes, type, name) => ({bytes, type, name})},
  ContentService: {MimeType: {JSON: 'json'}, createTextOutput: content => ({setMimeType: () => JSON.parse(content)})}
});
vm.runInContext(await fs.readFile('automation/google-apps-script/Code.gs', 'utf8'), context);
vm.runInContext(await fs.readFile('automation/google-apps-script/EmailLogo.gs', 'utf8'), context);
const call = (name, ...args) => context[name](...args);
const post = payload => call('doPost', {postData: {contents: JSON.stringify(payload)}});
const base = {
  action: 'lead_submit', leadType: 'booking', leadId: 'TSG-MOCK-1', timestamp: '2026-01-01T12:00:00Z',
  name: 'Synthetic Test', whatsapp: '+18685550100', email: 'synthetic@example.test',
  location: 'Tobago', preferredArea: 'Black Rock', preferredDate: '2027-01-05', preferredTime: '10:30',
  participantCount: 2, participants: [
    {age: 30, experience: 'Beginner', rentals: 'No'},
    {age: 12, experience: 'First time', rentals: 'Yes', skateSize: '5', sizeSystem: 'UK child', guardianName: 'Synthetic Guardian', guardianPhone: '+18685550100'}
  ], marketingConsent: 'No', utmSource: 'mock', utmCampaign: 'booking-check', sourcePage: 'book.html'
};
const rowFor = (name, id) => {
  const sheet = sheets.get(name);
  return sheet?.rows.slice(1).find(row => row[sheet.rows[0].indexOf('Lead ID')] === id);
};
const get = (name, id, header) => rowFor(name, id)?.[sheets.get(name).rows[0].indexOf(header)];
const set = (name, id, header, value) => { rowFor(name, id)[sheets.get(name).rows[0].indexOf(header)] = value; };

assert.equal(post(base).ok, true);
for (const name of ['Leads', 'Bookings', 'Follow Up Status']) assert.equal(sheets.get(name).rows.length, 2);
assert.equal(sheets.has('Email Subscribers'), false);
assert.equal(get('Leads', base.leadId, 'Participant Count'), 2);
assert.equal(JSON.parse(get('Bookings', base.leadId, 'Participants JSON'))[1].sizeSystem, 'UK child');
assert.equal(get('Leads', base.leadId, 'UTM Campaign'), 'booking-check');
assert.match(get('Leads', base.leadId, 'Package'), /TT\$80/);
assert.equal(post(base).status, 'duplicate_ignored');
for (const name of ['Leads', 'Bookings', 'Follow Up Status']) assert.equal(sheets.get(name).rows.length, 2);
assert.equal(emails.length, 1, 'Duplicate retries do not resend confirmation');
assert.match(emails[0].body, /genuine emergencies reviewed individually/);
assert.match(emails[0].body, /We'll confirm your revised credit expiry with you/);
assert.match(emails[0].body, /without penalty/);

// Absent or explicitly false opt-in disables both trigger installation and execution.
for (const setting of [undefined, 'false']) {
  if (setting === undefined) properties.delete('TSG_AUTOMATIC_REMINDERS_ENABLED');
  else properties.set('TSG_AUTOMATIC_REMINDERS_ENABLED', setting);
  const before = emails.length;
  call('installTSGAutomationTriggers');
  assert.equal(createdTriggers.length, 0, 'No reminder trigger installed while disabled');
  call('runTSGFollowUpReminders');
  assert.equal(emails.length, before, 'Disabled reminders cannot send email');
  assert.equal(get('Bookings', base.leadId, 'Status'), 'New Lead');
}
assert.ok(removedTriggers.every(trigger => trigger === oldReminderTrigger), 'Only reminder triggers removed');
properties.set('TSG_AUTOMATIC_REMINDERS_ENABLED', 'true');
call('installTSGAutomationTriggers');
assert.equal(createdTriggers.length, 1, 'Explicit opt-in can install the reminder trigger');

// Partial-write repair must keep an existing confirmed record untouched.
set('Leads', base.leadId, 'Status', 'Paid');
sheets.get('Bookings').rows.splice(1, 1);
sheets.get('Follow Up Status').rows.splice(1, 1);
assert.equal(post(base).status, 'duplicate_ignored');
assert.equal(get('Bookings', base.leadId, 'Status'), 'Paid');
assert.equal(get('Follow Up Status', base.leadId, 'Status'), 'Paid');

for (const protectedTab of ['Leads', 'Bookings', 'Follow Up Status']) {
  for (const status of ['Confirmed', 'Paid', 'Replied']) {
    for (const tab of ['Leads', 'Bookings', 'Follow Up Status']) set(tab, base.leadId, 'Status', 'New Lead');
    set(protectedTab, base.leadId, 'Status', status);
    post({action: 'whatsapp_opened', leadId: base.leadId});
    assert.equal(get(protectedTab, base.leadId, 'Status'), status);
    const emailCount = emails.length;
    call('runTSGFollowUpReminders');
    assert.equal(emails.length, emailCount, `No reminder when ${protectedTab} is ${status}`);
    assert.equal(get(protectedTab, base.leadId, 'Status'), status);
  }
}
for (const tab of ['Leads', 'Bookings', 'Follow Up Status']) set(tab, base.leadId, 'Status', 'New Lead');
post({action: 'whatsapp_opened', leadId: base.leadId});
assert.equal(get('Bookings', base.leadId, 'Status'), 'WhatsApp Opened');
call('runTSGFollowUpReminders');
assert.equal(get('Bookings', base.leadId, 'Status'), 'Follow Up Needed');
const sent = emails.length;
call('runTSGFollowUpReminders');
assert.equal(emails.length, sent, 'Reminder sent only once');

assert.equal(post({...base, leadId: 'TSG-NO-EMAIL', email: ''}).ok, true);
assert.equal(post({...base, leadId: 'TSG-SOLO', participantCount: 1, participants: [base.participants[0]]}).ok, true);
assert.equal(post({...base, leadId: 'TSG-OPTIN', marketingConsent: 'Yes'}).ok, true);
assert.equal(sheets.get('Email Subscribers').rows.length, 2);
// Batch updates must skip custom/formula columns, including ones between owned columns.
const subscribers = sheets.get('Email Subscribers');
subscribers.rows[0].splice(3, 0, 'Custom Formula', 'Custom Literal');
subscribers.rows[1].splice(3, 0, '=1+1', 'keep staff value');
assert.equal(post({...base, leadId: 'TSG-OPTIN-UPDATE', marketingConsent: 'Yes', name: 'Updated Synthetic'}).ok, true);
assert.equal(subscribers.rows.length, 2);
assert.equal(subscribers.rows[1][3], '=1+1');
assert.equal(subscribers.rows[1][4], 'keep staff value');
assert.equal(get('Email Subscribers', 'TSG-OPTIN-UPDATE', 'Name'), 'Updated Synthetic');
assert.equal(post({...base, leadId: 'TSG-OPTIN', marketingConsent: 'Yes'}).status, 'duplicate_ignored');
assert.equal(sheets.get('Email Subscribers').rows.length, 2);
for (const mutation of [
  {participantCount: 3}, {preferredDate: '2027-02-30'}, {whatsapp: 'bad'},
  {email: '', marketingConsent: 'Yes'}, {preferredTime: '25:00'},
  {participants: [{...base.participants[1], skateSize: ''}], participantCount: 1},
  {participants: [{...base.participants[1], sizeSystem: ''}], participantCount: 1},
  {participants: [{...base.participants[1], guardianPhone: ''}], participantCount: 1}
]) assert.equal(post({...base, leadId: 'TSG-INVALID', ...mutation}).ok, false);

// Existing records and extra/reordered columns survive header migration and writes.
const old = ['Notes','Lead ID','Name','Status','Custom Staff Column'];
const oldRow = ['keep note','LEGACY-1','Legacy Customer','Confirmed','keep custom'];
sheets.set('Leads', new Sheet('Leads', [old.slice(), oldRow.slice()]));
assert.equal(post({...base, leadId: 'TSG-MIGRATION'}).ok, true);
assert.deepEqual(sheets.get('Leads').rows[0].slice(0, old.length), old);
assert.deepEqual(sheets.get('Leads').rows[1], oldRow);
assert.equal(get('Leads', 'TSG-MIGRATION', 'Preferred Area'), 'Black Rock');
call('applyValidations_', spreadsheet);

// Newsletter copy stays separate from the approved booking acknowledgement.
const bookingAcknowledgement = call('buildBookingAcknowledgement_', call('normalizeLead_', base));
assert.equal(bookingAcknowledgement.subject, emails[0].subject);
assert.equal(bookingAcknowledgement.body, emails[0].body);
assert.equal(bookingAcknowledgement.htmlBody, emails[0].htmlBody);
const beforeWelcome = emails.length;
call('sendLeadConfirmation_', {...base, leadType: 'email'});
assert.equal(emails.length, beforeWelcome + 1);
const welcome = emails.at(-1);
assert.equal(welcome.subject, 'You are on the TSG update list');
assert.equal(welcome.body, 'Welcome to the TSG update list. We will send useful class, event and merch updates.\n\nThe Skate Guys');
assert.doesNotMatch(welcome.body, /Elite/i);
assert.equal(welcome.htmlBody, undefined);
assert.equal(welcome.inlineImages, undefined);
assert.deepEqual(call('buildBookingAcknowledgement_', call('normalizeLead_', base)), bookingAcknowledgement);
console.log('PASS: mocked Apps Script storage, duplicate retries/repair, optional consent/email, participant validation, legacy schema preservation and protected status transitions. No Google Sheet save was performed.');
console.log('PASS: mocked newsletter welcome promises class, event and merch updates only; booking acknowledgement unchanged. No real email sent.');
