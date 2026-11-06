// Entirely offline: browser/network objects below are mocks, never Google evidence.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createAcceptanceFixtures, STATUS_TABS} from './acceptance-fixtures.mjs';
import {
  assertApprovedEndpoint, createIsolationAcceptanceFixtures, createManifest, EXCLUDED_ENDPOINT_IDS,
  ORIGIN, SOURCE_SHA256, TIMESTAMP
} from './isolation-acceptance-fixtures.mjs';
import {APPROVED_ENDPOINT, isAllowedLocalRequest, startPortal} from './isolation-acceptance-server.mjs';

const fixtures = createIsolationAcceptanceFixtures();
const base = createAcceptanceFixtures(TIMESTAMP);
for (const key of Object.keys(base)) assert.deepEqual(fixtures[key], base[key], `Base field changed: ${key}`);
assert.equal(fixtures.unique.leadId, `${base.runPrefix}-UNIQUE-WITH-DUPLICATES`);
assert.equal(fixtures.ambiguityCases.length, 4);
const allTabs = [...STATUS_TABS, 'Email Subscribers'];
for (const [index, fixture] of fixtures.ambiguityCases.entries()) {
  const tab = allTabs[index];
  assert.equal(fixture.ambiguousTab, tab);
  assert.equal(fixture.leadId, `${base.runPrefix}-AMBIGUOUS-${tab.toUpperCase().replace(/ /g, '-')}`);
  assert.equal(fixture.payload.email, '');
  assert.equal(fixture.payload.marketingConsent, 'No');
  for (const name of allTabs) {
    const rows = fixture.seedRows[name];
    assert.equal(rows.length, name === tab ? 2 : tab === 'Email Subscribers' || name === 'Email Subscribers' ? 0 : 1);
    rows.forEach(row => {
      assert.equal(row['Lead ID'], fixture.leadId);
      assert.equal(row.Email, '');
      if ('Marketing Consent' in row) assert.equal(row['Marketing Consent'], 'No');
    });
    if (rows.length && name !== 'Email Subscribers') {
      assert.deepEqual(rows.map(row => row.Status), name === tab ? ['Confirmed', 'Paid'] : ['Replied']);
      assert.equal(new Set(rows.map(row => row.Notes)).size, rows.length);
    }
  }
  if (tab === 'Email Subscribers') assert.deepEqual(fixture.seedRows[tab].map(row => row.Status), ['Inactive', 'Active']);
}
assert.equal(APPROVED_ENDPOINT, 'https://script.google.com/macros/s/AKfycbw7On5pvG1ohVzbESEu_JkOyhGt1EIHyWaYJt_moU16A6VEq7NM6QI4pq8idYfF1NCW7g/exec');
assert.throws(() => assertApprovedEndpoint(APPROVED_ENDPOINT, ''), /empty pin/);
const fakePin = 'https://script.google.com/macros/s/OFFLINE_SYNTHETIC_V2_PIN/exec';
const wrongURLs = [
  '', 'https://script.google.com/macros/s/UNAPPROVED_CANONICAL/exec',
  ...EXCLUDED_ENDPOINT_IDS.map(id => `https://script.google.com/macros/s/${id}/exec`),
  `${fakePin}?x=1`, `${fakePin}/`, fakePin.replace('https:', 'http:'),
  fakePin.replace('script.google.com', 'script.google.com.evil.invalid')
];
for (const endpoint of [...wrongURLs, fakePin]) {
  assert.throws(() => assertApprovedEndpoint(endpoint, APPROVED_ENDPOINT), /exact pinned/);
  await assert.rejects(startPortal(['--endpoint', endpoint]), /exact pinned/);
}
for (const endpoint of wrongURLs) assert.throws(() => assertApprovedEndpoint(endpoint, fakePin), /exact pinned/);
for (const id of EXCLUDED_ENDPOINT_IDS) {
  const endpoint = `https://script.google.com/macros/s/${id}/exec`;
  assert.throws(() => assertApprovedEndpoint(endpoint, endpoint), /exact pinned/);
}
assertApprovedEndpoint(fakePin, fakePin);

