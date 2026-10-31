const crypto = require('crypto');
const User = require('../models/User');
const { ROLES } = require('../constants/roles');
const { sendSuccess, sendError, sendTokenResponse } = require('../utils/response');
const sendEmail = require('../utils/email');
const env = require('../config/env');

// Helper to generate a unique username from full name
const generateUsername = async (name) => {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 20);
  if (!base) base = 'user';

  let username = base;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${base}_${counter}`;
    counter += 1;
  }
  return username;
};

// @desc    Register a new user (reader or writer)
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, username } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, 'Please provide name, email, and password');
    }

    // Role safety check: cannot register as admin directly
    const requestedRole = role === ROLES.WRITER ? ROLES.WRITER : ROLES.READER;

    // Check if user already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return sendError(res, 400, 'An account with that email already exists');
    }

    // Determine unique username
    let finalUsername = username ? username.toLowerCase().trim() : null;
    if (finalUsername) {
      const existingUsername = await User.findOne({ username: finalUsername });
      if (existingUsername) {
        return sendError(res, 400, 'That username is already taken. Please choose another.');
      }
    } else {
      finalUsername = await generateUsername(name);
    }

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      username: finalUsername,
      role: requestedRole
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    const verificationUrl = `${env.clientUrl}/verify-email?token=${verificationToken}`;
    const emailMessage = `Welcome to BlogSphere, ${user.name}!\n\nPlease verify your email by clicking:\n${verificationUrl}\n\nThis link will expire in 24 hours.`;

    await sendEmail({
      to: user.email,
      subject: 'Verify your BlogSphere account',
      text: emailMessage
    });

    return sendTokenResponse(user, 201, res, 'Account created successfully! Verification email sent.');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide both email and password');
    }

    // Find user with password selected
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = Date.now();
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Protected
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return sendSuccess(res, 200, 'User profile fetched', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email token
// @route   POST /api/v1/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendError(res, 400, 'Verification token is required');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 400, 'Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, 'Email successfully verified!');
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - request reset token
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 400, 'Please provide an email address');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond with success to avoid account enumeration
    if (!user) {
      return sendSuccess(res, 200, 'If that email exists, a password reset link has been sent.');
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}`;
    const message = `You requested a password reset for BlogSphere.\n\nPlease reset your password using the link below:\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'BlogSphere Password Reset',
        text: message
      });
      return sendSuccess(res, 200, 'If that email exists, a password reset link has been sent.');
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return sendError(res, 500, 'Email could not be sent. Please try again later.');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return sendError(res, 400, 'Please provide both token and new password');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 400, 'Invalid or expired reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return sendTokenResponse(user, 200, res, 'Password updated successfully. You are now logged in.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/v1/auth/profile
// @access  Protected
const updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {};
    const { name, bio, avatar, socialLinks, nicheSpecialties } = req.body;

    if (name) fieldsToUpdate.name = name;
    if (typeof bio === 'string') fieldsToUpdate.bio = bio;
    if (typeof avatar === 'string') fieldsToUpdate.avatar = avatar;
    if (socialLinks) fieldsToUpdate.socialLinks = socialLinks;
    if (Array.isArray(nicheSpecialties)) fieldsToUpdate.nicheSpecialties = nicheSpecialties;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    return sendSuccess(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/v1/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  return sendSuccess(res, 200, 'Logged out successfully');
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  logout
};
