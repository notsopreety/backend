const aiService = require("../services/ai.service");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

/**
 * AI Controller (DuckGPT)
 */
class AiController {
  /**
   * Handle Chat (GET & POST)
   * GET /api/ai/chat?prompt=...&model=...&history=[...]
   * POST /api/ai/chat { prompt, model, history, system }
   */
  chat = asyncHandler(async (req, res) => {
    const isGet = req.method === "GET";
    const payload = isGet ? req.query : req.body;

    const { prompt, model, history, system } = payload;

    const result = await aiService.chat({
      prompt,
      model,
      history,
      system,
    });

    return ApiResponse.success(res, {
      message: "AI response generated successfully",
      data: result,
    });
  });

  /**
   * GET /api/ai/models
   * Catalog of supported Workers AI / DuckGPT models
   */
  getModels = asyncHandler(async (req, res) => {
    const models = aiService.getModels();

    return ApiResponse.success(res, {
      message: "Supported AI models retrieved successfully",
      data: {
        total: models.length,
        models,
      },
    });
  });
}

module.exports = new AiController();
