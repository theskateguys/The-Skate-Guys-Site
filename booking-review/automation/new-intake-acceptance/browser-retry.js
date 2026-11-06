async page => {
  const before = await page.evaluate(()=>window.__nativeEvidence);
  if (before.requests.length!==1 || before.reads[0]?.body.status!=='New Lead') throw new Error('Fresh matching acknowledgement required before retry');
  const form = page.locator('#bookingForm');
  await form.locator('[type="submit"]').click();
  await page.waitForFunction(()=>!document.querySelector('#bookingForm [type="submit"]').disabled,{timeout:30000});
  const evidence = await page.evaluate(()=>window.__nativeEvidence);
  const request = evidence.requests[1];
  const response = evidence.reads[1];
  const samePayload = JSON.stringify(evidence.requests[0].payload)===JSON.stringify(request?.payload);
  const passed = evidence.requests.length===2 && samePayload && response?.body.ok===true && response.body.status==='duplicate_ignored' && response.body.leadId===request.payload.leadId && response.type==='cors' && response.status===200 && !response.savedAlreadyVisible && evidence.saved.every(item=>item.readsSeen>0 && item.at>=evidence.reads[item.readsSeen-1].at);
  await form.locator('[data-form-status]').screenshot({path:'output/new-intake-acceptance/retry-status.png'});
  return {scope:'ACTUAL UNCHANGED NATIVE RETRY, NO RESPONSE MOCK',passed,samePayload,leadId:request?.payload.leadId,responseTimeMs:response?response.at-request.at:null,timeoutMs:25000,response,evidence,next:'Compare all Sheet rows and recipient email count. No further submission authorized.'};
}
