-- This file exists to maintain consistency with the Encore.ts pattern
-- but the actual user table is defined in the auth service migration
-- since authentication is tightly coupled with user management.

-- We'll create a placeholder trigger function to satisfy migration
-- The actual view will be created in a subsequent migration
CREATE OR REPLACE FUNCTION dummy_function() RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;