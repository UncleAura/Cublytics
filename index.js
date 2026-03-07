const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- SESSION SETUP ---
// This creates the "VIP wristband" cookie for logged-in users
app.use(session({
  secret: 'super-secret-cublytics-key', 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if deploying with HTTPS
}));

// --- 1. DATABASE SETUP ---
const db = new sqlite3.Database('./cublytics.db', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to the SQLite database.');
});

// Create the users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  wca_id TEXT
)`);

// --- 2. API ROUTES ---

// NEW: Fetch Official WCA Profile & PRs
app.get('/api/cuber', async (req, res) => {
  const wcaId = req.query.id;
  if (!wcaId) return res.status(400).json({ error: "No WCA ID provided" });

  try {
    // Fetch live data directly from the official WCA API
    const wcaResponse = await fetch(`https://www.worldcubeassociation.org/api/v0/persons/${wcaId}`);

    if (!wcaResponse.ok) {
      return res.status(404).json({ error: "WCA ID not found." });
    }

    const wcaData = await wcaResponse.json();

    // Format the data so your frontend can read it easily
    res.json({
      wca_id: wcaData.person.wca_id,
      name: wcaData.person.name,
      country: wcaData.person.country_iso2,
      avatar: wcaData.person.avatar.url || 'https://www.worldcubeassociation.org/assets/missing_avatar_thumb-12654dd6f1aa6d458e80d02d6fb8b440965e6d6af031f0eb11a2f9602058b883.png',
      records: wcaData.personal_records
    });

  } catch (error) {
    console.error("WCA API Error:", error);
    res.status(500).json({ error: "Failed to fetch data from WCA." });
  }
});

// UPDATED: Fetch local database history (now includes individual solves & chronological order)
app.get('/api/history', (req, res) => {
  const wcaId = req.query.id;
  if (!wcaId) return res.status(400).json({ error: "No WCA ID provided" });

  // Notice: Added value1 through value5, and changed ORDER BY to ASC for chronological sorting
  const query = `SELECT competition_id, event_id, round_type_id, pos, best, average, value1, value2, value3, value4, value5 FROM wca_results WHERE person_id = ? ORDER BY competition_id ASC`;

  db.all(query, [wcaId], (err, rows) => {
    if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    if (!rows || rows.length === 0) return res.json({ stats: { solves: 0, gold: 0, silver: 0, bronze: 0 }, results: [] });

    let gold = 0, silver = 0, bronze = 0;

    rows.forEach(row => {
      // Tally medals (finals typically have round_type_id 'c' or 'f')
      if (row.round_type_id === 'c' || row.round_type_id === 'f') {
        if (row.pos == 1) gold++;
        if (row.pos == 2) silver++;
        if (row.pos == 3) bronze++;
      }
    });

    res.json({ stats: { solves: rows.length, gold, silver, bronze }, results: rows });
  });
});

// --- 3. AUTHENTICATION & SESSION ROUTES ---

// Sign Up
app.post('/api/signup', async (req, res) => {
  const { username, password, wcaId } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (username, password, wca_id) VALUES (?, ?, ?)`;

    db.run(query, [username, hashedPassword, wcaId], function(err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Username is already taken." });
        }
        return res.status(500).json({ error: "Database error." });
      }
      res.json({ message: "Account created successfully! You can now log in." });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error during signup." });
  }
});

// Log In
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: "Database error." });

    if (!user) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    // Save the user info to their session cookie!
    req.session.user = {
      username: user.username,
      wcaId: user.wca_id
    };

    res.json({ message: "Login successful!", wcaId: user.wca_id });
  });
});

// Check who is logged in
app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

// Log Out
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});

// --- 4. START THE SERVER ---
app.listen(PORT, () => {
  console.log(`Cublytics server running on port ${PORT}`);
});