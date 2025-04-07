import { readBody, createError } from 'h3';
import { getUserFromEvent } from '~/server/utils/auth';
import { saveQueryHistory } from '~/server/repositories/userRepository';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler(async (event) => {
  try {
    console.log('Processing history.post request');
    console.log('Headers:', event.node.req.headers);
    
    // Get user ID from auth token
    const userId = getUserFromEvent(event);
    console.log('User ID from auth token:', userId);
    
    if (!userId) {
      console.log('Authorization failed: No valid user ID found in token');
      return ResponseData.error('Unauthorized: Please log in to save history', 401);
    }
    
    // Read request body
    const body = await readBody(event);
    console.log('Request body:', body);
    
    // Extract and validate parameters
    const domain = body.domain ? String(body.domain).trim() : null;
    const tag = body.tag ? String(body.tag).trim() : 'whois';
    const premium = body.premium !== undefined ? Number(body.premium) : 0;
    // Convert reg_price and renew_price to numbers if present
    const reg_price = body.reg_price !== undefined && body.reg_price !== null ? Number(body.reg_price) : undefined;
    const renew_price = body.renew_price !== undefined && body.renew_price !== null ? Number(body.renew_price) : undefined;
    const flag = body.flag !== undefined ? Number(body.flag) : 0;
    const uuid = body.uuid ? String(body.uuid) : undefined;
    
    // Validate input
    if (!domain) {
      console.log('Validation failed: Domain is required');
      return ResponseData.error('Domain is required', 400);
    }
    
    // Log parameters after validation
    console.log('Validated parameters:', {
      user_id: userId,
      domain,
      tag,
      premium,
      reg_price,
      renew_price,
      flag,
      uuid
    });
    
    try {
      // Save query history
      const historyId = await saveQueryHistory({
        user_id: userId,
        domain,
        tag,
        premium,
        reg_price,
        renew_price,
        flag,
        uuid
      });
      
      console.log('History saved successfully with ID:', historyId);
      return ResponseData.success({
        historyId
      }, 'Query history saved successfully');
    } catch (dbError: any) {
      console.error('Database error in saveQueryHistory:', dbError);
      return ResponseData.error(`Database error: ${dbError.message}`, 500);
    }
  } catch (error: any) {
    console.error('Save query history error:', error);
    
    if (error.statusCode) {
      return ResponseData.error(error.message, error.statusCode);
    }
    
    return ResponseData.error(`Failed to save query history: ${error.message || 'Unknown error'}`, 500);
  }
}); 