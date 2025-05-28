import { getQuery } from 'h3';
import { getUserFromEvent } from '~/server/utils/auth';
import { getUserQueryHistory, findUserById } from '~/server/repositories/userRepository';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler(async (event) => {
  try {
    // 验证用户登录
    const userId = getUserFromEvent(event);
    if (!userId) {
      return ResponseData.error('未授权访问', 401);
    }
    
    // 确认用户存在
    const user = await findUserById(userId);
    if (!user) {
      return ResponseData.error('用户不存在', 404);
    }
    
    // 获取查询参数
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    
    // 限制页面大小
    if (pageSize > 100) {
      return ResponseData.error('页面大小不能超过100', 400);
    }
    
    // 获取查询历史
    const history = await getUserQueryHistory(userId, pageSize, offset);
    
    return ResponseData.success({
      data: history,
      pagination: {
        page,
        pageSize,
        total: history.length, // 实际项目中应该单独查询总数
        hasMore: history.length === pageSize
      }
    }, '获取查询历史成功');
    
  } catch (error: any) {
    console.error('Get user history error:', error);
    
    if (error.statusCode === 401) {
      return ResponseData.error('未授权访问', 401);
    }
    
    return ResponseData.error('获取查询历史失败', 500);
  }
}); 