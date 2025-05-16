import { api, APIError } from "encore.dev/api";
import { extractTokenFromHeader, verifyToken } from '../utils/auth';

/**
 * Authentication function to verify JWT tokens in Encore context
 * 
 * @param token - The token extracted from request headers
 */
export function authenticateToken(token: string) {
  if (!token) {
    throw APIError.unauthenticated("Authentication required. Missing token.");
  }
  
  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    throw APIError.permissionDenied("Invalid or expired token");
  }
}

/**
 * Authorization function to check user role
 * 
 * @param userRole - The role of the user
 * @param allowedRoles - Array of roles allowed to access the resource
 */
export function authorizeRoles(userRole: string, allowedRoles: string[]) {
  if (!userRole) {
    throw APIError.unauthenticated("Authentication required");
  }
  
  if (!allowedRoles.includes(userRole)) {
    throw APIError.permissionDenied("Insufficient permissions");
  }
  
  return true;
}

/**
 * Extract and authenticate user from request headers
 * 
 * @param authorization - The authorization header
 */
export function getAuthenticatedUser(authorization?: string) {
  if (!authorization) {
    throw APIError.unauthenticated("Authentication required");
  }
  
  const token = extractTokenFromHeader(authorization);
  if (!token) {
    throw APIError.unauthenticated("Authentication required");
  }
  
  return authenticateToken(token);
}