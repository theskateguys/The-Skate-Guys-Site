import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyArtifact} from '../new-intake-web/lib.mjs';

// Offline evidence consistency/integrity only; never submit or send email.
const evidence = JSON.parse(await fs.readFile('automation/NEW_INTAKE_ACCEPTANCE.json','utf8'));
const previewFiles = JSON.parse(await fs.readFile('automation/new-intake-acceptance/preview-file-hashes.json','utf8'));
const artifact = 'output/new-intake-web/isolated-stage-v1';
const {manifest} = await verifyArtifact(artifact);
const expectedFields = ['Lead ID','Name','WhatsApp','Email','Location','Adult/Child','Package','Rentals Needed','Preferred Time','Source Page','Marketing Consent','WhatsApp Opened','Status','Tags','Preferred Area','Preferred Date','Participant Count'];
const fieldKeys = [...['Leads','Bookings'].flatMap(tab => [...expectedFields,'Participants JSON'].map(field => tab + ':' + field)),
  'Leads:UTM Source','Leads:UTM Campaign',
  ...['Lead ID','Email','Name','WhatsApp','Lead Type','Status','Weekly Update Eligible'].map(field => 'Follow Up Status:' + field)].sort();
assert.equal(fieldKeys.length,45);
const expectedCounts = {Leads:1,Bookings:1,'Email Subscribers':0,'Follow Up Status':1};
function validateRecordedScope(record) {
  for (const field of ['projectId','spreadsheetId','deploymentId','version','endpoint']) assert.equal(record.isolated[field],manifest.binding[field],field);
  assert.equal(record.browser.timeoutMs,manifest.requestTimeoutMs);
  assert.equal(record.production.commit,manifest.whatsappProductionFallback.sourceSHA);
  assert.equal(record.production.deploymentId,manifest.whatsappProductionFallback.deploymentId);
  assert.equal(record.future.spreadsheetId,manifest.pendingIsolatedIdentity.reservedFutureSheetAuthorized ? '' : '1oOvHxL2P4rM3-a5rxd4zTvmLE4iIM4RBEj5uWJ1NslI');
  assert.equal(record.browser.freshResponse.leadId,record.browser.leadId);
  assert.equal(record.browser.retryResponse.leadId,record.browser.leadId);
  assert.equal(record.browser.freshResponse.ok,true);
  assert.equal(record.browser.retryResponse.ok,true);
  assert.equal(record.browser.freshResponse.status,'New Lead');
  assert.equal(record.browser.retryResponse.status,'duplicate_ignored');
  assert.deepEqual(record.sheet.fieldComparisons.map(check => check.tab + ':' + check.field).sort(),fieldKeys);
  assert.ok(record.sheet.fieldComparisons.every(check => check.pass === true));
  assert.deepEqual(record.sheet.countsBefore,{Leads:0,Bookings:0,'Email Subscribers':0,'Follow Up Status':0});
  assert.deepEqual(record.sheet.countsAfterFresh,expectedCounts);
  assert.deepEqual(record.sheet.countsAfterRetry,expectedCounts);
  assert.deepEqual(record.sheet.readback.map(tab => tab.sheet).sort(),Object.keys(expectedCounts).sort());
  for (const tab of record.sheet.readback) {
    assert.equal(tab.data.values.length-1,expectedCounts[tab.sheet]);
    const headers = tab.data.values[0];
    assert.equal(new Set(headers).size,headers.length);
    if (!expectedCounts[tab.sheet]) continue;
    const row = tab.data.values[1];
    assert.equal(row[headers.indexOf('Lead ID')],record.browser.leadId);
    assert.equal(row[headers.indexOf('Status')],'New Lead');
  }
}
validateRecordedScope(evidence);
let rejectedMutations = 0;
for (const mutate of [
  record => record.isolated.spreadsheetId = record.future.spreadsheetId,
  record => record.isolated.endpoint = 'https://example.invalid/exec',
  record => record.browser.retryResponse.leadId = 'wrong-id',
  record => record.sheet.fieldComparisons = [],
  record => record.sheet.fieldComparisons[1] = record.sheet.fieldComparisons[0],
  record => record.sheet.countsAfterFresh = record.sheet.countsAfterRetry = {Leads:9,Bookings:9,'Email Subscribers':0,'Follow Up Status':9},
  record => record.sheet.readback[0].data.values.pop()
]) {
  const changed = structuredClone(evidence);
  mutate(changed);
  assert.throws(() => validateRecordedScope(changed));
  rejectedMutations++;
}
for (const [key, files] of Object.entries(previewFiles)) {
  const site = key === 'compliantFallback' ? 'compliant-fallback' : key;
  assert.equal(files.length,42);
  assert.equal(new Set(files.map(file => file.file)).size,42);
  assert.deepEqual(files.map(file => file.file).sort(),manifest.files.filter(file => file.path.startsWith(site + '/')).map(file => file.path.slice(site.length+1)).sort());
  for (const entry of files) {
    const bytes = await fs.readFile(path.join(artifact,site,entry.file));
    assert.equal(createHash('sha1').update(bytes).digest('hex'),entry.sha1,site + '/' + entry.file);
  }
}
assert.deepEqual(previewFiles.release,previewFiles.compliantFallback);
assert.equal(evidence.browser.responseMocked,false);
assert.equal(evidence.browser.timeoutMs,25000);
assert.equal(evidence.browser.matchingIdReadBeforeSaved,true);
assert.equal(evidence.browser.savedVisibleBeforeRead,false);
assert.equal(evidence.browser.freshResponse.leadId,evidence.browser.retryResponse.leadId);
assert.equal(evidence.browser.retryResponse.status,'duplicate_ignored');
assert.ok(evidence.browser.whatsappReadyMs < evidence.browser.freshResponseMs);
assert.ok(evidence.browser.freshResponseMs < 25000 && evidence.browser.retryResponseMs < 25000);
assert.ok(evidence.sheet.fieldComparisons.every(check => check.pass));
assert.deepEqual(evidence.sheet.countsAfterFresh,evidence.sheet.countsAfterRetry);
assert.equal(evidence.sheet.allReadbackCellsUnchangedAfterRetry,true);
assert.equal(evidence.isolated.reminders,false);
assert.equal(evidence.isolated.installableTriggers,0);
assert.equal(evidence.email.senderSentMatchesAfterRetry,1);
assert.equal(evidence.email.senderSentMatchesAfterFresh,1);
assert.equal(evidence.email.recipientConfirmedExactlyOne,true);
assert.ok(Object.entries(evidence.email.contentChecks).filter(([name]) => !name.endsWith('Bytes')).every(([,value]) => value === true));
for (const [key,file] of [['Code','Code.gs'],['EmailLogo','EmailLogo.gs']]) {
  const bytes = (await fs.readFile(path.join('automation/google-apps-script',file),'utf8')).replace(/\r\n/g,'\n');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),evidence.isolated.sourceSha256LF[key]);
}
console.log(JSON.stringify({scope:'OFFLINE evidence consistency and native Vercel file-hash comparison; no external calls',passed:true,previewFilesCompared:84,fieldComparisons:evidence.sheet.fieldComparisons.length,rejectedMutations}));
