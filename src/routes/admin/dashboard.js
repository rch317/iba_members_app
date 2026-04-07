const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../public/admin/index.html'));
});

router.get('/satellite-groups', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../public/admin/satellite-groups.html'));
});

router.get('/mailing-active', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../public/admin/mailing-active.html'));
});

module.exports = router;
