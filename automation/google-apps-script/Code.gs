const TSG_CONFIG = Object.freeze({
  spreadsheetIdProperty: 'TSG_LEADS_SPREADSHEET_ID',
  remindersEnabledProperty: 'TSG_AUTOMATIC_REMINDERS_ENABLED',
  replyToEmail: 'info.theskateguys@gmail.com',
  businessName: 'The Skate Guys',
  whatsappNumber: '18682766878',
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
const TSG_CREDIT_POLICY = [
  'At least 24 hours notice: the amount paid carries forward as credit.',
  'Less than 24 hours notice or no-show: no automatic credit; genuine emergencies reviewed individually.',
  'TSG/coach cancellation or unsafe weather/venue: full amount paid carries forward as credit, without penalty.',
  'Credit expires one calendar month from the original scheduled session date. If the matching date does not exist, use the last day of that month.',
  "If TSG cannot offer a replacement before expiry, extend the credit to give the client a reasonable opportunity to attend. We'll confirm your revised credit expiry with you.",
  'Transfers require TSG approval, subject to participant suitability and skate availability.',
  'Credit rather than refunds.'
].join('\n');

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
  Object.keys(TSG_SHEETS).forEach(key => ensureSheet_(spreadsheet, TSG_SHEETS[key], true));
  applyValidations_(spreadsheet);
  installTSGAutomationTriggers();
  return 'TSG lead system is ready.';
}

function installTSGAutomationTriggers() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'runTSGFollowUpReminders')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  if (!automaticRemindersEnabled_()) return;
  ScriptApp.newTrigger('runTSGFollowUpReminders')
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .create();
}

function automaticRemindersEnabled_() {
  return PropertiesService.getScriptProperties().getProperty(TSG_CONFIG.remindersEnabledProperty) === 'true';
}

function doGet() {
  return jsonResponse_({ok: true, service: 'TSG Website Leads', timestamp: new Date().toISOString()});
}

function doPost(event) {
  const started = Date.now();
  const timing = {event: 'tsg_submission_timing', lockWaitMs: 0, sheetMs: 0, emailMs: 0};
  try {
    const payload = parsePayload_(event);
    if (payload.action === 'whatsapp_opened') {
      const trackingLock = LockService.getScriptLock();
      let phase = Date.now();
      trackingLock.waitLock(10000);
      timing.lockWaitMs = Date.now() - phase;
      phase = Date.now();
      try { return markWhatsAppOpened_(payload.leadId); }
      finally { timing.sheetMs = Date.now() - phase; trackingLock.releaseLock(); }
    }
    if (payload.action !== 'lead_submit') throw new Error('Unsupported action.');
    if (payload.website) return jsonResponse_({ok: true});

    const lead = normalizeLead_(payload);
    validateLead_(lead);

    const lock = LockService.getScriptLock();
    let result;
    let phase = Date.now();
    lock.waitLock(10000);
    timing.lockWaitMs = Date.now() - phase;
    phase = Date.now();
    try {
      result = saveLead_(lead);
    } finally {
      timing.sheetMs = Date.now() - phase;
      lock.releaseLock();
    }

    if (result.status === 'duplicate_ignored') {
      return jsonResponse_({ok: true, leadId: lead.leadId, status: 'duplicate_ignored'});
    }

    phase = Date.now();
    try { sendLeadConfirmation_(lead); }
    finally { timing.emailMs = Date.now() - phase; }
    return jsonResponse_({ok: true, leadId: lead.leadId, status: result.status});
  } catch (error) {
    console.error(error);
    return jsonResponse_({ok: false, error: String(error.message || error)});
  } finally {
    // Durations only: never log contact details, participant data or request payloads.
    timing.totalMs = Date.now() - started;
    console.log(JSON.stringify(timing));
  }
}

