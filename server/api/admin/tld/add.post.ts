import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { insert } from '~/server/database/mysql';

export default createApiHandler(async (event) => {
  try {
    // 检查管理员权限
    await requireAdmin(event);
    
    // 获取请求体
    const body = await readBody(event);
    
    // 验证必需字段
    if (!body.name || !body.type) {
      return ResponseData.error('TLD名称和类型为必填项', 400);
    }
    
    // 准备插入数据
    const tldData = {
      tld: body.name.toLowerCase(),
      type: body.type,
      whois_adapter: body.query_handler || 'tcp',
      whois_host: body.whois_server || '',
      whois_availability: body.availability_check_pattern || '',
      whois_reserved: '',
      level: 1,
      length: '',
      manager: '',
      region: '',
      category: body.type,
      phone: '',
      backend: '',
      timezone_name: '',
      timezone_offset: '',
      timezone_demo: '',
      timezone_format: '',
      timezone_showformat: '',
      status: body.enabled ? 1 : 0,
      description: `${body.type} TLD`,
      remark: `Added via admin panel`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // 插入到数据库
    const result = await insert('domain_tlds', tldData);
    
    if (result.insertId) {
      return ResponseData.success({ id: result.insertId }, `TLD "${body.name}" 添加成功`);
    } else {
      return ResponseData.error('添加TLD失败', 500);
    }
  } catch (error: any) {
    console.error('Error adding TLD:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    // 检查重复键错误
    if (error.code === 'ER_DUP_ENTRY') {
      return ResponseData.error('TLD已存在', 400);
    }
    
    return ResponseData.error('添加TLD失败', 500);
  }
}); 