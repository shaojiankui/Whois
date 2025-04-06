import { getTldInfo } from './tld';
import { QueryHandlerType } from '~/types/tld';
import { queryHandlers, parseHandlers, ParseHandlerType } from './whois-adapters';
// import { WhoisAdapter } from './whois-adapters/abstract';
import { WhoisResult, DomainTag } from '~/types/domain';
import net from 'net';
import { getWhoisConfig } from './tld';
import { whoisConfig } from '~/config';
import { TldExtract } from './tldextract';
import { DomainInfo } from '~/types/domain';

/**
 * 发送Whois查询并获取结果
 */
export async function queryWhois(domain: string): Promise<string> {
  // 使用TldExtract安全地提取TLD
  const domainInfo = await TldExtract.parse(domain);
  const tld = domainInfo.suffix || '';
  
  // 获取TLD的WHOIS配置
  const tldWhoisConfig = await getWhoisConfig(tld);
  const server = tldWhoisConfig?.host || 'whois.verisign-grs.com';
  const port = 43;

  // 创建TCP连接
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = '';

    socket.connect(port, server, () => {
      // 发送查询
      socket.write(`${domain}\r\n`);
    });

    socket.on('data', (chunk) => {
      data += chunk.toString();
    });

    socket.on('close', () => {
      resolve(data);
    });

    socket.on('error', (err) => {
      reject(`Whois query error: ${err.message}`);
    });

    // 从配置中获取超时时间
    socket.setTimeout(whoisConfig.queryTimeout, () => {
      socket.destroy();
      reject('Whois query timed out');
    });
  });
}

/**
 * 检查域名是否可注册
 */
export async function checkDomainAvailability(domainExtractInfo: DomainInfo): Promise<{
  isAvailable: boolean;
  message?: string;
}> {
  try {
    const domain = domainExtractInfo.domain || '';
    // 直接调用getWhoisInfo获取结果
    const result = await getWhoisInfo(domainExtractInfo);
    
    return {
      isAvailable: result.isAvailable === true,
      message: result.isAvailable ? 
        'Domain is available for registration' : 
        'Domain is already registered'
    };
  } catch (error: any) {
    return {
      isAvailable: false,
      message: `Error checking availability: ${error.message}`
    };
  }
}

/**
 * 获取域名的Whois信息
 * 使用适配器系统自动选择合适的查询和解析处理器
 */
export async function getWhoisInfo(domainExtractInfo: DomainInfo, config?: any): Promise<WhoisResult> {
  try {
    const tld = domainExtractInfo.suffix || '';
    const domain = domainExtractInfo.domain || '';
    // 获取TLD信息和WHOIS配置
    const tldInfo = await getTldInfo(tld);
    const tldWhoisConfig = await getWhoisConfig(tld);
    
    // 确定查询和解析处理器类型
    const queryHandlerType = tldInfo?.queryHandler || (tldWhoisConfig?.adapter || 'whois') as string;
    const parseHandlerType = tldInfo?.parseHandler || 'parser'; // 默认使用parser解析器
    
    // 检查是否为不支持的TLD
    if (queryHandlerType === 'none') {
      return {
        domainName: domain,
        isAvailable: false,
        parseSuccess: false,
        error: `No WHOIS service available for TLD: .${tld}`,
        statusCode: 404,
        tld,
        rawText: `No WHOIS service available for TLD: .${tld}`
      };
    }
    
    // 获取查询处理器
    const queryHandler = queryHandlers[queryHandlerType as QueryHandlerType];
    if (!queryHandler) {
      throw new Error(`Query handler not found: ${queryHandlerType}`);
    }
    
    // 合并配置
    const mergedConfig = {
      ...config,
      whoisServer: tldWhoisConfig?.host || '',
      availabilityPattern: tldWhoisConfig?.availability || [],
      queryTimeout: whoisConfig.queryTimeout
    };
    
    // 执行查询
    let whoisData: string;
    try {
      whoisData = await queryHandler.query(domainExtractInfo, mergedConfig);
    } catch (queryError: any) {
      // 如果是RDAP查询失败，尝试回退到WHOIS查询
      if (queryHandlerType === 'rdap' && queryHandlers['whois']) {
        console.log(`RDAP query failed for ${domain}, falling back to WHOIS`);
        whoisData = await queryHandlers['whois'].query(domainExtractInfo, mergedConfig);
      } else {
        throw queryError;
      }
    }
    
    // 获取解析处理器
    const parseHandler = parseHandlers[parseHandlerType as ParseHandlerType];
    if (!parseHandler) {
      throw new Error(`Parse handler not found: ${parseHandlerType}`);
    }
    
    // 执行解析
    const result = parseHandler.parse(domain, whoisData, mergedConfig);
    
    // JSON解析失败时回退到Parser解析（目前不会触发，因为parseHandlerType默认为'parser'）
    if (!result.parseSuccess && parseHandlers['parser'] && parseHandlerType !== 'parser') {
      console.log(`${parseHandlerType} parsing failed for ${domain}, falling back to PARSER parsing`);
      return parseHandlers['parser'].parse(domain, whoisData, mergedConfig);
    }
    
    return result;
  } catch (error: any) {
    // 使用TldExtract安全地提取TLD信息
    let tld = '';
    const domain = domainExtractInfo.domain || '';
    try {
      const domainInfo = await TldExtract.parse(domain);
      tld = domainInfo.suffix || '';
    } catch (e) {
      console.error('Error extracting TLD:', e);
    }
    
    return {
      domainName: domain,
      isAvailable: false,
      rawText: '',
      parseSuccess: false,
      error: `Failed to get Whois data: ${error.message}`,
      formatted: {
        key: "Whois解析",
        domain: {
          domain: domain,
          name_servers: [],
          status: []
        },
        registrar: {
          key: "注册商"
        },
        registrant: {
          key: "注册人"
        },
        administrative: {
          key: "管理员"
        },
        technical: {
          key: "技术支持"
        },
        billing: {
          key: "账单"
        }
      },
      statusCode: 1,
      tld: tld
    };
  }
}
