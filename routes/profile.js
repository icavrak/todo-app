"use strict";

const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const { requireAuth } = require("../middleware/auth-guard");
const store = require("../store/users");

const router = Router();

// All profile routes require authentication
router.use(requireAuth);

// ── GET /api/profile ─────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const user = store.findById(req.session.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: store.publicProfile(user) });
});

// ── PATCH /api/profile ───────────────────────────────────────────────────────
router.patch(
  "/",
  [
    body("displayName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Display name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { displayName, email } = req.body;
      const result = await store.updateProfile(req.session.userId, {
        displayName,
        email,
      });

      if (!result) return res.status(404).json({ error: "User not found" });
      if (result.error === "email_taken") {
        return res.status(409).json({ error: "Email already in use" });
      }

      res.json({ user: result });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/profile/change-password ────────────────────────────────────────
router.post(
  "/change-password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = store.findById(req.session.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const valid = await store.verifyPassword(user, req.body.currentPassword);
      if (!valid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      await store.changePassword(req.session.userId, req.body.newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
