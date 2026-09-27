const commonSchemas = require("./common.schema");
const patroSchemas = require("./patro.schema");
const aiSchemas = require("./ai.schema");
const spotifySchemas = require("./download/spotify.schema");

module.exports = {
  ...commonSchemas,
  ...patroSchemas,
  ...aiSchemas,
  ...spotifySchemas,
};
