const express = require('express');
const path = require('path');
const membersRouter = require('./routes/api/members');
const satelliteGroupsRouter = require('./routes/api/satelliteGroups');
const adminRouter = require('./routes/admin/dashboard');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/members', membersRouter);
app.use('/api/satellite-groups', satelliteGroupsRouter);

// Admin dashboard
app.use('/admin', adminRouter);

module.exports = app;
