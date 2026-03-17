import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createRoot } from 'react-dom/client';
import { ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from "recharts";

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);overflow:hidden;font-size:14px;transition:background .2s,color .2s}
button{cursor:pointer;border:none;outline:none;font-family:'DM Sans',sans-serif}
input,select,textarea{font-family:'DM Sans',sans-serif;background:var(--inp);border:1px solid var(--border);color:var(--text);border-radius:7px;padding:9px 13px;outline:none;width:100%;font-size:14px;transition:border-color .15s,box-shadow .15s}
input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
input::placeholder,textarea::placeholder{color:var(--muted2);opacity:1}
select option{background:var(--surface)}
:root{
  --bg:#0d1117;--surface:#161b22;--surface2:#21262d;--surface3:#2d333b;
  --inp:#0d1117;--border:#30363d;--text:#e6edf3;--text2:#c9d1d9;
  --muted:#8b949e;--muted2:#6e7681;--accent:#388bfd;--accent-glow:rgba(56,139,253,.25);
  --green:#3fb950;--red:#f85149;--yellow:#e3b341;--orange:#db6d28;--violet:#bc8cff;
}
.light{
  --bg:#f6f8fa;--surface:#ffffff;--surface2:#f0f6ff;--surface3:#e8f0fe;
  --inp:#ffffff;--border:#d0d7de;--text:#1f2328;--text2:#24292f;
  --muted:#57606a;--muted2:#8c959f;--accent:#0969da;--accent-glow:rgba(9,105,218,.18);
  --green:#1a7f37;--red:#cf222e;--yellow:#9a6700;--orange:#bc4c00;--violet:#6e40c9;
}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:10px}
.mono{font-family:'DM Mono',monospace}
.display{font-family:'Syne',sans-serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes popIn{0%{transform:scale(.97)}50%{transform:scale(1.025)}100%{transform:scale(1)}}
.fade-up{animation:fadeUp .22s ease}
.pop{animation:popIn .22s ease}
.spinner{border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite;display:inline-block;flex-shrink:0}
.btn{padding:8px 16px;border-radius:7px;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;transition:all .15s;letter-spacing:.2px;cursor:pointer;white-space:nowrap}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;filter:none}
.btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border)}
.btn-ghost:hover{background:var(--surface2)}
.btn-ghost:disabled{opacity:.4;cursor:not-allowed}
.btn-sm{padding:5px 10px;font-size:12px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:10px}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:7px;cursor:pointer;transition:all .15s;color:var(--muted);font-weight:500;user-select:none}
.nav-item:hover{background:var(--surface2);color:var(--text2)}
.nav-item.active{background:var(--surface3);color:var(--accent)}
.event-btn{padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--muted);transition:all .15s;white-space:nowrap;font-family:'DM Mono',monospace}
.event-btn:hover{border-color:var(--accent);color:var(--text2);background:var(--surface2)}
.event-btn.active{border-color:var(--accent);color:var(--accent);background:var(--accent-glow)}
.stat-box{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:11px 15px}
.stat-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.9px;font-weight:600;margin-bottom:5px}
.stat-value{font-family:'DM Mono',monospace;font-size:18px;color:var(--text)}
.stat-value.pb{color:var(--yellow)}
.stat-value.cur{color:var(--accent)}
.solve-row{display:grid;grid-template-columns:26px 1fr 58px 58px;gap:6px;align-items:center;padding:5px 8px;border-radius:5px;transition:background .1s;font-size:12px;cursor:default}
.solve-row:hover{background:var(--surface2)}
.wca-table{width:100%;border-collapse:collapse}
.wca-table th,.wca-table td{padding:8px 12px;text-align:left;border-bottom:1px solid var(--border);font-size:13px}
.wca-table th{color:var(--muted);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.8px}
.wca-table tr:last-child td{border-bottom:none}
.wca-table tr:hover td{background:var(--surface2)}
.chat-bubble{padding:10px 14px;border-radius:10px;max-width:86%;font-size:14px;line-height:1.65}
.chat-user{background:var(--accent);color:#fff;margin-left:auto;border-bottom-right-radius:3px}
.chat-ai{background:var(--surface3);border-bottom-left-radius:3px}
.parity-lbl{display:flex;align-items:center;gap:7px;cursor:pointer;padding:4px 8px;border-radius:5px;transition:background .1s;font-size:13px;user-select:none}
.parity-lbl:hover{background:var(--surface2)}
.parity-lbl input{width:15px;height:15px;cursor:pointer;accent-color:var(--accent);flex-shrink:0}
.sh{font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.9px}
.split-stage{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;border-radius:6px;margin-bottom:4px;transition:background .15s,border-color .15s}
.split-stage.done{background:var(--surface2);border:1px solid var(--border)}
.split-stage.active{background:rgba(56,139,253,.1);border:1px solid var(--accent)}
.split-stage.pending{background:transparent;border:1px solid transparent}
`;
(() => {
  if (!document.getElementById('cub-styles2')) {
    const s = document.createElement('style'); s.id = 'cub-styles2'; s.textContent = STYLES;
    document.head.appendChild(s);
  }
})();

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const WCA_API = "https://www.worldcubeassociation.org/api/v0";

const EVENTS = [
  { id: '333',    name: '3x3x3',           short: '3x3',  cat: 'NxN' },
  { id: '222',    name: '2x2x2',           short: '2x2',  cat: 'NxN' },
  { id: '444',    name: '4x4x4',           short: '4x4',  cat: 'NxN' },
  { id: '555',    name: '5x5x5',           short: '5x5',  cat: 'NxN' },
  { id: '666',    name: '6x6x6',           short: '6x6',  cat: 'NxN' },
  { id: '777',    name: '7x7x7',           short: '7x7',  cat: 'NxN' },
  { id: '333oh',  name: '3x3 One-Handed',  short: 'OH',   cat: 'NxN' },
  { id: '333bf',  name: '3x3 Blind',       short: '3BLD', cat: 'BLD' },
  { id: '444bf',  name: '4x4 Blind',       short: '4BLD', cat: 'BLD' },
  { id: '555bf',  name: '5x5 Blind',       short: '5BLD', cat: 'BLD' },
  { id: '333mbf', name: 'Multi-Blind',     short: 'MBLD', cat: 'BLD' },
  { id: '333fm',  name: 'Fewest Moves',    short: 'FMC',  cat: 'Spec' },
  { id: 'minx',   name: 'Megaminx',        short: 'Minx', cat: 'Other' },
  { id: 'pyram',  name: 'Pyraminx',        short: 'Pyra', cat: 'Other' },
  { id: 'clock',  name: 'Clock',           short: 'Clock',cat: 'Other' },
  { id: 'skewb',  name: 'Skewb',           short: 'Skewb',cat: 'Other' },
  { id: 'sq1',    name: 'Square-1',        short: 'SQ-1', cat: 'Other' },
];

const PARITY_TYPES = {
  '444':    ['OLL Parity', 'PLL Parity'],
  '555':    ['Parity'],
  '666':    ['OLL Parity', 'PLL Parity', 'Edge Parity'],
  '777':    ['Parity'],
  'sq1':    ['Parity'],
  '333bf':  ['Parity'],
  '444bf':  ['OLL Parity', 'PLL Parity', 'Parity'],
  '555bf':  ['Parity'],
  '333mbf': ['Parity'],
};

// Methods → split stage names. Final stage = timer stops.
const METHODS = {
  '333': {
    'CFOP':     ['Cross', 'F2L', 'OLL', 'PLL'],
    'Roux':     ['First Block', 'Second Block', 'CMLL', 'LSE'],
    'ZZ':       ['EOLine', 'F2L', 'OCLL', 'CPLL'],
    'Petrus':   ['2x2x2', '2x2x3', 'EO + F2L', 'Last Layer'],
    'LBL':      ['First Layer', 'Second Layer', 'OLL', 'PLL'],
    'CEOR':     ['Block', 'EO + Cols', 'Corners', 'Edges'],
    'No Splits': [],
  },
  '222': {
    'Ortega':   ['First Face', 'OBL', 'PBL'],
    'CLL':      ['First Face', 'CLL'],
    'EG':       ['First Face', 'EG'],
    'LBL':      ['First Layer', 'Last Layer'],
    'No Splits': [],
  },
  '444': {
    'Yau':        ['2 Cross Edges', 'Centers', 'Edges', 'F2L', 'LL'],
    'M-CFOP':     ['Centers', 'Edges', 'F2L', 'LL'],
    'Hoya':       ['2 Centers', 'Edges', '3x3 Stage'],
    'Reduction':  ['Centers', 'Edges', '3x3 Stage'],
    'No Splits': [],
  },
  '555': {
    'Yau5':       ['Cross Edges', 'Centers', 'Edges', '3x3 Stage'],
    'Reduction':  ['Centers', 'Edges', '3x3 Stage'],
    'No Splits': [],
  },
  '666': {
    'Reduction':  ['Centers', 'Edges', '3x3 Stage'],
    'No Splits': [],
  },
  '777': {
    'Reduction':  ['Centers', 'Edges', '3x3 Stage'],
    'No Splits': [],
  },
  '333oh': {
    'CFOP':     ['Cross', 'F2L', 'OLL', 'PLL'],
    'Roux':     ['First Block', 'Second Block', 'CMLL', 'LSE'],
    'ZZ':       ['EOLine', 'F2L', 'Last Layer'],
    'No Splits': [],
  },
  '333bf': {
    'Old Pochmann': ['Memo', 'Corners', 'Edges'],
    'M2/OP':        ['Memo', 'M2 Edges', 'OP Corners'],
    '3-Style':      ['Memo', 'Corners', 'Edges'],
    'No Splits': [],
  },
  '444bf': {
    '4BLD Standard': ['Memo', 'Corners', 'Edges', 'Centers'],
    'No Splits': [],
  },
  '555bf': {
    '5BLD Standard': ['Memo', 'Corners', 'Edges', 'Centers'],
    'No Splits': [],
  },
  '333mbf': {
    'MBLD': ['Memo', 'Execution'],
    'No Splits': [],
  },
  'minx': {
    'Krig':           ['F2L', 'Last Two Layers'],
    'Layer-by-Layer': ['First Face', 'F2L', 'Last Layer'],
    'No Splits': [],
  },
  'pyram': {
    'L4E':    ['First 3 Edges', 'L4E', 'Tips'],
    'LBL':    ['First Layer', 'Second Layer', 'Last Layer'],
    'Keyhole':['3 Faces', 'Last Face', 'Tips'],
    'No Splits': [],
  },
  'clock': {
    'Standard': ['First Face', 'Second Face'],
    'No Splits': [],
  },
  'skewb': {
    "Sarah's": ['First Face', 'Last Layer'],
    'LBL':     ['First Layer', 'Last Layer'],
    'Meow':    ['Block', 'Last Layer'],
    'No Splits': [],
  },
  'sq1': {
    'CSP':          ['CSP', 'Last Layer'],
    'Vandenbergh':  ['Square', 'Last Layer'],
    'No Splits': [],
  },
};

// ─────────────────────────────────────────────────────────────
// SCRAMBLE GENERATORS
// ─────────────────────────────────────────────────────────────
const rnd = n => Math.floor(Math.random() * n);
const pick = arr => arr[rnd(arr.length)];

// Returns a random suffix for a move
function suf(allowDouble = true) {
  const opts = allowDouble ? ["", "'", "2"] : ["", "'"];
  return pick(opts);
}

function gen333(len = 20) {
  const faces = ['U','D','R','L','F','B'];
  const opp = { U:'D',D:'U', R:'L',L:'R', F:'B',B:'F' };
  let out = [], prev = null, prevPrev = null;
  while (out.length < len) {
    let f;
    let tries = 0;
    do {
      f = pick(faces);
      tries++;
    } while (tries < 40 && (
      f === prev ||
      (f === opp[prev] && opp[f] === prevPrev) ||
      f === opp[prevPrev]
    ));
    out.push(f + suf());
    prevPrev = prev; prev = f;
  }
  return out.join(' ');
}

function gen222() {
  const faces = ['U','R','F'];
  let out = [], prev = null;
  for (let i = 0; i < 11; i++) {
    let f;
    do { f = pick(faces); } while (f === prev);
    out.push(f + suf()); prev = f;
  }
  return out.join(' ');
}

// Generic NxN: base moves + wide move bases (just the name, no suffix)
function genNxN(len, wideBases = []) {
  const faces = ['U','D','R','L','F','B'];
  const allBases = [...faces, ...wideBases];
  const opp = { U:'D',D:'U', R:'L',L:'R', F:'B',B:'F' };
  let out = [], prev = null;
  while (out.length < len) {
    let b;
    let tries = 0;
    do { b = pick(allBases); tries++; } while (tries < 20 && b === prev);
    out.push(b + suf()); prev = b;
  }
  return out.join(' ');
}

function genMinx() {
  const dirs = ['++', '--'];
  let out = [];
  for (let i = 0; i < 7; i++) {
    out.push(`R${pick(dirs)} D${pick(dirs)}`);
    if (i < 6) out.push(pick(["U", "U'"]));
  }
  return out.join(' ');
}

function genPyram() {
  const faces = ['U','L','R','B'];
  const tips = ['u','l','r','b'];
  let out = [], prev = null;
  for (let i = 0; i < 11; i++) {
    let f;
    do { f = pick(faces); } while (f === prev);
    out.push(f + suf(false)); prev = f;
  }
  tips.forEach(t => { if (Math.random() > 0.5) out.push(t + suf(false)); });
  return out.join(' ');
}

function genClock() {
  const positions = ['UR','UL','DR','DL','U','R','D','L','ALL'];
  let out = [];
  positions.forEach(p => {
    const n = rnd(12) - 5;
    if (n === 0) return;
    out.push(`${p}${Math.abs(n)}${n > 0 ? '+' : '-'}`);
  });
  if (Math.random() > 0.5) out.push('y2');
  return out.join(' ');
}

function genSkewb() {
  const faces = ['R','U','L','B'];
  let out = [], prev = null;
  for (let i = 0; i < 11; i++) {
    let f;
    do { f = pick(faces); } while (f === prev);
    out.push(f + suf(false)); prev = f;
  }
  return out.join(' ');
}

// Proper SQ1 scramble: sequence of (top, bottom)/ moves
function genSq1() {
  // Valid top/bottom values: -5 to 6, not both 0
  function randSq1Val() { return rnd(12) - 5; }
  let out = [];
  for (let i = 0; i < 11; i++) {
    let x, y;
    do { x = randSq1Val(); y = randSq1Val(); } while (x === 0 && y === 0);
    out.push(`(${x},${y})/`);
  }
  return out.join(' ');
}

function generateScramble(id) {
  switch (id) {
    case '333': case '333oh': case '333bf': return gen333(20);
    case '222': return gen222();
    case '444': case '444bf': return genNxN(40, ['Uw', 'Rw', 'Fw']);
    case '555': case '555bf': return genNxN(60, ['Uw', 'Rw', 'Fw', 'Dw', 'Lw']);
    case '666': return genNxN(80, ['Uw', 'Rw', 'Fw', '3Uw', '3Rw']);
    case '777': return genNxN(100, ['Uw', 'Rw', 'Fw', '3Uw', '3Rw', '3Fw']);
    case '333mbf': return Array.from({ length: 3 + rnd(5) }, (_, i) => `#${i + 1}: ${gen333()}`).join('\n');
    case '333fm': return gen333(25);
    case 'minx': return genMinx();
    case 'pyram': return genPyram();
    case 'clock': return genClock();
    case 'skewb': return genSkewb();
    case 'sq1': return genSq1();
    default: return gen333(20);
  }
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function fmtMs(ms) {
  if (ms === null || ms === undefined) return '—';
  if (!isFinite(ms)) return 'DNF';
  const s = ms / 1000, m = Math.floor(s / 60), r = s % 60;
  return m > 0 ? `${m}:${r.toFixed(2).padStart(5, '0')}` : r.toFixed(2);
}
function fmtCountdown(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
function effectiveMs(s) {
  if (!s) return null;
  if (s.dnf) return Infinity;
  return s.time + (s.plus2 ? 2000 : 0);
}
function calcAoN(solves, n) {
  if (solves.length < n) return null;
  const last = solves.slice(-n);
  const times = last.map(effectiveMs);
  const dnfs = times.filter(t => !isFinite(t)).length;
  if (dnfs > 1) return Infinity;
  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  if (trimmed.includes(Infinity)) return Infinity;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}
function calcBestAoN(solves, n) {
  if (solves.length < n) return null;
  let best = Infinity;
  for (let i = n - 1; i < solves.length; i++) {
    const ao = calcAoN(solves.slice(0, i + 1), n);
    if (ao !== null && ao < best) best = ao;
  }
  return isFinite(best) ? best : Infinity;
}
function bestSingle(solves) {
  const times = solves.map(effectiveMs).filter(isFinite);
  return times.length ? Math.min(...times) : null;
}
function fmtWcaTime(centis) {
  if (!centis) return '—';
  return fmtMs(centis * 10);
}
function countSTM(sol) {
  return sol.trim().split(/\s+/).filter(m => /^[A-Za-z]/.test(m) && !m.includes('/')).length;
}
async function hashPwd(p) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch { return p; }
}

