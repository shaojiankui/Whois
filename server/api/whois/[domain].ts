import { eventHandler, getRouterParam } from 'h3'
import { getWhoisInfo } from '../../utils/whois'
import { normalizeDomain } from '../../utils/domain'
import { TldExtract } from '../../utils/tldextract'
import { ResponseData } from '../../utils/response'
import { createApiHandler } from '../../utils/api-helpers'

/**
 * WHOIS查询API
 */
export default createApiHandler(async (event) => {
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
    
    // 返回成功结果
    return ResponseData.success({
      ...result,
      domain: normalizedDomain,
      normalizedDomain
    }, 'WHOIS查询成功')
    
  } catch (error: any) {
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