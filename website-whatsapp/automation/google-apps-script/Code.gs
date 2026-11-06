const TSG_CONFIG = Object.freeze({
  spreadsheetIdProperty: 'TSG_LEADS_SPREADSHEET_ID',
  replyToEmail: 'info.theskateguys@gmail.com',
  businessName: 'The Skate Guys',
  bookingUrl: 'https://the-skate-guys-site.vercel.app/book.html',
  reminderHours: 24
});

const TSG_SHEETS = Object.freeze({
  leads: {
    name: 'Leads',
    headers: ['Timestamp','Lead ID','Name','WhatsApp','Email','Location','Adult/Child','Package','Rentals Needed','Preferred Time','Source Page','UTM Source','UTM Campaign','Marketing Consent','WhatsApp Opened','Status','Notes','Tags','Lead Type','UTM Medium','Referrer']
  },
  bookings: {
    name: 'Bookings',
    headers: ['Timestamp','Lead ID','Name','WhatsApp','Email','Location','Adult/Child','Package','Rentals Needed','Preferred Time','Source Page','Marketing Consent','WhatsApp Opened','Status','Tags','Notes']
  },
  subscribers: {
    name: 'Email Subscribers',
    headers: ['Timestamp','Lead ID','Email','Name','Location','Source Page','Tags','Marketing Consent','Status','Last Updated']
  },
  followUp: {
    name: 'Follow Up Status',
    headers: ['Lead ID','Email','Name','WhatsApp','Lead Type','Status','First Follow Up Due','Reminder Due','Weekly Update Eligible','Last Contacted','Notes']
  }
});

const TSG_STATUSES = ['New Lead','WhatsApp Opened','Replied','Confirmed','Paid','No Response','Follow Up Needed'];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('TSG Leads')
    .addItem('Set up lead system', 'setupTSGLeadSystem')
    .addItem('Install follow-up trigger', 'installTSGAutomationTriggers')
    .addItem('Run follow-up check now', 'runTSGFollowUpReminders')
    .addToUi();
}

function setupTSGLeadSystem() {
  const spreadsheet = getSpreadsheet_();
  Object.keys(TSG_SHEETS).forEach(key => ensureSheet_(spreadsheet, TSG_SHEETS[key]));
  applyValidations_(spreadsheet);
  installTSGAutomationTriggers();
  return 'TSG lead system is ready.';
}

function installTSGAutomationTriggers() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'runTSGFollowUpReminders')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('runTSGFollowUpReminders')
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .create();
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

    const lock = LockService.getScriptLock();
    let result;
    lock.waitLock(10000);
    try {
      result = saveLead_(lead);
    } finally {
      lock.releaseLock();
    }

    if (result.status === 'duplicate_ignored') {
      return jsonResponse_({ok: true, leadId: lead.leadId, status: 'duplicate_ignored'});
    }

    sendLeadConfirmation_(lead);
    return jsonResponse_({ok: true, leadId: lead.leadId, status: result.status});
  } catch (error) {
    console.error(error);
    return jsonResponse_({ok: false, error: String(error.message || error)});
  }
}

function saveLead_(lead) {
  const spreadsheet = getSpreadsheet_();
  const leadsSheet = ensureSheet_(spreadsheet, TSG_SHEETS.leads);

  if (hasLeadId_(leadsSheet, 'Lead ID', lead.leadId)) {
    return {status: 'duplicate_ignored'};
  }

  leadsSheet.appendRow([
    lead.timestamp, lead.leadId, lead.name, lead.whatsapp, lead.email, lead.location,
    lead.skaterType, lead.package, lead.rentalsNeeded, lead.preferredTime, lead.sourcePage,
    lead.utmSource, lead.utmCampaign, lead.marketingConsent, lead.whatsappOpened,
    lead.status, lead.notes, lead.tags, lead.leadType, lead.utmMedium, lead.referrer
  ]);

  if (lead.leadType === 'booking') {
    const bookingsSheet = ensureSheet_(spreadsheet, TSG_SHEETS.bookings);
    if (!hasLeadId_(bookingsSheet, 'Lead ID', lead.leadId)) {
      bookingsSheet.appendRow([
        lead.timestamp, lead.leadId, lead.name, lead.whatsapp, lead.email, lead.location,
        lead.skaterType, lead.package, lead.rentalsNeeded, lead.preferredTime, lead.sourcePage,
        lead.marketingConsent, lead.whatsappOpened, lead.status, lead.tags, lead.notes
      ]);
    }
    appendFollowUp_(spreadsheet, lead);
  }

  if (lead.email && lead.marketingConsent === 'Yes') upsertSubscriber_(spreadsheet, lead);
  return {status: lead.status};
}

