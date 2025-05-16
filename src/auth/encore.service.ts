import { Service } from "encore.dev/service";
import { extractTokenFromHeader, verifyToken } from '../utils/auth';

// Define Service
export default new Service("auth-middleware");

// Interface for authentication context
interface AuthContext {
  userId: string;
  userRole: string;
}

/**
 * Utility function to check authentication from Authorization header
 */
export function extractAuthFromHeader(authorization?: string): AuthContext {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }
  
  const token = authorization.substring(7);
  try {
    const decoded = verifyToken(token);
    return {
      userId: decoded.userId,
      userRole: decoded.role
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Check access based on user role
 */
export function checkRoleAccess(userRole: string, allowedRoles: string[]) {
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

// Note: In Encore, we don't use middleware directly
// Instead, we create utility functions for use in API endpoints