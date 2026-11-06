async page => {
  const base = 'http://127.0.0.1:4202';
  const fixture = await (await page.request.get(`${base}/acceptance-fixture.json`)).json();
  if (fixture.scope !== 'SYNTHETIC ONLY' || !fixture.automaticRemindersDisabled || fixture.approvedOneEmailTo !== 'redacted-contact@example.test') throw new Error('Missing approval guard');
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(fixture => {
    window.__nativeEvidence = {requests:[],reads:[],saved:[],whatsapp:[],violations:[]};
    const evidence = window.__nativeEvidence;
    const originalFetch = window.fetch;
    window.fetch = function(url,options) {
      if (String(url) !== fixture.endpoint || options?.method !== 'POST') throw new Error('Unapproved request');
      const payload = JSON.parse(options.body);
      if (payload.action !== 'lead_submit' || payload.leadType !== 'booking' || payload.name !== fixture.label || payload.email !== fixture.approvedOneEmailTo || payload.marketingConsent !== 'No') throw new Error('Unapproved payload');
      if (evidence.requests.length >= 2) throw new Error('Only a fresh request and one retry are authorized');
      if (evidence.requests.length && JSON.stringify(payload) !== JSON.stringify(evidence.requests[0].payload)) throw new Error('Retry must be unchanged');
      evidence.requests.push({at:performance.now(),payload,mode:options.mode});
      return originalFetch.call(this,url,options);
    };
    const originalJson = Response.prototype.json;
    Response.prototype.json = async function() {
      const body = await originalJson.call(this);
      evidence.reads.push({at:performance.now(),body,type:this.type,status:this.status,host:new URL(this.url).hostname,savedAlreadyVisible:document.querySelector('#bookingForm [data-form-status]')?.textContent.startsWith('Your details were saved')});
      return body;
    };
    document.addEventListener('DOMContentLoaded',()=>{
      const form = document.querySelector('#bookingForm');
      new MutationObserver(()=>{
        const status = form.querySelector('[data-form-status]').textContent;
        if (status.startsWith('Your details were saved')) evidence.saved.push({at:performance.now(),readsSeen:evidence.reads.length});
        const link = form.querySelector('[data-whatsapp-link]');
        if (link.getClientRects().length && evidence.whatsapp.length < evidence.requests.length) evidence.whatsapp.push({at:performance.now(),readsSeen:evidence.reads.length,href:link.href});
      }).observe(form,{attributes:true,childList:true,subtree:true,characterData:true});
      document.addEventListener('click',event=>{if(event.target.closest('a')){event.preventDefault();event.stopImmediatePropagation();}},true);
    });
    window.open = () => {throw new Error('WhatsApp must not be opened by acceptance test');};
    navigator.sendBeacon = () => {throw new Error('Beacon forbidden');};
    XMLHttpRequest.prototype.send = () => {throw new Error('XHR forbidden');};
  },fixture);
  await page.goto(`${base}/book.html?utm_source=isolated_acceptance&utm_campaign=clean_intake_v1`);
  if (await page.evaluate(()=>window.TSG_LEAD_CONFIG.requestTimeoutMs)!==25000) throw new Error('Timeout changed');
  const form = page.locator('#bookingForm');
  await form.getByLabel('Contact name',{exact:true}).fill(fixture.label);
  await form.getByLabel('WhatsApp number',{exact:true}).fill('18685550100');
  await form.getByLabel('Email (optional)',{exact:true}).fill(fixture.approvedOneEmailTo);
  await form.locator('[name="location"]').selectOption('Tobago');
  await form.getByLabel('Preferred area',{exact:true}).fill('Black Rock - requested, not confirmed');
  await form.getByLabel('Preferred date',{exact:true}).fill('2027-01-05');
  await form.getByLabel('Preferred time',{exact:true}).fill('16:30');
  await form.getByLabel('Number of participants',{exact:true}).fill('2');
  for (const [index,age,rentals] of [[1,'30','No'],[2,'12','Yes']]) {
    const participant = form.getByRole('group',{name:`Participant ${index}`,exact:true});
    await participant.getByLabel('Age',{exact:true}).fill(age);
    await participant.locator('[data-field="experience"]').selectOption(index===1?'Beginner':'First time');
    await participant.locator('[data-field="rentals"]').selectOption(rentals);
    if(rentals==='Yes'){
      await participant.getByLabel('Skate size',{exact:true}).fill('38');
      await participant.locator('[data-field="sizeSystem"]').selectOption('EU');
      await participant.getByLabel('Guardian name',{exact:true}).fill('TEST ONLY - Sample Guardian');
      await participant.getByLabel('Guardian WhatsApp',{exact:true}).fill('18685550101');
    }
  }
  await form.locator('[name="marketingConsent"]').uncheck();
  const status = form.locator('[data-form-status]');
  await form.locator('[type="submit"]').click();
  await form.locator('[data-whatsapp-link]').waitFor({state:'visible',timeout:2000});
  await form.locator('[type="submit"]').waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.querySelector('#bookingForm [type="submit"]').disabled,{timeout:30000});
  const evidence = await page.evaluate(()=>window.__nativeEvidence);
  const response = evidence.reads[0];
  const request = evidence.requests[0];
  const passed = evidence.requests.length===1 && response?.body.ok===true && response.body.leadId===request.payload.leadId && response.body.status==='New Lead' && response.type==='cors' && response.status===200 && !response.savedAlreadyVisible && evidence.saved.length>0 && evidence.saved.every(item=>item.at>=response.at) && evidence.whatsapp[0]?.at<response.at && evidence.whatsapp[0]?.readsSeen===0;
  await status.screenshot({path:'output/new-intake-acceptance/fresh-status.png'});
  return {scope:'ACTUAL CHROMIUM CORS RESPONSE, NO RESPONSE MOCK',passed,statusText:await status.innerText(),responseTimeMs:response?response.at-request.at:null,whatsappReadyMs:evidence.whatsapp[0]?evidence.whatsapp[0].at-request.at:null,timeoutMs:25000,evidence,errors,next:'Read Sheet rows and inbox before unchanged retry. No retry sent by this runner.'};
}
