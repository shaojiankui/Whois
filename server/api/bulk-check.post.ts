import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { checkDomainAvailability } from '~/server/utils/whois';
import { SystemLogger } from '~/server/utils/logger';
import { TldExtract } from '~/server/utils/tldextract';

// 域名格式验证
function validateDomain(domain: string): { isValid: boolean; error?: string } {
  if (!domain || domain.trim().length === 0) {
    return { isValid: false, error: '域名不能为空' };
  }
  
  const trimmedDomain = domain.trim().toLowerCase();
  
  // 基本格式检查
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
  if (!domainRegex.test(trimmedDomain)) {
    return { isValid: false, error: '域名格式无效' };
  }
  
  // 检查是否包含TLD
  if (!trimmedDomain.includes('.')) {
    return { isValid: false, error: '域名必须包含顶级域名' };
  }
  
  return { isValid: true };
}

// 提取域名后缀统计
async function getDomainSuffixStats(domains: string[]): Promise<{ suffixStats: Record<string, number>; suffixSummary: string }> {
  const suffixStats: Record<string, number> = {};
  
  for (const domain of domains) {
    try {
      const domainInfo = await TldExtract.parse(domain);
      const suffix = domainInfo.suffix || domainInfo.tld || 'unknown';
      suffixStats[suffix] = (suffixStats[suffix] || 0) + 1;
    } catch (error) {
      const parts = domain.toLowerCase().split('.');
      const suffix = parts.length >= 2 ? parts[parts.length - 1] : 'unknown';
      suffixStats[suffix] = (suffixStats[suffix] || 0) + 1;
    }
  }
  
  const suffixSummary = Object.entries(suffixStats)
    .map(([suffix, count]) => `${count}个*.${suffix}`)
    .join(', ');
  
  return { suffixStats, suffixSummary };
}

export default createApiHandler(async (event) => {
  const startTime = Date.now();
  let requestDomains: string[] = [];
  
  try {
    // 获取请求体
    const body = await readBody(event);
    
    if (!body.domains || !Array.isArray(body.domains)) {
      await SystemLogger.warning('bulk_check', '批量查询参数无效：需要domains数组', {
        requestData: { parameterType: typeof body.domains },
        ...SystemLogger.extractRequestInfo(event)
      });
      return ResponseData.error('请求参数无效：需要domains数组', 400);
    }

    const domains = body.domains as string[];
    requestDomains = domains; // 保存用于catch块
    
    if (domains.length === 0) {
      await SystemLogger.warning('bulk_check', '批量查询域名列表为空', {
        requestData: { domainCount: 0 },
        ...SystemLogger.extractRequestInfo(event)
      });
      return ResponseData.error('域名列表不能为空', 400);
    }

    if (domains.length > 50) {
      const { suffixSummary } = await getDomainSuffixStats(domains);
      await SystemLogger.warning('bulk_check', `批量查询域名数量超限：${suffixSummary}`, {
        requestData: { 
          domainCount: domains.length,
          limit: 50
        },
        ...SystemLogger.extractRequestInfo(event)
      });
      return ResponseData.error('批量查询域名数量不能超过50个', 400);
    }

    const results = [];
    const errorDomains = [];
    
    // 验证并查询所有域名
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      const validation = validateDomain(domain);
      
      if (!validation.isValid) {
        results.push({
          domain: domain,
          status: 'error',
          error: validation.error,
          index: i
        });
        errorDomains.push({ domain, error: validation.error });
        continue;
      }
      
      try {
        const normalizedDomain = domain.trim().toLowerCase();
        // 创建简单的DomainInfo对象用于checkDomainAvailability
        const domainInfo = { domain: normalizedDomain };
        const result = await checkDomainAvailability(domainInfo as any);
        
        results.push({
          domain: domain,
          normalizedDomain,
          status: result.isAvailable ? 'available' : 'taken',
          message: result.message,
          index: i,
          timestamp: new Date().toISOString()
        });
        
      } catch (error: any) {
        results.push({
          domain: domain,
          status: 'error',
          error: error.message || '查询出错',
          index: i
        });
        errorDomains.push({ domain, error: error.message || '查询出错' });
      }
    }

    // 统计结果
    const stats = {
      total: domains.length,
      available: results.filter(r => r.status === 'available').length,
      taken: results.filter(r => r.status === 'taken').length,
      error: results.filter(r => r.status === 'error').length
    };

    const executionTime = Date.now() - startTime;

    // 记录批量查询完成日志（包含错误统计）
    if (errorDomains.length > 0) {
      const { suffixStats, suffixSummary } = await getDomainSuffixStats(errorDomains.map(e => e.domain));
      
      await SystemLogger.warning('bulk_check', `批量查询完成，包含${errorDomains.length}个错误：${suffixSummary}`, {
        executionTime,
        requestData: { 
          totalDomains: domains.length,
          stats,
          errorSuffixStats: suffixStats,
          errorCount: errorDomains.length
        },
        ...SystemLogger.extractRequestInfo(event)
      });
    } else if (process.env.NODE_ENV === 'development') {
      // 仅在开发环境记录成功的批量查询
      const { suffixStats, suffixSummary } = await getDomainSuffixStats(domains);
      
      await SystemLogger.info('bulk_check', `批量查询成功完成：${suffixSummary}`, {
        executionTime,
        requestData: { 
          totalDomains: domains.length,
          stats,
          suffixStats
        },
        ...SystemLogger.extractRequestInfo(event)
      });
    }

    return ResponseData.success({
      results,
      stats,
      timestamp: new Date().toISOString()
    }, '批量查询完成');

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    // 记录批量查询系统错误 - 使用新的日志方法
    await SystemLogger.logBulkCheckError(
      requestDomains || [],
      error,
      event,
      undefined, // userId
      executionTime
    );
    
    console.error('Bulk check error:', error);
    return ResponseData.error('服务器错误', 500);
  }
}); 