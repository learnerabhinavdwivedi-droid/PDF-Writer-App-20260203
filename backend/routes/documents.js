const express = require('express');
const router = express.Router();
let documentController;
const memoryDocs = [];
try {
  documentController = require('../controllers/documentController');
} catch (e) {
  documentController = {
    createDocument: async (req, res) => {
      const { title, content, author } = req.body;
      if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
      const doc = { _id: String(Date.now()), title, content, author: author || 'Unknown', status: 'draft', createdAt: new Date() };
      memoryDocs.push(doc);
      res.status(201).json({ success: true, message: 'Document created (in-memory)', document: doc });
    },
    getAllDocuments: async (req, res) => {
      res.status(200).json({ success: true, documents: memoryDocs });
    },
    getDocumentById: async (req, res) => {
      const doc = memoryDocs.find(d => d._id === req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      res.status(200).json({ success: true, document: doc });
    },
    updateDocument: async (req, res) => {
      const idx = memoryDocs.findIndex(d => d._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Document not found' });
      memoryDocs[idx] = { ...memoryDocs[idx], ...req.body, updatedAt: new Date() };
      res.status(200).json({ success: true, message: 'Document updated (in-memory)', document: memoryDocs[idx] });
    },
    deleteDocument: async (req, res) => {
      const idx = memoryDocs.findIndex(d => d._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Document not found' });
      const removed = memoryDocs.splice(idx, 1)[0];
      res.status(200).json({ success: true, message: 'Document deleted (in-memory)', document: removed });
    }
  };
}

// Create a new document
router.post('/', documentController.createDocument);

// Get all documents
router.get('/', documentController.getAllDocuments);

// Get document by ID
router.get('/:id', documentController.getDocumentById);

// Update document by ID
router.put('/:id', documentController.updateDocument);

// Delete document by ID
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
