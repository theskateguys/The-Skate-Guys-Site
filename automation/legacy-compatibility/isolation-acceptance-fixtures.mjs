// Pure fabricated data: no filesystem, network, clock, or Google calls on import.
import {createAcceptanceFixtures, STATUS_TABS} from './acceptance-fixtures.mjs';

export const TIMESTAMP = '2026-10-17T00:30:00.000Z';
export const SOURCE_SHA256 = 'c8a2f98e9b0eb4a8c01c326e3184e1dc3c9ab35cc9ac801ada1e075ca108425f';
export const PROJECT_ID = '1PwInosoMgf7Cp0mHH97SlAQ1j1BnJqs2ycis75awxIkBiAS6CPWWh7dU';
export const SHEET_ID = '1jt4AZNBfIv0SOwWzalfMRiTdqdjzpWn6--g91db11e8';
export const ORIGIN = 'http://127.0.0.1:4198';
export const PURPOSE = 'ISOLATION_SYNTHETIC_LEGACY_V2_ACCEPTANCE_ONLY';
export const EXCLUDED_ENDPOINT_IDS = Object.freeze([
  'AKfycbyWtXY4AYK4wjgLeDDn60APzI_fF1VYpBdZ0PS30eYqEoBrvzVmqKQxYjR38jwMZF0MLg',
  'AKfycbymjXSnhFomwbFB7aHQXMffD73hKy7dXr80rixGOuDumRcnLoPOjN6L8bj1rGUMUVkC8g',
  'AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g',
  'AKfycbw755w_Pso18XZhhkqyywTngGDKNIJRYnl1vf7N5rxAUYtJBtxNhp38pFPQQt8q0y1Nuw',
  'AKfycbxNvwUUKELEdP4kQIMxdUapXfLu7XdG0EOLsX_o_fjD8EmVq4U7PHhg41j73Fmg-ZOwKg'
]);

export function createIsolationAcceptanceFixtures() {
  const base = createAcceptanceFixtures(TIMESTAMP);
  const makeCase = suffix => {
    const leadId = `${base.runPrefix}-${suffix}`;
    return {
      leadId, payload: {...base.fresh.payload, leadId},
      trackingPayload: {action: 'whatsapp_opened', leadId}
    };
  };
  const unique = {
    ...makeCase('UNIQUE-WITH-DUPLICATES'),
    expectedSaveResponseAfterApproval: {ok: true, leadId: `${base.runPrefix}-UNIQUE-WITH-DUPLICATES`, status: 'New Lead'},
    expectedTrackingResponse: {ok: true, leadId: `${base.runPrefix}-UNIQUE-WITH-DUPLICATES`, status: 'WhatsApp Opened'},
    expectedRetryResponseAfterApproval: {ok: true, leadId: `${base.runPrefix}-UNIQUE-WITH-DUPLICATES`, status: 'duplicate_ignored'}
  };
  const unique2Case = makeCase('UNIQUE2-WITH-DUPLICATES');
  const unique2 = {
    ...unique2Case,
    expectedSaveResponseAfterApproval: {ok: true, leadId: unique2Case.leadId, status: 'New Lead'},
    expectedTrackingResponse: {ok: true, leadId: unique2Case.leadId, status: 'WhatsApp Opened'},
    expectedRetryResponseAfterApproval: {ok: true, leadId: unique2Case.leadId, status: 'duplicate_ignored'}
  };
  const ambiguityCases = [...STATUS_TABS, 'Email Subscribers'].map(tab => {
    const fixture = makeCase(`AMBIGUOUS-${tab.toUpperCase().replace(/ /g, '-')}`);
    const seedRows = Object.fromEntries([...STATUS_TABS, 'Email Subscribers'].map(name => [name, []]));
    if (tab === 'Email Subscribers') {
      seedRows[tab] = ['Inactive', 'Active'].map(status => ({
        Timestamp: TIMESTAMP, 'Lead ID': fixture.leadId, Email: '', Name: fixture.payload.name,
        Location: fixture.payload.location, 'Source Page': fixture.payload.sourcePage,
        Tags: fixture.payload.tags, 'Marketing Consent': 'No', Status: status, 'Last Updated': TIMESTAMP
      }));
    } else {
      for (const name of STATUS_TABS) {
        seedRows[name] = (name === tab ? ['Confirmed', 'Paid'] : ['Replied']).map((status, index) => ({
          ...base.protectionCases[0].seedRows[name], 'Lead ID': fixture.leadId, Status: status,
          Notes: `TEST ONLY STAFF NOTES KEEP | ${fixture.leadId} | ${name} | ${index} | ${status}`
        }));
      }
    }
    return {
      ...fixture, ambiguousTab: tab, seedRows,
      expectedErrorResponse: {ok: false, error: `Ambiguous target Lead ID in ${tab}: multiple rows; staff review required.`},
      expectedSheetEffect: 'No writes; all seeded rows and notes unchanged; no companions created.'
    };
  });
  return {...base, unique, unique2, ambiguityCases};
}

export function assertApprovedEndpoint(endpoint, approvedEndpoint) {
  if (!approvedEndpoint || endpoint !== approvedEndpoint ||
      !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
      EXCLUDED_ENDPOINT_IDS.some(id => endpoint === `https://script.google.com/macros/s/${id}/exec`)) {
    throw new Error('Only the exact pinned new version 2 endpoint is allowed; empty pin fails closed.');
  }
}

export function createManifest(endpoint) {
  const fixtures = createIsolationAcceptanceFixtures();
  return {
    purpose: PURPOSE, productionReady: false, projectId: PROJECT_ID, copiedSheetId: SHEET_ID,
    endpoint, sourceSHA256: SOURCE_SHA256, timestamp: TIMESTAMP, runTimestamp: TIMESTAMP,
    runPrefix: fixtures.runPrefix, deploymentVersion: 2, remoteVerified: false,
    automaticRemindersRequiredDisabled: true,
    sourceProvenance: 'Local Code.gs normalized to LF; SHA-256 checked at startup',
    endpointProvenance: 'Exact operator pin; declaration only, not remote deployment proof',
    remoteVerification: 'Parent must verify deployment/project/Sheet/source and disabled reminders before pinning. Parent owns Sheet readbacks; no release authorization.'
  };
}
