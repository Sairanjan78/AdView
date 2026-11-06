const express = require('express');
const { getWriters, getWriterByUsername } = require('../controllers/writerController');

const router = express.Router();

// Public routes
router.get('/', getWriters);
router.get('/:username', getWriterByUsername);

module.exports = router;
