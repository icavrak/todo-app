"use strict";

const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const store = require("../store/users");

const router = Router();

// ── POST /api/login ──────────────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = store.findByEmail(email);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (store.isLocked(user)) {
        return res
          .status(429)
          .json({ error: "Account temporarily locked. Try again later." });
      }

      const valid = await store.verifyPassword(user, password);
      if (!valid) {
        store.recordFailedAttempt(user);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      store.resetAttempts(user);

      // Regenerate session to prevent fixation
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = user.id;
        res.json({ user: store.publicProfile(user) });
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/logout ─────────────────────────────────────────────────────────
router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

// ── GET /api/session ─────────────────────────────────────────────────────────
// Lightweight endpoint to let the frontend check if a session is active.
router.get("/session", (req, res) => {
  if (req.session && req.session.userId) {
    const user = store.findById(req.session.userId);
    if (user) {
      return res.json({ authenticated: true, user: store.publicProfile(user) });
    }
  }
  res.json({ authenticated: false });
});

module.exports = router;
