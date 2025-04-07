/**
 * Redis缓存适配器
 * 在生产环境中使用Redis作为分布式缓存
 */
import { cacheConfig } from '~/config';
import { RedisClientType } from 'redis';

// Redis客户端类型，如果没有Redis则为null
let redisClient: RedisClientType | null = null;

/**
 * 初始化Redis客户端
 * 只在配置了Redis的环境中初始化
 */
export async function initRedisClient(): Promise<boolean> {
  // 检查是否配置了Redis
  if (!cacheConfig.redis) {
    console.log('Redis not configured, using memory cache only.');
    return false;
  }
  
  try {
    // 动态导入redis库，避免在不使用Redis的环境中强制依赖
    const { createClient } = await import('redis');
    
    redisClient = createClient({
      socket: {
        host: cacheConfig.redis.host,
        port: cacheConfig.redis.port,
      },
      username: cacheConfig.redis.username,
      password: cacheConfig.redis.password,
      database: cacheConfig.redis.db,
    });
    
    // 监听Redis事件
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });
    
    // 连接Redis
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return false;
  }
}

/**
 * 检查Redis是否可用
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && redisClient.isOpen;
}

/**
 * 从Redis获取缓存项
 */
export async function getFromRedis<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable()) {
    return null;
  }
  
  try {
    const fullKey = cacheConfig.redis?.keyPrefix + key;
    const data = await redisClient!.get(fullKey);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error getting from Redis (key=${key}):`, error);
    return null;
  }
}

/**
 * 设置Redis缓存项
 */
export async function setToRedis<T>(key: string, value: T, ttlMs?: number): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }
  
  try {
    const fullKey = cacheConfig.redis?.keyPrefix + key;
    const jsonValue = JSON.stringify(value);
    
    if (ttlMs) {
      // 使用毫秒TTL
      await redisClient!.set(fullKey, jsonValue, { PX: ttlMs });
    } else {
      await redisClient!.set(fullKey, jsonValue);
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting to Redis (key=${key}):`, error);
    return false;
  }
}

/**
 * 从Redis删除缓存项
 */
export async function deleteFromRedis(key: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }
  
  try {
    const fullKey = cacheConfig.redis?.keyPrefix + key;
    await redisClient!.del(fullKey);
    return true;
  } catch (error) {
    console.error(`Error deleting from Redis (key=${key}):`, error);
    return false;
  }
}

/**
 * 清空Redis指定前缀的缓存
 */
export async function clearRedisCache(pattern?: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }
  
  try {
    const prefix = cacheConfig.redis?.keyPrefix || '';
    const searchPattern = pattern ? `${prefix}${pattern}*` : `${prefix}*`;
    
    // 使用scan接口查找所有匹配的键
    let cursor = 0;
    do {
      const result = await redisClient!.scan(cursor, { MATCH: searchPattern, COUNT: 100 });
      cursor = result.cursor;
      
      // 删除找到的键
      if (result.keys.length > 0) {
        await redisClient!.del(result.keys);
      }
    } while (cursor !== 0);
    
    return true;
  } catch (error) {
    console.error('Error clearing Redis cache:', error);
    return false;
  }
}

/**
 * 关闭Redis连接
 */
export async function closeRedisConnection(): Promise<void> {
  if (isRedisAvailable()) {
    await redisClient!.quit();
    redisClient = null;
  }
} 