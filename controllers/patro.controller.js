const patroService = require("../services/patro.service");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Patro Controller
 * Handles calendar endpoints
 */
class PatroController {
  /**
   * GET /api/patro/detailed (and GET /api/patro)
   * Fetches detailed Nepali calendar data for today
   */
  getDetailed = asyncHandler(async (req, res) => {
    const calendarData = await patroService.getDetailedCalendar();

    return ApiResponse.success(res, {
      message: "Nepali calendar details retrieved successfully",
      data: calendarData,
    });
  });
}

module.exports = new PatroController();
