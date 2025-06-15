const { mongoose } = require('../db');

const AppUsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'UserInfo' },
  appName: { type: String, required: true },
  usage: {
    type: Map,
    of: Number // serviceName -> usage count
  }
}, { timestamps: true });

module.exports = mongoose.model('AppUsage', AppUsageSchema);
