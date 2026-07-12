const express = require("express");
const cors = require("cors");

// Create the Express application.
const app = express();

// Remove the default Express header.
app.disable("x-powered-by");

// Allow the React frontend to communicate with the backend.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// Allow the server to receive JSON data.
app.use(express.json());

// Root testing route.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the TransitOps API",
  });
});

// Backend health-check route.
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TransitOps backend is running properly",
    data: {
      project: "TransitOps",
      service: "Backend API",
      status: "Healthy",
    },
  });
});

// Export the Express application.
module.exports = app;