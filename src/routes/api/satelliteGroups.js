const express = require('express');
const router = express.Router();
const {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} = require('../../controllers/satelliteGroupController');

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/',    wrap(listGroups));
router.get('/:id', wrap(getGroup));
router.post('/',   wrap(createGroup));
router.patch('/:id', wrap(updateGroup));
router.delete('/:id', wrap(deleteGroup));

router.use((err, req, res, _next) => {
  const status = err.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({ error: err.message });
});

module.exports = router;
