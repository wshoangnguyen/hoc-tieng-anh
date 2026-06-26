const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = [
  'https://hoctienganhdelam.com',
  'http://localhost:3001',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

// ============================================================
// ENGLISH TUTOR SYSTEM PROMPT
// Harvey can edit this anytime to change bot behavior
// ============================================================
const SYSTEM_PROMPT = `You are "Mr. Owl" (Thầy Cú) - a friendly English tutor for Vietnamese children aged 7-13.

YOUR PERSONALITY:
- Warm, encouraging, patient like a favorite teacher
- Use simple English mixed with Vietnamese when needed to help kids understand
- Celebrate small wins ("Tuyệt vời!", "Great job!", "Em giỏi quá!")
- Use emojis occasionally to make it fun 🦉✨

YOUR RULES:
1. ONLY help with English learning. Politely refuse questions about other topics.
2. NEVER give direct answers to homework. Instead, explain the concept, give examples, then ask the student to try.
3. Keep responses SHORT (3-5 sentences max) - kids have short attention spans.
4. For vocabulary: explain meaning in Vietnamese, give an English example sentence.
5. For grammar: simple explanation in Vietnamese, then 2-3 English examples.
6. For pronunciation: describe how to say it, use Vietnamese sound comparisons.
7. Always end with an encouraging question to keep the conversation going.
8. NEVER discuss politics, religion, violence, or adult topics. Change topic immediately.
9. If a child seems frustrated, say "Không sao đâu, học từ từ sẽ giỏi thôi!"

HOW TO TEACH (no direct answers):
- Bad: "The answer is 'She goes to school.'"
- Good: "Để nói 'cô ấy đi học', em cần động từ 'go'. Với 'she' thì thêm 'es' thành 'goes'. Vậy em thử nói cả câu xem nào? 🦉"

LESSON CONTEXT FROM TEACHER:
The teacher's website teaches Cambridge English (Super Minds, Prepare, Open World).
Use this context when relevant to the student's question.`;

// ============================================================
// SIMPLE IN-MEMORY SESSION STORE
// ============================================================
const sessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function getSession(sessionId) {
  let session = sessions.get(sessionId);
  if (!session) {
    session = { history: [], lastActive: Date.now() };
    sessions.set(sessionId, session);
  }
  session.lastActive = Date.now();
  return session;
}

// Clean old sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastActive > SESSION_TIMEOUT) sessions.delete(id);
  }
}, 10 * 60 * 1000);

// ============================================================
// CALL AI API
// ============================================================
function callAI(messages, callback) {
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
    max_tokens: 300,
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
    timeout: 25000,
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
          callback(new Error(result.error.message || 'API error'));
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
    callback(new Error('Request timeout'));
  });

  req.on('error', (e) => { callback(e); });
  req.write(payload);
  req.end();
}

// ============================================================
// HTTP SERVER
// ============================================================
const server = http.createServer((req, res) => {
  // CORS headers
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', activeSessions: sessions.size }));
    return;
  }

  // Chat endpoint
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { message, sessionId } = JSON.parse(body);
        if (!message || !message.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }

        // Basic content filter for young children
        const blocked = /sex|porn|kill|die|suicide|drug|bomb|gun|terror/i;
        if (blocked.test(message)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            reply: 'Xin lỗi em, thầy Cú chỉ giúp em học tiếng Anh thôi nhé! Em muốn hỏi gì về tiếng Anh nào? 🦉📚',
            sessionId: sessionId || 'default',
          }));
          return;
        }

        const session = getSession(sessionId || 'default');
        session.history.push({ role: 'user', content: message });

        // Build messages with system prompt + history (last 10 messages)
        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...session.history.slice(-10),
        ];

        callAI(messages, (err, reply) => {
          if (err) {
            console.error('AI error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              reply: 'Thầy Cú đang hơi mệt một chút... Em đợi vài giây rồi thử lại nhé! 🦉💤',
              sessionId: sessionId || 'default',
            }));
            return;
          }

          session.history.push({ role: 'assistant', content: reply });

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

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🦉 Mr. Owl chatbot server running on port ${PORT}`);
});
