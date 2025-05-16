-- Thêm extension UUID nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the tasks table without foreign key constraints first
CREATE TABLE tasks (
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

-- Create a function to add foreign key constraints if the referenced tables exist
DO $$ 
BEGIN
    -- Try to add foreign key for assignee_id if users table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        ALTER TABLE tasks ADD CONSTRAINT fk_tasks_users 
            FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Try to add foreign key for project_id if projects table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        ALTER TABLE tasks ADD CONSTRAINT fk_tasks_projects
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;