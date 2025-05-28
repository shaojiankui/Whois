import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { query } from '~/server/database/mysql';
import { RowDataPacket } from 'mysql2';

export default createApiHandler(async (event) => {
  try {
    // 检查管理员权限
    await requireAdmin(event);
    
    // 获取用户列表，包含查询次数统计
    const sql = `
      SELECT 
        u.*,
        COUNT(qh.id) as query_count
      FROM users u
      LEFT JOIN query_history qh ON u.id = qh.user_id
      GROUP BY u.id
      ORDER BY u.reg_time DESC
    `;
    
    const users = await query<(any & RowDataPacket)[]>(sql);
    
    // 移除密码字段
    const safeUsers = users.map(user => {
      const { password, gen_secret, secret, ...safeUser } = user;
      return safeUser;
    });
    
    return ResponseData.success(safeUsers, '用户列表获取成功');
  } catch (error: any) {
    console.error('Error fetching user list:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    return ResponseData.error('获取用户列表失败', 500);
  }
}); 