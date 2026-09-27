/**
 * Custom Operational API Error Class
 * Distinguishes operational errors (expected client/server conditions)
 * from programmatic runtime bugs.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {any} [details=null] - Additional error details (e.g., validation issues)
   * @param {boolean} [isOperational=true] - Whether this error is operational
   */
  constructor(statusCode = 500, message = "Internal Server Error", details = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request", details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized", details = null) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = "Forbidden", details = null) {
    return new ApiError(403, message, details);
  }

  static notFound(message = "Resource Not Found", details = null) {
    return new ApiError(404, message, details);
  }

  static conflict(message = "Conflict", details = null) {
    return new ApiError(409, message, details);
  }

  static unprocessableEntity(message = "Unprocessable Entity", details = null) {
    return new ApiError(422, message, details);
  }

  static tooManyRequests(message = "Too Many Requests. Please slow down.", details = null) {
    return new ApiError(429, message, details);
  }

  static internal(message = "Internal Server Error", details = null) {
    return new ApiError(500, message, details, false);
  }

  static badGateway(message = "Upstream Service Error", details = null) {
    return new ApiError(502, message, details);
  }

  static gatewayTimeout(message = "Gateway Timeout", details = null) {
    return new ApiError(504, message, details);
  }
}

module.exports = ApiError;
