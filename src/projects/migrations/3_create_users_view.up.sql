-- Tạo view để truy cập bảng users từ service auth
CREATE OR REPLACE VIEW users AS
SELECT * FROM auth.public.users;