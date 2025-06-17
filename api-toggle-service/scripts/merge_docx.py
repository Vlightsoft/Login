const { PDFDocument } = require('pdf-lib');
const libre = require('libreoffice-convert');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { DocxMerger } = require('easy-docx');

function getMimeType(ext) {
  const map = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.rtf': 'application/rtf',
    '.txt': 'text/plain'
  };
  return map[ext] || 'application/octet-stream';
}

async function convertToPdf(buffer) {
  return await libre.convert(buffer, '.pdf');
}

async function mergeDocxFiles(files) {
  const buffers = files.map(f => f.buffer);
  const merger = new DocxMerger({}, buffers);
  const mergedBuffer = await merger.save('nodebuffer');

  const filename = `merged-${uuidv4()}.docx`;
  const filePath = path.join(os.tmpdir(), filename);
  await fs.writeFile(filePath, mergedBuffer);

  return {
    path: filePath,
    name: filename,
    mimeType: getMimeType('.docx')
  };
}

exports.mergeFiles = async (files, outputFormat = 'pdf') => {
  const format = outputFormat.toLowerCase().replace(/^\./, '');
  const allDocx = files.every(file => path.extname(file.originalname).toLowerCase() === '.docx');

  if (allDocx && (format === 'docx' || format === 'pdf')) {
    if (format === 'docx') return await mergeDocxFiles(files);
    // else fallthrough to PDF merging
  }

  const pdfs = [];
  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    let pdfBuffer;
    if (ext === '.pdf') {
      pdfBuffer = file.buffer;
    } else {
      pdfBuffer = await convertToPdf(file.buffer);
    }
    pdfs.push(pdfBuffer);
  }

  const mergedPdf = await PDFDocument.create();
  for (const pdf of pdfs) {
    const doc = await PDFDocument.load(pdf);
    const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }

  const mergedBuffer = await mergedPdf.save();

  const filename = `merged-${uuidv4()}.pdf`;
  const filePath = path.join(os.tmpdir(), filename);
  await fs.writeFile(filePath, mergedBuffer);

  return {
    path: filePath,
    name: filename,
    mimeType: getMimeType('.pdf')
  };
};
