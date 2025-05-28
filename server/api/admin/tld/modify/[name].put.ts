import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { update } from '~/server/database/mysql';

export default createApiHandler(async (event) => {
  try {
    // 检查管理员权限
    await requireAdmin(event);
    
    // 获取路径参数
    const tldName = getRouterParam(event, 'name');
    if (!tldName) {
      return ResponseData.error('TLD名称参数缺失', 400);
    }
    
    // 获取请求体
    const body = await readBody(event);
    
    // 准备更新数据
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };
    
    // 映射字段
    if (body.type) updateData.type = body.type;
    if (body.whois_server !== undefined) updateData.whois_host = body.whois_server;
    if (body.rdap_server !== undefined) updateData.rdap_server = body.rdap_server;
    if (body.query_handler) updateData.whois_adapter = body.query_handler;
    if (body.parser_script_path !== undefined) updateData.parser_script = body.parser_script_path;
    if (body.availability_check_pattern !== undefined) updateData.whois_availability = body.availability_check_pattern;
    if (body.enabled !== undefined) updateData.status = body.enabled ? 1 : 0;
    
    // 更新数据库
    const result = await update('domain_tlds', updateData, 'tld = ?', [tldName.toLowerCase()]);
    
    if (result.affectedRows > 0) {
      return ResponseData.success({}, `TLD "${tldName}" 更新成功`);
    } else {
      return ResponseData.error('TLD不存在或未进行任何更改', 404);
    }
  } catch (error: any) {
    console.error('Error updating TLD:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    return ResponseData.error('更新TLD失败', 500);
  }
}); 