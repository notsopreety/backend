const env = require("./env");
const ApiResponse = require("../utils/apiResponse");

/**
 * Standard handler when rate limit is exceeded
 */
const rateLimitHandler = (req, res, next, options) => {
  return ApiResponse.error(res, {
    statusCode: options.statusCode || 429,
    message: options.message || "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
    details: {
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    },
  });
};

/**
 * Rate limit configurations
 */
const rateLimitConfig = {
  global: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: rateLimitHandler,
    message: "Global rate limit exceeded. Please wait before making more requests.",
  },
  strict: {
    windowMs: env.STRICT_RATE_LIMIT_WINDOW_MS,
    limit: env.STRICT_RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: rateLimitHandler,
    message: "Strict rate limit exceeded for this endpoint. Please slow down.",
  },
};

module.exports = rateLimitConfig;
