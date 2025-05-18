# Project Management API

This is a REST API for a project management system deployed on Encore Cloud. The API provides endpoints for user management, project management, task management, and authentication.

## API Base URL

The API is deployed at: `https://prod-management-api-2zoi.encr.app`

## API Documentation

### Authentication APIs

#### 1. User Registration (Signup)

- **Endpoint**: `POST /api/auth/signup`
- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name",
    "role": "user"
  }
  ```
- **Response**:
  ```json
  {
    "token": "JWT_TOKEN",
    "refreshToken": "REFRESH_TOKEN",
    "expiresAt": "2025-05-19T10:12:00.525Z",
    "user": {
      "id": "USER_ID",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user"
    }
  }
  ```

#### 2. User Login

- **Endpoint**: `POST /api/auth/login`
- **Description**: Login an existing user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "token": "JWT_TOKEN",
    "refreshToken": "REFRESH_TOKEN",
    "expiresAt": "2025-05-19T10:12:10.019Z",
    "user": {
      "id": "USER_ID",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user"
    }
  }
  ```

#### 3. Get Current User

- **Endpoint**: `GET /api/auth/me?userId=USER_ID`
- **Description**: Get the current authenticated user's profile
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Query Parameters**: `userId` - The ID of the current user
- **Response**:
  ```json
  {
    "id": "USER_ID",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "skills": [],
    "avatar": null,
    "stats": {
      "projects": 0,
      "tasks": 0,
      "completed": 0
    }
  }
  ```

### User Management APIs

#### 1. Get All Users

- **Endpoint**: `GET /api/users`
- **Description**: Get a list of all users
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "users": [
      {
        "id": "USER_ID",
        "name": "User Name",
        "role": "user",
        "skills": [],
        "avatar": null
      }
    ]
  }
  ```

#### 2. Get User by ID

- **Endpoint**: `GET /api/users/:id`
- **Description**: Get details for a specific user
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "id": "USER_ID",
    "name": "User Name",
    "email": "user@example.com",
    "role": "user",
    "skills": [],
    "avatar": null,
    "stats": {
      "projects": 0,
      "tasks": 0,
      "completed": 0
    }
  }
  ```

#### 3. Create User

- **Endpoint**: `POST /api/users`
- **Description**: Create a new user (Admin function)
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name",
    "role": "user"
  }
  ```
- **Response**: Same as User Registration

#### 4. Update User

- **Endpoint**: `PUT /api/users/:id`
- **Description**: Update user information
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "name": "Updated User Name",
    "email": "user@example.com",
    "role": "user"
  }
  ```
- **Response**:
  ```json
  {
    "id": "USER_ID",
    "name": "Updated User Name",
    "email": "user@example.com",
    "role": "user",
    "skills": [],
    "avatar": null,
    "stats": {
      "projects": 0,
      "tasks": 0,
      "completed": 0
    }
  }
  ```

#### 5. Update User Skills

- **Endpoint**: `PATCH /api/users/:id/skills`
- **Description**: Update the skills of a user
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "skills": ["JavaScript", "React", "TypeScript"]
  }
  ```
- **Response**:
  ```json
  {
    "id": "USER_ID",
    "name": "User Name",
    "skills": "[\"JavaScript\",\"React\",\"TypeScript\"]"
  }
  ```

#### 6. Update User Avatar

- **Endpoint**: `PATCH /api/users/:id/avatar`
- **Description**: Update the avatar of a user
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "avatarBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  }
  ```
- **Response**:
  ```json
  {
    "id": "USER_ID",
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  }
  ```

#### 7. Get User Stats

- **Endpoint**: `GET /api/users/:id/stats`
- **Description**: Get statistics for a user
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "projects": 0,
    "tasks": 0,
    "completed": 0
  }
  ```

### Project Management APIs

#### 1. Get All Projects

- **Endpoint**: `GET /api/projects`
- **Description**: Get a list of all projects
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "projects": [
      {
        "id": "PROJECT_ID",
        "name": "Project Name",
        "description": "Project Description",
        "createdAt": "2025-05-18T10:16:12.023Z",
        "members": [],
        "taskCount": 0
      }
    ]
  }
  ```

