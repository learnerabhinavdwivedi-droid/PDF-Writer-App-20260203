const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

// Create a new document
router.post('/', async (req, res) => {
  try {
    const { title, content, author, isPublic } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const document = new Document({
      title,
      content,
      author: author || '65c123456789012345678901', // Mock author ID if not provided, should be user ID in production
      isPublic: !!isPublic
    });
    await document.save();
    res.status(201).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document', details: error.message });
  }
});

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find().populate('author', 'name email');
    res.status(200).json({ success: true, count: documents.length, documents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
  }
});

// Get document by ID
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('author', 'name email');
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.status(200).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document', details: error.message });
  }
});

// Update document
router.put('/:id', async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.status(200).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document', details: error.message });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document', details: error.message });
  }
});

module.exports = router;

