const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const API_COST = 100;

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
};

router.post('/toggle-api', authMiddleware, async (req, res) => {
  const { enable } = req.body;
  const user = req.user;

  user.isApiEnabled = enable;
  user.totalCost = enable ? user.basePlanCost + API_COST : user.basePlanCost;

  await user.save();
  res.json({ apiEnabled: user.isApiEnabled, totalCost: user.totalCost });
});

module.exports = router;
