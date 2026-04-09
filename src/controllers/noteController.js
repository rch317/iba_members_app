const Note = require('../models/Note');
const Member = require('../models/Member');

// GET /api/members/:memberId/notes
async function listNotes(req, res) {
  const notes = await Note.find({ member: req.params.memberId })
    .sort({ createdAt: -1 });
  res.json({ total: notes.length, notes });
}

// POST /api/members/:memberId/notes
async function createNote(req, res) {
  const member = await Member.findById(req.params.memberId);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text is required' });

  const note = await Note.create({ member: req.params.memberId, text });
  res.status(201).json(note);
}

// DELETE /api/members/:memberId/notes/:noteId
async function deleteNote(req, res) {
  const note = await Note.findOneAndDelete({
    _id: req.params.noteId,
    member: req.params.memberId,
  });
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json({ message: 'Note deleted' });
}

// POST /api/notes/counts — batch note counts for a list of member IDs
async function noteCounts(req, res) {
  const ids = req.body.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
  const mongoose = require('mongoose');
  const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
  const counts = await Note.aggregate([
    { $match: { member: { $in: objectIds } } },
    { $group: { _id: '$member', count: { $sum: 1 } } },
  ]);
  const map = {};
  counts.forEach(c => { map[c._id.toString()] = c.count; });
  res.json(map);
}

module.exports = { listNotes, createNote, deleteNote, noteCounts };
