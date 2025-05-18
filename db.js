// db.js
const mongoose = require('mongoose');

// Ensure that the environment variable exists
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment");
  process.exit(1);  // Exit the process if MONGO_URI is missing
}

async function connectDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,  // Set a timeout for server selection
    });

    console.log("✅ MongoDB connected successfully!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);  // Exit the process if there's a connection error
  }
}

module.exports = { connectDB, mongoose };
