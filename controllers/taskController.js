const pool = require('../db.js');
const AppError = require('../middlewares/appError');
const catchAsync = require('../middlewares/catchAsync');

exports.createTask = catchAsync(async (req, res, next) => {
  const { id: user_id } = req.user;
  const { title, description } = req.body;

  if (!title || !description)
    return next(new AppError('Please provide both fields to continue', 400));

  const insertQuery =
    'INSERT INTO tasks (title, description, user_id) VALUES ($1, $2, $3) RETURNING *';

  const values = [title, description, user_id];

  const task = await new Promise((resolve, reject) => {
    pool.query(insertQuery, values, (error, result) => {
      console.log({ error });
      if (error) return next(new AppError(error, 400));

      resolve(result.rows[0]);
    });
  });

  res.status(201).json({
    status: 'success',
    message: 'Task created successfully',
    data: {
      task,
    },
  });
});

exports.getTasksForAUser = catchAsync(async (req, res, next) => {
  const { id: user_id } = req.user;

  console.log({ user_id });

  const tasks = await new Promise((resolve, reject) => {
    pool.query(
      `SELECT * FROM tasks WHERE user_id = $1`,
      [user_id],
      (error, result) => {
        if (error) return next(new AppError(error, 400));

        resolve(result.rows);
      }
    );
  });

  res.status(200).json({
    status: 'success',
    length: tasks.length,
    data: {
      tasks,
    },
  });
});

exports.getTask = catchAsync(async (req, res, next) => {
  const { id: user_id } = req.user;
  const { id } = req.params;

  console.log({id, user_id});

  const fetchQuery = `SELECT * FROM tasks WHERE id = $1 AND user_id = $2`;

  const task = await new Promise((resolve, reject) => {
    pool.query(fetchQuery, [id, user_id], (error, result) => {
      if (error) return next(new AppError(error, 400));

      resolve(result.rows[0]);
    });
  });

  if (!task) return next(new AppError('Task not found or you do not have authorization to view the task', 404));

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  }); 
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const { id: user_id } = req.user;
  const { id } = req.params;

  console.log({user_id, id});

  const fieldsToUpdate = Object.keys(req.body);
  const clauses = fieldsToUpdate.map((fields, index) => `${fields} = $${index + 3}`).join(', ');
  
  console.log({ clauses });

  const updateQuery = `UPDATE tasks SET ${clauses} WHERE id = $1 AND user_id = $2 RETURNING *`;

  const task = await new Promise((resolve, reject) => {
    pool.query(
      updateQuery,
      [id, user_id, ...fieldsToUpdate.map((field) => req.body[field])],
      (error, result) => {
        if (error) return next(new AppError(error, 400));

        resolve(result.rows[0]);
      }
    );
  });

  console.log({task});

  if (!task) return next(new AppError('Error updating task', 400));

  res.status(200).json({
    status: 'success',
    message: 'Task updated successfully',
    data: {
      task,
    },
  });
  });

exports.deleteTask = catchAsync(async (req, res, next) => {
  const { id: user_id } = req.user;
  const { id } = req.params;

  const deleteQuery = `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *`;
  const task = await new Promise((resolve, reject) => {
    pool.query(deleteQuery, [id, user_id], (error, result) => {
      if (error) return next(new AppError(error, 400));

      resolve(result.rows[0]);
    });
  });

  console.log({ task });

  if (!task) return next(new AppError('Task not found or you do not have permission to delete this task.', 404));

  res.status(200).json({
    status: 'success',
    message: 'Task deleted successfully',
  });
});
