export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  console.error("🔥 Error Captured:", {
    message: err.message,
    statusCode,
    stack: err.stack,
  });

  res.status(statusCode).json({
    status,
    error: err.message || "An unexpected system discrepancy has occurred.",
  });
};