function saveLead_(lead) {
  const spreadsheet = getSpreadsheet_();
  const leadsSheet = ensureSheet_(spreadsheet, TSG_SHEETS.leads);
  const duplicate = hasLeadId_(leadsSheet, 'Lead ID', lead.leadId);
  // The submission lock covers all three appends; reuse one status snapshot.
  const status = protectedStatus_(spreadsheet, lead.leadId) || lead.status;
  const values = {
    'Timestamp': lead.timestamp, 'Lead ID': lead.leadId, 'Name': lead.name,
    'WhatsApp': lead.whatsapp, 'Email': lead.email, 'Location': lead.location,
    'Adult/Child': lead.skaterType, 'Package': lead.package, 'Rentals Needed': lead.rentalsNeeded,
    'Preferred Time': lead.preferredTime, 'Source Page': lead.sourcePage,
    'UTM Source': lead.utmSource, 'UTM Campaign': lead.utmCampaign,
    'Marketing Consent': lead.marketingConsent, 'WhatsApp Opened': lead.whatsappOpened,
    'Status': status, 'Notes': lead.notes, 'Tags': lead.tags, 'Lead Type': lead.leadType,
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
    const bookingsSheet = ensureSheet_(spreadsheet, TSG_SHEETS.bookings);
    if (!hasLeadId_(bookingsSheet, 'Lead ID', lead.leadId)) {
      appendMappedRow_(bookingsSheet, values);
    }
    appendFollowUp_(spreadsheet, lead, status);
  }

  if (!duplicate && lead.email && lead.marketingConsent === 'Yes') upsertSubscriber_(spreadsheet, lead);
  return {status: duplicate ? 'duplicate_ignored' : lead.status};
}

