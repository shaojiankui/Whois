import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { getUserPreferences } from '~/server/repositories/userRepository';

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
    
    // 获取用户偏好设置
    const preferences = await getUserPreferences(userIdNum);
    
    return ResponseData.success(preferences, '用户偏好设置获取成功');
  } catch (error: any) {
    console.error('Error fetching user preferences:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    return ResponseData.error('获取用户偏好设置失败', 500);
  }
}); 