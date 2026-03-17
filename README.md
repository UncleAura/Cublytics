# Cublytics Elite

Professional speedcubing timer and analytics platform.

## Features

- **Auth** — email/password signup with email verification, WCA ID linking
- **Sessions** — persistent solve sessions stored in SQLite
- **Timer** — WCA-compliant inspection, spacebar/touch controls, no-scroll layout
- **Scrambles** — official WCA scramble algorithm via cubing.net (same as competitions)
- **Segmented Solves** — mark Cross / F2L / OLL / PLL splits during a solve (CFOP, Roux, custom)
- **WCA Integration** — full PR table for all 17 events with world and national ranks
- **Competition Comparison** — statistical analysis of home vs official results
- **Speed-Tiered Coaching** — tips calibrated to your current average
- **CV Analysis** — local MediaPipe hand detection, TPS estimation, regrip & pause detection
- **Color Themes** — built-in presets + full custom color picker
- **Import/Export** — native backup format + csTimer import (times, penalties, scrambles)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Configure SMTP (optional but recommended)

Without SMTP, email verification is skipped automatically in development.

**Gmail:** Enable 2FA → Security → App Passwords → generate one for "Mail".

Set in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

### 4. Run

```bash
npm start
# or for development with auto-restart:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database

SQLite database (`cublytics.db`) is created automatically on first run.

Tables:
- `users` — accounts, hashed passwords, WCA IDs, color schemes
- `sessions` — named practice sessions per user
- `solves` — individual solves with time, display, scramble, segments

## Guest Mode

Click **"Continue as Guest"** to use the app without an account. Data is stored in `localStorage` and can be exported/imported as JSON.

## csTimer Import

In csTimer: **File → Export → Export to file** → upload the `.json` here.

Transfers: all sessions, times, +2/DNF penalties, scrambles, timestamps.

## Render Deployment (cublytics.onrender.com)

### Environment Variables to set in Render dashboard:

| Variable | Value |
|---|---|
| `BASE_URL` | `https://cublytics.onrender.com` |
| `JWT_SECRET` | Any long random string |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail App Password |
| `SMTP_FROM` | `noreply@cublytics.app` (or your address) |

### ⚠️ Important — Render Free Tier Database

Render's free tier has an **ephemeral filesystem** — the SQLite database (`cublytics.db`) is wiped on every redeploy or restart.

**Options to persist data:**
1. **Render Disk** (paid, $1/month) — add a persistent disk at `/var/data`, then set `DB_PATH=/var/data/cublytics.db`
2. **Free alternative** — users can export their data (Account → Export) before redeploying and reimport afterward
3. **Upgrade to Render paid tier** and mount a persistent volume

### Gmail App Password setup:
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → App Passwords
3. Create a new app password for "Mail"
4. Paste it as `SMTP_PASS` in Render



1. Set `JWT_SECRET` to a long random string
2. Set `BASE_URL` to your domain
3. Use a reverse proxy (nginx/caddy) in front of the Node server
4. Consider using a process manager (PM2, systemd)
