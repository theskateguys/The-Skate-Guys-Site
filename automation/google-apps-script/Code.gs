const TSG_CONFIG = Object.freeze({
  spreadsheetIdProperty: 'TSG_LEADS_SPREADSHEET_ID',
  replyToEmail: 'info.theskateguys@gmail.com',
  businessName: 'The Skate Guys',
  bookingUrl: 'https://the-skate-guys-site.vercel.app/book.html',
  reminderHours: 24
});

const TSG_BOOKING_HEADERS = ['Preferred Area','Preferred Date','Participant Count','Participants JSON','Participant Details'];
const TSG_SHEETS = Object.freeze({
  leads: {
    name: 'Leads',
    headers: ['Timestamp','Lead ID','Name','WhatsApp','Email','Location','Adult/Child','Package','Rentals Needed','Preferred Time','Source Page','UTM Source','UTM Campaign','Marketing Consent','WhatsApp Opened','Status','Notes','Tags','Lead Type','UTM Medium','Referrer'].concat(TSG_BOOKING_HEADERS)
  },
  bookings: {
    name: 'Bookings',
    headers: ['Timestamp','Lead ID','Name','WhatsApp','Email','Location','Adult/Child','Package','Rentals Needed','Preferred Time','Source Page','Marketing Consent','WhatsApp Opened','Status','Tags','Notes'].concat(TSG_BOOKING_HEADERS)
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
    if (payload.action === 'whatsapp_opened') {
      const trackingLock = LockService.getScriptLock();
      trackingLock.waitLock(10000);
      try { return markWhatsAppOpened_(payload.leadId); }
      finally { trackingLock.releaseLock(); }
    }
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
  const duplicate = hasLeadId_(leadsSheet, 'Lead ID', lead.leadId);
  const values = {
    'Timestamp': lead.timestamp, 'Lead ID': lead.leadId, 'Name': lead.name,
    'WhatsApp': lead.whatsapp, 'Email': lead.email, 'Location': lead.location,
    'Adult/Child': lead.skaterType, 'Package': lead.package, 'Rentals Needed': lead.rentalsNeeded,
    'Preferred Time': lead.preferredTime, 'Source Page': lead.sourcePage,
    'UTM Source': lead.utmSource, 'UTM Campaign': lead.utmCampaign,
    'Marketing Consent': lead.marketingConsent, 'WhatsApp Opened': lead.whatsappOpened,
    'Status': protectedStatus_(spreadsheet, lead.leadId) || lead.status, 'Notes': lead.notes, 'Tags': lead.tags, 'Lead Type': lead.leadType,
    'UTM Medium': lead.utmMedium, 'Referrer': lead.referrer,
    'Preferred Area': lead.preferredArea, 'Preferred Date': lead.preferredDate,
    'Participant Count': lead.participantCount,
    'Participants JSON': JSON.stringify(lead.participants),
    'Participant Details': lead.participants.map((p, index) =>
      `${index + 1}. Age ${p.age}; ${p.experience}; rentals ${p.rentals}; size ${p.skateSize || '-'} ${p.sizeSystem || ''}; guardian ${p.guardianName || '-'} ${p.guardianPhone || ''}`
    ).join('\n')
  };
  if (!duplicate) appendMappedRow_(leadsSheet, values);

  if (lead.leadType === 'booking') {
    values.Status = protectedStatus_(spreadsheet, lead.leadId) || lead.status;
    const bookingsSheet = ensureSheet_(spreadsheet, TSG_SHEETS.bookings);
    if (!hasLeadId_(bookingsSheet, 'Lead ID', lead.leadId)) {
      appendMappedRow_(bookingsSheet, values);
    }
    appendFollowUp_(spreadsheet, lead);
  }

  if (!duplicate && lead.email && lead.marketingConsent === 'Yes') upsertSubscriber_(spreadsheet, lead);
  return {status: duplicate ? 'duplicate_ignored' : lead.status};
}

function appendFollowUp_(spreadsheet, lead) {
  const sheet = ensureSheet_(spreadsheet, TSG_SHEETS.followUp);
  if (hasLeadId_(sheet, 'Lead ID', lead.leadId)) return;

  const created = new Date(lead.timestamp);
  const reminderDue = new Date(created.getTime() + TSG_CONFIG.reminderHours * 60 * 60 * 1000);
  appendMappedRow_(sheet, {
    'Lead ID': lead.leadId, 'Email': lead.email, 'Name': lead.name, 'WhatsApp': lead.whatsapp,
    'Lead Type': lead.leadType, 'Status': protectedStatus_(spreadsheet, lead.leadId) || 'New Lead',
    'First Follow Up Due': created, 'Reminder Due': reminderDue,
    'Weekly Update Eligible': lead.marketingConsent === 'Yes' ? 'Yes' : 'No',
    'Last Contacted': '', 'Notes': ''
  });
}

function upsertSubscriber_(spreadsheet, lead) {
  const sheet = ensureSheet_(spreadsheet, TSG_SHEETS.subscribers);
  const lastRow = sheet.getLastRow();
  const headers = headers_(sheet);
  const emails = lastRow > 1 ? sheet.getRange(2, headers.indexOf('Email') + 1, lastRow - 1, 1).getDisplayValues().flat() : [];
  const index = emails.findIndex(email => email.toLowerCase() === lead.email.toLowerCase());
  const values = {'Timestamp': lead.timestamp, 'Lead ID': lead.leadId, 'Email': lead.email,
    'Name': lead.name, 'Location': lead.location, 'Source Page': lead.sourcePage,
    'Tags': lead.tags, 'Marketing Consent': 'Yes', 'Status': 'Subscribed', 'Last Updated': new Date()};
  if (index === -1) appendMappedRow_(sheet, values);
  else Object.keys(values).forEach(header => sheet.getRange(index + 2, headers.indexOf(header) + 1).setValue(values[header]));
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
    const headers = headers_(sheet);
    const ids = sheet.getRange(2, headers.indexOf('Lead ID') + 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
    const index = ids.indexOf(leadId);
    if (index < 0) return;
    const row = index + 2;
    sheet.getRange(row, headers.indexOf('WhatsApp Opened') + 1).setValue('Yes');
    const statusCell = sheet.getRange(row, headers.indexOf('Status') + 1);
    if (!protectedStatus_(spreadsheet, leadId) && statusCell.getValue() === 'New Lead') statusCell.setValue('WhatsApp Opened');
  });
  return jsonResponse_({ok: true, leadId: leadId, whatsappOpened: true});
}

function runTSGFollowUpReminders() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { runFollowUpReminders_(); }
  finally { lock.releaseLock(); }
}