const routes = new Map([['/', ['text/html', 'TEST ONLY']]]);
const request = {method: 'GET', url: '/', headers: {host: '127.0.0.1:4198'}};
assert.equal(isAllowedLocalRequest(request, routes), true);
assert.equal(isAllowedLocalRequest({...request, headers: {...request.headers, origin: ORIGIN}}, routes), true);
for (const bad of [
  {...request, method: 'POST'}, {...request, method: 'HEAD'}, {...request, url: '/?x=1'},
  {...request, url: '/candidate.gs/../'}, {...request, headers: {host: 'localhost:4198'}},
  {...request, headers: {...request.headers, origin: 'null'}},
  {...request, headers: {...request.headers, origin: 'https://example.invalid'}},
  {...request, headers: {...request.headers, 'sec-fetch-site': 'cross-site'}}
]) assert.equal(isAllowedLocalRequest(bad, routes), false);

// Exercise the actual response handler with an in-memory test pin, without listening.
const serverSource = await readFile(new URL('isolation-acceptance-server.mjs', import.meta.url), 'utf8');
const simulatedServer = await import(`data:text/javascript;base64,${Buffer.from(serverSource
  .replace(`export const APPROVED_ENDPOINT = '${APPROVED_ENDPOINT}';`, `export const APPROVED_ENDPOINT = '${fakePin}';`)
  .replace("'./isolation-acceptance-fixtures.mjs'", JSON.stringify(new URL('isolation-acceptance-fixtures.mjs', import.meta.url).href)))
  .toString('base64')}`);
const handler = simulatedServer.createRequestHandler(routes, fakePin);
const response = {writeHead(status, headers) { this.status = status; this.headers = headers; return this; }, end(body) { this.body = body; }};
handler(request, response);
assert.equal(response.status, 200);
assert.equal(response.body, 'TEST ONLY');
assert.equal(response.headers['Cache-Control'], 'no-store');
assert.ok(response.headers['Content-Security-Policy'].includes(`connect-src 'self' ${fakePin} https://script.googleusercontent.com/macros/echo;`));
handler({...request, method: 'POST'}, response);
assert.equal(response.status, 403);

const browserSource = await readFile(new URL('isolation-acceptance-browser.js', import.meta.url), 'utf8');
const browserPinDeclaration = `const APPROVED_ENDPOINT = '${APPROVED_ENDPOINT}';`;
assert.equal(browserSource.split(browserPinDeclaration).length - 1, 1);
const compile = source => vm.runInNewContext(`(${source})`, {URL});
const unpinned = compile(browserSource.replace(browserPinDeclaration, "const APPROVED_ENDPOINT = '';"));
let unpinnedReads = 0;
await assert.rejects(unpinned({url: () => `${ORIGIN}/#UNIQUE-fresh`, request: {get() { unpinnedReads++; throw Error('Unexpected read'); }}}), /empty pin/);
assert.equal(unpinnedReads, 0);
// Simulations replace the real isolated pin in memory; no sockets are opened.
const run = compile(browserSource.replace(browserPinDeclaration, `const APPROVED_ENDPOINT = '${fakePin}';`));
const manifest = createManifest(fakePin);
const copy = value => JSON.parse(JSON.stringify(value));

