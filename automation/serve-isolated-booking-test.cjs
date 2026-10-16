// Local-only review preview. Does not edit the production config or deploy anything.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const endpoint = 'https://script.google.com/macros/s/AKfycbw755w_Pso18XZhhkqyywTngGDKNIJRYnl1vf7N5rxAUYtJBtxNhp38pFPQQt8q0y1Nuw/exec';
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.json':'application/json'};
http.createServer((req, res) => {
  if (req.method !== 'GET') return res.writeHead(405).end();
  const url = new URL(req.url, 'http://127.0.0.1:4192');
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/book.html' : url.pathname)); }
  catch { return res.writeHead(400).end(); }
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, bytes) => {
    if (error) return res.writeHead(404).end();
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    // Preserve the actual review timeout and other settings; change only the test destination.
    res.end(url.pathname === '/assets/lead-config.js'
      ? bytes.toString().replace(/endpoint:\s*'[^']*'/, `endpoint: '${endpoint}'`)
      : bytes);
  });
}).listen(4192, '127.0.0.1', () => console.log('ISOLATED TEST ONLY: http://127.0.0.1:4192/book.html; do not submit new contacts without email approval.'));
