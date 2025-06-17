const { PDFDocument } = require('pdf-lib');
const libre = require('libreoffice-convert');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');



libre.convertAsync = promisify(libre.convert);

function getMimeType(ext) {
  const map = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.rtf': 'application/rtf',
    '.txt': 'text/plain'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

async function convertToPdf(buffer, originalName) {
  return await libre.convertAsync(buffer, '.pdf', undefined);
}


exports.convertFile = async (file, outputFormat = 'pdf') => {
  const ext = '.' + outputFormat.toLowerCase();

  try {
    const convertedBuffer = await libre.convertAsync(file.buffer, ext, undefined);
    const filename = `converted-${uuidv4()}${ext}`;
    const filePath = path.join(os.tmpdir(), filename);

    await fs.writeFile(filePath, convertedBuffer);

    return {
      path: filePath,
      name: filename,
      mimeType: getMimeType(ext)
    };
  } catch (err) {
    throw new Error(`Conversion to ${outputFormat} failed: ${err.message}`);
  }
};



exports.mergeFiles = async (files, outputFormat = 'pdf') => {
  const pdfs = [];

  for (const file of files) {
    const ext = file.originalname.split('.').pop().toLowerCase();
    let pdfBuffer;

    if (ext === 'pdf') {
      pdfBuffer = file.buffer;
    } else {
      pdfBuffer = await convertToPdf(file.buffer, file.originalname);
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

  let finalBuffer = mergedBuffer;
  const ext = '.' + outputFormat.toLowerCase();

  if (outputFormat !== 'pdf') {
    try {
      const tempInputPath = path.join(os.tmpdir(), `merge-${uuidv4()}.pdf`);
      await fs.writeFile(tempInputPath, mergedBuffer);

      const inputBuffer = await fs.readFile(tempInputPath);
      finalBuffer = await libre.convertAsync(inputBuffer, ext, undefined); // ✅ safe


      await fs.unlink(tempInputPath).catch(() => {});
    } catch (err) {
      throw new Error(`Failed to convert merged PDF to ${outputFormat}: ${err.message}`);
    }
  }

  const filename = `merged-${uuidv4()}${ext}`;
  const filePath = path.join(os.tmpdir(), filename);
  await fs.writeFile(filePath, finalBuffer);

  return {
    path: filePath,
    name: filename,
    mimeType: getMimeType(ext)
  };
};