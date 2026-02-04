const express = require('express');
const router = express.Router();

try {
  // Import all route modules - wrap in try-catch for graceful fallback
  const authRoutes = require('./auth');
  const documentRoutes = require('./documents');
  const pdfRoutes = require('./pdf');
  const templateRoutes = require('./templates');
  const convertRoutes = require('./convert');
  const flipbookRoutes = require('./flipbook');

  // Mount routes
  router.use('/auth', authRoutes);
  router.use('/documents', documentRoutes);
  router.use('/pdf', pdfRoutes);
  router.use('/templates', templateRoutes);
  router.use('/convert', convertRoutes);
  router.use('/flipbook', flipbookRoutes);
} catch (err) {
  console.warn('Some routes could not be loaded:', err.message);
  
  // Provide mock routes as fallback
  router.get('/documents', (req, res) => {
    res.json({ success: true, documents: [], message: 'In-memory mode' });
  });
  
  router.post('/auth/register', (req, res) => {
    res.json({ success: true, message: 'Mock registration' });
  });
  
  router.post('/auth/login', (req, res) => {
    res.json({ success: true, message: 'Mock login' });
  });
  
  router.post('/pdf/text-to-pdf', (req, res) => {
    res.json({ success: true, message: 'Mock PDF generation' });
  });
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
