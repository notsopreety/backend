const express = require("express");
const router = express.Router();
const ApiResponse = require("../utils/apiResponse");

// Explicit route imports (required for Vercel / serverless static analysis & bundling)
const aiRoutes = require("./ai.routes");
const spotifyRoutes = require("./download/spotify.routes");
const healthRoutes = require("./health.routes");
const patroRoutes = require("./patro.routes");

const routeDefinitions = [
  {
    name: "ai",
    mountPath: "/ai",
    routeModule: aiRoutes,
    file: "ai.routes.js",
  },
  {
    name: "download/spotify",
    mountPath: "/download/spotify",
    routeModule: spotifyRoutes,
    file: "download/spotify.routes.js",
  },
  {
    name: "health",
    mountPath: "/health",
    routeModule: healthRoutes,
    file: "health.routes.js",
  },
  {
    name: "patro",
    mountPath: "/patro",
    routeModule: patroRoutes,
    file: "patro.routes.js",
  },
];

const registeredRoutes = [];

// Mount each route
routeDefinitions.forEach(({ name, mountPath, routeModule, file }) => {
  router.use(mountPath, routeModule);
  registeredRoutes.push({
    name,
    mountPath: `/api${mountPath}`,
    file,
  });
});

// Root API discovery route: GET /api
router.get("/", (req, res) => {
  return ApiResponse.success(res, {
    message: "API Gateway is active",
    data: {
      version: "1.0.0",
      totalRoutes: registeredRoutes.length,
      routes: registeredRoutes,
    },
  });
});

module.exports = {
  apiRouter: router,
  registeredRoutes,
};

