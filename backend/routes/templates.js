const express = require('express');
const router = express.Router();
let Template;
const memoryTemplates = [];
try {
  Template = require('../models/Template');
} catch (_) {
  Template = null;
}

// Create template
router.post('/', async (req, res) => {
  try {
    const { name, description, content, category, isPublic } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    if (!Template) {
      const template = { _id: String(Date.now()), name, description, content, category, isPublic: !!isPublic };
      memoryTemplates.push(template);
      return res.status(201).json({ success: true, message: 'Template created (in-memory)', template });
    }

    const template = new Template({ name, description, content, category, isPublic });
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
    const templates = Template ? await Template.find({ isPublic: true }) : memoryTemplates;

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
    const template = Template
      ? await Template.findById(req.params.id)
      : memoryTemplates.find(t => t._id === req.params.id);

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
    const { name, description, content, category, isPublic } = req.body;

    let template;
    if (!Template) {
      const idx = memoryTemplates.findIndex(t => t._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Template not found' });
      memoryTemplates[idx] = { ...memoryTemplates[idx], name, description, content, category, isPublic, updatedAt: new Date() };
      template = memoryTemplates[idx];
    } else {
      template = await Template.findByIdAndUpdate(
        req.params.id,
        { name, description, content, category, isPublic, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    }

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
    let template;
    if (!Template) {
      const idx = memoryTemplates.findIndex(t => t._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Template not found' });
      template = memoryTemplates.splice(idx, 1)[0];
    } else {
      template = await Template.findByIdAndDelete(req.params.id);
    }

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
      template
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template', details: error.message });
  }
});

module.exports = router;
