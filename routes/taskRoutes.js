const express = require('express');
const {
  createTask,
  getTasksForAUser,
  getTask,
  deleteTask,
  updateTask,
} = require('../controllers/taskController');
const { protect } = require('../controllers/userController');

const router = express.Router();

router.get('/', protect, getTasksForAUser);
router.post('/create-task', protect, createTask);
router
  .route('/:id')
  .get(protect, getTask)
  .delete(protect, deleteTask)
  .patch(protect, updateTask);

module.exports = router;
