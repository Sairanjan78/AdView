const crypto = require('crypto');
const User = require('../models/User');
const validator = require('validator');
const { ROLES, USER_STATUS } = require('../constants/roles');
const { sendSuccess, sendError, sendTokenResponse } = require('../utils/response');
const sendEmail = require('../utils/email');
const googleAuth = require('../utils/googleAuth');
const env = require('../config/env');

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // keep in sync with User.generatePasswordResetToken
const RESET_RESEND_COOLDOWN_MS = 60 * 1000; // one reset email per account per minute
const FORGOT_PASSWORD_RESPONSE = 'If an account exists for that email, a password reset link is on its way. It expires in 30 minutes.';

// "Remember me" arrives as a boolean (or "true"/"on" from plain forms)
const wantsRemember = (value) => value === true || value === 'true' || value === 'on' || value === 1;

// Helper to generate a unique username from full name
const generateUsername = async (name) => {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 20);
  if (!base || /^_+$/.test(base)) base = 'user';
  if (base.length < 3) base = `${base}_user`;

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
    const { email, password, remember } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return sendError(res, 400, 'Please provide both email and password');
    }

    // Find user with password selected
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

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

    return sendTokenResponse(user, 200, res, 'Logged in successfully', {
      remember: wantsRemember(remember)
    });
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

// @desc    Forgot password - email a single-use reset link (valid 30 minutes)
// @route   POST /api/v1/auth/forgot-password
// @access  Public (rate limited)
// The response is identical whether or not the email belongs to an account (no account enumeration),
// and the email is sent in the background so response time does not reveal it either.
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !validator.isEmail(email.trim())) {
      return sendError(res, 400, 'Please provide a valid email address');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    const recentlySent =
      user &&
      user.resetPasswordExpire &&
      user.resetPasswordExpire.getTime() - RESET_TOKEN_TTL_MS > Date.now() - RESET_RESEND_COOLDOWN_MS;

    if (user && !recentlySent) {
      // A new request replaces any earlier link, so only the newest one works
      const resetToken = user.generatePasswordResetToken();
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${env.clientUrl}/reset-password/${resetToken}`;
      const text =
        `Hi ${user.name},\n\n` +
        `We received a request to reset the password for your BlogSphere account.\n\n` +
        `Choose a new password here (the link works once and expires in 30 minutes):\n${resetUrl}\n\n` +
        `If you did not ask for this, you can ignore this email - your password will not change.`;

      sendEmail({ to: user.email, subject: 'Reset your BlogSphere password', text }).catch(async (err) => {
        console.error('[Email] Password reset email failed:', err.message);
        // The link never arrived, so do not leave a usable token behind
        await User.updateOne(
          { _id: user._id },
          { $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 } }
        ).catch(() => {});
      });
    }

    return sendSuccess(res, 200, FORGOT_PASSWORD_RESPONSE);
  } catch (error) {
    next(error);
  }
};

// @desc    Check whether a reset link is still valid (lets the page show "expired" before typing)
// @route   GET /api/v1/auth/reset-password/:token
// @access  Public (rate limited)
const checkResetToken = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(String(req.params.token)).digest('hex');
    const exists = await User.exists({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!exists) {
      return sendError(res, 400, 'This reset link is invalid or has expired. Please request a new one.');
    }
    return sendSuccess(res, 200, 'Reset link is valid');
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using the emailed token (single use)
// @route   POST /api/v1/auth/reset-password  (body: token, password)
//          POST /api/v1/auth/reset-password/:token  (body: password)
// @access  Public (rate limited)
const resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token || req.body.token;
    const { password } = req.body;

    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return sendError(res, 400, 'Please provide both token and new password');
    }
    if (password.length < 8) {
      return sendError(res, 400, 'Password must be at least 8 characters');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 400, 'This reset link is invalid or has expired. Please request a new one.');
    }

    user.password = password; // pre-save hook hashes it and stamps passwordChangedAt
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Following the emailed link proves the user owns the address
    user.isEmailVerified = true;
    await user.save();

    return sendSuccess(res, 200, 'Your password has been updated. Please sign in with your new password.');
  } catch (error) {
    next(error);
  }
};

// @desc    Sign in / sign up with Google (Google Identity Services ID token)
// @route   POST /api/v1/auth/google  (body: credential, remember)
// @access  Public (rate limited)
// Existing accounts are matched by Google ID, then by email (and linked). New accounts are always readers.
const googleSignIn = async (req, res, next) => {
  try {
    if (!googleAuth.isConfigured()) {
      return sendError(res, 503, 'Google sign-in is not enabled on this server');
    }

    const { credential, remember } = req.body;
    if (!credential || typeof credential !== 'string') {
      return sendError(res, 400, 'Missing Google credential');
    }

    let payload;
    try {
      payload = await googleAuth.verifyIdToken(credential);
    } catch (err) {
      return sendError(res, 401, 'Google sign-in failed. Please try again.');
    }

    if (!payload || !payload.sub || !payload.email) {
      return sendError(res, 401, 'Google sign-in failed. Please try again.');
    }
    if (payload.email_verified !== true && payload.email_verified !== 'true') {
      return sendError(res, 401, 'Your Google email address is not verified.');
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub }).select('+googleId');

    if (!user) {
      user = await User.findOne({ email }).select('+googleId');
      if (user) {
        if (user.googleId && user.googleId !== payload.sub) {
          return sendError(res, 409, 'This account is already linked to a different Google account.');
        }
        user.googleId = payload.sub;
        user.isEmailVerified = true;
        if (!user.avatar && payload.picture) user.avatar = payload.picture;
      }
    }

    let statusCode = 200;
    let message = 'Signed in with Google';

    if (!user) {
      const name = (payload.name || email.split('@')[0]).slice(0, 60);
      user = new User({
        name,
        email,
        username: await generateUsername(name),
        // Random password nobody knows: the account signs in with Google (or sets one via "Forgot password")
        password: crypto.randomBytes(32).toString('hex'),
        role: ROLES.READER, // never auto-create writers or admins
        isEmailVerified: true,
        googleId: payload.sub,
        avatar: payload.picture || ''
      });
      statusCode = 201;
      message = 'Account created with Google';
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      return sendError(res, 403, 'Your account has been suspended. Please contact support.');
    }

    user.lastLoginAt = Date.now();
    await user.save({ validateBeforeSave: statusCode === 201 });

    return sendTokenResponse(user, statusCode, res, message, { remember: wantsRemember(remember) });
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
  checkResetToken,
  resetPassword,
  googleSignIn,
  updateProfile,
  logout
};
