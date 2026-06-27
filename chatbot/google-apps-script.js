/**
 * Google Apps Script — Buddy AI Chat Log Receiver
 * CÀI ĐẶT:
 * 1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/1ypREllM2KmQLiyN4vMKpYT-aFDyWQ9QPSlQYYZzJKXk/edit
 * 2. Extensions → Apps Script
 * 3. Dán toàn bộ code này vào, thay SECRET_TOKEN bằng token tự tạo
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy URL → thêm vào Render biến GOOGLE_SHEET_URL
 */

// 🔑 ĐỔI TOKEN NÀY thành chuỗi bí mật của bạn (giống như mật khẩu)
const SECRET_TOKEN = 'buddy-ai-log-secret-2026';

// 📋 Tên sheet (tab) để ghi log
const SHEET_NAME = 'ChatLogs';

function doPost(e) {
  try {
    // Xác thực token
    const params = e.parameter;
    if (params.token !== SECRET_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: 'Unauthorized' 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    
    // Mở sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Tạo sheet nếu chưa có
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Header
      sheet.appendRow([
        'Thời gian (VN)', 
        'Session ID', 
        'Học sinh', 
        'Câu hỏi', 
        'Buddy trả lời',
        'Timestamp ISO'
      ]);
      // Định dạng header
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f7d281');
      // Tự động resize cột
      sheet.setColumnWidth(1, 160);
      sheet.setColumnWidth(2, 130);
      sheet.setColumnWidth(3, 130);
      sheet.setColumnWidth(4, 350);
      sheet.setColumnWidth(5, 350);
      sheet.setColumnWidth(6, 200);
    }

    // Ghi từng dòng log
    const entries = data.entries || [data];
    for (const entry of entries) {
      const timeVN = new Date(entry.time).toLocaleString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh' 
      });
      sheet.appendRow([
        timeVN,
        entry.sessionId || '',
        entry.student || 'Không tên',
        entry.question || '',
        entry.answer || '',
        entry.time || new Date().toISOString()
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      count: entries.length,
      total: sheet.getLastRow() - 1 // trừ header
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Health check
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    service: 'Buddy AI Chat Log Receiver',
    sheetName: SHEET_NAME,
    totalRows: getTotalRows()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getTotalRows() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  return sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
}

/**
 * Tiện ích: Xóa log cũ hơn N ngày (giữ sheet không quá nặng)
 * Chạy thủ công từ Apps Script editor nếu cần
 */
function cleanOldLogs(daysOld) {
  daysOld = daysOld || 30;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return 'Sheet not found';
  
  const data = sheet.getDataRange().getValues();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const cutoffTime = cutoff.getTime();
  
  // Duyệt ngược để xóa từ dưới lên
  for (let i = data.length - 1; i >= 1; i--) {
    const isoTime = data[i][5]; // cột Timestamp ISO (index 5)
    if (isoTime && new Date(isoTime).getTime() < cutoffTime) {
      sheet.deleteRow(i + 1);
    }
  }
  return `Cleaned logs older than ${daysOld} days. Remaining: ${sheet.getLastRow() - 1}`;
}
