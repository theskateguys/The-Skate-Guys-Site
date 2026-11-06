import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDir = path.join(root, 'output/new-intake-ops');
const sourcePath = path.join(root, 'automation/google-apps-script/Code.gs');
const runtime = path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies');
const bundledModules = path.join(runtime, 'node/node_modules');
await fs.mkdir(outputDir, { recursive: true });
const junction = path.join(outputDir, 'node_modules');
try {
  assert.equal(await fs.realpath(junction), await fs.realpath(bundledModules));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  await fs.symlink(bundledModules, junction, 'junction');
}
const require = createRequire(path.join(outputDir, 'runtime-loader.cjs'));
const { Workbook, SpreadsheetFile, FileBlob } = await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const source = await fs.readFile(sourcePath, 'utf8');
const end = source.indexOf('\nconst TSG_STATUSES =');
assert.ok(end > 0, 'Expected schema declaration boundary');
// Evaluate only the constant declarations, never Apps Script functions or services.
const schema = JSON.parse(vm.runInNewContext(`${source.slice(0, end)}\nJSON.stringify(TSG_SHEETS)`, {}, { timeout: 1000 }));
const definitions = Object.values(schema);
assert.deepEqual(definitions.map(d => d.name), ['Leads', 'Bookings', 'Email Subscribers', 'Follow Up Status']);
assert.deepEqual(definitions.map(d => d.headers.length), [26, 21, 10, 11]);
for (const definition of definitions) {
  assert.equal(new Set(definition.headers).size, definition.headers.length);
  assert.ok(definition.headers.every(h => typeof h === 'string' && h.length));
}

const xmlValidation = String.raw`
import json, sys, zipfile, xml.etree.ElementTree as E
schema = json.loads(sys.argv[2])
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(sys.argv[1]) as z:
    wb = E.fromstring(z.read('xl/workbook.xml'))
    sheets = wb.findall('s:sheets/s:sheet', ns)
    assert [s.attrib['name'] for s in sheets] == [d['name'] for d in schema]
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        shared = [''.join(s.itertext()) for s in E.fromstring(z.read('xl/sharedStrings.xml'))]
    for i, d in enumerate(schema, 1):
        sheet = E.fromstring(z.read('xl/worksheets/sheet%d.xml' % i))
        rows = sheet.findall('s:sheetData/s:row', ns)
        assert len(rows) == 1 and rows[0].attrib['r'] == '1', (d['name'], 'not header-only')
        cells = rows[0].findall('s:c', ns)
        values = []
        for c in cells:
            assert c.find('s:f', ns) is None
            if c.attrib.get('t') == 's':
                values.append(shared[int(c.find('s:v', ns).text)])
            elif c.attrib.get('t') == 'str':
                values.append(c.find('s:v', ns).text)
            else:
                values.append(''.join(c.find('s:is', ns).itertext()))
        assert values == d['headers'], (d['name'], 'header mismatch')
        pane = sheet.find('s:sheetViews/s:sheetView/s:pane', ns)
        assert pane is not None and pane.attrib.get('ySplit') == '1' and pane.attrib.get('state') == 'frozen'
    assert not any('/externalLinks/' in name or name.endswith('vbaProject.bin') for name in z.namelist())
print('PASS: exact four sheets, all headers, header-only rows, frozen first rows, no formulas/macros/external links')
`;

const results = [];
for (const filename of ['future-intake.xlsx', 'synthetic-acceptance.xlsx']) {
  const workbook = Workbook.create();
  for (const { name, headers } of definitions) {
    const sheet = workbook.worksheets.add(name);
    const header = sheet.getRangeByIndexes(0, 0, 1, headers.length);
    header.values = [headers];
    header.format = {
      fill: '#E8EAED',
      font: { name: 'Arial', size: 10, bold: true, color: '#202124' },
      wrapText: true,
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      rowHeight: 32,
    };
    headers.forEach((label, index) => {
      sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth =
        /JSON|Details|Notes|Package|Referrer|Source Page/.test(label) ? 28 :
        /Email|Timestamp|Updated|Due|Contacted/.test(label) ? 23 : 18;
    });
    sheet.freezePanes.freezeRows(1);
    sheet.showGridLines = false;
  }
  workbook.recalculate();
  for (const { name, headers } of definitions) {
    const sheet = workbook.worksheets.getItem(name);
    assert.deepEqual(sheet.getUsedRange(true).values, [headers]);
    const inspection = await workbook.inspect({ kind: 'table', range: `'${name}'!A1:D2`, include: 'values,formulas', tableMaxRows: 2, tableMaxCols: 4, maxChars: 1000 });
    assert.ok(inspection.ndjson);
    const preview = await workbook.render({ sheetName: name, range: 'A1:F3', scale: 1.5, format: 'png' });
    await fs.writeFile(path.join(outputDir, `${filename.slice(0, -5)}-${name.replaceAll(' ', '-').toLowerCase()}-headers.png`), new Uint8Array(await preview.arrayBuffer()));
  }
  const outputPath = path.join(outputDir, filename);
  await (await SpreadsheetFile.exportXlsx(workbook)).save(outputPath);
  const imported = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
  for (const { name, headers } of definitions) {
    assert.deepEqual(imported.worksheets.getItem(name).getUsedRange(true).values, [headers]);
  }
  const validation = execFileSync(path.join(runtime, 'python/python.exe'), ['-c', xmlValidation, outputPath, JSON.stringify(definitions)], { encoding: 'utf8' }).trim();
  const bytes = await fs.readFile(outputPath);
  results.push({ path: outputPath, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), validation });
  console.log(`${filename}: ${validation}`);
}
const report = { source: sourcePath, sourceSha256: createHash('sha256').update(source).digest('hex'), schema: definitions, outputs: results, scope: 'Local XLSX only; no Google write, submissions, emails, deployment, or commit.' };
await fs.writeFile(path.join(outputDir, 'validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ counts: definitions.map(d => ({ name: d.name, headers: d.headers.length })), outputs: results.map(r => r.path) }));
