import { describe, expect, test, beforeAll, afterAll } from "vitest";
import { login, signup, getCurrentUser, refreshToken, logout } from "./auth";
import { hashPassword } from "../utils/auth";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create a test database connection
const db = new SQLDatabase("auth", { migrations: "./migrations" });

describe("Authentication Tests", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    role: "user"
  };
  
  // Setup test data
  beforeAll(async () => {
    // Clear existing test user if exists
    await db.exec`DELETE FROM users WHERE email = ${testUser.email}`;
  });
  
  // Cleanup after tests
  afterAll(async () => {
    await db.exec`DELETE FROM users WHERE email = ${testUser.email}`;
  });
  
  test("should signup a new user", async () => {
    const response = await signup(testUser);
    
    expect(response.user).toBeDefined();
    expect(response.user.email).toBe(testUser.email);
    expect(response.user.name).toBe(testUser.name);
    expect(response.user.role).toBe(testUser.role);
    expect(response.token).toBeDefined();
    expect(response.refreshToken).toBeDefined();
  });
  
  test("should login existing user", async () => {
    const response = await login({
      email: testUser.email,
      password: testUser.password
    });
    
    expect(response.user).toBeDefined();
    expect(response.user.email).toBe(testUser.email);
    expect(response.token).toBeDefined();
    expect(response.refreshToken).toBeDefined();
  });
  
  test("should get current user", async () => {
    // First, find the userId from the database
    const user = await db.queryRow`SELECT id FROM users WHERE email = ${testUser.email}`;
    
    if (user) {
      const response = await getCurrentUser({ userId: user.id });
      
      expect(response).toBeDefined();
      expect(response.id).toBe(user.id);
      expect(response.email).toBe(testUser.email);
      expect(response.stats).toBeDefined();
    } else {
      throw new Error("Failed to find test user");
    }
  });
  
  test("should refresh token", async () => {
    // First login to get a refresh token
    const loginResponse = await login({
      email: testUser.email,
      password: testUser.password
    });
    
    const response = await refreshToken({
      refreshToken: loginResponse.refreshToken || ""
    });
    
    expect(response.token).toBeDefined();
    expect(response.token).not.toBe(loginResponse.token);
    expect(response.refreshToken).toBeDefined();
  });
  
  test("should logout user", async () => {
    const response = await logout();
    
    expect(response.success).toBe(true);
    expect(response.message).toBeDefined();
  });
});