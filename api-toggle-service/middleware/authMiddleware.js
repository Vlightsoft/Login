const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const AdminKey = require('../models/AdminKey');

const authMiddleware = async (req, res, next) => {
  const bearer = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  const adminKey = req.headers['x-admin-key'];

  try {
    // 1. ✅ Handle Bearer Token (User Auth)
       if (adminKey) {
      const match = await AdminKey.findOne({ key: adminKey, disabled: false });
      if (!match) {
        return res.status(403).json({ code: 403, response: 'fail', message: 'Invalid admin key' });
      }

      req.isAdmin = true;
      req.adminKey = match;
      
       req.user = { _id: req.body.userId }; 
      return next();
    }

    
    if (bearer && bearer.startsWith('Bearer ')) {
      const token = bearer.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({ code: 404, response: "error", message: { error: "User not found" } });
      }

      req.user = user;
      return next();
    }

    // 2. 🔐 Handle Admin API Key
    if (apiKey) {
      const keyDoc = await ApiKey.findOne({ key: apiKey, disabled: { $ne: true } });

      if (!keyDoc) {
        return res.status(403).json({ code: 403, response: "error", message: { error: "Invalid API key" } });
      }

      if (keyDoc.isAdmin) {
        req.isAdmin = true;
        req.adminKey = keyDoc;
        return next();
      }

      // Optional: support user API keys (not JWT)
      const user = await User.findById(keyDoc.userId);
      if (!user) {
        return res.status(404).json({ code: 404, response: "error", message: { error: "User not found" } });
      }

      req.user = user;
      req.apiKey = keyDoc;
      return next();
    }

    // 🚫 If neither found
    return res.status(401).json({ code: 401, response: "error", message: { error: "No authorization provided" } });

  } catch (err) {
    console.error('❌ Auth Error:', err.message);
    return res.status(403).json({ code: 403, response: "error", message: { error: "Invalid or expired token" } });
  }
};

module.exports = authMiddleware;
