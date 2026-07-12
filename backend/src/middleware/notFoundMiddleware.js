// 404 Route Not Found Middleware
function notFoundMiddleware(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: [${req.method}] ${req.originalUrl}`
  });
}

module.exports = notFoundMiddleware;
