/**
 * Standardized API Response Helper
 */
class ApiResponse {
  /**
   * Send a successful response
   * @param {import('express').Response} res
   * @param {Object} options
   * @param {number} [options.statusCode=200]
   * @param {string} [options.message='Success']
   * @param {any} [options.data=null]
   * @param {Object} [options.meta=null]
   */
  static success(res, { statusCode = 200, message = "Success", data = null, meta = null } = {}) {
    const responsePayload = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...(meta || {}),
      },
    };

    return res.status(statusCode).json(responsePayload);
  }

  /**
   * Send a created response (HTTP 201)
   */
  static created(res, { message = "Resource created successfully", data = null, meta = null } = {}) {
    return ApiResponse.success(res, { statusCode: 201, message, data, meta });
  }

  /**
   * Send an error response
   * @param {import('express').Response} res
   * @param {Object} options
   * @param {number} [options.statusCode=500]
   * @param {string} [options.message='Internal Server Error']
   * @param {any} [options.details=null]
   * @param {string} [options.code=null]
   * @param {string} [options.stack=null]
   */
  static error(res, { statusCode = 500, message = "Internal Server Error", details = null, code = null, stack = null } = {}) {
    const responsePayload = {
      success: false,
      error: {
        message,
        code: code || `HTTP_${statusCode}`,
        details: details || null,
        ...(stack ? { stack } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return res.status(statusCode).json(responsePayload);
  }
}

module.exports = ApiResponse;
