import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const pages = ['index.html', 'book.html', 'merch.html'];
const failures = [];

for (const page of pages) {
  const source = await fs.readFile(path.join(root, page), 'utf8');
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) failures.push(`${page}: duplicate ids ${[...new Set(duplicates)].join(', ')}`);

  for (const match of source.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const reference = match[1].split(/[?#]/)[0];
    if (!reference || reference.includes('${') || /^(?:https?:|mailto:|tel:|#)/.test(reference)) continue;
    const target = path.resolve(root, reference);
    try { await fs.access(target); }
    catch { failures.push(`${page}: missing local reference ${reference}`); }
  }

  const inlineScripts = [...source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc=/.test(match[1]) && !/application\/ld\+json/i.test(match[1]));
  inlineScripts.forEach((match, index) => {
    try { new vm.Script(match[2], {filename: `${page}:inline-script-${index + 1}`}); }
    catch (error) { failures.push(`${page}: ${error.message}`); }
  });

  if (!source.includes('assets/lead-config.js') || !source.includes('assets/lead-capture.js')) {
    failures.push(`${page}: shared lead scripts are not loaded`);
  }
}

const expectedForms = {
  'index.html': ['data-lead-type="email"', 'data-tags="class_lead,event_lead"'],
  'book.html': ['data-lead-type="booking"', 'data-tags="class_lead"', 'data-booking-success'],
  'merch.html': ['data-lead-type="email"', 'data-tags="merch_lead"']
};

for (const [page, markers] of Object.entries(expectedForms)) {
  const source = await fs.readFile(path.join(root, page), 'utf8');
  markers.forEach(marker => {
    if (!source.includes(marker)) failures.push(`${page}: missing ${marker}`);
  });
}

for (const scriptPath of ['assets/lead-capture.js', 'assets/lead-config.js', 'automation/google-apps-script/Code.gs']) {
  const source = await fs.readFile(path.join(root, scriptPath), 'utf8');
  try { new vm.Script(source, {filename: scriptPath}); }
  catch (error) { failures.push(`${scriptPath}: ${error.message}`); }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Lead flow checks passed for index.html, book.html, merch.html and Code.gs.');
}
