const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const env = require("./config/env");
const { globalLimiter } = require("./middlewares/rateLimiter");
const { apiRouter, registeredRoutes } = require("./routes");
const notFoundHandler = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const ApiResponse = require("./utils/apiResponse");

const app = express();

// Trust reverse proxies (Vercel, Cloudflare, Nginx, Heroku) for IP rate-limiting & SSL detection
app.set("trust proxy", 1);

// Pretty JSON output formatting
app.set("json spaces", 2);

// Security Headers
app.use(
    helmet({
        contentSecurityPolicy: false, // Allows fonts from cdnfonts.com and inline interactive scripts
    })
);

// Cross-Origin Resource Sharing
app.use(
    cors({
        origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
);

// Serve static assets from public/ (favicons, images, css, etc.)
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// Request Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// HTTP Request Logger
if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Global Rate Limiter
app.use(globalLimiter);

// Root Route: Serve the HTML homepage of https://www.bhandarimilan.info.np/
app.get("/", (req, res) => {
    // If explicitly requesting JSON, return the API gateway discovery data
    if (
        req.query.json === "true" ||
        (req.headers.accept &&
            req.headers.accept.includes("application/json") &&
            !req.headers.accept.includes("text/html"))
    ) {
        return ApiResponse.success(res, {
            message: "API Gateway is running smoothly",
            data: {
                status: "online",
                environment: env.NODE_ENV,
                documentation: `${env.API_PREFIX}`,
                endpoints: registeredRoutes.map((r) => r.mountPath),
            },
        });
    }

    // Serve the HTML file
    return res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Mount All API Routes
app.use(env.API_PREFIX, apiRouter);

// 404 Route Catch-All
app.use(notFoundHandler);

// Centralized Error Handling
app.use(errorHandler);

// Start server when run directly (node index.js)
if (require.main === module) {
    const server = app.listen(env.PORT, () => {
        console.log(`\n🚀 Server listening at http://localhost:${env.PORT}`);
        console.log(`📡 Environment: ${env.NODE_ENV}`);
        console.log(`🔌 Mounted Routes (${registeredRoutes.length}):`);
        registeredRoutes.forEach((r) => {
            console.log(`   - ${r.mountPath} (${r.file})`);
        });
        console.log("");
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
        console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
        server.close(() => {
            console.log("💥 Process terminated.");
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

// Export for Vercel serverless functions and testing
module.exports = app;