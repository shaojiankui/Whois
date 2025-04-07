import { createError } from 'h3';
import { getUserFromEvent } from '~/server/utils/auth';
import { findUserById } from '~/server/repositories/userRepository';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler(async (event) => {
  try {
    // Get user ID from auth token
    const userId = getUserFromEvent(event);
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      });
    }
    
    // Find user by ID
    const user = await findUserById(userId);
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      });
    }
    
    // Return user data (without password)
    return ResponseData.success({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      reg_time: user.reg_time,
      reg_ip: user.reg_ip,
      last_ip: user.last_ip
    });
  } catch (error: any) {
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        message: error.message
      });
    }
    
    console.error('Get user error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to get user data'
    });
  }
}); 