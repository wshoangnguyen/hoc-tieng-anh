const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = [
  'https://hoctienganhdelam.com',
  'http://localhost:3001',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
];

// ============================================================
// LOAD LESSON DATA (6 levels: 1-6)
// ============================================================
let lessonData = {};
try {
  const lessonsDir = path.join(__dirname, 'lessons');
  for (let i = 1; i <= 6; i++) {
    const filePath = path.join(lessonsDir, `level${i}.json`);
    if (fs.existsSync(filePath)) {
      lessonData[`level${i}`] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ Loaded level${i}: ${lessonData[`level${i}`].length} units`);
    }
  }
} catch (e) {
  console.warn('⚠️ Could not load lesson data:', e.message);
}

// Build a compact reference from lesson data
function buildLessonContext() {
  if (Object.keys(lessonData).length === 0) return '';
  
  let ctx = '\n📚 COMPLETE CURRICULUM REFERENCE:\n';
  for (let lv = 1; lv <= 6; lv++) {
    const units = lessonData[`level${lv}`] || [];
    ctx += `\nLEVEL ${lv} (Cambridge ${lv <= 2 ? 'Super Minds' : lv <= 4 ? 'Prepare' : 'Open World'}):\n`;
    for (const u of units) {
      ctx += `Unit ${u.unit || 0}: "${u.title}" | Vocab: ${(u.vocabulary || []).slice(0, 6).join(', ')}... | Grammar: ${(u.grammar || [])[0] || 'N/A'}\n`;
    }
  }
  return ctx;
}

// ============================================================
// BUDDY AI SYSTEM PROMPT
// Based on Harvey's BUDDY_AI_SYSTEM_PROMPT.docx + Instruction Library
// ============================================================
const SYSTEM_PROMPT = `You are Buddy, a friendly AI teaching assistant helping Vietnamese students (ages 7-14) learn English. You were created by the teacher team "Học Tiếng Anh Dễ Lắm" (Learning English Is Easy).

🎯 YOUR MISSION:
Help students: understand how English works, think for themselves, find answers on their own, and feel that learning English is fun and easy. You are NOT an answer machine — you are a guide and coach.

⛔ CRITICAL RULES:
1. NEVER give direct answers to homework, tests, or writing assignments.
2. ALWAYS encourage students to think first. Use: "Bạn nghĩ sao?", "Bạn thử đoán xem?", "Bạn nghĩ đáp án nào hợp lý nhất?"
3. Mistakes are part of learning — always encourage before correcting.
4. Every response: SHORT (4-6 sentences max), easy to understand, age-appropriate.
5. After every 1-2 exchanges, ask a question to keep the student thinking.
6. NEVER discuss politics, religion, violence, or adult topics.
7. If a question is NOT about English learning: respond briefly, then gently guide back to English.

😊 TONE & PERSONALITY:
- Friendly, cheerful, patient, encouraging
- Address students as "mình – bạn" (Vietnamese friendly form)
- Use emojis lightly: 😊 👍 🎉 🤔 💪 ✨ (not too many)
- Celebrate effort: "Ý tưởng của bạn rất gần đúng rồi!", "Great try! 👍"
- If frustrated: "Không sao đâu, học từ từ sẽ giỏi thôi! 😊"

📖 VOCABULARY QUESTIONS — 5-STEP PROCESS:
STEP 1: Give 1-2 English example sentences containing the word.
  Example: "I want to explore new places."
STEP 2: Translate the example to Vietnamese.
  "Tôi muốn khám phá những nơi mới."
STEP 3: Ask the student to guess the meaning.
  "Dựa vào câu ví dụ này, bạn đoán từ 'explore' nghĩa là gì? 🤔"
STEP 4: If correct → confirm meaning, guide pronunciation, encourage making own sentence.
        If wrong → praise effort, give another hint/example.
STEP 5: Ask student to make their own sentence with the word.

📝 GRAMMAR QUESTIONS — 4-STEP PROCESS:
STEP 1: Give a clear example sentence.
  "I am reading a book."
STEP 2: Show the structure.
  "Subject + am/is/are + V-ing"
STEP 3: Explain simply (avoid complex terminology).
STEP 4: Give a mini practice.
  "Mini Practice: She ___ playing football. (A. is  B. are  C. am) Bạn chọn đáp án nào? 😊"

✏️ CORRECTING STUDENT WRITING — 4 STEPS:
1. Praise effort: "Great try! 👍"
2. Show original: "Câu của bạn: I goed to school."
3. Correct: "Câu đúng: I went to school."
4. Explain briefly: "Vì 'go' là động từ bất quy tắc, quá khứ là 'went'."

🚫 WHEN STUDENTS ASK FOR DIRECT ANSWERS:
Respond gently but firmly:
"Mình rất muốn giúp bạn hiểu bài, nhưng mình không thể làm bài hộ bạn. Chúng ta hãy cùng phân tích bài này nhé! Bạn đang phân vân chỗ nào? 😊"

🎮 MINI CHALLENGES:
Occasionally create short practice exercises:
"🎮 Mini Challenge:
She ___ to school yesterday.
A. go
B. went
C. gone
Bạn chọn đáp án nào? 😊"

📐 FORMATTING RULES (VERY IMPORTANT):
- ALWAYS use line breaks between ideas — never write a wall of text.
- Use bullet points (• or -) for lists, steps, or options.
- Use **bold** for key words, grammar patterns, and correct answers.
- Use 🎯 for main points, 📖 for vocabulary, 📝 for grammar, 🎮 for mini games.
- Separate examples onto their own line.
- MAX 2-3 sentences per paragraph, then break.
- Example of GOOD formatting:
  "Chào bạn! Để hiểu từ **explore**, mình cùng xem ví dụ nhé 📖
  
  • *I want to **explore** new places.*
  → Dịch: Tôi muốn khám phá những nơi mới.
  
  🤔 Dựa vào ví dụ trên, bạn đoán **explore** nghĩa là gì?
  
  Sau khi bạn đoán xong, mình sẽ hướng dẫn phát âm nhé!"
- Example of BAD formatting (NEVER do this):
  "Chào bạn để hiểu từ explore mình cùng xem ví dụ nhé I want to explore new places dịch là tôi muốn khám phá những nơi mới dựa vào ví dụ trên bạn đoán explore nghĩa là gì"

📚 CURRICULUM CONTEXT:
The student is learning from Cambridge English curriculum:
- Levels 1-2: Super Minds (foundation: ABC, numbers, colors, classroom, family, daily routines, animals, food, body, sports)
- Levels 3-4: Prepare (elementary: school subjects, comparatives, past simple, prepositions, future tense)
- Levels 5-6: Open World (pre-intermediate: present perfect, conditionals, passive voice, reported speech, modals)

When relevant, reference the current unit topic based on the student's question.`;

// ============================================================
// SIMPLE IN-MEMORY SESSION STORE
// ============================================================
const sessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Rate limiting
const MAX_CONCURRENT = 15;
let activeRequests = 0;

function getSession(sessionId) {
  let session = sessions.get(sessionId);
  if (!session) {
    session = { history: [], lastActive: Date.now() };
    sessions.set(sessionId, session);
  }
  session.lastActive = Date.now();
  return session;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastActive > SESSION_TIMEOUT) sessions.delete(id);
  }
}, 10 * 60 * 1000);

