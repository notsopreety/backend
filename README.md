# Scalable Modular Express Backend Architecture

A production-ready, highly maintainable, and scalable REST API architecture built with **Express 5**, **Zod**, **Morgan**, and **Express-Rate-Limit**.

Designed specifically for modular expansion: **each file handles its own route**, with isolated validation schemas, controllers, services, utilities, and rate limiting.

---

## 📁 Project Architecture

```text
backend/
├── config/
│   ├── env.js                 # Zod-validated environment variables with defaults
│   ├── rateLimit.config.js    # Rate limiting presets (global, strict, custom)
│   └── cache.config.js        # Response caching config & TTL presets
├── controllers/
│   ├── download/
│   │   └── spotify.controller.js # Spotify download controller
│   ├── ai.controller.js       # AI chat controller (GET & POST) and models catalog
│   ├── health.controller.js   # Health and system monitoring controller
│   └── patro.controller.js    # Nepali calendar (Patro) controller
├── middlewares/
│   ├── cache.js               # In-memory caching middleware (X-Cache: HIT/MISS)
│   ├── errorHandler.js        # Centralized operational and exception error handler
│   ├── notFound.js            # 404 Not Found route handler
│   ├── rateLimiter.js         # Rate limiting middlewares (globalLimiter, strictLimiter)
│   └── validate.js            # Universal Zod schema validator (query, body, params)
├── routes/
│   ├── download/              # Nested route directory!
│   │   └── spotify.routes.js  # Mounts automatically at /api/download/spotify
│   ├── index.js               # Central recursive directory router
│   ├── ai.routes.js           # AI chat and models endpoints (/api/ai)
│   ├── health.routes.js       # Healthcheck routes (/api/health)
│   └── patro.routes.js        # Nepali calendar route (/api/patro)
├── schemas/
│   ├── download/
│   │   └── spotify.schema.js  # Spotify URL schema
│   ├── common.schema.js       # Reusable schemas (URL, pagination, IDs)
│   ├── ai.schema.js           # AI chat validation schemas
│   ├── patro.schema.js        # Patro validation schemas
│   └── index.js               # Schemas export index
├── services/
│   ├── download/
│   │   └── spotify.service.js # MusicFab Spotify API scraper & retry logic
│   ├── ai.service.js          # DuckGPT / Workers AI service logic
│   ├── patro.service.js       # Daily Nepali calendar scraping and parsing
│   └── index.js               # Services export index
├── utils/
│   ├── cache.js               # Memory cache storage with TTL, stats & auto-pruning
│   ├── apiError.js            # Custom operational ApiError class with HTTP status codes
│   ├── apiResponse.js         # Standardized JSON response envelope
│   ├── asyncHandler.js        # Async controller wrapper removing try/catch boilerplate
│   └── httpClient.js          # Preconfigured Axios instance with timeouts and headers
├── .env                       # Local environment variables
├── .env.example               # Environment variables template
├── index.js                   # Application entry point (Express setup & Vercel export)
├── package.json               # Dependencies and scripts
└── vercel.json                # Vercel serverless deployment config
```

---

## ⚡ Key Highlights

### 1. Automatic Dynamic Route Discovery
Every file placed in the `routes/` directory (e.g. `routes/<name>.routes.js` or `routes/<name>.js`) is **automatically discovered and mounted** at `/api/<name>`!
- `routes/ai.routes.js` ➡️ Mounted at `/api/ai`
- `routes/patro.routes.js` ➡️ Mounted at `/api/patro`
- `routes/health.routes.js` ➡️ Mounted at `/api/health`
- Adding a new route requires **zero modifications** to `index.js` or `routes/index.js`.

### 2. Multi-Tier Rate Limiting
- **Global Limiter**: Protects the entire application against DDoS and brute force (`100 req / 15 min` by default).
- **Strict Limiter**: Applied to heavy scraping / parsing endpoints (`30 req / 15 min`).
- Returns standardized JSON with HTTP `429` and `retryAfterSeconds` details.

### 3. Zod-Powered Request Schema Validation
Incoming parameters (`query`, `body`, `params`) are validated and sanitized before reaching the controller:
```javascript
router.get(
  "/detailed",
  strictLimiter,
  validate({ query: patroQuerySchema }),
  patroController.getDetailed
);
```

### 4. Standardized Response & Error Contracts
All API responses follow a uniform structure:

**Success (200 / 201):**
```json
{
  "success": true,
  "message": "Resource fetched successfully",
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-27T10:00:00.000Z"
  }
}
```

**Error (400 / 404 / 429 / 500):**
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "HTTP_400",
    "details": [
      {
        "target": "query",
        "field": "url",
        "message": "Please provide a valid URL"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-09-27T10:00:00.000Z"
  }
}
```

---

## 🛠️ Step-by-Step: How to Add a New Route (e.g. Spotify)

### Step 1: Define Validation Schema (`schemas/spotify.schema.js`)
```javascript
const { z } = require("zod");

const spotifyDownloadSchema = z.object({
  url: z.string().url("Must be a valid URL").regex(/spotify\.com/, "Must be a Spotify link"),
});

module.exports = { spotifyDownloadSchema };
```

### Step 2: Create Service (`services/spotify.service.js`)
```javascript
const httpClient = require("../utils/httpClient");
const ApiError = require("../utils/apiError");

class SpotifyService {
  async fetchTrack(url) {
    try {
      // Upstream API call using httpClient
      const response = await httpClient.post("https://api.example.com/spotify", { url });
      return response.data;
    } catch (error) {
      throw httpClient.handleAxiosError(error, "Spotify Service");
    }
  }
}

module.exports = new SpotifyService();
```

### Step 3: Create Controller (`controllers/spotify.controller.js`)
```javascript
const spotifyService = require("../services/spotify.service");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

class SpotifyController {
  getDownload = asyncHandler(async (req, res) => {
    const { url } = req.query;
    const data = await spotifyService.fetchTrack(url);
    return ApiResponse.success(res, {
      message: "Spotify track fetched successfully",
      data,
    });
  });
}

module.exports = new SpotifyController();
```

### Step 4: Create Route File (`routes/spotify.routes.js`)
```javascript
const express = require("express");
const router = express.Router();

const spotifyController = require("../controllers/spotify.controller");
const validate = require("../middlewares/validate");
const { strictLimiter } = require("../middlewares/rateLimiter");
const { spotifyDownloadSchema } = require("../schemas/spotify.schema");

// GET /api/spotify/download?url=...
router.get("/download", strictLimiter, validate({ query: spotifyDownloadSchema }), spotifyController.getDownload);

module.exports = router;
```
That's it! It is immediately active at `http://localhost:3000/api/spotify/download`.

---

## 🚀 Running the Project

### Development (Live Reloading)
```bash
npm run dev
```

### Production
```bash
npm start
```

### Available Default Endpoints
- `GET /` — API Gateway Welcome & Live Route Directory
- `GET /api` — Route Listing & System Metadata
- `GET /api/health` — System Health, Uptime & Memory Metrics
- `GET /api/patro/detailed` — Daily Nepali Calendar (Patro) Details (Cached 24h)
- `GET /api/ai/chat?prompt=...` — DuckGPT AI Chat (GET)
- `POST /api/ai/chat` — DuckGPT AI Chat with History (POST)
- `GET /api/ai/models` — Supported AI Models Catalog
- `GET /api/download/spotify?url=...` — Spotify Media & Download Extractor (Cached 5m)
- `POST /api/download/spotify` — Spotify Media & Download Extractor JSON (Cached 5m)
