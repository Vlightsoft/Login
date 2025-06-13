const express = require('express');
const router = express.Router();
const ApiRequestHistory = require('../models/ApiRequestHistory');
const authMiddleware = require('../middleware/authMiddleware');

// Get history from last 3 months
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const history = await ApiRequestHistory.find({
      userId,
      timestamp: { $gte: threeMonthsAgo }
    }).sort({ timestamp: -1 });

    res.json({
      code: 200,
      response: 'success',
      message: history
    });
  } catch (err) {
    console.error('❌ Error fetching API history:', err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: err.message
    });
  }
});

module.exports = router;
