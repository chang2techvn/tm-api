// File: src/config/env.ts
// Chứa các biến môi trường và cấu hình ứng dụng

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Password hashing
export const SALT_ROUNDS = 10;

// Database configuration
export const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/management_api';

// Server configuration
export const PORT = process.env.PORT || 3000;