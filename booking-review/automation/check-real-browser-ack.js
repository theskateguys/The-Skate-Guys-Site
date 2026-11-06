// Opt-in REAL isolated Web App test. Requires an authorized, temporary private fixture.
// No route fulfilment or mocked responses. Reuses an existing lead; never run on production.
// Runner contract: async (page, {expectedCandidateEndpoint, approveFresh=false} = {}).
// Omit options for legacy v1. Candidate mode requires the loopback approval manifest.
// Candidate private fixture: endpoint, approvedIsolatedCandidate:true,
// automaticRemindersDisabled:true, ownContactDetails:true,
// existingRowsCompleteVerifiedByParent:true, payload (without receipt fields),
// leadId, timestamp; fresh additionally requires freshApproved:true,
// freshLeadId and freshTimestamp (canonical millisecond UTC ISO strings).
async (page, {expectedCandidateEndpoint, approveFresh = false, freshOnly = false} = {}) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const base = 'http://127.0.0.1:4192';
  const candidateMode = expectedCandidateEndpoint !== undefined;
  assert(typeof approveFresh === 'boolean', 'approveFresh must be an explicit boolean');
  assert(!approveFresh || candidateMode, 'Fresh submissions require candidate mode');
  if (candidateMode) {
    assert(typeof expectedCandidateEndpoint === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(expectedCandidateEndpoint), 'Explicit canonical approved candidate endpoint required');
    assert(expectedCandidateEndpoint !== 'https://script.google.com/macros/s/AKfycbymjXSnhFomwbFB7aHQXMffD73hKy7dXr80rixGOuDumRcnLoPOjN6L8bj1rGUMUVkC8g/exec' &&
      expectedCandidateEndpoint !== 'https://script.google.com/macros/s/AKfycbw755w_Pso18XZhhkqyywTngGDKNIJRYnl1vf7N5rxAUYtJBtxNhp38pFPQQt8q0y1Nuw/exec', 'Production and old v1 forbidden for candidate acceptance');
    const response = await page.request.get(`${base}/isolated-test-manifest.json`);
    assert(response.ok(), 'Local candidate manifest required');
    const manifest = await response.json();
    assert(manifest.mode === 'optimized-candidate' && manifest.expectedCandidateEndpoint === expectedCandidateEndpoint &&
      manifest.endpoint === expectedCandidateEndpoint && manifest.requestTimeoutMs === 25000, 'Candidate must match independently approved loopback manifest');
  }
  const fixtureResponse = await page.request.get(`${base}/output/${candidateMode ? 'optimized-acceptance' : 'real-browser-ack'}-private.json`);
  assert(fixtureResponse.ok(), 'Authorized private fixture required');
  const fixture = await fixtureResponse.json();
  assert(!freshOnly || (candidateMode && approveFresh && fixture.duplicateReadbackVerified === true), 'Fresh-only phase requires parent-verified duplicate rows and mail');
  assert(fixture.endpoint === (candidateMode ? expectedCandidateEndpoint : 'https://script.google.com/macros/s/AKfycbw755w_Pso18XZhhkqyywTngGDKNIJRYnl1vf7N5rxAUYtJBtxNhp38pFPQQt8q0y1Nuw/exec'), 'Only the explicitly allowlisted isolated Web App is allowed');
  if (candidateMode) assert(fixture.approvedIsolatedCandidate === true && fixture.automaticRemindersDisabled === true &&
    fixture.ownContactDetails === true && fixture.existingRowsCompleteVerifiedByParent === true,
  'Approved own-contact fixture, disabled reminders and parent complete-row verification required');
  const validReceipt = (id, timestamp) => typeof id === 'string' && /^TSG-[A-Za-z0-9-]+$/.test(id) &&
    typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp) &&
    Number.isFinite(Date.parse(timestamp)) && new Date(timestamp).toISOString() === timestamp;
  assert(validReceipt(fixture.leadId, fixture.timestamp), 'Explicit existing receipt required');
  assert(fixture.payload?.action === 'lead_submit' && fixture.payload.leadType === 'booking' &&
    !('leadId' in fixture.payload) && !('timestamp' in fixture.payload), 'Existing booking payload must exclude receipt fields');
  if (approveFresh) assert(fixture.freshApproved === true && validReceipt(fixture.freshLeadId, fixture.freshTimestamp) &&
    fixture.freshLeadId !== fixture.leadId && fixture.freshTimestamp !== fixture.timestamp, 'Explicit unique stable fresh receipt and fixture approval required');
  const run = async (page, fixture, expectedStatus, label) => {
  const signature = JSON.stringify(fixture.payload);
  const digest = await page.evaluate(async signature => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signature)))].map(n => n.toString(16).padStart(2, '0')).join(''), signature);
  await page.addInitScript(({leadId, timestamp, digest, endpoint, signature}) => {
    sessionStorage.setItem('tsgSubmission:booking', JSON.stringify({leadId, timestamp, digest}));
    window.__tsgRealAckEvidence = {requests: [], reads: [], saved: [], whatsapp: []};
    const nativeFetch = window.fetch;
    // No handoff, tracking or alternate write transport is permitted in this fixture.
    document.addEventListener('click', event => {
      if (event.target.closest?.('a')) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    window.open = () => { throw new Error('External navigation forbidden'); };
    navigator.sendBeacon = () => { throw new Error('Beacon forbidden'); };
    XMLHttpRequest.prototype.send = () => { throw new Error('XHR forbidden'); };
    window.fetch = function(url, options) {
      if (String(url) === endpoint && options?.method === 'POST') {
        const payload = JSON.parse(options.body);
        const details = {...payload}; delete details.leadId; delete details.timestamp;
        // Fail closed BEFORE transmission if receipt seeding or unchanged-request matching fails.
        if (window.__tsgRealAckEvidence.requests.length !== 0 || payload.action !== 'lead_submit' || payload.leadId !== leadId || payload.timestamp !== timestamp || JSON.stringify(details) !== signature) throw new Error('Refusing an unexpected or repeated request');
        window.__tsgRealAckEvidence.requests.push({leadId:payload.leadId, timestamp:payload.timestamp, mode:options.mode, at:performance.now()});
      } else throw new Error('Only the single approved native POST is permitted');
      return nativeFetch.call(this, url, options);
    };
    const nativeJson = Response.prototype.json;
    Response.prototype.json = async function() {
      const body = await nativeJson.call(this);
      const host = this.url ? new URL(this.url).hostname : '';
      if (host === 'script.googleusercontent.com' || host === 'script.google.com') {
        window.__tsgRealAckEvidence.reads.push({host, type:this.type, httpStatus:this.status, ok:body.ok, matchingReference:body.leadId === leadId, status:body.status, at:performance.now(), savedAlreadyVisible:document.querySelector('#bookingForm [data-form-status]')?.textContent.includes('Your details were saved')});
      }
      return body; // The original browser response, unchanged, is consumed by the actual app.
    };
    document.addEventListener('DOMContentLoaded', () => {
      const status = document.querySelector('#bookingForm [data-form-status]');
      new MutationObserver(() => {
        if (status.textContent.includes('Your details were saved')) window.__tsgRealAckEvidence.saved.push({at:performance.now(), readsSeen:window.__tsgRealAckEvidence.reads.length});
      }).observe(status, {childList:true, subtree:true, characterData:true});
      new MutationObserver(() => {
        const link = document.querySelector('#bookingForm [data-whatsapp-link]');
        if (link?.getClientRects().length && !window.__tsgRealAckEvidence.whatsapp.length) {
          const url = new URL(link.href);
          window.__tsgRealAckEvidence.whatsapp.push({at:performance.now(), host:url.hostname,
            number:url.pathname.slice(1), matchingReference:url.searchParams.get('text')?.includes(leadId),
            readsSeen:window.__tsgRealAckEvidence.reads.length});
        }
      }).observe(document.querySelector('#bookingForm'), {attributes:true, childList:true, subtree:true});
    });
  }, {leadId:fixture.leadId,timestamp:fixture.timestamp,digest,endpoint:fixture.endpoint,signature});
  await page.goto(`${base}/book.html`, {referer:''});
  const activeEndpoint = await page.evaluate(() => window.TSG_LEAD_CONFIG.endpoint);
  assert(activeEndpoint === fixture.endpoint, 'Actual form must use isolated endpoint');
  assert(await page.evaluate(() => window.TSG_LEAD_CONFIG.requestTimeoutMs) === 25000, 'Actual review config must use 25-second timeout');
  const form = page.locator('#bookingForm');
  const p = fixture.payload;
  await form.getByLabel('Contact name', {exact:true}).fill(p.name);
  await form.getByLabel('WhatsApp number', {exact:true}).fill(p.whatsapp);
  await form.getByLabel('Email (optional)', {exact:true}).fill(p.email);
  await form.getByRole('combobox', {name:'Island',exact:true}).selectOption(p.location);
  await form.getByLabel('Preferred area', {exact:true}).fill(p.preferredArea);
  await form.getByLabel('Preferred date', {exact:true}).fill(p.preferredDate);
  await form.getByLabel('Preferred time', {exact:true}).fill(p.preferredTime);
  await form.getByLabel('Number of participants', {exact:true}).fill(String(p.participantCount));
  for (const [index, participant] of p.participants.entries()) {
    const row = form.getByRole('group',{name:`Participant ${index+1}`,exact:true});
    await row.getByLabel('Age',{exact:true}).fill(String(participant.age));
    await row.getByRole('combobox',{name:'Experience',exact:true}).selectOption(participant.experience);
    await row.getByRole('combobox',{name:'Rental skates needed',exact:true}).selectOption(participant.rentals);
    if (participant.rentals === 'Yes') {
      await row.getByLabel('Skate size',{exact:true}).fill(participant.skateSize);
      await row.getByRole('combobox',{name:'Sizing system',exact:true}).selectOption(participant.sizeSystem);
    }
    if (participant.age < 18) {
      await row.getByLabel('Guardian name',{exact:true}).fill(participant.guardianName);
      await row.getByLabel('Guardian WhatsApp',{exact:true}).fill(participant.guardianPhone);
    }
  }
  await form.locator('[name=marketingConsent]').setChecked(p.marketingConsent === 'Yes');
  const status = form.locator('[data-form-status]');
  const submit = form.locator('[type=submit]');
  await submit.click();
  await form.locator('[data-whatsapp-link]').waitFor({state:'visible',timeout:2000});
  await status.filter({hasText:/Your details were saved|delivery could not be verified|storage could not be verified/}).waitFor({timeout:30000});
  const evidence = await page.evaluate(() => window.__tsgRealAckEvidence);
  const text = await status.innerText();
  const pass = text.startsWith('Your details were saved') && evidence.requests.length === 1 && evidence.reads.length === 1 &&
    evidence.reads[0].type === 'cors' && evidence.reads[0].httpStatus === 200 && evidence.reads[0].ok === true && evidence.reads[0].matchingReference &&
    evidence.reads[0].status === expectedStatus && evidence.reads[0].savedAlreadyVisible === false &&
    evidence.saved.length > 0 && evidence.saved.every(s => s.readsSeen === 1 && s.at >= evidence.reads[0].at) &&
    evidence.whatsapp.length === 1 && evidence.whatsapp[0].readsSeen === 0 && evidence.whatsapp[0].host === 'wa.me' &&
    evidence.whatsapp[0].number === '18682766878' && evidence.whatsapp[0].matchingReference &&
    evidence.whatsapp[0].at < evidence.reads[0].at && evidence.whatsapp[0].at - evidence.requests[0].at < 2000 && evidence.reads[0].at - evidence.requests[0].at < 25000;
  // Screenshot only the non-PII result panel, never the contact/participant fields.
  await status.screenshot({path:`output/playwright/${label}-status.png`});
  // Never return contact fields, raw receipt identifiers or timestamps.
  evidence.requests = evidence.requests.map(({mode, at}) => ({mode, at}));
  return {pass, savedVisible:text.startsWith('Your details were saved'), evidence,
    requestTimeMs:evidence.reads.length === 1 ? evidence.reads[0].at - evidence.requests[0].at : null};
  };
  const runInPrivatePage = async (input, status, label) => {
    const testPage = await page.context().newPage();
    try {
      await testPage.goto(`${base}/book.html`, {referer:''});
      return await run(testPage, input, status, label);
    }
    finally { await testPage.close(); }
  };
  const duplicate = freshOnly ? null : await runInPrivatePage(fixture, 'duplicate_ignored', candidateMode ? 'optimized-duplicate' : 'real-browser-ack');
  if (!freshOnly && (!duplicate.pass || !approveFresh)) return {pass:duplicate.pass, duplicate, fresh:'not-run',
    noWriteClaim:'Not established by browser evidence; parent must compare complete existing rows and email evidence.'};
  const freshFixture = {...fixture, leadId:fixture.freshLeadId, timestamp:fixture.freshTimestamp,
    payload:{...fixture.payload, name:'TEST ONLY - Dylon optimized blank-email acceptance', email:'', marketingConsent:'No'}};
  const fresh = await runInPrivatePage(freshFixture, 'New Lead', 'optimized-fresh');
  return {pass:(freshOnly || duplicate.pass) && fresh.pass, duplicate, fresh,
    scope:'Native isolated candidate acknowledgements only; no mocked responses, WhatsApp click/tracking or email request. Parent must verify complete rows, subscriber state and no email side effects.'};
}
