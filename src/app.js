const express    = require('express');
const path       = require('path');
const session    = require('express-session');
const { MongoStore } = require('connect-mongo');
const mongoose   = require('mongoose');
const passport   = require('./config/passport');
const { requireAuth } = require('./middleware/requireAuth');
const membersRouter         = require('./routes/api/members');
const satelliteGroupsRouter = require('./routes/api/satelliteGroups');
const adminRouter           = require('./routes/admin/dashboard');
const authRouter            = require('./routes/auth');

const app = express();

app.use(express.json());

// Sessions — stored in MongoDB so they survive restarts
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://db:27017/membership',
    collectionName: 'iba_sessions',
    ttl: 60 * 60 * 24 * 7, // 7 days
  }),
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
}));

app.use(passport.initialize());
app.use(passport.session());

// Auth routes (must be before requireAuth)
app.use('/auth', authRouter);

// Login page
app.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Public roster page
app.get('/roster', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/roster.html'));
});

// Apply auth to everything below this line
app.use(requireAuth);

// Static files — served after auth so /admin/* requires login
// (login.html, auth routes, and health are whitelisted in requireAuth)
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const db = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown';
  const ok = dbState === 1;

  // Build a safe connection string — strip credentials before exposing
  const rawUri = process.env.MONGO_URI || 'mongodb://db:27017/membership';
  let dbHost = rawUri;
  try {
    const u = new URL(rawUri);
    u.password = '';
    u.username = '';
    dbHost = u.toString();
  } catch (_) { /* not a valid URL, show as-is */ }

  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    db,
    dbHost,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/members', membersRouter);
app.use('/api/satellite-groups', satelliteGroupsRouter);

// Admin dashboard
app.use('/admin', adminRouter);

module.exports = app;
