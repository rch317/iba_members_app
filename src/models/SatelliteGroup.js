const mongoose = require('mongoose');

const satelliteGroupSchema = new mongoose.Schema(
  {
    satelliteID:      { type: String, required: true, trim: true },
    groupName:        { type: String, trim: true },
    notes:            { type: String, trim: true },
    addressLine1:     { type: String, trim: true },
    addressLine2:     { type: String, trim: true },
    city:             { type: String, trim: true },
    state:            { type: String, trim: true },
    postalZip:        { type: String, trim: true },
    primaryContact:   { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    secondaryContact: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    tertiaryContact:  { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  },
  { timestamps: true, collection: 'iba_satellite_groups' }
);

module.exports = mongoose.model('SatelliteGroup', satelliteGroupSchema);
