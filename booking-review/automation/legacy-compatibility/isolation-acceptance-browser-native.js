// Native fetch diagnostic/acceptance. Parent verifies actual network log and Sheet effects.
async page => {
  const APPROVED_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw7On5pvG1ohVzbESEu_JkOyhGt1EIHyWaYJt_moU16A6VEq7NM6QI4pq8idYfF1NCW7g/exec';
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const base = 'http://127.0.0.1:4198';
  const selection = /^http:\/\/127\.0\.0\.1:4198\/#(UNIQUE2?-(?:fresh|track|retry)|[0-8]-(?:track|retry)|AMB[0-3]-(?:track|retry))$/.exec(page.url());
  assert(selection, 'Explicit allowed loopback case/action required');
  assert(APPROVED_ENDPOINT && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(APPROVED_ENDPOINT),
    'Only the exact pinned new version 2 endpoint is allowed; empty pin fails closed.');
  const excluded = [
    'AKfycbyWtXY4AYK4wjgLeDDn60APzI_fF1VYpBdZ0PS30eYqEoBrvzVmqKQxYjR38jwMZF0MLg',
    'AKfycbymjXSnhFomwbFB7aHQXMffD73hKy7dXr80rixGOuDumRcnLoPOjN6L8bj1rGUMUVkC8g',
    'AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g',
    'AKfycbw755w_Pso18XZhhkqyywTngGDKNIJRYnl1vf7N5rxAUYtJBtxNhp38pFPQQt8q0y1Nuw',
    'AKfycbxNvwUUKELEdP4kQIMxdUapXfLu7XdG0EOLsX_o_fjD8EmVq4U7PHhg41j73Fmg-ZOwKg'
  ];
  assert(!excluded.some(id => APPROVED_ENDPOINT === `https://script.google.com/macros/s/${id}/exec`), 'Old deployments forbidden');
  const read = async path => {
    const response = await page.request.get(base + path, {maxRedirects: 0});
    assert(response.status() === 200, 'Local fixture unavailable');
    return response.json();
  };
  const manifest = await read('/manifest.json');
  const fixtures = await read('/fixtures.json');
  const timestamp = '2026-10-17T00:30:00.000Z';
  const prefix = 'LEGACY-ACCEPTANCE-20261017T003000000Z';
  assert(manifest.endpoint === APPROVED_ENDPOINT, 'Only the exact pinned new version 2 endpoint is allowed');
  assert(manifest.purpose === 'ISOLATION_SYNTHETIC_LEGACY_V2_ACCEPTANCE_ONLY' &&
    manifest.productionReady === false && manifest.remoteVerified === false &&
    manifest.deploymentVersion === 2 && manifest.automaticRemindersRequiredDisabled === true &&
    manifest.projectId === '1PwInosoMgf7Cp0mHH97SlAQ1j1BnJqs2ycis75awxIkBiAS6CPWWh7dU' &&
    manifest.copiedSheetId === '1jt4AZNBfIv0SOwWzalfMRiTdqdjzpWn6--g91db11e8' &&
    manifest.sourceSHA256 === 'c8a2f98e9b0eb4a8c01c326e3184e1dc3c9ab35cc9ac801ada1e075ca108425f' &&
    manifest.timestamp === timestamp && manifest.runTimestamp === timestamp && manifest.runPrefix === prefix &&
    manifest.sourceProvenance === 'Local Code.gs normalized to LF; SHA-256 checked at startup' &&
    manifest.endpointProvenance === 'Exact operator pin; declaration only, not remote deployment proof' &&
    fixtures.timestamp === timestamp && fixtures.runPrefix === prefix,
    'Exact isolated identities/provenance required');
  const [key, action] = selection[1].split('-');
  const ambiguous = key.startsWith('AMB');
  const tabs = ['Leads', 'Bookings', 'Follow Up Status', 'Email Subscribers'];
  const index = Number(ambiguous ? key.slice(3) : key);
  const tab = ambiguous ? tabs[index] : null;
  const fixture = key === 'UNIQUE2' ? fixtures.unique2 : key === 'UNIQUE' ? fixtures.unique : ambiguous ? fixtures.ambiguityCases?.[index] : fixtures.protectionCases?.[index];
  const suffix = key === 'UNIQUE' || key === 'UNIQUE2' ? `${key}-WITH-DUPLICATES` : ambiguous ? `AMBIGUOUS-${tab.toUpperCase().replace(/ /g, '-')}` :
    `${['CONFIRMED', 'PAID', 'REPLIED'][Math.floor(index / 3)]}-${tabs[index % 3].toUpperCase().replace(/ /g, '-')}`;
  const leadId = `${prefix}-${suffix}`;
  const expectedPayload = {
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
  const equal = (a, b) => a && Object.keys(a).length === Object.keys(b).length &&
    Object.entries(b).every(([key, value]) => a[key] === value);
  assert(fixture?.leadId === leadId && equal(fixture.payload, expectedPayload) &&
    equal(fixture.trackingPayload, {action: 'whatsapp_opened', leadId}) &&
    (!ambiguous || fixture.ambiguousTab === tab), 'Exact synthetic fixture/payload required');
  const body = JSON.stringify(action === 'track' ? fixture.trackingPayload : fixture.payload);
  const endpoint = APPROVED_ENDPOINT;
  const expected = ambiguous ? `Ambiguous target Lead ID in ${tab}: multiple rows; staff review required.` :
    action === 'track' ? 'WhatsApp Opened' : action === 'fresh' ? 'New Lead' : 'duplicate_ignored';
    const actual = await page.evaluate(async ({endpoint, body}) => {
      const start = performance.now();
      const controller = new AbortController();
      // Diagnostic capture only. Over-25-second results remain a release concern.
      const timer = setTimeout(() => controller.abort(), 90000);
      const result = {httpStatus: null, corsType: null, responseURL: null, json: null};
      try {
        const response = await fetch(endpoint, {method: 'POST', mode: 'cors', redirect: 'follow',
          credentials: 'omit', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body, signal: controller.signal});
        Object.assign(result, {httpStatus: response.status, corsType: response.type, responseURL: response.url.split('?')[0]});
        result.json = await response.json();
        return {...result, responseTimeMs: performance.now() - start};
      } catch (error) {
        return {...result, uncertain: true, errorName: error.name, responseTimeMs: performance.now() - start};
      } finally { clearTimeout(timer); }
    }, {endpoint, body});
    const responsePass = ambiguous ? actual.json?.ok === false && actual.json.error === expected &&
      !Object.prototype.hasOwnProperty.call(actual.json, 'leadId') :
      actual.json?.ok === true && actual.json.leadId === leadId && actual.json.status === expected;
    return {
      pass: !actual.uncertain && actual.httpStatus === 200 && actual.corsType === 'cors' &&
        actual.responseURL === 'https://script.googleusercontent.com/macros/echo' && responsePass,
      case: key, action, leadId, expected, ...actual,
      diagnosticTimeoutMs: 90000,
      withinWebsiteTimeout: actual.responseTimeMs <= 25000,
      transport: 'Native browser fetch without request interception',
      networkEvidenceRequired: 'Parent must compare actual CLI request logs and require exactly one new POST to the pinned endpoint plus Google GET redirects only.',
      evidenceScope: 'Browser response only; parent independently verifies network requests and exact Sheet effects. No automatic retry; health JSON cannot pass.'
    };
}
