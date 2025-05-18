const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  isApiEnabled: { type: Boolean, default: false },
  basePlanCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', UserSchema);