async function simulate(selection, options = {}) {
  const data = copy(fixtures);
  const identity = {...manifest, ...options.manifest};
  options.mutate?.(data);
  const metrics = {reads: [], evaluations: 0, posts: 0, continued: [], aborted: [], timer: null, cleared: 0};
  let guard;
  const makeRequest = (url, method, body, previous = null) => ({
    url: () => url, method: () => method, postData: () => body, redirectedFrom: () => previous
  });
  const routeRequest = async request => {
    await guard({request: () => request,
      continue: async () => { metrics.continued.push(request.url()); },
      abort: async () => { metrics.aborted.push(request.url()); }
    });
  };
  const page = {
    url: () => `${ORIGIN}/#${selection}`,
    request: {get: async (url, config) => {
      assert.equal(config.maxRedirects, 0);
      assert.ok([`${ORIGIN}/manifest.json`, `${ORIGIN}/fixtures.json`].includes(url), 'Read target must be fixed loopback');
      metrics.reads.push(url);
      return {status: () => 200, json: async () => url.endsWith('/manifest.json') ? identity : data};
    }},
    route: async (pattern, handler) => { assert.equal(pattern, '**/*'); guard = handler; },
    unroute: async (pattern, handler) => { assert.equal(handler, guard); guard = null; },
    evaluate: async (fn, args) => {
      metrics.evaluations++;
      const nativeSimulation = vm.runInNewContext(`(${fn.toString()})`, {
        performance: {now: () => 100}, AbortController,
        setTimeout: (callback, ms) => { metrics.timer = ms; return 42; },
        clearTimeout: token => { assert.equal(token, 42); metrics.cleared++; },
        fetch: async (endpoint, config) => {
          assert.equal(endpoint, fakePin);
          assert.equal(config.method, 'POST');
          assert.equal(config.mode, 'cors');
          assert.equal(config.redirect, 'follow');
          assert.equal(config.credentials, 'omit');
          assert.equal(config.headers['Content-Type'], 'text/plain;charset=utf-8');
          metrics.posts++;
          const initial = makeRequest(endpoint, 'POST', config.body);
          await routeRequest(initial);
          const redirectURL = 'https://script.googleusercontent.com/macros/echo?user_content_key=OFFLINE&lib=OFFLINE';
          if (options.probeBeforeRedirect) {
            for (const probe of [
              makeRequest('https://script.googleusercontent.com/evil?user_content_key=x&lib=x', 'GET', null, initial),
              makeRequest('https://script.googleusercontent.com/macros/echo', 'GET', null, initial),
              makeRequest('https://script.googleusercontent.com.evil.invalid/macros/echo?user_content_key=x&lib=x', 'GET', null, initial),
              makeRequest('https://user@script.googleusercontent.com/macros/echo?user_content_key=x&lib=x', 'GET', null, initial),
              makeRequest(`${redirectURL}&other=x`, 'GET', null, initial),
              makeRequest(redirectURL, 'GET', null),
              makeRequest(redirectURL, 'POST', config.body, initial),
              makeRequest(endpoint, 'POST', '{}')
            ]) await routeRequest(probe);
          }
          if (!options.redirectNotIntercepted) await routeRequest(makeRequest(redirectURL, 'GET', null, initial));
          if (options.probe) {
            for (const probe of [
              makeRequest(endpoint, 'POST', config.body),
              makeRequest('https://example.invalid/', 'GET', null),
              makeRequest(redirectURL, 'GET', null),
              makeRequest('https://script.googleusercontent.com/evil', 'GET', null, initial),
              makeRequest('https://script.googleusercontent.com/macros/echo?user_content_key=x&lib=x', 'GET', null, initial)
            ]) await routeRequest(probe);
          }
          if (options.failure) throw new TypeError('Simulated unreadable response');
          const payload = JSON.parse(config.body);
          const [key, action] = selection.split('-');
          const tab = key.startsWith('AMB') ? allTabs[Number(key.slice(3))] : null;
          const json = options.response || (tab ? {ok: false, error: `Ambiguous target Lead ID in ${tab}: multiple rows; staff review required.`} :
            {ok: true, leadId: payload.leadId, status: action === 'track' ? 'WhatsApp Opened' : action === 'fresh' ? 'New Lead' : 'duplicate_ignored'});
          return {status: 200, type: options.corsType || 'cors', url: redirectURL, json: async () => json};
        }
      });
      return nativeSimulation(args);
    }
  };
  try { return {result: await run(page), metrics}; }
  catch (error) { return {error, metrics}; }
}

