import { checkDomainAvailability } from '~/server/utils/whois';
import { validateAndNormalizeDomain } from '~/server/utils/domain';
import { availabilityCache } from '~/server/utils/cache';

// 定义可用性检查结果类型
interface AvailabilityResult {
  isAvailable: boolean;
  message?: string;
}

/**
 * 批量域名可用性检查API
 * 批量检查多个域名是否可注册
 * 请求格式：POST /api/bulk
 * 请求体: { domains: ["example.com", "example.net", ...] }
 */
export default defineEventHandler(async (event) => {
  // 获取POST请求体
  const body = await readBody(event);
  
  if (!body || !body.domains || !Array.isArray(body.domains)) {
    return {
      success: false,
      error: 'Invalid request body. Expected { domains: string[] }'
    };
  }
  
  const domains = body.domains as string[];
  
  // 验证域名数量限制（避免滥用）
  const MAX_DOMAINS = 50;
  if (domains.length > MAX_DOMAINS) {
    return {
      success: false,
      error: `Too many domains. Maximum allowed is ${MAX_DOMAINS}`
    };
  }
  
  // 验证并规范化所有域名
  const validatedDomains = domains.map(domain => {
    const validation = validateAndNormalizeDomain(domain);
    return {
      original: domain,
      normalized: validation.normalizedDomain,
      isValid: validation.isValid,
      error: validation.isValid ? undefined : validation.message
    };
  });
  
  // 过滤出有效的域名
  const validDomains = validatedDomains.filter(d => d.isValid).map(d => d.normalized as string);
  
  // 如果没有有效域名，直接返回
  if (validDomains.length === 0) {
    return {
      success: false,
      error: 'No valid domains provided',
      invalidDomains: validatedDomains.filter(d => !d.isValid)
    };
  }
  
  try {
    // 存储查询结果
    const results: any[] = [];
    
    // 并行执行域名可用性检查
    const checkPromises = validDomains.map(async (domain) => {
      // 检查缓存
      const cacheKey = `availability:${domain}`;
      const cachedResult = availabilityCache.get<AvailabilityResult>(cacheKey);
      
      let result: AvailabilityResult;
      let fromCache = false;
      
      if (cachedResult) {
        result = cachedResult;
        fromCache = true;
      } else {
        // 执行可用性检查
        result = await checkDomainAvailability(domain);
        // 缓存结果
        availabilityCache.set(cacheKey, result);
      }
      
      // 添加到结果列表
      results.push({
        domain,
        isAvailable: result.isAvailable,
        message: result.message,
        fromCache
      });
    });
    
    // 等待所有检查完成
    await Promise.all(checkPromises);
    
    // 返回最终结果
    return {
      success: true,
      data: {
        totalChecked: validDomains.length,
        availableDomains: results.filter(r => r.isAvailable).length,
        results,
        invalidDomains: validatedDomains.filter(d => !d.isValid)
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to check domain availability: ${error.message}`
    };
  }
}); 