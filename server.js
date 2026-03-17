require('dotenv').config();
 
// Polyfill fetch for Node < 18 (Render may use older Node)
if (!globalThis.fetch) {
  const { default: nodeFetch, Headers, Request, Response } = require('node-fetch');
  globalThis.fetch   = nodeFetch;
  globalThis.Headers  = Headers;
  globalThis.Request  = Request;
  globalThis.Response = Response;
}
 
const express  = require('express');
const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto   = require('crypto');
const path     = require('path');
 
const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cublytics_dev_secret_change_in_prod';
const BASE_URL   = process.env.BASE_URL   || `https://cublytics.onrender.com`;
 
app.use(express.json({ limit: '50mb' }));
 
// Serve static files from the public directory
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
 
// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
 
// Explicit root route as fallback — ensures / always serves index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});
 
// Catch-all: any non-API route serves index.html (handles client-side routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});
 
// ══════════════════════════════════════
//  DATABASE SETUP
// ══════════════════════════════════════
let db;
try {
  db = new Database(process.env.DB_PATH || 'cublytics.db');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (e) {
  console.error('FATAL: Could not open database:', e.message);
  console.error('This usually means better-sqlite3 was compiled for a different Node version.');
  console.error('On Render: clear the build cache and redeploy, or set NODE_VERSION=18 in environment.');
  process.exit(1);
}
 
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    display_name  TEXT,
    wca_id        TEXT,
    verified      INTEGER DEFAULT 0,
    verify_token  TEXT,
    verify_expires INTEGER,
    color_scheme  TEXT    DEFAULT '{}',
    created_at    INTEGER DEFAULT (strftime('%s','now'))
  );
 
  CREATE TABLE IF NOT EXISTS sessions (
    id       TEXT    PRIMARY KEY,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name     TEXT    NOT NULL,
    event    TEXT    NOT NULL,
    date     TEXT    NOT NULL,
    source   TEXT    DEFAULT 'cublytics'
  );
 
  CREATE TABLE IF NOT EXISTS solves (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    time        REAL    NOT NULL,
    display     TEXT    NOT NULL,
    scramble    TEXT    DEFAULT '',
    comment     TEXT    DEFAULT '',
    date        INTEGER DEFAULT (strftime('%s','now')),
    segments    TEXT    DEFAULT '[]'
  );
 
  CREATE INDEX IF NOT EXISTS idx_sessions_user   ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_solves_session  ON solves(session_id);
`);
 
// ══════════════════════════════════════
//  EMAIL
// ══════════════════════════════════════
const mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
 
async function sendVerificationEmail(to, token) {
  const link = `${BASE_URL}/?token=${token}`;
  const from = process.env.SMTP_FROM || 'noreply@cublytics.app';
  await mailer.sendMail({
    from: `"Cublytics" <${from}>`,
    to,
    subject: 'Verify your Cublytics account',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:#020817;color:#e2e8f0;">
  <div style="max-width:480px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:36px;">
    <div style="font-family:'Courier New',monospace;font-weight:700;font-size:1.3rem;color:#3B82F6;margin-bottom:6px;letter-spacing:1px;">
      Cub<span style="color:#e2e8f0;">lytics</span>
    </div>
    <h1 style="font-size:1.2rem;font-weight:600;margin:0 0 12px 0;">Verify your email address</h1>
    <p style="color:#94a3b8;line-height:1.7;margin:0 0 28px 0;font-size:0.9rem;">
      You're almost set. Click below to verify your email and activate your account.
      This link expires in <strong style="color:#e2e8f0;">24 hours</strong>.
    </p>
    <a href="${link}"
       style="display:inline-block;background:#3B82F6;color:#fff;text-decoration:none;
              padding:13px 30px;border-radius:8px;font-weight:600;font-size:0.9rem;">
      Verify Email Address
    </a>
    <p style="margin:24px 0 0 0;font-size:0.75rem;color:#475569;line-height:1.7;">
      Or copy this link:<br>
      <span style="color:#3B82F6;word-break:break-all;">${link}</span>
    </p>
    <hr style="border:none;border-top:1px solid #1e293b;margin:28px 0 20px 0;">
    <p style="margin:0;font-size:0.72rem;color:#334155;line-height:1.6;">
      If you didn't create a Cublytics account, disregard this email.<br>
      This is an automated message — please do not reply.
    </p>
  </div>
</body>
</html>`
  });
}
 
