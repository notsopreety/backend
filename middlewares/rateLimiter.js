const { rateLimit } = require("express-rate-limit");
const rateLimitConfig = require("../config/rateLimit.config");

/**
 * Global rate limiter for the entire app
 */
const globalLimiter = rateLimit(rateLimitConfig.global);

/**
 * Strict rate limiter for CPU/network intensive routes (e.g. video scrapers, parsers)
 */
const strictLimiter = rateLimit(rateLimitConfig.strict);

/**
 * Custom rate limiter factory
 * @param {Object} customOptions
 */
const createRateLimiter = (customOptions = {}) => {
  return rateLimit({
    ...rateLimitConfig.global,
    ...customOptions,
  });
};

module.exports = {
  globalLimiter,
  strictLimiter,
  createRateLimiter,
};
