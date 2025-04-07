import { readBody, createError } from 'h3';
import { createUser, findUserByEmail } from '~/server/repositories/userRepository';
import { hashPassword } from '~/server/utils/auth';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler(async (event) => {
  try {
    // Read request body
    const body = await readBody(event);
    const { username, email, password, name } = body;
    
    // Get client IP
    const ip = event.node.req.headers['x-forwarded-for'] as string || 
               event.node.req.socket.remoteAddress || '';
    
    // Validate input
    if (!username || !email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Username, email and password are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid email format'
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: 'Email already registered'
      });
    }
    
    // Hash password
    const hashedPassword = hashPassword(password);
    
    // Create user
    const userId = await createUser({
      username,
      name: name || username,
      email,
      password: hashedPassword,
      reg_ip: ip,
      last_ip: ip
    });
    
    return ResponseData.success({
      userId
    }, 'User registered successfully');
  } catch (error: any) {
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        message: error.message
      });
    }
    
    console.error('Registration error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to register user'
    });
  }
}); 