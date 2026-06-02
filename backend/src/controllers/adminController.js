const User = require('../models/User');
const Task = require('../models/Task');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// GET /api/v1/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    return paginatedResponse(res, { data: users, total, page, limit });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('taskCount');
    if (!user) return errorResponse(res, { statusCode: 404, message: 'User not found.' });
    return successResponse(res, { data: { user } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, { statusCode: 404, message: 'User not found.' });
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, { statusCode: 400, message: 'Cannot change your own status.' });
    }
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    return successResponse(res, {
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/users/:id/role
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return errorResponse(res, { statusCode: 400, message: 'Invalid role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
    if (!user) return errorResponse(res, { statusCode: 404, message: 'User not found.' });
    return successResponse(res, { message: 'Role updated', data: { user } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTasks, activeUsers, tasksByStatus] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      User.countDocuments({ isActive: true }),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt');

    return successResponse(res, {
      data: {
        totalUsers,
        totalTasks,
        activeUsers,
        tasksByStatus: tasksByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, toggleUserStatus, changeUserRole, getDashboardStats };
