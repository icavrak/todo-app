"use strict";

const request = require("supertest");
const { app } = require("../server");
const store = require("../store/users");

// Ensure the user store is seeded before tests
beforeAll(async () => {
  await store.seedDefaultUser();
});

// Helper header to satisfy the CSRF custom-header check
const CSRF_HEADER = { "X-Requested-With": "XMLHttpRequest" };

describe("GET /api/session", () => {
  it("returns authenticated:false when no session exists", async () => {
    const res = await request(app).get("/api/session").expect(200);
    expect(res.body).toMatchObject({ authenticated: false });
  });
});

describe("POST /api/login", () => {
  it("returns 400 for missing fields", async () => {
    const res = await request(app).post("/api/login").send({}).expect(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("returns 400 for invalid email format", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "not-an-email", password: "password1" })
      .expect(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "demo@example.com", password: "wrongpassword" })
      .expect(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 401 for unknown email", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "unknown@example.com", password: "password1" })
      .expect(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 200 with user profile on valid credentials", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "demo@example.com", password: "password1" })
      .expect(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toMatchObject({
      email: "demo@example.com",
      displayName: "Demo User",
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });
});

describe("Profile and password endpoints (authenticated)", () => {
  let agent;

  beforeEach(async () => {
    // Create a fresh agent with a session for each test
    agent = request.agent(app);
    await agent
      .post("/api/login")
      .send({ email: "demo@example.com", password: "password1" });
  });

  describe("GET /api/profile", () => {
    it("returns user profile when authenticated", async () => {
      const res = await agent.get("/api/profile").expect(200);
      expect(res.body.user).toMatchObject({
        email: "demo@example.com",
        displayName: "Demo User",
      });
    });
  });

  describe("PATCH /api/profile", () => {
    it("returns 400 for empty displayName", async () => {
      const res = await agent
        .patch("/api/profile")
        .set(CSRF_HEADER)
        .send({ displayName: "", email: "demo@example.com" })
        .expect(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("returns 400 for invalid email", async () => {
      const res = await agent
        .patch("/api/profile")
        .set(CSRF_HEADER)
        .send({ displayName: "Demo", email: "not-an-email" })
        .expect(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("updates display name successfully", async () => {
      const res = await agent
        .patch("/api/profile")
        .set(CSRF_HEADER)
        .send({ displayName: "Updated Name", email: "demo@example.com" })
        .expect(200);
      expect(res.body.user.displayName).toBe("Updated Name");
      // Restore
      await agent
        .patch("/api/profile")
        .set(CSRF_HEADER)
        .send({ displayName: "Demo User", email: "demo@example.com" });
    });
  });

  describe("POST /api/profile/change-password", () => {
    it("returns 400 when new password is too short", async () => {
      const res = await agent
        .post("/api/profile/change-password")
        .set(CSRF_HEADER)
        .send({ currentPassword: "password1", newPassword: "short" })
        .expect(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("returns 401 when current password is wrong", async () => {
      const res = await agent
        .post("/api/profile/change-password")
        .set(CSRF_HEADER)
        .send({ currentPassword: "wrongpassword", newPassword: "newpassword1" })
        .expect(401);
      expect(res.body).toHaveProperty("error");
    });

    it("changes password successfully", async () => {
      const res = await agent
        .post("/api/profile/change-password")
        .set(CSRF_HEADER)
        .send({ currentPassword: "password1", newPassword: "newpassword1" })
        .expect(200);
      expect(res.body).toHaveProperty("message");

      // Verify new password works for login
      const loginRes = await request(app)
        .post("/api/login")
        .send({ email: "demo@example.com", password: "newpassword1" })
        .expect(200);
      expect(loginRes.body).toHaveProperty("user");

      // Restore original password
      await agent
        .post("/api/profile/change-password")
        .set(CSRF_HEADER)
        .send({ currentPassword: "newpassword1", newPassword: "password1" });
    });
  });

  describe("POST /api/logout", () => {
    it("logs out and invalidates session", async () => {
      await agent.post("/api/logout").set(CSRF_HEADER).expect(200);
      // After logout, profile endpoint should return 401
      const res = await agent
        .get("/api/profile")
        .set("Accept", "application/json")
        .expect(401);
      expect(res.body).toHaveProperty("error");
    });
  });
});

describe("CSRF protection", () => {
  it("returns 403 for state-changing request without CSRF header", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/login")
      .send({ email: "demo@example.com", password: "password1" });
    const res = await agent.post("/api/logout").expect(403);
    expect(res.body).toHaveProperty("error");
  });
});

describe("Unauthenticated access to protected API routes", () => {
  it("returns 401 for GET /api/profile without session", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Accept", "application/json")
      .expect(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 403 for PATCH /api/profile without CSRF header (CSRF checked before auth)", async () => {
    const res = await request(app)
      .patch("/api/profile")
      .set("Accept", "application/json")
      .send({ displayName: "X", email: "x@example.com" })
      .expect(403);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 401 for PATCH /api/profile with CSRF header but no session", async () => {
    const res = await request(app)
      .patch("/api/profile")
      .set("Accept", "application/json")
      .set(CSRF_HEADER)
      .send({ displayName: "X", email: "x@example.com" })
      .expect(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 401 for POST /api/profile/change-password with CSRF header but no session", async () => {
    const res = await request(app)
      .post("/api/profile/change-password")
      .set("Accept", "application/json")
      .set(CSRF_HEADER)
      .send({ currentPassword: "password1", newPassword: "newpassword1" })
      .expect(401);
    expect(res.body).toHaveProperty("error");
  });
});
