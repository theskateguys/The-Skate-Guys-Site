// TEST PROJECT ONLY. Never install this helper in the production project.
function profileTSGIsolatedSubmission() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('TSG_LEADS_SPREADSHEET_ID') !== '1CuA0uWDnUu-EK0XseYxNNpEK4lX5SZ7S5UuTdy-HCyM' ||
      properties.getProperty('TSG_AUTOMATIC_REMINDERS_ENABLED') !== 'false') {
    throw new Error('Profiling requires the isolated test Sheet and disabled reminders.');
  }
  const sheet = getSpreadsheet_().getSheetByName('Leads');
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  const source = rows.find(row => row[headers.indexOf('Lead ID')] === 'TSG-966d41c4-e666-4f17-838b-f4d25dfa8481');
  if (!source) throw new Error('Approved source test booking not found.');
  const get = header => source[headers.indexOf(header)];
  let id = properties.getProperty('TSG_ISOLATED_PROFILE_LEAD_ID');
  if (!id) {
    id = 'TSG-PROFILE-' + Utilities.getUuid();
    properties.setProperty('TSG_ISOLATED_PROFILE_LEAD_ID', id);
  }
  const payload = {
    action: 'lead_submit', leadType: 'booking', leadId: id, timestamp: new Date().toISOString(),
    name: 'TEST ONLY - Dylon profiling', whatsapp: String(get('WhatsApp')).replace(/^'/, ''), email: get('Email'),
    location: get('Location'), preferredArea: get('Preferred Area'),
    preferredDate: Utilities.formatDate(new Date(get('Preferred Date')), 'America/Port_of_Spain', 'yyyy-MM-dd'),
    preferredTime: Utilities.formatDate(new Date(get('Preferred Time')), 'America/Port_of_Spain', 'HH:mm'),
    participantCount: get('Participant Count'), participants: JSON.parse(get('Participants JSON')),
    marketingConsent: get('Marketing Consent'), sourcePage: 'ISOLATED EDITOR PROFILE',
    notes: 'TEST ONLY: approved latency profiling; not a reservation. Automatic reminders disabled.'
  };
  const result = doPost({postData: {contents: JSON.stringify(payload)}});
  console.log(result.getContent());
  return result.getContent();
}
