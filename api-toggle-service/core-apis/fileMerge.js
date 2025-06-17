const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const apiKeyAuth = require('../middleware/apiKeyAuthAndLogger');
const { mergeFiles } = require('../utils/fileUtils');

const fs = require('fs-extra');

// /api/merge?outputFormat=pdf or docx
router.post('/merge', apiKeyAuth, upload.array('files', 2), async (req, res) => {
  try {
    if (!req.files || req.files.length !== 2)
      return res.status(400).json({ error: 'Exactly 2 files required' });

    const fileObj = await mergeFiles(req.files, req.query.outputFormat || 'pdf');
    res.setHeader('Content-Type', fileObj.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileObj.name}"`);
    res.sendFile(fileObj.path, {}, () => fs.unlink(fileObj.path).catch(() => {}));
  } catch (err) {
    res.status(500).json({ error: 'Merge failed', message: err.message });
  }
});

// /api/bulk-merge?outputFormat=pdf or docx
router.post('/bulk-merge', apiKeyAuth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2 || req.files.length > 10)
      return res.status(400).json({ error: '2–10 files required' });

    const fileObj = await mergeFiles(req.files, req.query.outputFormat || 'pdf');
    res.setHeader('Content-Type', fileObj.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileObj.name}"`);
    res.sendFile(fileObj.path, {}, () => fs.unlink(fileObj.path).catch(() => {}));
  } catch (err) {
    res.status(500).json({ error: 'Bulk merge failed', message: err.message });
  }
});

module.exports = router;
