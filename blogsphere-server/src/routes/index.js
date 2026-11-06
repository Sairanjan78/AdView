const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./authRoutes');
const articleRoutes = require('./articleRoutes');
const categoryRoutes = require('./categoryRoutes');
const writerRoutes = require('./writerRoutes');
const contactRoutes = require('./contactRoutes');
const { getSitemap } = require('../controllers/seoController');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);
router.use('/categories', categoryRoutes);
router.use('/writers', writerRoutes);
router.use('/contact', contactRoutes);
router.get('/sitemap.xml', getSitemap);

module.exports = router;
