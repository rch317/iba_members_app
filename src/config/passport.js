'use strict';
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;

      // Only allow users already in the DB (admin must add them first)
      const user = await User.findOne({ googleId: profile.id, active: true })
        || await User.findOne({ email, active: true });

      if (!user) {
        return done(null, false, { message: `Access denied: ${email} is not an authorized user.` });
      }

      // Sync googleId if user was added by email before first login
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }

      user.displayName = profile.displayName || user.displayName;
      await user.save();

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
} else {
  console.warn('[passport] GOOGLE_CLIENT_ID/SECRET not set — Google OAuth disabled. Set these in .env to enable sign-in.');
}

passport.serializeUser((user, done) => done(null, user._id.toString()));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
