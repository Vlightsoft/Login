const mongoose = require('mongoose');

const planTemplateSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // e.g., "free", "basic", "enterprise"
  name: String,
  price: String,
  maxApiKeys: mongoose.Schema.Types.Mixed,
  support: String,
  description: String,
  tag: String,
  limits: {
    type: Map,
    of: String
  }
});

module.exports = mongoose.model('PlanTemplate', planTemplateSchema);
