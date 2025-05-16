-- Create a view to access user data
-- This migration runs after the users table has been created by the auth service
DO $$ 
BEGIN
    -- Check if the users table exists before creating the view
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Drop view if it exists (in case it was created as a placeholder)
        DROP VIEW IF EXISTS user_view;
        
        -- Create a view to access user data
        CREATE VIEW user_view AS
        SELECT id, name, email, role, avatar, skills, created_at, updated_at
        FROM users;
    END IF;
END $$;