function appendFollowUp_(spreadsheet, lead, status) {
  const sheet = ensureSheet_(spreadsheet, TSG_SHEETS.followUp);
  if (hasLeadId_(sheet, 'Lead ID', lead.leadId)) return;

  const created = new Date(lead.timestamp);
  const reminderDue = new Date(created.getTime() + TSG_CONFIG.reminderHours * 60 * 60 * 1000);
  appendMappedRow_(sheet, {
    'Lead ID': lead.leadId, 'Email': lead.email, 'Name': lead.name, 'WhatsApp': lead.whatsapp,
    'Lead Type': lead.leadType, 'Status': status,
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
  else {
    // Batch adjacent owned columns, never rewrite custom cells or formulas between them.
    let pending = [];
    let start = 0;
    const flush = () => {
      if (pending.length) sheet.getRange(index + 2, start + 1, 1, pending.length).setValues([pending]);
      pending = [];
    };
    headers.forEach((header, column) => {
      if (!Object.prototype.hasOwnProperty.call(values, header)) { flush(); return; }
      if (!pending.length) start = column;
      pending.push(values[header]);
    });
    flush();
  }
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
  if (!automaticRemindersEnabled_()) return;
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
  const message = isBooking ? buildBookingAcknowledgement_(lead) : {
    subject: 'You are on the TSG update list',
    body: 'Welcome to the TSG update list. We will send useful class, event and merch updates.\n\nThe Skate Guys'
  };
  if (isBooking) message.inlineImages = {tsgLogo: getTSGEmailLogo_()};
  MailApp.sendEmail(Object.assign({to: lead.email, replyTo: TSG_CONFIG.replyToEmail, name: TSG_CONFIG.businessName}, message));
}

function bookingEmailDate_(value) {
  const text = String(value || '');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const date = new Date(text + 'T12:00:00Z');
  if (!match || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) return text;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}

function bookingEmailDetails_(lead) {
  const details = [
    ['Customer reference', lead.leadId], ['Contact name', lead.name],
    ['WhatsApp', lead.whatsapp], ['Email', lead.email || 'Not provided'],
    ['Requested island', lead.location], ['Requested area', lead.preferredArea],
    ['Requested date', bookingEmailDate_(lead.preferredDate)], ['Requested time (T&T local time)', lead.preferredTime],
    ['Participants', lead.participantCount]
  ];
  lead.participants.forEach((p, index) => {
    details.push([`Participant ${index + 1}`, `Age ${p.age}; ${p.experience}; rental skates: ${p.rentals}`]);
    if (p.rentals === 'Yes') details.push([`Participant ${index + 1} skate size`, `${p.skateSize} (${p.sizeSystem})`]);
    if (p.age < 18) details.push([`Participant ${index + 1} guardian`, `${p.guardianName}; WhatsApp: ${p.guardianPhone}`]);
  });
  return details;
}

function bookingEmailWhatsAppUrl_(lead) {
  const message = [
    'TSG Booking Request (not confirmed)',
    ...bookingEmailDetails_(lead).map(detail => detail.join(': ')),
    'Single session: TT$80 per person / 75 minutes / skate rental included.',
    'Please check coach, location and skate availability before payment.'
  ].join('\n');
  return `https://wa.me/${TSG_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function buildBookingAcknowledgement_(lead) {
  const details = bookingEmailDetails_(lead);
  const whatsappUrl = bookingEmailWhatsAppUrl_(lead);
  const nextStep = 'Please send your prepared WhatsApp message so TSG can check coach, location and skate availability before payment.';
  const payment = 'Deposit preferred; payment on arrival by arrangement.';
  const location = 'Trinidad location is agreed during booking. For Tobago, TSG confirms Rec TT Black Rock or another suitable agreed location.';
  const policyHeadings = ['24-hour rescheduling notice', 'Late notice or no-show', 'TSG, coach, weather or venue cancellation', 'Credit expiry', 'When TSG cannot offer a replacement', 'Transfers', 'Credit rather than refunds'];
  const policyHtml = TSG_CREDIT_POLICY.split('\n').map((rule, index) =>
    `<p style="margin:0 0 18px;font-size:14px;line-height:1.65;"><strong>${escapeHtml_(policyHeadings[index])}</strong><br>${escapeHtml_(rule)}</p>`
  ).join('');
  const detailsHtml = details.map(detail =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #dce8e8;word-wrap:break-word;overflow-wrap:anywhere;word-break:break-word;"><span style="font-size:12px;line-height:1.5;color:#4a6265;">${escapeHtml_(detail[0])}</span><br><span style="font-size:15px;line-height:1.6;">${escapeHtml_(detail[1])}</span></td></tr>`
  ).join('');
  const contentHtml = `
    <p style="margin:0 0 20px;">Hi ${escapeHtml_(lead.name || 'there')},</p>
    <p style="margin:0 0 20px;">We received your booking request. <strong>This is not a confirmed class.</strong></p>
    <p style="margin:0 0 24px;padding:14px 16px;background-color:#e8f8f7;border-left:3px solid #00f5ff;color:#14545b;font-size:14px;"><strong>Awaiting availability confirmation</strong></p>
    <h2 style="margin:0 0 10px;font-size:19px;line-height:1.4;">Your requested session</h2>
    <p style="margin:0 0 10px;font-size:17px;line-height:1.6;"><strong>TT$80 per person / 75 minutes / skate rental included.</strong></p>
    <p style="margin:0 0 22px;">One person can book. Classes are by appointment.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;max-width:100%;"><tr><td bgcolor="#00f5ff" style="background-color:#00f5ff;border-radius:4px;text-align:center;mso-padding-alt:14px 20px;"><a href="${escapeHtml_(whatsappUrl)}" style="display:inline-block;padding:14px 20px;color:#102b30;font-size:15px;line-height:1.5;font-weight:bold;text-decoration:none;">Continue on WhatsApp</a></td></tr></table>
    <p style="margin:16px 0 20px;font-size:14px;">You must press <strong>Send</strong> in WhatsApp. Opening WhatsApp alone does not send your message or confirm a class. Your customer reference is included.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;">${detailsHtml}</table>
    <p style="margin:18px 0 28px;font-size:14px;color:#4a6265;">Date, time and location above are requested, not confirmed. ${escapeHtml_(location)}</p>
    <h2 style="margin:0 0 12px;font-size:19px;line-height:1.4;">What happens next</h2>
    <p style="margin:0 0 18px;">${escapeHtml_(nextStep)}</p>
    <p style="margin:0 0 10px;">${escapeHtml_(payment)}</p>
    <p style="margin:0 0 28px;"><strong>No payment has been taken.</strong></p>
    <h2 style="margin:0 0 18px;padding-top:24px;border-top:1px solid #dce8e8;font-size:19px;line-height:1.4;">Rescheduling, cancellation &amp; credit</h2>
    ${policyHtml}`;
  return {
    subject: 'We received your TSG booking request',
    body: `Booking Request Received\n\nHi ${lead.name || 'there'},\n\nWe received your booking request (${lead.leadId}). This is not a confirmed class.\nStatus: Awaiting availability confirmation\n\nTT$80 per person / 75 minutes / skate rental included.\nOne person can book. Classes are by appointment.\n\nContinue on WhatsApp: ${whatsappUrl}\nYou must press Send in WhatsApp. Opening WhatsApp alone does not send your message or confirm a class.\n\n${details.map(detail => detail.join(': ')).join('\n')}\n\nDate, time and location are requested, not confirmed. ${location}\n\n${nextStep}\n${payment}\n\nNo payment has been taken.\n\n${TSG_CREDIT_POLICY}\n\nThe Skate Guys Ltd\nTrinidad & Tobago\nWhatsApp: +1 868 276 6878\n${TSG_CONFIG.replyToEmail}\n${TSG_CONFIG.bookingUrl}`,
    htmlBody: renderTSGEmailLayout_({heading: 'Booking Request Received', preheader: 'Awaiting availability confirmation. This is not a confirmed class. No payment has been taken.', contentHtml: contentHtml})
  };
}

// Reusable presentation only. contentHtml must be built from escaped values, never raw customer HTML.
function renderTSGEmailLayout_(options) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml_(options.heading)}</title></head>
  <body style="margin:0;padding:0;background-color:#e8f8f7;color:#1d3035;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;font-size:1px;color:#e8f8f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml_(options.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#e8f8f7" style="width:100%;border-collapse:collapse;background-color:#e8f8f7;"><tr><td align="center" style="padding:24px 12px;">
  <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;table-layout:fixed;border-collapse:collapse;background-color:#ffffff;color:#1d3035;">
  <tr><td style="padding:4px 24px 12px;text-align:center;"><img src="cid:tsgLogo" width="136" height="136" alt="The Skate Guys company logo" style="display:block;width:136px;height:136px;max-width:100%;margin:0 auto;border:0;color:#1d3035;font-size:13px;"><p style="margin:0 0 4px;font-size:21px;line-height:1.4;font-weight:bold;">The Skate Guys Ltd</p><p style="margin:0;font-size:14px;line-height:1.6;color:#4a6265;">Trinidad &amp; Tobago</p></td></tr>
  <tr><td style="padding:0 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr><td width="50%" height="3" bgcolor="#ff2d6b" style="height:3px;background-color:#ff2d6b;font-size:0;line-height:0;">&nbsp;</td><td width="50%" height="3" bgcolor="#00f5ff" style="height:3px;background-color:#00f5ff;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
  <tr><td style="padding:28px 24px 16px;font-size:15px;line-height:1.7;word-wrap:break-word;overflow-wrap:anywhere;word-break:break-word;"><h1 style="margin:0 0 24px;font-size:28px;line-height:1.25;color:#1d3035;">${escapeHtml_(options.heading)}</h1>${options.contentHtml}</td></tr>
  <tr><td style="padding:20px 24px 28px;border-top:1px solid #dce8e8;font-size:13px;line-height:1.8;color:#4a6265;word-wrap:break-word;overflow-wrap:anywhere;word-break:break-word;"><strong style="color:#1d3035;">The Skate Guys Ltd</strong><br>Trinidad &amp; Tobago<br><a href="mailto:${escapeHtml_(TSG_CONFIG.replyToEmail)}" style="color:#14545b;text-decoration:underline;">${escapeHtml_(TSG_CONFIG.replyToEmail)}</a><br><a href="https://wa.me/${TSG_CONFIG.whatsappNumber}" style="color:#14545b;text-decoration:underline;">WhatsApp: +1 868 276 6878</a><br><a href="${escapeHtml_(TSG_CONFIG.bookingUrl)}" style="color:#14545b;text-decoration:underline;">The Skate Guys website</a></td></tr>
  </table><!--[if mso]></td></tr></table><![endif]-->
  </td></tr></table></body></html>`;
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

function ensureSheet_(spreadsheet, definition, format) {
  let sheet = spreadsheet.getSheetByName(definition.name);
  if (!sheet) sheet = spreadsheet.insertSheet(definition.name);
  const currentHeaders = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0] : [];
  // Add missing columns on the right; never relabel or move existing records.
  const missing = definition.headers.filter(header => !currentHeaders.includes(header));
  const requiredColumns = currentHeaders.length + missing.length;
  if (requiredColumns > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredColumns - sheet.getMaxColumns());
  if (missing.length) sheet.getRange(1, currentHeaders.length + 1, 1, missing.length).setValues([missing]);
  if (format || missing.length) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, requiredColumns).setFontWeight('bold').setBackground('#e8eaed').setFontColor('#202124');
    if (!sheet.getFilter() && sheet.getMaxRows() > 1) sheet.getRange(1, 1, sheet.getMaxRows(), requiredColumns).createFilter();
  }
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
