const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const ApiResponse = require("../utils/apiResponse");

const registeredRoutes = [];

/**
 * Recursively discover all route files in a directory and its subdirectories.
 * Supports directory modularization (e.g., routes/download/spotify.routes.js -> /api/download/spotify)
 * 
 * @param {string} currentDir
 * @param {string} rootDir
 * @returns {Array<{ relativePath: string, fullPath: string, mountPath: string }>}
 */
function scanRouteFiles(currentDir, rootDir = currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  let results = [];

  for (const entry of entries) {
    // Ignore hidden files/directories and tests
    if (entry.name.startsWith(".") || entry.name.includes(".test.")) continue;

    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      // Recurse into subdirectories (e.g. routes/download/)
      results = results.concat(scanRouteFiles(fullPath, rootDir));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".routes.js") || entry.name.endsWith(".js"))
    ) {
      // Skip the root routes/index.js itself
      if (relativePath === "index.js") continue;

      // Calculate the mount path
      // Examples:
      // - 'ai.routes.js' -> '/ai'
      // - 'download/spotify.routes.js' -> '/download/spotify'
      // - 'download/index.js' -> '/download'
      let cleanPath = relativePath.replace(/(\.routes)?\.js$/, "");
      if (cleanPath.endsWith("/index")) {
        cleanPath = cleanPath.replace(/\/index$/, "");
      }

      const mountPath = `/${cleanPath.replace(/\\/g, "/")}`;

      results.push({
        relativePath,
        fullPath,
        mountPath,
        name: cleanPath,
      });
    }
  }

  return results;
}

// Discover all route files recursively
const discoveredRoutes = scanRouteFiles(__dirname);

// Sort so routes mount deterministically
discoveredRoutes.sort((a, b) => a.mountPath.localeCompare(b.mountPath));

discoveredRoutes.forEach((routeInfo) => {
  try {
    const routeModule = require(routeInfo.fullPath);

    if (typeof routeModule === "function" || routeModule.stack) {
      router.use(routeInfo.mountPath, routeModule);
      registeredRoutes.push({
        name: routeInfo.name,
        mountPath: `/api${routeInfo.mountPath}`,
        file: routeInfo.relativePath,
      });
    }
  } catch (err) {
    console.error(`❌ Failed to load route module [${routeInfo.relativePath}]:`, err.message);
  }
});

// Root API discovery route: GET /api
router.get("/", (req, res) => {
  return ApiResponse.success(res, {
    message: "Universal API Gateway is active",
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
