/**
 * 缓存系统初始化插件
 * 根据环境配置初始化内存缓存或Redis缓存
 */
import { cacheConfig } from '~/config';
import { initRedisClient } from '../utils/redis-cache';

/**
 * Nuxt插件，初始化缓存系统
 */
export default defineNitroPlugin(async () => {
  console.log('Initializing cache system...');
  
  // 根据环境配置初始化Redis
  if (cacheConfig.redis) {
    try {
      const redisInitialized = await initRedisClient();
      if (redisInitialized) {
        console.log('Redis cache initialized successfully');
      } else {
        console.warn('Failed to initialize Redis, falling back to memory cache');
      }
    } catch (error) {
      console.error('Error initializing Redis:', error);
      console.log('Using memory cache as fallback');
    }
  } else {
    console.log('Using memory cache as configured');
  }
}); 