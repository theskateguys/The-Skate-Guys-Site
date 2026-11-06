// Complete replacement for legacy Code.gs. Never install beside the strict Code.gs.
const TSG_CONFIG = Object.freeze({
  spreadsheetIdProperty: 'TSG_LEADS_SPREADSHEET_ID',
  remindersEnabledProperty: 'TSG_AUTOMATIC_REMINDERS_ENABLED',
  replyToEmail: 'info.theskateguys@gmail.com',
  businessName: 'The Skate Guys',
  bookingUrl: 'https://the-skate-guys-site.vercel.app/book.html',
  reminderHours: 24
});
const TSG_LEGACY_HEADERS = ['Legacy Review Required'];
const TSG_SHEETS = Object.freeze({
  leads: {name: 'Leads', headers: ['Timestamp','Lead ID','Name','WhatsApp','Email','Location','Adult/Child','Package','Rentals Needed','Preferred Time','Source Page','UTM Source','UTM Campaign','Marketing Consent','WhatsApp Opened','Status','Notes','Tags','Lead Type','UTM Medium','Referrer'].concat(TSG_LEGACY_HEADERS)},
  bookings: {name: 'Bookings', headers: ['Timestamp','Lead ID','Name','WhatsApp','Email','Location','Adult/Child','Package','Rentals Needed','Preferred Time','Source Page','Marketing Consent','WhatsApp Opened','Status','Tags','Notes'].concat(TSG_LEGACY_HEADERS)},
  subscribers: {name: 'Email Subscribers', headers: ['Timestamp','Lead ID','Email','Name','Location','Source Page','Tags','Marketing Consent','Status','Last Updated']},
  followUp: {name: 'Follow Up Status', headers: ['Lead ID','Email','Name','WhatsApp','Lead Type','Status','First Follow Up Due','Reminder Due','Weekly Update Eligible','Last Contacted','Notes'].concat(TSG_LEGACY_HEADERS)}
});
const TSG_STATUS_KEYS = ['leads','bookings','followUp'];
const TSG_AUTOMATIC_STATES = ['New Lead','WhatsApp Opened','No Response','Follow Up Needed'];
const TSG_FIELD_HEADERS = {
  timestamp: 'Timestamp', leadId: 'Lead ID', name: 'Name', whatsapp: 'WhatsApp', email: 'Email',
  location: 'Location', skaterType: 'Adult/Child', package: 'Package', rentalsNeeded: 'Rentals Needed',
  preferredTime: 'Preferred Time', sourcePage: 'Source Page', utmSource: 'UTM Source',
  utmCampaign: 'UTM Campaign', marketingConsent: 'Marketing Consent', whatsappOpened: 'WhatsApp Opened',
  notes: 'Notes', tags: 'Tags', leadType: 'Lead Type', utmMedium: 'UTM Medium', referrer: 'Referrer'
};
// Apps Script globals are execution-local. Other executions still acquire the project lock.
let TSG_LOCK_DEPTH = 0;
function withScriptLock_(work) {
  if (TSG_LOCK_DEPTH) return work();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  TSG_LOCK_DEPTH = 1;
  try { return work(); }
  finally {
    try { SpreadsheetApp.flush(); }
    finally { TSG_LOCK_DEPTH = 0; lock.releaseLock(); }
  }
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('TSG Leads')
    .addItem('Set up lead system', 'setupTSGLeadSystem')
    .addItem('Install follow-up trigger', 'installTSGAutomationTriggers')
    .addItem('Run follow-up check now', 'runTSGFollowUpReminders').addToUi();
}
function setupTSGLeadSystem() {
  return withScriptLock_(() => {
    const spreadsheet = getSpreadsheet_();
    preflight_(spreadsheet);
    Object.keys(TSG_SHEETS).forEach(key => ensureSheet_(spreadsheet, TSG_SHEETS[key]));
    installTSGAutomationTriggers();
    return 'TSG lead system is ready.';
  });
}
function automaticRemindersEnabled_() {
  return PropertiesService.getScriptProperties().getProperty(TSG_CONFIG.remindersEnabledProperty) === 'true';
}
function installTSGAutomationTriggers() {
  return withScriptLock_(() => {
    ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'runTSGFollowUpReminders')
      .forEach(t => ScriptApp.deleteTrigger(t));
    if (!automaticRemindersEnabled_()) return;
    ScriptApp.newTrigger('runTSGFollowUpReminders').timeBased().everyDays(1).atHour(10).create();
  });
}
function doGet() {
  return jsonResponse_({ok: true, service: 'TSG Website Leads', timestamp: new Date().toISOString()});
}
function doPost(event) {
  try {
    const payload = parsePayload_(event);
    if (payload.action === 'whatsapp_opened') return markWhatsAppOpened_(payload.leadId);
    if (payload.action !== 'lead_submit') throw new Error('Unsupported action.');
    if (payload.website) return jsonResponse_({ok: true});
    const lead = normalizeLead_(payload);
    validateLead_(lead);
    return withScriptLock_(() => {
      const result = saveLead_(lead);
      if (result.status !== 'duplicate_ignored') sendLeadConfirmation_(lead);
      return jsonResponse_({ok: true, leadId: lead.leadId, status: result.status});
    });
  } catch (error) {
    // Avoid logging payloads/contact details, including service error messages.
    return jsonResponse_({ok: false, error: String(error.message || error)});
  }
}
function parsePayload_(event) {
  if (!event || !event.postData || !event.postData.contents) throw new Error('Missing request body.');
  return JSON.parse(event.postData.contents);
}
function normalizeLead_(payload) {
  const clean = value => sanitizeCell_(String(value || '').trim());
  return {
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    leadId: clean(payload.leadId), leadType: clean(payload.leadType || 'email'),
    name: clean(payload.name), whatsapp: clean(payload.whatsapp), email: clean(payload.email).toLowerCase(),
    location: clean(payload.location), skaterType: clean(payload.skaterType), package: clean(payload.package),
    rentalsNeeded: clean(payload.rentalsNeeded), preferredTime: clean(payload.preferredTime),
    sourcePage: clean(payload.sourcePage), utmSource: clean(payload.utmSource), utmCampaign: clean(payload.utmCampaign),
    utmMedium: clean(payload.utmMedium), referrer: clean(payload.referrer),
    marketingConsent: payload.marketingConsent === 'Yes' ? 'Yes' : 'No', whatsappOpened: 'No',
    status: 'New Lead', notes: clean(payload.notes), tags: clean(payload.tags)
  };
}
function validateLead_(lead) {
  // Deliberately the legacy email/booking envelope, not the strict participant validator.
  if (!lead.leadId) throw new Error('Lead ID is required.');
  // Cell escaping must not turn a missing local part into a valid address.
  const email = lead.email.replace(/^'(?=[=+\-@])/, '');
  if ((email || lead.leadType !== 'booking') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email is required.');
  if (lead.leadType === 'booking' && (!lead.name || !lead.whatsapp || !lead.package)) throw new Error('Booking name, WhatsApp and package are required.');
  if (lead.leadType !== 'booking' && lead.marketingConsent !== 'Yes') throw new Error('Email consent is required.');
  if (Number.isNaN(new Date(lead.timestamp).getTime())) throw new Error('Valid timestamp required.');
}
function sanitizeCell_(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value.slice(0, 1000);
}
function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(TSG_CONFIG.spreadsheetIdProperty);
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error(`Set the ${TSG_CONFIG.spreadsheetIdProperty} script property before deploying.`);
}
function headers_(sheet) {
  const headers = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0] : [];
  const seen = Object.create(null);
  headers.forEach(header => {
    const key = String(header).trim().toLowerCase();
    if (!key || seen[key] || header !== String(header).trim()) throw new Error('Ambiguous sheet headers; staff review required.');
    seen[key] = true;
  });
  return headers;
}
function inspectSheet_(sheet, definition) {
  if (!sheet) return;
  const headers = headers_(sheet);
  definition.headers.forEach(header => {
    if (headers.some(h => h.toLowerCase() === header.toLowerCase() && h !== header)) throw new Error('Ambiguous sheet headers; staff review required.');
  });
  if (sheet.getLastRow() < 2) return;
  const required = definition.name === TSG_SHEETS.subscribers.name ? ['Lead ID','Email','Status'] : ['Lead ID','Status'];
  if (required.some(header => !headers.includes(header))) throw new Error('Missing identity/status header; staff review required.');
}
function preflight_(spreadsheet) {
  Object.keys(TSG_SHEETS).forEach(key => inspectSheet_(spreadsheet.getSheetByName(TSG_SHEETS[key].name), TSG_SHEETS[key]));
}
function ensureSheet_(spreadsheet, definition) {
  return withScriptLock_(() => {
    preflight_(spreadsheet);
    let sheet = spreadsheet.getSheetByName(definition.name);
    if (!sheet) sheet = spreadsheet.insertSheet(definition.name);
    inspectSheet_(sheet, definition);
    const headers = headers_(sheet);
    const missing = definition.headers.filter(header => !headers.includes(header));
    const width = headers.length + missing.length;
    if (width > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
    if (missing.length) sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    return sheet;
  });
}
function record_(sheet, leadId) {
  if (!sheet || sheet.getLastRow() < 2) return null;
  const headers = headers_(sheet);
  const idColumn = headers.indexOf('Lead ID');
  if (idColumn < 0) throw new Error('Missing identity/status header; staff review required.');
  const ids = sheet.getRange(2, idColumn + 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
  const matches = ids.map((id, i) => String(id).trim() === String(leadId).trim() ? i + 2 : 0).filter(Boolean);
  if (matches.length > 1) {
    const error = new Error(`Ambiguous target Lead ID in ${sheet.getName()}: multiple rows; staff review required.`);
    error.code = 'TSG_AMBIGUOUS_LEAD_ID';
    throw error;
  }
  if (!matches.length) return null;
  const row = matches[0];
  const values = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
  const data = {};
  headers.forEach((header, column) => { data[header] = values[column]; });
  return {sheet: sheet, row: row, headers: headers, data: data};
}
function snapshot_(spreadsheet, leadId) {
  preflight_(spreadsheet);
  // Resolve every companion before any target write, including subscriber-only ambiguity.
  const records = {};
  Object.keys(TSG_SHEETS).forEach(key => {
    records[key] = record_(spreadsheet.getSheetByName(TSG_SHEETS[key].name), leadId);
  });
  return TSG_STATUS_KEYS.map(key => records[key]);
}
function status_(record) { return record ? String(record.data['Status'] || '').trim() : ''; }
function inheritedStatus_(snapshot) {
  const statuses = snapshot.filter(Boolean).map(status_);
  for (const state of ['Paid','Confirmed','Replied']) if (statuses.includes(state)) return state;
  return statuses.find(state => !TSG_AUTOMATIC_STATES.includes(state)) ||
    ['Follow Up Needed','No Response','WhatsApp Opened'].find(state => statuses.includes(state)) || 'New Lead';
}
function automaticChangeAllowed_(snapshot) {
  return snapshot.filter(Boolean).every(record => TSG_AUTOMATIC_STATES.includes(status_(record)));
}
function canonicalLead_(lead, snapshot) {
  const existing = snapshot.find(Boolean);
  if (!existing) return lead;
  const canonical = Object.assign({}, lead);
  Object.keys(TSG_FIELD_HEADERS).forEach(field => {
    const header = TSG_FIELD_HEADERS[field];
    if (Object.prototype.hasOwnProperty.call(existing.data, header)) canonical[field] = existing.data[header];
  });
  canonical.leadId = lead.leadId;
  if (snapshot[1] || snapshot[2]) canonical.leadType = 'booking';
  if (!Object.prototype.hasOwnProperty.call(existing.data, 'Timestamp')) canonical.timestamp = existing.data['First Follow Up Due'] || lead.timestamp;
  return canonical;
}
function legacyValues_(lead) {
  const values = {};
  Object.keys(TSG_FIELD_HEADERS).forEach(field => { values[TSG_FIELD_HEADERS[field]] = lead[field]; });
  values['Status'] = 'New Lead';
  values['Legacy Review Required'] = lead.leadType === 'booking'
    ? 'Yes - reconcile historical offer and collect participant details before confirmation/payment.' : 'No';
  return values;
}
function appendMissingRecord_(spreadsheet, definition, leadId, values) {
  return withScriptLock_(() => {
    snapshot_(spreadsheet, leadId);
    const sheet = ensureSheet_(spreadsheet, definition);
    if (record_(sheet, leadId)) return false;
    const headers = headers_(sheet);
    const fresh = snapshot_(spreadsheet, leadId);
    if (record_(sheet, leadId)) return false;
    const mapped = Object.assign({}, values, {'Lead ID': leadId, 'Status': inheritedStatus_(fresh)});
    // A genuinely new row only: existing/custom/formula cells are never rewritten.
    sheet.appendRow(headers.map(header => Object.prototype.hasOwnProperty.call(mapped, header) ? mapped[header] : ''));
    return true;
  });
}
function saveLead_(lead) {
  return withScriptLock_(() => {
    validateLead_(lead);
    const spreadsheet = getSpreadsheet_();
    const before = snapshot_(spreadsheet, lead.leadId);
    const duplicate = before.some(Boolean);
    const original = canonicalLead_(lead, before);
    const values = legacyValues_(original);
    appendMissingRecord_(spreadsheet, TSG_SHEETS.leads, lead.leadId, values);
    if (original.leadType === 'booking') {
      appendMissingRecord_(spreadsheet, TSG_SHEETS.bookings, lead.leadId, values);
      appendFollowUp_(spreadsheet, original);
    }
    // A duplicate is not a consent/subscriber recovery operation.
    if (!duplicate && original.email && original.marketingConsent === 'Yes') upsertSubscriber_(spreadsheet, original);
    return {status: duplicate ? 'duplicate_ignored' : 'New Lead'};
  });
}
function appendFollowUp_(spreadsheet, lead) {
  return withScriptLock_(() => {
    const before = snapshot_(spreadsheet, lead.leadId);
    const original = canonicalLead_(lead, before);
    const values = legacyValues_(original);
    const created = new Date(original.timestamp);
    Object.assign(values, {'First Follow Up Due': created,
      'Reminder Due': new Date(created.getTime() + TSG_CONFIG.reminderHours * 3600000),
      'Weekly Update Eligible': original.marketingConsent === 'Yes' ? 'Yes' : 'No', 'Last Contacted': ''});
    return appendMissingRecord_(spreadsheet, TSG_SHEETS.followUp, lead.leadId, values);
  });
}
function writeNonStatusCell_(record, header, value) {
  return withScriptLock_(() => {
    if (['Status','Lead ID','Last Contacted'].includes(header)) throw new Error('Use a guarded status/identity writer.');
    snapshot_(record.sheet.getParent(), record.data['Lead ID']);
    const headers = headers_(record.sheet);
    const column = headers.indexOf(header) + 1;
    if (!column) throw new Error('Missing write header; staff review required.');
    const identity = record_(record.sheet, record.data['Lead ID']);
    if (!identity || identity.row !== record.row) throw new Error('Row identity changed; retry after staff review.');
    const cell = record.sheet.getRange(record.row, column);
    if (cell.getFormula()) return false;
    cell.setValue(value);
    return true;
  });
}
function upsertSubscriber_(spreadsheet, lead) {
  return withScriptLock_(() => {
    if (!lead.email || lead.marketingConsent !== 'Yes') return;
    snapshot_(spreadsheet, lead.leadId);
    let sheet = spreadsheet.getSheetByName(TSG_SHEETS.subscribers.name);
    const existingHeaders = sheet ? headers_(sheet) : [];
    const emails = sheet && sheet.getLastRow() > 1 ? sheet.getRange(2, existingHeaders.indexOf('Email') + 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat() : [];
    const matches = emails.map((value, i) => String(value).trim().toLowerCase() === lead.email.toLowerCase() ? i + 2 : 0).filter(Boolean);
    if (matches.length > 1) throw new Error('Duplicate subscriber email; staff review required.');
    // Email upserts may address a different historical ID; isolate that identity too.
    if (matches.length) snapshot_(spreadsheet, sheet.getRange(matches[0], existingHeaders.indexOf('Lead ID') + 1).getValue());
    sheet = ensureSheet_(spreadsheet, TSG_SHEETS.subscribers);
    const headers = headers_(sheet);
    const values = {'Timestamp': lead.timestamp, 'Lead ID': lead.leadId, 'Email': lead.email,
      'Name': lead.name, 'Location': lead.location, 'Source Page': lead.sourcePage, 'Tags': lead.tags,
      'Marketing Consent': 'Yes', 'Status': 'Subscribed', 'Last Updated': new Date()};
    if (!matches.length) {
      sheet.appendRow(headers.map(header => Object.prototype.hasOwnProperty.call(values, header) ? values[header] : ''));
    } else {
      // Preserve existing identity, timestamp, consent/status, Notes and every formula.
      const record = {sheet: sheet, row: matches[0], data: {'Lead ID': sheet.getRange(matches[0], headers.indexOf('Lead ID') + 1).getValue()}};
      ['Name','Location','Source Page','Tags','Last Updated'].forEach(header => writeNonStatusCell_(record, header, values[header]));
    }
  });
}
function writeAutomaticStatus_(spreadsheet, leadId, key, target, onlyNew) {
  return withScriptLock_(() => {
    if (!['WhatsApp Opened','Follow Up Needed','No Response'].includes(target)) return false;
    const fresh = snapshot_(spreadsheet, leadId);
    if (!automaticChangeAllowed_(fresh)) return false;
    const record = fresh[TSG_STATUS_KEYS.indexOf(key)];
    if (!record) return false;
    const cell = record.sheet.getRange(record.row, record.headers.indexOf('Status') + 1);
    if (cell.getFormula()) return false;
    const current = String(cell.getValue() || '').trim();
    if (!TSG_AUTOMATIC_STATES.includes(current) || (onlyNew && current !== 'New Lead')) return false;
    cell.setValue(target);
    return true;
  });
}
function markWhatsAppOpened_(leadId) {
  if (!leadId) throw new Error('Lead ID is required.');
  return withScriptLock_(() => {
    const spreadsheet = getSpreadsheet_();
    snapshot_(spreadsheet, leadId);
    ['leads','bookings'].forEach(key => {
      const record = record_(spreadsheet.getSheetByName(TSG_SHEETS[key].name), leadId);
      if (!record) return;
      if (!record.headers.includes('WhatsApp Opened')) ensureSheet_(spreadsheet, TSG_SHEETS[key]);
      writeNonStatusCell_(record, 'WhatsApp Opened', 'Yes');
      writeAutomaticStatus_(spreadsheet, leadId, key, 'WhatsApp Opened', true);
    });
    // Exact legacy response, including for an unknown ID (not a booking confirmation).
    return jsonResponse_({ok: true, leadId: leadId, status: 'WhatsApp Opened'});
  });
}
function updateLeadStatus_(spreadsheet, leadId, status) {
  return withScriptLock_(() => {
    TSG_STATUS_KEYS.forEach(key => writeAutomaticStatus_(spreadsheet, leadId, key, status, status === 'WhatsApp Opened'));
  });
}
function sendLeadConfirmation_(lead) {
  return withScriptLock_(() => {
    const spreadsheet = getSpreadsheet_();
    const before = snapshot_(spreadsheet, lead.leadId);
    const record = before[0];
    if (!record || !automaticChangeAllowed_(before)) return;
    const original = canonicalLead_(lead, before);
    if (!original.email) return;
    const booking = original.leadType === 'booking';
    if ((booking && before.some(record => !record)) || before.filter(Boolean).some(record =>
      String(record.data.Email || '').trim().toLowerCase() !== original.email.toLowerCase())) return;
    const message = {
      to: original.email, replyTo: TSG_CONFIG.replyToEmail, name: TSG_CONFIG.businessName,
      subject: booking ? 'We received your TSG booking request' : 'You are on the TSG update list',
      body: booking
        ? `Hi ${original.name || 'there'},\n\nWe received your legacy booking request (${original.leadId}). This is not a confirmed class. Historical package/time preferences are requests only, not an agreed price or appointment.\n\nThe current offer is a single session: TT$80 per person / 75 minutes / skate rental included. TSG must collect participant details and check coach, location and skate availability before confirming or arranging payment. No payment has been taken. Please continue with the TSG team on WhatsApp.\n\nThe Skate Guys`
        : 'Welcome to the TSG update list. We will send useful class, event and merch updates.\n\nThe Skate Guys'
    };
    const fresh = snapshot_(spreadsheet, lead.leadId);
    if (!automaticChangeAllowed_(fresh) || !fresh[0] || (booking && fresh.some(record => !record)) ||
        fresh.filter(Boolean).some(record => String(record.data.Email || '').trim().toLowerCase() !== original.email.toLowerCase())) return;
    MailApp.sendEmail(message);
  });
}
function reminderCandidate_(spreadsheet, leadId) {
  if (!automaticRemindersEnabled_()) return null;
  const before = snapshot_(spreadsheet, leadId);
  if (before.some(record => !record) || !automaticChangeAllowed_(before)) return null;
  const followUp = record_(spreadsheet.getSheetByName(TSG_SHEETS.followUp.name), leadId);
  if (!followUp || !followUp.headers.includes('Last Contacted')) return null;
  const after = snapshot_(spreadsheet, leadId);
  const signature = records => JSON.stringify(records.map(record => record && record.data));
  if (signature(before) !== signature(after) || !automaticChangeAllowed_(after)) return null;
  const data = followUp.data;
  const email = String(data.Email || '').trim();
  const due = new Date(data['Reminder Due']);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      after.some(record => String(record.data.Email || '').trim().toLowerCase() !== email.toLowerCase()) ||
      data['Last Contacted'] || !data['Reminder Due'] || Number.isNaN(due.getTime()) || due > new Date()) return null;
  // Check the actual identity/contact cells on every candidate read, including the final pre-send read.
  const identity = followUp.sheet.getRange(followUp.row, followUp.headers.indexOf('Lead ID') + 1);
  const contact = followUp.sheet.getRange(followUp.row, followUp.headers.indexOf('Last Contacted') + 1);
  if (String(identity.getValue()).trim() !== String(leadId).trim() ||
      contact.getValue() !== '' || contact.getFormula()) return null;
  return {email: email, name: data.Name, signature: signature(after)};
}
function runTSGFollowUpReminders() {
  return withScriptLock_(() => {
    if (!automaticRemindersEnabled_()) return;
    return runFollowUpReminders_();
  });
}
function writeReminderContact_(spreadsheet, leadId) {
  return withScriptLock_(() => {
    const candidate = reminderCandidate_(spreadsheet, leadId);
    if (!candidate) return false;
    const record = record_(spreadsheet.getSheetByName(TSG_SHEETS.followUp.name), leadId);
    const cell = record.sheet.getRange(record.row, record.headers.indexOf('Last Contacted') + 1);
    if (cell.getFormula()) return false;
    if (!reminderCandidate_(spreadsheet, leadId) || cell.getValue()) return false;
    cell.setValue(new Date());
    return true;
  });
}
function runFollowUpReminders_() {
  return withScriptLock_(() => {
    if (!automaticRemindersEnabled_()) return;
    const spreadsheet = getSpreadsheet_();
    preflight_(spreadsheet);
    const sheet = spreadsheet.getSheetByName(TSG_SHEETS.followUp.name);
    if (!sheet || sheet.getLastRow() < 2) return;
    const headers = headers_(sheet);
    const ids = sheet.getRange(2, headers.indexOf('Lead ID') + 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
    ids.filter(Boolean).forEach(leadId => {
      try {
        const candidate = reminderCandidate_(spreadsheet, leadId);
        if (!candidate) return;
        const fresh = reminderCandidate_(spreadsheet, leadId);
        if (!fresh || fresh.signature !== candidate.signature || !automaticRemindersEnabled_()) return;
        MailApp.sendEmail({to: fresh.email, replyTo: TSG_CONFIG.replyToEmail, name: TSG_CONFIG.businessName,
          subject: 'Still ready to roll with TSG?',
          body: `Hi ${fresh.name || 'there'},\n\nYour legacy booking request (${leadId}) is not a confirmed class. Please reply so TSG can collect participant details and check availability. The current single session is TT$80 per person / 75 minutes / skate rental included; historical package preferences are not an agreed price. No payment has been taken.\n\nThe Skate Guys`});
        // A human can edit during sendEmail; never overwrite their resulting state.
        const after = reminderCandidate_(spreadsheet, leadId);
        if (!after || after.signature !== fresh.signature) return;
        updateLeadStatus_(spreadsheet, leadId, 'Follow Up Needed');
        const latest = reminderCandidate_(spreadsheet, leadId);
        if (!latest) return;
        writeReminderContact_(spreadsheet, leadId);
      } catch (error) {
        // One ambiguous identity must not starve unrelated reminders; schema failures still abort.
        if (error.code !== 'TSG_AMBIGUOUS_LEAD_ID') throw error;
      }
    });
  });
}
function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
