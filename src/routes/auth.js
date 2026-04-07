'use strict';
const express  = require('express');
const passport = require('../config/passport');
const router   = express.Router();

// Kick off Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google redirects back here
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=access_denied' }),
  (req, res) => res.redirect('/admin')
);

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => res.redirect('/login'));
  });
});

// Current user info (useful for API consumers)
router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { _id, email, displayName, apiKey } = req.user;
  res.json({ _id, email, displayName, hasApiKey: !!apiKey });
});

module.exports = router;
