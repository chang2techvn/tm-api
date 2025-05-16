import { describe, expect, test, beforeAll, afterAll } from "vitest";
import { 
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} from "./tasks";
import { TaskStatus } from "./tasks";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create test database connection
const db = new SQLDatabase("tasks", { migrations: "./migrations" });

describe("Tasks Service Tests", () => {
  const testUser = {
    name: "Task Test User",
    email: "task-test@example.com",
    password: "password123",
    role: "user"
  };
  
  const testProject = {
    name: "Task Test Project",
    description: "A project for task testing"
  };
  
  let userId = "";
  let projectId = "";
  let taskId = "";
  
  // Setup test data
  beforeAll(async () => {
    // Create a test user
    const userResult = await db.queryRow`
      INSERT INTO users (name, email, password, role)
      VALUES (${testUser.name}, ${testUser.email}, ${testUser.password}, ${testUser.role})
      ON CONFLICT (email) DO UPDATE SET name = ${testUser.name}
      RETURNING id
    `;
    
    userId = userResult?.id || "";
    
    // Create a test project
    const projectResult = await db.queryRow`
      INSERT INTO projects (name, description)
      VALUES (${testProject.name}, ${testProject.description})
      RETURNING id
    `;
    
    projectId = projectResult?.id || "";
  });
  
  // Cleanup after tests
  afterAll(async () => {
    if (taskId) {
      await db.exec`DELETE FROM tasks WHERE id = ${taskId}`;
    }
    
    if (projectId) {
      await db.exec`DELETE FROM projects WHERE id = ${projectId}`;
    }
    
    if (userId) {
      await db.exec`DELETE FROM users WHERE id = ${userId}`;
    }
  });
  
  test("should create a new task", async () => {
    const testTask = {
      title: "Test Task",
      description: "A task for testing",
      status: TaskStatus.TODO,
      assigneeId: userId,
      dueDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      projectId: projectId
    };
    
    const response = await createTask(testTask);
    
    expect(response).toBeDefined();
    expect(response.title).toBe(testTask.title);
    expect(response.description).toBe(testTask.description);
    expect(response.status).toBe(testTask.status);
    expect(response.assignee?.id).toBe(userId);
    expect(response.projectId).toBe(projectId);
    
    // Save task ID for later tests
    taskId = response.id;
  });
  
  test("should get task by ID", async () => {
    const response = await getTaskById({ id: taskId });
    
    expect(response).toBeDefined();
    expect(response.id).toBe(taskId);
    expect(response.assignee?.id).toBe(userId);
    expect(response.projectId).toBe(projectId);
  });
  
  test("should update task", async () => {
    const updatedTitle = "Updated Test Task";
    const response = await updateTask({ 
      id: taskId,
      title: updatedTitle
    });
    
    expect(response).toBeDefined();
    expect(response.id).toBe(taskId);
    expect(response.title).toBe(updatedTitle);
  });
  
  test("should update task status", async () => {
    const response = await updateTaskStatus({ 
      id: taskId,
      status: TaskStatus.IN_PROGRESS,
      projectId: projectId
    });
    
    expect(response).toBeDefined();
    expect(response.id).toBe(taskId);
    expect(response.status).toBe(TaskStatus.IN_PROGRESS);
  });
  
  test("should get all tasks", async () => {
    // Test with project filter
    const responseWithProject = await getAllTasks({ projectId });
    
    expect(responseWithProject).toBeDefined();
    expect(responseWithProject.tasks).toBeInstanceOf(Array);
    expect(responseWithProject.tasks.some(task => task.id === taskId)).toBe(true);
    
    // Test without project filter
    const responseAll = await getAllTasks({});
    
    expect(responseAll).toBeDefined();
    expect(responseAll.tasks).toBeInstanceOf(Array);
    expect(responseAll.tasks.length).toBeGreaterThanOrEqual(responseWithProject.tasks.length);
  });
  
  test("should delete task", async () => {
    const response = await deleteTask({ id: taskId });
    
    expect(response.success).toBe(true);
    expect(response.message).toBeDefined();
    
    // Verify task is deleted
    try {
      await getTaskById({ id: taskId });
      throw new Error("Task should have been deleted");
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toContain("not found");
      } else {
        throw error;
      }
    }
  });
});