const { z } = require("zod");

const SPOTIFY_URL_REGEX = /^(https?:\/\/)?(open\.spotify\.com\/(track|album|playlist|episode)\/|spotify\.link\/)[a-zA-Z0-9_\-\?=\+&]+/i;

const spotifyDownloadSchema = z.object({
  url: z
    .string({
      required_error: "The 'url' parameter is required",
    })
    .trim()
    .url("Please provide a valid URL")
    .refine(
      (val) => /spotify\.com|spotify\.link/i.test(val),
      {
        message: "URL must be a valid Spotify link (e.g., https://open.spotify.com/track/...)",
      }
    ),
});

module.exports = {
  spotifyDownloadSchema,
};
