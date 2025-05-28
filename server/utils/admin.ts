import { H3Event, createError } from 'h3';
import { getUserFromEvent } from './auth';
import { findUserById } from '../repositories/userRepository';

/**
 * 检查用户是否为管理员
 * @param userId 用户ID
 * @returns 是否为管理员
 */
export function isAdminUser(userId: number): boolean {
  // 用户ID为1的用户是管理员
  return userId === 1;
}

/**
 * 管理员权限中间件，检查当前用户是否为管理员
 * @param event H3Event
 * @returns 用户信息，如果不是管理员则抛出错误
 */
export async function requireAdmin(event: H3Event) {
  // 获取当前用户ID
  const userId = getUserFromEvent(event);
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: Login required'
    });
  }
  
  // 获取用户信息
  const user = await findUserById(userId);
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    });
  }
  
  // 检查是否为管理员
  if (!isAdminUser(user.id!)) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    });
  }
  
  return user;
} 