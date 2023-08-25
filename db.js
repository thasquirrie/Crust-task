const { Pool } = require('pg');

const pool = new Pool({
  user: 'thasquirrie', 
  host: 'localhost',   
  database: 'crust',   
  password: 'bigdad', 
  port: 5432           
});

module.exports = pool;