const ApiKey = require('../models/ApiKey');

const verifyApiKey = async (req, res, next) => {
  const apiKey = req.header('x-api-key');
  console.log("API Key Received:", apiKey);

  if (!apiKey) {
    console.warn("❌ No API key provided");
    return res.status(401).json({ message: 'API key required' });
  }

  try {
    const keyDoc = await ApiKey.findOne({ key: apiKey, disabled: false });
    console.log("🔍 Key Document Found:", keyDoc);

    if (!keyDoc) {
      console.warn("❌ Invalid or inactive API key");
      return res.status(403).json({ message: 'Invalid or inactive API key' });
    }

    req.apiKeyData = keyDoc;
    next();
  } catch (err) {
    console.error('🔥 API key verification error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = verifyApiKey;
