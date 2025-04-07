import { getQuery } from 'h3';
import { getUserFromEvent } from '~/server/utils/auth';
import { getUserQueryHistory } from '~/server/repositories/userRepository';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler(async (event) => {
  try {
    console.log('Processing history.get request');
    console.log('Headers:', event.node.req.headers);
    
    // 获取用户ID
    const userId = getUserFromEvent(event);
    console.log('User ID from token:', userId);
    
    if (!userId) {
      console.log('Unauthorized access attempt to history API');
      return ResponseData.error('Unauthorized: Please log in to view history', 401);
    }
    
    // 解析分页参数
    const query = getQuery(event);
    console.log('Query parameters:', query);
    
    // Ensure limit and page are valid numbers
    let limit = 20;
    let page = 1;
    
    if (query.limit) {
      const parsedLimit = parseInt(query.limit as string);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }
    
    if (query.page) {
      const parsedPage = parseInt(query.page as string);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }
    
    const offset = (page - 1) * limit;
    
    console.log(`Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    console.log('Pagination parameter types:', {
      userId: typeof userId + ': ' + userId,
      limit: typeof limit + ': ' + limit,
      offset: typeof offset + ': ' + offset
    });
    
    try {
      // Hard-cast parameters to integers to ensure MySQL compatibility
      const userIdInt = Number(userId);
      const limitInt = Number(limit);
      const offsetInt = Number(offset);
      
      console.log('Cast pagination parameters:', { userIdInt, limitInt, offsetInt });
      
      // 获取用户查询历史
      console.log(`Attempting to get query history for user ${userIdInt}`);
      const history = await getUserQueryHistory(userIdInt, limitInt, offsetInt);
      console.log(`Retrieved ${history.length} history items`);
      
      return ResponseData.success({
        history,
        pagination: {
          page,
          limit: limitInt,
          offset: offsetInt,
          total: history.length
        }
      }, 'Query history fetched successfully');
    } catch (dbError: any) {
      console.error('Database error in getUserQueryHistory:', dbError);
      return ResponseData.error(`Database error: ${dbError.message || 'Unknown database error'}`, 500);
    }
  } catch (error: any) {
    console.error('Get query history error:', error);
    
    if (error.statusCode) {
      return ResponseData.error(error.message, error.statusCode);
    }
    
    return ResponseData.error('Failed to fetch query history', 500);
  }
}); 