import fs from 'node:fs/promises';
import path from 'node:path';
import {SpreadsheetFile, Workbook} from '@oai/artifact-tool';

const outputDir = path.resolve('automation/output');
const previewDir = path.join(outputDir, 'previews');
await fs.mkdir(previewDir, {recursive: true});

const workbook = Workbook.create();
const definitions = [
  {
    name: 'Leads',
    headers: ['Timestamp','Lead ID','Name','WhatsApp','Email','Location','Adult/Child','Package','Rentals Needed','Preferred Time','Source Page','UTM Source','UTM Campaign','Marketing Consent','WhatsApp Opened','Status','Notes','Tags','Lead Type','UTM Medium','Referrer'],
    widths: [20,19,20,17,27,12,14,31,16,23,19,16,19,18,17,19,24,27,14,16,28]
  },
  {
    name: 'Bookings',
    headers: ['Timestamp','Lead ID','Name','WhatsApp','Email','Location','Adult/Child','Package','Rentals Needed','Preferred Time','Source Page','Marketing Consent','WhatsApp Opened','Status','Tags','Notes'],
    widths: [20,19,20,17,27,12,14,31,16,23,19,18,17,19,27,26]
  },
  {
    name: 'Email Subscribers',
    headers: ['Timestamp','Lead ID','Email','Name','Location','Source Page','Tags','Marketing Consent','Status','Last Updated'],
    widths: [20,19,28,20,12,20,30,18,16,20]
  },
  {
    name: 'Follow Up Status',
    headers: ['Lead ID','Email','Name','WhatsApp','Lead Type','Status','First Follow Up Due','Reminder Due','Weekly Update Eligible','Last Contacted','Notes'],
    widths: [19,28,20,17,15,19,22,22,22,20,28]
  }
];

for (const definition of definitions) {
  const sheet = workbook.worksheets.add(definition.name);
  const lastColumn = columnLetter(definition.headers.length);
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  sheet.getRange(`A1:${lastColumn}1`).values = [definition.headers];
  sheet.getRange(`A1:${lastColumn}1`).format = {
    fill: '#E8EAED',
    font: {bold: true, color: '#202124', size: 10},
    verticalAlignment: 'center',
    wrapText: true,
    borders: {preset: 'outside', style: 'thin', color: '#BDC1C6'}
  };
  sheet.getRange(`A1:${lastColumn}1`).format.rowHeight = 34;

  definition.widths.forEach((width, index) => {
    sheet.getRange(`${columnLetter(index + 1)}:${columnLetter(index + 1)}`).format.columnWidth = width;
  });

  sheet.getRange(`A2:${lastColumn}500`).format = {
    font: {color: '#202124', size: 10},
    verticalAlignment: 'center',
    borders: {insideHorizontal: {style: 'thin', color: '#F1F3F4'}}
  };
}

const statuses = ['New Lead','WhatsApp Opened','Replied','Confirmed','Paid','No Response','Follow Up Needed'];
const yesNo = ['Yes','No'];
const leads = workbook.worksheets.getItem('Leads');
const bookings = workbook.worksheets.getItem('Bookings');
const subscribers = workbook.worksheets.getItem('Email Subscribers');
const followUp = workbook.worksheets.getItem('Follow Up Status');

leads.getRange('P2:P500').dataValidation = {rule: {type: 'list', values: statuses}};
leads.getRange('N2:O500').dataValidation = {rule: {type: 'list', values: yesNo}};
bookings.getRange('N2:N500').dataValidation = {rule: {type: 'list', values: statuses}};
bookings.getRange('L2:M500').dataValidation = {rule: {type: 'list', values: yesNo}};
subscribers.getRange('H2:H500').dataValidation = {rule: {type: 'list', values: yesNo}};
subscribers.getRange('I2:I500').dataValidation = {rule: {type: 'list', values: ['Subscribed','Unsubscribed']}};
followUp.getRange('F2:F500').dataValidation = {rule: {type: 'list', values: statuses}};
followUp.getRange('I2:I500').dataValidation = {rule: {type: 'list', values: yesNo}};

leads.getRange('A2:A500').format.numberFormat = 'yyyy-mm-dd hh:mm';
bookings.getRange('A2:A500').format.numberFormat = 'yyyy-mm-dd hh:mm';
subscribers.getRange('A2:A500').format.numberFormat = 'yyyy-mm-dd hh:mm';
subscribers.getRange('J2:J500').format.numberFormat = 'yyyy-mm-dd hh:mm';
followUp.getRange('G2:H500').format.numberFormat = 'yyyy-mm-dd hh:mm';
followUp.getRange('J2:J500').format.numberFormat = 'yyyy-mm-dd hh:mm';

for (const [sheet, range] of [[leads,'P2:P500'],[bookings,'N2:N500'],[followUp,'F2:F500']]) {
  sheet.getRange(range).conditionalFormats.add('containsText', {text: 'Confirmed', format: {fill: '#D9EAD3', font: {color: '#274E13'}}});
  sheet.getRange(range).conditionalFormats.add('containsText', {text: 'Paid', format: {fill: '#CFE2F3', font: {color: '#073763'}}});
  sheet.getRange(range).conditionalFormats.add('containsText', {text: 'Follow Up Needed', format: {fill: '#FCE8B2', font: {color: '#7F6000'}}});
  sheet.getRange(range).conditionalFormats.add('containsText', {text: 'No Response', format: {fill: '#F4CCCC', font: {color: '#990000'}}});
}

const inspect = await workbook.inspect({kind: 'sheet,table', include: 'id,name', maxChars: 5000, tableMaxRows: 3, tableMaxCols: 22});
console.log(inspect.ndjson);

const errors = await workbook.inspect({kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: {useRegex: true, maxResults: 50}, summary: 'final formula error scan'});
console.log(errors.ndjson);

for (const definition of definitions) {
  const preview = await workbook.render({sheetName: definition.name, range: `A1:${columnLetter(definition.headers.length)}4`, scale: 1, format: 'png'});
  await fs.writeFile(path.join(previewDir, `${definition.name.replace(/\s+/g, '-').toLowerCase()}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(outputDir, 'TSG Website Leads.xlsx'));

function columnLetter(number) {
  let result = '';
  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }
  return result;
}
