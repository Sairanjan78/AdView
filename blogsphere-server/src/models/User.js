const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');
const env = require('../config/env');
const { ROLES, USER_STATUS } = require('../constants/roles');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email address']
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.READER
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // Set whenever the password changes; tokens issued before it stop working
    passwordChangedAt: Date,
    // Google account linked through "Continue with Google" (the ID token's `sub`)
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: ''
    },
    socialLinks: {
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
      github: { type: String, default: '' }
    },
    // Public writer profile stats (shown on writer cards / profile page)
    followers: {
      type: Number,
      default: 0,
      min: 0
    },
    verified: {
      type: Boolean,
      default: false
    },
    nicheSpecialties: [
      {
        type: String,
        trim: true
      }
    ],
    // Architecture hook for Phase 7 (Writer Monetization)
    monetization: {
      isEligible: { type: Boolean, default: false },
      estimatedEarnings: { type: Number, default: 0 },
      finalizedEarnings: { type: Number, default: 0 },
      totalWithdrawn: { type: Number, default: 0 }
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    // 1s back so a token signed right after the change is still valid (JWT iat has 1s precision)
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// True when the password was changed after the given JWT `iat` (seconds)
UserSchema.methods.changedPasswordAfter = function (jwtIssuedAt) {
  if (!this.passwordChangedAt || !jwtIssuedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAt;
};

// Sign JWT and return. expiresIn defaults to JWT_EXPIRE ("remember me" passes its own lifetime)
UserSchema.methods.getSignedJwtToken = function (expiresIn = env.jwtExpire) {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      username: this.username
    },
    env.jwtSecret,
    {
      expiresIn
    }
  );
};

// Generate email verification token (SHA-256 hash stored)
UserSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
