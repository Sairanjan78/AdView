const env = require('../config/env');

const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};

// Sets HTTP-Only cookie and sends JSON response with token
const sendTokenResponse = (user, statusCode, res, message = 'Authentication successful') => {
  const token = user.getSignedJwtToken();

  const cookieOptions = {
    expires: new Date(Date.now() + env.jwtCookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax'
  };

  const userSafe = {
    id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    avatar: user.avatar,
    bio: user.bio,
    socialLinks: user.socialLinks,
    monetization: user.monetization,
    createdAt: user.createdAt
  };

  return res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      data: {
        user: userSafe
      }
    });
};

module.exports = {
  sendSuccess,
  sendError,
  sendTokenResponse
};
