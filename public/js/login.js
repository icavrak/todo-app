/**
 * Login page script.
 * Handles form submission, validation messaging, and redirect on success.
 */
(function () {
  "use strict";

  // If already logged in, redirect to todo page
  fetch("/api/session", {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.authenticated) window.location.href = "/";
    })
    .catch(() => {});

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitBtn = document.getElementById("login-submit");
  const statusEl = document.getElementById("login-status");

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.className = "form-status " + (isError ? "form-status--error" : "form-status--success");
    statusEl.hidden = !message;
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? "Signing in…" : "Sign in";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", false);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      setStatus("Email is required.", true);
      emailInput.focus();
      return;
    }
    if (!password) {
      setStatus("Password is required.", true);
      passwordInput.focus();
      return;
    }

    setLoading(true);
    try {
      await window.api.post("/api/login", { email, password });
      window.location.href = "/";
    } catch (err) {
      setStatus(err.message || "Login failed. Please try again.", true);
      passwordInput.value = "";
      passwordInput.focus();
    } finally {
      setLoading(false);
    }
  });
})();
