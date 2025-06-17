const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const apiKeyAuthAndLogger = require('../middleware/apiKeyAuthAndLogger');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Utility: send processed buffer
const sendImage = async (res, imageSharp, format) => {
  const filename = `${uuidv4()}.${format}`;
  const buffer = await imageSharp.toFormat(format).toBuffer();
  res.set({
    'Content-Type': `image/${format}`,
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(buffer);
};

// /image/process: resize + format + grayscale
router.post('/image/process', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { width, height, format = 'jpeg', grayscale = false } = req.body;
    let image = sharp(req.file.buffer);
    if (width || height) image = image.resize(Number(width) || null, Number(height) || null);
    if (grayscale === 'true') image = image.grayscale();
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/convert
router.post('/image/convert', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { format = 'png' } = req.body;
    await sendImage(res, sharp(req.file.buffer), format);
  } catch (err) {
    next(err);
  }
});

// /image/resize
router.post('/image/resize', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { width, height, format = 'jpeg' } = req.body;
    const image = sharp(req.file.buffer).resize(Number(width) || null, Number(height) || null);
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/grayscale
router.post('/image/grayscale', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { format = 'jpeg' } = req.body;
    const image = sharp(req.file.buffer).grayscale();
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/rotate
router.post('/image/rotate', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { angle = 90, format = 'jpeg' } = req.body;
    const image = sharp(req.file.buffer).rotate(Number(angle));
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/flip
router.post('/image/flip', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { direction = 'horizontal', format = 'jpeg' } = req.body;
    let image = sharp(req.file.buffer);
    image = direction === 'vertical' ? image.flip() : image.flop();
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/metadata
router.post('/image/metadata', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const metadata = await sharp(req.file.buffer).metadata();
    res.json({ metadata });
  } catch (err) {
    next(err);
  }
});

// /image/crop
router.post('/image/crop', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { left = 0, top = 0, width = 100, height = 100, format = 'jpeg' } = req.body;
    const image = sharp(req.file.buffer).extract({
      left: Number(left),
      top: Number(top),
      width: Number(width),
      height: Number(height),
    });
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/blur
router.post('/image/blur', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { sigma = 5, format = 'jpeg' } = req.body;
    const image = sharp(req.file.buffer).blur(Number(sigma));
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/sharpen
router.post('/image/sharpen', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { format = 'jpeg' } = req.body;
    const image = sharp(req.file.buffer).sharpen();
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/negate
router.post('/image/negate', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { format = 'jpeg' } = req.body;
    const image = sharp(req.file.buffer).negate();
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/tint
router.post('/image/tint', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const { r = 255, g = 0, b = 0, format = 'jpeg' } = req.body;
    const image = sharp(req.file.buffer).tint({ r: Number(r), g: Number(g), b: Number(b) });
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

// /image/rotate-random
router.post('/image/rotate-random', apiKeyAuthAndLogger, upload.single('image'), async (req, res, next) => {
  try {
    const angle = Math.floor(Math.random() * 361);
    const { format = 'jpeg' } = req.body;
    const image = sharp(req.file.buffer).rotate(angle);
    await sendImage(res, image, format);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
