import { query } from '../../database/mysql';

export default defineEventHandler(async () => {
  try {
    // 获取所有不重复的区域
    const regions = await query<{ region: string }[]>(
      'SELECT DISTINCT region FROM domain_tlds WHERE region IS NOT NULL ORDER BY region'
    );
    
    // 返回查询结果
    return regions.map(r => r.region);
  } catch (error: any) {
    console.error('Error fetching TLD regions:', error);
    
    // 返回错误信息
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch TLD regions from database',
        details: error.message || 'Unknown error'
      })
    };
  }
}); 