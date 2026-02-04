const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const documentRoutes = require('./documents');
const pdfRoutes = require('./pdf');

// Mount routes
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/pdf', pdfRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