function runFollowUpReminders_() {
  const spreadsheet = getSpreadsheet_();
  const followUp = ensureSheet_(spreadsheet, TSG_SHEETS.followUp);
  if (followUp.getLastRow() < 2) return;

  const headers = headers_(followUp);
  const rows = followUp.getRange(2, 1, followUp.getLastRow() - 1, headers.length).getValues();
  const now = new Date();
  rows.forEach((row, index) => {
    const get = header => row[headers.indexOf(header)];
    const leadId = get('Lead ID');
    const email = String(get('Email') || '').trim();
    const name = String(get('Name') || '').trim();
    const status = String(get('Status') || '');
    const reminderDue = new Date(get('Reminder Due'));
    const lastContacted = get('Last Contacted');
    if (protectedStatus_(spreadsheet, leadId) || hasReplied_(spreadsheet, leadId)) return;
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

    followUp.getRange(index + 2, headers.indexOf('Status') + 1).setValue('Follow Up Needed');
    followUp.getRange(index + 2, headers.indexOf('Last Contacted') + 1).setValue(now);
    updateLeadStatus_(spreadsheet, leadId, 'Follow Up Needed');
  });
}

function sendLeadConfirmation_(lead) {
  if (!lead.email) return;
  const isBooking = lead.leadType === 'booking';
  const subject = isBooking ? 'We received your TSG booking request' : 'You are on the TSG update list';
  const body = isBooking
    ? `Hi ${lead.name || 'there'},\n\nWe received your booking request (${lead.leadId}). This is not a confirmed class. Please send your prepared WhatsApp message so TSG can check coach, location and skate availability before payment. Your requested session is TT$80 per person for 75 minutes, skate rental included. Deposit preferred; payment on arrival by arrangement.\n\nGive at least 24 hours notice to reschedule. Credit rather than refunds; credit is valid for one calendar month from the original scheduled session date. Ask TSG about unspecified late cancellation, no-show and TSG cancellation details before confirming. No payment has been taken.\n\nThe Skate Guys`
    : `Welcome to the TSG update list. We will send useful class, event, merch and Elite updates.\n\nThe Skate Guys`;
  MailApp.sendEmail({to: lead.email, replyTo: TSG_CONFIG.replyToEmail, name: TSG_CONFIG.businessName, subject: subject, body: body});
}

