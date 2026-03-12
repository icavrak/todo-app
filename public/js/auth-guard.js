/**
 * Client-side auth guard.
 * Checks session status and redirects unauthenticated users to /login.html.
 * Must be included BEFORE page-specific scripts on protected pages.
 */
(function () {
  "use strict";

  fetch("/api/session", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data.authenticated) {
        window.location.href = "/login.html";
      } else {
        // Expose current user globally for page scripts
        window.currentUser = data.user;
        document.dispatchEvent(new CustomEvent("auth:ready", { detail: data.user }));
      }
    })
    .catch(function () {
      window.location.href = "/login.html";
    });
})();
