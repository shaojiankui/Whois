import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { getAllTlds } from '~/server/utils/tld';

export default createApiHandler(async (event) => {
  try {
    // 检查管理员权限
    await requireAdmin(event);
    
    // 获取所有TLD列表
    const tlds = await getAllTlds();
    
    return ResponseData.success(tlds, 'TLD列表获取成功');
  } catch (error: any) {
    console.error('Error fetching TLD list:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    return ResponseData.error('获取TLD列表失败', 500);
  }
}); 