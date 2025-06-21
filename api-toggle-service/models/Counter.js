const { mongoose } = require('../db'); 

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 1000000 }, // Start at 7-digit number
});

module.exports = mongoose.model('Counter', counterSchema);
