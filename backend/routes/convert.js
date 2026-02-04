const express = require('express');
const router = express.Router();
const { generateRichTextPDF } = require('../services/pdf');

router.post('/', async (req, res) => {
  try {
    const { title = 'document', text, base64, options, template, metadata, pdfOptions } = req.body || {};
    
    let content = text || '';
    if (!content && base64) {
      content = Buffer.from(base64, 'base64').toString('utf8');
    }

    // If it's plain text, we might want to preserve line breaks
    if (content && !content.includes('<') && !content.includes('>')) {
      content = content.replace(/\n/g, '<br/>');
    }

    const pdfBuffer = await generateRichTextPDF({
      content,
      options,
      template,
      metadata: { ...metadata, title },
      pdfOptions
    });

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9.-]/gi, '_')}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.end(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert', details: err.message });
  }
});

module.exports = router;

