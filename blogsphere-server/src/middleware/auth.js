const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { USER_STATUS } = require('../constants/roles');
const { sendError } = require('../utils/response');

// Protect routes - verifies JWT
const protect = async (req, res, next) => {
  let token;

  // 1. Check header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Or check cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return sendError(res, 401, 'Not authorized to access this route. Please sign in.');
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 401, 'The account belonging to this token no longer exists.');
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      return sendError(res, 403, 'Your account has been suspended. Please contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Not authorized to access this route. Token invalid or expired.');
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Role (${req.user ? req.user.role : 'unauthenticated'}) is not authorized to perform this action.`
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
