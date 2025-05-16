// projects.ts - Updated version to work with cache sync API
// Timestamp: 2024-05-16

import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

import { TaskStatus } from "../tasks/tasks";

// Kết nối đến database của service auth
const db = new SQLDatabase("auth");

// Types for our API responses and requests
interface ProjectBasic {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  taskCount: number;
  members: string[];
}

interface ProjectDetail extends ProjectBasic {
  // Additional detail fields can be added here if needed
}

interface ProjectList {
  projects: ProjectBasic[];
}

interface CreateProjectRequest {
  name: string;
  description: string;
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

interface AddMemberRequest {
  userId: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
  };
}

interface TaskList {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    assignee: {
      id: string;
      name: string;
    } | null;
    dueDate: Date | null;
  }>;
}

interface MemberList {
  members: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  }>;
}

// 2.1. GET /api/projects - Lấy tất cả dự án
export const getAllProjects = api(
  { expose: true, method: "GET", path: "/api/projects" },
  async (): Promise<ProjectList> => {
    // Example of using syncAllUsersToCache API without passing db
    // Uncomment if you need to sync users before getting projects
    // await syncAllUsersToCache();
    
    // Get projects
    const projectsQuery = db.query`
      SELECT * FROM projects
    `;
    
    const projects = [];
    for await (const project of projectsQuery) {
      projects.push(project);
    }
    
    // Process each project to get related data
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        // Get tasks count for this project
        const tasksCountResult = await db.queryRow`
          SELECT COUNT(*) as count FROM tasks WHERE project_id = ${project.id}
        `;
        
        // Get members for this project
        const membersQuery = db.query`
          SELECT user_id FROM project_members WHERE project_id = ${project.id}
        `;
        
        const members = [];
        for await (const member of membersQuery) {
          members.push(member.user_id);
        }
        
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.created_at,
          taskCount: parseInt(tasksCountResult?.count || '0', 10),
          members: members,
        };
      })
    );

    return {
      projects: projectsWithDetails
    };
  }
);

// 2.2. GET /api/projects/:id - Lấy thông tin chi tiết dự án
export const getProjectById = api(
  { expose: true, method: "GET", path: "/api/projects/:id" },
  async ({ id }: { id: string }): Promise<ProjectDetail> => {
    // Get project basic information
    const project = await db.queryRow`
      SELECT * FROM projects WHERE id = ${id}
    `;

    if (!project) {
      throw APIError.notFound("Project not found");
    }
    
    // Get tasks count for this project
    const tasksCountResult = await db.queryRow`
      SELECT COUNT(*) as count FROM tasks WHERE project_id = ${id}
    `;
    
    // Get members for this project
    const membersQuery = db.query`
      SELECT user_id FROM project_members WHERE project_id = ${id}
    `;
    
    const members = [];
    for await (const member of membersQuery) {
      members.push(member.user_id);
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.created_at,
      taskCount: parseInt(tasksCountResult?.count || '0', 10),
      members: members,
    };
  }
);

// 2.3. POST /api/projects - Tạo dự án mới
export const createProject = api(
  { expose: true, method: "POST", path: "/api/projects" },
  async (request: CreateProjectRequest): Promise<ProjectDetail> => {
    const newProject = await db.queryRow`
      INSERT INTO projects (name, description)
      VALUES (${request.name}, ${request.description})
      RETURNING id, name, description, created_at
    `;

    if (!newProject) {
      throw APIError.internal("Failed to create project");
    }

    return {
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      createdAt: newProject.created_at,
      taskCount: 0,
      members: [],
    };
  }
);

// 2.4. PUT /api/projects/:id - Cập nhật thông tin dự án
export const updateProject = api(
  { expose: true, method: "PUT", path: "/api/projects/:id" },
  async ({ id, ...request }: { id: string } & UpdateProjectRequest): Promise<ProjectDetail> => {
    // Check if project exists
    const existingProject = await db.queryRow`
      SELECT * FROM projects WHERE id = ${id}
    `;
    
    if (!existingProject) {
      throw APIError.notFound("Project not found");
    }
    
    // Create dynamic update query parts
    const updates = [];
    const values = [];
    
    if (request.name !== undefined) {
      updates.push(`name = ${request.name}`);
    }
    
    if (request.description !== undefined) {
      updates.push(`description = ${request.description}`);
    }
    
    if (updates.length === 0) {
      // No updates to perform
      return getProjectById({ id });
    }
    
    // Using tagged template literal for query
    let updatedProject = null;
    
    // Create a proper tagged template literal query instead of string concatenation
    if (request.name !== undefined && request.description !== undefined) {
      const result = await db.queryRow`
        UPDATE projects 
        SET name = ${request.name}, description = ${request.description} 
        WHERE id = ${id}
        RETURNING id, name, description, created_at
      `;
      updatedProject = result;
    } else if (request.name !== undefined) {
      const result = await db.queryRow`
        UPDATE projects 
        SET name = ${request.name}
        WHERE id = ${id}
        RETURNING id, name, description, created_at
      `;
      updatedProject = result;
    } else if (request.description !== undefined) {
      const result = await db.queryRow`
        UPDATE projects 
        SET description = ${request.description}
        WHERE id = ${id}
        RETURNING id, name, description, created_at
      `;
      updatedProject = result;
    }
    
    if (!updatedProject) {
      throw APIError.internal("Failed to update project");
    }
    
    // Get tasks count for this project
    const tasksCountResult = await db.queryRow`
      SELECT COUNT(*) as count FROM tasks WHERE project_id = ${id}
    `;
    
    // Get members for this project
    const membersQuery = db.query`
      SELECT user_id FROM project_members WHERE project_id = ${id}
    `;
    
    const members = [];
    for await (const member of membersQuery) {
      members.push(member.user_id);
    }

    return {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      createdAt: updatedProject.created_at,
      taskCount: parseInt(tasksCountResult?.count || '0', 10),
      members: members,
    };
  }
);

