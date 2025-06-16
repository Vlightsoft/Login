const { PDFDocument } = require('pdf-lib');
const libre = require('libreoffice-convert');
const { file: tmpFile } = require('tmp-promise');

libre.convertAsync = require('util').promisify(libre.convert);

async function convertToPdf(buffer, originalName) {
  const ext = originalName.split('.').pop();
  return await libre.convertAsync(buffer, '.pdf', undefined);
}

exports.mergeFiles = async (files, outputFormat) => {
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

  return await mergedPdf.save();
};
