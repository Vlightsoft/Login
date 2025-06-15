require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./api-toggle-service/db');
const path = require('path');
const app = express();
//const PORT = process.env.PORT || 3000;
const PORT = process.env.PORT;
// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'api-toggle-service/uploads')));

// ✅ Correct routes
app.use('/api/auth', require('./api-toggle-service/routes/auth'));
app.use('/api/toggle', require('./api-toggle-service/routes/apiToggle'));
app.use('/api/plans', require('./api-toggle-service/routes/plans')); // ✅ Only this
app.use('/api/keys', require('./api-toggle-service/routes/apiKey'));
app.use('/api', require('./api-toggle-service/routes/apiHistory'));
app.use('/api/datetime', require('./api-toggle-service/core-apis/datetime'));




// Start server after DB connection
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
})();
