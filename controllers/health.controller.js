const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");

class HealthController {
  check = asyncHandler(async (req, res) => {
    const memoryUsage = process.memoryUsage();
    
    return ApiResponse.success(res, {
      message: "Server is healthy and running",
      data: {
        status: "UP",
        uptimeSeconds: Math.floor(process.uptime()),
        environment: env.NODE_ENV,
        nodeVersion: process.version,
        memoryUsageMB: {
          rss: +(memoryUsage.rss / 1024 / 1024).toFixed(2),
          heapUsed: +(memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
          heapTotal: +(memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        },
      },
    });
  });
}

module.exports = new HealthController();