// 2.5. DELETE /api/projects/:id - Xóa dự án
export const deleteProject = api(
  { expose: true, method: "DELETE", path: "/api/projects/:id" },
  async ({ id }: { id: string }): Promise<SuccessResponse> => {
    // Check if project exists
    const existingProject = await db.queryRow`
      SELECT id FROM projects WHERE id = ${id}
    `;
    
    if (!existingProject) {
      throw APIError.notFound("Project not found");
    }
    
    await db.exec`
      DELETE FROM projects WHERE id = ${id}
    `;

    return {
      success: true,
      message: "Project deleted successfully",
    };
  }
);

// 2.6. GET /api/projects/:id/tasks - Lấy tất cả nhiệm vụ trong dự án
export const getProjectTasks = api(
  { expose: true, method: "GET", path: "/api/projects/:id/tasks" },
  async ({ id }: { id: string }): Promise<TaskList> => {
    // First check if project exists
    const project = await db.queryRow`
      SELECT id FROM projects WHERE id = ${id}
    `;
    
    if (!project) {
      throw APIError.notFound("Project not found");
    }
    
    const tasksQuery = db.query`
      SELECT t.*, u.id as assignee_id, u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = ${id}
    `;

    const tasks = [];
    for await (const task of tasksQuery) {
      tasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as TaskStatus,
        assignee: task.assignee_id ? {
          id: task.assignee_id,
          name: task.assignee_name,
        } : null,
        dueDate: task.due_date,
      });
    }

    return { tasks };
  }
);

// 2.7. GET /api/projects/:id/members - Lấy danh sách thành viên dự án
export const getProjectMembers = api(
  { expose: true, method: "GET", path: "/api/projects/:id/members" },
  async ({ id }: { id: string }): Promise<MemberList> => {
    // First check if project exists
    const project = await db.queryRow`
      SELECT id FROM projects WHERE id = ${id}
    `;
    
    if (!project) {
      throw APIError.notFound("Project not found");
    }
    
    const membersQuery = db.query`
      SELECT u.id, u.name, u.role, u.avatar
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = ${id}
    `;

    const members = [];
    for await (const member of membersQuery) {
      members.push({
        id: member.id,
        name: member.name,
        role: member.role,
        avatar: member.avatar,
      });
    }

    return { members };
  }
);

// 2.8. POST /api/projects/:id/members - Thêm người dùng vào dự án
export const addProjectMember = api(
  { expose: true, method: "POST", path: "/api/projects/:id/members" },
  async ({ id, userId }: { id: string } & AddMemberRequest): Promise<SuccessResponse> => {
    // Check if the project exists
    const project = await db.queryRow`
      SELECT id FROM projects WHERE id = ${id}
    `;
    
    if (!project) {
      throw APIError.notFound("Project not found");
    }
    
    // Check if the user exists
    const user = await db.queryRow`
      SELECT id, name FROM users WHERE id = ${userId}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    // Check if user is already a member
    const existingMember = await db.queryRow`
      SELECT id FROM project_members
      WHERE project_id = ${id} AND user_id = ${userId}
    `;
    
    if (existingMember) {
      throw APIError.invalidArgument("User is already a member of this project");
    }

    // Add the user to the project
    await db.exec`
      INSERT INTO project_members (user_id, project_id)
      VALUES (${userId}, ${id})
    `;

    return {
      success: true,
      message: "User added to project",
      user: {
        id: user.id,
        name: user.name,
      },
    };
  }
);

// 2.9. DELETE /api/projects/:id/members/:userId - Xóa người dùng khỏi dự án
export const removeProjectMember = api(
  { expose: true, method: "DELETE", path: "/api/projects/:id/members/:userId" },
  async ({ id, userId }: { id: string, userId: string }): Promise<SuccessResponse> => {
    // Check if the project exists
    const project = await db.queryRow`
      SELECT id FROM projects WHERE id = ${id}
    `;
    
    if (!project) {
      throw APIError.notFound("Project not found");
    }
    
    // Check if user is a member
    const projectMember = await db.queryRow`
      SELECT id FROM project_members
      WHERE project_id = ${id} AND user_id = ${userId}
    `;

    if (!projectMember) {
      throw APIError.notFound("Project member not found");
    }

    // Remove the user from the project
    await db.exec`
      DELETE FROM project_members
      WHERE project_id = ${id} AND user_id = ${userId}
    `;

    return {
      success: true,
      message: "User removed from project",
    };
  }
);