// ─────────────────────────────────────────────────────────────
// STORAGE
// Key rules: no spaces, slashes, or quotes.
// Strategy: store ALL sessions for an event under one key:
//   "solves:{username}:{eventId}"  → { [sessionName]: [solve, ...] }
// ─────────────────────────────────────────────────────────────
const DB = {
  async get(k) {
    try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; }
  },
  async set(k, v) {
    try { await window.storage.set(k, JSON.stringify(v)); return true; } catch { return false; }
  },
  async del(k) { try { await window.storage.delete(k); } catch {} },
  async list(prefix) {
    try { const r = await window.storage.list(prefix); return r ? r.keys : []; } catch { return []; }
  },
};

// Save all sessions for one event atomically
async function saveEventSolves(username, eventId, allSessions) {
  await DB.set(`solves:${username}:${eventId}`, allSessions);
}

// ─────────────────────────────────────────────────────────────
// LANDING
// ─────────────────────────────────────────────────────────────
function Landing({ onSignIn, onRegister }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="display" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Cublytics</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onSignIn}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={onRegister}>Get Started</button>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '68px 0 52px' }}>
          <div className="display" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, color: 'var(--text)' }}>
            Track. Analyze.<br /><span style={{ color: 'var(--accent)' }}>Get Faster.</span>
          </div>
          <div style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.65 }}>
            A complete cubing platform for serious speedsolvers. Timer, WCA stats, progress charts, split tracking, and AI coaching.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '11px 24px', fontSize: 15 }} onClick={onRegister}>Create Free Account</button>
            <button className="btn btn-ghost" style={{ padding: '11px 24px', fontSize: 15 }} onClick={onSignIn}>Sign In</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, paddingBottom: 52 }}>
          {[
            { icon: '◷', t: 'Full-Featured Timer', d: 'All 17 WCA events with proper scramblers, spacebar-driven splits per stage, inspection, parity tracking, +2/DNF.' },
            { icon: '◈', t: 'WCA Integration', d: 'Fetch your official WCA profile, personal records, world/national rankings and competition history.' },
            { icon: '▲', t: 'Progress Analytics', d: 'Charts of Ao5, Ao12, Ao100 over time with PB history progression and per-session stats.' },
            { icon: '✦', t: 'AI Coach', d: 'Claude-powered coaching that reads your solve data, splits, and parity patterns for personalized advice.' },
          ].map(f => (
            <div key={f.icon} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 18, marginBottom: 9, color: 'var(--accent)' }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.t}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>{f.d}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: '20px 22px', marginBottom: 48 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>All 17 WCA Events</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {EVENTS.map(e => <span key={e.id} className="event-btn" style={{ cursor: 'default' }}>{e.short}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTH MODAL
// ─────────────────────────────────────────────────────────────
function AuthModal({ defaultTab = 'login', onLogin, onBack }) {
  const [tab, setTab] = useState(defaultTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [wcaId, setWcaId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!username.trim() || !password) return setError('Please enter username and password');
    setLoading(true); setError('');
    const key = `user:${username.trim().toLowerCase()}`;
    if (tab === 'login') {
      const user = await DB.get(key);
      if (!user) { setError('User not found'); setLoading(false); return; }
      const h = await hashPwd(password);
      if (user.pwHash !== h) { setError('Incorrect password'); setLoading(false); return; }
      onLogin(user);
    } else {
      if (username.trim().length < 3) { setError('Username must be 3+ characters'); setLoading(false); return; }
      const existing = await DB.get(key);
      if (existing) { setError('Username already taken'); setLoading(false); return; }
      const pwHash = await hashPwd(password);
      const user = { username: username.trim(), pwHash, wcaId: wcaId.trim().toUpperCase() || null, createdAt: Date.now() };
      await DB.set(key, user);
      onLogin(user);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', padding: 20 }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 380, padding: '34px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <button onClick={onBack} className="btn btn-ghost btn-sm">Back</button>
          <div className="display" style={{ fontSize: 18, fontWeight: 800 }}>Cublytics</div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 8, padding: 4, marginBottom: 22 }}>
          {[{ k: 'login', l: 'Sign In' }, { k: 'register', l: 'Register' }].map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); setError(''); }}
              style={{ flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: tab === t.k ? 'var(--surface)' : 'transparent',
                color: tab === t.k ? 'var(--text)' : 'var(--muted)',
                border: tab === t.k ? '1px solid var(--border)' : 'none', transition: 'all .15s' }}>
              {t.l}
            </button>
          ))}
        </div>
        {[
          { label: 'Username', val: username, set: setUsername, type: 'text', ph: 'your_username' },
          { label: 'Password', val: password, set: setPassword, type: 'password', ph: 'Password' },
          ...(tab === 'register' ? [{ label: 'WCA ID (optional)', val: wcaId, set: setWcaId, type: 'text', ph: '2019SNAM01' }] : []),
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 13 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8 }}>{f.label}</label>
            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              onKeyDown={e => e.key === 'Enter' && submit()} autoFocus={f.label === 'Username'} />
          </div>
        ))}
        {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12, padding: '7px 11px', background: 'rgba(248,81,73,.08)', borderRadius: 6, border: '1px solid rgba(248,81,73,.2)' }}>{error}</div>}
        <button className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: 14, justifyContent: 'center' }} onClick={submit} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Loading...</> : (tab === 'login' ? 'Sign In' : 'Create Account')}
        </button>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>Passwords are SHA-256 hashed. Data is stored to your Claude.ai account.</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'timer',     label: 'Timer',     icon: '◷' },
  { id: 'profile',   label: 'WCA Profile', icon: '◈' },
  { id: 'progress',  label: 'Progress',  icon: '▲' },
  { id: 'coach',     label: 'AI Coach',  icon: '✦' },
];

