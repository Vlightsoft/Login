// api-toggle-service/models/User.js
const { mongoose } = require('../db'); // ✅ Use the shared instance from db.js

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  isApiEnabled: { type: Boolean, default: false },
  basePlanCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },

  profilePicUrl: { type: String, default: '' }, // URL to image stored on server or cloud
  dateOfBirth: { type: Date },
  phone: { type: String },
  organizationName: { type: String },
});

module.exports = mongoose.model('User', UserSchema);
