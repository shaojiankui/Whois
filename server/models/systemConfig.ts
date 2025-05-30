import { query, update, insert } from '../database/mysql'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface SystemConfig {
  id: number
  config_key: string
  config_value: string
  config_type: 'string' | 'number' | 'boolean' | 'json'
  category: 'basic' | 'email' | 'cache' | 'security' | 'rate_limit' | 'backup'
  description?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface EmailConfig {
  smtp_host: string
  smtp_port: number
  smtp_secure: boolean
  smtp_user: string
  smtp_password: string
  from_email: string
  from_name: string
}

export interface CacheConfig {
  redis_host: string
  redis_port: number
  redis_password?: string
  redis_db: number
  default_ttl: number
  max_memory: string
}

export interface SecurityConfig {
  jwt_secret: string
  jwt_expires_in: string
  password_min_length: number
  password_require_special: boolean
  max_login_attempts: number
  lockout_duration: number
}

export interface RateLimitConfig {
  whois_requests_per_minute: number
  bulk_requests_per_hour: number
  api_requests_per_minute: number
  enabled: boolean
}

export interface BackupConfig {
  auto_backup_enabled: boolean
  backup_interval: number // hours
  backup_retention_days: number
  backup_location: string
  compress_backups: boolean
}

export interface BasicConfig {
  site_name: string
  site_description: string
  site_url: string
  admin_email: string
  maintenance_mode: boolean
  max_upload_size: number
  timezone: string
  default_language: string
}

export class SystemConfigModel {
  async getConfigsByCategory(category: string): Promise<SystemConfig[]> {
    const sql = `
      SELECT * FROM system_configs 
      WHERE category = ? AND is_active = 1 
      ORDER BY config_key
    `
    return await query<(RowDataPacket & SystemConfig)[]>(sql, [category])
  }

  async getConfig(key: string): Promise<SystemConfig | null> {
    const sql = `
      SELECT * FROM system_configs 
      WHERE config_key = ? AND is_active = 1 
      LIMIT 1
    `
    const results = await query<(RowDataPacket & SystemConfig)[]>(sql, [key])
    return results[0] || null
  }

  async updateConfig(key: string, value: string, type: string = 'string'): Promise<boolean> {
    const sql = `
      UPDATE system_configs 
      SET config_value = ?, config_type = ?, updated_at = NOW() 
      WHERE config_key = ?
    `
    const result = await query<ResultSetHeader>(sql, [value, type, key])
    return result.affectedRows > 0
  }

  async createConfig(
    key: string, 
    value: string, 
    category: string, 
    type: string = 'string',
    description?: string
  ): Promise<boolean> {
    const sql = `
      INSERT INTO system_configs (config_key, config_value, config_type, category, description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
    `
    const result = await query<ResultSetHeader>(sql, [key, value, type, category, description])
    return result.affectedRows > 0
  }

  async deleteConfig(key: string): Promise<boolean> {
    const sql = `UPDATE system_configs SET is_active = 0, updated_at = NOW() WHERE config_key = ?`
    const result = await query<ResultSetHeader>(sql, [key])
    return result.affectedRows > 0
  }

  async getAllConfigs(): Promise<SystemConfig[]> {
    const sql = `
      SELECT * FROM system_configs 
      WHERE is_active = 1 
      ORDER BY category, config_key
    `
    return await query<(RowDataPacket & SystemConfig)[]>(sql)
  }

  // 解析配置值为正确的类型
  parseConfigValue(config: SystemConfig): any {
    switch (config.config_type) {
      case 'number':
        return Number(config.config_value)
      case 'boolean':
        return config.config_value === 'true' || config.config_value === '1'
      case 'json':
        try {
          return JSON.parse(config.config_value)
        } catch {
          return null
        }
      default:
        return config.config_value
    }
  }

  // 组装特定类别的配置对象
  async getBasicConfig(): Promise<BasicConfig> {
    const configs = await this.getConfigsByCategory('basic')
    const result: any = {}
    
    configs.forEach(config => {
      const key = config.config_key.replace('basic_', '')
      result[key] = this.parseConfigValue(config)
    })
    
    return result as BasicConfig
  }

  async getEmailConfig(): Promise<EmailConfig> {
    const configs = await this.getConfigsByCategory('email')
    const result: any = {}
    
    configs.forEach(config => {
      const key = config.config_key.replace('email_', '')
      result[key] = this.parseConfigValue(config)
    })
    
    return result as EmailConfig
  }

  async getCacheConfig(): Promise<CacheConfig> {
    const configs = await this.getConfigsByCategory('cache')
    const result: any = {}
    
    configs.forEach(config => {
      const key = config.config_key.replace('cache_', '')
      result[key] = this.parseConfigValue(config)
    })
    
    return result as CacheConfig
  }

  async getSecurityConfig(): Promise<SecurityConfig> {
    const configs = await this.getConfigsByCategory('security')
    const result: any = {}
    
    configs.forEach(config => {
      const key = config.config_key.replace('security_', '')
      result[key] = this.parseConfigValue(config)
    })
    
    return result as SecurityConfig
  }

  async getRateLimitConfig(): Promise<RateLimitConfig> {
    const configs = await this.getConfigsByCategory('rate_limit')
    const result: any = {}
    
    configs.forEach(config => {
      const key = config.config_key.replace('rate_limit_', '')
      result[key] = this.parseConfigValue(config)
    })
    
    return result as RateLimitConfig
  }

  async getBackupConfig(): Promise<BackupConfig> {
    const configs = await this.getConfigsByCategory('backup')
    const result: any = {}
    
    configs.forEach(config => {
      const key = config.config_key.replace('backup_', '')
      result[key] = this.parseConfigValue(config)
    })
    
    return result as BackupConfig
  }
} 