-- File migration tập trung chứa tất cả bảng cần thiết
-- Thêm extension UUID nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Drop all tables first if they exist to ensure clean migration
-- We use DROP IF EXISTS to avoid errors if tables don't exist
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS url CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP VIEW IF EXISTS user_view CASCADE;

-- Now recreate all tables from scratch

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

-- 5. Tạo bảng url (từ url service)
CREATE TABLE IF NOT EXISTS url (
    id TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Thêm các khóa ngoại, chỉ thêm nếu chưa tồn tại
DO $$ 
BEGIN
    -- Thêm khóa ngoại cho bảng project_members
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_project_members_user'
    ) THEN
        ALTER TABLE project_members
        ADD CONSTRAINT fk_project_members_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_project_members_project'
    ) THEN
        ALTER TABLE project_members
        ADD CONSTRAINT fk_project_members_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;

    -- Thêm khóa ngoại cho bảng tasks
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_users'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT fk_tasks_users
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_projects'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT fk_tasks_projects
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Tạo view user_view cho service users nếu chưa tồn tại
CREATE OR REPLACE VIEW user_view AS
SELECT id, name, email, role, avatar, skills, created_at, updated_at
FROM users;

-- Migration tập trung hoàn tất
SELECT 'Migration tập trung cho tất cả service hoàn tất' AS migration_status;