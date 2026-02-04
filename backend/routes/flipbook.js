const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generateFlipbookPages, generateFlipbookFromPDF } = require('../services/flipbook');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Generate flipbook pages from content
router.post('/view', async (req, res) => {
  try {
    const { content, options } = req.body || {};
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const pages = await generateFlipbookPages({ content, options });

    res.status(200).json({
      success: true,
      pages,
      pageCount: pages.length
    });
  } catch (err) {
    console.error('Flipbook Route Error:', err);
    res.status(500).json({ error: 'Failed to generate flipbook', details: err.message });
  }
});

// Generate flipbook pages from uploaded PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    const pages = await generateFlipbookFromPDF(req.file.buffer);

    res.status(200).json({
      success: true,
      pages,
      pageCount: pages.length
    });
  } catch (err) {
    console.error('Flipbook Upload Error:', err);
    res.status(500).json({ error: 'Failed to process PDF', details: err.message });
  }
});

module.exports = router;
