const { mongoose } = require('../db');
const Counter = require('./Counter');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  isApiEnabled: { type: Boolean, default: false },
  basePlanCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  profilePicUrl: { type: String, default: '' },
  dateOfBirth: { type: Date },
  phone: { type: String },
  organizationName: { type: String },

  userID: {
    type: String,
    unique: true,
    default: null  // important for auto-generation
  },
});


UserSchema.pre('save', async function (next) {
  if (!this.isNew || this.userID) return next();

  const counter = await Counter.findOneAndUpdate(
    { name: 'userID' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  this.userID = counter.seq.toString().padStart(6, '0'); // e.g., "000123"
  next();
});

module.exports = mongoose.model('User', UserSchema);