function appendFollowUp_(spreadsheet, lead) {
  const sheet = ensureSheet_(spreadsheet, TSG_SHEETS.followUp);
  if (hasLeadId_(sheet, 'Lead ID', lead.leadId)) return;

  const created = new Date(lead.timestamp);
  const reminderDue = new Date(created.getTime() + TSG_CONFIG.reminderHours * 60 * 60 * 1000);
  sheet.appendRow([
    lead.leadId, lead.email, lead.name, lead.whatsapp, lead.leadType, 'New Lead',
    created, reminderDue, lead.marketingConsent === 'Yes' ? 'Yes' : 'No', '', ''
  ]);
}

function upsertSubscriber_(spreadsheet, lead) {
  const sheet = ensureSheet_(spreadsheet, TSG_SHEETS.subscribers);
  const lastRow = sheet.getLastRow();
  const emails = lastRow > 1 ? sheet.getRange(2, 3, lastRow - 1, 1).getDisplayValues().flat() : [];
  const index = emails.findIndex(email => email.toLowerCase() === lead.email.toLowerCase());
  const row = [lead.timestamp, lead.leadId, lead.email, lead.name, lead.location, lead.sourcePage, lead.tags, 'Yes', 'Subscribed', new Date()];

  if (index === -1) sheet.appendRow(row);
  else sheet.getRange(index + 2, 1, 1, row.length).setValues([row]);
}

function hasLeadId_(sheet, headerName, leadId) {
  if (!sheet || !leadId || sheet.getLastRow() < 2) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const column = headers.indexOf(headerName) + 1;
  if (column < 1) return false;

  const submittedId = String(leadId).trim();
  const ids = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
  return ids.some(id => String(id).trim() === submittedId);
}

function markWhatsAppOpened_(leadId) {
  if (!leadId) throw new Error('Lead ID is required.');
  const spreadsheet = getSpreadsheet_();
  [TSG_SHEETS.leads.name, TSG_SHEETS.bookings.name].forEach(sheetName => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return;
    const ids = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
    const index = ids.indexOf(leadId);
    if (index < 0) return;
    const row = index + 2;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    sheet.getRange(row, headers.indexOf('WhatsApp Opened') + 1).setValue('Yes');
    sheet.getRange(row, headers.indexOf('Status') + 1).setValue('WhatsApp Opened');
  });
  return jsonResponse_({ok: true, leadId: leadId, status: 'WhatsApp Opened'});
}

function runTSGFollowUpReminders() {
  const spreadsheet = getSpreadsheet_();
  const followUp = ensureSheet_(spreadsheet, TSG_SHEETS.followUp);
  if (followUp.getLastRow() < 2) return;

  const rows = followUp.getRange(2, 1, followUp.getLastRow() - 1, TSG_SHEETS.followUp.headers.length).getValues();
  const now = new Date();
  rows.forEach((row, index) => {
    const leadId = row[0];
    const email = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const status = String(row[5] || '');
    const reminderDue = row[7] instanceof Date ? row[7] : new Date(row[7]);
    const lastContacted = row[9];
    if (!email || lastContacted || !['New Lead','WhatsApp Opened','No Response','Follow Up Needed'].includes(status)) return;
    if (Number.isNaN(reminderDue.getTime()) || reminderDue > now) return;

    MailApp.sendEmail({
      to: email,
      replyTo: TSG_CONFIG.replyToEmail,
      name: TSG_CONFIG.businessName,
      subject: 'Still ready to roll with TSG?',
      body: `Hi ${name || 'there'},\n\nYour TSG booking request (${leadId}) is still open. Reply to this email or continue at ${TSG_CONFIG.bookingUrl} and we will help confirm the right session.\n\nThe Skate Guys`,
      htmlBody: `<p>Hi ${escapeHtml_(name || 'there')},</p><p>Your TSG booking request <strong>${escapeHtml_(leadId)}</strong> is still open.</p><p>Reply to this email or <a href="${TSG_CONFIG.bookingUrl}">continue your booking</a> and we will help confirm the right session.</p><p>The Skate Guys</p>`
    });

    followUp.getRange(index + 2, 6).setValue('Follow Up Needed');
    followUp.getRange(index + 2, 10).setValue(now);
    updateLeadStatus_(spreadsheet, leadId, 'Follow Up Needed');
  });
}

