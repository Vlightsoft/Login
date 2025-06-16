const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const apiKeyAuth = require('../middleware/apiKeyAuthAndLogger');
const { mergeFiles } = require('../utils/fileUtils');

// /api/merge?outputFormat=pdf
router.post('/merge', apiKeyAuth, upload.array('files', 2), async (req, res) => {
  try {
    console.log('🔧 /merge called');
  console.log('🧾 Files received:', req.files.map(f => f.originalname));
    if (!req.files || req.files.length !== 2) {
      return res.status(400).json({ error: 'Exactly 2 files required for /merge' });
    }

    const outputFormat = req.query.outputFormat || 'pdf';
    const merged = await mergeFiles(req.files, outputFormat);

    res.setHeader('Content-Disposition', `attachment; filename=merged.${outputFormat}`);
    res.end(merged);
  } catch (err) {
    res.status(500).json({ error: 'Merge failed', message: err.message });
  }
});

// /api/bulk-merge?outputFormat=pdf
router.post('/bulk-merge', apiKeyAuth, upload.array('files', 10), async (req, res) => {
  try {
    if (req.files.length < 2 || req.files.length > 10) {
      return res.status(400).json({ error: 'Provide between 2 to 10 files for bulk merge' });
    }

    const outputFormat = req.query.outputFormat || 'pdf';
    const merged = await mergeFiles(req.files, outputFormat);

    res.setHeader('Content-Disposition', `attachment; filename=bulk-merged.${outputFormat}`);
    res.end(merged);
  } catch (err) {
    res.status(500).json({ error: 'Bulk merge failed', message: err.message });
  }
});

module.exports = router;
