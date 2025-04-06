import { checkDomainAvailability } from '~/server/utils/whois';
import { validateAndNormalizeDomain } from '~/server/utils/domain';
import { availabilityCache } from '~/server/utils/cache';
import { H3Event } from 'h3';

// 定义域名可用性检查结果接口
interface AvailabilityResult {
  isAvailable: boolean;
  message?: string;
}

/**
 * 批量域名可用性检查API - SSE流式版本
 * 使用Server-Sent Events实现实时状态反馈
 * 请求格式：POST /api/bulk-stream
 * 请求体: { domains: ["example.com", "example.net", ...] }
 */
export default defineEventHandler(async (event) => {
  // 设置SSE头部
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // 获取POST请求体
  const body = await readBody(event);
  
  if (!body || !body.domains || !Array.isArray(body.domains)) {
    // 发送错误消息
    sendEvent(event, 'error', {
      success: false,
      error: 'Invalid request body. Expected { domains: string[] }'
    });
    return;
  }
  
  const domains = body.domains as string[];
  
  // 验证域名数量限制
  const MAX_DOMAINS = 100;
  if (domains.length > MAX_DOMAINS) {
    sendEvent(event, 'error', {
      success: false,
      error: `Too many domains. Maximum allowed is ${MAX_DOMAINS}`
    });
    return;
  }
  
  // 发送初始化消息
  sendEvent(event, 'init', {
    total: domains.length,
    message: 'Starting batch domain check'
  });
  
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
  
  // 发送验证结果
  sendEvent(event, 'validation', {
    validCount: validDomains.length,
    invalidCount: domains.length - validDomains.length,
    invalidDomains: validatedDomains.filter(d => !d.isValid)
  });
  
  // 如果没有有效域名，结束流
  if (validDomains.length === 0) {
    sendEvent(event, 'complete', {
      success: false,
      message: 'No valid domains to check'
    });
    return;
  }
  
  try {
    // 逐个处理域名，每处理一个都发送实时更新
    for (let i = 0; i < validDomains.length; i++) {
      const domain = validDomains[i];
      
      try {
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
        
        // 发送单个域名的结果
        sendEvent(event, 'result', {
          domain,
          isAvailable: result.isAvailable,
          message: result.message,
          fromCache,
          index: i,
          progress: Math.round(((i + 1) / validDomains.length) * 100)
        });
        
        // 添加小延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: unknown) {
        // 发送错误结果
        const domainError = error as Error;
        sendEvent(event, 'result', {
          domain,
          error: domainError.message || 'Check failed',
          isAvailable: false,
          index: i,
          progress: Math.round(((i + 1) / validDomains.length) * 100)
        });
      }
    }
    
    // 发送完成消息
    sendEvent(event, 'complete', {
      success: true,
      totalChecked: validDomains.length,
      message: 'All domains checked successfully'
    });
    
  } catch (error: any) {
    // 发送错误消息
    sendEvent(event, 'error', {
      success: false,
      error: `Domain check process failed: ${error.message}`
    });
  }
});

/**
 * 辅助函数：发送SSE事件
 */
function sendEvent(event: H3Event, eventName: string, data: any): void {
  event.node.res.write(`event: ${eventName}\n`);
  event.node.res.write(`data: ${JSON.stringify(data)}\n\n`);
} 