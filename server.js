require('dotenv').config();  // Load environment variables
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./api-toggle-service/db');  // DB connection logic

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());               // Enable CORS for handling cross-origin requests
app.use(express.json());       // Parse incoming JSON requests

// Initialize the server and connect to MongoDB
(async () => {
  try {
    // Attempt to connect to MongoDB before starting the server
    await connectDB();

    // Register Routes
    app.use('/api/auth', require('./api-toggle-service/routes/auth'));     // Authentication routes (signup, login)
    app.use('/api/service', require('./api-toggle-service/routes/apiToggle'));  // Service API routes (for toggling features)

    // Start the server on the specified port
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);  // Exit the process if the DB connection or server start fails
  }
})();
