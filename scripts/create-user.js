/**
 * Bootstrap a new authorized user.
 *
 * Usage:
 *   node scripts/create-user.js <email> [displayName]
 *
 * Example:
 *   node scripts/create-user.js rob@example.com "Rob Ho"
 *
 * The user can then sign in via Google OAuth using that email address.
 * Optionally pass --api-key to generate an API key for programmatic access.
 */
'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../src/models/User');

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node scripts/create-user.js <email> [displayName] [--api-key]');
  process.exit(1);
}

const generateApiKey = args.includes('--api-key');
const positional     = args.filter(a => !a.startsWith('--'));
const email          = positional[0].toLowerCase().trim();
const displayName    = positional[1] || '';

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://db:27017/membership');

  let user = await User.findOne({ email });

  if (user) {
    console.log(`User already exists: ${user.email} (${user.displayName || 'no display name'})`);
  } else {
    user = new User({ email, displayName, active: true });
    await user.save();
    console.log(`Created user: ${user.email}`);
  }

  if (generateApiKey) {
    const key = await user.generateApiKey();
    console.log(`API key: ${key}`);
    console.log('Include this in requests as:  X-API-Key: <key>');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
