import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { getUserQueryHistory } from '~/server/repositories/userRepository';

export default createApiHandler(async (event) => {
  try {
    // 检查管理员权限
    await requireAdmin(event);
    
    // 获取用户ID
    const userId = getRouterParam(event, 'id');
    if (!userId) {
      return ResponseData.error('用户ID参数缺失', 400);
    }
    
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return ResponseData.error('无效的用户ID', 400);
    }
    
    // 获取用户查询历史（最近10条）
    const queries = await getUserQueryHistory(userIdNum, 10, 0);
    
    return ResponseData.success(queries, '用户查询历史获取成功');
  } catch (error: any) {
    console.error('Error fetching user queries:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    return ResponseData.error('获取用户查询历史失败', 500);
  }
}); 