import { getTldByName } from '../../repositories/tldRepository';

export default defineEventHandler(async (event) => {
  // 获取路由参数
  const name = getRouterParam(event, 'name');
  
  if (!name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'TLD name is required'
      })
    };
  }
  
  try {
    // 使用仓库层获取TLD数据
    const tld = await getTldByName(name);
    
    if (!tld) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `TLD '${name}' not found`
        })
      };
    }
    
    // 返回查询结果
    return tld;
  } catch (error: any) {
    console.error(`Error fetching TLD '${name}':`, error);
    
    // 返回错误信息
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch TLD data from database',
        details: error.message || 'Unknown error'
      })
    };
  }
}); 