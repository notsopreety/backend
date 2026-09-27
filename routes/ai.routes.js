const express = require("express");
const router = express.Router();

const aiController = require("../controllers/ai.controller");
const validate = require("../middlewares/validate");
const { strictLimiter } = require("../middlewares/rateLimiter");
const { aiChatQuerySchema, aiChatBodySchema } = require("../schemas/ai.schema");

/**
 * AI Routes (DuckGPT / Workers AI)
 * Base mount point: /api/ai
 */

// GET /api/ai/chat?prompt=...&model=...&history=...
router.get(
  "/chat",
  strictLimiter,
  validate({ query: aiChatQuerySchema }),
  aiController.chat
);

// POST /api/ai/chat
router.post(
  "/chat",
  strictLimiter,
  validate({ body: aiChatBodySchema }),
  aiController.chat
);

// GET /api/ai/models - List supported AI models
router.get("/models", aiController.getModels);

// GET /api/ai - Overview
router.get("/", aiController.getModels);

module.exports = router;
