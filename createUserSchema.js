const pool = require('./db');
const catchAsync = require('./middlewares/catchAsync');

console.log({pool});

async function createUserSchema() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start a transaction

    // Create the texts table
    await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      confirm_password TEXT NOT NULL
      )
    `);

    await client.query('COMMIT'); // Commit the transaction
    console.log('Users schema created successfully.');
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction on error
    console.error('Error creating tasks schema:', error);
  } finally {
    client.release(); // Release the client back to the pool
  }
}

// Use catchAsync to handle errors
const asyncCreateUserSchema = catchAsync(createUserSchema);

// Run the tasks schema creation
asyncCreateUserSchema();
