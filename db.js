const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({
  path: 'config.env'
})

console.log('Host:', process.env.HOST);


const pool = new Pool({
  user: process.env.USER, 
  host: process.env.HOST,   
  database: process.env.DATABASE,   
  password: process.env.PASSWORD, 
  port: process.env.DATABASE_PORT           
});

module.exports = pool;