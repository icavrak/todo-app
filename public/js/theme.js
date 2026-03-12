/**
 * Shared theme initialization and toggle behaviour.
 * Exported as a plain IIFE so it can be included on any page.
 */
(function () {
  "use strict";

  const THEME_STORAGE_KEY = "theme";

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.textContent = isDark ? "Light mode" : "Dark mode";
      btn.setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(saved === "dark" ? "dark" : "light");
  }

  function bindThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  // Auto-init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initTheme();
      bindThemeToggle();
    });
  } else {
    initTheme();
    bindThemeToggle();
  }

  // Expose for use in other scripts if needed
  window.themeUtils = { applyTheme, initTheme };
})();
