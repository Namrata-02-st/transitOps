// Load variables from the .env file.
require("dotenv").config();

// Import the Express application.
const app = require("./src/app");

// Use the port from .env or use 5000 by default.
const PORT = process.env.PORT || 5000;

// Start the backend server.
app.listen(PORT, () => {
  console.log("====================================");
  console.log("TransitOps backend started");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/v1/health`);
  console.log("====================================");
});