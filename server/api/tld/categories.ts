import { query } from '../../database/mysql';
import { ResponseData } from '../../utils/response';
import { createApiHandler } from '../../utils/api-helpers';

export default createApiHandler(async () => {
  try {
    // 获取所有不重复的类别
    const categories = await query<{ category: string }[]>(
      'SELECT DISTINCT category FROM domain_tlds WHERE category IS NOT NULL ORDER BY category'
    );
    
    // 返回成功响应
    return ResponseData.success(categories.map(c => c.category), 'TLD categories retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching TLD categories:', error);
    
    // 返回错误信息
    return ResponseData.error(
      'Failed to fetch TLD categories from database: ' + (error.message || 'Unknown error'), 
      500
    );
  }
}); 