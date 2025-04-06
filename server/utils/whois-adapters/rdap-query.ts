import { WhoisQueryHandler } from './index';
import { getTldInfo } from '../tld';
import fs from 'fs';
import path from 'path';
import { whoisConfig } from '~/config';
import { DomainInfo } from '~/types/domain';

interface RdapBootstrapService {
  services: Array<[string[], string[]]>;
}

/**
 * RDAP WHOIS查询处理器
 * 通过HTTP请求RDAP服务器查询域名信息
 * RDAP是WHOIS的HTTP替代品，返回JSON格式数据
 */
export class RdapQueryHandler implements WhoisQueryHandler {
  // 基础RDAP服务器列表 - 用作备选
  private readonly baseRdapServers: Record<string, string> = {
    'com': 'https://rdap.verisign.com/com/v1/',
    'net': 'https://rdap.verisign.com/net/v1/',
    'org': 'https://rdap.pir.org/v1/',
    'info': 'https://rdap.afilias.net/rdap/',
    'io': 'https://rdap.identitydigital.services/rdap/',
    'app': 'https://rdap.nominet.uk/app/',
    'dev': 'https://rdap.nic.google/dev/',
    'eu': 'https://rdap.eu/rdap/'
  };
  
  // IANA RDAP Bootstrap缓存
  private bootstrapCache: RdapBootstrapService | null = null;
  private bootstrapCacheTime: number = 0;
  private readonly bootstrapCachePath: string;
  private readonly cacheTTL: number = 24 * 60 * 60 * 1000; // 24小时缓存
  
  constructor() {
    // 初始化缓存路径
    this.bootstrapCachePath = path.join(process.cwd(), 'cache', 'rdap-bootstrap.json');
    this.loadBootstrapCache();
  }
  
