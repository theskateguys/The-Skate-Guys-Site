// Playwright CLI fixture. Local generated email only; no delivery or outbound navigation.
async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const base = page.url().slice(0, page.url().lastIndexOf('/') + 1);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.context().route('https://**/*', route => route.abort());
  const contrast = await page.evaluate(() => {
    const luminance = hex => {
      const c = hex.match(/[a-f0-9]{2}/gi).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      return .2126*c[0]+.7152*c[1]+.0722*c[2];
    };
    return [['1d3035','ffffff'],['4a6265','ffffff'],['14545b','e8f8f7'],['102b30','00f5ff']].map(([a,b]) => {
      const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
    });
  });
  assert(contrast.every(ratio => ratio >= 4.5), 'Normal-text colour pairs meet WCAG AA contrast');
  for (const file of ['booking-request', 'stress-test', 'blocked-images']) {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({width, height: 960});
      await page.goto(`${base}${file}.html`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file}: no overflow at ${width}`);
      const body = await page.locator('body').innerText();
      for (const text of ['SAMPLE DATA', 'Booking Request Received', 'Awaiting availability confirmation', 'This is not a confirmed class', 'No payment has been taken', 'Credit rather than refunds', 'Requested date', 'Requested time', 'Requested island', 'Requested area', 'Participant 2 guardian']) assert(body.includes(text), `${file}: readable ${text}`);
      const image = await page.locator('img').evaluate(img => ({loaded:img.complete&&img.naturalWidth>0,alt:img.alt}));
      assert(image.alt === 'The Skate Guys company logo', 'Company logo alt text');
      assert(body.includes('5 January 2027') && body.includes('Requested time (T&T local time)'), 'Readable date and local-time label');
      assert(!body.includes('Record the agreed new expiry.'), 'No internal expiry instruction');
      assert(image.loaded === (file !== 'blocked-images'), 'Logo loads or is intentionally blocked');
      const cta = page.getByRole('link', {name: 'Continue on WhatsApp', exact: true});
      const placement = await page.evaluate(() => {
        const button = [...document.querySelectorAll('a')].find(a => a.textContent === 'Continue on WhatsApp');
        const reference = [...document.querySelectorAll('span')].find(s => s.textContent === 'Customer reference');
        const logo = document.querySelector('img');
        return {above: button.getBoundingClientRect().bottom < reference.getBoundingClientRect().top,
          width: logo.width, height: logo.height, bodySize: getComputedStyle(document.querySelector('h1').parentElement).fontSize};
      });
      assert(placement.above && placement.width === placement.height, 'CTA above fields and logo proportions preserved');
      assert(placement.bodySize === '15px', 'Body text size retained');
      const destination = await cta.evaluate(a => ({phone:new URL(a.href).pathname, message:new URL(a.href).searchParams.get('text')}));
      assert(destination.phone === '/18682766878' && destination.message.includes('TSG-PREVIEW-'), 'Business number and sample reference');
      assert(await page.locator('table').evaluateAll(tables => tables.every(t => t.getAttribute('role') === 'presentation')), 'Layout tables are presentational');
      if (width !== 320) await page.screenshot({path:`output/playwright/email-${file}-${width}.png`,fullPage:true});
    }
  }
  await page.goto(`${base}index.html`);
  for (const width of [1440, 390]) {
    await page.setViewportSize({width,height:960});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Review page responsive');
  }
  assert(errors.length === 0, `No script errors: ${errors.join(',')}`);
  return `PASS: local browser email previews at 1440/390/320px, long name/reference, three participants, blocked image, selectable policy and booking text, original logo, correct WhatsApp reference and contrast (minimum ${Math.min(...contrast).toFixed(2)}:1). No emails sent; not an email-client test.`;
}
