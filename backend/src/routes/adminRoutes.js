const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, toggleUserStatus, changeUserRole, getDashboardStats } = require('../controllers/adminController');
const { getAllTasks } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.patch('/users/:id/role', changeUserRole);
router.get('/tasks', getAllTasks);

module.exports = router;