function sendLeadConfirmation_(lead) {
  if (!lead.email) return;
  const isBooking = lead.leadType === 'booking';
  const subject = isBooking ? 'We received your TSG booking request' : 'You are on the TSG update list';
  const body = isBooking
    ? `Hi ${lead.name || 'there'},\n\nWe received your booking request (${lead.leadId}). Continue in WhatsApp so the TSG team can confirm availability. No payment has been taken.\n\nThe Skate Guys`
    : `Welcome to the TSG update list. We will send useful class, event, merch and Elite updates.\n\nThe Skate Guys`;
  MailApp.sendEmail({to: lead.email, replyTo: TSG_CONFIG.replyToEmail, name: TSG_CONFIG.businessName, subject: subject, body: body});
}

function updateLeadStatus_(spreadsheet, leadId, status) {
  [TSG_SHEETS.leads.name, TSG_SHEETS.bookings.name].forEach(sheetName => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return;
    const ids = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
    const index = ids.indexOf(leadId);
    if (index < 0) return;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    sheet.getRange(index + 2, headers.indexOf('Status') + 1).setValue(status);
  });
}

function getSpreadsheet_() {
  const propertyId = PropertiesService.getScriptProperties().getProperty(TSG_CONFIG.spreadsheetIdProperty);
  if (propertyId) return SpreadsheetApp.openById(propertyId);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error(`Set the ${TSG_CONFIG.spreadsheetIdProperty} script property before deploying.`);
}

function ensureSheet_(spreadsheet, definition) {
  let sheet = spreadsheet.getSheetByName(definition.name);
  if (!sheet) sheet = spreadsheet.insertSheet(definition.name);
  const currentHeaders = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0] : [];
  if (currentHeaders.join('|') !== definition.headers.join('|')) sheet.getRange(1, 1, 1, definition.headers.length).setValues([definition.headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, definition.headers.length).setFontWeight('bold').setBackground('#e8eaed').setFontColor('#202124');
  if (!sheet.getFilter() && sheet.getMaxRows() > 1) sheet.getRange(1, 1, sheet.getMaxRows(), definition.headers.length).createFilter();
  return sheet;
}

function applyValidations_(spreadsheet) {
  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(TSG_STATUSES, true).setAllowInvalid(false).build();
  const yesNoRule = SpreadsheetApp.newDataValidation().requireValueInList(['Yes','No'], true).setAllowInvalid(false).build();
  const leads = spreadsheet.getSheetByName(TSG_SHEETS.leads.name);
  const bookings = spreadsheet.getSheetByName(TSG_SHEETS.bookings.name);
  leads.getRange(2, 16, leads.getMaxRows() - 1, 1).setDataValidation(statusRule);
  leads.getRange(2, 14, leads.getMaxRows() - 1, 2).setDataValidation(yesNoRule);
  bookings.getRange(2, 14, bookings.getMaxRows() - 1, 1).setDataValidation(statusRule);
  bookings.getRange(2, 12, bookings.getMaxRows() - 1, 2).setDataValidation(yesNoRule);
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
  if (!lead.leadId) throw new Error('Lead ID is required.');
  if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) throw new Error('A valid email is required.');
  if (lead.leadType === 'booking' && (!lead.name || !lead.whatsapp || !lead.package)) throw new Error('Booking name, WhatsApp and package are required.');
  if (lead.leadType !== 'booking' && lead.marketingConsent !== 'Yes') throw new Error('Email consent is required.');
}

function sanitizeCell_(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value.slice(0, 1000);
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
