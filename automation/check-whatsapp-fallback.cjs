async page => {
  const origin = await page.evaluate(() => location.origin);
  const results = [];
  for (const width of [390,1440]) {
    await page.setViewportSize({width,height:900});
    const response = await page.goto(`${origin}/fallback/book.html`);
    if (response.status() !== 200) throw new Error('Fallback failed to load');
    const summary = await page.evaluate(() => ({text:document.body.innerText,forms:document.forms.length,scripts:document.scripts.length,overflow:document.documentElement.scrollWidth > innerWidth,link:document.querySelector('.button').href}));
    if (summary.forms || summary.scripts || summary.overflow) throw new Error('Fallback contains a form, script or overflow');
    for (const text of ['TT$80 per person','75 minutes','skate rental included','24 hours','one calendar month','Credit rather than refunds','not a confirmed class']) if (!summary.text.toLowerCase().includes(text.toLowerCase())) throw new Error(`Missing fallback copy: ${text}`);
    if (!summary.link.startsWith('https://wa.me/18682766878?text=')) throw new Error('Wrong fallback destination');
    await page.screenshot({path:`output/playwright/fallback-${width}.png`,fullPage:true});
    results.push(`${width}: fallback loads, correct offer/policy/WhatsApp, no forms/scripts/overflow`);
  }
  await page.goto(`${origin}/book.html`);
  await page.getByLabel('Contact name',{exact:true}).fill('PREVIEW ONLY - Large Group');
  await page.getByLabel('WhatsApp number',{exact:true}).fill('18685550100');
  await page.locator('[name="location"]').selectOption('Trinidad');
  await page.getByLabel('Preferred area',{exact:true}).fill('Location to agree');
  await page.getByLabel('Preferred date',{exact:true}).fill('2027-01-05');
  await page.getByLabel('Preferred time',{exact:true}).fill('16:30');
  await page.getByLabel('Number of participants',{exact:true}).fill('20');
  for (let number = 1; number <= 20; number++) {
    const group = page.getByRole('group',{name:`Participant ${number}`,exact:true});
    await group.getByLabel('Age',{exact:true}).fill('30');
    await group.locator('[data-field="experience"]').selectOption('Beginner');
    await group.locator('[data-field="rentals"]').selectOption('Yes');
    await group.getByLabel('Skate size',{exact:true}).fill('38');
    await group.locator('[data-field="sizeSystem"]').selectOption('EU');
  }
  await page.getByRole('button',{name:'Prepare WhatsApp Request',exact:true}).click();
  const handoff = await page.locator('[data-whatsapp-link]').evaluate(link => ({url:link.href,message:new URL(link.href).searchParams.get('text')}));
  if (!handoff.message.includes('Participant 20') || !handoff.message.includes('TT$1600')) throw new Error('Large group request incomplete');
  results.push('20-participant message preserves all participants and TT$1600 total');
  return {results,encodedUrlLength:handoff.url.length,externalWhatsAppOpened:false,note:'Link construction verified. No WhatsApp message was sent; app/device delivery is not claimed.'};
}
