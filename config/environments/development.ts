import { Config } from '../index';

/**
 * 开发环境配置
 */
const developmentConfig: Config = {
  app: {
    name: 'Whois-Nuxt-App',
    host: 'localhost',
    port: 3000,
    baseUrl: 'http://localhost:3000',
    apiTimeout: 30000,
  },
  
  database: {
    mysql: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'whois',
      connectionLimit: 10,
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
    // 开发环境不使用Redis
  },
  
  whois: {
    queryTimeout: 10000,
    cacheResults: false,
    rateLimitPerHour: 500,
  },
  
  logging: {
    level: 'debug',
  },
};

export default developmentConfig; 