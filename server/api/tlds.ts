import { getAllTlds } from '../repositories/tldRepository';
import { ResponseData } from '../utils/response';
import { createApiHandler } from '../utils/api-helpers';

export default createApiHandler(async (event) => {
  try {
    // 使用仓库层获取TLD数据
    const tlds = await getAllTlds();
    
    // 返回成功响应
    return ResponseData.success(tlds, 'TLD数据获取成功');
  } catch (error: any) {
    console.error('Database error:', error);
    
    // 返回错误信息
    return ResponseData.error(
      'Failed to fetch TLD data from database: ' + (error.message || 'Unknown error'), 
      500
    );
  }
}); 