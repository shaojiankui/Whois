import { query } from '../../database/mysql';
import { ResponseData } from '../../utils/response';
import { createApiHandler } from '../../utils/api-helpers';

export default createApiHandler(async () => {
  try {
    // 获取所有不重复的类型，处理type为null的情况
    const types = await query<{ type: string }[]>(
      'SELECT DISTINCT type FROM domain_tlds WHERE type IS NOT NULL AND type != "" AND status = 1 ORDER BY type'
    );
    
    // 返回成功响应
    return ResponseData.success(types.map(t => t.type), 'TLD types retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching TLD types:', error);
    
    // 返回错误信息
    return ResponseData.error(
      'Failed to fetch TLD types from database: ' + (error.message || 'Unknown error'), 
      500
    );
  }
}); 