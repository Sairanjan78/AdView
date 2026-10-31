const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blogsphere',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_blogsphere_jwt_key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 7,
  fromEmail: process.env.FROM_EMAIL || 'noreply@blogsphere.local',
  fromName: process.env.FROM_NAME || 'BlogSphere'
};

module.exports = env;
