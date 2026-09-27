const express = require("express");
const router = express.Router();

const patroController = require("../controllers/patro.controller");
const validate = require("../middlewares/validate");
const cache = require("../middlewares/cache");
const cacheConfig = require("../config/cache.config");
const { strictLimiter } = require("../middlewares/rateLimiter");
const { patroQuerySchema } = require("../schemas/patro.schema");

/**
 * Patro Routes
 * Base mount point: /api/patro
 */

// GET /api/patro/detailed
router.get(
  "/detailed",
  strictLimiter,
  cache(cacheConfig.presets.calendar),
  validate({ query: patroQuerySchema }),
  patroController.getDetailed
);

// GET /api/patro (Default alias to detailed)
router.get(
  "/",
  strictLimiter,
  cache(cacheConfig.presets.calendar),
  validate({ query: patroQuerySchema }),
  patroController.getDetailed
);

module.exports = router;
