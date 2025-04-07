import { readBody, createError } from 'h3';
import { findUserByEmail } from '~/server/repositories/userRepository';
import { generateResetToken } from '~/server/utils/auth';
import { createResetToken } from '~/server/repositories/userRepository';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler(async (event) => {
  try {
    // Read request body
    const { email } = await readBody(event);
    
    // Validate input
    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return ResponseData.success(null, 'If your email is registered, you will receive a password reset link');
    }
    
    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour
    
    // Save token to database
    await createResetToken(user.id!, token, expiresAt);
    
    // In a real application, you would send an email here
    // For this example, we'll just return the token (in a real app, this would be a security issue)
    console.log(`Reset token for ${email}: ${token}`);
    
    const responseData = {
      message: 'If your email is registered, you will receive a password reset link'
    };
    
    // DEV ONLY: Include token and userId in development mode
    if (process.env.NODE_ENV === 'development') {
      Object.assign(responseData, {
        token,
        userId: user.id
      });
    }
    
    return ResponseData.success(responseData);
  } catch (error: any) {
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        message: error.message
      });
    }
    
    console.error('Reset password request error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to process password reset request'
    });
  }
}); 