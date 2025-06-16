const mongoose = require('mongoose');

const UserPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo', required: true },
  planId: { type: String, required: false },

  // 🧩 Missing fields you're using in your logic
  name: { type: String },
  price: { type: String },
  maxApiKeys: { type: mongoose.Schema.Types.Mixed }, // can be number or string (like "Unlimited")
  support: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  isCustom: { type: Boolean, default: false },

  // ✅ Core fields
  usage: {
    type: Map,
    of: Number,
    default: {}
  },
  limits: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // supports "Unlimited", "Custom", etc.
    default: {}
  }

}, { timestamps: true });

module.exports = mongoose.models.UserPlan || mongoose.model('UserPlan', UserPlanSchema);
