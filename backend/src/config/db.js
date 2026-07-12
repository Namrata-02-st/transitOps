const mysql = require('mysql2/promise');
require('dotenv').config();

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transitops_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Forces MySQL to return dates as strings in YYYY-MM-DD format
});

// Test the connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database Connected Successfully to MySQL!');
    connection.release();
  } catch (error) {
    console.error('Database connection failed! Error details:');
    console.error(error.message);
    console.error('Make sure MySQL Server is running and the database "transitops_db" exists.');
  }
}

testConnection();

module.exports = pool;
