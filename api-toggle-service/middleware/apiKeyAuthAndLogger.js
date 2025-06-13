const ApiKey = require('../models/ApiKey');
const ApiRequestHistory = require('../models/ApiRequestHistory');
const UserPlan = require('../models/UserPlan');

module.exports = async function apiKeyAuthAndLogger(req, res, next) {
  try {

    console.log(req);
    const key = req.header('x-api-key');
    if (!key) return res.status(401).json({ message: 'API key missing' });

    const apiKeyRecord = await ApiKey.findOne({ key, disabled: false });
    if (!apiKeyRecord) return res.status(403).json({ message: 'Invalid or disabled API key' });

    req.userId = apiKeyRecord.userId;

    const startTime = process.hrtime();
    const originalEnd = res.end;

    res.end = async function (...args) {
      const diff = process.hrtime(startTime);
      const responseTime = `${(diff[0] * 1000 + diff[1] / 1e6).toFixed(2)}ms`;

      try {
      
        // Save API request history
        await new ApiRequestHistory({
          userId: apiKeyRecord.userId,
          endpoint: req.originalUrl,
          status: res.statusCode,
          responseTime,
           requestBody:{
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

        // Map endpoint prefix to service name
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

        const matchedPrefix = Object.keys(serviceMap).find(p =>
          req.originalUrl.startsWith(p)
        );

        const serviceName = serviceMap[matchedPrefix];

        if (serviceName) {
          const userPlan = await UserPlan.findOne({ userId: apiKeyRecord.userId, isActive: true });
  console.log(userPlan);
          if (userPlan) {
            if (!userPlan.usage) userPlan.usage = new Map();
        const current = userPlan.usage.get(serviceName) || 0;
userPlan.usage.set(serviceName, current + 1);

userPlan.markModified('usage');
await userPlan.save();


            console.log(
              `📊 Plan: ${userPlan.name || '(Unnamed Plan)'} | Service: ${serviceName} | Usage: ${userPlan.usage[serviceName]}`
            );
          } else {
            console.warn(`⚠️ No active user plan found for userId: ${apiKeyRecord.userId}`);
          }
        }
      } catch (err) {
        console.error('❌ Failed to save API history or usage:', err.message);
      }

      originalEnd.apply(res, args);
    };

    next();
  } catch (err) {
    console.error('❌ Error in API key middleware:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
