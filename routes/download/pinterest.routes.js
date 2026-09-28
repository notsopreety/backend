const express = require("express");
const router = express.Router();

const pinterestController = require("../../controllers/download/pinterest.controller");
const validate = require("../../middlewares/validate");
const cache = require("../../middlewares/cache");
const { strictLimiter } = require("../../middlewares/rateLimiter");
const cacheConfig = require("../../config/cache.config");
const { pinterestDownloadSchema } = require("../../schemas/download/pinterest.schema");

/**
 * Pinterest Download Routes
 * Base mount point: /api/download/pinterest
 */

// GET /api/download/pinterest?url=...
router.get(
  "/",
  strictLimiter,
  cache(cacheConfig.presets.standard),
  validate({ query: pinterestDownloadSchema }),
  pinterestController.getDownload
);

// GET /api/download/pinterest/download?url=... (Alias)
router.get(
  "/download",
  strictLimiter,
  cache(cacheConfig.presets.standard),
  validate({ query: pinterestDownloadSchema }),
  pinterestController.getDownload
);

// POST /api/download/pinterest
router.post(
  "/",
  strictLimiter,
  cache(cacheConfig.presets.standard),
  validate({ body: pinterestDownloadSchema }),
  pinterestController.postDownload
);

// POST /api/download/pinterest/download (Alias)
router.post(
  "/download",
  strictLimiter,
  cache(cacheConfig.presets.standard),
  validate({ body: pinterestDownloadSchema }),
  pinterestController.postDownload
);

module.exports = router;
