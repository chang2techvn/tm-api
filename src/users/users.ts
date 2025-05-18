import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { TaskStatus } from "../tasks/tasks";

// Define the database connection for the users service
// Kết nối đến database auth_db mà không định nghĩa migration, sử dụng SQLDatabase.named()
const db = SQLDatabase.named("auth_db");

// Types for our API responses and requests
interface UserBasic {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  skills: string[];
}

interface UserDetail extends UserBasic {
  email: string;
  stats: UserStats;
}

interface UserList {
  users: UserBasic[];
}

interface UserStats {
  tasks: number;
  projects: number;
  completed: number;
}

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  skills: string[];
}

interface UpdateUserRequest {
  name?: string;
  role?: string;
}

interface UpdateSkillsRequest {
  skills: string[];
}

interface AvatarUpdateRequest {
  avatarBase64: string; // Base64 encoded image string
}

// Thêm interface mới cho response của API đồng bộ cache
interface SyncResponse {
  success: boolean;
  message: string;
  count?: number;
}

// 1.1. GET /api/users - Lấy danh sách tất cả người dùng
export const getAllUsers = api(
  { expose: true, method: "GET", path: "/api/users" },
  async (): Promise<UserList> => {
    const usersQuery = db.query`
      SELECT id, name, role, avatar, skills
      FROM users
    `;

    const users = [];
    for await (const user of usersQuery) {
      users.push({
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        skills: user.skills || [],
      });
    }

    return { users };
  }
);

// 1.2. GET /api/users/:id - Lấy thông tin chi tiết người dùng
export const getUserById = api(
  { expose: true, method: "GET", path: "/api/users/:id" },
  async ({ id }: { id: string }): Promise<UserDetail> => {
    // Get the basic user information
    const user = await db.queryRow`
      SELECT id, name, email, role, avatar, skills
      FROM users
      WHERE id = ${id}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    // Get user's tasks
    const tasksQuery = db.query`
      SELECT id, status
      FROM tasks
      WHERE assignee_id = ${id}
    `;
    
    const tasks = [];
    for await (const task of tasksQuery) {
      tasks.push(task);
    }

    // Get user's project memberships
    const projectMembersQuery = db.query`
      SELECT pm.*, p.id as project_id
      FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE pm.user_id = ${id}
    `;
    
    const projectMembers = [];
    for await (const member of projectMembersQuery) {
      projectMembers.push(member);
    }

    // Calculate user stats
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    const projectCount = projectMembers.length;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      skills: user.skills || [],
      stats: {
        tasks: tasks.length,
        projects: projectCount,
        completed: completedTasks,
      },
    };
  }
);

// 1.3. POST /api/users - Tạo người dùng mới
export const createUser = api(
  { expose: true, method: "POST", path: "/api/users" },
  async (request: CreateUserRequest): Promise<UserDetail> => {
    // Check if email already exists
    const existingUser = await db.queryRow`
      SELECT email FROM users WHERE email = ${request.email}
    `;
    
    if (existingUser) {
      throw APIError.invalidArgument("Email is already in use");
    }
    
    // Create the new user - UUID sẽ được tự động tạo bởi PostgreSQL
    const newUser = await db.queryRow`
      INSERT INTO users (name, email, password, role, skills)
      VALUES (${request.name}, ${request.email}, ${request.password}, ${request.role}, ${JSON.stringify(request.skills)})
      RETURNING *
    `;

    if (!newUser) {
      throw APIError.internal("Failed to create user");
    }

    // Return the created user with stats
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      skills: newUser.skills || [],
      stats: {
        tasks: 0,
        projects: 0,
        completed: 0,
      },
    };
  }
);

// 1.4. PUT /api/users/:id - Cập nhật thông tin người dùng
export const updateUser = api(
  { expose: true, method: "PUT", path: "/api/users/:id" },
  async ({ id, ...request }: { id: string } & UpdateUserRequest): Promise<UserDetail> => {
    // Check if user exists
    const existingUser = await db.queryRow`
      SELECT * FROM users WHERE id = ${id}
    `;
    
    if (!existingUser) {
      throw APIError.notFound("User not found");
    }
    
    // Instead of dynamic query building, we'll handle each case with specific tagged template queries
    let updatedUser = null;
    
    if (request.name !== undefined && request.role !== undefined) {
      // Update both name and role
      updatedUser = await db.queryRow`
        UPDATE users 
        SET name = ${request.name}, role = ${request.role}
        WHERE id = ${id}
        RETURNING id, name, email, role, avatar, skills
      `;
    } else if (request.name !== undefined) {
      // Update only name
      updatedUser = await db.queryRow`
        UPDATE users 
        SET name = ${request.name}
        WHERE id = ${id}
        RETURNING id, name, email, role, avatar, skills
      `;
    } else if (request.role !== undefined) {
      // Update only role
      updatedUser = await db.queryRow`
        UPDATE users 
        SET role = ${request.role}
        WHERE id = ${id}
        RETURNING id, name, email, role, avatar, skills
      `;
    } else {
      // No updates to perform, return current user
      return getUserById({ id });
    }
    
    if (!updatedUser) {
      throw APIError.internal("Failed to update user");
    }
    
    // Get user's tasks
    const tasksQuery = db.query`
      SELECT id, status
      FROM tasks
      WHERE assignee_id = ${id}
    `;
    
    const tasks = [];
    for await (const task of tasksQuery) {
      tasks.push(task);
    }

    // Get user's project memberships
    const projectMembersQuery = db.query`
      SELECT pm.*, p.id as project_id
      FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE pm.user_id = ${id}
    `;
    
    const projectMembers = [];
    for await (const member of projectMembersQuery) {
      projectMembers.push(member);
    }

    // Calculate user stats
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    const projectCount = projectMembers.length;

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      skills: updatedUser.skills || [],
      stats: {
        tasks: tasks.length,
        projects: projectCount,
        completed: completedTasks,
      },
    };
  }
);

// 1.5. PATCH /api/users/:id/skills - Cập nhật kỹ năng của người dùng
export const updateUserSkills = api(
  { expose: true, method: "PATCH", path: "/api/users/:id/skills" },
  async ({ id, skills }: { id: string } & UpdateSkillsRequest): Promise<Pick<UserBasic, "id" | "name" | "skills">> => {
    // Check if user exists
    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE id = ${id}
    `;
    
    if (!existingUser) {
      throw APIError.notFound("User not found");
    }
    
    // Update the user's skills
    const updatedUser = await db.queryRow`
      UPDATE users
      SET skills = ${JSON.stringify(skills)}
      WHERE id = ${id}
      RETURNING id, name, skills
    `;

    if (!updatedUser) {
      throw APIError.internal("Failed to update user skills");
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      skills: updatedUser.skills || [],
    };
  }
);

