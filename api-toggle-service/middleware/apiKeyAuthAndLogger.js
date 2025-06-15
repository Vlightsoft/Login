const ApiKey = require('../models/ApiKey');
const ApiRequestHistory = require('../models/ApiRequestHistory');
const UserPlan = require('../models/UserPlan');
const FeatureToggle = require('../models/FeatureToggle');
const normalizeKey = require('../utils/normalizeKey');

module.exports = async function apiKeyAuthAndLogger(req, res, next) {
  try {
    const key = req.header('x-api-key');
    if (!key) return res.status(401).json({ message: 'API key missing' });

    const apiKeyRecord = await ApiKey.findOne({ key, disabled: false });
    if (!apiKeyRecord) return res.status(403).json({ message: 'Invalid or disabled API key' });

    req.userId = apiKeyRecord.userId;

    const serviceMap = {
      '/api/datetime': 'Date/Time APIs',
      '/api/merge': 'File Merger APIs',
      '/api/convert': 'Conversion Utilities',
      '/api/validate': 'File Validators',
      '/api/email': 'Email Validation',
      '/api/virus': 'Virus Scanner',
      '/api/bulk-merge': 'Bulk File Merger',
      '/api/bulk-convert': 'Bulk File Convertor'
    };

    const matchedPrefix = Object.keys(serviceMap).find(prefix =>
      req.originalUrl.startsWith(prefix)
    );
    const serviceName = serviceMap[matchedPrefix];

    if (!serviceName) {
      return res.status(400).json({ message: 'Unknown service endpoint' });
    }

    const checkkey = normalizeKey(serviceName);

    const featureToggleDoc = await FeatureToggle.findOne({ userId: apiKeyRecord.userId });
    const isEnabled = featureToggleDoc?.toggles?.get(checkkey);

    if (!isEnabled) {
      return res.status(403).json({
        code: 403,
        response: 'fail',
        message: 'Service not available. Please contact your admin.'
      });
    }

    // ✅ Check and update usage in UserPlan
    const userPlan = await UserPlan.findOne({ userId: apiKeyRecord.userId, isActive: true });
    if (userPlan) {
      if (!userPlan.usage) userPlan.usage = new Map();

      const currentCount = userPlan.usage.get(serviceName) || 0;
      const serviceLimit = userPlan.limits?.[serviceName] ?? Infinity;

      if (currentCount >= serviceLimit) {
        return res.status(429).json({
          code: 429,
          response: 'fail',
          message: 'Limit exceeded for this month. Kindly contact support.'
        });
      }

      userPlan.usage.set(serviceName, currentCount + 1);
      userPlan.markModified('usage');
      await userPlan.save(); // ✅ only save ONCE
    } else {
      console.warn(`⚠️ No active user plan found for userId: ${apiKeyRecord.userId}`);
    }

    // ✅ Log API request
    const startTime = process.hrtime();
    const originalEnd = res.end;

    res.end = async function (...args) {
      const diff = process.hrtime(startTime);
      const responseTime = `${(diff[0] * 1000 + diff[1] / 1e6).toFixed(2)}ms`;

      try {
        await new ApiRequestHistory({
          userId: apiKeyRecord.userId,
          endpoint: req.originalUrl,
          status: res.statusCode,
          responseTime,
          requestBody: {
            method: req.method,
            url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
            headers: req.headers,
            body: req.body,
            ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress,
            timestamp: new Date().toISOString()
          },
          ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress,
          appName: apiKeyRecord.appName
        }).save();
      } catch (err) {
        console.error('❌ Failed to save API history:', err.message);
      }

      originalEnd.apply(res, args);
    };

    next();
  } catch (err) {
    console.error('❌ Error in API key middleware:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
