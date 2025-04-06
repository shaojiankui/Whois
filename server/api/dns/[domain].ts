import { 
  queryDnsRecord, 
  batchQueryDnsRecords, 
  formatDnsResults,
  DnsRecordType
} from '~/server/utils/dns';
import { validateAndNormalizeDomain } from '~/server/utils/domain';
import { dnsCache } from '~/server/utils/cache';
import { getQuery } from 'h3';
import { ResponseData } from '../../utils/response';
import { createApiHandler } from '../../utils/api-helpers';

/**
 * DNS查询API
 * 查询域名的DNS记录
 * 请求格式：GET /api/dns?domain=example.com&types=A,AAAA,MX
 */
export default createApiHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const domain = query.domain as string;
  const typesParam = query.types as string;
  
  if (!domain) {
    return ResponseData.error('Domain parameter is required', 400);
  }
  
  // 验证域名格式
  const domainCheck = await validateAndNormalizeDomain(domain);
  
  if (!domainCheck.isValid) {
    return ResponseData.error(domainCheck.message || 'Invalid domain name', 400);
  }
  
  const normalizedDomain = domainCheck.normalizedDomain as string;
  
  // 解析请求的DNS记录类型
  const validTypes: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA'];
  let types: DnsRecordType[] = [];
  
  if (typesParam) {
    // 解析请求的类型参数
    const requestedTypes = typesParam.split(',').map(t => t.trim().toUpperCase());
    
    // 过滤出有效的类型
    types = requestedTypes.filter(t => validTypes.includes(t as DnsRecordType)) as DnsRecordType[];
  }
  
  // 如果没有指定有效类型，默认查询所有类型
  if (types.length === 0) {
    types = validTypes;
  }
  
  try {
    // 构建缓存键
    const cacheKey = `dns:${normalizedDomain}:${types.join(',')}`;
    const cachedResult = dnsCache.get(cacheKey);
    
    if (cachedResult) {
      return ResponseData.success(cachedResult, 'DNS records retrieved from cache');
    }
    
    // 执行DNS查询
    const dnsResults = await batchQueryDnsRecords(normalizedDomain, types);
    
    // 格式化结果
    const formattedResults = formatDnsResults(dnsResults);
    
    // 缓存结果
    dnsCache.set(cacheKey, formattedResults);
    
    return ResponseData.success(formattedResults, 'DNS records successfully retrieved');
  } catch (error: any) {
    return ResponseData.error(`Failed to retrieve DNS records: ${error.message}`, 500);
  }
}); 