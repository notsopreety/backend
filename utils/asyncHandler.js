/**
 * Wraps async controller methods to catch and forward errors to Express next()
 * Eliminates repetitive try-catch blocks in controllers.
 * 
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
