const mongoose = require('mongoose');

const UserPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo', required: true },
  planId: { type: String, required: true },
  usage: {
    type: Map,
    of: Number,
    default: {}
  },
  limits: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

// ✅ SAFE EXPORT
module.exports = mongoose.models.UserPlan || mongoose.model('UserPlan', UserPlanSchema);