#### 2. Get Project by ID

- **Endpoint**: `GET /api/projects/:id`
- **Description**: Get details for a specific project
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "id": "PROJECT_ID",
    "name": "Project Name",
    "description": "Project Description",
    "createdAt": "2025-05-18T10:16:12.023Z",
    "members": [],
    "taskCount": 0
  }
  ```

#### 3. Create Project

- **Endpoint**: `POST /api/projects`
- **Description**: Create a new project
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "name": "Project Name",
    "description": "Project Description",
    "startDate": "2025-05-18T00:00:00.000Z",
    "endDate": "2025-06-18T00:00:00.000Z"
  }
  ```
- **Response**:
  ```json
  {
    "id": "PROJECT_ID",
    "name": "Project Name",
    "description": "Project Description",
    "createdAt": "2025-05-18T10:16:12.023Z",
    "members": [],
    "taskCount": 0
  }
  ```

#### 4. Update Project

- **Endpoint**: `PUT /api/projects/:id`
- **Description**: Update project information
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "name": "Updated Project Name",
    "description": "Updated Project Description",
    "startDate": "2025-05-18T00:00:00.000Z",
    "endDate": "2025-07-18T00:00:00.000Z"
  }
  ```
- **Response**: Same as Get Project by ID, with updated values

#### 5. Delete Project

- **Endpoint**: `DELETE /api/projects/:id`
- **Description**: Delete a project
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "message": "Project deleted successfully",
    "success": true
  }
  ```

#### 6. Get Project Tasks

- **Endpoint**: `GET /api/projects/:id/tasks`
- **Description**: Get all tasks for a specific project
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "tasks": [
      {
        "id": "TASK_ID",
        "title": "Task Title",
        "description": "Task Description",
        "status": "TODO",
        "dueDate": "2025-06-01T00:00:00Z",
        "assignee": {
          "id": "USER_ID",
          "name": "User Name"
        }
      }
    ]
  }
  ```

#### 7. Get Project Members

- **Endpoint**: `GET /api/projects/:id/members`
- **Description**: Get all members of a specific project
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "members": [
      {
        "id": "USER_ID",
        "name": "User Name",
        "role": "user",
        "avatar": "data:image/png;base64,..."
      }
    ]
  }
  ```

#### 8. Add User to Project

- **Endpoint**: `POST /api/projects/:id/members`
- **Description**: Add a user to a project
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "userId": "USER_ID"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User added to project",
    "user": {
      "id": "USER_ID",
      "name": "User Name"
    },
    "success": true
  }
  ```

#### 9. Remove User from Project

- **Endpoint**: `DELETE /api/projects/:id/members/:userId`
- **Description**: Remove a user from a project
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "message": "User removed from project",
    "success": true
  }
  ```

### Task Management APIs

#### 1. Get All Tasks

- **Endpoint**: `GET /api/tasks?projectId=PROJECT_ID`
- **Description**: Get all tasks, optionally filtered by project
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Query Parameters**: `projectId` (optional) - Filter tasks by project ID
- **Response**:
  ```json
  {
    "tasks": [
      {
        "id": "TASK_ID",
        "title": "Task Title",
        "description": "Task Description",
        "status": "TODO",
        "dueDate": "2025-06-01T00:00:00Z",
        "assignee": {
          "id": "USER_ID",
          "name": "User Name"
        }
      }
    ]
  }
  ```

#### 2. Get Task by ID

- **Endpoint**: `GET /api/tasks/:id`
- **Description**: Get details for a specific task
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "id": "TASK_ID",
    "title": "Task Title",
    "description": "Task Description",
    "status": "TODO",
    "dueDate": "2025-06-01T00:00:00Z",
    "projectId": "PROJECT_ID",
    "assignee": {
      "id": "USER_ID",
      "name": "User Name"
    },
    "createdAt": "2025-05-18T10:20:42.771Z",
    "updatedAt": "2025-05-18T10:20:42.771Z"
  }
  ```

#### 3. Create Task

- **Endpoint**: `POST /api/tasks`
- **Description**: Create a new task
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "title": "Task Title",
    "description": "Task Description",
    "projectId": "PROJECT_ID",
    "assigneeId": "USER_ID",
    "status": "TODO",
    "dueDate": "2025-06-01T00:00:00.000Z"
  }
  ```
  Note: Status must be one of: "TODO", "IN_PROGRESS", or "DONE" (uppercase)
