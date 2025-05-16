-- Drop tất cả các bảng theo thứ tự ngược lại để tránh lỗi ràng buộc khóa ngoại

-- 1. Drop view
DROP VIEW IF EXISTS user_view;

-- 2. Drop bảng tasks (phụ thuộc vào users và projects)
DROP TABLE IF EXISTS tasks;

-- 3. Drop bảng project_members (phụ thuộc vào users và projects)
DROP TABLE IF EXISTS project_members;

-- 4. Drop bảng projects
DROP TABLE IF EXISTS projects;

-- 5. Drop bảng users
DROP TABLE IF EXISTS users;