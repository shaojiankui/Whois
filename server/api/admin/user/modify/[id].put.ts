import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { updateUser } from '~/server/repositories/userRepository';

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
    
    // 获取请求体
    const body = await readBody(event);
    
    // 准备更新数据
    const updateData: any = {};
    
    if (body.email) updateData.email = body.email;
    if (body.name !== undefined) updateData.name = body.name;
    
    // 更新用户信息
    const success = await updateUser(userIdNum, updateData);
    
    if (success) {
      return ResponseData.success({}, '用户信息更新成功');
    } else {
      return ResponseData.error('用户不存在或未进行任何更改', 404);
    }
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    // 检查邮箱重复错误
    if (error.code === 'ER_DUP_ENTRY') {
      return ResponseData.error('邮箱已被其他用户使用', 400);
    }
    
    return ResponseData.error('更新用户信息失败', 500);
  }
}); 