import { Config } from '../index';

/**
 * 生产环境配置
 */
const productionConfig: Config = {
  app: {
    name: 'Whois-Nuxt-App',
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
    baseUrl: process.env.BASE_URL || 'https://whois.example.com',
    apiTimeout: 30000,
  },
  
  database: {
    mysql: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'production_user',
      password: process.env.DB_PASSWORD || 'secure_password',
      database: process.env.DB_NAME || 'whois_production',
      connectionLimit: 20,
      timezone: '+08:00',
    },
  },
  
  cache: {
    memory: {
      default: 3600000, // 1小时
      whois: 24 * 3600000, // 24小时
      dns: 3600000, // 1小时
      availability: 12 * 3600000, // 12小时
      tld: 7 * 24 * 3600000, // 7天
    },
    // 生产环境使用Redis
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      db: Number(process.env.REDIS_DB) || 0,
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'whois:',
    },
  },
  
  whois: {
    queryTimeout: 15000,
    cacheResults: false,
    rateLimitPerHour: 2000,
  },
  
  logging: {
    level: 'info',
    file: 'logs/app.log',
  },
};

export default productionConfig; 