// ============================================================
// CHAT LOGGING — stores chat history for teacher review
// ============================================================
const LOG_FILE = path.join(__dirname, 'chat_log.json');
let chatLog = [];

// Load existing log from local file
if (fs.existsSync(LOG_FILE)) {
  try {
    chatLog = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    console.log(`📋 Loaded ${chatLog.length} chat log entries from local file`);
  } catch (e) {
    console.warn('Could not load local log, will try GitHub restore');
  }
}

// If local log is empty, try restore from Google Sheets (no-op for now)
// Google Sheets acts as permanent backup — local file is ephemeral on Render Free
if (chatLog.length === 0) {
  console.log('📋 Starting with empty local log (Google Sheets has permanent backup)');
}

function saveLog() {
  // Auto-clean logs older than 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  chatLog = chatLog.filter(e => new Date(e.time).getTime() > thirtyDaysAgo);
  // Keep max 10000 entries
  if (chatLog.length > 10000) chatLog = chatLog.slice(-10000);
  fs.writeFileSync(LOG_FILE, JSON.stringify(chatLog, null, 2));
}

function logChat(sessionId, studentName, question, answer) {
  const entry = {
    time: new Date().toISOString(),
    sessionId: (sessionId || 'unknown').substring(0, 15),
    student: studentName || 'Không tên',
    question: question.substring(0, 500),
    answer: answer.substring(0, 500),
  };
  chatLog.push(entry);
  // Save IMMEDIATELY to avoid data loss on Render Free spin-down
  saveLog();
  // Also log to console for Render dashboard
  console.log(`[Buddy] ${entry.time} | ${entry.student} | Q: "${entry.question.substring(0, 60)}" | A: "${entry.answer.substring(0, 60)}"`);
}

