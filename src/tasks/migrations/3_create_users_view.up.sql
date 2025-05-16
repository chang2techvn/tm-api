-- Tạo view để truy cập bảng users từ service auth
CREATE OR REPLACE VIEW users AS
SELECT * FROM auth.public.users;

-- Nếu view không thể tạo được (có thể do cấu hình Encore), 
-- thì tạo một bảng users local và đồng bộ dữ liệu qua API
-- CREATE TABLE IF NOT EXISTS users_cache (
--   id TEXT PRIMARY KEY,
--   name TEXT NOT NULL,
--   email TEXT NOT NULL UNIQUE,
--   role TEXT NOT NULL,
--   avatar TEXT
-- );