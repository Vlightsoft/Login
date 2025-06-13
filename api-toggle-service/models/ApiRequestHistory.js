const mongoose = require('mongoose');

const apiRequestHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: String,
  status: Number,
  responseTime: String,
  timestamp: { type: Date, default: Date.now },
   requestBody: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  appName: String,  // ✅ New field
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1d'  // 🔥 TTL: delete after 90 days
  }
});

module.exports = mongoose.model('ApiRequestHistory', apiRequestHistorySchema);
