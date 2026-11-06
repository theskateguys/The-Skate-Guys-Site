// ONE native browser request; parent must read the copied Sheet before any next action.
async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const base = 'http://127.0.0.1:4197';
  const endpoint = 'https://script.google.com/macros/s/AKfycbxNvwUUKELEdP4kQIMxdUapXfLu7XdG0EOLsX_o_fjD8EmVq4U7PHhg41j73Fmg-ZOwKg/exec';
  const selection = /#(FRESH|[0-8])-(fresh|retry|track)$/.exec(page.url());
  assert(selection && page.url().startsWith(base + '/#'), 'Explicit loopback case/action required');
  const read = async path => {
    const response = await page.request.get(base + path, {maxRedirects: 0});
    assert(response.status() === 200, 'Local fixture unavailable'); return response.json();
  };
  const manifest = await read('/manifest.json');
  const fixtures = await read('/fixtures.json');
  assert(manifest.endpoint === endpoint && manifest.purpose === 'ISOLATED_LEGACY_ACCEPTANCE_ONLY' &&
    manifest.productionReady === false && manifest.projectId === '1qXXCOqzdedWiuwjdR1bcJHp7T517fbXUlFl_s9NVfNKlytGmNpWrVKU9' &&
    manifest.copiedSheetId === '1CuA0uWDnUu-EK0XseYxNNpEK4lX5SZ7S5UuTdy-HCyM' &&
    manifest.sourceSHA256 === '8616a9d5fc098d1fe7408db21c25065b8748932b63bd6736b8f8acf1c84f7e35' &&
    fixtures.runPrefix === 'LEGACY-ACCEPTANCE-20261017T001000000Z', 'Exact isolated source/destination required');
  const fixture = selection[1] === 'FRESH' ? fixtures.fresh : fixtures.protectionCases[Number(selection[1])];
  const action = selection[2];
  assert(action !== 'fresh' || selection[1] === 'FRESH', 'Protected fixtures must be seeded, never fresh-submitted');
  const payload = action === 'track' ? fixture.trackingPayload : fixture.payload;
  assert(payload.leadId === fixture.leadId && payload.leadId.startsWith(fixtures.runPrefix), 'Labelled ID required');
  assert(action === 'track' || (payload.email === '' && payload.marketingConsent === 'No'), 'No email/consent allowed');
  const expected = action === 'track' ? 'WhatsApp Opened' : action === 'fresh' ? 'New Lead' : 'duplicate_ignored';
  const body = JSON.stringify(payload);
  let postCount = 0; const violations = [];
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
    violations.push({method: request.method(), host: request.url().split('/')[2]}); return route.abort();
  };
  await page.route('**/*', guard);
  try {
    const actual = await page.evaluate(async ({endpoint, body}) => {
      const start = performance.now(); const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);
      try {
        const response = await fetch(endpoint, {method: 'POST', mode: 'cors', redirect: 'follow',
          headers: {'Content-Type': 'text/plain;charset=utf-8'}, body, signal: controller.signal});
        const json = await response.json();
        return {httpStatus: response.status, type: response.type, json, responseTimeMs: performance.now() - start};
      } catch (error) { return {uncertain: true, errorName: error.name, responseTimeMs: performance.now() - start}; }
      finally { clearTimeout(timer); }
    }, {endpoint, body});
    const pass = !actual.uncertain && actual.httpStatus === 200 && actual.type === 'cors' &&
      actual.json?.ok === true && actual.json.leadId === fixture.leadId && actual.json.status === expected &&
      postCount === 1 && violations.length === 0;
    return {pass,case:selection[1],action,leadId:fixture.leadId,expected,postCount,violations,...actual,
      evidenceScope:'Native browser Google response only; parent must read back rows/statuses before continuing. No mocks, no automatic retry.'};
  } finally { await page.unroute('**/*', guard); }
}
