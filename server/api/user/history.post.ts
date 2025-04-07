import { readBody, createError } from 'h3';
import { getUserFromEvent } from '~/server/utils/auth';
import { saveQueryHistory } from '~/server/repositories/userRepository';
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
    const { domain, tag, premium, reg_price, renew_price, flag, uuid } = await readBody(event);
    
    // Validate input
    if (!domain) {
      throw createError({
        statusCode: 400,
        message: 'Domain is required'
      });
    }
    
    // Save query history
    const historyId = await saveQueryHistory({
      user_id: userId,
      domain,
      tag: tag || 'whois',
      premium: premium || 0,
      reg_price: reg_price || null,
      renew_price: renew_price || null,
      flag: flag || 0,
      uuid: uuid || null
    });
    
    return ResponseData.success({
      historyId
    }, 'Query history saved successfully');
  } catch (error: any) {
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        message: error.message
      });
    }
    
    console.error('Save query history error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to save query history'
    });
  }
}); 