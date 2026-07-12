const mysql = require("mysql2/promise");

// Create a MySQL connection pool.
//
// A connection pool manages multiple database connections.
// The actual database connection will be tested later.
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "transitops",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export the pool so controllers can use it later.
module.exports = db;