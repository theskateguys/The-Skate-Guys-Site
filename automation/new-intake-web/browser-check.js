// playwright-cli run-code --filename; localhost UI + in-page delivery mocks only.
async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const base = 'http://127.0.0.1:4198';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.context().route('**/*', route => {
    if (route.request().url().startsWith(`${base}/`)) return route.continue();
    return route.abort();
  });
  await page.route('**/assets/lead-config.js', async route => {
    const response = await route.fetch();
    const config = await response.text();
    assert(config.includes('requestTimeoutMs: 25000'), 'Artifact config must retain 25000ms');
    await route.fulfill({response, body: config.replace(/endpoint:\s*'[^']*'/,
      "endpoint: 'https://new-intake-local-mock.invalid/exec'")});
  });
  await page.addInitScript(() => {
    const nativeFetch = window.fetch.bind(window);
    const mock = window.__intakeMock = {requests: [], pending: [], mode: 'held'};
    window.fetch = async (url, options) => {
      if (url !== 'https://new-intake-local-mock.invalid/exec') return nativeFetch(url, options);
      const payload = JSON.parse(options.body);
      mock.requests.push({payload, mode: options.mode, contentType: options.headers['Content-Type'], started: performance.now()});
      if (payload.action !== 'lead_submit') return new Response('{}');
      if (mock.mode === 'failed') throw new TypeError('Synthetic network failure');
      if (mock.mode === 'opaque') return {type: 'opaque', ok: false};
      if (mock.mode === 'http-error') return new Response('{}', {status: 503});
      if (mock.mode === 'invalid-json') return new Response('not JSON');
      if (mock.mode === 'mismatched') return Response.json({ok: true, leadId: 'WRONG-ID', status: 'New Lead'});
      if (mock.mode === 'missing-id') return Response.json({ok: true, status: 'New Lead'});
      if (mock.mode === 'bad-status') return Response.json({ok: true, leadId: payload.leadId, status: 'Paid'});
      if (mock.mode === 'saved') return Response.json({ok: true, leadId: payload.leadId, status: 'New Lead'});
      if (mock.mode === 'duplicate') return Response.json({ok: true, leadId: payload.leadId, status: 'duplicate_ignored'});
      return new Promise((resolve, reject) => {
        mock.pending.push({payload, resolve});
        options.signal.addEventListener('abort', () => reject(new DOMException('Synthetic aborted request', 'AbortError')), {once: true});
      });
    };
  });
  await page.goto(`${base}/book.html?utm_source=local_mock&utm_campaign=new_intake`);
  const form = page.locator('#bookingForm');
  const button = form.locator('[type=submit]');
  const status = form.locator('[data-form-status]');
  const link = form.locator('[data-whatsapp-link]');
  const fill = async () => {
    await form.getByLabel('Contact name', {exact: true}).fill('SYNTHETIC LOCAL MOCK ONLY');
    await form.getByLabel('WhatsApp number', {exact: true}).fill('+18685550100');
    await form.getByRole('combobox', {name: 'Island', exact: true}).selectOption('Tobago');
    await form.getByLabel('Preferred area', {exact: true}).fill('Synthetic Black Rock');
    await form.getByLabel('Preferred date', {exact: true}).fill('2027-01-05');
    await form.getByLabel('Preferred time', {exact: true}).fill('10:30');
    await form.getByLabel('Number of participants', {exact: true}).fill('2');
    const adult = form.getByRole('group', {name: 'Participant 1', exact: true});
    await adult.getByLabel('Age', {exact: true}).fill('30');
    await adult.getByRole('combobox', {name: 'Experience', exact: true}).selectOption('Beginner');
    await adult.getByRole('combobox', {name: 'Rental skates needed', exact: true}).selectOption('No');
    const child = form.getByRole('group', {name: 'Participant 2', exact: true});
    await child.getByLabel('Age', {exact: true}).fill('12');
    await child.getByRole('combobox', {name: 'Experience', exact: true}).selectOption('First time');
    await child.getByRole('combobox', {name: 'Rental skates needed', exact: true}).selectOption('Yes');
    await child.getByLabel('Skate size', {exact: true}).fill('5');
    await child.getByRole('combobox', {name: 'Sizing system', exact: true}).selectOption('UK child');
    await child.getByLabel('Guardian name', {exact: true}).fill('SYNTHETIC GUARDIAN');
    await child.getByLabel('Guardian WhatsApp', {exact: true}).fill('+18685550100');
  };
  const requests = () => page.evaluate(() => window.__intakeMock.requests.filter(item => item.payload.action === 'lead_submit'));
  const mode = value => page.evaluate(value => { window.__intakeMock.mode = value; }, value);
  const submit = async () => {
    const count = (await requests()).length;
    await button.click();
    await page.waitForFunction(count => window.__intakeMock.requests.filter(item => item.payload.action === 'lead_submit').length === count + 1, count);
  };
  const finished = () => button.waitFor({state: 'visible'}).then(() => page.waitForFunction(() => !document.querySelector('#bookingForm [type=submit]').disabled));
  await button.click();
  assert((await requests()).length === 0, 'Empty form does not submit');
  await fill();
  const child = form.getByRole('group', {name: 'Participant 2', exact: true});
  await child.getByLabel('Skate size', {exact: true}).fill('');
  await button.click();
  assert((await requests()).length === 0, 'Missing rental size blocked');
  await child.getByLabel('Skate size', {exact: true}).fill('5');
  await form.locator('[name=marketingConsent]').check();
  await button.click();
  assert((await requests()).length === 0, 'Marketing opt-in without email blocked');
  await form.locator('[name=marketingConsent]').uncheck();
  await submit();
  const first = (await requests())[0];
  assert(first.mode === 'cors' && first.contentType === 'text/plain;charset=utf-8', 'Readable simple-CORS POST contract retained');
  assert(await link.isVisible(), 'WhatsApp available while response is held');
  assert((await status.innerText()).includes('pending'), 'Pending is not saved');
  assert(await button.isDisabled(), 'Busy submission cannot duplicate');
  const prepared = await link.evaluate(element => ({href: element.href, pathname: new URL(element.href).pathname,
    text: new URL(element.href).searchParams.get('text')}));
  assert(prepared.pathname === '/18682766878', 'Approved WhatsApp recipient');
  for (const text of [first.payload.leadId, 'TT$80', '75 minutes', 'UK child', 'SYNTHETIC GUARDIAN', '2027-01-05', '10:30', 'one calendar month', 'last day of that month', 'local_mock', 'not confirmed']) {
    assert(prepared.text.includes(text), `WhatsApp message contains ${text}`);
  }
  const policy = await page.locator('.booking-policy').innerText();
  assert(policy.includes("We'll confirm your revised credit expiry with you."), 'Customer-facing credit expiry');
  assert(!policy.includes('record the agreed'), 'Internal policy wording removed from HTML');
  await page.waitForTimeout(1000);
  assert((await status.innerText()).includes('pending'), 'Held response remains uncertain');
  await page.evaluate(() => {
    const pending = window.__intakeMock.pending[0];
    pending.resolve(Response.json({ok: true, leadId: pending.payload.leadId, status: 'New Lead'}));
  });
  await finished();
  assert((await status.innerText()).includes('Your details were saved'), 'Matching readable JSON is saved');

  for (const responseMode of ['missing-id', 'mismatched', 'bad-status', 'invalid-json', 'opaque', 'http-error', 'failed']) {
    await mode(responseMode);
    await submit();
    await finished();
    assert(!(await status.innerText()).includes('Your details were saved'), `${responseMode} never claims saved`);
    assert((await requests()).at(-1).payload.leadId === first.payload.leadId, `${responseMode} unchanged retry keeps ID`);
    assert(await link.isVisible(), `${responseMode} preserves WhatsApp`);
  }
  await mode('held');
  await submit();
  assert(await link.isVisible(), 'Immediate WhatsApp before 25-second deadline');
  await page.waitForTimeout(18000);
  assert((await status.innerText()).includes('pending'), 'No premature timeout at 18 seconds');
  await status.filter({hasText: 'timed out; storage may still complete'}).waitFor({timeout: 10000});
  await finished();
  assert(await form.getByLabel('Contact name', {exact: true}).inputValue() === first.payload.name, 'Timeout retains form details');
  await page.evaluate(() => {
    const pending = window.__intakeMock.pending.at(-1);
    pending.resolve(Response.json({ok: true, leadId: pending.payload.leadId, status: 'New Lead'}));
  });
  assert(!(await status.innerText()).includes('Your details were saved'), 'Late completion does not claim saved');
  await mode('duplicate');
  await submit();
  await finished();
  const retry = (await requests()).at(-1).payload;
  assert(retry.leadId === first.payload.leadId && retry.timestamp === first.payload.timestamp, 'Timeout retry retains ID and timestamp');
  assert((await status.innerText()).includes('Your details were saved'), 'Matching duplicate acknowledgement is saved');
  assert(await link.getAttribute('href') === prepared.href, 'Unchanged prepared message retained');

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.evaluate(() => scrollTo(0, 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}`);
    await page.screenshot({path: `output/playwright/new-intake-${width}.png`, fullPage: true});
  }
  await page.reload();
  await fill();
  await mode('duplicate');
  await submit();
  await finished();
  assert((await requests()).at(-1).payload.leadId === first.payload.leadId, 'Refresh retry retains ID');
  assert(!await page.evaluate(() => JSON.stringify(sessionStorage)).then(text => /SYNTHETIC|5550100|Black Rock/.test(text)), 'No PII persisted with receipt');
  await form.getByLabel('Preferred area', {exact: true}).fill('Changed synthetic area');
  assert(!await link.isVisible(), 'Edits hide stale message');
  await submit();
  await finished();
  assert((await requests()).at(-1).payload.leadId !== first.payload.leadId, 'Edited request gets new ID');
  await form.getByLabel('Number of participants', {exact: true}).fill('1');
  await form.getByLabel('Number of participants', {exact: true}).fill('2');
  assert(await child.getByLabel('Skate size', {exact: true}).inputValue() === '5', 'Participant count toggle preserves details');
  for (const name of ['index.html', 'merch.html', 'elite.html']) {
    await page.goto(`${base}/${name}`);
    assert(await page.title(), `${name} renders`);
  }
  assert(errors.length === 0, `No page errors: ${errors.join(', ')}`);
  return 'PASS: LOCAL BROWSER + IN-PAGE MOCKS ONLY. Actual 25000ms deadline, immediate WhatsApp, readable matching saved/duplicate JSON, uncertain invalid/mismatched/opaque/error responses, same-ID/timestamp and refresh retries, retained details, validation and 390/768/1440 screenshots. No Google, email, WhatsApp send or production verification.';
}
