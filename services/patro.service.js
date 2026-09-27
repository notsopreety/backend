const cheerio = require("cheerio");
const httpClient = require("../utils/httpClient");
const ApiError = require("../utils/apiError");

/**
 * Patro Service
 * Scrapes and parses the daily Nepali Calendar (Patro)
 */
class PatroService {
  constructor() {
    this.sourceUrl = "https://nepalicalendar.rat32.com/";
  }

  /**
   * Scrapes and returns detailed calendar data for today
   * @returns {Promise<Object>}
   */
  async getDetailedCalendar() {
    try {
      const response = await httpClient.get(this.sourceUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      // Find the cell highlighted as "Today" via the radial-gradient style
      const todayCell = $(".cells").filter((i, el) => {
        const style = $(el).attr("style") || "";
        return style.includes("radial-gradient");
      });

      // Determine if today is a holiday (holiday font color is red)
      const festFontColor = todayCell.find("#fest font").attr("color");
      const isHoliday = festFontColor === "red" || festFontColor === "#ff0000";

      // Main mobile/summary container
      const container = $("#tym4mob");
      const mitiRaw = container.children().eq(0).text().trim();
      const tithiRaw = container.children().eq(1).text().trim();
      const dateRaw = container.children().eq(3).text().trim();
      const eventRaw = container.children().eq(4).text().trim();

      if (!mitiRaw) {
        throw ApiError.badGateway("Could not parse Nepali Calendar information from upstream source.");
      }

      // Format Miti: "11 Ashoj Sunday, 2083" -> gatey, mahina, baar, barsa
      const mParts = mitiRaw.replace(/,/g, "").split(/\s+/);
      const dParts = dateRaw.replace(/,/g, "").split(/\s+/);

      return {
        miti: {
          gatey: mParts[0] || "",
          mahina: mParts[1] || "",
          baar: mParts[2] || "",
          barsa: mParts[3] || "",
        },
        date: {
          month: dParts[0] || "",
          day: dParts[1] || "",
          year: dParts[2] || "",
        },
        tithi: tithiRaw || "",
        event: eventRaw || null,
        isHoliday,
        accent: "#a60000",
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw httpClient.handleAxiosError(error, "Nepali Calendar Provider");
    }
  }
}

module.exports = new PatroService();
