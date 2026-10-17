import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('output/website-whatsapp');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.xml':'application/xml'};
const config = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const servingRoot = pathname.startsWith('/fallback/') ? path.resolve('output/website-whatsapp-fallback') : root;
    const relative = pathname.startsWith('/fallback/') ? pathname.slice('/fallback'.length) : pathname;
    const file = path.resolve(servingRoot, `.${relative === '/' ? '/index.html' : relative}`);
    if (!file.startsWith(`${servingRoot}${path.sep}`) || relative.split('/').some(segment => segment.startsWith('.'))) throw new Error('Forbidden');
    const data = await fs.readFile(file);
    for (const header of config.headers[0].headers) response.setHeader(header.key, header.value);
    response.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(4201, '127.0.0.1', () => console.log('Website-only preview: http://127.0.0.1:4201'));
