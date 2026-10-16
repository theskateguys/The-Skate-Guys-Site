// Local-only review preview. Does not edit the production config or deploy anything.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const v1Endpoint = 'https://script.google.com/macros/s/AKfycbw755w_Pso18XZhhkqyywTngGDKNIJRYnl1vf7N5rxAUYtJBtxNhp38pFPQQt8q0y1Nuw/exec';
const productionEndpoint = 'https://script.google.com/macros/s/AKfycbymjXSnhFomwbFB7aHQXMffD73hKy7dXr80rixGOuDumRcnLoPOjN6L8bj1rGUMUVkC8g/exec';
const candidate = process.env.TSG_ISOLATED_CANDIDATE_ENDPOINT;
const approved = process.env.TSG_APPROVED_CANDIDATE_ENDPOINT;
const fixturePath = path.join(root, 'output', 'optimized-acceptance-private.json');
const sourceConfig = fs.readFileSync(path.join(root, 'assets', 'lead-config.js'), 'utf8');
const requireSafe = (ok, message) => { if (!ok) throw new Error(message); };
requireSafe(/requestTimeoutMs:\s*25000\b/.test(sourceConfig), 'Actual config must retain 25000ms');
if (candidate || approved) {
  requireSafe(candidate && candidate === approved, 'Candidate must match explicit approved endpoint allowlist');
  requireSafe(/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(candidate), 'Canonical isolated exec URL required');
  requireSafe(candidate !== productionEndpoint && candidate !== v1Endpoint && !sourceConfig.includes(candidate), 'Production/current/v1 destinations forbidden in candidate mode');
}
const endpoint = candidate || v1Endpoint;
const readApproval = () => {
  if (!candidate) return;
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  requireSafe(fixture.endpoint === candidate && fixture.approvedIsolatedCandidate === true &&
    fixture.automaticRemindersDisabled === true && fixture.ownContactDetails === true &&
    fixture.existingRowsCompleteVerifiedByParent === true,
  'Approved own-contact fixture, disabled reminders and parent complete-row verification required');
};
readApproval();
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.json':'application/json'};
http.createServer((req, res) => {
  if (req.method !== 'GET') return res.writeHead(405).end();
  const url = new URL(req.url, 'http://127.0.0.1:4192');
  if (req.headers.host !== '127.0.0.1:4192') return res.writeHead(403).end();
  try { readApproval(); } catch { return res.writeHead(403).end(); }
  if (url.pathname === '/isolated-test-manifest.json') {
    res.writeHead(200, {'Content-Type':'application/json', 'Cache-Control':'no-store'});
    return res.end(JSON.stringify({mode:candidate ? 'optimized-candidate' : 'v1', expectedCandidateEndpoint:candidate || null, endpoint, requestTimeoutMs:25000}));
  }
  // Do not expose the checkout, Git metadata, arbitrary output or private fixtures.
  const privateFile = candidate ? '/output/optimized-acceptance-private.json' : '/output/real-browser-ack-private.json';
  if (!(url.pathname === '/' || url.pathname === '/book.html' || url.pathname === '/logo.png' ||
      /^\/assets\/[A-Za-z0-9_./-]+$/.test(url.pathname) || url.pathname === privateFile)) return res.writeHead(403).end();
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/book.html' : url.pathname)); }
  catch { return res.writeHead(400).end(); }
  if (!file.startsWith(root + path.sep) || (url.pathname.startsWith('/assets/') && !file.startsWith(path.join(root, 'assets') + path.sep))) return res.writeHead(403).end();
  fs.readFile(file, (error, bytes) => {
    if (error) return res.writeHead(404).end();
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    // Preserve the actual review timeout and other settings; change only the test destination.
    res.end(url.pathname === '/assets/lead-config.js'
      ? bytes.toString().replace(/endpoint:\s*'[^']*'/, `endpoint: '${endpoint}'`)
      : bytes);
  });
}).listen(4192, '127.0.0.1', () => console.log(`ISOLATED TEST ONLY (${candidate ? 'approved candidate' : 'v1'}): http://127.0.0.1:4192/book.html; explicit runner approval required for fresh blank-email submission.`));
