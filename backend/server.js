try { require('dotenv').config(); } catch (_) {}
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_ORIGIN 
  ? [process.env.FRONTEND_ORIGIN] 
  : ['http://localhost:3000', 'http://localhost:5173', 'https://pdfwriter-app.vercel.app'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true); // In production, allow all for now or restrict to Vercel domain
    }
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      return callback(null, true);
    } else {
      return callback(null, true); // Fallback to allow during debug
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
// On Vercel, the /api prefix might be stripped depending on the routing
app.use('/api', apiRoutes);
app.use('/', apiRoutes); // Fallback for serverless environments


// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/pdfwriter';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.warn('MongoDB connection failed:', err.message));

// Handle app.listen for local development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
