const { mongoose } = require('../db'); 

const LogHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo', required: true }, // Reference to UserInfo
  action: { type: String, required: true },  // E.g., "toggle feature", "change plan", etc.
  details: { type: String },  // More detailed info about the action (e.g., "File scanner enabled")
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LogHistory', LogHistorySchema);