/**
 * 缓存系统实现
 * 支持内存缓存和Redis缓存
 */
import { WhoisResult } from '../../types/domain';
import { cacheConfig } from '~/config';

// 缓存项接口
interface CacheItem<T> {
  value: T;
  expiry: number; // 过期时间（时间戳）
}

// 缓存类
class MemoryCache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number; // 默认过期时间（毫秒）
  
  constructor(defaultTTL: number = cacheConfig.memory.default) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    
    // 启动定期清理过期项的任务
    setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
  }
  
  /**
   * 设置缓存项
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（毫秒）
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }
  
  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期则返回undefined
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // 如果项不存在或已过期
    if (!item || item.expiry < Date.now()) {
      if (item) this.cache.delete(key); // 删除过期项
      return undefined;
    }
    
    return item.value;
  }
  
  /**
   * 检查缓存项是否存在且未过期
   * @param key 缓存键
   * @returns 是否存在且未过期
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!item && item.expiry >= Date.now();
  }
  
  /**
   * 删除缓存项
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 获取所有缓存键
   * @returns 缓存键数组
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * 获取缓存项数量
   * @returns 缓存项数量
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * 清理过期的缓存项
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
}

// 创建不同TTL的缓存实例，从配置中获取TTL值
const whoisCache = new MemoryCache(cacheConfig.memory.whois);
const dnsCache = new MemoryCache(cacheConfig.memory.dns);
const availabilityCache = new MemoryCache(cacheConfig.memory.availability);
const tldCache = new MemoryCache(cacheConfig.memory.tld);

/**
 * 获取缓存的WHOIS信息
 * @param domain 域名
 * @returns 缓存的WHOIS结果，如果不存在则返回undefined
 */
export async function getCachedWhoisInfo(domain: string): Promise<WhoisResult | undefined> {
  const cacheKey = `whois:${domain}`;
  return whoisCache.get<WhoisResult>(cacheKey);
}

/**
 * 缓存WHOIS信息
 * @param domain 域名
 * @param data WHOIS结果
 */
export async function cacheWhoisInfo(domain: string, data: WhoisResult): Promise<void> {
  const cacheKey = `whois:${domain}`;
  whoisCache.set(cacheKey, data);
}

export { whoisCache, dnsCache, availabilityCache, tldCache }; 