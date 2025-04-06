import { getQuery } from 'h3';
import { TldExtract } from '../utils/tldextract';
import { ResponseData } from '../utils/response';
import { createApiHandler } from '../utils/api-helpers';

/**
 * 域名解析API端点
 * 接收域名参数，返回解析后的域名信息
 */
export default createApiHandler(async (event) => {
  const query = getQuery(event);
  const domain = query.domain as string;
  
  if (!domain) {
    return ResponseData.error('请提供域名参数', 400);
  }
  
  try {
    // 调用TldExtract工具进行域名解析
    const domainInfo = await TldExtract.parse(domain);
    
    // 返回成功响应
    return ResponseData.success(domainInfo, '域名解析成功');
  } catch (error: any) {
    console.error('域名解析出错:', error);
    return ResponseData.error(`域名解析出错: ${error.message}`, 500);
  }
}); 