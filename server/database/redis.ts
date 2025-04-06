import { createClient, RedisClientType } from 'redis';

// Redis配置
const REDIS_CONFIG = {
  url: 'redis://localhost:6379',
  // 如果有密码，可以添加：password: 'your-password'
};

// Redis客户端实例
let redisClient: RedisClientType | null = null;

/**
 * 获取Redis客户端连接
 * @returns Redis客户端实例
 */
export const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    redisClient = createClient(REDIS_CONFIG);
    
    // 设置错误监听器
    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });
    
    // 连接Redis
    await redisClient.connect();
  }
  
  return redisClient;
};

/**
 * 设置Redis键值
 * @param key 键
 * @param value 值
 * @param expireTime 过期时间（秒）
 * @returns 操作结果
 */
export const set = async (key: string, value: string, expireTime?: number): Promise<string | null> => {
  try {
    const client = await getRedisClient();
    
    if (expireTime) {
      return await client.set(key, value, { EX: expireTime });
    } else {
      return await client.set(key, value);
    }
  } catch (error) {
    console.error('Redis Set Error:', error);
    throw error;
  }
};

/**
 * 获取Redis键值
 * @param key 键
 * @returns 值
 */
export const get = async (key: string): Promise<string | null> => {
  try {
    const client = await getRedisClient();
    return await client.get(key);
  } catch (error) {
    console.error('Redis Get Error:', error);
    throw error;
  }
};

/**
 * 删除Redis键值
 * @param key 键
 * @returns 删除的键数量
 */
export const del = async (key: string): Promise<number> => {
  try {
    const client = await getRedisClient();
    return await client.del(key);
  } catch (error) {
    console.error('Redis Del Error:', error);
    throw error;
  }
};

/**
 * 设置哈希表字段值
 * @param key 哈希表键
 * @param field 字段
 * @param value 值
 * @returns 操作结果
 */
export const hSet = async (key: string, field: string, value: string): Promise<number> => {
  try {
    const client = await getRedisClient();
    return await client.hSet(key, field, value);
  } catch (error) {
    console.error('Redis HSet Error:', error);
    throw error;
  }
};

/**
 * 获取哈希表字段值
 * @param key 哈希表键
 * @param field 字段
 * @returns 值
 */
export const hGet = async (key: string, field: string): Promise<string | null> => {
  try {
    const client = await getRedisClient();
    const result = await client.hGet(key, field);
    // 修复TypeScript错误：将undefined也视为null返回
    return result === undefined ? null : result;
  } catch (error) {
    console.error('Redis HGet Error:', error);
    throw error;
  }
};

/**
 * 获取哈希表所有字段和值
 * @param key 哈希表键
 * @returns 所有字段和值
 */
export const hGetAll = async (key: string): Promise<Record<string, string>> => {
  try {
    const client = await getRedisClient();
    return await client.hGetAll(key);
  } catch (error) {
    console.error('Redis HGetAll Error:', error);
    throw error;
  }
};

/**
 * 关闭Redis连接
 */
export const closeRedisClient = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}; 