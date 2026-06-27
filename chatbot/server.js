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
// LOAD CURRICULUM CONTEXT (Super Minds 1-6)
// ============================================================
let curriculumContext = {};
const curriculumDir = path.join(__dirname, 'curriculum-context');
try {
  for (let i = 1; i <= 6; i++) {
    const filePath = path.join(curriculumDir, `SM${i}.json`);
    if (fs.existsSync(filePath)) {
      curriculumContext[`level${i}`] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const units = curriculumContext[`level${i}`].units.length;
      const vocab = curriculumContext[`level${i}`].units.reduce((s, u) => s + (u.vocabulary || []).length, 0);
      console.log(`✅ Loaded SM${i}: ${units} units, ${vocab} từ vựng`);
    }
  }
} catch (e) {
  console.warn('⚠️ Could not load curriculum context:', e.message);
}

// Build curriculum context based on student's level
function buildCurriculumContext(level) {
  const ctx = curriculumContext[`level${level}`];
  if (!ctx) return '';
  
  let prompt = `\n📚 CURRENT CURRICULUM — Super Minds ${level} (${ctx.age}):\n`;
  for (const u of ctx.units) {
    prompt += `\nUnit ${u.unit}: "${u.title}" (${u.topic})\n`;
    prompt += `  Vocab: ${(u.vocabulary || []).slice(0, 10).join(', ')}${u.vocabulary && u.vocabulary.length > 10 ? '...' : ''}\n`;
    prompt += `  Grammar: ${u.grammar || 'N/A'}\n`;
    prompt += `  Phrases: ${(u.key_phrases || []).join(' | ').substring(0, 120)}\n`;
    if (u.song) prompt += `  Song: ${u.song}\n`;
  }
  return prompt;
}

// Get unit info for a specific level+unit
function getUnitContext(level, unitNum) {
  const ctx = curriculumContext[`level${level}`];
  if (!ctx) return null;
  return ctx.units.find(u => u.unit === unitNum) || null;
}

// ============================================================
// LOAD QUESTION BANK (2 levels currently: 1 and 2)
// ============================================================
let questionBank = {};
const bankDir = path.join(__dirname, 'question-bank');
try {
  const files = fs.readdirSync(bankDir).filter(f => f.endsWith('.json') && f !== 'README.md');
  for (const f of files) {
    const filePath = path.join(bankDir, f);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const level = data.meta?.level || parseInt(f.match(/\d+/)?.[0] || '1');
    questionBank[`level${level}`] = data.bank || data;
    console.log(`✅ Loaded question bank level ${level}: ${(data.bank || data).length} questions`);
  }
} catch (e) {
  console.warn('⚠️ Could not load question bank:', e.message);
}

