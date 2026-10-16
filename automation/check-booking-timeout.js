// Local browser test: real wall-clock application timers and MOCKED delivery.
// No Google requests, real email or WhatsApp messages. Read the actual timeout config.
async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const records = new Set();
  const requests = [];
  let pending;
  let onRequest;
  await page.route('**/assets/lead-config.js', async route => {
    const original = await route.fetch();
    const body = (await original.text()).replace(/endpoint:\s*'[^']*'/, "endpoint: 'https://tsg-timeout-test.invalid/exec'");
    await route.fulfill({response:original,body});
  });
  await page.route('https://script.google.com/**', route => route.abort());
  await page.context().route('https://wa.me/**', route => route.fulfill({contentType:'text/html',body:'<p>Mock WhatsApp</p>'}));
  await page.route('https://tsg-timeout-test.invalid/**', route => {
    const payload = JSON.parse(route.request().postData());
    if (payload.action !== 'lead_submit') return route.fulfill({body:'{}',headers:{'Access-Control-Allow-Origin':'*'}});
    requests.push(payload);
    pending = {route,payload};
    onRequest(pending);
  });
  await page.goto('http://127.0.0.1:4188/book.html');
  assert(await page.evaluate(() => window.TSG_LEAD_CONFIG.requestTimeoutMs) === 25000, 'Production configuration must specify 25 seconds');
  const form = page.locator('#bookingForm');
  await form.getByLabel('Contact name',{exact:true}).fill('Synthetic Timeout Test');
  await form.getByLabel('WhatsApp number',{exact:true}).fill('+18685550100');
  await form.getByRole('combobox',{name:'Island',exact:true}).selectOption('Trinidad');
  await form.getByLabel('Preferred date',{exact:true}).fill('2027-01-05');
  await form.getByLabel('Preferred time',{exact:true}).fill('10:30');
  const participant = form.getByRole('group',{name:'Participant 1',exact:true});
  await participant.getByLabel('Age',{exact:true}).fill('30');
  await participant.getByRole('combobox',{name:'Experience',exact:true}).selectOption('Beginner');
  await participant.getByRole('combobox',{name:'Rental skates needed',exact:true}).selectOption('No');
  const submit = form.locator('[type=submit]');
  const status = form.locator('[data-form-status]');
  const link = form.locator('[data-whatsapp-link]');
  const start = async () => {
    const arrived = new Promise(resolve => { onRequest = resolve; });
    await submit.click();
    const request = await arrived;
    assert(await link.isVisible(), 'WhatsApp is ready immediately, before the held response');
    assert((await status.innerText()).includes('pending') && !(await status.innerText()).includes('saved'), 'Pending is not saved');
    return request;
  };
  const acknowledge = async request => {
    const duplicate = records.has(request.payload.leadId);
    records.add(request.payload.leadId);
    try { await request.route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},
      body:JSON.stringify({ok:true,leadId:request.payload.leadId,status:duplicate?'duplicate_ignored':'New Lead'})}); }
    catch { /* The client may have timed out; server storage can still finish. */ }
  };
  for (const delay of [9245, 12394, 18000]) {
    await form.getByLabel('Preferred area',{exact:true}).fill(`Synthetic ${delay}ms response`);
    const request = await start();
    await page.waitForTimeout(delay);
    assert((await status.innerText()).includes('pending'), `No premature timeout at ${delay}ms`);
    await acknowledge(request);
    await status.filter({hasText:'Your details were saved'}).waitFor();
    assert(await link.isVisible(), 'WhatsApp remains usable after acknowledgement');
  }
  await form.getByLabel('Preferred area',{exact:true}).fill('Synthetic over-deadline response');
  const slow = await start();
  const prepared = await link.getAttribute('href');
  const popupPromise = page.waitForEvent('popup');
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  assert(popup.url().startsWith('https://wa.me/18682766878'), 'WhatsApp opens before storage completes');
  await popup.close();
  await status.filter({hasText:'timed out; storage may still complete'}).waitFor({timeout:28000});
  assert(!/saved|received/i.test(await status.innerText()), 'Timeout never claims saved/received');
  assert(await submit.isEnabled() && await link.isVisible(), 'Timeout restores retry without blocking WhatsApp');
  assert(await form.getByLabel('Contact name',{exact:true}).inputValue() === 'Synthetic Timeout Test', 'Contact details retained');
  assert(await form.getByLabel('Preferred area',{exact:true}).inputValue() === 'Synthetic over-deadline response', 'Scheduling details retained');
  await acknowledge(slow);
  assert(!(await status.innerText()).includes('saved'), 'Late server completion cannot turn timeout into unverified success');
  const count = records.size;
  const retry = await start();
  assert(retry.payload.leadId === slow.payload.leadId && retry.payload.timestamp === slow.payload.timestamp, 'Retry preserves ID and timestamp');
  await acknowledge(retry);
  await status.filter({hasText:'Your details were saved'}).waitFor();
  assert(records.size === count, 'Retry does not create another mocked record');
  assert(await link.getAttribute('href') === prepared, 'Prepared WhatsApp message unchanged');
  return 'PASS (MOCKED DELIVERY / REAL WALL CLOCK): actual 25000ms config; readable acknowledgements after 9245/12394/18000ms response holds; 25-second timeout without a response; immediate WhatsApp opening, retained details, accurate uncertainty and same-ID duplicate retry. No real Google save or email.';
}