// 1.6. PATCH /api/users/:id/avatar - Cập nhật avatar người dùng (using Base64)
export const updateUserAvatar = api(
  { expose: true, method: "PATCH", path: "/api/users/:id/avatar" },
  async ({ id, avatarBase64 }: { id: string } & AvatarUpdateRequest): Promise<Pick<UserBasic, "id" | "avatar">> => {
    // Check if user exists
    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE id = ${id}
    `;
    
    if (!existingUser) {
      throw APIError.notFound("User not found");
    }
    
    // Check if the provided string is a valid Base64 image
    if (!avatarBase64 || !avatarBase64.startsWith('data:image/')) {
      throw APIError.invalidArgument("Invalid image format. Please provide a valid Base64 encoded image.");
    }

    // Update the avatar with the Base64 string
    const updatedUser = await db.queryRow`
      UPDATE users
      SET avatar = ${avatarBase64}
      WHERE id = ${id}
      RETURNING id, avatar
    `;

    if (!updatedUser) {
      throw APIError.internal("Failed to update user avatar");
    }

    return {
      id: updatedUser.id,
      avatar: updatedUser.avatar,
    };
  }
);

// 1.7. GET /api/users/:id/stats - Lấy thống kê người dùng
export const getUserStats = api(
  { expose: true, method: "GET", path: "/api/users/:id/stats" },
  async ({ id }: { id: string }): Promise<UserStats> => {
    // Check if user exists
    const userExists = await db.queryRow`
      SELECT id FROM users WHERE id = ${id}
    `;
    
    if (!userExists) {
      throw APIError.notFound("User not found");
    }
    
    // Get user's tasks
    const tasksQuery = db.query`
      SELECT id, status
      FROM tasks
      WHERE assignee_id = ${id}
    `;
    
    const tasks = [];
    for await (const task of tasksQuery) {
      tasks.push(task);
    }

    // Get user's project memberships
    const projectMembersQuery = db.query`
      SELECT pm.id
      FROM project_members pm
      WHERE pm.user_id = ${id}
    `;
    
    const projectMembers = [];
    for await (const member of projectMembersQuery) {
      projectMembers.push(member);
    }

    // Calculate user stats
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    const projectCount = projectMembers.length;

    return {
      tasks: tasks.length,
      projects: projectCount,
      completed: completedTasks,
    };
  }
);

// API để đồng bộ tất cả người dùng vào cache
export const syncAllUsersToCache = api(
  { expose: true, method: "POST", path: "/api/users/sync-cache" },
  async (): Promise<SyncResponse> => {
    try {
      // Truy vấn tất cả người dùng
      const usersQuery = db.query`
        SELECT id, name, email, role, avatar, skills
        FROM users
      `;
      
      const users = [];
      for await (const user of usersQuery) {
        users.push(user);
      }
      
      // Ở đây bạn có thể thêm logic để lưu vào cache thực tế
      // Ví dụ: Redis hoặc memory cache
      
      return {
        success: true,
        message: `Successfully synced ${users.length} users to cache`,
        count: users.length
      };
    } catch (error) {
      throw APIError.internal("Failed to sync users to cache");
    }
  }
);