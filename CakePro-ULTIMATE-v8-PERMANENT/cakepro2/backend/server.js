// ============================================================
// server.js — CakePro Ultimate v5 FINAL
// ============================================================
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const session  = require('express-session');
const path     = require('path');
const fs       = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Uploads folder (permanent image storage) ──────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── CORS — allow everything for local dev ────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin',      origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods',     'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',     'Content-Type,Authorization,X-Admin-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Serve uploaded images with CORS headers ──────────────────
// This makes http://localhost:5000/uploads/cake-xxx.jpg work
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(uploadDir));

// ── Session ───────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'cakepro_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ── MongoDB ───────────────────────────────────────────────────
const MONGO_URI = 'mongodb://127.0.0.1:27017/cakepro';

function connectDB() {
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS:         10000,
    socketTimeoutMS:          45000,
  })
  .then(() => console.log('✅  MongoDB connected! → cakepro database ready'))
  .catch(err => {
    console.error('❌  MongoDB FAILED:', err.message);
    console.log('   Run INSTALL-MONGODB-SERVICE.bat as Administrator');
    console.log('   Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  });
}

mongoose.connection.on('disconnected', () => {
  console.log('⚠️   MongoDB disconnected. Retrying...');
  setTimeout(connectDB, 3000);
});

connectDB();

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/cakes',      require('./routes/cakes'));
app.use('/api/customers',  require('./routes/customers'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/analytics',  require('./routes/analytics'));
app.use('/api/export',     require('./routes/export'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  const s = mongoose.connection.readyState;
  const states = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' };
  res.json({
    ok:      s === 1,
    mongodb: states[s],
    uploads: uploadDir,
    files:   fs.readdirSync(uploadDir).length + ' files',
    time:    new Date()
  });
});

// ── Test image route — proves image serving works ─────────────
app.get('/api/test-image/:filename', (req, res) => {
  const file = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(file)) {
    res.json({ exists: true, path: file, url: `http://localhost:${PORT}/uploads/${req.params.filename}` });
  } else {
    res.json({ exists: false, uploadDir, files: fs.readdirSync(uploadDir) });
  }
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log(`║  🎂  CakePro Ultimate                    ║`);
  console.log(`║  🌐  http://localhost:${PORT}               ║`);
  console.log(`║  📁  Uploads: ${uploadDir.slice(-25)}  ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`📦  ${fs.readdirSync(uploadDir).length} image(s) in uploads folder`);
  console.log('');
});
