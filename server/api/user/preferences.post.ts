import { readBody, createError } from 'h3';
import { getUserFromEvent } from '~/server/utils/auth';
import { setUserPreference } from '~/server/repositories/userRepository';
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
    
    // Read request body
    const { key, value } = await readBody(event);
    
    // Validate input
    if (!key || value === undefined) {
      throw createError({
        statusCode: 400,
        message: 'Preference key and value are required'
      });
    }
    
    // Set user preference
    await setUserPreference(userId, key, String(value));
    
    return ResponseData.success(null, 'Preference saved successfully');
  } catch (error: any) {
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        message: error.message
      });
    }
    
    console.error('Set preference error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to save preference'
    });
  }
}); 