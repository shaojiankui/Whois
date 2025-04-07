import { readBody, createError, setCookie } from 'h3';
import { findUserByEmail, updateUserLastIp } from '~/server/repositories/userRepository';
import { verifyPassword, generateToken } from '~/server/utils/auth';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler(async (event) => {
  try {
    // Read request body
    const body = await readBody(event);
    const { email, password } = body;
    
    // Get client IP
    const ip = event.node.req.headers['x-forwarded-for'] as string || 
               event.node.req.socket.remoteAddress || '';
    
    // Validate input
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email and password are required'
      });
    }
    
    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      });
    }
    
    // Update last login IP
    if (user.id && ip) {
      await updateUserLastIp(user.id, ip);
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set token as cookie
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    // Return response
    return ResponseData.success({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
      },
      token
    }, 'Login successful');
  } catch (error: any) {
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        message: error.message
      });
    }
    
    console.error('Login error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to login'
    });
  }
}); 