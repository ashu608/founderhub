// ============================================================
//  FOUNDERHUB — Express App Configuration
//  File: app.js
//  Separated from server.js so it can be imported in tests
// ============================================================

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");
const compression  = require("compression");
const mongoSanitize = require("express-mongo-sanitize");

const apiRouter    = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ─────────────────────────────────────────────────────────────
//  SECURITY HEADERS
// ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());    // prevent MongoDB operator injection

// ─────────────────────────────────────────────────────────────
//  CORS
// ─────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ─────────────────────────────────────────────────────────────
//  RATE LIMITING
// ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 20,
  message: { error: "Too many auth attempts. Try again in an hour." },
});

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 30,
  message: { error: "Voting too fast. Please slow down." },
});

app.use("/api/", globalLimiter);
app.use("/api/v1/auth/", authLimiter);
app.use("/api/v1/ideas/:id/vote", voteLimiter);
app.use("/api/v1/battles/:id/vote", voteLimiter);

// ─────────────────────────────────────────────────────────────
//  BODY PARSING + COMPRESSION
// ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(compression());

// ─────────────────────────────────────────────────────────────
//  REQUEST LOGGING
// ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ─────────────────────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// ─────────────────────────────────────────────────────────────
//  API ROUTES
// ─────────────────────────────────────────────────────────────
app.use("/api/v1", apiRouter);

// ─────────────────────────────────────────────────────────────
//  404 HANDLER
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─────────────────────────────────────────────────────────────
//  GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;