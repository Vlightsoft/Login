require('dotenv').config();
const express = require('express');
const multer = require('multer'); 
const cors = require('cors');
const { connectDB } = require('./api-toggle-service/db');

const fileMergeRoutes = require('./api-toggle-service/core-apis/fileMerge');
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

app.use('/api', fileMergeRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.code,
      message: err.message || 'Multer processing failed',
    });
  }

  // Catch-all
  return res.status(500).json({
    error: 'ServerError',
    message: err.message || 'Something went wrong',
  });
});

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
