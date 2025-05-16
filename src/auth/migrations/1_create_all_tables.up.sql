-- File migration tập trung chứa tất cả bảng cần thiết
-- Thêm extension UUID nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tạo bảng users (từ auth service)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,
    skills JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Tạo bảng projects (từ projects service)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Tạo bảng project_members (từ projects service)
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    project_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, project_id)
);

-- 4. Tạo bảng tasks (từ tasks service)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    assignee_id UUID,
    due_date TIMESTAMP WITH TIME ZONE,
    project_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Thêm các khóa ngoại

-- Thêm khóa ngoại cho bảng project_members
ALTER TABLE project_members
ADD CONSTRAINT fk_project_members_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE project_members
ADD CONSTRAINT fk_project_members_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Thêm khóa ngoại cho bảng tasks
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_users
FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_projects
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 6. Tạo view user_view cho service users
CREATE OR REPLACE VIEW user_view AS
SELECT id, name, email, role, avatar, skills, created_at, updated_at
FROM users;

-- Migration tập trung hoàn tất
SELECT 'Migration tập trung cho tất cả service hoàn tất' AS migration_status;