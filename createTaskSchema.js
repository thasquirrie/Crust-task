const pool = require('./db');
const catchAsync = require('./middlewares/catchAsync');

async function createTasksSchema() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start a transaction

    // Create the texts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.query('COMMIT'); // Commit the transaction
    console.log('Tasks schema created successfully.');
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction on error
    console.error('Error creating tasks schema:', error);
  } finally {
    client.release(); // Release the client back to the pool
  }
}

// Use catchAsync to handle errors
const asyncCreateTasksSchema = catchAsync(createTasksSchema);

// Run the tasks schema creation
asyncCreateTasksSchema();
