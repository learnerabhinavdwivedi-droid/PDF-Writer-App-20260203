const express = require('express');
const router = express.Router();
const Template = require('../models/Template');

// Create template
router.post('/', async (req, res) => {
  try {
    const { name, description, content, category, isPublic, author } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const template = new Template({ 
      name, 
      description, 
      content, 
      category, 
      isPublic: !!isPublic,
      author: author || '65c123456789012345678901'
    });
    await template.save();

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create template', details: error.message });
  }
});

// Get all public templates
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find({ isPublic: true });

    res.status(200).json({
      success: true,
      count: templates.length,
      templates
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.status(200).json({
      success: true,
      template
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template', details: error.message });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      template
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update template', details: error.message });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template', details: error.message });
  }
});

module.exports = router;

