import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createIsolationAcceptanceFixtures, createManifest, ORIGIN} from './isolation-acceptance-fixtures.mjs';
import {APPROVED_ENDPOINT} from './isolation-acceptance-server.mjs';

const source = readFileSync(new URL('isolation-acceptance-browser-native.js', import.meta.url), 'utf8');
const run = vm.runInNewContext(`(${source})`, {URL});
const original = createIsolationAcceptanceFixtures();
async function simulate(selection, options = {}) {
  const fixtures = structuredClone(original);
  options.mutate?.(fixtures);
  let posts = 0;
  const result = await run({
    url: () => `${ORIGIN}/#${selection}`,
    request: {get: async url => ({status: () => 200,
      json: async () => url.endsWith('/manifest.json') ? createManifest(APPROVED_ENDPOINT) : fixtures})},
    route: () => {throw Error('Native harness must not intercept requests');},
    evaluate: async (fn, args) => {
      const execute = vm.runInNewContext(`(${fn.toString()})`, {
        performance: {now: () => 100}, AbortController,
        setTimeout: (_, ms) => {assert.equal(ms, 90000); return 1;},
        clearTimeout: id => assert.equal(id, 1),
        fetch: async (endpoint, config) => {
          posts++;
          assert.equal(endpoint, APPROVED_ENDPOINT);
          assert.equal(config.method, 'POST');
          assert.equal(config.mode, 'cors');
          assert.equal(config.credentials, 'omit');
          const payload = JSON.parse(config.body);
          const [key, action] = selection.split('-');
          if (action !== 'track') {assert.equal(payload.email, ''); assert.equal(payload.marketingConsent, 'No');}
          const ambiguous = key.startsWith('AMB');
          const expected = ambiguous ? original.ambiguityCases[Number(key.slice(3))].expectedErrorResponse :
            {ok: true, leadId: payload.leadId, status: action === 'track' ? 'WhatsApp Opened' : action === 'fresh' ? 'New Lead' : 'duplicate_ignored'};
          return {status: 200, type: options.type || 'cors', url: 'https://script.googleusercontent.com/macros/echo?redacted',
            json: async () => options.response || expected};
        }
      });
      return execute(args);
    }
  });
  return {result, posts};
}
const selections = [
  ...['UNIQUE', 'UNIQUE2'].flatMap(key => ['fresh', 'track', 'retry'].map(action => `${key}-${action}`)),
  ...Array.from({length: 9}, (_, i) => [`${i}-track`, `${i}-retry`]).flat(),
  ...Array.from({length: 4}, (_, i) => [`AMB${i}-track`, `AMB${i}-retry`]).flat()
];
for (const selection of selections) {
  const {result, posts} = await simulate(selection);
  assert.equal(result.pass, true, selection);
  assert.equal(posts, 1);
  assert.match(result.networkEvidenceRequired, /exactly one new POST/);
}
assert.equal((await simulate('UNIQUE2-retry', {response: {ok: true, service: 'TSG Website Leads'}})).result.pass, false);
assert.equal((await simulate('UNIQUE2-retry', {response: {ok: true, leadId: 'WRONG', status: 'duplicate_ignored'}})).result.pass, false);
assert.equal((await simulate('UNIQUE2-retry', {type: 'opaque'})).result.pass, false);
await assert.rejects(simulate('UNIQUE2-fresh', {mutate: f => {f.unique2.payload.email = 'not-allowed@example.invalid';}}), /Exact synthetic/);
console.log(`PASS offline only: ${selections.length} native-harness selections, one mocked fetch each; health/mismatched/opaque responses rejected. No sockets or Google calls.`);
