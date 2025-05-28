import { createError } from 'h3';
import { getUserFromEvent } from '~/server/utils/auth';
import { findUserById } from '~/server/repositories/userRepository';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler(async (event) => {
  try {
    // 获取当前用户ID
    const userId = getUserFromEvent(event);
    if (!userId) {
      return ResponseData.error('未登录', 401);
    }
    
    // 获取用户信息
    const user = await findUserById(userId);
    if (!user) {
      return ResponseData.error('用户不存在', 404);
    }
    
    // 返回用户信息（不包含敏感信息）
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.username // 使用username作为name
    };
    
    return ResponseData.success(userInfo, '获取用户信息成功');
    
  } catch (error: any) {
    console.error('Get user info error:', error);
    return ResponseData.error('获取用户信息失败', 500);
  }
}); 