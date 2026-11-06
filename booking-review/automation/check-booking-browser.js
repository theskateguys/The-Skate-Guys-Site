// Run via playwright-cli run-code --filename. Every submission is intercepted.
async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const base = 'http://127.0.0.1:4188';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const payloads = [];
  let mode = 'opaque';
  await page.route('**/assets/lead-config.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: "window.TSG_LEAD_CONFIG={endpoint:'https://tsg-booking-test.invalid/exec',whatsappNumber:'18682766878',requestTimeoutMs:250};"
  }));
  await page.route('https://script.google.com/**', route => route.abort());
  await page.route('https://tsg-booking-test.invalid/**', async route => {
    payloads.push(JSON.parse(route.request().postData()));
    if (mode === 'failed') return route.abort();
    if (mode === 'timeout') await page.waitForTimeout(600);
    try { await route.fulfill({contentType: 'text/plain', body: '{"ok":true}'}); } catch { /* Aborted timeout request. */ }
  });
  await page.context().route('https://wa.me/**', route => route.fulfill({contentType: 'text/html', body: '<p>Mock WhatsApp handoff</p>'}));
  await page.goto(`${base}/book.html?utm_source=browser_mock&utm_campaign=single_session`);
  const form = page.locator('#bookingForm');
  assert(await page.locator('.booking-policy li').count() === 7, 'All seven approved policy rules are visible');
  for (const rule of ['no automatic credit', 'genuine emergencies', 'without penalty', 'last day of that month', 'agreed new expiry', 'Transfers require TSG approval', 'Credit rather than refunds']) assert((await page.locator('.booking-policy').innerText()).includes(rule), `Booking policy includes ${rule}`);
  const submit = form.locator('button[type=submit]');
  const status = form.locator('[data-form-status]');
  const waitForResult = () => status.filter({hasText: /storage could not be verified|delivery could not be verified|delivery is unavailable/}).waitFor();
  const fill = async () => {
    await form.getByLabel('Contact name', {exact: true}).fill('Synthetic Browser Test');
    await form.getByLabel('WhatsApp number', {exact: true}).fill('+18685550100');
    await form.getByRole('combobox', {name: 'Island', exact: true}).selectOption('Tobago');
    await form.getByLabel('Preferred area', {exact: true}).fill('Black Rock');
    await form.getByLabel('Preferred date', {exact: true}).fill('2027-01-05');
    await form.getByLabel('Preferred time', {exact: true}).fill('10:30');
    await form.getByLabel('Number of participants', {exact: true}).fill('2');
    const adults = form.getByRole('group', {name: 'Participant 1', exact: true});
    const child = form.getByRole('group', {name: 'Participant 2', exact: true});
    await adults.getByLabel('Age', {exact: true}).fill('30');
    await adults.getByRole('combobox', {name: 'Experience', exact: true}).selectOption('Beginner');
    await adults.getByRole('combobox', {name: 'Rental skates needed', exact: true}).selectOption('No');
    assert(!await adults.getByLabel('Guardian name', {exact: true}).isVisible(), 'Adult guardian fields hidden');
    assert(!await adults.getByLabel('Skate size', {exact: true}).isVisible(), 'Own-skate size fields hidden');
    await child.getByLabel('Age', {exact: true}).fill('12');
    await child.getByRole('combobox', {name: 'Experience', exact: true}).selectOption('First time');
    await child.getByRole('combobox', {name: 'Rental skates needed', exact: true}).selectOption('Yes');
    await child.getByLabel('Skate size', {exact: true}).fill('5');
    await child.getByRole('combobox', {name: 'Sizing system', exact: true}).selectOption('UK child');
    await child.getByLabel('Guardian name', {exact: true}).fill('Synthetic Guardian');
    await child.getByLabel('Guardian WhatsApp', {exact: true}).fill('+18685550100');
  };
  await submit.click();
  assert(payloads.length === 0, 'Empty form must not submit');
  await fill();
  const child = form.getByRole('group', {name: 'Participant 2', exact: true});
  await child.getByLabel('Skate size', {exact: true}).fill('');
  await submit.click();
  assert(payloads.length === 0, 'Rental size required');
  await child.getByLabel('Skate size', {exact: true}).fill('5');
  await child.getByRole('combobox', {name: 'Sizing system', exact: true}).selectOption('');
  await submit.click();
  assert(payloads.length === 0, 'Sizing system required');
  for (const system of ['EU','UK adult','UK child','US men','US women','US youth','US toddler']) {
    await child.getByRole('combobox', {name: 'Sizing system', exact: true}).selectOption(system);
    assert(await child.getByRole('combobox', {name: 'Sizing system', exact: true}).inputValue() === system, `Select ${system}`);
  }
  await child.getByRole('combobox', {name: 'Sizing system', exact: true}).selectOption('UK child');
  await child.getByLabel('Guardian WhatsApp', {exact: true}).fill('');
  await submit.click();
  assert(payloads.length === 0, 'Guardian required');
  await child.getByLabel('Guardian WhatsApp', {exact: true}).fill('+18685550100');
  await form.getByLabel('WhatsApp number', {exact: true}).fill('abc');
  await submit.click();
  assert(payloads.length === 0, 'Invalid WhatsApp blocked');
  await form.getByLabel('WhatsApp number', {exact: true}).fill('+18685550100');
  const consent = form.locator('[name=marketingConsent]');
  await consent.check();
  await submit.click();
  assert(payloads.length === 0, 'Marketing requires email');
  await consent.uncheck();
  await submit.click();
  await waitForResult();
  assert(await status.textContent().then(text => !/saved|received|captured/i.test(text)), 'Opaque delivery never presented as saved');
  const original = payloads[0];
  assert(original.email === '' && original.marketingConsent === 'No', 'Booking works without email or marketing');
  assert(original.participants.length === 2 && original.participants[1].guardianName === 'Synthetic Guardian', 'Participant details carried');
  assert(original.utmSource === 'browser_mock' && original.utmCampaign === 'single_session', 'Attribution carried');
  const link = form.locator('[data-whatsapp-link]');
  const url = await link.evaluate(el => ({pathname: new URL(el.href).pathname, message: new URL(el.href).searchParams.get('text')}));
  assert(url.pathname === '/18682766878', 'Correct WhatsApp number');
  const message = url.message;
  for (const text of ['TT$80', '75 minutes', 'Black Rock', 'UK child', 'Synthetic Guardian', '2027-01-05', 'browser_mock', 'one calendar month', '24 hours', 'no automatic credit', 'genuine emergencies', 'without penalty', 'last day of that month', 'agreed new expiry', 'participant suitability', 'Credit rather than refunds']) assert(message.includes(text), `WhatsApp includes ${text}`);
  assert(await link.isVisible(), 'WhatsApp fallback visible');

  await submit.click();
  await waitForResult();
  assert(payloads[1].leadId === original.leadId, 'Unchanged opaque retry keeps ID');
  mode = 'failed';
  await submit.click();
  await waitForResult();
  assert((await status.textContent()).includes('delivery could not be verified'), 'Network failure does not claim that storage failed');
  assert(await form.getByLabel('Contact name', {exact: true}).inputValue() === 'Synthetic Browser Test', 'Failure retains details');
  assert(await submit.isEnabled() && await link.isVisible(), 'Failure keeps retry and handoff available');
  assert(payloads[2].leadId === original.leadId, 'Failed retry keeps ID');
  mode = 'timeout';
  await submit.click();
  await waitForResult();
  assert((await status.textContent()).includes('timed out'), 'Timeout recovery');
  mode = 'opaque';

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.evaluate(() => window.scrollTo(0, 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}`);
    await page.screenshot({path: `output/playwright/booking-${width}.png`, fullPage: true});
  }
  await form.getByLabel('Number of participants', {exact: true}).fill('1');
  await form.getByLabel('Number of participants', {exact: true}).fill('2');
  assert(await child.getByLabel('Skate size', {exact: true}).inputValue() === '5', 'Count change preserves removed participant details');

  await page.reload();
  await fill();
  await submit.click();
  await waitForResult();
  assert(payloads.filter(p => p.action === 'lead_submit').at(-1).leadId === original.leadId, 'Refresh retry keeps ID');
  assert(!await page.evaluate(() => JSON.stringify(sessionStorage)).then(text => /Synthetic|5550100|Black Rock/.test(text)), 'Receipt storage contains no entered personal details');
  await form.getByLabel('Preferred area', {exact: true}).fill('Another area');
  assert(!await link.isVisible(), 'Editing hides stale prepared message');
  await submit.click();
  await waitForResult();
  assert(payloads.at(-1).leadId !== original.leadId, 'Changed submission gets a new ID');
  const popupPromise = page.waitForEvent('popup');
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  assert(popup.url().startsWith('https://wa.me/18682766878'), 'Mocked WhatsApp handoff opens');
  await popup.close();
  await form.getByLabel('Number of participants', {exact: true}).fill('1');
  await submit.click();
  await waitForResult();
  assert(payloads.at(-1).participantCount === 1 && payloads.at(-1).participants.length === 1, 'One-person booking works');

  const newsletter = page.locator('[data-lead-type=email]');
  await newsletter.getByLabel('Email address', {exact: true}).fill('synthetic@example.test');
  await newsletter.getByRole('combobox', {name: 'Location', exact: true}).selectOption('Trinidad');
  await newsletter.locator('[name=marketingConsent]').check();
  await newsletter.getByRole('button', {name: 'Join Updates', exact: true}).click();
  await newsletter.locator('[data-form-status]').filter({hasText: 'storage could not be verified'}).waitFor();
  assert(await newsletter.getByRole('button').isEnabled(), 'Email form retry remains available');
  assert(payloads.at(-1).leadType === 'email' && payloads.at(-1).marketingConsent === 'Yes', 'Email opt-in payload preserved');

  await page.goto(`${base}/index.html`);
  await page.getByRole('button', {name: 'Skip intro', exact: true}).click().catch(() => {});
  await page.waitForFunction(() => document.querySelector('#latestUpdate').textContent.includes('TT$80'));
  assert(!await page.locator('body').innerText().then(text => /Starter Pass|Beginner Bootcamp|Academy Monthly|\$140/.test(text)), 'Homepage dynamic copy has no old packages');
  await page.setViewportSize({width: 390, height: 844});
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Homepage mobile has no overflow');
  assert(errors.length === 0, `No page errors: ${errors.join(', ')}`);
  return 'PASS: browser mobile/tablet/desktop layout, validation, rental/guardian conditions, mocked opaque/failure/timeout delivery, retries including refresh, message contents, mocked WhatsApp handoff, newsletter and homepage. No live Google Sheets save.';
}
