const pinterestService = require("../../services/download/pinterest.service");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * Pinterest Controller
 */
class PinterestController {
  /**
   * Handle GET /api/download/pinterest?url=...
   */
  getDownload = asyncHandler(async (req, res) => {
    const { url } = req.query;
    const data = await pinterestService.fetchPin(url);

    return ApiResponse.success(res, {
      message: "Pinterest media retrieved successfully",
      data,
    });
  });

  /**
   * Handle POST /api/download/pinterest
   */
  postDownload = asyncHandler(async (req, res) => {
    const { url } = req.body;
    const data = await pinterestService.fetchPin(url);

    return ApiResponse.success(res, {
      message: "Pinterest media retrieved successfully",
      data,
    });
  });
}

module.exports = new PinterestController();
