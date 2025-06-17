const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const apiKeyAuth = require('../middleware/apiKeyAuthAndLogger');
const { mergeFiles,convertFile } = require('../utils/fileUtils');
const fs = require('fs-extra');

// /api/merge?outputFormat=pdf
router.post('/merge', apiKeyAuth, upload.array('files', 2), async (req, res) => {
  try {
    console.log('🔧 /merge called');
    console.log('🧾 Files received:', req.files.map(f => f.originalname));
    if (!req.files || req.files.length !== 2) {
      return res.status(400).json({ error: 'Exactly 2 files required for /merge' });
    }
   

    const outputFormat = req.query.outputFormat || 'pdf';
     if (outputFormat !== 'pdf') {
  return res.status(400).json({ error: 'Only PDF output is supported for merging' });
}
    const fileObj = await mergeFiles(req.files, outputFormat); // returns { path, name, mimeType }

    res.setHeader('Content-Type', fileObj.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileObj.name}"`);
    res.sendFile(fileObj.path, {}, (err) => {
      if (err) {
        console.error('Send error:', err);
        res.status(500).json({ error: 'Failed to send file' });
      } else {
        fs.unlink(fileObj.path).catch(() => {}); // Clean up temp file
      }
    });
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
    if (outputFormat !== 'pdf') {
  return res.status(400).json({ error: 'Only PDF output is supported for merging' });
}
    const fileObj = await mergeFiles(req.files, outputFormat);

    res.setHeader('Content-Type', fileObj.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileObj.name}"`);
    res.sendFile(fileObj.path, {}, (err) => {
      if (err) {
        console.error('Send error:', err);
        res.status(500).json({ error: 'Failed to send file' });
      } else {
        fs.unlink(fileObj.path).catch(() => {}); // Clean up temp file
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Bulk merge failed', message: err.message });
  }
});


router.post('/convert', apiKeyAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'A single file is required for conversion' });
    }
 
    const outputFormat = req.query.outputFormat || 'pdf';
    if (outputFormat !== 'pdf') {
  return res.status(400).json({ error: 'Only PDF output is supported for Conversion' });
}
    const fileObj = await convertFile(req.file, outputFormat);

    res.setHeader('Content-Type', fileObj.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileObj.name}"`);
    res.sendFile(fileObj.path, {}, (err) => {
      if (err) {
        console.error('Send error:', err);
        res.status(500).json({ error: 'Failed to send converted file' });
      } else {
        fs.unlink(fileObj.path).catch(() => {}); // Cleanup
      }
    });
  }
catch (err) {
    throw new Error(`Conversion to ${outputFormat} failed: ${err.message}`);
  }
});

module.exports = router;