function Sidebar({ page, setPage, user, theme, setTheme, onLogout }) {
  return (
    <div style={{ width: 192, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', padding: '13px 9px', flexShrink: 0 }}>
      <div style={{ padding: '7px 12px', marginBottom: 13 }}>
        <div className="display" style={{ fontWeight: 800, fontSize: 18 }}>Cublytics</div>
      </div>
      <div style={{ flex: 1 }}>
        {NAV.map(n => (
          <div key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
            <span style={{ fontSize: 12, width: 16, textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
            <span style={{ fontSize: 13 }}>{n.label}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 9, marginTop: 7 }}>
        <div style={{ padding: '6px 12px', marginBottom: 5 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Signed in as</div>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
          {user.wcaId && <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 1 }}>{user.wcaId}</div>}
        </div>
        <div className="nav-item" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
          <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>{theme === 'dark' ? '*' : 'O'}</span>
          <span style={{ fontSize: 13 }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </div>
        <div className="nav-item" onClick={onLogout} style={{ color: 'var(--red)' }}>
          <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>x</span>
          <span style={{ fontSize: 13 }}>Sign Out</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FMC PAGE — 1-hour timer, text entry, manual move count
// ─────────────────────────────────────────────────────────────
const FMC_DURATION = 60 * 60 * 1000; // 1 hour in ms

function FmcPage({ user, solves, setSolves }) {
  const SESSION = 'FMC Session';
  const [phase, setPhase] = useState('idle'); // idle | solving | done
  const [scramble, setScramble] = useState(() => generateScramble('333fm'));
  const [solution, setSolution] = useState('');
  const [remaining, setRemaining] = useState(FMC_DURATION);
  const [moveCount, setMoveCount] = useState('');
  const [mcError, setMcError] = useState('');
  const timerRef = useRef(null);
  const startRef = useRef(null);

  const fmcSolves = solves['333fm']?.[SESSION] || [];

  function startAttempt() {
    setPhase('solving');
    setSolution('');
    setRemaining(FMC_DURATION);
    setMoveCount('');
    setMcError('');
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const rem = FMC_DURATION - elapsed;
      if (rem <= 0) {
        clearInterval(timerRef.current);
        setRemaining(0);
        setPhase('done');
      } else {
        setRemaining(rem);
      }
    }, 500);
  }

  function stopEarly() {
    clearInterval(timerRef.current);
    setPhase('done');
  }

  function submitAttempt() {
    const mc = parseInt(moveCount, 10);
    if (isNaN(mc) || mc < 1 || mc > 80) { setMcError('Enter a valid move count (1–80)'); return; }
    const attempt = { solution: solution.trim(), moves: mc, scramble, timestamp: Date.now(), eventId: '333fm', sessionName: SESSION };
    setSolves(prev => {
      const next = { ...prev };
      if (!next['333fm']) next['333fm'] = {};
      const existing = next['333fm'][SESSION] || [];
      const updated = [...existing, attempt];
      next['333fm'] = { ...next['333fm'], [SESSION]: updated };
      saveEventSolves(user.username, '333fm', next['333fm']);
      return next;
    });
    setPhase('idle');
    setScramble(generateScramble('333fm'));
    setSolution('');
    setMoveCount('');
  }

  const best = fmcSolves.length ? Math.min(...fmcSolves.map(s => s.moves)) : null;
  const mo3 = (() => {
    if (fmcSolves.length < 3) return null;
    return (fmcSolves.slice(-3).reduce((a, s) => a + s.moves, 0) / 3).toFixed(2);
  })();
  const ao12mc = (() => {
    if (fmcSolves.length < 12) return null;
    return (fmcSolves.slice(-12).reduce((a, s) => a + s.moves, 0) / 12).toFixed(2);
  })();

  const timerColor = remaining < 5 * 60 * 1000 ? 'var(--red)' : remaining < 10 * 60 * 1000 ? 'var(--yellow)' : 'var(--text)';

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Scramble */}
        <div className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="sh">Scramble (Fewest Moves)</span>
            {phase === 'idle' && <button className="btn btn-ghost btn-sm" onClick={() => setScramble(generateScramble('333fm'))}>New Scramble</button>}
          </div>
          <div className="mono" style={{ fontSize: 13, lineHeight: 1.85, color: 'var(--text2)', wordBreak: 'break-word' }}>{scramble}</div>
        </div>

        {phase === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 20 }}>
            <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', lineHeight: 1.6 }}>
              You have 1 hour to find the fewest moves solution.<br />Write your solution in the box, then enter your move count.
            </div>
            <button className="btn btn-primary" style={{ padding: '11px 28px', fontSize: 15 }} onClick={startAttempt}>Start 1-Hour Timer</button>
          </div>
        )}

        {phase === 'solving' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="mono" style={{ fontSize: 36, fontWeight: 500, color: timerColor, letterSpacing: -1 }}>{fmtCountdown(remaining)}</div>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={stopEarly}>Stop Early</button>
            </div>
            <div className="card" style={{ padding: '14px 18px', flex: 1 }}>
              <div className="sh" style={{ marginBottom: 9 }}>Your Solution</div>
              <textarea value={solution} onChange={e => setSolution(e.target.value)}
                placeholder="Write your solution here, e.g. R U R' U' F ..."
                style={{ minHeight: 120, resize: 'vertical', lineHeight: 1.7, fontSize: 13, fontFamily: 'DM Mono' }} />
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }} className="mono">
                {solution.trim() ? `Auto-counted: ${countSTM(solution)} STM (verify and enter manually below)` : ''}
              </div>
            </div>
          </>
        )}

        {phase === 'done' && (
          <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Time's up — enter your result</div>
            <div>
              <div className="sh" style={{ marginBottom: 8 }}>Your Solution</div>
              <textarea value={solution} onChange={e => setSolution(e.target.value)}
                placeholder="Paste or write your final solution..."
                style={{ minHeight: 90, resize: 'vertical', lineHeight: 1.7, fontSize: 13, fontFamily: 'DM Mono' }} />
            </div>
            <div>
              <div className="sh" style={{ marginBottom: 8 }}>Move Count (STM)</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input type="number" value={moveCount} onChange={e => { setMoveCount(e.target.value); setMcError(''); }}
                    placeholder="Enter your move count" min="1" max="80" />
                  {solution.trim() && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }} className="mono">Auto-count: {countSTM(solution)} STM</div>}
                  {mcError && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 5 }}>{mcError}</div>}
                </div>
                <button className="btn btn-primary" onClick={submitAttempt}>Submit</button>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', alignSelf: 'flex-start' }}
              onClick={() => { setPhase('idle'); setScramble(generateScramble('333fm')); setSolution(''); }}>
              Discard & start over
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { l: 'Best Single', v: best ?? '—', cls: 'pb' },
            { l: 'Mean of 3', v: mo3 ?? '—', cls: 'cur' },
            { l: 'Ao12', v: ao12mc ?? '—' },
            { l: 'Attempts', v: fmcSolves.length },
          ].map(s => (
            <div key={s.l} className="stat-box">
              <div className="stat-label">{s.l}</div>
              <div className={`stat-value${s.cls ? ' ' + s.cls : ''}`} style={{ fontSize: 16 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attempt history */}
      <div style={{ width: 240, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
          Attempts <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({fmcSolves.length})</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {[...fmcSolves].reverse().map((s, i) => (
            <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: s.moves === best ? 'var(--yellow)' : 'var(--text)' }}>{s.moves} moves</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.solution || '—'}</div>
              <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 1 }}>{new Date(s.timestamp).toLocaleDateString()}</div>
            </div>
          ))}
          {fmcSolves.length === 0 && <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No attempts yet</div>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TIMER PAGE — spacebar drives split stages
// ─────────────────────────────────────────────────────────────
const TS = { IDLE: 'idle', HOLDING: 'holding', INSPECT: 'inspect', INSP_HOLD: 'insp_hold', RUNNING: 'running', DONE: 'done' };

function TimerPage({ user, solves, setSolves, eventId_ = '333', setEventId_ }) {
  const [eventId, setEventIdInternal] = useState(eventId_);
  const setEventId = useCallback((v) => {
    setEventIdInternal(v);
    if (setEventId_) setEventId_(v);
  }, [setEventId_]);
  const [sessionName, setSessionName] = useState('Session 1');
  const [sessions, setSessions] = useState(['Session 1']);
  const [method, setMethod] = useState('CFOP');
  const [scramble, setScramble] = useState(() => generateScramble('333'));
  const [timerState, setTimerState] = useState(TS.IDLE);
  const [displayTime, setDisplayTime] = useState(0);
  const [inspTime, setInspTime] = useState(15);
  const [useInspection, setUseInspection] = useState(true);
  const [parities, setParities] = useState({});
  const [lastSolve, setLastSolve] = useState(null);

  // Split tracking
  const [splitTimes, setSplitTimes] = useState([]); // timestamps relative to start
  const [currentSplitIdx, setCurrentSplitIdx] = useState(0); // which stage we're on

  const startT = useRef(null);
  const intervalRef = useRef(null);
  const inspRef = useRef(null);
  const stateRef = useRef(TS.IDLE);
  const splitTimesRef = useRef([]);
  const splitIdxRef = useRef(0);
  const methodRef = useRef(method);
  const eventIdRef = useRef(eventId);
  const splitNamesRef = useRef([]);
  const sessionNameRef = useRef(sessionName);

  stateRef.current = timerState;
  methodRef.current = method;
  eventIdRef.current = eventId;
  sessionNameRef.current = sessionName;

  const currentMethods = Object.keys(METHODS[eventId] || {});
  const currentSplitNames = (METHODS[eventId] || {})[method] || [];
  splitNamesRef.current = currentSplitNames;

  const splitsActive = currentSplitNames.length > 0;

  useEffect(() => {
    const methods = Object.keys(METHODS[eventId] || {});
    setMethod(methods[0] || 'No Splits');
  }, [eventId]);

  useEffect(() => {
    (async () => {
      const data = await DB.get(`solves:${user.username}:${eventId}`);
      if (data) {
        const names = Object.keys(data);
        setSessions([...new Set(['Session 1', ...names])]);
      } else {
        setSessions(['Session 1']);
      }
    })();
  }, [eventId, user.username]);

  const eventSolves = useMemo(() => solves[eventId]?.[sessionName] || [], [solves, eventId, sessionName]);

  const newScramble = useCallback(() => {
    setScramble(generateScramble(eventId));
    setTimerState(TS.IDLE); stateRef.current = TS.IDLE;
    setDisplayTime(0);
    setInspTime(15);
    setParities({});
    setSplitTimes([]);
    setCurrentSplitIdx(0);
    splitTimesRef.current = [];
    splitIdxRef.current = 0;
  }, [eventId]);

  useEffect(() => { newScramble(); }, [eventId]);

  function addSolve(solve) {
    setSolves(prev => {
      const next = { ...prev };
      if (!next[eventId]) next[eventId] = {};
      const sessions_ = { ...next[eventId] };
      const list = [...(sessions_[sessionNameRef.current] || []), solve];
      sessions_[sessionNameRef.current] = list;
      next[eventId] = sessions_;
      saveEventSolves(user.username, eventId, next[eventId]);
      return next;
    });
    setLastSolve(solve);
  }

  function stopTimer() {
    clearInterval(intervalRef.current);
    const elapsed = Date.now() - startT.current;
    const solve = {
      time: elapsed,
      scramble,
      splits: [...splitTimesRef.current],
      splitNames: [...splitNamesRef.current],
      parities: {},
      dnf: false,
      plus2: false,
      timestamp: Date.now(),
      eventId,
      sessionName: sessionNameRef.current,
      method: methodRef.current,
    };
    addSolve(solve);
    setDisplayTime(elapsed);
    setTimerState(TS.DONE); stateRef.current = TS.DONE;
  }

  function startTimer() {
    startT.current = Date.now();
    splitTimesRef.current = [];
    splitIdxRef.current = 0;
    setSplitTimes([]);
    setCurrentSplitIdx(0);
    setTimerState(TS.RUNNING); stateRef.current = TS.RUNNING;
    intervalRef.current = setInterval(() => setDisplayTime(Date.now() - startT.current), 33);
  }

  // The main spacebar handler
  useEffect(() => {
    const onDown = e => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      const s = stateRef.current;

      if (s === TS.IDLE) {
        setTimerState(TS.HOLDING); stateRef.current = TS.HOLDING;
      } else if (s === TS.INSPECT) {
        setTimerState(TS.INSP_HOLD); stateRef.current = TS.INSP_HOLD;
      } else if (s === TS.RUNNING) {
        const splits = splitNamesRef.current;
        const hasSplits = splits.length > 0;
        if (hasSplits) {
          const idx = splitIdxRef.current;
          const t = Date.now() - startT.current;
          const newSplits = [...splitTimesRef.current, t];
          splitTimesRef.current = newSplits;
          splitIdxRef.current = idx + 1;
          setSplitTimes([...newSplits]);
          setCurrentSplitIdx(idx + 1);
          // If this was the last stage, stop
          if (idx + 1 >= splits.length) {
            stopTimer();
          }
        } else {
          stopTimer();
        }
      } else if (s === TS.DONE) {
        newScramble();
      }
    };

    const onUp = e => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      const s = stateRef.current;
      if (s === TS.HOLDING) {
        if (useInspection) {
          let cnt = 15; setInspTime(15);
          setTimerState(TS.INSPECT); stateRef.current = TS.INSPECT;
          clearInterval(inspRef.current);
          inspRef.current = setInterval(() => { cnt--; setInspTime(cnt); if (cnt <= 0) clearInterval(inspRef.current); }, 1000);
        } else {
          startTimer();
        }
      } else if (s === TS.INSP_HOLD) {
        clearInterval(inspRef.current);
        startTimer();
      }
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [useInspection, newScramble]);

  function modifySolve(field, val) {
    const idx = eventSolves.length - 1;
    if (idx < 0) return;
    setSolves(prev => {
      const next = { ...prev };
      const sessions_ = { ...next[eventId] };
      const list = [...(sessions_[sessionName] || [])];
      list[idx] = { ...list[idx], [field]: val };
      sessions_[sessionName] = list;
      next[eventId] = sessions_;
      saveEventSolves(user.username, eventId, next[eventId]);
      return next;
    });
    setLastSolve(prev => prev ? { ...prev, [field]: val } : prev);
  }

  function deleteLast() {
    setSolves(prev => {
      const next = { ...prev };
      const sessions_ = { ...next[eventId] };
      const list = (sessions_[sessionName] || []).slice(0, -1);
      sessions_[sessionName] = list;
      next[eventId] = sessions_;
      saveEventSolves(user.username, eventId, next[eventId]);
      return next;
    });
    setLastSolve(null);
    newScramble();
  }

  const tColor = () => {
    if (timerState === TS.HOLDING || timerState === TS.INSP_HOLD) return 'var(--green)';
    if (timerState === TS.INSPECT) return 'var(--yellow)';
    if (timerState === TS.RUNNING) return 'var(--text)';
    if (timerState === TS.DONE) return 'var(--accent)';
    return 'var(--muted)';
  };

  const tText = () => {
    if (timerState === TS.IDLE) {
      if (!lastSolve) return '0.00';
      const eff = effectiveMs(lastSolve);
      return fmtMs(eff) + (lastSolve.plus2 && !lastSolve.dnf ? ' (+2)' : '');
    }
    if (timerState === TS.HOLDING) return 'READY';
    if (timerState === TS.INSPECT) return inspTime > 0 ? String(inspTime) : 'GO';
    if (timerState === TS.INSP_HOLD) return 'GO';
    if (timerState === TS.RUNNING) return fmtMs(displayTime);
    if (timerState === TS.DONE) {
      if (!lastSolve) return fmtMs(displayTime);
      const eff = effectiveMs(lastSolve);
      return fmtMs(eff) + (lastSolve.plus2 && !lastSolve.dnf ? ' (+2)' : '');
    }
    return '0.00';
  };

  const ao5 = calcAoN(eventSolves, 5);
  const ao12 = calcAoN(eventSolves, 12);
  const ao100 = calcAoN(eventSolves, 100);
  const best = bestSingle(eventSolves);
  const bestAo5 = calcBestAoN(eventSolves, 5);

  // Current stage label while running
  const stageLabel = timerState === TS.RUNNING && splitsActive && currentSplitIdx < currentSplitNames.length
    ? currentSplitNames[currentSplitIdx] : null;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px', gap: 10 }}>
        {/* Event selector */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {EVENTS.filter(e => e.id !== '333fm').map(e => (
            <button key={e.id} className={`event-btn${eventId === e.id ? ' active' : ''}`} onClick={() => setEventId(e.id)}>{e.short}</button>
          ))}
        </div>
        {/* Controls row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={sessionName} onChange={e => setSessionName(e.target.value)} style={{ maxWidth: 150, fontSize: 12, padding: '5px 9px' }}>
            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const n = `Session ${sessions.length + 1}`;
            setSessions(p => [...p, n]); setSessionName(n);
          }}>+ Session</button>
          {currentMethods.length > 0 && (
            <select value={method} onChange={e => setMethod(e.target.value)} style={{ maxWidth: 160, fontSize: 12, padding: '5px 9px' }}>
              {currentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setUseInspection(p => !p)}
            style={{ color: useInspection ? 'var(--accent)' : 'var(--muted)' }}>
            Insp {useInspection ? 'ON' : 'OFF'}
          </button>
        </div>
        {/* Scramble */}
        <div className="card" style={{ padding: '11px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span className="sh">{EVENTS.find(e => e.id === eventId)?.name} — Scramble</span>
            <div style={{ display: 'flex', gap: 5 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard?.writeText(scramble).catch(() => {})}>Copy</button>
              <button className="btn btn-ghost btn-sm" onClick={newScramble}>New</button>
            </div>
          </div>
          <div className="mono" style={{ fontSize: 13, lineHeight: 1.8, wordBreak: 'break-word', color: 'var(--text2)' }}>
            {scramble.split('\n').map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
        {/* Timer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 0 }}>
          {/* Current stage indicator */}
          {timerState === TS.RUNNING && splitsActive && (
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', height: 20 }}>
              {stageLabel}
            </div>
          )}
          {timerState !== TS.RUNNING && <div style={{ height: 20 }} />}

          <div className={`mono${timerState === TS.DONE ? ' pop' : ''}`}
            style={{ fontSize: 'clamp(44px,9vw,88px)', color: tColor(), letterSpacing: '-2px', transition: 'color .1s', textAlign: 'center', lineHeight: 1 }}>
            {tText()}
          </div>

          {/* Hint text */}
          {timerState === TS.IDLE && (
            <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', lineHeight: 1.7 }}>
              Hold <kbd style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', fontFamily: 'DM Mono', fontSize: 11 }}>SPACE</kbd> to start
              {splitsActive && (
                <div style={{ marginTop: 4, color: 'var(--muted2)' }}>
                  Each <kbd style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', fontFamily: 'DM Mono', fontSize: 11 }}>SPACE</kbd> press advances to next stage — last stage stops the timer
                </div>
              )}
            </div>
          )}

          {/* Live split progress during timer */}
          {timerState === TS.RUNNING && splitsActive && currentSplitNames.length > 0 && (
            <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {currentSplitNames.map((name, i) => {
                const isDone = i < splitTimes.length;
                const isActive = i === currentSplitIdx;
                const t = isDone ? splitTimes[i] : null;
                const prev = i > 0 && isDone ? splitTimes[i - 1] : 0;
                return (
                  <div key={i} className={`split-stage ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
                    <span style={{ fontSize: 13, color: isDone ? 'var(--text2)' : isActive ? 'var(--accent)' : 'var(--muted2)', fontWeight: isActive ? 600 : 400 }}>
                      {name}
                    </span>
                    {isDone && (
                      <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtMs(t - prev)}</span>
                    )}
                    {isActive && (
                      <span style={{ fontSize: 11, color: 'var(--accent)' }}>→ SPACE</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Post-solve controls */}
          {timerState === TS.DONE && lastSolve && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, alignItems: 'center', width: '100%', maxWidth: 380 }}>
              <div style={{ display: 'flex', gap: 7 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => modifySolve('plus2', !lastSolve.plus2)}
                  style={{ color: lastSolve.plus2 ? 'var(--orange)' : 'var(--muted)' }}>+2</button>
                <button className="btn btn-ghost btn-sm" onClick={() => modifySolve('dnf', !lastSolve.dnf)}
                  style={{ color: lastSolve.dnf ? 'var(--red)' : 'var(--muted)' }}>DNF</button>
                <button className="btn btn-ghost btn-sm" onClick={deleteLast} style={{ color: 'var(--red)' }}>Delete</button>
              </div>

              {PARITY_TYPES[eventId]?.length > 0 && (
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '9px 13px', width: '100%' }}>
                  <div className="sh" style={{ marginBottom: 7 }}>Parity</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PARITY_TYPES[eventId].map(p => (
                      <label key={p} className="parity-lbl">
                        <input type="checkbox" checked={!!parities[p]} onChange={e => {
                          const np = { ...parities, [p]: e.target.checked };
                          setParities(np);
                          modifySolve('parities', np);
                        }} />{p}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {lastSolve.splits?.length > 0 && (
                <div style={{ width: '100%', background: 'var(--surface2)', borderRadius: 8, padding: '9px 13px' }}>
                  <div className="sh" style={{ marginBottom: 7 }}>Splits — {lastSolve.method}</div>
                  {lastSolve.splits.map((t, i, arr) => {
                    const prev = i === 0 ? 0 : arr[i - 1];
                    const name = (lastSolve.splitNames || [])[i] || `Stage ${i + 1}`;
                    return (
                      <div key={i} className="split-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{name}</span>
                        <span className="mono" style={{ fontSize: 13 }}>{fmtMs(t - prev)}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--muted2)' }}>{fmtMs(t)}</span>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 2px', fontWeight: 600 }}>
                    <span style={{ fontSize: 13 }}>Total</span>
                    <span className="mono" style={{ fontSize: 13, color: 'var(--accent)' }}>{fmtMs(effectiveMs(lastSolve))}</span>
                    <span />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
          {[
            { l: 'PB Single', v: fmtMs(best), c: 'pb' },
            { l: 'Current Ao5', v: fmtMs(ao5), c: 'cur' },
            { l: 'Best Ao5', v: fmtMs(bestAo5) },
            { l: 'Ao12', v: fmtMs(ao12) },
            { l: 'Ao100', v: fmtMs(ao100) },
          ].map(s => (
            <div key={s.l} className="stat-box">
              <div className="stat-label">{s.l}</div>
              <div className={`stat-value${s.c ? ' ' + s.c : ''}`} style={{ fontSize: 15 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Solve list */}
      <div style={{ width: 248, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '11px 13px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Solves <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({eventSolves.length})</span></span>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => {
            setSolves(prev => {
              const next = { ...prev };
              const sessions_ = { ...next[eventId], [sessionName]: [] };
              next[eventId] = sessions_;
              saveEventSolves(user.username, eventId, next[eventId]);
              return next;
            });
            setLastSolve(null);
          }}>Clear</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '5px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 52px 52px', gap: 4, padding: '3px 6px', marginBottom: 2 }}>
            {['#', 'TIME', 'AO5', 'AO12'].map(h => (
              <div key={h} style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</div>
            ))}
          </div>
          {[...eventSolves].reverse().map((s, ri) => {
            const idx = eventSolves.length - 1 - ri;
            const eff = effectiveMs(s);
            const a5 = calcAoN(eventSolves.slice(0, idx + 1), 5);
            const a12 = calcAoN(eventSolves.slice(0, idx + 1), 12);
            const isBest = isFinite(eff) && eff === best;
            return (
              <div key={idx} className="solve-row">
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{idx + 1}</div>
                <div className="mono" style={{ fontSize: 12, color: s.dnf ? 'var(--red)' : s.plus2 ? 'var(--orange)' : isBest ? 'var(--yellow)' : 'var(--text2)' }}>
                  {fmtMs(eff)}{s.plus2 && !s.dnf ? ' +2' : ''}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtMs(a5)}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtMs(a12)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WCA PROFILE PAGE
// ─────────────────────────────────────────────────────────────
function ProfilePage({ user }) {
  const [wcaId, setWcaId] = useState(user.wcaId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchProfile(id) {
    if (!id.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${WCA_API}/persons/${id.trim().toUpperCase()}`);
      if (!res.ok) throw new Error(`WCA ID not found (HTTP ${res.status})`);
      setData(await res.json());
    } catch (e) {
      setError(`${e.message}. The WCA API may be blocked by CORS in this sandbox. This will work on a deployed web server.`);
    }
    setLoading(false);
  }

  useEffect(() => { if (user.wcaId) fetchProfile(user.wcaId); }, []);
  const eventOrder = ['333','222','444','555','666','777','333oh','333bf','444bf','555bf','333mbf','333fm','minx','pyram','clock','skewb','sq1'];

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <div className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 16 }}>WCA Profile</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={wcaId} onChange={e => setWcaId(e.target.value)} placeholder="WCA ID (e.g. 2019SNAM01)"
          style={{ maxWidth: 280, fontSize: 13 }} onKeyDown={e => e.key === 'Enter' && fetchProfile(wcaId)} />
        <button className="btn btn-primary" onClick={() => fetchProfile(wcaId)} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Loading</> : 'Load Profile'}
        </button>
      </div>
      {error && <div style={{ color: 'var(--red)', marginBottom: 14, fontSize: 13, padding: '8px 12px', background: 'rgba(248,81,73,.07)', borderRadius: 6, border: '1px solid rgba(248,81,73,.2)', lineHeight: 1.55 }}>{error}</div>}
      {data && (
        <div className="fade-up">
          <div className="card" style={{ padding: '18px 22px', marginBottom: 14, display: 'flex', gap: 18, alignItems: 'center' }}>
            {data.person?.avatar?.thumb_url && <img src={data.person.avatar.thumb_url} alt="avatar" style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid var(--border)', objectFit: 'cover', flexShrink: 0 }} />}
            <div>
              <div className="display" style={{ fontWeight: 800, fontSize: 20, marginBottom: 2 }}>{data.person?.name}</div>
              <div className="mono" style={{ color: 'var(--accent)', fontSize: 13 }}>{data.person?.wca_id}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>{data.person?.country?.name}</div>
            </div>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>Personal Records</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="wca-table">
                <thead><tr><th>Event</th><th>Single</th><th>WR</th><th>NR</th><th>Average</th><th>WR</th><th>NR</th></tr></thead>
                <tbody>
                  {eventOrder.map(eid => {
                    const pr = data.personal_records?.[eid]; if (!pr) return null;
                    const ev = EVENTS.find(e => e.id === eid);
                    return (
                      <tr key={eid}>
                        <td style={{ fontWeight: 500 }}>{ev?.name || eid}</td>
                        <td className="mono" style={{ color: 'var(--accent)' }}>{fmtWcaTime(pr.single?.best)}</td>
                        <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{pr.single?.world_rank || '—'}</td>
                        <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{pr.single?.national_rank || '—'}</td>
                        <td className="mono" style={{ color: 'var(--violet)' }}>{fmtWcaTime(pr.average?.best)}</td>
                        <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{pr.average?.world_rank || '—'}</td>
                        <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{pr.average?.national_rank || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {!data && !loading && <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 60, fontSize: 14 }}>Enter a WCA ID above to load your profile.</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROGRESS PAGE
// ─────────────────────────────────────────────────────────────
function ProgressPage({ user, solves }) {
  const [eventId, setEventId] = useState('333');
  const [sessionName, setSessionName] = useState('Session 1');
  const [range, setRange] = useState(50);

  const sessions = Object.keys(solves[eventId] || {});
  const eventSolves = solves[eventId]?.[sessionName] || [];

  const chartData = useMemo(() => {
    const recent = eventSolves.slice(-range);
    return recent.map((s, i) => {
      const idx = eventSolves.length - recent.length + i;
      const t = effectiveMs(s);
      const a5 = calcAoN(eventSolves.slice(0, idx + 1), 5);
      const a12 = calcAoN(eventSolves.slice(0, idx + 1), 12);
      return { n: idx + 1, single: isFinite(t) ? +(t / 1000).toFixed(3) : null, ao5: a5 && isFinite(a5) ? +(a5 / 1000).toFixed(3) : null, ao12: a12 && isFinite(a12) ? +(a12 / 1000).toFixed(3) : null };
    }).filter(d => d.single !== null);
  }, [eventSolves, range]);

  const pbHistory = useMemo(() => {
    let best = Infinity, pbs = [];
    eventSolves.forEach((s, i) => { const t = effectiveMs(s); if (isFinite(t) && t < best) { best = t; pbs.push({ n: i + 1, time: +(t / 1000).toFixed(3) }); } });
    return pbs;
  }, [eventSolves]);

  const tt = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontFamily: 'DM Mono', fontSize: 12 };

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <div className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 16 }}>Progress</div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={eventId} onChange={e => setEventId(e.target.value)} style={{ maxWidth: 180, fontSize: 13 }}>
          {EVENTS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={sessionName} onChange={e => setSessionName(e.target.value)} style={{ maxWidth: 160, fontSize: 13 }}>
          {(sessions.length ? sessions : ['Session 1']).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {[25, 50, 100, 200].map(r => (
          <button key={r} className="btn btn-ghost btn-sm" style={{ color: range === r ? 'var(--accent)' : 'var(--muted)' }} onClick={() => setRange(r)}>Last {r}</button>
        ))}
      </div>
      {chartData.length > 1 ? (
        <>
          <div className="card" style={{ padding: '16px 20px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Solve Times — {EVENTS.find(e => e.id === eventId)?.name}</div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={.15} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="n" stroke="var(--muted)" tick={{ fontSize: 10 }} />
                <YAxis stroke="var(--muted)" tick={{ fontSize: 10 }} tickFormatter={v => `${v}s`} />
                <Tooltip contentStyle={tt} formatter={(v, n) => [`${v}s`, n]} />
                <Area type="monotone" dataKey="single" stroke="var(--accent)" strokeWidth={1.5} fill="url(#sg2)" dot={false} name="Single" />
                <Line type="monotone" dataKey="ao5" stroke="var(--violet)" strokeWidth={1.5} dot={false} name="Ao5" />
                <Line type="monotone" dataKey="ao12" stroke="var(--orange)" strokeWidth={1.5} dot={false} name="Ao12" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {pbHistory.length > 1 && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>PB Progression</div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={pbHistory} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="n" stroke="var(--muted)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="var(--muted)" tick={{ fontSize: 10 }} tickFormatter={v => `${v}s`} />
                  <Tooltip contentStyle={tt} formatter={v => [`${v}s`, 'PB']} />
                  <Line type="stepAfter" dataKey="time" stroke="var(--yellow)" strokeWidth={2} dot={{ fill: 'var(--yellow)', r: 3 }} name="PB" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 60, fontSize: 14 }}>Not enough solves yet — go set some times in the Timer.</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AI COACH
// ─────────────────────────────────────────────────────────────
function CoachPage({ user, solves }) {
  const [msgs, setMsgs] = useState([
    { role: 'ai', content: `Welcome, ${user.username}. I'm your cubing coach. I have access to your solve data, split averages, parity rates, and WCA profile. What do you want to work on?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState('333');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  function buildCtx() {
    const all = Object.values(solves[eventId] || {}).flat();
    const best = bestSingle(all);
    const ao5 = calcAoN(all, 5); const ao12 = calcAoN(all, 12);
    const dnfRate = all.length ? (all.filter(s => s.dnf).length / all.length * 100).toFixed(1) + '%' : 'N/A';
    const plus2Rate = all.length ? (all.filter(s => s.plus2).length / all.length * 100).toFixed(1) + '%' : 'N/A';
    const parityFreq = {};
    all.forEach(s => Object.entries(s.parities || {}).forEach(([p, v]) => { if (v) parityFreq[p] = (parityFreq[p] || 0) + 1; }));
    const splitData = all.filter(s => s.splits?.length > 0).slice(-30);
    const avgSplits = {};
    if (splitData.length > 0) {
      const sampleNames = splitData[0]?.splitNames || [];
      sampleNames.forEach((name, i) => {
        const vals = splitData.map(s => s.splits[i] - (i > 0 ? s.splits[i - 1] : 0)).filter(Boolean);
        if (vals.length) avgSplits[name] = fmtMs(vals.reduce((a, b) => a + b, 0) / vals.length);
      });
    }
    return `User: ${user.username} | WCA: ${user.wcaId || 'N/A'}
Event: ${EVENTS.find(e => e.id === eventId)?.name}
Total solves: ${all.length} | Best: ${fmtMs(best)} | Ao5: ${fmtMs(ao5)} | Ao12: ${fmtMs(ao12)}
DNF: ${dnfRate} | +2: ${plus2Rate}
Parity: ${JSON.stringify(parityFreq)}
Avg splits (last 30): ${JSON.stringify(avgSplits)}`;
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput('');
    setMsgs(p => [...p, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          system: 'You are an expert speedcubing coach. Analyze the user\'s data and give specific, actionable advice. Be concise (2-3 paragraphs). Focus on the most impactful improvements.',
          messages: [...msgs.filter(m => m.role === 'user').slice(-6).map(m => ({ role: 'user', content: m.content })),
            { role: 'user', content: `[Data]\n${buildCtx()}\n\n[Question]\n${userMsg}` }]
        })
      });
      const d = await res.json();
      setMsgs(p => [...p, { role: 'ai', content: d.content?.map(c => c.text || '').join('') || 'No response.' }]);
    } catch { setMsgs(p => [...p, { role: 'ai', content: 'Error connecting. Please try again.' }]); }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 20px', gap: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="display" style={{ fontWeight: 800, fontSize: 22 }}>AI Coach</div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Event:</span>
          <select value={eventId} onChange={e => setEventId(e.target.value)} style={{ fontSize: 12, padding: '5px 9px', width: 'auto' }}>
            {EVENTS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.role === 'user' ? 'var(--accent)' : 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, color: m.role === 'user' ? '#fff' : 'var(--text2)' }}>
              {m.role === 'user' ? 'U' : 'AI'}
            </div>
            <div className={`chat-bubble chat-${m.role}`} style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>AI</div>
            <div className="chat-bubble chat-ai" style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              <span className="spinner" style={{ width: 13, height: 13 }} /> Analyzing...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['What should I work on?', 'Analyze my splits', 'How do I improve F2L?', 'Parity analysis', 'Give me drill ideas'].map(p => (
          <button key={p} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setInput(p)}>{p}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your coach anything..."
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} />
        <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>Send</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
function Dashboard({ user, solves, setPage }) {
  const [wcaData, setWcaData] = useState(null);
  const [wcaLoading, setWcaLoading] = useState(false);

  useEffect(() => {
    if (!user.wcaId) return;
    setWcaLoading(true);
    fetch(`${WCA_API}/persons/${user.wcaId}`)
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setWcaData(d); setWcaLoading(false); }).catch(() => setWcaLoading(false));
  }, [user.wcaId]);

  const recentSolves = useMemo(() => {
    const all = [];
    Object.entries(solves).forEach(([eid, sess]) => Object.entries(sess).forEach(([sn, arr]) => arr.forEach(s => all.push({ ...s, eventId: eid, sessionName: sn }))));
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  }, [solves]);

  const totalSolves = Object.values(solves).reduce((s, sess) => s + Object.values(sess).reduce((s2, a) => s2 + a.length, 0), 0);
  const eventCount = Object.keys(solves).filter(k => Object.values(solves[k]).flat().length > 0).length;

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <div className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Welcome back, {user.username}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: '15px 19px' }}>
          <div className="stat-label">Total Solves</div>
          <div className="stat-value cur" style={{ fontSize: 26 }}>{totalSolves}</div>
        </div>
        <div className="card" style={{ padding: '15px 19px' }}>
          <div className="stat-label">Events Practiced</div>
          <div className="stat-value" style={{ fontSize: 26 }}>{eventCount}</div>
        </div>
        <div className="card" style={{ padding: '15px 19px', cursor: 'pointer' }} onClick={() => setPage('profile')}>
          <div className="stat-label">WCA Profile</div>
          {user.wcaId
            ? <div className="mono" style={{ fontSize: 14, color: 'var(--accent)', marginTop: 4 }}>{user.wcaId}</div>
            : <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Not linked — click to add</div>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Recent Solves</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('timer')}>Timer</button>
          </div>
          {recentSolves.length > 0 ? recentSolves.map((s, i) => {
            const ev = EVENTS.find(e => e.id === s.eventId);
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span className="mono" style={{ fontSize: 10, background: 'var(--surface2)', padding: '2px 5px', borderRadius: 4, fontWeight: 600 }}>{ev?.short || s.eventId}</span>
                  <span className="mono" style={{ fontSize: 13, color: s.dnf ? 'var(--red)' : s.plus2 ? 'var(--orange)' : 'var(--text)' }}>{fmtMs(effectiveMs(s))}{s.plus2 && !s.dnf ? ' +2' : ''}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(s.timestamp).toLocaleDateString()}</span>
              </div>
            );
          }) : (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No solves yet — head to the timer!</div>
          )}
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>WCA Highlights</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('profile')}>Full Profile</button>
          </div>
          {wcaLoading && <div style={{ padding: 22, display: 'flex', justifyContent: 'center' }}><span className="spinner" style={{ width: 20, height: 20 }} /></div>}
          {!user.wcaId && !wcaLoading && <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Link your WCA ID in the Profile tab.</div>}
          {wcaData && !wcaLoading && Object.entries(wcaData.personal_records || {}).slice(0, 7).map(([eid, pr]) => {
            const ev = EVENTS.find(e => e.id === eid);
            return (
              <div key={eid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{ev?.name || eid}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Single</div>
                    <div className="mono" style={{ fontSize: 13, color: 'var(--accent)' }}>{fmtWcaTime(pr.single?.best)}</div>
                  </div>
                  {pr.average?.best && <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Avg</div>
                    <div className="mono" style={{ fontSize: 13, color: 'var(--violet)' }}>{fmtWcaTime(pr.average.best)}</div>
                  </div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useState('loading');
  const [authTab, setAuthTab] = useState('login');
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [solves, setSolves] = useState({});

  useEffect(() => {
    (async () => {
      const savedUsername = await DB.get('currentUser');
      if (savedUsername) {
        const userData = await DB.get(`user:${savedUsername.toLowerCase()}`);
        if (userData) { await loginUser(userData, false); return; }
      }
      setAppState('landing');
    })();
  }, []);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : '';
  }, [theme]);

  async function loginUser(userData, save = true) {
    if (save) await DB.set('currentUser', userData.username);
    // Load all solves for all events
    const keys = await DB.list(`solves:${userData.username}:`);
    const loaded = {};
    for (const key of keys) {
      const parts = key.split(':');
      if (parts.length < 3) continue;
      const eid = parts[2];
      const data = await DB.get(key);
      if (data) loaded[eid] = data;
    }
    setSolves(loaded);
    setUser(userData);
    setAppState('app');
  }

  async function logout() {
    await DB.del('currentUser');
    setUser(null); setSolves({}); setPage('dashboard'); setAppState('landing');
  }

  if (appState === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>;
  }
  if (appState === 'landing') return <Landing onSignIn={() => { setAuthTab('login'); setAppState('auth'); }} onRegister={() => { setAuthTab('register'); setAppState('auth'); }} />;
  if (appState === 'auth') return <AuthModal defaultTab={authTab} onLogin={loginUser} onBack={() => setAppState('landing')} />;

  const isTimerPage = page === 'timer';
  const isFmc = isTimerPage; // FMC handled inside TimerPage by eventId

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <Sidebar page={page} setPage={setPage} user={user} theme={theme} setTheme={setTheme} onLogout={logout} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {page === 'dashboard' && <Dashboard user={user} solves={solves} setPage={setPage} />}
        {page === 'timer' && <TimerWithFmc user={user} solves={solves} setSolves={setSolves} />}
        {page === 'profile' && <ProfilePage user={user} />}
        {page === 'progress' && <ProgressPage user={user} solves={solves} />}
        {page === 'coach' && <CoachPage user={user} solves={solves} />}
      </div>
    </div>
  );
}

// Wrapper that routes to FMC when eventId is 333fm
function TimerWithFmc({ user, solves, setSolves }) {
  const [eventId, setEventId] = useState('333');

  if (eventId === '333fm') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 5, flexWrap: 'wrap', background: 'var(--surface)' }}>
          {EVENTS.map(e => (
            <button key={e.id} className={`event-btn${eventId === e.id ? ' active' : ''}`} onClick={() => setEventId(e.id)}>{e.short}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <FmcPage user={user} solves={solves} setSolves={setSolves} />
        </div>
      </div>
    );
  }

  return <TimerPage user={user} solves={solves} setSolves={setSolves} eventId_={eventId} setEventId_={setEventId} />;
}
