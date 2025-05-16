import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Define the database connection for the tasks service
const db = new SQLDatabase("tasks", { migrations: "./migrations" });

// Define our own TaskStatus enum instead of importing from Prisma
export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

// Types for our API
interface TaskBasic {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee?: {
    id: string;
    name: string;
  } | null;
  dueDate: Date | null;
  projectId: string;
}

interface TaskDetail extends TaskBasic {
  createdAt: Date;
  updatedAt: Date;
}

interface TaskList {
  tasks: TaskBasic[];
}

interface CreateTaskRequest {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null;
  projectId: string;
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
  projectId?: string;
}

interface UpdateTaskStatusRequest {
  status: TaskStatus;
  projectId: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
}

// 3.1. GET /api/tasks?projectId=:projectId - Lấy tất cả nhiệm vụ trong dự án
export const getAllTasks = api(
  { expose: true, method: "GET", path: "/api/tasks" },
  async ({ projectId }: { projectId?: string }): Promise<TaskList> => {
    let tasksQuery;
    
    if (projectId) {
      tasksQuery = db.query`
        SELECT t.*, u.id as assignee_id, u.name as assignee_name
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.project_id = ${projectId}
      `;
    } else {
      tasksQuery = db.query`
        SELECT t.*, u.id as assignee_id, u.name as assignee_name
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
      `;
    }

    const tasks: TaskBasic[] = [];
    
    for await (const row of tasksQuery) {
      tasks.push({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status as TaskStatus,
        assignee: row.assignee_id ? {
          id: row.assignee_id,
          name: row.assignee_name
        } : null,
        dueDate: row.due_date,
        projectId: row.project_id,
      });
    }

    return { tasks };
  }
);

