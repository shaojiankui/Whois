import { updateTldConfig } from '../../utils/tld';

/**
 * TLD配置更新API
 * 请求格式：POST /api/tld/update
 * 请求体：
 * {
 *   "tld": "com",
 *   "config": {
 *     "whoisServer": "whois.verisign-grs.com",
 *     "availabilityPattern": ["No match for"]
 *   }
 * }
 */
export default defineEventHandler(async (event) => {
  try {
    // 获取请求体
    const body = await readBody(event);
    
    // 参数验证
    if (!body.tld || !body.config) {
      return {
        success: false,
        error: 'Invalid request parameters. "tld" and "config" are required.'
      };
    }
    
    // 更新TLD配置
    const success = await updateTldConfig(body.tld, body.config);
    
    if (success) {
      return {
        success: true,
        message: `TLD ${body.tld} configuration updated successfully.`
      };
    } else {
      return {
        success: false,
        error: `Failed to update TLD ${body.tld} configuration.`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to update TLD configuration: ${error.message}`
    };
  }
}); 