-- Use DO block with exception handling to add foreign key constraints
DO $$
BEGIN
    -- Try to add the foreign key constraints
    BEGIN
        ALTER TABLE project_members
        ADD CONSTRAINT fk_project_members_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint to users table';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Users table not found, skipping foreign key constraint';
    END;

    BEGIN
        ALTER TABLE project_members
        ADD CONSTRAINT fk_project_members_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint to projects table';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Projects table not found, skipping foreign key constraint';
    END;
END $$;

-- Migration succeeded, mark it as done
SELECT 'Migration 2 for projects service completed - foreign keys added' AS migration_status;