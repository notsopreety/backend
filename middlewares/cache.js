const memoryCache = require("../utils/cache");
const cacheConfig = require("../config/cache.config");

/**
 * Express middleware to cache route responses in-memory
 * 
 * @param {number|Object} [options=300] - TTL in seconds or options object
 * @param {number} [options.ttl=300] - TTL in seconds
 * @param {Function} [options.keyGenerator] - Custom key generation function (req) => string
 * @returns {import('express').RequestHandler}
 */
const cacheMiddleware = (options = cacheConfig.defaultTTL) => {
  const ttl = typeof options === "number" ? options : options.ttl || cacheConfig.defaultTTL;
  const customKeyGenerator = typeof options === "object" ? options.keyGenerator : null;

  return (req, res, next) => {
    // Skip if cache disabled or client requests bypass via header/query
    if (
      !cacheConfig.enabled ||
      req.headers["x-no-cache"] === "true" ||
      req.query.noCache === "true"
    ) {
      res.setHeader("X-Cache", "BYPASS");
      return next();
    }

    // Generate unique cache key
    let cacheKey;
    if (typeof customKeyGenerator === "function") {
      cacheKey = customKeyGenerator(req);
    } else if (req.method === "GET") {
      cacheKey = `GET:${req.originalUrl}`;
    } else if (req.method === "POST") {
      cacheKey = `POST:${req.originalUrl}:${JSON.stringify(req.body || {})}`;
    } else {
      // Non-GET/POST methods bypass cache
      res.setHeader("X-Cache", "BYPASS");
      return next();
    }

    // Check if key exists in cache
    const cachedResponse = memoryCache.get(cacheKey);

    if (cachedResponse) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("X-Cache-TTL", ttl);
      return res.status(200).json(cachedResponse);
    }

    // Cache MISS: intercept res.json to capture response payload
    res.setHeader("X-Cache", "MISS");
    res.setHeader("X-Cache-TTL", ttl);

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only cache successful 2xx responses
      if (res.statusCode >= 200 && res.statusCode < 300 && body) {
        memoryCache.set(cacheKey, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = cacheMiddleware;
