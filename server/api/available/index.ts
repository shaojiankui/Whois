import { checkDomainAvailability } from '~/server/utils/whois';
import { validateAndNormalizeDomain } from '~/server/utils/domain';
import { availabilityCache } from '~/server/utils/cache';
import { TldExtract } from '~/server/utils/tldextract';
import { getQuery } from 'h3';
import { ResponseData } from '../../utils/response';
import { createApiHandler } from '../../utils/api-helpers';

/**
 * 域名可用性检查API
 * 检查域名是否可注册
 * 请求格式：GET /api/available?domain=example.com
 */
export default createApiHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const domain = query.domain as string;
  
  if (!domain) {
    return ResponseData.error('Domain parameter is required', 400);
  }
  
  // 验证域名格式
  const domainCheck = await validateAndNormalizeDomain(domain);
  
  if (!domainCheck.isValid) {
    return ResponseData.error(domainCheck.message || 'Invalid domain name', 400);
  }
  
  const normalizedDomain = domainCheck.normalizedDomain as string;
  
  try {
    // 检查缓存
    const cacheKey = `availability:${normalizedDomain}`;
    const cachedResult = availabilityCache.get(cacheKey);
    
    if (cachedResult) {
      return ResponseData.success(cachedResult, 'Domain availability retrieved from cache');
    }
    
    // 获取域名信息
    const domainInfo = domainCheck.domainInfo || await TldExtract.parse(normalizedDomain);
    
    // 执行可用性检查
    const availabilityResult = await checkDomainAvailability(domainInfo);
    
    // 缓存结果
    availabilityCache.set(cacheKey, availabilityResult);
    
    return ResponseData.success(availabilityResult, 'Domain availability checked successfully');
  } catch (error: any) {
    return ResponseData.error(`Failed to check domain availability: ${error.message}`, 500);
  }
}); 