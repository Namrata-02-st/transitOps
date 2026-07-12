const express = require("express");
const cors = require("cors");

const app = express();

// Hide the default Express technology header.
app.disable("x-powered-by");

// Allow requests from the React frontend.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// Convert incoming JSON request bodies into JavaScript objects.
app.use(express.json());

// Simple root route.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the TransitOps API",
  });
});

// Health-check route used to confirm that the backend is running.
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TransitOps API is running",
    data: {
      service: "backend",
      status: "healthy",
    },
  });
});

module.exports = app;