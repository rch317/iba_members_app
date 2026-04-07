const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const membersRouter = require('./routes/api/members');
const satelliteGroupsRouter = require('./routes/api/satelliteGroups');
const adminRouter = require('./routes/admin/dashboard');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const db = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown';
  const ok = dbState === 1;
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    db,
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