// 3.2. GET /api/tasks/:id - Lấy thông tin chi tiết nhiệm vụ
export const getTaskById = api(
  { expose: true, method: "GET", path: "/api/tasks/:id" },
  async ({ id }: { id: string }): Promise<TaskDetail> => {
    const task = await db.queryRow`
      SELECT t.*, u.id as assignee_id, u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.id = ${id}
    `;

    if (!task) {
      throw APIError.notFound("Task not found");
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatus,
      assignee: task.assignee_id ? {
        id: task.assignee_id,
        name: task.assignee_name
      } : null,
      dueDate: task.due_date,
      projectId: task.project_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  }
);

// 3.3. POST /api/tasks - Tạo nhiệm vụ mới
export const createTask = api(
  { expose: true, method: "POST", path: "/api/tasks" },
  async (request: CreateTaskRequest): Promise<TaskDetail> => {
    // Parse date if provided
    const dueDate = request.dueDate ? new Date(request.dueDate) : null;
    
    const result = await db.queryRow`
      INSERT INTO tasks (
        title, description, status, assignee_id, due_date, project_id
      ) VALUES (
        ${request.title},
        ${request.description},
        ${request.status},
        ${request.assigneeId},
        ${dueDate},
        ${request.projectId}
      )
      RETURNING id, title, description, status, assignee_id, due_date, project_id, created_at, updated_at
    `;
    
    if (!result) {
      throw APIError.internal("Failed to create task");
    }
    
    // If assignee is provided, get their information
    let assignee = null;
    if (result.assignee_id) {
      const assigneeData = await db.queryRow`
        SELECT id, name FROM users WHERE id = ${result.assignee_id}
      `;
      
      if (assigneeData) {
        assignee = {
          id: assigneeData.id,
          name: assigneeData.name
        };
      }
    }

    return {
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status as TaskStatus,
      assignee: assignee,
      dueDate: result.due_date,
      projectId: result.project_id,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }
);

// 3.4. PUT /api/tasks/:id - Cập nhật thông tin nhiệm vụ
export const updateTask = api(
  { expose: true, method: "PUT", path: "/api/tasks/:id" },
  async ({ id, ...request }: { id: string } & UpdateTaskRequest): Promise<TaskDetail> => {
    // Check if task exists
    const existingTask = await db.queryRow`
      SELECT * FROM tasks WHERE id = ${id}
    `;
    
    if (!existingTask) {
      throw APIError.notFound("Task not found");
    }
    
    // Instead of creating a dynamic query, we'll handle each case separately using tagged templates
    let result = null;
    
    // Handle different combinations of update fields
    if (request.title !== undefined && request.status !== undefined && request.assigneeId !== undefined && request.dueDate !== undefined && request.projectId !== undefined) {
      const dueDate = request.dueDate ? new Date(request.dueDate) : null;
      result = await db.queryRow`
        UPDATE tasks 
        SET 
          title = ${request.title}, 
          description = ${request.description}, 
          status = ${request.status}, 
          assignee_id = ${request.assigneeId}, 
          due_date = ${dueDate}, 
          project_id = ${request.projectId},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, description, status, assignee_id, due_date, project_id, created_at, updated_at
      `;
    } else if (request.title !== undefined) {
      // Handle title update
      result = await db.queryRow`
        UPDATE tasks 
        SET title = ${request.title}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, description, status, assignee_id, due_date, project_id, created_at, updated_at
      `;
    } else if (request.description !== undefined) {
      // Handle description update
      result = await db.queryRow`
        UPDATE tasks 
        SET description = ${request.description}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, description, status, assignee_id, due_date, project_id, created_at, updated_at
      `;
    } else if (request.status !== undefined) {
      // Handle status update
      result = await db.queryRow`
        UPDATE tasks 
        SET status = ${request.status}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, description, status, assignee_id, due_date, project_id, created_at, updated_at
      `;
    } else if (request.assigneeId !== undefined) {
      // Handle assignee update
      result = await db.queryRow`
        UPDATE tasks 
        SET assignee_id = ${request.assigneeId}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, description, status, assignee_id, due_date, project_id, created_at, updated_at
      `;
    } else if (request.dueDate !== undefined) {
      // Handle due date update
      const dueDate = request.dueDate ? new Date(request.dueDate) : null;
      result = await db.queryRow`
        UPDATE tasks 
        SET due_date = ${dueDate}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, description, status, assignee_id, due_date, project_id, created_at, updated_at
      `;
    } else if (request.projectId !== undefined) {
      // Handle project id update
      result = await db.queryRow`
        UPDATE tasks 
        SET project_id = ${request.projectId}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, description, status, assignee_id, due_date, project_id, created_at, updated_at
      `;
    } else {
      // No updates to perform
      return getTaskById({ id });
    }
    
    if (!result) {
      throw APIError.internal("Failed to update task");
    }
    
    // Get assignee information if available
    let assignee = null;
    if (result.assignee_id) {
      const assigneeData = await db.queryRow`
        SELECT id, name FROM users WHERE id = ${result.assignee_id}
      `;
      
      if (assigneeData) {
        assignee = {
          id: assigneeData.id,
          name: assigneeData.name
        };
      }
    }
    
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status as TaskStatus,
      assignee: assignee,
      dueDate: result.due_date,
      projectId: result.project_id,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }
);

// 3.5. PATCH /api/tasks/:id/status - Cập nhật trạng thái nhiệm vụ
export const updateTaskStatus = api(
  { expose: true, method: "PATCH", path: "/api/tasks/:id/status" },
  async ({ id, status, projectId }: { id: string } & UpdateTaskStatusRequest): Promise<Partial<TaskDetail>> => {
    // Verify project exists and task belongs to project
    const task = await db.queryRow`
      SELECT * FROM tasks
      WHERE id = ${id} AND project_id = ${projectId}
    `;

    if (!task) {
      throw APIError.notFound("Task not found or doesn't belong to specified project");
    }

    const result = await db.queryRow`
      UPDATE tasks
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, title, status, assignee_id, updated_at
    `;
    
    if (!result) {
      throw APIError.internal("Failed to update task status");
    }
    
    // Get assignee information if available
    let assignee = null;
    if (result.assignee_id) {
      const assigneeData = await db.queryRow`
        SELECT id, name FROM users WHERE id = ${result.assignee_id}
      `;
      
      if (assigneeData) {
        assignee = {
          id: assigneeData.id,
          name: assigneeData.name
        };
      }
    }

    return {
      id: result.id,
      title: result.title,
      status: result.status as TaskStatus,
      assignee: assignee,
      updatedAt: result.updated_at,
    };
  }
);

// 3.6. DELETE /api/tasks/:id - Xóa nhiệm vụ
export const deleteTask = api(
  { expose: true, method: "DELETE", path: "/api/tasks/:id" },
  async ({ id }: { id: string }): Promise<SuccessResponse> => {
    // Check if task exists
    const existingTask = await db.queryRow`
      SELECT id FROM tasks WHERE id = ${id}
    `;
    
    if (!existingTask) {
      throw APIError.notFound("Task not found");
    }
    
    await db.exec`
      DELETE FROM tasks WHERE id = ${id}
    `;

    return {
      success: true,
      message: "Task deleted successfully",
    };
  }
);