const jwt = require('jsonwebtoken');
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

/**
 * Sets an HTTP-only cookie and sends the JSON response with the token.
 * options.remember: true  -> JWT_EXPIRE_REMEMBER token (default 30d) + persistent cookie
 *                   false -> JWT_EXPIRE_SESSION token (default 1d) + browser-session cookie
 *                   undefined -> JWT_EXPIRE / JWT_COOKIE_EXPIRE (registration)
 */
const sendTokenResponse = (user, statusCode, res, message = 'Authentication successful', options = {}) => {
  const { remember } = options;
  let expiresIn = env.jwtExpire;
  if (remember === true) expiresIn = env.jwtExpireRemember;
  if (remember === false) expiresIn = env.jwtExpireSession;

  const token = user.getSignedJwtToken(expiresIn);
  const { exp } = jwt.decode(token);

  const cookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax'
  };
  if (remember === true) {
    cookieOptions.expires = new Date(exp * 1000);
  } else if (remember !== false) {
    cookieOptions.expires = new Date(Date.now() + env.jwtCookieExpire * 24 * 60 * 60 * 1000);
  }

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
      expiresAt: new Date(exp * 1000).toISOString(),
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
