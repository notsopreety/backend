const env = require("./env");

/**
 * Cache Configuration
 */
const cacheConfig = {
  enabled: process.env.CACHE_ENABLED !== "false", // enabled by default
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL_SECONDS || "300", 10), // 5 minutes default
  presets: {
    short: 60,         // 1 minute (for fast changing data)
    standard: 300,     // 5 minutes (for media downloads, links)
    long: 3600,        // 1 hour (for search results)
    calendar: 86400,   // 24 hours (for daily calendar/patro)
  },
};

module.exports = cacheConfig;
