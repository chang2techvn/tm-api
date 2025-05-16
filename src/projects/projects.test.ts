import { describe, expect, test, beforeAll, afterAll } from "vitest";
import { 
  getAllProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectTasks,
  getProjectMembers,
  addProjectMember,
  removeProjectMember
} from "./projects";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create test database connection
const db = new SQLDatabase("projects", { migrations: "./migrations" });

describe("Projects Service Tests", () => {
  const testProject = {
    name: "Test Project",
    description: "A project for testing"
  };
  
  let projectId = "";
  let userId = "";
  
  // Setup test data
  beforeAll(async () => {
    // Create a test user for project membership tests
    const userResult = await db.queryRow`
      INSERT INTO users (name, email, password, role)
      VALUES ('Test User', 'project-test@example.com', 'password123', 'user')
      ON CONFLICT (email) DO UPDATE SET name = 'Test User'
      RETURNING id
    `;
    
    userId = userResult?.id || "";
  });
  
  // Cleanup after tests
  afterAll(async () => {
    if (projectId) {
      await db.exec`DELETE FROM project_members WHERE project_id = ${projectId}`;
      await db.exec`DELETE FROM tasks WHERE project_id = ${projectId}`;
      await db.exec`DELETE FROM projects WHERE id = ${projectId}`;
    }
    
    if (userId) {
      await db.exec`DELETE FROM users WHERE id = ${userId}`;
    }
  });
  
  test("should create a new project", async () => {
    const response = await createProject(testProject);
    
    expect(response).toBeDefined();
    expect(response.name).toBe(testProject.name);
    expect(response.description).toBe(testProject.description);
    expect(response.taskCount).toBe(0);
    expect(response.members).toEqual([]);
    
    // Save project ID for later tests
    projectId = response.id;
  });
  
  test("should get project by ID", async () => {
    const response = await getProjectById({ id: projectId });
    
    expect(response).toBeDefined();
    expect(response.id).toBe(projectId);
    expect(response.name).toBe(testProject.name);
    expect(response.description).toBe(testProject.description);
  });
  
  test("should update project", async () => {
    const updatedName = "Updated Test Project";
    const response = await updateProject({ 
      id: projectId,
      name: updatedName
    });
    
    expect(response).toBeDefined();
    expect(response.id).toBe(projectId);
    expect(response.name).toBe(updatedName);
    expect(response.description).toBe(testProject.description);
  });
  
  test("should add member to project", async () => {
    if (userId) {
      const response = await addProjectMember({
        id: projectId,
        userId
      });
      
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(response.user).toBeDefined();
      expect(response.user?.id).toBe(userId);
    } else {
      throw new Error("No test user available");
    }
  });
  
  test("should get project members", async () => {
    const response = await getProjectMembers({ id: projectId });
    
    expect(response).toBeDefined();
    expect(response.members).toBeInstanceOf(Array);
    expect(response.members.length).toBeGreaterThan(0);
    expect(response.members[0].id).toBe(userId);
  });
  
  test("should get project tasks", async () => {
    const response = await getProjectTasks({ id: projectId });
    
    expect(response).toBeDefined();
    expect(response.tasks).toBeInstanceOf(Array);
  });
  
  test("should remove member from project", async () => {
    const response = await removeProjectMember({
      id: projectId,
      userId
    });
    
    expect(response.success).toBe(true);
    expect(response.message).toBeDefined();
  });
  
  test("should get all projects", async () => {
    const response = await getAllProjects();
    
    expect(response).toBeDefined();
    expect(response.projects).toBeInstanceOf(Array);
    expect(response.projects.length).toBeGreaterThan(0);
    
    // Find our test project
    const testProject = response.projects.find(p => p.id === projectId);
    expect(testProject).toBeDefined();
  });
  
  test("should delete project", async () => {
    const response = await deleteProject({ id: projectId });
    
    expect(response.success).toBe(true);
    expect(response.message).toBeDefined();
  });
});