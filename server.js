"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const path = require("path");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const { requireAuth } = require("./middleware/auth-guard");
const { errorHandler } = require("./middleware/error-handler");
const store = require("./store/users");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const isProd = process.env.NODE_ENV === "production";

// ── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: isProd ? false : "http://localhost:" + PORT,
    credentials: true,
  })
);

// ── Request logging ──────────────────────────────────────────────────────────
if (!isProd) {
  app.use(morgan("dev"));
}

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Sessions ─────────────────────────────────────────────────────────────────
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 20 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: () => process.env.NODE_ENV === "test",
});

const profileWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: () => process.env.NODE_ENV === "test",
});

// ── CSRF protection (synchronizer token) ─────────────────────────────────────
// Generates and validates a CSRF token stored in the session.
function generateCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  return req.session.csrfToken;
}

function csrfMiddleware(req, res, next) {
  // Skip CSRF check for safe methods and the login endpoint
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return next();

  // Skip for login (no session exists yet; CORS + SameSite=Lax already protect this)
  if (req.path === "/login") return next();

  // Two complementary CSRF defences:
  // 1. Custom header check — cross-origin requests with custom headers require a CORS
  //    preflight that our policy blocks, proving the request is same-origin.
  // 2. Synchronizer token — validated when provided (e.g., non-AJAX form submissions).
  const hasCustomHeader =
    req.headers["x-requested-with"] === "XMLHttpRequest";
  const hasValidToken =
    req.headers["x-csrf-token"] &&
    req.session.csrfToken &&
    req.headers["x-csrf-token"] === req.session.csrfToken;

  if (!hasCustomHeader && !hasValidToken) {
    return res.status(403).json({ error: "CSRF check failed" });
  }
  next();
}

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: generateCsrfToken(req) });
});

app.use("/api", csrfMiddleware);
app.use("/api", authLimiter);
app.use("/api/profile", profileWriteLimiter);
app.use("/api", authRouter);
app.use("/api/profile", profileRouter);

// ── Protected static pages ───────────────────────────────────────────────────
// index.html (todo) and profile.html require authentication.
// A modest rate limiter guards against rapid file-read loops.
const staticPageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
});

app.get(["/", "/index.html"], staticPageLimiter, requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/profile.html", staticPageLimiter, requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "profile.html"));
});

// ── Public static files (login page, CSS, JS) ───────────────────────────────
app.use(express.static(path.join(__dirname), { index: false }));

// ── Centralized error handling ───────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
async function start() {
  await store.seedDefaultUser();
  app.listen(PORT, () => {
    console.log(`Todo app running at http://localhost:${PORT}`);
    console.log(
      `Default credentials: demo@example.com / password1`
    );
  });
}

// Only start when run directly (not when imported by tests)
if (require.main === module) {
  start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

module.exports = { app, start };