  /**
   * 加载RDAP Bootstrap缓存
   */
  private loadBootstrapCache(): void {
    try {
      // 确保缓存目录存在
      const cacheDir = path.dirname(this.bootstrapCachePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      // 尝试读取缓存文件
      if (fs.existsSync(this.bootstrapCachePath)) {
        const cacheData = fs.readFileSync(this.bootstrapCachePath, 'utf8');
        const cacheObj = JSON.parse(cacheData);
        
        const currentTime = Date.now();
        
        // 检查缓存有效期和有效性
        if (cacheObj?.cacheTime && 
            typeof cacheObj.cacheTime === 'number' &&
            cacheObj.cacheTime <= currentTime &&
            currentTime - cacheObj.cacheTime < this.cacheTTL && 
            cacheObj.data?.services) {
          this.bootstrapCache = cacheObj.data;
          this.bootstrapCacheTime = cacheObj.cacheTime;
          console.log('RDAP Bootstrap cache loaded successfully');
        } else {
          console.log('RDAP Bootstrap cache expired or invalid, will be refreshed');
        }
      }
    } catch (error) {
      console.error('Error loading RDAP Bootstrap cache:', error);
      // 错误时不修改缓存状态，后续会重新获取
    }
  }
  
  /**
   * 保存RDAP Bootstrap缓存
   */
  private saveBootstrapCache(): void {
    try {
      if (!this.bootstrapCache) {
        return; // 没有数据，不保存
      }
      
      const cacheObj = {
        cacheTime: Date.now(),
        data: this.bootstrapCache
      };
      
      // 确保目录存在
      const cacheDir = path.dirname(this.bootstrapCachePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      fs.writeFileSync(this.bootstrapCachePath, JSON.stringify(cacheObj, null, 2), 'utf8');
      console.log('RDAP Bootstrap cache saved successfully');
    } catch (error) {
      console.error('Error saving RDAP Bootstrap cache:', error);
    }
  }
  
  /**
   * 获取RDAP Bootstrap服务列表
   * @returns Bootstrap服务列表
   */
  private async getBootstrapServices(): Promise<RdapBootstrapService | null> {
    // 如果缓存有效，直接返回
    if (this.bootstrapCache && (Date.now() - this.bootstrapCacheTime < this.cacheTTL)) {
      return this.bootstrapCache;
    }
    
    try {
      // 从IANA获取最新的RDAP Bootstrap信息
      const response = await fetch('https://data.iana.org/rdap/dns.json', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WhoisNuxtApp/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch RDAP Bootstrap: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 验证数据有效性
      if (!data || !data.services || !Array.isArray(data.services)) {
        throw new Error('Invalid RDAP Bootstrap data format');
      }
      
      // 更新缓存
      this.bootstrapCache = data;
      this.bootstrapCacheTime = Date.now();
      this.saveBootstrapCache();
      
      return data;
    } catch (error) {
      console.error('Error fetching RDAP Bootstrap:', error);
      
      // 如果有旧缓存，返回旧缓存
      if (this.bootstrapCache) {
        console.log('Using expired RDAP Bootstrap cache');
        return this.bootstrapCache;
      }
      
      return null;
    }
  }
  
  /**
   * 根据TLD查找RDAP服务器
   * @param tld 顶级域名
   * @returns RDAP服务器URL
   */
  private async findRdapServerForTld(tld: string): Promise<string | null> {
    try {
      // 首先检查基础服务器列表
      if (this.baseRdapServers[tld]) {
        return this.baseRdapServers[tld];
      }
      
      // 获取Bootstrap服务列表
      const bootstrap = await this.getBootstrapServices();
      
      if (!bootstrap?.services) {
        return null;
      }
      
      // IANA RDAP bootstrap格式：services数组，每个元素是[匹配域名数组, 服务器URL数组]
      for (const service of bootstrap.services) {
        if (Array.isArray(service) && service.length >= 2) {
          const domainPatterns = service[0];
          const serverUrls = service[1];
          
          // 检查TLD是否匹配任一模式
          if (Array.isArray(domainPatterns) && domainPatterns.includes(tld)) {
            // 返回第一个服务器URL
            if (Array.isArray(serverUrls) && serverUrls.length > 0) {
              return serverUrls[0];
            }
          }
        }
      }
      
      // 检查与连接符连接的 TLD
      // 例如：co.uk, com.au 等
      if (tld.includes('.')) {
        const parts = tld.split('.');
        // 尝试每个部分作为顶级域名
        for (const part of parts) {
          if (this.baseRdapServers[part]) {
            return this.baseRdapServers[part];
          }
        }
        
        // 尝试通用格式
        return `https://rdap.nic.${parts[parts.length - 1]}/`;
      }
      
      // 如果找不到，尝试通用格式
      return `https://rdap.nic.${tld}/`;
    } catch (error) {
      console.error(`Error finding RDAP server for ${tld}:`, error);
      return null;
    }
  }
  
  /**
   * 构建完整的RDAP URL
   * @param baseUrl 基础URL
   * @param domain 域名
   * @returns 完整URL
   */
  private buildRdapUrl(baseUrl: string, domain: string): string {
    // 移除末尾的斜杠
    const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    
    // 构建查询URL
    return `${url}domain/${encodeURIComponent(domain)}`;
  }
  
  /**
   * 执行RDAP查询
   * @param domainExtractInfo 要查询的域名信息
   * @param config 查询配置
   * @returns RDAP响应JSON字符串
   */
  async query(domainExtractInfo: DomainInfo, config?: any): Promise<string> {
    const { tld = '', domain = '' } = domainExtractInfo || {};
    
    if (!domain || !tld) {
      return JSON.stringify({ error: '无效的域名信息' });
    }
    
    const normalizedTld = tld.toLowerCase();
    const normalizedDomain = domain.toLowerCase();
    
    // 获取RDAP服务器URL
    let rdapBaseUrl = config?.rdapServer;
    
    if (!rdapBaseUrl) {
      // 尝试从TLD配置中获取
      const tldInfo = await getTldInfo(normalizedTld);
      if (tldInfo?.whois_host?.startsWith('http')) {
        rdapBaseUrl = tldInfo.whois_host;
      } else {
        // 从RDAP Bootstrap获取
        rdapBaseUrl = await this.findRdapServerForTld(normalizedTld);
      }
      
      if (!rdapBaseUrl) {
        return JSON.stringify({
          error: `无法找到${normalizedDomain}的RDAP服务器`
        });
      }
    }
    
    // 构建RDAP URL
    const rdapUrl = this.buildRdapUrl(rdapBaseUrl, normalizedDomain);
    
    // 重试配置
    const maxRetries = config?.maxRetries || 1;
    const timeout = config?.timeout || 15000; // 默认超时时间15秒
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount <= maxRetries) {
      try {
        // 执行HTTP请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(rdapUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/rdap+json',
            'User-Agent': 'WhoisNuxtApp/1.0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // 解析响应
        const responseText = await response.text();
        
        // 如果是404，域名可能可注册
        if (response.status === 404) {
          return JSON.stringify({
            status: 'not found',
            errorCode: 404,
            title: 'Domain not found',
            description: `Domain ${normalizedDomain} not found.`
          });
        }
        
        // 检查响应是否有效JSON
        try {
          JSON.parse(responseText);
          return responseText;
        } catch (jsonError) {
          throw new Error(`Invalid JSON response: ${(jsonError as Error).message}`);
        }
      } catch (error: any) {
        console.error(`RDAP query failed for ${normalizedDomain} (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
        lastError = error;
        
        // 如果是超时或网络错误，可重试
        const isRetryableError = error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('fetch');
        
        if (retryCount < maxRetries && isRetryableError) {
          retryCount++;
          // 指数退避重试，避免过于频繁请求
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        break;
      }
    }
    
    // 如果所有尝试都失败，返回错误响应
    return JSON.stringify({
      error: `RDAP查询失败: ${lastError?.message || '未知错误'}`,
      domain: normalizedDomain,
      rdapServer: rdapBaseUrl
    });
  }
}

// 导出默认实例
export default new RdapQueryHandler(); 