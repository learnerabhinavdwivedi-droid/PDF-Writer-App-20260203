const express = require('express');
const router = express.Router();
const { generateRichTextPDF } = require('../services/pdf');

// Generate PDF from content (TipTap JSON or HTML)
router.post('/generate', async (req, res) => {
  try {
    const { title = 'document', content = '', options, template, metadata, pdfOptions } = req.body || {};
    
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
    console.error('PDF Generation Route Error:', err);
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
  }
});

// Convert text to PDF
router.post('/text-to-pdf', async (req, res) => {
  try {
    const { title = 'document', text = '', options, template, metadata, pdfOptions } = req.body || {};
    
    // Treat plain text as HTML with preserved line breaks for the transformer
    const content = text.replace(/\n/g, '<br/>');

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
    res.status(500).json({ error: 'Failed to convert text to PDF', details: err.message });
  }
});

// Upload PDF file
router.post('/upload', async (req, res) => {
  res.status(501).json({ error: 'Upload not implemented without multipart parser' });
});

module.exports = router;

