// Run-code expression: exactly one POST, never an automatic retry or Sheet readback.
async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const base = 'http://127.0.0.1:4198';
  const selection = /^http:\/\/127\.0\.0\.1:4198\/#(FRESH|[0-8])-(fresh|retry|track)$/.exec(page.url());
  assert(selection, 'Explicit loopback case/action required');
  const read = async path => {
    const response = await page.request.get(base + path, {maxRedirects: 0});
    assert(response.status() === 200, 'Local fixture unavailable');
    return response.json();
  };
  const manifest = await read('/manifest.json');
  const fixtures = await read('/fixtures.json');
  const timestamp = '2026-10-17T00:30:00.000Z';
  const prefix = 'LEGACY-ACCEPTANCE-20261017T003000000Z';
  assert(manifest.purpose === 'CLEAN_SYNTHETIC_LEGACY_ACCEPTANCE_ONLY' &&
    manifest.productionReady === false && manifest.remoteVerified === false &&
    manifest.automaticRemindersRequiredDisabled === true &&
    manifest.projectId === '1PwInosoMgf7Cp0mHH97SlAQ1j1BnJqs2ycis75awxIkBiAS6CPWWh7dU' &&
    manifest.copiedSheetId === '1jt4AZNBfIv0SOwWzalfMRiTdqdjzpWn6--g91db11e8' &&
    manifest.sourceSHA256 === '8616a9d5fc098d1fe7408db21c25065b8748932b63bd6736b8f8acf1c84f7e35' &&
    manifest.timestamp === timestamp && manifest.runTimestamp === timestamp && manifest.runPrefix === prefix &&
    manifest.sourceProvenance === 'Local Code.gs normalized to LF; SHA-256 checked at startup' &&
    manifest.endpointProvenance === 'Explicit operator --endpoint; declaration only, not remote deployment proof' &&
    fixtures.timestamp === timestamp && fixtures.runPrefix === prefix, 'Exact clean identities/provenance required');
  const endpoint = manifest.endpoint;
  assert(endpoint === 'https://script.google.com/macros/s/AKfycbyWtXY4AYK4wjgLeDDn60APzI_fF1VYpBdZ0PS30eYqEoBrvzVmqKQxYjR38jwMZF0MLg/exec',
    'Only the exact approved clean synthetic deployment is allowed');
  const excluded = [
    'AKfycbymjXSnhFomwbFB7aHQXMffD73hKy7dXr80rixGOuDumRcnLoPOjN6L8bj1rGUMUVkC8g',
    'AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g',
    'AKfycbw755w_Pso18XZhhkqyywTngGDKNIJRYnl1vf7N5rxAUYtJBtxNhp38pFPQQt8q0y1Nuw',
    'AKfycbxNvwUUKELEdP4kQIMxdUapXfLu7XdG0EOLsX_o_fjD8EmVq4U7PHhg41j73Fmg-ZOwKg'
  ];
  assert(typeof endpoint === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) &&
    !excluded.some(id => endpoint.includes(id)), 'Explicit canonical new endpoint required; old deployments forbidden');
  const action = selection[2];
  assert(action !== 'fresh' || selection[1] === 'FRESH', 'Protected fixtures may only track or retry');
  const index = Number(selection[1]);
  const fixture = selection[1] === 'FRESH' ? fixtures.fresh : fixtures.protectionCases[index];
  const suffix = selection[1] === 'FRESH' ? 'FRESH' :
    `${['CONFIRMED', 'PAID', 'REPLIED'][Math.floor(index / 3)]}-${['LEADS', 'BOOKINGS', 'FOLLOW-UP-STATUS'][index % 3]}`;
  const leadId = `${prefix}-${suffix}`;
  assert(fixture?.leadId === leadId, 'Exact synthetic Lead ID required');
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
  assert(equal(fixture.payload, expectedPayload) && fixture.payload.email === '' &&
    fixture.payload.marketingConsent === 'No', 'Exact no-PII blank-email consent-off payload required');
  assert(equal(fixture.trackingPayload, {action: 'whatsapp_opened', leadId}), 'Exact tracking payload required');
  const body = JSON.stringify(action === 'track' ? fixture.trackingPayload : fixture.payload);
  const expected = action === 'track' ? 'WhatsApp Opened' : action === 'fresh' ? 'New Lead' : 'duplicate_ignored';
  let postCount = 0;
  const violations = [];
  const guard = async route => {
    const request = route.request();
    if (request.url() === endpoint && request.method() === 'POST' && request.postData() === body && postCount === 0) {
      postCount++; return route.continue();
    }
    let original = request;
    while (original.redirectedFrom()) original = original.redirectedFrom();
    if (postCount === 1 && request.method() === 'GET' &&
        request.url().startsWith('https://script.googleusercontent.com/') &&
        original.url() === endpoint && original.method() === 'POST' && original.postData() === body) return route.continue();
    violations.push({method: request.method(), host: request.url().split('/')[2]});
    return route.abort();
  };
  await page.route('**/*', guard);
  try {
    const actual = await page.evaluate(async ({endpoint, body}) => {
      const start = performance.now();
      const controller = new AbortController();
      // Test safety limit only; the review website's 25-second config is untouched.
      const timer = setTimeout(() => controller.abort(), 60000);
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
    const pass = !actual.uncertain && actual.httpStatus === 200 && actual.corsType === 'cors' &&
      actual.json?.ok === true && actual.json.leadId === leadId && actual.json.status === expected &&
      postCount === 1 && violations.length === 0;
    return {pass, case: selection[1], action, leadId, expected, postCount, violations, ...actual,
      actualLeadId: actual.json?.leadId ?? null, actualStatus: actual.json?.status ?? null,
      evidenceScope: 'Native browser response only, not remote identity/source or production proof. Parent owns Sheet readbacks between requests; reminders must be disabled. No automatic retry, including timeout/CORS failure.'};
  } finally { await page.unroute('**/*', guard); }
}
