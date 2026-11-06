import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifestBytes=await fs.readFile(path.join(root,'MANIFEST.json'));
assert.equal((await fs.readFile(path.join(root,'MANIFEST.sha256'),'utf8')).split(/\s+/)[0],digest(manifestBytes));
const manifest=JSON.parse(manifestBytes);
const expected=new Set(['MANIFEST.json','MANIFEST.sha256']);
for(const entry of manifest.files){
 assert(!path.isAbsolute(entry.path)&&!entry.path.includes('\\')&&!entry.path.split('/').includes('..'),'Invalid payload path');
 assert(!expected.has(entry.path),'Duplicate payload entry');expected.add(entry.path);
 const file=path.join(root,...entry.path.split('/'));assert((await fs.lstat(file)).isFile(),'Non-file payload');
 const bytes=await fs.readFile(file);assert.equal(bytes.length,entry.bytes,entry.path);assert.equal(digest(bytes),entry.sha256,entry.path);
}
const extras=[];
async function walk(dir=''){
 for(const e of await fs.readdir(path.join(root,dir),{withFileTypes:true})){
  const rel=dir?`${dir}/${e.name}`:e.name;
  if(rel==='.git')continue;
  if(e.isDirectory()){if(e.name==='output')continue;await walk(rel);}
  else if(!expected.has(rel))extras.push(rel);
 }
}
await walk();assert.deepEqual(extras,[],'Unexpected transfer files');
assert.equal(JSON.parse(await fs.readFile(path.join(root,'vercel.json'),'utf8')).git.deploymentEnabled,false);
console.log(`PASS: ${manifest.files.length} payload hashes, manifest checksum, inventory and Git deployment disable. No network requests.`);
