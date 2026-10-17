// Pure data only: importing or calling this module performs no I/O.
export const STATUS_TABS = Object.freeze(['Leads', 'Bookings', 'Follow Up Status']);
export const PROTECTED_STATUSES = Object.freeze(['Confirmed', 'Paid', 'Replied']);
export const REVIEW_REQUIRED = 'Yes - reconcile historical offer and collect participant details before confirmation/payment.';

function payload(leadId, timestamp) {
  return {
    action: 'lead_submit', leadType: 'booking', leadId, timestamp,
    name: 'TEST ONLY Synthetic Legacy Acceptance', whatsapp: 'TEST ONLY - DO NOT CONTACT',
    email: '', marketingConsent: 'No', location: 'TEST ONLY Tobago', skaterType: 'Child',
    package: 'TEST ONLY historical package preference - reconcile; no agreed price',
    rentalsNeeded: 'Yes', preferredTime: 'TEST ONLY Saturday afternoon preference',
    sourcePage: 'old-book.html', utmSource: 'TEST ONLY', utmMedium: 'acceptance',
    utmCampaign: 'LEGACY-ACCEPTANCE', referrer: 'TEST ONLY offline fixture',
    notes: 'TEST ONLY historical request; no appointment, price or payment promise.',
    tags: 'TEST ONLY LEGACY-ACCEPTANCE', website: ''
  };
}

function seedRow(tab, request, status, notes) {
  const shared = {
    'Lead ID': request.leadId, Name: request.name, WhatsApp: request.whatsapp,
    Email: '', Status: status, Notes: notes, 'Legacy Review Required': REVIEW_REQUIRED
  };
  if (tab === 'Follow Up Status') return {
    ...shared, 'Lead Type': 'booking', 'First Follow Up Due': request.timestamp,
    'Reminder Due': new Date(Date.parse(request.timestamp) + 86400000).toISOString(),
    'Weekly Update Eligible': 'No', 'Last Contacted': ''
  };
  const row = {
    ...shared, Timestamp: request.timestamp, Location: request.location,
    'Adult/Child': request.skaterType, Package: request.package,
    'Rentals Needed': request.rentalsNeeded, 'Preferred Time': request.preferredTime,
    'Source Page': request.sourcePage, 'Marketing Consent': 'No',
    'WhatsApp Opened': 'No', Tags: request.tags
  };
  if (tab === 'Leads') Object.assign(row, {
    'Lead Type': 'booking', 'UTM Source': request.utmSource,
    'UTM Medium': request.utmMedium, 'UTM Campaign': request.utmCampaign,
    Referrer: request.referrer
  });
  return row;
}

// Caller supplies and records a unique run timestamp. Same timestamp => same IDs.
// Do not regenerate with a new timestamp when retrying an existing run.
export function createAcceptanceFixtures(timestamp) {
  if (typeof timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp) ||
      !Number.isFinite(Date.parse(timestamp)) || new Date(timestamp).toISOString() !== timestamp) {
    throw new TypeError('Supply a valid canonical UTC timestamp with milliseconds.');
  }
  const runPrefix = `LEGACY-ACCEPTANCE-${timestamp.replace(/[-:.]/g, '')}`;
  const freshPayload = payload(`${runPrefix}-FRESH`, timestamp);
  const protectionCases = PROTECTED_STATUSES.flatMap(protectedStatus => STATUS_TABS.map(protectedTab => {
    const slug = protectedTab.toUpperCase().replace(/ /g, '-');
    const request = payload(`${runPrefix}-${protectedStatus.toUpperCase()}-${slug}`, timestamp);
    const seedRows = Object.fromEntries(STATUS_TABS.map(tab => [tab, seedRow(
      tab, request, tab === protectedTab ? protectedStatus : 'New Lead',
      `TEST ONLY STAFF NOTES KEEP | ${request.leadId} | ${tab}`
    )]));
    // Remove only a child, never the tab carrying the protected status.
    const missingChildTab = protectedTab === 'Bookings' ? 'Follow Up Status' : 'Bookings';
    return {
      leadId: request.leadId, protectedStatus, protectedTab, payload: request,
      trackingPayload: {action: 'whatsapp_opened', leadId: request.leadId}, seedRows,
      expectedTrackingResponse: {ok: true, leadId: request.leadId, status: 'WhatsApp Opened'},
      expectedRetryResponseAfterApproval: {ok: true, leadId: request.leadId, status: 'duplicate_ignored'},
      repair: {
        missingChildTab, expectedStatus: protectedStatus,
        expectedNotes: seedRows.Leads.Notes,
        expectedResponseAfterApproval: {ok: true, leadId: request.leadId, status: 'duplicate_ignored'}
      }
    };
  }));
  return {
    timestamp, runPrefix,
    validationGate: {
      priorCandidateResponse: {ok: false, error: 'A valid email is required.'},
      optionalBookingEmailApproved: true,
      requiresIsolatedDeploymentVerification: true,
      reason: 'Local candidate accepts blank booking email; verify the isolated deployed source before Google acceptance.'
    },
    fresh: {
      leadId: freshPayload.leadId, payload: freshPayload,
      trackingPayload: {action: 'whatsapp_opened', leadId: freshPayload.leadId},
      expectedSaveResponseAfterApproval: {ok: true, leadId: freshPayload.leadId, status: 'New Lead'},
      expectedTrackingResponse: {ok: true, leadId: freshPayload.leadId, status: 'WhatsApp Opened'},
      expectedRetryResponseAfterApproval: {ok: true, leadId: freshPayload.leadId, status: 'duplicate_ignored'}
    },
    protectionCases,
    counts: {
      uniqueLeadIds: 10,
      matrixSeedRows: {'Leads': 9, 'Bookings': 9, 'Follow Up Status': 9, 'Email Subscribers': 0},
      completedRowsAfterApproval: {'Leads': 10, 'Bookings': 10, 'Follow Up Status': 10, 'Email Subscribers': 0},
      repairRemovalsAndMatchingAppends: {'Leads': 0, 'Bookings': 6, 'Follow Up Status': 3, 'Email Subscribers': 0}
    }
  };
}
