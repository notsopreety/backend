const cheerio = require("cheerio");
const httpClient = require("../../utils/httpClient");
const ApiError = require("../../utils/apiError");

/**
 * Pinterest Download Service
 * Interfaces with PinsDownload scraper to extract Pinterest media (image/video) metadata and direct download links
 */
class PinterestService {
  constructor() {
    this.sourceUrl = "https://pinsdownload.org/";
  }

  /**
   * Fetch Pinterest media details for a given Pinterest pin URL
   * @param {string} url - Pinterest pin URL (pin.it or pinterest.com)
   * @returns {Promise<Object>}
   */
  async fetchPin(url) {
    let lastError;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const formData = new URLSearchParams({
          pinterest_url: url,
          pdl_action: "fetch",
        }).toString();

        const response = await httpClient.post(this.sourceUrl, formData, {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "accept-language": "en-US,en;q=0.9",
            origin: "https://pinsdownload.org",
            referer: "https://pinsdownload.org/",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "user-agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
          },
          timeout: 20000,
        });

        const $ = cheerio.load(response.data);

        // Check for provider error messages
        const errorEl = $(".pdl-error");
        if (errorEl.length > 0) {
          const errorMsg = errorEl.text().trim();
          throw ApiError.badRequest(errorMsg || "The media service returned an error for this Pinterest URL.");
        }

        const resultElements = $(".pdl-result");
        if (resultElements.length === 0) {
          throw ApiError.notFound("No media could be extracted for this Pinterest link. Please verify the URL.");
        }

        const medias = [];

        resultElements.each((_, el) => {
          const isVideo = $(el).find("video").length > 0;
          const videoEl = $(el).find("video");
          const imgEl = $(el).find("img.pdl-media");
          const downloadEl = $(el).find("a.pdl-download");

          const info = {};
          $(el)
            .find(".pdl-info-item")
            .each((__, item) => {
              const label = $(item).find(".pdl-info-label").text().trim().toLowerCase();
              const value = $(item).find(".pdl-info-value").text().trim();
              if (label) {
                info[label] = value;
              }
            });

          const downloadUrl =
            downloadEl.attr("href") ||
            (isVideo ? videoEl.find("source").attr("src") : imgEl.attr("src")) ||
            null;

          const thumbnail = isVideo
            ? videoEl.attr("poster") || null
            : imgEl.attr("src") || null;

          medias.push({
            type: isVideo ? "video" : "image",
            format: info.format || (isVideo ? "Video" : "Image"),
            quality: info.quality || null,
            dimensions: info.dimensions || null,
            duration: info.duration || null,
            thumbnail,
            downloadUrl,
            downloadLabel: downloadEl.text().trim() || "Download",
          });
        });

        const titleRaw = $(".pdl-meta").text().trim();
        const title = titleRaw.replace(/^Title:\s*/i, "").trim() || null;

        const primary = medias[0] || {};

        return {
          platform: "pinterest",
          originalUrl: url,
          title,
          type: primary.type || "image",
          format: primary.format || null,
          quality: primary.quality || null,
          dimensions: primary.dimensions || null,
          duration: primary.duration || null,
          thumbnail: primary.thumbnail || null,
          downloadUrl: primary.downloadUrl || null,
          downloadLabel: primary.downloadLabel || null,
          medias,
        };
      } catch (error) {
        lastError = error;
        if (error instanceof ApiError) {
          throw error;
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
    }

    if (lastError instanceof ApiError) throw lastError;
    throw httpClient.handleAxiosError(lastError, "Pinterest Downloader Provider");
  }
}

module.exports = new PinterestService();
