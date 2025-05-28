import { createApiHandler } from '~/server/utils/api-helpers';
import { ResponseData } from '~/server/utils/response';
import { requireAdmin } from '~/server/utils/admin';
import { query } from '~/server/database/mysql';
import { RowDataPacket } from 'mysql2';

export default createApiHandler(async (event) => {
  try {
    // 检查管理员权限
    await requireAdmin(event);
    
    // 获取用户总数
    const totalUsersResult = await query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersResult[0].count;
    
    // 获取查询总数
    const totalQueriesResult = await query<RowDataPacket[]>('SELECT COUNT(*) as count FROM query_history');
    const totalQueries = totalQueriesResult[0].count;
    
    // 获取今日注册用户数
    const todayRegistrationsResult = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE DATE(reg_time) = CURDATE()'
    );
    const todayRegistrations = todayRegistrationsResult[0].count;
    
    // 获取本月注册用户数
    const thisMonthRegistrationsResult = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE YEAR(reg_time) = YEAR(NOW()) AND MONTH(reg_time) = MONTH(NOW())'
    );
    const thisMonthRegistrations = thisMonthRegistrationsResult[0].count;
    
    const stats = {
      totalUsers,
      totalQueries,
      todayRegistrations,
      thisMonthRegistrations
    };
    
    return ResponseData.success(stats, '用户统计信息获取成功');
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    return ResponseData.error('获取用户统计信息失败', 500);
  }
}); 