// Get random questions from bank for a specific level
function getBankQuestions(level, count = 3, excludeIds = []) {
  const bank = questionBank[`level${level}`];
  if (!bank || bank.length === 0) return [];
  
  const available = bank.filter(q => !excludeIds.includes(q.id));
  if (available.length === 0) return [];
  
  // Shuffle and pick
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Build question bank reference for system prompt
function buildBankContext(level) {
  const bank = questionBank[`level${level}`];
  if (!bank || bank.length === 0) return '';
  
  // Group by topic
  const byTopic = {};
  for (const q of bank) {
    const key = `${q.skill}:${q.topic}`;
    if (!byTopic[key]) byTopic[key] = { skill: q.skill, topic: q.topic, count: 0 };
    byTopic[key].count++;
  }
  
  let ctx = `\n📝 QUESTION BANK (Level ${level}):\n`;
  for (const group of Object.values(byTopic)) {
    const icon = group.skill === 'vocab' ? '📖' : group.skill === 'grammar' ? '📝' : '🎯';
    ctx += `  ${icon} ${group.topic}: ${group.count} câu hỏi\n`;
  }
  ctx += `  💡 Khi học sinh muốn luyện tập, dùng câu hỏi từ bank thay vì tự nghĩ ra.\n`;
  ctx += `  💡 ĐÁP ÁN LÀ CHỈ SỐ (0=A, 1=B, 2=C) — hãy xáo trộn vị trí.\n`;
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
4. **ACCURACY RULE: When grading student answers (especially multiple-choice), ALWAYS compare against the correct answer. Never say "correct" when the answer is wrong. Double-check before responding.**
5. Every response: SHORT (4-6 sentences max), easy to understand, age-appropriate.
6. After every 1-2 exchanges, ask a question to keep the student thinking.
7. NEVER discuss politics, religion, violence, or adult topics.
8. If a question is NOT about English learning: respond briefly, then gently guide back to English.
9. If you make a mistake in grading, APOLOGIZE immediately and give the correct feedback.
10. When creating multiple-choice questions: first decide all correct answers, then SHUFFLE the A/B/C options for EACH question. For example, if the correct word is "goes", put it at position B in Q1, position C in Q2, position A in Q3. Students cannot predict the answer pattern.

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

🎮 MINI CHALLENGES (CRITICAL — FOLLOW EXACTLY):
When you create a mini game with multiple-choice questions:

📋 CREATING THE GAME:
- Number each question clearly: 1, 2, 3...
- Write 3 options labeled A, B, C.
- Then SHUFFLE the options so the correct one is NOT always in the same position.
- Example process: "Q1 correct answer is 'goes'. Options before shuffle: A.goes B.go C.going. After shuffle: A.go B.goes C.going → correct is now B."
- For each question, the correct answer should end up in a DIFFERENT letter position. Result might be: Q1=B, Q2=A, Q3=C.

🤔 WHEN STUDENT ANSWERS (e.g. "1b 2b 3b"):
YOU MUST compare EACH answer against the correct one. Be HONEST.

- If student gets ALL correct:
  "🎉 Tuyệt vời! Bạn trả lời đúng cả 3 câu rồi! (Đáp án: 1A, 2A, 3A)"

- If student gets SOME correct:
  "👍 Câu 1 bạn trả lời B nhưng đáp án là A. Câu 2 bạn đúng rồi! Câu 3 bạn trả lời B nhưng đáp án là A. Mình cùng xem lại câu 1 và 3 nhé..."
  Then EXPLAIN why for each wrong answer.

- If student gets ALL wrong:
  "🤔 Cảm ơn bạn đã thử! Đáp án là 1A, 2A, 3A. Mình cùng xem từng câu nhé..."
  Then EXPLAIN each one patiently.

🚨 NEVER say "bạn làm đúng hết/đúng rồi" if the student's answer is different from the correct one.
🚨 ALWAYS double-check the answer before responding.
🚨 If you accidentally give wrong feedback, apologize immediately and correct yourself.

📐 FORMATTING RULES (VERY IMPORTANT):
- ALWAYS use line breaks between ideas — never write a wall of text.
- Use bullet points (• or -) for lists, steps, or options.
- Use **bold** for key words, grammar patterns, and correct answers.
- Use 🎯 for main points, 📖 for vocabulary, 📝 for grammar, 🎮 for mini games.
- Separate examples onto their own line.
- MAX 2-3 sentences per paragraph, then break.

🚨 MULTIPLE-CHOICE RULE (READ CAREFULLY):
When you create a multiple-choice question, the correct answer MUST be in a random position (A, B, or C). If you create 3 questions, at least 2 of them must have the correct answer in DIFFERENT positions. For example: Q1 correct=B, Q2 correct=A, Q3 correct=C. NEVER put all correct answers in position A or all in position B. Students will notice and cheat. VARIETY IS REQUIRED.
- Example of GOOD formatting:
  "Chào bạn! Để hiểu từ **explore**, mình cùng xem ví dụ nhé 📖
  
  • *I want to **explore** new places.*
  → Dịch: Tôi muốn khám phá những nơi mới.
  
  🤔 Dựa vào ví dụ trên, bạn đoán **explore** nghĩa là gì?
  
  Sau khi bạn đoán xong, mình sẽ hướng dẫn phát âm nhé!"
- Example of BAD formatting (NEVER do this):
  "Chào bạn để hiểu từ explore mình cùng xem ví dụ nhé I want to explore new places dịch là tôi muốn khám phá những nơi mới dựa vào ví dụ trên bạn đoán explore nghĩa là gì"

📚 CURRICULUM CONTEXT:
The student is learning from the Cambridge English Super Minds series (2nd Edition):
- Super Minds 1 (6-7 tuổi): Introduction to English — greetings, alphabet, numbers, colors, classroom, toys, animals, family, food, body
- Super Minds 2 (7-8 tuổi): Daily routines, animals, places in town, food/shopping, describing people, transport, sports, world cultures
- Super Minds 3 (8-9 tuổi): School subjects, chores, directions, sea animals, technology, health, comparatives/superlatives, past simple regular
- Super Minds 4 (9-10 tuổi): Dinosaurs, sports equipment, safety, travel, crime/mystery, mythical creatures, music, space, medieval times
- Super Minds 5 (10-11 tuổi): Natural disasters, rainforests, music, legends, cooking, marine life, hobbies, travel, pirates, conditionals
- Super Minds 6 (11-12 tuổi): Technology, animal adaptations, ancient civilizations, environment, media, money, health, performing arts, passive voice, reported speech

🎯 CURRENT UNIT CONTEXT will be prepended to each conversation based on student's level. Reference vocabulary and grammar from the current unit when appropriate.

🏷️ LEVEL ALIASES: Students may use short names. Understand these aliases:
- "sm1" / "SM1" / "super minds 1" = Super Minds 1 (level 1)
- "sm2" / "SM2" = Super Minds 2 (level 2)
- "sm3" / "SM3" = Super Minds 3 (level 3)
...up to sm6/SM6 = level 6
When the student says "sách sm3" or "unit 3 sm3", they want Super Minds 3. NEVER default to level 1 in that case.`;

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
    session = { 
      history: [], 
      lastActive: Date.now(),
      studentName: null,
      level: 1,        // default level
      unit: 0,          // current unit (0 = starter)
      askedQuestions: [], // track asked question IDs to avoid repeats
    };
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
      levelsLoaded: Object.keys(curriculumContext).length,
      questionBanks: Object.keys(questionBank).length,
    }));
    return;
  }

  // Level endpoints
  if (req.method === 'GET' && req.url === '/level') {
    const levels = Object.entries(curriculumContext).map(([key, ctx]) => ({
      level: parseInt(key.replace('level', '')),
      name: ctx.name,
      age: ctx.age,
      units: ctx.units.length,
      totalVocab: ctx.units.reduce((s, u) => s + (u.vocabulary || []).length, 0),
      unitsPreview: ctx.units.map(u => ({ unit: u.unit, title: u.title, topic: u.topic })),
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ levels, currentStudentCount: sessions.size }));
    return;
  }

  if (req.method === 'POST' && req.url === '/level') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { sessionId, level, unit } = JSON.parse(body);
        const session = getSession(sessionId || 'default');
        if (level && level >= 1 && level <= 6) {
          session.level = level;
          session.unit = unit || 0;
          session.askedQuestions = [];
          const ctx = curriculumContext[`level${level}`];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            level: session.level,
            unit: session.unit,
            info: ctx ? { name: ctx.name, age: ctx.age, totalUnits: ctx.units.length } : null,
          }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid level (1-6 only)' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
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
        
        // Check if student is asking for level/book/unit change
        // Patterns: "đổi sang level 3", "sách sm3", "unit 5 sm3", "level 3", "super minds 3", "sm3 unit 5", "qua sm3"
        let levelMatch = message.match(/(?:đổi|chuyển|qua|sang|học|sách|level|sm|lớp)\s*(?:super\s*minds?\s*)?(?:level\s*)?(\d)/i);
        if (!levelMatch) {
          // Match: "sm3", "SM3", "unit 3 sm3", "sách sm3"
          levelMatch = message.match(/(?:^|\s)(?:sm|SM)([1-6])(?:\s|$)/);
        }
        if (levelMatch) {
          const newLevel = parseInt(levelMatch[1]);
          if (newLevel >= 1 && newLevel <= 6) {
            session.level = newLevel;
            session.unit = 0;
            session.askedQuestions = [];
            
            // Check if also specifying a unit
            const unitMatch = message.match(/unit\s*(\d+)/i);
            if (unitMatch) {
              const unitNum = parseInt(unitMatch[1]);
              if (unitNum >= 0 && unitNum <= 9) {
                session.unit = unitNum;
              }
            }
            
            const ctx = curriculumContext[`level${newLevel}`];
            const unitInfo = session.unit > 0 ? getUnitContext(newLevel, session.unit) : null;
            let reply = `✅ Đã chuyển sang **Super Minds ${newLevel}** (${ctx ? ctx.age : ''})!\n\n📚 Chương trình: ${ctx ? ctx.name : ''}\n📖 ${ctx ? ctx.units.length : '10'} bài học\n`;
            if (unitInfo) {
              reply += `🎯 Đang học: Unit ${unitInfo.unit} — **${unitInfo.title}** (${unitInfo.topic})\n`;
              reply += `📝 Ngữ pháp: ${unitInfo.grammar?.substring(0, 100) || 'N/A'}\n`;
            } else {
              reply += `🎯 Bắt đầu từ bài Starter\n`;
            }
            reply += `\nBạn muốn học gì bây giờ? 😊`;
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              reply: reply,
              sessionId: sessionId || 'default',
              level: newLevel,
              unit: session.unit,
            }));
            return;
          }
        }
        
        session.history.push({ role: 'user', content: message });

        // Build messages: system prompt + curriculum context + bank context + last 10 messages
        let sysPrompt = SYSTEM_PROMPT + '\n\n' + buildCurriculumContext(session.level);
        sysPrompt += '\n' + buildBankContext(session.level);
        const messages = [
          { role: 'system', content: sysPrompt },
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
            level: session.level,
            unit: session.unit,
          }));
        });

      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // LOG VIEWER — teacher can view all chat history (merge local + Google Sheets)
  if (req.method === 'GET' && req.url === '/logs') {
    saveLog();
    serveLogsPage(res);
    return;
  }

// ============================================================
// LOG VIEWER PAGE — merges local chatLog + Google Sheets data
// ============================================================
function escapeHtml(s) {
  return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function serveLogsPage(res) {
  // Merge local + sheet logs (dedup by time+sessionId)
  const merged = new Map();
  for (const e of chatLog) {
    merged.set(e.time + '::' + e.sessionId, e);
  }

  // Sort by time desc
  const sorted = [...merged.values()].sort((a, b) => new Date(b.time) - new Date(a.time));

  const totalLocal = chatLog.length;

  const rows = sorted.map((entry, i) => {
    const time = new Date(entry.time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    return `<tr>
      <td>${i + 1}</td>
      <td>${time}</td>
      <td style="font-weight:600">${escapeHtml(entry.student || 'Không tên')}</td>
      <td style="max-width:300px;word-break:break-word">${escapeHtml(entry.question)}</td>
      <td style="max-width:300px;word-break:break-word">${escapeHtml(entry.answer)}</td>
    </tr>`;
  }).join('\n');

  const sessionIds = [...new Set(sorted.map(e => e.sessionId))];
  const sessionOptions = sessionIds.map(id => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join('');

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
    .subtitle { color: #888; margin-bottom: 8px; font-size: 14px; }
    .info-banner { background: #fff9e6; border: 1px solid #f7d281; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #5a3e00; display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
    .info-banner .sheet-link { margin-left: auto; background: #f7d281; color: #5a3e00; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 12px; white-space: nowrap; }
    .controls { margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap; }
    .controls input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; width: 250px; }
    .controls button { padding: 8px 16px; background: #f7d281; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; }
    .controls select { padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
    .load-sheet { background: #6C5CE7 !important; color: white !important; }
    #loading { display: none; color: #6C5CE7; font-size: 13px; margin-left: 8px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    th { background: #f7d281; color: #5a3e00; padding: 10px 12px; text-align: left; font-size: 13px; position: sticky; top: 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:hover td { background: #fff9e6; }
    .sheet-row { background: #f0f0ff; }
    .count { font-size: 12px; color: #888; margin-top: 10px; }
    @media (max-width: 768px) { th:nth-child(3), td:nth-child(3) { display: none; } }
  </style>
</head>
<body>
  <h1>🤖 Buddy AI — Chat Logs</h1>
  <p class="subtitle">Lịch sử trò chuyện của học sinh với Buddy</p>
  <div class="info-banner">
    <span>📋 Local: <strong>${totalLocal}</strong> cuộc hội thoại</span>
    <span id="sheetCount">📊 Google Sheets: đang tải...</span>
    <a class="sheet-link" href="https://docs.google.com/spreadsheets/d/1ypREllM2KmQLiyN4vMKpYT-aFDyWQ9QPSlQYYZzJKXk/edit" target="_blank">📊 Mở Google Sheet</a>
  </div>
  <div class="controls">
    <input type="text" id="search" placeholder="Tìm kiếm..." oninput="filterTable()">
    <select id="sessionFilter" onchange="filterTable()">
      <option value="">Tất cả học sinh</option>
      ${sessionOptions}
    </select>
    <button class="load-sheet" onclick="loadFromSheet()">☁️ Tải log từ Google Sheets</button>
    <span id="loading">⏳ Đang tải...</span>
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
  <p class="count" id="totalCount">📋 Đang hiển thị: ${sorted.length} cuộc hội thoại</p>
  <script>
    // Fetch sheet count on load
    fetch('${GOOGLE_SHEET_URL}?fetch=0')
      .then(r => r.json())
      .then(d => {
        document.getElementById('sheetCount').innerHTML = '📊 Google Sheets: <strong>' + d.totalRows + '</strong> cuộc hội thoại';
      })
      .catch(() => {
        document.getElementById('sheetCount').textContent = '📊 Google Sheets: không kết nối được';
      });

    function filterTable() {
      const search = document.getElementById('search').value.toLowerCase();
      const session = document.getElementById('sessionFilter').value;
      let visible = 0;
      document.querySelectorAll('#logTable tbody tr').forEach(tr => {
        const text = tr.textContent.toLowerCase();
        const match = (!search || text.includes(search)) && (!session || text.includes(session));
        tr.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      document.getElementById('totalCount').textContent = '📋 Đang hiển thị: ' + visible + ' cuộc hội thoại';
    }

    async function loadFromSheet() {
      const btn = event.target;
      const loading = document.getElementById('loading');
      btn.disabled = true;
      loading.style.display = 'inline';
      try {
        const resp = await fetch('${GOOGLE_SHEET_URL}?fetch=1');
        const data = await resp.json();
        if (!data.logs || data.logs.length === 0) {
          alert('Google Sheets chưa có log nào.');
          return;
        }
        const tbody = document.querySelector('#logTable tbody');
        // Build dedup set from existing rows
        const existingTimes = new Set();
        tbody.querySelectorAll('tr').forEach(tr => {
          const cells = tr.cells;
          if (cells.length >= 2) existingTimes.add(cells[1].textContent.trim());
        });
        // Append new rows from sheet
        let added = 0;
        const fragment = document.createDocumentFragment();
        data.logs.reverse().forEach((entry, i) => {
          if (existingTimes.has(entry.timeVN)) return;
          const tr = document.createElement('tr');
          tr.className = 'sheet-row';
          tr.innerHTML = '<td>' + (data.logs.length - i) + '</td>' +
            '<td>' + entry.timeVN + '</td>' +
            '<td style="font-weight:600">' + (entry.student || 'Không tên').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</td>' +
            '<td style="max-width:300px;word-break:break-word">' + (entry.question || '').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</td>' +
            '<td style="max-width:300px;word-break:break-word">' + (entry.answer || '').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</td>';
          fragment.appendChild(tr);
          added++;
        });
        tbody.insertBefore(fragment, tbody.firstChild);
        document.getElementById('totalCount').textContent = '📋 Đã tải thêm ' + added + ' log từ Google Sheets';
      } catch(e) {
        alert('Lỗi tải từ Google Sheets: ' + e.message);
      } finally {
        btn.disabled = false;
        loading.style.display = 'none';
      }
    }
  </script>
</body>
</html>`;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🦉 Buddy AI chatbot server running on port ${PORT}`);
  console.log(`📚 ${Object.keys(curriculumContext).length}/6 curriculum levels loaded`);
  console.log(`📝 ${Object.keys(questionBank).length} question banks loaded`);
});