const selections = [
  'UNIQUE-fresh', 'UNIQUE-track', 'UNIQUE-retry',
  ...Array.from({length: 9}, (_, i) => [`${i}-track`, `${i}-retry`]).flat(),
  ...Array.from({length: 4}, (_, i) => [`AMB${i}-track`, `AMB${i}-retry`]).flat()
];
for (const selection of selections) {
  const {result, error, metrics} = await simulate(selection);
  assert.ifError(error);
  assert.equal(result.pass, true, selection);
  assert.equal(result.postCount, 1);
  assert.equal(result.redirectCount, 1);
  assert.equal(metrics.posts, 1);
  assert.equal(metrics.evaluations, 1);
  assert.equal(metrics.timer, 60000);
  assert.equal(metrics.cleared, 1);
}
// Explicit later partial-repair retries use precisely the original IDs and bodies.
for (let i = 0; i < 9; i++) assert.equal((await simulate(`${i}-retry`)).result.leadId, base.protectionCases[i].leadId);
for (const selection of ['FRESH-fresh', '0-fresh', 'AMB0-fresh', '9-retry', 'AMB4-track', 'UNIQUE-fresh-extra', 'UNIQUE']) {
  const {error, metrics} = await simulate(selection);
  assert.match(error.message, /case\/action/);
  assert.equal(metrics.reads.length, 0);
  assert.equal(metrics.evaluations, 0);
}
for (const endpoint of wrongURLs) {
  const {error, metrics} = await simulate('UNIQUE-fresh', {manifest: {endpoint}});
  assert.match(error.message, /exact pinned/);
  assert.equal(metrics.evaluations, 0);
}
for (const identity of [{copiedSheetId: 'WRONG'}, {projectId: 'WRONG'}, {sourceSHA256: 'WRONG'}, {remoteVerified: true}, {automaticRemindersRequiredDisabled: false}, {deploymentVersion: 1}]) {
  const {error, metrics} = await simulate('UNIQUE-fresh', {manifest: identity});
  assert.match(error.message, /identities\/provenance/);
  assert.equal(metrics.evaluations, 0);
}
for (const mutate of [
  data => { data.unique.payload.email = 'fabricated@example.invalid'; },
  data => { data.unique.payload.marketingConsent = 'Yes'; },
  data => { data.unique.payload.action = 'delete'; },
  data => { data.unique.payload.unexpected = 'value'; },
  data => { data.unique.trackingPayload.leadId = 'WRONG'; },
  data => { data.unique.leadId = 'WRONG'; }
]) {
  const {error, metrics} = await simulate('UNIQUE-fresh', {mutate});
  assert.match(error.message, /fixture\/payload/);
  assert.equal(metrics.evaluations, 0);
}
const wrongLead = await simulate('UNIQUE-track', {response: {ok: true, leadId: 'WRONG', status: 'WhatsApp Opened'}});
const redirectNotIntercepted = await simulate('UNIQUE-retry', {redirectNotIntercepted: true});
assert.equal(redirectNotIntercepted.result.pass, true);
assert.equal(redirectNotIntercepted.result.redirectCount, 0);
assert.equal(wrongLead.result.pass, false);
for (const response of [
  {ok: false, error: 'Ambiguous sheet headers; staff review required.'},
  {ok: false, error: 'Ambiguous target Lead ID in Bookings: multiple rows; staff review required.'},
  {ok: false, error: fixtures.ambiguityCases[0].expectedErrorResponse.error, leadId: fixtures.ambiguityCases[0].leadId}
]) assert.equal((await simulate('AMB0-retry', {response})).result.pass, false);
assert.equal((await simulate('UNIQUE-retry', {corsType: 'opaque'})).result.pass, false);
const failed = await simulate('UNIQUE-fresh', {failure: true});
assert.equal(failed.result.pass, false);
assert.equal(failed.result.uncertain, true);
assert.equal(failed.metrics.posts, 1);
const probed = await simulate('UNIQUE-track', {probe: true});
assert.equal(probed.result.pass, false);
assert.equal(probed.metrics.aborted.length, 5);
assert.equal(probed.metrics.continued.length, 2);
const redirectProbed = await simulate('UNIQUE-track', {probeBeforeRedirect: true});
assert.equal(redirectProbed.result.pass, false);
assert.equal(redirectProbed.metrics.aborted.length, 8);
assert.equal(redirectProbed.metrics.continued.length, 2);

const source = (await readFile(new URL('Code.gs', import.meta.url), 'utf8')).replace(/\r\n?/g, '\n');
const actualHash = createHash('sha256').update(source).digest('hex');
assert.equal(actualHash, SOURCE_SHA256, 'Candidate changed after isolated deployment review');
console.log(JSON.stringify({
  pass: true, scope: 'OFFLINE MOCKS ONLY; zero sockets, Google calls, submissions, emails, or deployment operations',
  browserSelectionsChecked: selections.length, partialRetryChecks: 9,
  endpointPin: 'Exact approved synthetic version-2 URL; unpinned/wrong URLs reject before I/O', expectedCandidateLFHash: SOURCE_SHA256,
  observedCandidateLFHash: actualHash, localCandidateHashMatches: actualHash === SOURCE_SHA256,
  remoteVerified: false, nextAction: 'Parent owns independent Google verification and actual browser/Sheet readbacks; these are offline mocks only.'
}));
