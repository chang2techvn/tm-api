-- This migration ensures foreign keys are added after all tables exist
DO $$ 
BEGIN
    -- Add foreign key for assignee_id if it doesn't exist yet and users table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') AND 
       NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_users') THEN
        ALTER TABLE tasks ADD CONSTRAINT fk_tasks_users 
            FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add foreign key for project_id if it doesn't exist yet and projects table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') AND
       NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_projects') THEN
        ALTER TABLE tasks ADD CONSTRAINT fk_tasks_projects
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;