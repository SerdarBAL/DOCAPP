/**
 * DOCAPP reader-study webhook.
 *
 * Paste this into a Google Apps Script project bound to (or referencing) the
 * Google Sheet that should collect responses. Deploy as a Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the resulting /exec URL into your .env.local as VITE_WEBHOOK_URL.
 *
 * The DOCAPP front-end sends application/x-www-form-urlencoded with a single
 * `payload` field containing the JSON. That avoids the CORS preflight that
 * Apps Script does not respond to.
 */

const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Responses';

const HEADERS = [
  'submittedAt', 'serverReceivedAt', 'readerId', 'caseId', 'patientId',
  'region', 'modality', 'sliceCount',
  'lesionSliceIdx', 'lesionPointCount', 'lesionPointsJson',
  'location', 'diagnosis', 'completeDiagnosis', 'confidence', 'quality', 'notes',
];

function doPost(e) {
  const data = JSON.parse(e.parameter.payload);
  const sheet = ensureSheet_();

  const m = data.marking || {};
  const c = data.clinicalData || {};
  sheet.appendRow([
    data.submittedAt || '',
    new Date(),
    data.readerId || '',
    data.caseId || '',
    data.patientId || '',
    data.region || '',
    data.modality || '',
    data.sliceCount || '',
    m.sliceIdx ?? '',
    (m.points && m.points.length) || 0,
    JSON.stringify(m.points || []),
    c.location || '',
    c.diagnosis || '',
    c.completeDiagnosis || '',
    c.confidence || '',
    c.quality || '',
    c.notes || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  // Lets you sanity-check the deployment in a browser.
  return ContentService
    .createTextOutput('DOCAPP webhook alive')
    .setMimeType(ContentService.MimeType.TEXT);
}

function ensureSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
