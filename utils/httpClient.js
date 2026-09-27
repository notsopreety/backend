const axios = require("axios");
const ApiError = require("./apiError");

/**
 * Pre-configured Axios instance with realistic headers and standard timeout
 */
const httpClient = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
  },
});

/**
 * Translates upstream Axios errors into operational ApiErrors
 * @param {Error} error
 * @param {string} serviceName
 */
httpClient.handleAxiosError = (error, serviceName = "External Service") => {
  if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
    return ApiError.gatewayTimeout(`${serviceName} request timed out`);
  }

  if (error.response) {
    const status = error.response.status;
    const msg = `${serviceName} responded with status ${status}`;
    return new ApiError(status >= 500 ? 502 : status, msg, {
      upstreamData: error.response.data,
      upstreamStatus: status,
    });
  }

  if (error.request) {
    return ApiError.badGateway(`No response received from ${serviceName}`);
  }

  return ApiError.internal(`Failed to communicate with ${serviceName}: ${error.message}`);
};

module.exports = httpClient;
