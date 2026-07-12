const mysql = require("mysql2/promise");

const requiredEnvironmentVariables = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
];

const missingEnvironmentVariables =
  requiredEnvironmentVariables.filter(
    (variableName) => !process.env[variableName]
  );

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing database environment variables: ${missingEnvironmentVariables.join(
      ", "
    )}`
  );
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  decimalNumbers: true,
});

module.exports = pool;