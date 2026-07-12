require("dotenv").config();

const app = require("./src/app");

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log("==========================================");
  console.log("TransitOps backend started successfully");
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Health API: http://localhost:${PORT}/api/v1/health`);
  console.log("==========================================");
});