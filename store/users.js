"use strict";

const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

// In-memory user store. Each user: { id, displayName, email, passwordHash }
const users = new Map();
let nextId = 1;

function createUser({ displayName, email, passwordHash }) {
  return {
    id: String(nextId++),
    displayName,
    email,
    passwordHash,
    loginAttempts: 0,
    lockUntil: null,
  };
}

/**
 * Seed a default user so the app is usable out of the box.
 * Password: "password1" (meets ≥8 chars rule).
 */
async function seedDefaultUser() {
  const passwordHash = await bcrypt.hash("password1", SALT_ROUNDS);
  const user = createUser({
    displayName: "Demo User",
    email: "demo@example.com",
    passwordHash,
  });
  users.set(user.id, user);
}

function findByEmail(email) {
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) return user;
  }
  return null;
}

function findById(id) {
  return users.get(String(id)) || null;
}

async function verifyPassword(user, plainPassword) {
  return bcrypt.compare(plainPassword, user.passwordHash);
}

/**
 * Simple brute-force mitigation: lock account for 15 minutes after 5 failed attempts.
 */
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function isLocked(user) {
  if (!user.lockUntil) return false;
  if (Date.now() < user.lockUntil) return true;
  // Lock expired – reset
  user.loginAttempts = 0;
  user.lockUntil = null;
  return false;
}

function recordFailedAttempt(user) {
  user.loginAttempts = (user.loginAttempts || 0) + 1;
  if (user.loginAttempts >= MAX_ATTEMPTS) {
    user.lockUntil = Date.now() + LOCK_DURATION_MS;
  }
}

function resetAttempts(user) {
  user.loginAttempts = 0;
  user.lockUntil = null;
}

async function updateProfile(id, { displayName, email }) {
  const user = findById(id);
  if (!user) return null;
  if (displayName !== undefined) user.displayName = displayName;
  if (email !== undefined) {
    // Ensure email is not taken by another user
    const existing = findByEmail(email);
    if (existing && existing.id !== id) return { error: "email_taken" };
    user.email = email;
  }
  return { id: user.id, displayName: user.displayName, email: user.email };
}

async function changePassword(id, newPassword) {
  const user = findById(id);
  if (!user) return false;
  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  return true;
}

function publicProfile(user) {
  return { id: user.id, displayName: user.displayName, email: user.email };
}

module.exports = {
  seedDefaultUser,
  findByEmail,
  findById,
  verifyPassword,
  isLocked,
  recordFailedAttempt,
  resetAttempts,
  updateProfile,
  changePassword,
  publicProfile,
};
