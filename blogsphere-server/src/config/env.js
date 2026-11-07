const path = require('path');
const dotenv = require('dotenv');

// Always load blogsphere-server/.env, no matter which folder the command is run from
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const DEV_LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/blogsphere';

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv,
  clientUrl,
  // Browser origins allowed by CORS: CLIENT_URL plus any in CORS_ORIGINS (comma-separated)
  corsOrigins: [clientUrl, ...(process.env.CORS_ORIGINS || '').split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean)],
  // Public address of the website (used for sitemap links). Defaults to CLIENT_URL.
  siteUrl: (process.env.SITE_URL || clientUrl).replace(/\/+$/, ''),
  // Where contact-form notifications go (optional)
  contactEmail: process.env.CONTACT_EMAIL || '',
  // No silent fallback: config/db.js decides what to do when this is missing
  mongoUri: (process.env.MONGODB_URI || '').trim(),
  devLocalMongoUri: DEV_LOCAL_MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_blogsphere_jwt_key',
  jwtSecretIsDefault: !process.env.JWT_SECRET,
  // Default lifetime (used for new registrations)
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 7,
  // "Remember me" ticked: long-lived token kept in localStorage
  jwtExpireRemember: process.env.JWT_EXPIRE_REMEMBER || '30d',
  // "Remember me" not ticked: short token kept in sessionStorage (gone when the browser closes)
  jwtExpireSession: process.env.JWT_EXPIRE_SESSION || '1d',
  // Outgoing email (password reset, verification, contact notifications)
  smtp: {
    host: (process.env.SMTP_HOST || '').trim(),
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: (process.env.SMTP_USER || '').trim(),
    pass: process.env.SMTP_PASS || ''
  },
  fromEmail: process.env.FROM_EMAIL || 'noreply@blogsphere.local',
  fromName: process.env.FROM_NAME || 'BlogSphere Mag',
  // Google sign-in (optional). Leave empty to disable the "Continue with Google" route.
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim()
};

env.smtpConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

module.exports = env;
