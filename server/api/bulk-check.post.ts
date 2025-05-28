import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { checkDomainAvailability } from '~/server/utils/whois';

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

export default createApiHandler(async (event) => {
  try {
    // 获取请求体
    const body = await readBody(event);
    
    if (!body.domains || !Array.isArray(body.domains)) {
      return ResponseData.error('请求参数无效：需要domains数组', 400);
    }

    const domains = body.domains as string[];
    
    if (domains.length === 0) {
      return ResponseData.error('域名列表不能为空', 400);
    }

    if (domains.length > 50) {
      return ResponseData.error('批量查询域名数量不能超过50个', 400);
    }

    const results = [];
    
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
        continue;
      }
      
      try {
        const normalizedDomain = domain.trim().toLowerCase();
        const result = await checkDomainAvailability(normalizedDomain);
        
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
      }
    }

    // 统计结果
    const stats = {
      total: domains.length,
      available: results.filter(r => r.status === 'available').length,
      taken: results.filter(r => r.status === 'taken').length,
      error: results.filter(r => r.status === 'error').length
    };

    return ResponseData.success({
      results,
      stats,
      timestamp: new Date().toISOString()
    }, '批量查询完成');

  } catch (error: any) {
    console.error('Bulk check error:', error);
    return ResponseData.error('服务器错误', 500);
  }
}); 