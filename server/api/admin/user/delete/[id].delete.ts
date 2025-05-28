import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { remove } from '~/server/database/mysql';

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
    
    // 删除关联的查询历史
    await remove('query_history', 'user_id = ?', [userIdNum]);
    
    // 删除关联的用户偏好设置
    await remove('user_preferences', 'user_id = ?', [userIdNum]);
    
    // 删除用户
    const result = await remove('users', 'id = ?', [userIdNum]);
    
    if (result.affectedRows > 0) {
      return ResponseData.success({}, '用户删除成功');
    } else {
      return ResponseData.error('用户不存在', 404);
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    return ResponseData.error('删除用户失败', 500);
  }
}); 