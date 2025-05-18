const { mongoose } = require('../db'); 

const FeatureToggleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo', required: true, unique: true },

  toggles: {
    dateTimeAPI: { type: Boolean, default: false },
    fileValidator: { type: Boolean, default: false },
    converter: { type: Boolean, default: false },
    emailValidator: { type: Boolean, default: false },
    scanner: { type: Boolean, default: false },
    // Add more toggles here in future
  }
}, { timestamps: true });

module.exports = mongoose.model('FeatureToggle', FeatureToggleSchema);
