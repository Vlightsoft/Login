const { mongoose } = require('../db'); 

const FeatureToggleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo', required: true, unique: true },
 toggles: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('FeatureToggle', FeatureToggleSchema);


