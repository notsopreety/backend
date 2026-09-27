const httpClient = require("../../utils/httpClient");
const ApiError = require("../../utils/apiError");

/**
 * Spotify Download Service
 * Interfaces with MusicFab API to extract Spotify media metadata and download stream URLs
 */
class SpotifyService {
  constructor() {
    this.apiUrl = "https://musicfab.io/api/spotify";
  }

  /**
   * Fetch track or album download details for a given Spotify URL
   * @param {string} url - Spotify media link
   * @returns {Promise<Object>}
   */
  async fetchTrack(url) {
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await httpClient.post(
          this.apiUrl,
          { url },
          {
            headers: {
              "content-type": "application/json",
              accept: "*/*",
              "accept-language": "en-US,en;q=0.9",
              origin: "https://musicfab.io",
              referer: "https://musicfab.io/",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "user-agent":
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
            timeout: 20000,
          }
        );

        const payload = response.data;
        const metadata = payload?.data?.metadata || payload?.metadata;

        if (!metadata) {
          throw ApiError.badGateway(
            payload?.message || "Could not retrieve media details from Spotify provider."
          );
        }

        return {
          platform: "spotify",
          originalUrl: url,
          title: metadata.name || null,
          artist: metadata.artist || null,
          album: metadata.album || null,
          duration: metadata.duration || null,
          thumbnail: metadata.image || null,
          downloadUrl: metadata.download || null,
        };
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    if (lastError instanceof ApiError) throw lastError;
    throw httpClient.handleAxiosError(lastError, "Spotify Downloader Provider");
  }
}

module.exports = new SpotifyService();
