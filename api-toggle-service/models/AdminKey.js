// models/AdminKey.js
const { mongoose } = require('../db');

const adminKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  label: { type: String }, // e.g. "DB Admin", "Ops", etc.
  createdAt: { type: Date, default: Date.now },
  disabled: { type: Boolean, default: false }
});

module.exports = mongoose.model('AdminKey', adminKeySchema);
