const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, { statusCode: 409, message: 'Email already registered.' });
    }

    // Prevent creating admin via public API unless first user
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : (role === 'admin' ? 'user' : role || 'user');

    const user = await User.create({ name, email, password, role: assignedRole });

    const { accessToken, refreshToken } = generateTokenPair(user._id, user.role);

    // Store hashed refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`New user registered: ${email} [${assignedRole}]`);

    return successResponse(res, {
      statusCode: 201,
      message: 'Registration successful',
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, { statusCode: 401, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return errorResponse(res, { statusCode: 403, message: 'Account deactivated. Contact support.' });
    }

    const { accessToken, refreshToken } = generateTokenPair(user._id, user.role);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email}`);

    return successResponse(res, {
      message: 'Login successful',
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return errorResponse(res, { statusCode: 400, message: 'Refresh token is required.' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return errorResponse(res, { statusCode: 401, message: 'Invalid or expired refresh token.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id, user.role);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, {
      message: 'Token refreshed',
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, { statusCode: 401, message: 'Invalid or expired refresh token.' });
    }
    next(error);
  }
};

// POST /api/v1/auth/logout
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }
    return successResponse(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('taskCount');
    return successResponse(res, { data: { user } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/auth/update-profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (exists) return errorResponse(res, { statusCode: 409, message: 'Email already in use.' });
      updates.email = email;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return successResponse(res, { message: 'Profile updated', data: { user } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return errorResponse(res, { statusCode: 401, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    const { accessToken, refreshToken } = generateTokenPair(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, {
      message: 'Password changed successfully',
      data: { accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, updateProfile, changePassword };
