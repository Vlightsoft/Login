const { mongoose } = require('../db'); 

// Plan Info Schema
const PlanInfoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  planName: { type: String, required: true }, // Example: "Basic", "Premium"
  basePlanCost: { type: Number, required: true }, // Example: 50.00 for the basic plan
  totalCost: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true }, // To track if the plan is currently active
});

// Pre-save hook to ensure only one active plan per user
PlanInfoSchema.pre('save', async function(next) {
  if (this.isActive) {
    // Deactivate all other plans for this user before saving the new active plan
    await mongoose.model('PlanInfo').updateMany(
      { userId: this.userId, isActive: true },
      { $set: { isActive: false } }
    );
  }
  next();
});

module.exports = mongoose.model('PlanInfo', PlanInfoSchema);
