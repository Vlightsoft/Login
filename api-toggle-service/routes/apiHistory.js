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


// Get aggregated usage by app name and service
router.get('/usage/by-app', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const usageStats = await ApiRequestHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { appName: "$appName", service: "$endpoint" },
          totalRequests: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.appName",
          services: {
            $push: {
              service: "$_id.service",
              count: "$totalRequests"
            }
          }
        }
      },
      {
        $project: {
          appName: "$_id",
          _id: 0,
          services: 1
        }
      }
    ]);

    res.json({
      code: 200,
      response: 'success',
      message: usageStats
    });
  } catch (err) {
    console.error("❌ Error fetching usage stats:", err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: err.message
    });
  }
});


module.exports = router;
