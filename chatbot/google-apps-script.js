/**
 * Google Apps Script — Buddy AI Chat Log Receiver
 * CÀI ĐẶT:
 * 1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/1ypREllM2KmQLiyN4vMKpYT-aFDyWQ9QPSlQYYZzJKXk/edit
 * 2. Extensions → Apps Script
 * 3. Dán toàn bộ code này vào
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 */

const SECRET_TOKEN = 'buddy-ai-log-secret-2026';
const SHEET_NAME = 'ChatLogs';

function doPost(e) {
  try {
    const params = e.parameter;
    if (params.token !== SECRET_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Thời gian (VN)', 'Session ID', 'Học sinh', 'Câu hỏi', 'Buddy trả lời', 'Timestamp ISO']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f7d281');
      sheet.setColumnWidth(1, 160);
      sheet.setColumnWidth(2, 130);
      sheet.setColumnWidth(3, 130);
      sheet.setColumnWidth(4, 350);
      sheet.setColumnWidth(5, 350);
      sheet.setColumnWidth(6, 200);
      sheet.setFrozenRows(1);
    }

    // === DEDUP: Build set of existing (timestamp, sessionId) keys ===
    const existingRows = sheet.getLastRow();
    const existingKeys = new Set();
    if (existingRows > 1) {
      const timestamps = sheet.getRange(2, 6, existingRows - 1, 1).getValues().flat();
      const sessionIds = sheet.getRange(2, 2, existingRows - 1, 1).getValues().flat();
      for (let i = 0; i < timestamps.length; i++) {
        existingKeys.add(timestamps[i] + '::' + sessionIds[i]);
      }
    }

    // Append only NEW entries (not yet in sheet)
    const entries = data.entries || [data];
    let added = 0;
    let skipped = 0;

    for (const entry of entries) {
      const key = (entry.time || '') + '::' + (entry.sessionId || '');
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }
      const timeVN = new Date(entry.time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      sheet.appendRow([
        timeVN,
        entry.sessionId || '',
        entry.student || 'Không tên',
        entry.question || '',
        entry.answer || '',
        entry.time || new Date().toISOString()
      ]);
      existingKeys.add(key);
      added++;
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      added: added,
      skipped: skipped,
      total: sheet.getLastRow() - 1
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const params = e.parameter || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok', totalRows: 0, logs: []
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const lastRow = sheet.getLastRow();
  const totalRows = Math.max(0, lastRow - 1);

  // If ?fetch=1, return all log data as JSON
  if (params.fetch === '1') {
    if (totalRows === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        totalRows: 0, logs: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    const rows = sheet.getRange(2, 1, totalRows, 6).getValues();
    const logs = rows.map(r => ({
      timeVN: r[0],
      sessionId: r[1],
      student: r[2],
      question: r[3],
      answer: r[4],
      time: r[5]
    }));
    return ContentService.createTextOutput(JSON.stringify({
      totalRows: totalRows,
      logs: logs
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Default: health check
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    service: 'Buddy AI Chat Log Receiver',
    sheetName: SHEET_NAME,
    totalRows: totalRows
  })).setMimeType(ContentService.MimeType.JSON);
}

function cleanOldLogs(daysOld) {
  daysOld = daysOld || 30;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return 'Sheet not found';
  const data = sheet.getDataRange().getValues();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const cutoffTime = cutoff.getTime();
  for (let i = data.length - 1; i >= 1; i--) {
    const isoTime = data[i][5];
    if (isoTime && new Date(isoTime).getTime() < cutoffTime) {
      sheet.deleteRow(i + 1);
    }
  }
  return `Cleaned. Remaining: ${sheet.getLastRow() - 1}`;
}
