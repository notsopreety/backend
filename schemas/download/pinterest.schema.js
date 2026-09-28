const { z } = require("zod");

const PINTEREST_URL_REGEX = /^(https?:\/\/)?([a-z0-9-]+\.)*(pinterest\.[a-z.]+|pin\.it)\/.+/i;

const pinterestDownloadSchema = z.object({
  url: z
    .string({
      required_error: "The 'url' parameter is required",
    })
    .trim()
    .url("Please provide a valid URL")
    .refine(
      (val) => PINTEREST_URL_REGEX.test(val),
      {
        message: "URL must be a valid Pinterest link (e.g., https://pin.it/... or https://pinterest.com/pin/...)",
      }
    ),
});

module.exports = {
  pinterestDownloadSchema,
};
