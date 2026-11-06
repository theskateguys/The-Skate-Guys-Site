async page => {
  const origin = await page.evaluate(() => location.origin);
  const results = [];
  const errors = [];
  const googleRequests = [];
  const mutations = [];
  const check = (condition, message) => { if (!condition) throw new Error(message); results.push(message); };
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/script\.google\.com|googleusercontent\.com/.test(request.url())) googleRequests.push(request.url());
    if (['POST','PUT','PATCH','DELETE'].includes(request.method()) && !request.url().startsWith('https://plausible.io/')) mutations.push({method:request.method(),url:request.url()});
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const width of [390,768,1440]) {
    await page.setViewportSize({width,height:900});
    for (const file of ['index.html','book.html','merch.html','elite.html']) {
      const response = await page.goto(`${origin}/${file}`);
      check(response.status() === 200, `${width} ${file} loads`);
      await page.locator('body').click({position:{x:2,y:2}});
      for (let y = 0, height = await page.locator('body').evaluate(body => body.scrollHeight); y < height; y += 700) {
        await page.evaluate(y => window.scrollTo(0,y), y);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      }
      await page.waitForFunction(() => [...document.images].every(image => image.complete), {timeout:30000});
      await page.evaluate(() => window.scrollTo(0,0));
      const layout = await page.evaluate(() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,broken:[...document.images].filter(image => !image.naturalWidth).map(image => image.src)}));
      check(layout.scroll <= layout.width, `${width} ${file} no horizontal overflow`);
      check(!layout.broken.length, `${width} ${file} loaded images render`);
      if (width === 390) {
        if (file === 'index.html') { await page.getByRole('button',{name:'Open menu',exact:true}).click(); check(await page.locator('#mobileMenu').getByRole('link',{name:'Book a Class',exact:true}).isVisible(), 'Homepage mobile Book a Class visible'); }
        if (file === 'merch.html') { await page.locator('#hamburger').click(); check(await page.locator('#mobileNav').getByRole('link',{name:/Book/}).count() > 0, 'Merch mobile booking navigation present'); }
        if (file === 'elite.html') { await page.getByRole('button',{name:'Open menu',exact:true}).click(); check(await page.getByRole('navigation').getByRole('link',{name:'Book a Class',exact:true}).isVisible(), 'Community mobile booking navigation visible'); }
        if (file === 'book.html') check(await page.getByRole('navigation').getByRole('link',{name:'Merch',exact:true}).isVisible(), 'Booking mobile navigation visible');
      }
      await page.screenshot({path:`output/playwright/${file.replace('.html','')}-${width}.png`,fullPage:true});
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${origin}/book.html`);
  await page.getByRole('button',{name:'Prepare WhatsApp Request',exact:true}).click();
  check(!await page.locator('[data-booking-success]').isVisible(), 'Empty submission cannot prepare a message');
  await page.getByLabel('Contact name',{exact:true}).fill('PREVIEW ONLY - Sample Skater');
  await page.getByLabel('WhatsApp number',{exact:true}).fill('18685550100');
  await page.locator('[name="location"]').selectOption('Tobago');
  await page.getByLabel('Preferred area',{exact:true}).fill('Black Rock - to agree with TSG');
  await page.getByLabel('Preferred date',{exact:true}).fill('2027-01-05');
  await page.getByLabel('Preferred time',{exact:true}).fill('16:30');
  await page.getByLabel('Number of participants',{exact:true}).fill('2');
  const first = page.getByRole('group',{name:'Participant 1',exact:true});
  const second = page.getByRole('group',{name:'Participant 2',exact:true});
  await first.getByLabel('Age',{exact:true}).fill('32');
  await first.locator('[data-field="experience"]').selectOption('Beginner');
  await first.locator('[data-field="rentals"]').selectOption('No');
  check(!await first.locator('[data-rental-size]').isVisible(), 'No rental hides optional size fields');
  await second.getByLabel('Age',{exact:true}).fill('12');
  await second.locator('[data-field="experience"]').selectOption('First time');
  await second.locator('[data-field="rentals"]').selectOption('Yes');
  check(await second.locator('[data-rental-size]').isVisible(), 'Rental enables size and sizing system');
  check(await second.locator('[data-guardian]').isVisible(), 'Child enables guardian contact');
  await page.getByRole('button',{name:'Prepare WhatsApp Request',exact:true}).click();
  check(!await page.locator('[data-booking-success]').isVisible(), 'Missing rental/guardian details block message');
  await second.getByLabel('Skate size',{exact:true}).fill('38');
  await second.locator('[data-field="sizeSystem"]').selectOption('EU');
  await second.getByLabel('Guardian name',{exact:true}).fill('PREVIEW ONLY - Sample Guardian');
  await second.getByLabel('Guardian WhatsApp',{exact:true}).fill('18685550101');
  const start = Date.now();
  await page.getByRole('button',{name:'Prepare WhatsApp Request',exact:true}).click();
  const elapsed = Date.now()-start;
  check(await page.locator('[data-booking-success]').isVisible(), 'Valid message prepared immediately');
  const url = await page.locator('[data-whatsapp-link]').evaluate(link => {const url = new URL(link.href); return {origin:url.origin,pathname:url.pathname,message:url.searchParams.get('text')};});
  const message = url.message;
  check(url.origin === 'https://wa.me' && url.pathname === '/18682766878', 'Prepared WhatsApp destination correct');
  for (const detail of ['PREVIEW ONLY - Sample Skater','18685550100','Tobago','Black Rock','2027-01-05','16:30','Participants: 2','TT$80 per person','75 minutes','rental included','TT$160','Age: 12','38 (EU)','Sample Guardian','18685550101','not a confirmed booking']) check(message.includes(detail), `Message includes ${detail}`);
  check((await page.locator('[data-form-status]').innerText()).includes('Nothing has been sent'), 'Prepared wording does not claim delivery');
  await page.screenshot({path:'output/playwright/booking-prepared-390.png',fullPage:true});
  await page.getByLabel('Preferred area',{exact:true}).fill('Different area to agree');
  check(!await page.locator('[data-booking-success]').isVisible() && !await page.locator('[data-whatsapp-link]').getAttribute('href'), 'Editing invalidates stale WhatsApp message');
  check(await page.getByLabel('Contact name',{exact:true}).inputValue() === 'PREVIEW ONLY - Sample Skater', 'Edits retain other details');
  await page.getByRole('button',{name:'Prepare WhatsApp Request',exact:true}).click();
  check((await page.locator('[data-whatsapp-link]').evaluate(link => new URL(link.href).searchParams.get('text'))).includes('Different area'), 'Re-prepare uses latest details');
  await page.getByLabel('Number of participants',{exact:true}).fill('1');
  await page.getByLabel('Number of participants',{exact:true}).fill('2');
  check(await second.getByLabel('Skate size',{exact:true}).inputValue() === '38', 'Participant count edits retain detached participant details');
  const noJs = await page.context().browser().newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const staticPage = await noJs.newPage();
  await staticPage.goto(`${origin}/book.html`);
  check(await staticPage.getByRole('link',{name:'Open a booking message in WhatsApp'}).isVisible(), 'JavaScript-disabled prepared WhatsApp fallback visible');
  check(!await staticPage.locator('#bookingForm').isVisible(), 'JavaScript-disabled form cannot submit');
  await noJs.close();
  check(googleRequests.length === 0, 'Zero Google Apps Script requests in actual browser');
  check(mutations.length === 0, 'Zero booking or signup network submissions in actual browser');
  check(errors.length === 0, 'Zero page JavaScript errors');
  return {environment:origin,passed:results.length,results,prepareMilliseconds:elapsed,googleRequests,mutations,errors,whatsappMessage:message};
}
