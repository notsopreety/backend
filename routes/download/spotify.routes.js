const express = require("express");
const router = express.Router();

const spotifyController = require("../../controllers/download/spotify.controller");
const validate = require("../../middlewares/validate");
const cache = require("../../middlewares/cache");
const { strictLimiter } = require("../../middlewares/rateLimiter");
const cacheConfig = require("../../config/cache.config");
const { spotifyDownloadSchema } = require("../../schemas/download/spotify.schema");

/**
 * Spotify Download Routes
 * Base mount point: /api/download/spotify
 */

// GET /api/download/spotify?url=...
router.get(
  "/",
  strictLimiter,
  cache(cacheConfig.presets.standard),
  validate({ query: spotifyDownloadSchema }),
  spotifyController.getDownload
);

// GET /api/download/spotify/download?url=... (Alias)
router.get(
  "/download",
  strictLimiter,
  cache(cacheConfig.presets.standard),
  validate({ query: spotifyDownloadSchema }),
  spotifyController.getDownload
);

// POST /api/download/spotify
router.post(
  "/",
  strictLimiter,
  cache(cacheConfig.presets.standard),
  validate({ body: spotifyDownloadSchema }),
  spotifyController.postDownload
);

// POST /api/download/spotify/download (Alias)
router.post(
  "/download",
  strictLimiter,
  cache(cacheConfig.presets.standard),
  validate({ body: spotifyDownloadSchema }),
  spotifyController.postDownload
);

module.exports = router;
