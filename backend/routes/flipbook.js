const express = require('express');
const router = express.Router();
const { generateFlipbookPages } = require('../services/flipbook');

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

module.exports = router;
