const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return errorResponse(res, { statusCode: 401, message: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch user from DB
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return errorResponse(res, { statusCode: 401, message: 'User belonging to this token no longer exists.' });
    }

    if (!user.isActive) {
      return errorResponse(res, { statusCode: 401, message: 'Your account has been deactivated.' });
    }

    // Check if password changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return errorResponse(res, { statusCode: 401, message: 'Password recently changed. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn(`Auth middleware error: ${error.message}`);
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, { statusCode: 401, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, { statusCode: 401, message: 'Token expired. Please log in again.' });
    }
    return errorResponse(res, { statusCode: 401, message: 'Authentication failed.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, {
        statusCode: 403,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
