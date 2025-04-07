import { setCookie } from 'h3';
import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';

export default createApiHandler((event) => {
  // Clear auth token cookie
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0, // Expire immediately
    path: '/'
  });
  
  return Promise.resolve(ResponseData.success(null, 'Logged out successfully'));
}); 