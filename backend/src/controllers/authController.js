const errorMiddleware = (error, req, res, next) => {
  console.error("TransitOps server error:", error);

  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "A record with the same unique value already exists";
  }

  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    statusCode = 400;
    message = "The selected related record does not exist";
  }

  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    statusCode = 409;
    message =
      "This record cannot be deleted because other records depend on it";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorMiddleware;