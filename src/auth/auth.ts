import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateRefreshToken,
  createSafeUser,
  verifyToken,
  UserData
} from '../utils/auth';
import { TaskStatus } from "../tasks/tasks";

// Define the database connection for the auth service
// Chỉ giữ lại migration trong service auth
const db = new SQLDatabase("biwoco_management_db", { migrations: "./migrations" });

// Types for our API
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserDetail extends AuthUser {
  avatar: string | null;
  skills: string[];
  stats: UserStats;
}

interface UserStats {
  tasks: number;
  projects: number;
  completed: number;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresAt: string; // Changed to string for better JSON serialization
}

interface SuccessResponse {
  success: boolean;
  message: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

// 4.1. POST /api/auth/login - Đăng nhập
export const login = api(
  { expose: true, method: "POST", path: "/api/auth/login" },
  async (request: LoginRequest): Promise<AuthResponse> => {
    // Find the user by email
    const user = await db.queryRow`
      SELECT * FROM users WHERE email = ${request.email}
    `;

    // Check if user exists
    if (!user) {
      throw APIError.notFound("Invalid email or password");
    }

    // Compare passwords
    const passwordValid = await comparePassword(request.password, user.password);
    if (!passwordValid) {
      throw APIError.permissionDenied("Invalid email or password");
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Token expires in 1 day

    // Convert database row to UserData type
    const userData: UserData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      // Include any other properties
      avatar: user.avatar,
      skills: user.skills || []
    };

    return {
      user: createSafeUser(userData),
      token,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }
);

// 4.2. POST /api/auth/signup - Đăng ký
export const signup = api(
  { expose: true, method: "POST", path: "/api/auth/signup" },
  async (request: SignupRequest): Promise<AuthResponse> => {
    // Check if email is already registered
    const existingUser = await db.queryRow`
      SELECT * FROM users WHERE email = ${request.email}
    `;

    if (existingUser) {
      throw APIError.invalidArgument("Email already registered");
    }

    // Hash the password before saving
    const hashedPassword = await hashPassword(request.password);

    // Create the new user with hashed password - UUID sẽ được tự động tạo bởi PostgreSQL
    const newUser = await db.queryRow`
      INSERT INTO users (name, email, password, role, skills)
      VALUES (${request.name}, ${request.email}, ${hashedPassword}, ${request.role}, '[]')
      RETURNING *
    `;

    if (!newUser) {
      throw APIError.internal("Failed to create user");
    }

    // Generate tokens
    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    };
    
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Token expires in 1 day

    // Convert database row to UserData type
    const userData: UserData = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      // Include any other properties
      avatar: newUser.avatar,
      skills: newUser.skills || []
    };

    return {
      user: createSafeUser(userData),
      token,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }
);

// 4.3. GET /api/auth/me - Lấy thông tin người dùng hiện tại
export const getCurrentUser = api(
  { expose: true, method: "GET", path: "/api/auth/me" },
  async (params: { userId: string }): Promise<UserDetail> => {
    const user = await db.queryRow`
      SELECT * FROM users WHERE id = ${params.userId}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    // Get tasks for this user
    const tasksRows = await db.query`
      SELECT * FROM tasks WHERE assignee_id = ${params.userId}
    `;
    
    const tasks = [];
    for await (const row of tasksRows) {
      tasks.push(row);
    }

    // Get project memberships for this user
    const projectMembersRows = await db.query`
      SELECT pm.*, p.id as project_id 
      FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE pm.user_id = ${params.userId}
    `;
    
    const projectMembers = [];
    for await (const row of projectMembersRows) {
      projectMembers.push(row);
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

// 4.4. POST /api/auth/logout - Đăng xuất
export const logout = api(
  { expose: true, method: "POST", path: "/api/auth/logout" },
  async (): Promise<SuccessResponse> => {
    // In a real application with a token repository, we would invalidate the token
    // For this implementation, we'll assume client-side token removal
    return {
      success: true,
      message: "Logged out successfully",
    };
  }
);

// 4.5. POST /api/auth/refresh - Làm mới token
export const refreshToken = api(
  { expose: true, method: "POST", path: "/api/auth/refresh" },
  async (request: RefreshTokenRequest): Promise<AuthResponse> => {
    try {
      // Verify the refresh token
      const decoded = verifyToken(request.refreshToken);
      
      // Get user from database to ensure they still exist and have correct permissions
      const user = await db.queryRow`
        SELECT * FROM users WHERE id = ${decoded.userId}
      `;
      
      if (!user) {
        throw APIError.notFound("User not found");
      }
      
      // Generate new tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };
      
      const newToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);
      
      // Convert database row to UserData type
      const userData: UserData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        // Include any other properties
        avatar: user.avatar,
        skills: user.skills || []
      };
      
      return {
        user: createSafeUser(userData),
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt: expiresAt.toISOString()
      };
    } catch (error) {
      throw APIError.permissionDenied("Invalid or expired refresh token");
    }
  }
);