const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true, unique: true },
  appName: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Ensure unique appName per user
apiKeySchema.index({ userId: 1, appName: 1 }, { unique: true });

module.exports = mongoose.model('ApiKey', apiKeySchema);