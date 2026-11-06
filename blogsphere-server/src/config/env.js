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
  // Public address of the website (used for sitemap links). Defaults to CLIENT_URL.
  siteUrl: (process.env.SITE_URL || clientUrl).replace(/\/+$/, ''),
  // Where contact-form notifications go (optional)
  contactEmail: process.env.CONTACT_EMAIL || '',
  // No silent fallback: config/db.js decides what to do when this is missing
  mongoUri: (process.env.MONGODB_URI || '').trim(),
  devLocalMongoUri: DEV_LOCAL_MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_blogsphere_jwt_key',
  jwtSecretIsDefault: !process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 7,
  fromEmail: process.env.FROM_EMAIL || 'noreply@blogsphere.local',
  fromName: process.env.FROM_NAME || 'BlogSphere'
};

module.exports = env;
