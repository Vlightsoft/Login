const express = require('express');
const router = express.Router();
const apiKeyAuthAndLogger = require('../middleware/apiKeyAuthAndLogger');

router.get('/datetime', apiKeyAuthAndLogger, (req, res) => {
  res.json({ currentTime: new Date().toISOString() });
});

module.exports = router;
