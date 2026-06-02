const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, archiveTask, getTaskStats } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskValidator, updateTaskValidator, listTasksValidator } = require('../validators/taskValidators');

router.use(protect);

router.get('/stats', getTaskStats);
router.get('/', listTasksValidator, validate, getTasks);
router.post('/', createTaskValidator, validate, createTask);
router.get('/:id', getTask);
router.put('/:id', updateTaskValidator, validate, updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/archive', archiveTask);

module.exports = router;
