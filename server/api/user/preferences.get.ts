import { createError } from 'h3';
import { getUserFromEvent } from '~/server/utils/auth';
import { getUserPreferences } from '~/server/repositories/userRepository';
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
    
    // Get user preferences
    const preferences = await getUserPreferences(userId);
    
    // Convert to key-value object
    const preferencesObject: Record<string, string> = {};
    preferences.forEach(pref => {
      preferencesObject[pref.preferenceKey] = pref.preferenceValue;
    });
    
    return ResponseData.success({
      preferences: preferencesObject
    });
  } catch (error: any) {
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        message: error.message
      });
    }
    
    console.error('Get preferences error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to get preferences'
    });
  }
});