function updateLeadStatus_(spreadsheet, leadId, status) {
  if (protectedStatus_(spreadsheet, leadId) || hasReplied_(spreadsheet, leadId)) return;
  [TSG_SHEETS.leads.name, TSG_SHEETS.bookings.name].forEach(sheetName => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return;
    const headers = headers_(sheet);
    const ids = sheet.getRange(2, headers.indexOf('Lead ID') + 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
    const index = ids.indexOf(leadId);
    if (index < 0) return;
    sheet.getRange(index + 2, headers.indexOf('Status') + 1).setValue(status);
  });
}

function statusesForLead_(spreadsheet, leadId) {
  return [TSG_SHEETS.leads, TSG_SHEETS.bookings, TSG_SHEETS.followUp].flatMap(definition => {
    const sheet = spreadsheet.getSheetByName(definition.name);
    if (!sheet || sheet.getLastRow() < 2) return [];
    const headers = headers_(sheet);
    return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
      .filter(row => String(row[headers.indexOf('Lead ID')]).trim() === String(leadId).trim())
      .map(row => String(row[headers.indexOf('Status')]).trim());
  });
}

function protectedStatus_(spreadsheet, leadId) {
  const statuses = statusesForLead_(spreadsheet, leadId);
  return statuses.includes('Paid') ? 'Paid' : statuses.includes('Confirmed') ? 'Confirmed' : '';
}

function hasReplied_(spreadsheet, leadId) {
  return statusesForLead_(spreadsheet, leadId).includes('Replied');
}

function headers_(sheet) {
  return sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0] : [];
}

function appendMappedRow_(sheet, values) {
  sheet.appendRow(headers_(sheet).map(header => values[header] === undefined ? '' : values[header]));
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
  // Add missing columns on the right; never relabel or move existing records.
  const missing = definition.headers.filter(header => !currentHeaders.includes(header));
  const requiredColumns = currentHeaders.length + missing.length;
  if (requiredColumns > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredColumns - sheet.getMaxColumns());
  if (missing.length) sheet.getRange(1, currentHeaders.length + 1, 1, missing.length).setValues([missing]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, requiredColumns).setFontWeight('bold').setBackground('#e8eaed').setFontColor('#202124');
  if (!sheet.getFilter() && sheet.getMaxRows() > 1) sheet.getRange(1, 1, sheet.getMaxRows(), requiredColumns).createFilter();
  return sheet;
}

function applyValidations_(spreadsheet) {
  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(TSG_STATUSES, true).setAllowInvalid(false).build();
  const yesNoRule = SpreadsheetApp.newDataValidation().requireValueInList(['Yes','No'], true).setAllowInvalid(false).build();
  const leads = spreadsheet.getSheetByName(TSG_SHEETS.leads.name);
  const bookings = spreadsheet.getSheetByName(TSG_SHEETS.bookings.name);
  [leads, bookings, spreadsheet.getSheetByName(TSG_SHEETS.followUp.name)].forEach(sheet => {
    const headers = headers_(sheet);
    sheet.getRange(2, headers.indexOf('Status') + 1, sheet.getMaxRows() - 1, 1).setDataValidation(statusRule);
    ['Marketing Consent','WhatsApp Opened'].filter(header => headers.includes(header)).forEach(header => {
      sheet.getRange(2, headers.indexOf(header) + 1, sheet.getMaxRows() - 1, 1).setDataValidation(yesNoRule);
    });
  });
}

function parsePayload_(event) {
  if (!event || !event.postData || !event.postData.contents) throw new Error('Missing request body.');
  return JSON.parse(event.postData.contents);
}

