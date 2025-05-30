import { eventHandler, getRouterParam } from 'h3'
import { getWhoisInfo } from '../../utils/whois'
import { normalizeDomain } from '../../utils/domain'
import { TldExtract } from '../../utils/tldextract'
import { ResponseData } from '../../utils/response'
import { createApiHandler } from '../../utils/api-helpers'
import { SystemLogger } from '../../utils/logger'

/**
 * WHOIS查询API
 */
export default createApiHandler(async (event) => {
  const startTime = Date.now();
  const domainParam = getRouterParam(event, 'domain')
  
  // 验证域名参数
  if (!domainParam || typeof domainParam !== 'string') {
    return new ResponseData()
      .setCode(400)
      .setMessage('请提供有效的域名参数')
  }
  
  // 规范化域名
  let normalizedDomain = normalizeDomain(domainParam)
  const domainExtractInfo = await TldExtract.parse(normalizedDomain)
  normalizedDomain = domainExtractInfo.domain
  
  try {
    // 获取WHOIS信息
    const result = await getWhoisInfo(domainExtractInfo)
    const executionTime = Date.now() - startTime;
    
    // 记录成功查询日志（仅在开发环境或特殊情况下）
    if (process.env.NODE_ENV === 'development') {
      // 提取域名后缀用于记录
      const domainSuffix = domainExtractInfo.suffix || domainExtractInfo.tld || 'unknown';
      
      await SystemLogger.info('whois_query', `*.${domainSuffix}`, {
        tld: domainSuffix, // 只记录后缀
        executionTime,
        requestData: { domainSuffix }, // 只在请求数据中记录后缀
        ...SystemLogger.extractRequestInfo(event)
      });
    }
    
    // 返回成功结果
    return ResponseData.success({
      ...result,
      domain: normalizedDomain,
      normalizedDomain
    }, 'WHOIS查询成功')
    
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    // 记录错误日志
    await SystemLogger.logWhoisError(
      normalizedDomain,
      error,
      event,
      undefined, // userId 如果有用户系统可以从session中获取
      executionTime
    );
    
    // 准备空的格式化数据结构（当发生错误时）
    const emptyFormatted = {
      key: "Whois解析",
      domain: {
        domain: normalizedDomain,
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
    }
    
    // 返回带有基础数据的错误
    return new ResponseData()
      .setCode(500)
      .setMessage('WHOIS查询失败')
      .setData({
        error: error.message || 'WHOIS查询失败',
        domain: normalizedDomain,
        normalizedDomain,
        formatted: emptyFormatted
      })
  }
}) 