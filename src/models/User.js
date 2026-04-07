'use strict';
const mongoose = require('mongoose');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema({
  googleId:    { type: String, unique: true, sparse: true },
  email:       { type: String, required: true, unique: true },
  displayName: { type: String, default: '' },
  apiKey:      { type: String, unique: true, sparse: true },
  active:      { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
}, { collection: 'iba_users' });

// Generate a secure API key for this user
userSchema.methods.generateApiKey = async function () {
  this.apiKey = crypto.randomBytes(32).toString('hex');
  await this.save();
  return this.apiKey;
};

module.exports = mongoose.model('User', userSchema);
