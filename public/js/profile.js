/**
 * Profile page script.
 * Handles loading, updating profile and changing password.
 */
(function () {
  "use strict";

  const profileForm = document.getElementById("profile-form");
  const displayNameInput = document.getElementById("display-name");
  const emailInput = document.getElementById("profile-email");
  const profileStatus = document.getElementById("profile-status");
  const profileSubmitBtn = document.getElementById("profile-submit");

  const passwordForm = document.getElementById("password-form");
  const currentPasswordInput = document.getElementById("current-password");
  const newPasswordInput = document.getElementById("new-password");
  const passwordStatus = document.getElementById("password-status");
  const passwordSubmitBtn = document.getElementById("password-submit");

  const logoutBtn = document.getElementById("logout-btn");
  const userDisplayName = document.getElementById("user-display-name");

  function setStatus(el, message, isError) {
    el.textContent = message;
    el.className = "form-status " + (isError ? "form-status--error" : "form-status--success");
    el.hidden = !message;
    el.setAttribute("role", "alert");
  }

  function setLoading(btn, loading, defaultText) {
    btn.disabled = loading;
    btn.textContent = loading ? "Saving…" : defaultText;
  }

  // Load profile when auth is confirmed
  document.addEventListener("auth:ready", async (e) => {
    const user = e.detail;
    if (displayNameInput) displayNameInput.value = user.displayName || "";
    if (emailInput) emailInput.value = user.email || "";
    if (userDisplayName) userDisplayName.textContent = user.displayName || user.email;
  });

  // Update profile
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus(profileStatus, "", false);

    const displayName = displayNameInput.value.trim();
    const email = emailInput.value.trim();

    if (!displayName) {
      setStatus(profileStatus, "Display name cannot be empty.", true);
      displayNameInput.focus();
      return;
    }
    if (!email) {
      setStatus(profileStatus, "Email cannot be empty.", true);
      emailInput.focus();
      return;
    }

    setLoading(profileSubmitBtn, true, "Save changes");
    try {
      const data = await window.api.patch("/api/profile", { displayName, email });
      if (userDisplayName) userDisplayName.textContent = data.user.displayName;
      setStatus(profileStatus, "Profile updated successfully.", false);
    } catch (err) {
      setStatus(profileStatus, err.message || "Failed to update profile.", true);
    } finally {
      setLoading(profileSubmitBtn, false, "Save changes");
    }
  });

  // Change password
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus(passwordStatus, "", false);

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;

    if (!currentPassword) {
      setStatus(passwordStatus, "Current password is required.", true);
      currentPasswordInput.focus();
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setStatus(passwordStatus, "New password must be at least 8 characters.", true);
      newPasswordInput.focus();
      return;
    }

    setLoading(passwordSubmitBtn, true, "Change password");
    try {
      await window.api.post("/api/profile/change-password", {
        currentPassword,
        newPassword,
      });
      setStatus(passwordStatus, "Password changed successfully.", false);
      passwordForm.reset();
    } catch (err) {
      setStatus(passwordStatus, err.message || "Failed to change password.", true);
      currentPasswordInput.value = "";
      currentPasswordInput.focus();
    } finally {
      setLoading(passwordSubmitBtn, false, "Change password");
    }
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      try {
        await window.api.post("/api/logout");
      } catch {
        // Redirect regardless
      }
      window.location.href = "/login.html";
    });
  }
})();
