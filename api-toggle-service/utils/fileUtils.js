const { PDFDocument } = require('pdf-lib');
const libre = require('libreoffice-convert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const tmp = require('tmp-promise');

function getMimeType(ext) {
  return {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }[ext] || 'application/octet-stream';
}

async function convertToPdf(buffer) {
  return await libre.convert(buffer, '.pdf');
}

exports.mergeFiles = async (files, outputFormat = 'pdf') => {
  const format = outputFormat.toLowerCase().replace(/^\./, '');

  if (format === 'pdf') {
    const pdfs = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      let pdfBuffer = ext === '.pdf' ? file.buffer : await convertToPdf(file.buffer);
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
  }

  if (format === 'docx') {
    const tmpDir = await tmp.dir();
    const inputPaths = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const tmpPath = path.join(tmpDir.path, `${uuidv4()}${ext}`);
      await fs.writeFile(tmpPath, file.buffer);
      inputPaths.push(tmpPath);
    }

    const outputPath = path.join(os.tmpdir(), `merged-${uuidv4()}.docx`);

    await new Promise((resolve, reject) => {
      const scriptPath = path.resolve('scripts/merge_docx.py');
      const proc = spawn('python3', [scriptPath, ...inputPaths, outputPath]);

      proc.stderr.on('data', data => console.error('PY STDERR:', data.toString()));
      proc.on('error', reject);
      proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Python exited ${code}`)));
    });

    return {
      path: outputPath,
      name: path.basename(outputPath),
      mimeType: getMimeType('.docx')
    };
  }

  throw new Error(`❌ Unsupported output format: ${outputFormat}`);
};
