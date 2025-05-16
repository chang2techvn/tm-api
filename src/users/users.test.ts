import { describe, expect, test, beforeAll, afterAll } from "vitest";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserSkills,
  updateUserAvatar,
  getUserStats
} from "./users";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create test database connections
const authDb = new SQLDatabase("auth", { migrations: "./migrations" });
const usersDb = new SQLDatabase("users", { migrations: "./migrations" });

describe("Users Service Tests", () => {
  const testUser = {
    name: "User Test",
    email: "user-test@example.com",
    password: "password123",
    role: "user",
    skills: ["JavaScript", "React", "Node.js"]
  };
  
  let userId = "";
  
  // Setup before tests
  beforeAll(async () => {
    try {
      // Trong Encore, migrations được chạy tự động khi service khởi động
      // Thay vì gọi migrate(), chúng ta sẽ thực hiện thao tác cơ sở dữ liệu 
      // để kiểm tra xem bảng users đã tồn tại chưa
      
      // Kiểm tra xem bảng users có tồn tại không
      try {
        // Thử truy vấn một dòng từ bảng users để kiểm tra bảng có tồn tại không
        await authDb.queryRow`SELECT COUNT(*) FROM users LIMIT 1`;
        
        // Xóa user test cũ nếu tồn tại
        await authDb.exec`DELETE FROM users WHERE email = ${testUser.email}`;
      } catch (error) {
        console.error("Table check error:", error);
        // Bảng có thể chưa tồn tại hoặc có lỗi khác - bỏ qua và để Encore tự xử lý
      }
    } catch (error) {
      console.error("Setup error:", error);
    }
  });
  
  // Cleanup after tests
  afterAll(async () => {
    if (userId) {
      try {
        await authDb.exec`DELETE FROM users WHERE id = ${userId}`;
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    }
  });
  
  test("should create a new user", async () => {
    const response = await createUser(testUser);
    
    expect(response).toBeDefined();
    expect(response.name).toBe(testUser.name);
    expect(response.email).toBe(testUser.email);
    expect(response.role).toBe(testUser.role);
    expect(response.skills).toEqual(testUser.skills);
    expect(response.stats).toBeDefined();
    
    // Save user ID for later tests
    userId = response.id;
  });
  
  test("should get user by ID", async () => {
    const response = await getUserById({ id: userId });
    
    expect(response).toBeDefined();
    expect(response.id).toBe(userId);
    expect(response.name).toBe(testUser.name);
    expect(response.email).toBe(testUser.email);
    expect(response.role).toBe(testUser.role);
    expect(response.skills).toEqual(testUser.skills);
  });
  
  test("should update user", async () => {
    const updatedName = "Updated User Test";
    const response = await updateUser({ 
      id: userId,
      name: updatedName
    });
    
    expect(response).toBeDefined();
    expect(response.id).toBe(userId);
    expect(response.name).toBe(updatedName);
    expect(response.email).toBe(testUser.email);
  });
  
  test("should update user skills", async () => {
    const updatedSkills = ["TypeScript", "React", "Node.js", "GraphQL"];
    const response = await updateUserSkills({ 
      id: userId,
      skills: updatedSkills
    });
    
    expect(response).toBeDefined();
    expect(response.id).toBe(userId);
    expect(response.skills).toEqual(updatedSkills);
  });
  
  test("should update user avatar", async () => {
    const testAvatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJ5gZ7OaAAAAABJRU5ErkJggg==";
    const response = await updateUserAvatar({ 
      id: userId,
      avatarBase64: testAvatar
    });
    
    expect(response).toBeDefined();
    expect(response.id).toBe(userId);
    expect(response.avatar).toBe(testAvatar);
  });
  
  test("should get user stats", async () => {
    const response = await getUserStats({ id: userId });
    
    expect(response).toBeDefined();
    expect(response.tasks).toBeDefined();
    expect(response.projects).toBeDefined();
    expect(response.completed).toBeDefined();
    expect(typeof response.tasks).toBe("number");
    expect(typeof response.projects).toBe("number");
    expect(typeof response.completed).toBe("number");
  });
  
  test("should get all users", async () => {
    const response = await getAllUsers();
    
    expect(response).toBeDefined();
    expect(response.users).toBeInstanceOf(Array);
    expect(response.users.length).toBeGreaterThan(0);
    
    // Find our test user
    const testUserFromList = response.users.find(u => u.id === userId);
    expect(testUserFromList).toBeDefined();
    expect(testUserFromList?.name).toBe("Updated User Test"); // Using the updated name
  });
});