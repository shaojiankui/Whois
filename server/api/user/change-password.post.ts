import { readBody, createError } from 'h3';
import { getUserFromEvent } from '~/server/utils/auth';
import { findUserById, updateUser } from '~/server/repositories/userRepository';
import { verifyPassword, hashPassword } from '~/server/utils/auth';
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
    const { currentPassword, newPassword } = await readBody(event);
    
    // Validate input
    if (!currentPassword || !newPassword) {
      throw createError({
        statusCode: 400,
        message: 'Current password and new password are required'
      });
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      throw createError({
        statusCode: 400,
        message: 'New password must be at least 6 characters'
      });
    }
    
    // Find user
    const user = await findUserById(userId);
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isPasswordValid = verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = hashPassword(newPassword);
    
    // Update password
    await updateUser(userId, {
      password: hashedPassword
    });
    
    return ResponseData.success(null, 'Password changed successfully');
  } catch (error: any) {
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        message: error.message
      });
    }
    
    console.error('Change password error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to change password'
    });
  }
}); 