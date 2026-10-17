import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const root = process.cwd();
const output = path.join(root, 'output', 'website-whatsapp');
const pages = ['index.html', 'book.html', 'merch.html', 'elite.html'];
const assets = [];
async function walk(directory) {
  for (const entry of await fs.readdir(path.join(root, directory), {withFileTypes: true})) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await walk(file);
    else if (/\.(?:png|jpe?g|webp|svg|css|js)$/i.test(file) && !/assets\/lead-(?:capture|config)\./.test(file)) assets.push(file);
  }
}
await walk('assets');
const files = [...pages, 'logo.png', 'sitemap.xml', 'googlee25463d8d8656390.html', 'vercel.json', ...assets].sort();
const contents = new Map();
for (const file of files) contents.set(file, await fs.readFile(path.join(root, file)));
for (const page of pages) {
  const source = contents.get(page).toString();
  if (/assets\/lead-(?:config|capture)|data-tsg-lead-form|script\.google\.com|tally\.so/i.test(source)) throw new Error(`${page}: forbidden backend or retired sign-up reference`);
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) throw new Error(`${page}: duplicate IDs`);
  for (const match of source.matchAll(/\b(?:href|src)="([^"<>]+)"/g)) {
    const ref = match[1];
    if (ref.includes('${') || /^(?:https?:|mailto:|tel:)/.test(ref)) {
      if (/^https:\/\/wa\.me\//.test(ref) && new URL(ref.replaceAll('&amp;', '&')).pathname !== '/18682766878') throw new Error(`${page}: wrong WhatsApp number`);
      if (/^https:\/\/chat.whatsapp.com\//.test(ref) && !ref.startsWith('https://chat.whatsapp.com/KO19GyeuQfi3K1FEJ5GKLi')) throw new Error(`${page}: wrong group invite`);
      continue;
    }
    const [targetPart, anchor] = ref.split('#');
    const target = targetPart.split('?')[0] || page;
    if (!contents.has(target)) throw new Error(`${page}: unpublished local reference ${ref}`);
    if (anchor && !new RegExp(`\\bid=["']${anchor}["']`).test(contents.get(target).toString())) throw new Error(`${page}: missing anchor ${ref}`);
  }
  for (const match of source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc=|application\/ld\+json/i.test(match[1])) new vm.Script(match[2], {filename: page});
  }
}
const bookingScript = contents.get('assets/whatsapp-booking.js').toString();
if (/fetch\s*\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage|google|saved/i.test(bookingScript)) throw new Error('WhatsApp script contains a forbidden submission/storage path');
new vm.Script(bookingScript);
JSON.parse(contents.get('vercel.json').toString());
for (const [file, data] of contents) {
  await fs.mkdir(path.dirname(path.join(output, file)), {recursive: true});
  await fs.writeFile(path.join(output, file), data);
}
const manifest = [...contents].map(([file, data]) => ({file, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex')}));
const actual = [];
async function inspect(directory = '') {
  for (const entry of await fs.readdir(path.join(output, directory), {withFileTypes: true})) {
    const file = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) { if (file !== '.vercel') await inspect(file); }
    else if (file !== '.gitignore') actual.push(file);
  }
}
await inspect();
if (actual.some(file => !contents.has(file))) throw new Error('Unexpected file in deployment directory; inspect before staging');
await fs.writeFile(path.join(root, 'output', 'website-whatsapp-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`PASS: ${pages.length} pages, local links/anchors, direct WhatsApp destinations, retired form removal, JS syntax and no backend submission/storage API. ${manifest.length} public files packaged; backend/config/test evidence excluded.`);
console.log(output);
const fallback = path.join(root, 'output', 'website-whatsapp-fallback');
for (const [file, original] of contents) {
  const data = file === 'book.html' ? await fs.readFile(path.join(root, 'release/whatsapp-fallback-book.html')) : original;
  await fs.mkdir(path.dirname(path.join(fallback, file)), {recursive: true});
  await fs.writeFile(path.join(fallback, file), data);
}
console.log(`Static WhatsApp-only fallback prepared: ${fallback}`);
