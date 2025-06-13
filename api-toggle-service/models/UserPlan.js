const mongoose = require('mongoose');

const userPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  planId: String, // optional if custom
  planName: String,
  price: String,
  maxApiKeys: mongoose.Schema.Types.Mixed,
  support: String,
  usage: {
    type: Map,
    of: Number,
    default: {} // ✅ Ensures default object
  },
  limits: {
    type: Map,
    of: String
  },
  isCustom: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  expiryDate: Date
});

module.exports = mongoose.model('UserPlan', userPlanSchema);