// ══════════════════════════════════════
//  AUTH MIDDLEWARE
// ══════════════════════════════════════
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Token invalid or expired' }); }
}
 
// ══════════════════════════════════════
//  AUTH ROUTES
// ══════════════════════════════════════
 
// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, display_name, wca_id } = req.body;
  if (!email || !password)   return res.status(400).json({ error: 'Email and password are required.' });
  if (password.length < 8)   return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Invalid email address.' });
 
  try {
    const hash    = await bcrypt.hash(password, 12);
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 86_400_000; // 24h
 
    db.prepare(`
      INSERT INTO users (email, password_hash, display_name, wca_id, verify_token, verify_expires)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(email.toLowerCase().trim(), hash, display_name || null, wca_id?.toUpperCase() || null, token, expires);
 
    if (process.env.SMTP_USER) {
      await sendVerificationEmail(email, token);
      return res.json({ message: 'Account created. A verification link has been sent to your email.' });
    } else {
      // Dev mode: auto-verify if no SMTP configured
      db.prepare('UPDATE users SET verified = 1 WHERE email = ?').run(email.toLowerCase().trim());
      return res.json({ message: 'Account created (email verification skipped — configure SMTP to enable it).', autoVerified: true });
    }
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'That email is already registered.' });
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});
 
// Verify email
app.get('/api/auth/verify', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Verification token missing.' });
  const user = db.prepare('SELECT * FROM users WHERE verify_token = ?').get(token);
  if (!user)         return res.status(400).json({ error: 'This verification link is invalid.' });
  if (user.verified) return res.json({ message: 'Email already verified. You can log in.' });
  if (Date.now() > user.verify_expires)
    return res.status(400).json({ error: 'This link has expired. Please register again.' });
  db.prepare('UPDATE users SET verified = 1, verify_token = NULL, verify_expires = NULL WHERE id = ?').run(user.id);
  res.json({ message: 'Email verified successfully. You can now log in.' });
});
 
// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Incorrect email or password.' });
  if (!user.verified) return res.status(403).json({ error: 'Please verify your email before logging in. Check your inbox.' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, display_name: user.display_name, wca_id: user.wca_id, color_scheme: JSON.parse(user.color_scheme || '{}') } });
});
 
// Current user
app.get('/api/auth/me', requireAuth, (req, res) => {
  const u = db.prepare('SELECT id,email,display_name,wca_id,color_scheme FROM users WHERE id=?').get(req.user.id);
  if (!u) return res.status(404).json({ error: 'User not found.' });
  res.json({ ...u, color_scheme: JSON.parse(u.color_scheme || '{}') });
});
 
// Update profile
app.patch('/api/auth/me', requireAuth, (req, res) => {
  const { display_name, wca_id, color_scheme } = req.body;
  db.prepare('UPDATE users SET display_name=?,wca_id=?,color_scheme=? WHERE id=?')
    .run(display_name||null, wca_id?.toUpperCase()||null, JSON.stringify(color_scheme||{}), req.user.id);
  res.json({ ok: true });
});
 
// ══════════════════════════════════════
//  SESSIONS
// ══════════════════════════════════════
app.get('/api/sessions', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM sessions WHERE user_id=? ORDER BY date DESC').all(req.user.id));
});
 
app.post('/api/sessions', requireAuth, (req, res) => {
  const { id, name, event, date, source } = req.body;
  try {
    db.prepare('INSERT INTO sessions (id,user_id,name,event,date,source) VALUES (?,?,?,?,?,?)')
      .run(id, req.user.id, name, event, date, source||'cublytics');
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
 
app.delete('/api/sessions/:id', requireAuth, (req, res) => {
  const s = db.prepare('SELECT id FROM sessions WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!s) return res.status(404).json({ error: 'Not found.' });
  db.prepare('DELETE FROM sessions WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});
 
// ══════════════════════════════════════
//  SOLVES
// ══════════════════════════════════════
app.get('/api/sessions/:id/solves', requireAuth, (req, res) => {
  const s = db.prepare('SELECT id FROM sessions WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!s) return res.status(404).json({ error: 'Not found.' });
  const rows = db.prepare('SELECT * FROM solves WHERE session_id=? ORDER BY id ASC').all(req.params.id);
  res.json(rows.map(r => ({ ...r, time: r.time >= 999999 ? Infinity : r.time, segments: JSON.parse(r.segments||'[]') })));
});
 
app.post('/api/sessions/:id/solves', requireAuth, (req, res) => {
  const s = db.prepare('SELECT id FROM sessions WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!s) return res.status(404).json({ error: 'Not found.' });
  const { time, display, scramble, comment, date, segments } = req.body;
  const r = db.prepare(
    'INSERT INTO solves (session_id,time,display,scramble,comment,date,segments) VALUES (?,?,?,?,?,?,?)'
  ).run(req.params.id, time===Infinity?999999:time, display, scramble||'', comment||'', date||Date.now(), JSON.stringify(segments||[]));
  res.json({ id: r.lastInsertRowid });
});
 
app.delete('/api/sessions/:sessionId/solves/:id', requireAuth, (req, res) => {
  db.prepare(`DELETE FROM solves WHERE id=? AND session_id IN
    (SELECT id FROM sessions WHERE user_id=?)`).run(req.params.id, req.user.id);
  res.json({ ok: true });
});
 
// ══════════════════════════════════════
//  BULK SYNC  (offline → server)
// ══════════════════════════════════════
app.post('/api/sync', requireAuth, (req, res) => {
  const { sessions: incoming } = req.body;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: 'Invalid payload.' });
 
  const iSess  = db.prepare('INSERT OR IGNORE INTO sessions (id,user_id,name,event,date,source) VALUES (?,?,?,?,?,?)');
  const iSolve = db.prepare('INSERT INTO solves (session_id,time,display,scramble,comment,date,segments) VALUES (?,?,?,?,?,?,?)');
 
  const tx = db.transaction(() => {
    let as=0, av=0;
    for (const s of incoming) {
      const r = iSess.run(s.id, req.user.id, s.name, s.event, s.date, s.source||'import');
      if (r.changes) {
        as++;
        for (const sv of (s.solves||[])) {
          iSolve.run(s.id, sv.time===Infinity?999999:sv.time, sv.display, sv.scramble||'', sv.comment||'', sv.date||Date.now(), JSON.stringify(sv.segments||[]));
          av++;
        }
      }
    }
    return { addedSessions:as, addedSolves:av };
  });
 
  res.json(tx());
});
 
// ══════════════════════════════════════
//  AI PROXY  — forwards to Anthropic
//  Keeps the API key server-side only.
//  Accepts: { system, messages, max_tokens }
//  Allows unauthenticated calls so guests
//  can also use the AI features.
// ══════════════════════════════════════
app.post('/api/ai', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI features are not configured on this server. Add ANTHROPIC_API_KEY to your environment variables.' });
 
  const { system, messages, max_tokens = 600 } = req.body;
  if (!Array.isArray(messages) || !messages.length)
    return res.status(400).json({ error: 'messages array required' });
 
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens,
        system:     system || 'You are an elite WCA speedcubing coach.',
        messages
      })
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: e?.error?.message || `Anthropic API error ${r.status}` });
    }
    const data = await r.json();
    const text = data.content?.map(c => c.text || '').join('') || '';
    res.json({ text });
  } catch (e) {
    console.error('AI proxy error:', e.message);
    res.status(500).json({ error: 'AI request failed: ' + e.message });
  }
});
 
app.listen(PORT, () => {
  console.log(`\n  Cublytics running at http://localhost:${PORT}`);
  console.log(`  Serving static files from: ${publicDir}`);
  console.log(`  Database: ${process.env.DB_PATH || 'cublytics.db'}`);
  if (!process.env.SMTP_USER)         console.log(`  Note: SMTP not configured — email verification auto-skipped.`);
  if (!process.env.ANTHROPIC_API_KEY) console.log(`  Note: ANTHROPIC_API_KEY not set — AI features unavailable.`);
  console.log();
});
 
