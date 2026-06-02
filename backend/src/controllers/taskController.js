const Task = require('../models/Task');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// GET /api/v1/tasks
const getTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, priority, search, sortBy = 'createdAt', order = 'desc', archived } = req.query;

    const filter = { owner: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (archived !== undefined) filter.isArchived = archived === 'true';
    else filter.isArchived = false;

    if (search) {
      filter.$text = { $search: search };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sortOptions).skip(skip).limit(parseInt(limit)).lean({ virtuals: true }),
      Task.countDocuments(filter),
    ]);

    return paginatedResponse(res, { data: tasks, total, page, limit });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id }).lean({ virtuals: true });
    if (!task) return errorResponse(res, { statusCode: 404, message: 'Task not found.' });
    return successResponse(res, { data: { task } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;
    const task = await Task.create({ title, description, status, priority, dueDate, tags, owner: req.user._id });
    logger.info(`Task created: ${task._id} by user: ${req.user._id}`);
    return successResponse(res, { statusCode: 201, message: 'Task created successfully', data: { task } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
    const updates = {};
    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).lean({ virtuals: true });

    if (!task) return errorResponse(res, { statusCode: 404, message: 'Task not found.' });
    return successResponse(res, { message: 'Task updated', data: { task } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task) return errorResponse(res, { statusCode: 404, message: 'Task not found.' });
    logger.info(`Task deleted: ${req.params.id} by user: ${req.user._id}`);
    return successResponse(res, { message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/tasks/:id/archive
const archiveTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isArchived: true },
      { new: true }
    );
    if (!task) return errorResponse(res, { statusCode: 404, message: 'Task not found.' });
    return successResponse(res, { message: 'Task archived', data: { task } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/tasks/stats (user stats)
const getTaskStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { owner: req.user._id, isArchived: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { owner: req.user._id, isArchived: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const overdue = await Task.countDocuments({
      owner: req.user._id,
      isArchived: false,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() },
    });

    const formattedStats = stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
    const formattedPriority = priorityStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});

    return successResponse(res, {
      data: {
        byStatus: {
          todo: formattedStats.todo || 0,
          'in-progress': formattedStats['in-progress'] || 0,
          done: formattedStats.done || 0,
        },
        byPriority: {
          low: formattedPriority.low || 0,
          medium: formattedPriority.medium || 0,
          high: formattedPriority.high || 0,
        },
        overdue,
        total: Object.values(formattedStats).reduce((a, b) => a + b, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---- ADMIN ONLY ----

// GET /api/v1/admin/tasks
const getAllTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, userId, status } = req.query;
    const filter = {};
    if (userId) filter.owner = userId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter).populate('owner', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    return paginatedResponse(res, { data: tasks, total, page, limit });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, archiveTask, getTaskStats, getAllTasks };