// ============================================================
// GOOGLE SHEETS BACKUP — sends logs to Google Sheets every 5 min
// ============================================================
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL || '';
const GOOGLE_SHEET_TOKEN = process.env.GOOGLE_SHEET_TOKEN || 'buddy-ai-log-secret-2026';

// Track which entries have already been sent to Sheets (by index in chatLog)
let lastSheetSyncIndex = 0;

function backupToGoogleSheets() {
  if (!GOOGLE_SHEET_URL) {
    console.warn('⚠️ GOOGLE_SHEET_URL not set — skipping Google Sheets backup');
    return;
  }

  saveLog(); // flush before backup

  // Get new entries since last sync
  const newEntries = chatLog.slice(lastSheetSyncIndex);
  if (newEntries.length === 0) {
    console.log('📋 No new entries to sync to Google Sheets');
    return;
  }

  // Send to Google Sheets via Apps Script Web App
  const url = new URL(GOOGLE_SHEET_URL);
  const payload = JSON.stringify({ entries: newEntries });
  const postPath = url.pathname + '?token=' + encodeURIComponent(GOOGLE_SHEET_TOKEN);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: postPath,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    timeout: 15000,
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            lastSheetSyncIndex = chatLog.length; // mark as synced
            console.log(`📤 Synced ${result.count} logs to Google Sheets (total: ${result.total})`);
          } else {
            console.warn('Google Sheets sync error:', result.error);
          }
        } catch (e) {
          console.warn('Google Sheets response parse error:', e.message);
        }
      } else {
        console.warn(`Google Sheets sync failed: HTTP ${res.statusCode}`);
      }
    });
  });

  req.on('error', (e) => console.warn('Google Sheets sync error:', e.message));
  req.setTimeout(15000, () => { req.destroy(); console.warn('Google Sheets sync timeout'); });
  req.write(payload);
  req.end();
}

// Sync to Google Sheets every 1 minute (so logs survive even if student closes immediately)
setInterval(backupToGoogleSheets, 1 * 60 * 1000);

// Also sync on server start (after 15s to let everything load)
setTimeout(backupToGoogleSheets, 15000);

// ============================================================
// CALL AI API
// ============================================================
function callAI(messages, callback, attempt = 1) {
  const apiKey = process.env.API_KEY;
  const apiUrl = process.env.API_URL || 'https://api.deepseek.com/v1/chat/completions';
  const model = process.env.MODEL || 'deepseek-chat';

  if (!apiKey) {
    callback(new Error('API key not configured'));
    return;
  }

  const payload = JSON.stringify({
    model: model,
    messages: messages,
    max_tokens: 350,
    temperature: 0.7,
  });

  const url = new URL(apiUrl);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(payload),
    },
    timeout: 30000,
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.choices && result.choices[0] && result.choices[0].message) {
          callback(null, result.choices[0].message.content.trim());
        } else if (result.error) {
          // Retry on rate limit or server error (max 2 retries)
          if (attempt < 3 && (result.error.code === 'rate_limit_exceeded' || result.error.type === 'server_error')) {
            console.warn(`Retry ${attempt}/2 after API error: ${result.error.message}`);
            setTimeout(() => callAI(messages, callback, attempt + 1), 2000 * attempt);
          } else {
            callback(new Error(result.error.message || 'API error'));
          }
        } else {
          callback(new Error('Unexpected API response'));
        }
      } catch (e) {
        callback(new Error('Failed to parse API response'));
      }
    });
  });

  req.on('timeout', () => {
    req.destroy();
    if (attempt < 3) {
      console.warn(`Timeout retry ${attempt}/2`);
      setTimeout(() => callAI(messages, callback, attempt + 1), 2000 * attempt);
    } else {
      callback(new Error('Request timeout after retries'));
    }
  });

  req.on('error', (e) => {
    if (attempt < 3) {
      console.warn(`Network retry ${attempt}/2: ${e.message}`);
      setTimeout(() => callAI(messages, callback, attempt + 1), 2000 * attempt);
    } else {
      callback(e);
    }
  });
  req.write(payload);
  req.end();
}

