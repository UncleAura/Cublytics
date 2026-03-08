const express = require('express');
const path = require('path');
const { createClient } = require('@libsql/client'); 
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE & HTML SERVING ---
app.use(express.json()); 

// Explicitly serve your HTML files from the main directory
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/personal.html', (req, res) => res.sendFile(path.join(__dirname, 'personal.html')));
app.get('/predictor.html', (req, res) => res.sendFile(path.join(__dirname, 'predictor.html')));
app.get('/improvement.html', (req, res) => res.sendFile(path.join(__dirname, 'improvement.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

// --- SESSION SETUP ---
app.use(session({
  secret: 'super-secret-cublytics-key', 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

// --- 1. DATABASE SETUP (CLOUD TURSO) ---
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

db.execute(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  wca_id TEXT
)`).then(() => {
  console.log('Connected to the Turso cloud database.');
}).catch((err) => {
  console.error('Failed to connect to Turso or create table:', err.message);
});

// --- 2. API ROUTES ---

// Fetch cloud database history (OFFICIAL WCA DATA)
app.get('/api/history', async (req, res) => {
  const wcaId = req.query.id;
  if (!wcaId) return res.status(400).json({ error: "No WCA ID provided" });

  // Look at this beauty! We use 'AS' to map your Turso snake_case columns
  // into the camelCase names your frontend expects.
  // Note: Removed value1-value5 since they aren't in your Results schema.
  const query = `
    SELECT 
      r.competition_id AS competitionId, 
      c.name AS competitionName,
      r.event_id AS eventId, 
      r.round_type_id AS roundTypeId, 
      r.pos, 
      r.best, 
      r.average, 
      MAX(CASE WHEN a.attempt_number = 1 THEN a.value ELSE 0 END) AS value1,
      MAX(CASE WHEN a.attempt_number = 2 THEN a.value ELSE 0 END) AS value2,
      MAX(CASE WHEN a.attempt_number = 3 THEN a.value ELSE 0 END) AS value3,
      MAX(CASE WHEN a.attempt_number = 4 THEN a.value ELSE 0 END) AS value4,
      MAX(CASE WHEN a.attempt_number = 5 THEN a.value ELSE 0 END) AS value5,
      IFNULL(r.regional_single_record, '') AS regionalSingleRecord,
      IFNULL(r.regional_average_record, '') AS regionalAverageRecord
    FROM Results r
    LEFT JOIN Competitions c ON r.competition_id = c.id
    LEFT JOIN result_attempts a ON r.id = a.result_id
    WHERE r.person_id = ? 
    GROUP BY r.id
    ORDER BY c.year ASC, c.month ASC, c.day ASC
  `;
  try {
    const result = await db.execute({ sql: query, args: [wcaId] });
    const rows = result.rows;

    if (!rows || rows.length === 0) {
      return res.json({ stats: { solves: 0, gold: 0, silver: 0, bronze: 0 }, results: [] });
    }

    let gold = 0, silver = 0, bronze = 0;
    rows.forEach(row => {
      // Because we used 'AS roundTypeId' in the SQL query, this loop works perfectly!
      if (row.roundTypeId === 'c' || row.roundTypeId === 'f') {
        if (row.pos == 1) gold++;
        if (row.pos == 2) silver++;
        if (row.pos == 3) bronze++;
      }
    });

    res.json({ stats: { solves: rows.length, gold, silver, bronze }, results: rows });
  } catch (err) {
    console.error("History Route Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// --- 3. AUTHENTICATION & SESSION ROUTES ---

app.post('/api/signup', async (req, res) => {
  const { username, password, wcaId } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password are required." });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (username, password, wca_id) VALUES (?, ?, ?)`;
    await db.execute({ sql: query, args: [username, hashedPassword, wcaId] });
    res.json({ message: "Account created successfully! You can now log in." });
  } catch (error) {
    if (error.message && (error.message.includes("UNIQUE") || error.message.includes("constraint failed"))) {
      return res.status(400).json({ error: "Username is already taken." });
    }
    res.status(500).json({ error: "Server error during signup." });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = ?`;
  
  try {
    const result = await db.execute({ sql: query, args: [username] });
    const user = result.rows[0]; 

    if (!user) return res.status(400).json({ error: "Invalid username or password." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid username or password." });

    req.session.user = { username: user.username, wcaId: user.wca_id };
    res.json({ message: "Login successful!", wcaId: user.wca_id });
  } catch (err) {
    res.status(500).json({ error: "Database error." });
  }
});

app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});

// --- 4. START THE SERVER ---
app.listen(PORT, () => {
  console.log(`Cublytics server running on port ${PORT}`);
});
