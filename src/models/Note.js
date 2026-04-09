const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    text:   { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: 'iba_notes' }
);

module.exports = mongoose.model('Note', noteSchema);
