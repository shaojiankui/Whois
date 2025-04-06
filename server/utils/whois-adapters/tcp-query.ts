import net from 'net';
import { WhoisQueryHandler } from './index';
import { getTldInfo } from '../tld';
import { whoisConfig } from '~/config';
import { DomainInfo } from '~/types/domain';

/**
 * 标准TCP WHOIS查询处理器
 * 通过TCP连接到WHOIS服务器查询域名信息
 */
export class TcpWhoisQueryHandler implements WhoisQueryHandler {
  // 缓存常见TLD的备选服务器
  private readonly backupServers: Record<string, string[]> = {
    'com': ['whois.verisign-grs.com', 'whois.internic.net'],
    'net': ['whois.verisign-grs.com', 'whois.internic.net'],
    'org': ['whois.pir.org', 'whois.publicinterestregistry.net'],
    'io': ['whois.nic.io', 'whois.iana.org'],
    'cc': ['whois.nic.cc', 'ccwhois.verisign-grs.com'],
    'co': ['whois.nic.co', 'whois.iana.org'],
    'ai': ['whois.nic.ai', 'whois.offshore.ai'],
    // 添加其他常见TLD的备选服务器
  };

  // 通用域名可用性模式
  private readonly genericAvailabilityPatterns = [
    "No match", "NOT FOUND", "No Data Found", "Domain not found", 
    "No entries found", "not found in database", "Domain not exist", 
    "No information available", "No Object Found"
  ];

  /**
   * 通过标准TCP连接进行WHOIS查询
   */
  private async queryStandard(whoisServer: string, domain: string, port: number, timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let data = '';
      let isConnected = false;

      // 设置超时
      socket.setTimeout(timeout);

      socket.connect(port, whoisServer, () => {
        isConnected = true;
        // 发送查询
        socket.write(`${domain}\r\n`);
      });

      socket.on('data', (chunk) => {
        data += chunk.toString();
      });

      socket.on('close', () => {
        if (data.length === 0 && isConnected) {
          reject(new Error(`Empty response from ${whoisServer}`));
        } else if (isConnected) {
          resolve(data);
        }
        // 如果未连接就关闭，则由error或timeout事件处理
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(new Error(`Whois query error for ${domain} on ${whoisServer}: ${err.message}`));
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`Connection to ${whoisServer} timed out after ${timeout}ms`));
      });
    });
  }

  /**
   * 处理WHOIS响应字符编码
   */
  private handleEncoding(response: string): string {
    if (!response) return '';
    
    try {
      // 检测并确保UTF-8编码
      const buffer = Buffer.from(response);
      
      // 移除控制字符
      const cleanedResponse = buffer.toString('utf8')
        .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F]/g, '');
      
      return cleanedResponse;
    } catch (error) {
      console.error('Error handling encoding:', error);
      return response; // 如果处理失败，返回原始响应
    }
  }

  /**
   * 尝试查找备用WHOIS服务器
   */
  private findAlternativeServer(tld: string, currentServer: string): string | null {
    // 使用缓存的备选服务器
    if (this.backupServers[tld]) {
      const alternatives = this.backupServers[tld].filter(s => s !== currentServer);
      if (alternatives.length > 0) {
        return alternatives[0];
      }
    }

    // 尝试通用格式
    const genericServer = `whois.nic.${tld}`;
    if (genericServer !== currentServer) {
      return genericServer;
    }

    return null;
  }

  /**
   * 检查响应中是否包含域名可用的标识
   */
  private async isDomainAvailable(response: string, tld: string): Promise<boolean> {
    if (!response) return false;
    
    // 获取TLD配置中的可用性模式
    const tldInfo = await getTldInfo(tld);
    const availabilityPatterns = tldInfo?.whois_availability
      ? tldInfo.whois_availability.split('|').filter(Boolean)
      : [];
    
    if (availabilityPatterns.length === 0) {
      // 使用通用可用性模式
      return this.genericAvailabilityPatterns.some(pattern => 
        response.toLowerCase().includes(pattern.toLowerCase()));
    }
    
    // 使用TLD特定的可用性模式
    return availabilityPatterns.some(pattern => 
      response.toLowerCase().includes(pattern.toLowerCase()));
  }

  /**
   * 执行WHOIS查询
   * @param domainExtractInfo 要查询的域名信息
   * @param config 查询配置
   * @returns WHOIS查询结果文本
   */
  async query(domainExtractInfo: DomainInfo, config?: any): Promise<string> {
    const { tld = '', domain = '' } = domainExtractInfo || {};
    
    if (!domain || !tld) {
      return '无效的域名信息';
    }
    
    const normalizedTld = tld.toLowerCase();
    const normalizedDomain = domain.toLowerCase();
    
    // 获取TLD配置
    const tldInfo = await getTldInfo(normalizedTld);
    let whoisServer = config?.whoisServer || tldInfo?.whois_host || `whois.nic.${normalizedTld}`;
    const port = config?.port || 43;
    const timeout = config?.timeout || whoisConfig.queryTimeout || 10000;
    const maxRetries = config?.maxRetries || 1;
    
    let retryCount = 0;
    let lastError: Error | null = null;
    let usedServers = new Set<string>();
    
    while (retryCount <= maxRetries) {
      try {
        // 标记当前服务器为已使用
        usedServers.add(whoisServer);
        
        // 执行标准查询
        const response = await this.queryStandard(whoisServer, normalizedDomain, port, timeout);
        
        // 处理响应编码
        const formattedResponse = this.handleEncoding(response);
        
        // 检查响应是否为空
        if (!formattedResponse || formattedResponse.trim().length === 0) {
          throw new Error('Empty response');
        }
        
        // 检查响应是否指示需要查询备用服务器
        if (await this.isDomainAvailable(formattedResponse, normalizedTld) && formattedResponse.length < 200) {
          if (retryCount < maxRetries) {
            // 尝试查找备用服务器
            const alternativeServer = this.findAlternativeServer(normalizedTld, whoisServer);
            if (alternativeServer && !usedServers.has(alternativeServer)) {
              whoisServer = alternativeServer;
              retryCount++;
              continue;
            }
          }
        }
        
        // 如果到这里，说明获取到了有效响应
        return formattedResponse;
      } catch (error: any) {
        console.error(`WHOIS query failed for ${normalizedDomain} (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
        lastError = error;
        
        // 如果还有重试次数
        if (retryCount < maxRetries) {
          // 尝试查找备用服务器
          const alternativeServer = this.findAlternativeServer(normalizedTld, whoisServer);
          if (alternativeServer && !usedServers.has(alternativeServer)) {
            whoisServer = alternativeServer;
            retryCount++;
            // 短暂延迟后重试，避免频繁请求
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }
        
        // 如果无法继续重试，跳出循环
        break;
      }
    }
    
    // 如果所有尝试都失败，返回友好的错误信息
    const errorMessage = `未查询到 ${normalizedDomain} 的Whois信息！Whois服务器是 ${whoisServer}。${lastError ? `错误: ${lastError.message}` : ''}`;
    return errorMessage;
  }
}

// 导出默认实例
export default new TcpWhoisQueryHandler(); 