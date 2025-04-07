import { readBody, createError } from 'h3';
import { findResetToken, deleteResetToken } from '~/server/repositories/userRepository';
import { hashPassword } from '~/server/utils/auth';
import { updateUser, findUserById } from '~/server/repositories/userRepository';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler(async (event) => {
  try {
    // Read request body
    const { token, password } = await readBody(event);
    
    // Validate input
    if (!token || !password) {
      throw createError({
        statusCode: 400,
        message: 'Token and password are required'
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        message: 'Password must be at least 6 characters'
      });
    }
    
    // Find token in database
    const resetToken = await findResetToken(token);
    if (!resetToken) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or expired token'
      });
    }
    
    // Find user
    const user = await findUserById(resetToken.userId);
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      });
    }
    
    // Hash new password
    const hashedPassword = hashPassword(password);
    
    // Update user password
    await updateUser(user.id!, {
      password: hashedPassword
    });
    
    // Delete used token
    await deleteResetToken(token);
    
    return ResponseData.success(null, 'Password has been reset successfully');
  } catch (error: any) {
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        message: error.message
      });
    }
    
    console.error('Reset password error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to reset password'
    });
  }
}); 