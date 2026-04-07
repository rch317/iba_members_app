const express = require('express');
const router = express.Router();
const {
  searchMembers,
  listMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getStats,
} = require('../../controllers/memberController');

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/search', wrap(searchMembers));
router.get('/stats', wrap(getStats));
router.get('/', wrap(listMembers));
router.get('/:id', wrap(getMember));
router.post('/', wrap(createMember));
router.patch('/:id', wrap(updateMember));
router.delete('/:id', wrap(deleteMember));

// Centralised error handler for this router
router.use((err, req, res, _next) => {
  const status = err.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({ error: err.message });
});

module.exports = router;
