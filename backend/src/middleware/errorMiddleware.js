// Global Centralized Error Handling Middleware
function errorMiddleware(err, req, res, next) {
  console.error('SERVER_ERROR_LOG:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}

module.exports = errorMiddleware;
