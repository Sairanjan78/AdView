require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const { DatabaseSync } = require("node:sqlite");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET;
const COOKIE = "rl_session";
const POINTS_PER_REWARD = Math.min(100, Math.max(1, Number(process.env.POINTS_PER_REWARD) || 10));
const AD_UNIT_PATH = process.env.GAM_REWARDED_AD_UNIT_PATH || "";

if (!SECRET || SECRET.length < 32) {
  console.error("Set SESSION_SECRET (32+ chars) in .env");
  process.exit(1);
}

const db = new DatabaseSync(path.join(__dirname, "data.sqlite"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA synchronous = NORMAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hash TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS nonces (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS redemptions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item TEXT NOT NULL,
    points INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const q = (sql) => db.prepare(sql);
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

function runTx(work) {
  db.exec("BEGIN");
  try {
    work();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

const catalog = [
  { id: "badge",   name: "Digital Badge",        points: 10,   description: "A collectible digital badge to show off on your profile." },
  { id: "sticker", name: "Exclusive Sticker Pack", points: 50,   description: "A set of exclusive AdView digital stickers." },
  { id: "voucher", name: "₹50 Voucher Request",    points: 500,  description: "Submit a manual-review voucher request. Not guaranteed cash." }
];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "12kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, _res, next) => {
  req.cookies = {};
  String(req.headers.cookie || "")
    .split(";")
    .forEach((part) => {
      const i = part.indexOf("=");
      if (i > 0) {
        req.cookies[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
      }
    });
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false });
const rewardLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

function setLoginCookie(userId, res) {
  const token = crypto.randomBytes(32).toString("hex");
  q("INSERT INTO sessions VALUES (?, ?, ?)").run(hashToken(token), userId, Date.now() + 7 * 24 * 60 * 60 * 1000);
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function auth(req, res, next) {
  const token = req.cookies[COOKIE];
  const session = token && q("SELECT * FROM sessions WHERE token_hash = ?").get(hashToken(token));
  if (!session || session.expires < Date.now()) {
    return res.status(401).json({ error: "Please sign in again." });
  }
  req.uid = session.user_id;
  req.user = q("SELECT id, email, points FROM users WHERE id = ?").get(req.uid);
  if (!req.user) return res.status(401).json({ error: "Account unavailable" });
  next();
}

app.get("/api/config", (_req, res) => {
  res.json({
    points: POINTS_PER_REWARD,
    adUnitPath: AD_UNIT_PATH,
    demoMode: !AD_UNIT_PATH,
    catalog
  });
});

app.post("/api/register", authLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128) {
    return res.status(400).json({ error: "Enter a valid email and password (10–128 characters)." });
  }
  try {
    const result = q("INSERT INTO users (email, hash) VALUES (?, ?)").run(email, await bcrypt.hash(password, 12));
    setLoginCookie(result.lastInsertRowid, res);
    res.json({ ok: true });
  } catch {
    res.status(409).json({ error: "Email already registered." });
  }
});

app.post("/api/login", authLimiter, async (req, res) => {
  const user = q("SELECT * FROM users WHERE email = ?").get(String(req.body.email || "").trim().toLowerCase());
  if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.hash))) {
    return res.status(401).json({ error: "Email or password incorrect." });
  }
  setLoginCookie(user.id, res);
  res.json({ ok: true });
});

app.post("/api/logout", auth, (req, res) => {
  q("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(req.cookies[COOKIE]));
  res.clearCookie(COOKIE, {
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
  res.json({ ok: true });
});

app.get("/api/me", auth, (req, res) => {
  res.json({
    user: req.user,
    rewards: q("SELECT points, created FROM rewards WHERE user_id = ? ORDER BY created DESC LIMIT 20").all(req.uid),
    redemptions: q("SELECT item, points, status, created FROM redemptions WHERE user_id = ? ORDER BY created DESC LIMIT 20").all(req.uid)
  });
});

app.post("/api/reward/nonce", auth, rewardLimiter, (_req, res) => {
  const id = crypto.randomUUID();
  q("INSERT INTO nonces VALUES (?, ?, ?)").run(id, _req.uid, Date.now() + 10 * 60 * 1000);
  res.json({ nonce: id });
});

app.post("/api/reward/claim", auth, rewardLimiter, (req, res) => {
  const id = String(req.body.nonce || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "Invalid nonce" });
  try {
    runTx(() => {
      const used = q("DELETE FROM nonces WHERE id = ? AND user_id = ? AND expires >= ?").run(id, req.uid, Date.now());
      if (used.changes !== 1) throw new Error("expired");
      q("INSERT INTO rewards (id, user_id, points) VALUES (?, ?, ?)").run(id, req.uid, POINTS_PER_REWARD);
      q("UPDATE users SET points = points + ? WHERE id = ?").run(POINTS_PER_REWARD, req.uid);
    });
    res.json({ ok: true, points: POINTS_PER_REWARD });
  } catch {
    res.status(409).json({ error: "Nonce expired or already used." });
  }
});

app.post("/api/redeem", auth, (req, res) => {
  const item = catalog.find((entry) => entry.id === req.body.item);
  if (!item) return res.status(400).json({ error: "Unknown reward" });
  const id = crypto.randomUUID();
  try {
    runTx(() => {
      const updated = q("UPDATE users SET points = points - ? WHERE id = ? AND points >= ?").run(item.points, req.uid, item.points);
      if (updated.changes !== 1) throw new Error("balance");
      q("INSERT INTO redemptions (id, user_id, item, points) VALUES (?, ?, ?, ?)").run(id, req.uid, item.name, item.points);
    });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Insufficient points." });
  }
});

app.get("/health", (_req, res) => {
  const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  const rewardCount = db.prepare("SELECT COUNT(*) AS n FROM rewards").get().n;
  res.json({ status: "ok", users: userCount, rewards: rewardCount, uptime: process.uptime() });
});

// Periodic cleanup of expired sessions and nonces (runs every hour)
setInterval(() => {
  const now = Date.now();
  const delSessions = db.prepare("DELETE FROM sessions WHERE expires < ?").run(now);
  const delNonces   = db.prepare("DELETE FROM nonces WHERE expires < ?").run(now);
  if (delSessions.changes || delNonces.changes) {
    console.log(`[cleanup] Removed ${delSessions.changes} expired sessions, ${delNonces.changes} expired nonces`);
  }
}, 60 * 60 * 1000);

// Run cleanup once at startup
(() => {
  const now = Date.now();
  db.prepare("DELETE FROM sessions WHERE expires < ?").run(now);
  db.prepare("DELETE FROM nonces WHERE expires < ?").run(now);
})();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AdView listening on http://localhost:${PORT}`);
});