// ============================================================
// HTTP SERVER
// ============================================================
const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      name: 'Buddy AI',
      activeSessions: sessions.size,
      levelsLoaded: Object.keys(lessonData).length,
    }));
    return;
  }

  // Chat endpoint
  if (req.method === 'POST' && req.url === '/chat') {
    // Rate limiter: if too many concurrent requests, ask to wait
    if (activeRequests >= MAX_CONCURRENT) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        reply: 'Buddy đang có rất nhiều bạn hỏi cùng lúc... Bạn đợi vài giây rồi thử lại nhé! 🤖💨',
        sessionId: 'busy',
      }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { message, sessionId, studentName } = JSON.parse(body);
        if (!message || !message.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }

        // Content filter for young children
        const blocked = /sex|porn|kill|die|suicide|drug|bomb|gun|terror|nude|nsfw/i;
        if (blocked.test(message)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            reply: 'Mình ở đây để giúp bạn học tiếng Anh thôi nhé! Bạn muốn hỏi gì về tiếng Anh nào? 😊📚',
            sessionId: sessionId || 'default',
          }));
          return;
        }

        const session = getSession(sessionId || 'default');
        // Store student name in session for logging
        if (studentName) session.studentName = studentName;
        session.history.push({ role: 'user', content: message });

        // Build messages: system prompt + lesson context + last 10 messages
        const messages = [
          { role: 'system', content: SYSTEM_PROMPT + '\n\n' + buildLessonContext() },
          ...session.history.slice(-10),
        ];

        activeRequests++;
        callAI(messages, (err, reply) => {
          activeRequests--;
          if (err) {
            console.error('Buddy AI error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              reply: 'Buddy đang hơi mệt một chút... Bạn đợi vài giây rồi thử lại nhé! 🤖💤',
              sessionId: sessionId || 'default',
            }));
            return;
          }

          session.history.push({ role: 'assistant', content: reply });

          // LOG for teacher review — use student name from session
          logChat(sessionId || 'default', session.studentName || 'Không tên', message, reply);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            reply: reply,
            sessionId: sessionId || 'default',
          }));
        });

      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // LOG VIEWER — teacher can view all chat history
  if (req.method === 'GET' && req.url === '/logs') {
    saveLog(); // flush before viewing
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const rows = chatLog.slice().reverse().map((entry, i) => {
      const time = new Date(entry.time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      return `<tr>
        <td>${chatLog.length - i}</td>
        <td>${time}</td>
        <td style="font-weight:600">${(entry.student || 'Không tên').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
        <td style="max-width:300px;word-break:break-word">${entry.question.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
        <td style="max-width:300px;word-break:break-word">${entry.answer.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
      </tr>`;
    }).join('\n');
    
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buddy AI — Chat Logs</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, sans-serif; background: #f5f5f0; padding: 20px; }
    h1 { color: #f7d281; margin-bottom: 5px; font-size: 24px; }
    .subtitle { color: #888; margin-bottom: 20px; font-size: 14px; }
    .controls { margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap; }
    .controls input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; width: 250px; }
    .controls button { padding: 8px 16px; background: #f7d281; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; }
    .controls select { padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    th { background: #f7d281; color: #5a3e00; padding: 10px 12px; text-align: left; font-size: 13px; position: sticky; top: 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:hover td { background: #fff9e6; }
    .count { font-size: 12px; color: #888; margin-top: 10px; }
    @media (max-width: 768px) { th:nth-child(3), td:nth-child(3) { display: none; } }
  </style>
</head>
<body>
  <h1>🤖 Buddy AI — Chat Logs</h1>
  <p class="subtitle">Lịch sử trò chuyện của học sinh với Buddy</p>
  <div class="controls">
    <input type="text" id="search" placeholder="Tìm kiếm..." oninput="filterTable()">
    <select id="sessionFilter" onchange="filterTable()">
      <option value="">Tất cả học sinh</option>
      ${[...new Set(chatLog.map(e => e.sessionId))].map(id => `<option value="${id}">${id}</option>`).join('')}
    </select>
    <button onclick="location.reload()">🔄 Làm mới</button>
    <a href="/health" style="font-size:13px;color:#888;text-decoration:none;align-self:center;">↩ Về health</a>
  </div>
  <table id="logTable">
    <thead>
      <tr>
        <th>#</th>
        <th>Thời gian</th>
        <th>Học sinh</th>
        <th>Câu hỏi</th>
        <th>Buddy trả lời</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p class="count">📋 Tổng: ${chatLog.length} cuộc hội thoại</p>
  <script>
    function filterTable() {
      const search = document.getElementById('search').value.toLowerCase();
      const session = document.getElementById('sessionFilter').value;
      document.querySelectorAll('#logTable tbody tr').forEach(tr => {
        const text = tr.textContent.toLowerCase();
        const match = (!search || text.includes(search)) && (!session || text.includes(session));
        tr.style.display = match ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
    res.end(html);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🦉 Buddy AI chatbot server running on port ${PORT}`);
  console.log(`📚 ${Object.keys(lessonData).length} levels loaded`);
});
