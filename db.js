// db.js
const mongoose = require('mongoose');

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment");
  process.exit(1);
}

let isConnectedBefore = false;

async function connectDB() {
  if (isConnectedBefore) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnectedBefore = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = { connectDB, mongoose };
