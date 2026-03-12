"use strict";

/**
 * Middleware: require an authenticated session.
 * API requests (Accept: application/json) get a 401 JSON response.
 * Browser requests get redirected to /login.html.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  const wantsJson =
    req.headers.accept && req.headers.accept.includes("application/json");
  if (wantsJson) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.redirect("/login.html");
}

module.exports = { requireAuth };
