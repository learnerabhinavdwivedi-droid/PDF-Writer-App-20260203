const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign({ sub: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    const token = signToken(user);
    res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: !!process.env.COOKIE_SECURE,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .status(201)
      .json({
        success: true,
        message: 'User registered successfully',
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });

  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user and select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: !!process.env.COOKIE_SECURE,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .status(200)
      .json({
        success: true,
        message: 'Login successful',
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });

  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Logout (clear cookie)
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: !!process.env.COOKIE_SECURE });
  res.status(200).json({ success: true, message: 'Logged out' });
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('documents');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

module.exports = router;
