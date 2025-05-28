import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { remove } from '~/server/database/mysql';

export default createApiHandler(async (event) => {
  try {
    // 检查管理员权限
    await requireAdmin(event);
    
    // 获取路径参数
    const tldName = getRouterParam(event, 'name');
    if (!tldName) {
      return ResponseData.error('TLD名称参数缺失', 400);
    }
    
    // 删除TLD
    const result = await remove('domain_tlds', 'tld = ?', [tldName.toLowerCase()]);
    
    if (result.affectedRows > 0) {
      return ResponseData.success({}, `TLD "${tldName}" 删除成功`);
    } else {
      return ResponseData.error('TLD不存在', 404);
    }
  } catch (error: any) {
    console.error('Error deleting TLD:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    return ResponseData.error('删除TLD失败', 500);
  }
}); 