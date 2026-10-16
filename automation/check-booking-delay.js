// Playwright CLI fixture. All deliveries and email counts below are MOCKED.
async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const leads = new Set();
  const requests = [];
  let emails = 0;
  let mode = 'delayed';
  const remindersEnabled = false;
  let saved;
  const completed = new Promise(resolve => { saved = resolve; });
  await page.route('**/assets/lead-config.js', route => route.fulfill({contentType: 'text/javascript',
    body: "window.TSG_LEAD_CONFIG={endpoint:'https://tsg-delay-test.invalid/exec',requestTimeoutMs:9000};"}));
  await page.route('https://script.google.com/**', route => route.abort());
  await page.context().route('https://wa.me/**', route => route.fulfill({contentType: 'text/html', body: '<p>Mock WhatsApp</p>'}));
  await page.route('https://tsg-delay-test.invalid/**', async route => {
    const payload = JSON.parse(route.request().postData());
    if (payload.action !== 'lead_submit') return route.fulfill({body: '{}', headers: {'Access-Control-Allow-Origin': '*'}});
    requests.push(payload);
    if (mode === 'delayed') await page.waitForTimeout(18000);
    const duplicate = leads.has(payload.leadId);
    if (!duplicate) { leads.add(payload.leadId); emails++; }
    saved();
    const body = mode === 'invalid' ? 'not JSON' : JSON.stringify({
      ok: mode !== 'rejected', leadId: mode === 'mismatch' ? 'WRONG-ID' : payload.leadId,
      status: duplicate ? 'duplicate_ignored' : 'New Lead'
    });
    try { await route.fulfill({contentType: 'application/json', body, headers: {'Access-Control-Allow-Origin': '*'}}); }
    catch { /* A timeout does not cancel server-side storage. */ }
  });
  await page.goto('http://127.0.0.1:4188/book.html');
  const form = page.locator('#bookingForm');
  await form.getByLabel('Contact name', {exact: true}).fill('Synthetic Delay Test');
  await form.getByLabel('WhatsApp number', {exact: true}).fill('+18685550100');
  await form.getByLabel('Email (optional)', {exact: true}).fill('synthetic@example.test');
  await form.getByRole('combobox', {name: 'Island', exact: true}).selectOption('Trinidad');
  await form.getByLabel('Preferred area', {exact: true}).fill('Agreed test area');
  await form.getByLabel('Preferred date', {exact: true}).fill('2027-01-05');
  await form.getByLabel('Preferred time', {exact: true}).fill('10:30');
  const participant = form.getByRole('group', {name: 'Participant 1', exact: true});
  await participant.getByLabel('Age', {exact: true}).fill('30');
  await participant.getByRole('combobox', {name: 'Experience', exact: true}).selectOption('Beginner');
  await participant.getByRole('combobox', {name: 'Rental skates needed', exact: true}).selectOption('No');
  const submit = form.locator('[type=submit]');
  const status = form.locator('[data-form-status]');
  const link = form.locator('[data-whatsapp-link]');
  const started = Date.now();
  await submit.click();
  await link.waitFor({state: 'visible', timeout: 1500});
  const readyMs = Date.now() - started;
  assert(readyMs < 1500 && leads.size === 0, 'WhatsApp ready before delayed storage');
  assert((await status.innerText()).includes('pending'), 'Pending state does not claim storage');
  assert(!/saved|received/i.test(await status.innerText()), 'No premature acknowledgement');
  const prepared = await link.getAttribute('href');
  const popupPromise = page.waitForEvent('popup');
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  assert(popup.url().startsWith('https://wa.me/18682766878'), 'WhatsApp opens while save is pending');
  await popup.close();
  assert(leads.size === 0, 'Opening WhatsApp did not wait for storage');
  await page.screenshot({path: 'output/playwright/booking-pending.png'});
  await status.filter({hasText: 'timed out'}).waitFor({timeout: 12000});
  assert(await link.isVisible() && await submit.isEnabled(), 'Timeout retains WhatsApp and retry');
  assert(await form.getByLabel('Contact name', {exact: true}).inputValue() === 'Synthetic Delay Test', 'Entered details retained');
  await completed;
  assert(leads.size === 1 && !remindersEnabled && emails === 1, 'Delayed mock save: one lead, one acknowledgement, no reminders');
  mode = 'ack';
  await submit.click();
  await status.filter({hasText: 'Your details were saved'}).waitFor();
  assert(requests[1].leadId === requests[0].leadId && requests[1].timestamp === requests[0].timestamp, 'Retry keeps ID and timestamp');
  assert(leads.size === 1 && emails === 1, 'Duplicate retry does not repeat mock save or email');
  assert(await link.getAttribute('href') === prepared, 'Prepared message is stable');
  for (mode of ['mismatch', 'rejected', 'invalid']) {
    await submit.click();
    await status.filter({hasText: /storage could not be verified|delivery could not be verified/}).waitFor();
    assert(!/saved|received/i.test(await status.innerText()), `No saved state for ${mode} acknowledgement`);
    assert(await link.isVisible() && await submit.isEnabled(), 'Uncertain delivery is recoverable');
  }
  // Explicit opaque response, independent of CORS support in the test browser.
  await page.evaluate(() => { window.fetch = async () => ({type: 'opaque', ok: false}); });
  await submit.click();
  await status.filter({hasText: 'storage could not be verified'}).waitFor();
  assert(!/saved|received/i.test(await status.innerText()), 'Opaque response is never saved');
  return `PASS (MOCKED): WhatsApp ready in ${readyMs}ms; 18-second save/9-second timeout, same-ID duplicate retry, readable matching acknowledgement, invalid/mismatched/rejected/opaque responses; reminders disabled. No real Google save or email.`;
}
