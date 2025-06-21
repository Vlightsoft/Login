const multer = require('multer');
const path = require('path');

// In-memory storage (no files saved to disk)
const storage = multer.memoryStorage();


// Accept only specific file types
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.odt', '.rtf','.jpg','.jpeg','.png','.webp','.bmp','.tif','.tiff','.pbm','.pgm','.ppm','.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  console.log("test");
console.log(ext);
  if (allowed.includes(ext)) {
    cb(null, true); // Accept
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname)); // Reject with Multer error
  }
};

// Export upload instance with limits
const upload = multer({
  storage,
  fileFilter,
  limits: { files: 10 }, // Accept up to 10 files
});

module.exports = upload;
