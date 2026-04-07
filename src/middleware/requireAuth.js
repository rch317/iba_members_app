'use strict';
const User = require('../models/User');

/**
 * PUBLIC_ROUTES — requests matching any of these prefixes skip authentication.
 * Add any route prefix here to make it publicly accessible.
 */
const PUBLIC_ROUTES = [
  '/health',
  '/login',
  '/auth',           // /auth/google, /auth/google/callback, /auth/logout
];

/**
 * requireAuth middleware
 *
 * Allows access if:
 *   1. The route is in PUBLIC_ROUTES
 *   2. A valid X-API-Key header is present (programmatic access)
 *   3. The user has an active session (browser login via Google OAuth)
 *
 * API requests (/api/*) get a 401 JSON response when unauthorized.
 * Browser requests get redirected to /login.
 */
async function requireAuth(req, res, next) {
  // 1. Public whitelist
  if (PUBLIC_ROUTES.some(prefix => req.path === prefix || req.path.startsWith(prefix + '/'))) {
    return next();
  }

  // 2. API key (X-API-Key header)
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    const user = await User.findOne({ apiKey, active: true });
    if (user) {
      req.user = user;
      return next();
    }
    return res.status(401).json({ error: 'Invalid or inactive API key' });
  }

  // 3. Session (Google OAuth)
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Unauthorized — return JSON for API routes, redirect for browser routes
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized — provide X-API-Key header or log in' });
  }

  res.redirect('/login');
}

module.exports = { requireAuth, PUBLIC_ROUTES };
