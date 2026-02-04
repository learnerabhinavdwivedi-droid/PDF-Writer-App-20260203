const path = require('path');
const express = require('express');

// Import the actual server app
const app = require('../backend/server.js');

// Export for Vercel serverless
module.exports = app;
