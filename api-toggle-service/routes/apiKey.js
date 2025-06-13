const express = require('express');
const router = express.Router();
const ApiKey = require('../models/ApiKey');
const UserPlan = require('../models/UserPlan');
const authMiddleware = require('../middleware/authMiddleware');
const crypto = require('crypto');

// 🔐 Generate API key string
function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

// 📌 Create API Key
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { appName } = req.body;

    if (!appName) {
      return res.status(400).json({
        code: 400,
        response: 'fail',
        message: 'App name is required'
      });
    }

    const activePlan = await UserPlan.findOne({ userId, isActive: true });
    if (!activePlan) {
      return res.status(403).json({ code: 403, response: 'error', message: 'No active plan found' });
    }

    const existingKeys = await ApiKey.find({ userId });
    const limit = parseInt(activePlan.maxApiKeys) || 0;

    if (existingKeys.length >= limit) {
      return res.status(400).json({
        code: 400,
        response: 'fail',
        message: 'API key limit reached. Upgrade plan to create more.'
      });
    }

    const duplicate = await ApiKey.findOne({ userId, appName });
    if (duplicate) {
      return res.status(409).json({
        code: 409,
        response: 'fail',
        message: 'App name already exists. Please choose a different name.'
      });
    }

    const newKey = new ApiKey({
      userId,
      appName,
      key: generateKey()
    });

    await newKey.save();

    res.status(201).json({
      code: 201,
      response: 'success',
      message: { apiKey: newKey.key, appName: newKey.appName }
    });
  } catch (err) {
    console.error('❌ Error creating API key:', err.message);
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});


// DELETE /api/keys/:keyId
router.delete('/:keyId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { keyId } = req.params;

    const key = await ApiKey.findOne({ _id: keyId, userId });
    if (!key) {
      return res.status(404).json({
        code: 404,
        response: 'error',
        message: 'API key not found'
      });
    }

    await key.deleteOne();

    res.status(200).json({
      code: 200,
      response: 'success',
      message: 'API key deleted successfully'
    });
  } catch (err) {
    console.error('❌ Error deleting API key:', err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: err.message
    });
  }
});


// 📌 Get all API Keys
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({ userId: req.user._id });
    res.json({
      code: 200,
      response: 'success',
      message: { apiKeys }
    });
  } catch (err) {
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});

// 📌 Disable API Key (instead of delete)
router.put('/disable/:keyId', authMiddleware, async (req, res) => {
  try {
    const { keyId } = req.params;

    await ApiKey.findOneAndUpdate(
      { _id: keyId, userId: req.user._id },
      { disabled: true }
    );

    res.json({
      code: 200,
      response: 'success',
      message: { info: 'API key disabled successfully' }
    });
  } catch (err) {
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});

module.exports = router;