- **Response**:
  ```json
  {
    "id": "TASK_ID",
    "title": "Task Title",
    "description": "Task Description",
    "status": "TODO",
    "dueDate": "2025-06-01T00:00:00Z",
    "projectId": "PROJECT_ID",
    "assignee": {
      "id": "USER_ID",
      "name": "User Name"
    },
    "createdAt": "2025-05-18T10:20:42.771Z",
    "updatedAt": "2025-05-18T10:20:42.771Z"
  }
  ```

#### 4. Update Task

- **Endpoint**: `PUT /api/tasks/:id`
- **Description**: Update task information
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "title": "Updated Task Title",
    "description": "Updated Task Description",
    "projectId": "PROJECT_ID",
    "assigneeId": "USER_ID",
    "status": "IN_PROGRESS",
    "dueDate": "2025-06-01T00:00:00.000Z"
  }
  ```
- **Response**: Same as Get Task by ID, with updated values

#### 5. Update Task Status

- **Endpoint**: `PUT /api/tasks/:id`
- **Description**: Update task status (use the main update endpoint)
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Request Body**:
  ```json
  {
    "title": "Task Title",
    "description": "Task Description",
    "projectId": "PROJECT_ID",
    "assigneeId": "USER_ID",
    "status": "IN_PROGRESS",
    "dueDate": "2025-06-01T00:00:00.000Z"
  }
  ```
- **Response**: Same as Update Task

#### 6. Delete Task

- **Endpoint**: `DELETE /api/tasks/:id`
- **Description**: Delete a task
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Response**:
  ```json
  {
    "message": "Task deleted successfully",
    "success": true
  }
  ```

## Example Frontend Integration

### Authentication

```javascript
// Login example
async function login(email, password) {
  try {
    const response = await fetch('https://prod-management-api-2zoi.encr.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    
    if (response.ok) {
      // Store token in localStorage or secure cookie
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userId', data.user.id);
      return data.user;
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Get current user example
async function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`https://prod-management-api-2zoi.encr.app/api/auth/me?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to get user data');
    }
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
}
```

### Projects Management

```javascript
// Get all projects example
async function getAllProjects() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('https://prod-management-api-2zoi.encr.app/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.projects;
    } else {
      throw new Error(data.message || 'Failed to fetch projects');
    }
  } catch (error) {
    console.error('Get projects error:', error);
    throw error;
  }
}

// Create project example
async function createProject(projectData) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('https://prod-management-api-2zoi.encr.app/api/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to create project');
    }
  } catch (error) {
    console.error('Create project error:', error);
    throw error;
  }
}
```

### Tasks Management

```javascript
// Get tasks for a project example
async function getProjectTasks(projectId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`https://prod-management-api-2zoi.encr.app/api/projects/${projectId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.tasks;
    } else {
      throw new Error(data.message || 'Failed to fetch tasks');
    }
  } catch (error) {
    console.error('Get tasks error:', error);
    throw error;
  }
}

// Create task example
async function createTask(taskData) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('https://prod-management-api-2zoi.encr.app/api/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to create task');
    }
  } catch (error) {
    console.error('Create task error:', error);
    throw error;
  }
}

// Update task status example
async function updateTaskStatus(taskId, task) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`https://prod-management-api-2zoi.encr.app/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to update task status');
    }
  } catch (error) {
    console.error('Update task status error:', error);
    throw error;
  }
}
```

## Important Notes

1. The API requires authentication for most endpoints using JWT tokens.
2. Always include the token in the Authorization header as `Bearer TOKEN`.
3. When updating task status, use the main PUT endpoint as the specific PATCH endpoint has issues.
4. Task status values must be capitalized: "TODO", "IN_PROGRESS", or "DONE".
5. The avatar update endpoint requires the field to be named `avatarBase64` (not `avatar`).
