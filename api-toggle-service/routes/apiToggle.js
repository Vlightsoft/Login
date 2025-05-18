const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const FeatureToggle = require('../models/FeatureToggle');
const User = require('../models/User');

// 🔐 Middleware to verify JWT and load user
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({
      code: 401,
      response: "fail",
      message: "No token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("❌ User not found for decoded ID:", decoded.id);
      return res.status(404).json({
        code: 404,
        response: "fail",
        message: "User not found"
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    res.status(403).json({
      code: 403,
      response: "fail",
      message: "Invalid token"
    });
  }
};

// ✅ Get current toggles for the authenticated user
router.get('/toggle-api', authMiddleware, async (req, res) => {
  try {
    const toggles = await FeatureToggle.findOne({ userId: req.user._id });

    if (!toggles) {
      return res.status(404).json({
        code: 404,
        response: "fail",
        message: "Feature toggles not found"
      });
    }

    res.json({
      code: 200,
      response: "success",
      message: {
        toggles: toggles.toggles
      }
    });
  } catch (err) {
    console.error("❌ Error fetching toggles:", err.message);
    res.status(500).json({
      code: 500,
      response: "error",
      message: err.message
    });
  }
});

// ✅ Toggle a specific feature (enable/disable)
router.put('/toggle-api', authMiddleware, async (req, res) => {
  const { feature, enable } = req.body;

  // Check if the provided feature is valid
  const validFeatures = ['dateTimeAPI', 'fileValidator', 'converter', 'emailValidator', 'scanner'];
  if (!validFeatures.includes(feature)) {
    return res.status(400).json({
      code: 400,
      response: "fail",
      message: "Invalid feature name"
    });
  }

  try {
    // Update the toggle for the provided feature
    const toggleDoc = await FeatureToggle.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { [`toggles.${feature}`]: enable } },
      { new: true, upsert: true }
    );

    res.json({
      code: 200,
      response: "success",
      message: {
        updated: { feature, status: enable },
        toggles: toggleDoc.toggles
      }
    });
  } catch (err) {
    console.error("❌ Error updating feature toggle:", err.message);
    res.status(500).json({
      code: 500,
      response: "error",
      message: err.message
    });
  }
});

module.exports = router;
