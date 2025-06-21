const { Schema, model } = require('mongoose');

const VerifiedDomainSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  domain: { type: String, required: true },
  status: { type: String, enum: ['submitted', 'verified', 'deleting'], default: 'submitted' },
  fromAddresses: [
    {
      email: String,
      status: { type: String, enum: ['active', 'pending_delete'], default: 'active' }
    }
  ],
  notified: { type: Boolean, default: true }, // for frontend bell
}, { timestamps: true });

module.exports = model('VerifiedDomain', VerifiedDomainSchema);
