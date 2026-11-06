import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {verifyArtifact} from '../new-intake-web/lib.mjs';
const relativeArtifact = 'output/new-intake-web/isolated-stage-v1';
const artifact = path.resolve(relativeArtifact);
const checked = await verifyArtifact(relativeArtifact);
const endpoint = 'https://script.google.com/macros/s/AKfycbwtS-JSw6zdr32pmqeuYIqTfX7umMo7PHeEb2vNeMsk0QYt-bMBXYqyCn7vUzOwdr1Eig/exec';
if (checked.manifest.runtimeEndpoint !== endpoint) throw new Error('Wrong isolated endpoint');
const site = 'release';
const files = new Map([...checked.files].filter(([name]) => name.startsWith(`${site}/`)));
const csp = JSON.parse(files.get(`${site}/vercel.json`)).headers[0].headers.find(header => header.key === 'Content-Security-Policy').value;
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
const fixture = {
  scope:'SYNTHETIC ONLY', endpoint, projectId:'15mf3aFuF6ZWDkP5qkk220XNGU4X1G0yYuQqI6gGXPc7E5olcdYuD7g-2',
  spreadsheetId:'1mRV2mJuv5hU57j6uFMJWPm5IdihzjLdpkbltqbXlxV0', automaticRemindersDisabled:true,
  approvedOneEmailTo:'redacted-contact@example.test', label:'TEST ONLY - Clean Intake Acceptance 16 October 2026'
};
createServer(async (request,response) => {
  const reply = (status,body,type='text/plain') => {response.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Content-Security-Policy':csp});response.end(body);};
  if (request.headers.host !== '127.0.0.1:4202' || request.method !== 'GET') return reply(403,'Forbidden');
  const url = new URL(request.url,'http://127.0.0.1:4202');
  if (url.pathname === '/acceptance-fixture.json') return reply(200,JSON.stringify(fixture),'application/json');
  const name = `${site}/${url.pathname === '/' ? 'book.html' : url.pathname.slice(1)}`;
  if (!files.has(name) || name.endsWith('vercel.json')) return reply(404,'Not found');
  const bytes = await fs.readFile(path.join(artifact,name));
  if (!bytes.equals(files.get(name))) return reply(409,'Artifact changed');
  reply(200,bytes,types[path.extname(name)] || 'application/octet-stream');
}).listen(4202,'127.0.0.1',()=>console.log('APPROVED SYNTHETIC NATIVE-GOOGLE ACCEPTANCE ONLY: http://127.0.0.1:4202/book.html'));
