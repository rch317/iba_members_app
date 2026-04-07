const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    firstName:       { type: String, required: true, trim: true },
    lastName:        { type: String, required: true, trim: true },
    addressLine1:    { type: String, trim: true },
    addressLine2:    { type: String, trim: true },
    city:            { type: String, trim: true },
    state:           { type: String, trim: true },
    postalZip:       { type: String, trim: true },
    primaryPhone:    { type: String, trim: true },
    secondaryPhone:  { type: String, trim: true },
    tertiaryPhone:   { type: String, trim: true },
    emailAddress:    { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    satelliteHome:   { type: String, trim: true },
    recurringMember: { type: Boolean, default: false },
    renewalDate:     { type: Date },
    membership_list: { type: Boolean, default: false },
    mailing_list:    { type: Boolean, default: false },
    email_news:      { type: Boolean, default: false },
    hide_email:      { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'iba_members' }
);

module.exports = mongoose.model('Member', memberSchema);
