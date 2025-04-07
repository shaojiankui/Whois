import crypto from 'crypto';
import { H3Event } from 'h3';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';

// Secret key for JWT signing (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '7d'; // Token expires in 7 days

/**
 * Hash a password with SHA-256 and salt
 * @param password Plain text password
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hashed password
 * @param password Plain text password
 * @param hashedPassword Hashed password from database
 * @returns true if password matches, false otherwise
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const calculatedHash = crypto.createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  return hash === calculatedHash;
}

/**
 * Generate a JWT token for a user
 * @param user User object
 * @returns JWT token
 */
export function generateToken(user: User): string {
  const payload = {
    sub: user.id,
    email: user.email,
    username: user.username
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify a JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Get the current user from the request
 * @param event H3Event
 * @returns User ID or null if not authenticated
 */
export function getUserFromEvent(event: H3Event): number | null {
  try {
    // Get token from cookie or authorization header
    const token = getCookieFromEvent(event, 'auth_token') || 
      (event.node.req.headers.authorization || '').replace('Bearer ', '');
    
    if (!token) {
      return null;
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.sub) {
      return null;
    }
    
    return decoded.sub;
  } catch (error) {
    return null;
  }
}

/**
 * Get a cookie value from the request
 * @param event H3Event
 * @param name Cookie name
 * @returns Cookie value or null
 */
export function getCookieFromEvent(event: H3Event, name: string): string | null {
  const cookies = parseCookies(event);
  return cookies[name] || null;
}

/**
 * Parse cookies from the request
 * @param event H3Event
 * @returns Object with cookie name-value pairs
 */
function parseCookies(event: H3Event): Record<string, string> {
  const cookieHeader = event.node.req.headers.cookie || '';
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name) {
      cookies[name] = value || '';
    }
  });
  
  return cookies;
}

/**
 * Generate a random token for password reset
 * @returns Random token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
} 