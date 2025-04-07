import developmentConfig from './environments/development';
import productionConfig from './environments/production';

/**
 * 获取当前环境
 * 从环境变量或Nuxt配置中获取
 */
function getEnvironment(): string {
  // 优先使用环境变量
  const env = process.env.NODE_ENV || 'development';
  return env;
}

/**
 * 配置类型定义
 */
export interface Config {
  // 应用基础配置
  app: {
    name: string;
    host: string;
    port: number;
    baseUrl: string;
    apiTimeout: number;
  };
  
  // 数据库配置
  database: {
    mysql: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
      connectionLimit: number;
      timezone: string;
    };
  };
  
  // 缓存配置
  cache: {
    // 内存缓存TTL配置（毫秒）
    memory: {
      default: number;
      whois: number;
      dns: number;
      availability: number;
      tld: number;
    };
    // Redis配置 (生产环境使用)
    redis?: {
      host: string;
      port: number;
      db: number;
      username?: string;
      password?: string;
      keyPrefix: string;
    };
  };
  
  // WHOIS服务配置
  whois: {
    queryTimeout: number;
    cacheResults: boolean;
    rateLimitPerHour: number;
  };
  
  // 日志配置
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
  };
}

/**
 * 根据环境获取配置
 */
function getConfig(): Config {
  const env = getEnvironment();
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// 导出配置实例
const config = getConfig();
console.log("load config:"+JSON.stringify(config));
export default config;

// 导出特定配置部分的便捷访问
export const dbConfig = config.database;
export const cacheConfig = config.cache;
export const appConfig = config.app;
export const whoisConfig = config.whois;
export const loggingConfig = config.logging; 