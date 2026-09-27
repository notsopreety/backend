const spotifyService = require("../../services/download/spotify.service");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * Spotify Controller
 */
class SpotifyController {
  /**
   * Handle GET /api/download/spotify?url=...
   */
  getDownload = asyncHandler(async (req, res) => {
    const { url } = req.query;
    const data = await spotifyService.fetchTrack(url);

    return ApiResponse.success(res, {
      message: "Spotify track retrieved successfully",
      data,
    });
  });

  /**
   * Handle POST /api/download/spotify
   */
  postDownload = asyncHandler(async (req, res) => {
    const { url } = req.body;
    const data = await spotifyService.fetchTrack(url);

    return ApiResponse.success(res, {
      message: "Spotify track retrieved successfully",
      data,
    });
  });
}

module.exports = new SpotifyController();
