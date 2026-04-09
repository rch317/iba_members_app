const express = require('express');
const router = express.Router({ mergeParams: true });
const { listNotes, createNote, deleteNote } = require('../../controllers/noteController');

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', wrap(listNotes));
router.post('/', wrap(createNote));
router.delete('/:noteId', wrap(deleteNote));

router.use((err, req, res, _next) => {
  const status = err.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({ error: err.message });
});

module.exports = router;