function normalizeLead_(payload) {
  const clean = (value, limit) => sanitizeCell_(String(value || '').trim().slice(0, limit || 1000));
  const participants = Array.isArray(payload.participants) ? payload.participants.slice(0, 21).map(p => ({
    age: Number(p.age), experience: clean(p.experience), rentals: clean(p.rentals),
    skateSize: p.rentals === 'Yes' ? clean(p.skateSize, 24) : '',
    sizeSystem: p.rentals === 'Yes' ? clean(p.sizeSystem) : '',
    guardianName: Number(p.age) < 18 ? clean(p.guardianName, 120) : '',
    guardianPhone: Number(p.age) < 18 ? clean(p.guardianPhone, 24) : ''
  })) : [];
  return {
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    leadId: clean(payload.leadId), leadType: clean(payload.leadType || 'email'),
    name: clean(payload.name), whatsapp: clean(payload.whatsapp), email: clean(payload.email).toLowerCase(),
    location: clean(payload.location),
    skaterType: [...new Set(participants.map(p => p.age < 18 ? 'Child' : 'Adult'))].join(', '),
    package: payload.leadType === 'booking' ? 'Single session: TT$80 per person / 75 minutes / skate rental included' : '',
    rentalsNeeded: participants.some(p => p.rentals === 'Yes') ? 'Yes' : 'No', preferredTime: clean(payload.preferredTime),
    preferredArea: clean(payload.preferredArea), preferredDate: clean(payload.preferredDate),
    participantCount: Number(payload.participantCount || 0), participants: participants,
    sourcePage: clean(payload.sourcePage), utmSource: clean(payload.utmSource), utmCampaign: clean(payload.utmCampaign),
    utmMedium: clean(payload.utmMedium), referrer: clean(payload.referrer),
    marketingConsent: payload.marketingConsent === 'Yes' ? 'Yes' : 'No', whatsappOpened: 'No',
    status: 'New Lead', notes: clean(payload.notes), tags: clean(payload.tags)
  };
}

function validateLead_(lead) {
  if (!lead.leadId) throw new Error('Lead ID is required.');
  if (Number.isNaN(lead.timestamp.getTime())) throw new Error('Valid timestamp required.');
  if ((lead.email || lead.leadType !== 'booking' || lead.marketingConsent === 'Yes') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) throw new Error('A valid email is required for email updates.');
  if (lead.leadType === 'booking') {
    if (!lead.name || !validPhone_(lead.whatsapp) || !['Trinidad','Tobago'].includes(lead.location) || !lead.preferredArea) throw new Error('Contact name, valid WhatsApp, island and preferred area are required.');
    const date = new Date(`${lead.preferredDate}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lead.preferredDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== lead.preferredDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(lead.preferredTime)) throw new Error('Valid preferred date and time required.');
    if (!Number.isInteger(lead.participantCount) || lead.participantCount < 1 || lead.participantCount > 20 || lead.participantCount !== lead.participants.length) throw new Error('Provide details for each participant (1-20).');
    lead.participants.forEach(p => {
      if (!Number.isInteger(p.age) || p.age < 1 || p.age > 120 || !['First time','Beginner','Intermediate','Experienced'].includes(p.experience) || !['Yes','No'].includes(p.rentals)) throw new Error('Participant age, experience and rental requirement required.');
      if (p.rentals === 'Yes' && (!p.skateSize || !['EU','UK adult','UK child','US men','US women','US youth','US toddler'].includes(p.sizeSystem))) throw new Error('Rental skate size and sizing system required.');
      if (p.age < 18 && (!p.guardianName || !validPhone_(p.guardianPhone))) throw new Error('Guardian name and valid WhatsApp required for under-18s.');
    });
  }
  if (lead.leadType !== 'booking' && lead.marketingConsent !== 'Yes') throw new Error('Email consent is required.');
}

function validPhone_(value) {
  return String(value).replace(/\D/g, '').length >= 7 && String(value).replace(/\D/g, '').length <= 15;
}

function sanitizeCell_(value) {
  const limited = value.slice(0, 1000);
  return /^[=+\-@]/.test(limited) ? `'${limited}` : limited;
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
