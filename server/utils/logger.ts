import { insert } from '../database/mysql';
import { H3Event } from 'h3';
import { TldExtract } from './tldextract';

// 日志级别类型
export type LogLevel = 'error' | 'warning' | 'info' | 'debug';

// 日志类型
export type LogType = 
  | 'whois_query' 
  | 'domain_check' 
  | 'bulk_check' 
  | 'user_login' 
  | 'user_register' 
  | 'admin_operation'
  | 'system_error'
  | 'api_request';

// 日志接口
export interface LogEntry {
  userId?: number;
  logLevel: LogLevel;
  logType: LogType;
  message: string;
  errorDetails?: any;
  requestData?: any;
  userIp?: string;
  userAgent?: string;
  tld?: string;
  executionTime?: number;
}

/**
 * 系统日志记录器
 */
export class SystemLogger {
  
  /**
   * 提取域名后缀（TLD）用于日志记录
   * 对于错误日志，只记录后缀以保护隐私
   */
  private static async extractDomainSuffix(domain: string): Promise<string> {
    try {
      const domainInfo = await TldExtract.parse(domain);
      return domainInfo.suffix || domainInfo.tld || 'unknown';
    } catch (error) {
      // 如果解析失败，尝试简单的后缀提取
      const parts = domain.toLowerCase().split('.');
      if (parts.length >= 2) {
        return parts[parts.length - 1];
      }
      return 'unknown';
    }
  }

  /**
   * 记录日志到数据库
   * @param entry 日志条目
   */
  static async log(entry: LogEntry): Promise<void> {
    try {
      const logData = {
        user_id: entry.userId || null,
        log_level: entry.logLevel,
        log_type: entry.logType,
        message: entry.message,
        error_details: entry.errorDetails ? JSON.stringify(entry.errorDetails) : null,
        request_data: entry.requestData ? JSON.stringify(entry.requestData) : null,
        user_ip: entry.userIp || null,
        user_agent: entry.userAgent || null,
        tld: entry.tld || null,
        execution_time: entry.executionTime || null,
      };

      await insert('system_logs', logData);
    } catch (error) {
      // 避免日志记录失败影响主业务，只在控制台输出错误
      console.error('[SystemLogger] Failed to log entry:', error);
      console.error('[SystemLogger] Original entry:', entry);
    }
  }

  /**
   * 记录错误日志
   */
  static async error(
    logType: LogType,
    message: string,
    error?: any,
    additionalData?: Partial<LogEntry>
  ): Promise<void> {
    await this.log({
      logLevel: 'error',
      logType,
      message,
      errorDetails: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        ...error
      } : undefined,
      ...additionalData
    });
  }

  /**
   * 记录警告日志
   */
  static async warning(
    logType: LogType,
    message: string,
    additionalData?: Partial<LogEntry>
  ): Promise<void> {
    await this.log({
      logLevel: 'warning',
      logType,
      message,
      ...additionalData
    });
  }

  /**
   * 记录信息日志
   */
  static async info(
    logType: LogType,
    message: string,
    additionalData?: Partial<LogEntry>
  ): Promise<void> {
    await this.log({
      logLevel: 'info',
      logType,
      message,
      ...additionalData
    });
  }

  /**
   * 记录调试日志
   */
  static async debug(
    logType: LogType,
    message: string,
    additionalData?: Partial<LogEntry>
  ): Promise<void> {
    await this.log({
      logLevel: 'debug',
      logType,
      message,
      ...additionalData
    });
  }

  /**
   * 从H3事件中提取请求信息
   */
  static extractRequestInfo(event: H3Event): Pick<LogEntry, 'userIp' | 'userAgent'> {
    const headers = getHeaders(event);
    
    // 获取客户端IP地址
    const clientIP = headers['x-forwarded-for'] ||
                     headers['x-real-ip'] ||
                     headers['cf-connecting-ip'] ||
                     event.node.req.socket?.remoteAddress ||
                     'unknown';
    
    return {
      userIp: Array.isArray(clientIP) ? clientIP[0] : clientIP,
      userAgent: headers['user-agent'] || 'unknown'
    };
  }

  /**
   * 记录Whois查询错误
   */
  static async logWhoisError(
    domain: string,
    error: any,
    event?: H3Event,
    userId?: number,
    executionTime?: number
  ): Promise<void> {
    const requestInfo = event ? this.extractRequestInfo(event) : {};
    
    // 对于错误日志，只记录域名后缀
    const domainSuffix = await this.extractDomainSuffix(domain);
    
    await this.error('whois_query', `Whois查询失败: *.${domainSuffix}`, error, {
      tld: domainSuffix,
      userId,
      executionTime,
      requestData: { domainSuffix },
      ...requestInfo
    });
  }

  /**
   * 记录批量检查错误
   */
  static async logBulkCheckError(
    domains: string[],
    error: any,
    event?: H3Event,
    userId?: number,
    executionTime?: number
  ): Promise<void> {
    const requestInfo = event ? this.extractRequestInfo(event) : {};
    
    // 对于批量检查错误，统计各后缀数量
    const suffixStats: Record<string, number> = {};
    for (const domain of domains) {
      const suffix = await this.extractDomainSuffix(domain);
      suffixStats[suffix] = (suffixStats[suffix] || 0) + 1;
    }
    
    const suffixSummary = Object.entries(suffixStats)
      .map(([suffix, count]) => `${count}个*.${suffix}`)
      .join(', ');
    
    await this.error('bulk_check', `批量检查失败: ${suffixSummary}`, error, {
      userId,
      executionTime,
      requestData: { 
        domainCount: domains.length,
        suffixStats
      },
      ...requestInfo
    });
  }

  /**
   * 记录用户操作日志
   */
  static async logUserOperation(
    userId: number,
    operation: string,
    details?: any,
    event?: H3Event
  ): Promise<void> {
    const requestInfo = event ? this.extractRequestInfo(event) : {};
    
    await this.info('user_login', operation, {
      userId,
      requestData: details,
      ...requestInfo
    });
  }

  /**
   * 记录管理员操作日志
   */
  static async logAdminOperation(
    userId: number,
    operation: string,
    details?: any,
    event?: H3Event
  ): Promise<void> {
    const requestInfo = event ? this.extractRequestInfo(event) : {};
    
    await this.info('admin_operation', operation, {
      userId,
      requestData: details,
      ...requestInfo
    });
  }
}

// 导入H3相关函数
import { getHeaders } from 'h3'; 