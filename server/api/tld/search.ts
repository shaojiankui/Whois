import { searchTlds } from '../../repositories/tldRepository';

export default defineEventHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const searchTerm = query.q as string;
  
  if (!searchTerm) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Search term is required'
      })
    };
  }
  
  try {
    // 使用仓库层搜索TLD数据
    const results = await searchTlds(searchTerm);
    
    // 返回查询结果
    return results;
  } catch (error: any) {
    console.error(`Error searching TLDs:`, error);
    
    // 返回错误信息
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to search TLD data',
        details: error.message || 'Unknown error'
      })
    };
  }
}); 