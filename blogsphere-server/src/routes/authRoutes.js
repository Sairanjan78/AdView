const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  getMe,
  verifyEmail,
  forgotPassword,
  checkResetToken,
  resetPassword,
  googleSignIn,
  updateProfile,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints (brute-force defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

// Password reset emails: stricter limit so the endpoint cannot be used to spam inboxes
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP. Please try again after 15 minutes.'
  }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/verify-email', verifyEmail);
router.post('/google', authLimiter, googleSignIn);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.get('/reset-password/:token', authLimiter, checkResetToken);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.put('/profile', protect, updateProfile);
router.post('/logout', logout);

module.exports = router;
