const env = require("../config/env");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");

/**
 * Central Error Handling Middleware
 * Catches all errors from async handlers, validation, or synchronous code
 */
const errorHandler = (err, req, res, next) => {
  // If headers were already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;
  let code = err.code || null;

  // Handle JSON parse syntax errors (e.g. malformed JSON body)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON payload provided";
    code = "INVALID_JSON";
  }

  // Handle Zod validation errors if thrown directly
  if (err.name === "ZodError" && Array.isArray(err.issues)) {
    statusCode = 400;
    message = "Validation Error";
    code = "VALIDATION_ERROR";
    details = err.issues.map((issue) => ({
      field: issue.path.join(".") || "unknown",
      message: issue.message,
    }));
  }

  // Handle Axios upstream communication errors if thrown directly
  if (err.isAxiosError) {
    statusCode = err.response ? 502 : 504;
    message = `Upstream service error: ${err.message}`;
    code = "UPSTREAM_SERVICE_ERROR";
    details = err.response ? err.response.data : null;
  }

  // In production, mask unexpected 500 internal error details
  const isDev = env.NODE_ENV === "development";
  const finalMessage = statusCode === 500 && !isDev && !err.isOperational
    ? "An unexpected internal server error occurred"
    : message;

  // Structured console log for monitoring
  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ❌ ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
    if (isDev && err.stack) {
      console.error(err.stack);
    }
  } else {
    console.warn(`[${new Date().toISOString()}] ⚠️ ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
  }

  return ApiResponse.error(res, {
    statusCode,
    message: finalMessage,
    details,
    code,
    stack: isDev ? err.stack : undefined,
  });
};

module.exports = errorHandler;
