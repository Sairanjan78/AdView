const express = require('express');
const rateLimit = require('express-rate-limit');
const { submitContact, getContactMessages } = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Spam protection: 5 messages per IP per hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages from this IP. Please try again in an hour or email us directly.'
  }
});

router.post('/', contactLimiter, submitContact);
router.get('/', protect, authorize(ROLES.ADMIN), getContactMessages);

module.exports = router;
