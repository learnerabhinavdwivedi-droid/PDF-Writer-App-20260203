const express = require('express');
const router = express.Router();

// In-memory storage for documents
let documents = [];
let nextId = 1;

// Create a new document
router.post('/', (req, res) => {
  try {
    const { title, content, author, isPublic } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const document = {
      _id: nextId++,
      title,
      content,
      author: author || 'Anonymous',
      isPublic: !!isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    documents.push(document);
    res.status(201).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document', details: error.message });
  }
});

// Get all documents
router.get('/', (req, res) => {
  try {
    res.status(200).json({ success: true, count: documents.length, documents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
  }
});

// Get document by ID
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const document = documents.find(doc => doc._id === id);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.status(200).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document', details: error.message });
  }
});

// Update document
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const documentIndex = documents.findIndex(doc => doc._id === id);
    if (documentIndex === -1) return res.status(404).json({ error: 'Document not found' });
    
    documents[documentIndex] = {
      ...documents[documentIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.status(200).json({ success: true, document: documents[documentIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document', details: error.message });
  }
});

// Delete document
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const documentIndex = documents.findIndex(doc => doc._id === id);
    if (documentIndex === -1) return res.status(404).json({ error: 'Document not found' });
    
    documents.splice(documentIndex, 1);
    res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document', details: error.message });
  }
});

module.exports = router;

