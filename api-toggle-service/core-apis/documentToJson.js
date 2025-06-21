const express = require('express');
const router = express.Router();
const multer = require('../middleware/upload'); // existing multer setup
const apiKeyAuth = require('../middleware/apiKeyAuthAndLogger');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

// 🔍 Dynamic field extraction logic
const extractFields = (text) => {
  const result = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const joined = lines.join('\n');

  const findLineValue = (keywords) => {
    for (const line of lines) {
      for (const keyword of keywords) {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          const val = line.split(/[:\-]+/)[1];
          if (val) return val.trim();
        }
      }
    }
    return null;
  };

  result.from = findLineValue(['from', 'billed by', 'seller', 'vendor']);
  result.to = findLineValue(['to', 'billed to', 'customer', 'buyer']);
  result.email = joined.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0];
  result.phone = joined.match(/(?:\+\d{1,3}[- ]?)?\d{10}/)?.[0];
  result.invoiceNumber = findLineValue(['invoice no', 'invoice #', 'inv number']);
  result.invoiceDate = findLineValue(['date', 'invoice date', 'bill date', 'issued on']);

  const totalMatch = joined.match(/(total|grand total|amount paid|amount due)[^\d]{0,10}([\d,]+\.?\d{0,2})/i);
  result.totalAmount = totalMatch ? parseFloat(totalMatch[2]?.replace(/,/g, '')) : 0;

  result.items = [];
  for (const line of lines) {
    const itemMatch = line.match(/^([a-zA-Z0-9 \-_,.]+?)\s+(\d+)\s+([\d.]+)$/);
    if (itemMatch) {
      result.items.push({
        description: itemMatch[1].trim(),
        quantity: parseInt(itemMatch[2]),
        unitPrice: parseFloat(itemMatch[3]),
        total: parseInt(itemMatch[2]) * parseFloat(itemMatch[3])
      });
    }
  }

  return result;
};

// 📥 POST /api/document-to-json
router.post('/document-to-json', apiKeyAuth, multer.single('file'), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const mime = req.file.mimetype;

    let rawText = '';

    if (mime === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      rawText = pdfData.text;
    } else {
      const ocr = await Tesseract.recognize(buffer, 'eng'); // Only English OCR
      rawText = ocr.data.text;
    }

    const parsed = extractFields(rawText);

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('❌ Document parse failed:', err.message);
    res.status(500).json({ success: false, message: 'Failed to extract document data', error: err.message });
  }
});

module.exports = router;
