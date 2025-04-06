import { 
  loadTldList, 
  filterTldByType, 
  searchTld, 
  getTldInfo, 
  getTldStats 
} from '../../utils/tld';

/**
 * TLD列表查询API
 * 请求格式：
 * - GET /api/tld - 获取所有TLD
 * - GET /api/tld?type=gTLD - 按类型筛选
 * - GET /api/tld?query=search - 搜索TLD
 * - GET /api/tld?stats=true - 获取TLD统计信息
 */
export default defineEventHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const type = query.type as string;
  const searchQuery = query.query as string;
  const stats = query.stats as string;
  const tld = query.tld as string;
  
  try {
    // 如果请求统计信息
    if (stats === 'true') {
      const statsData = await getTldStats();
      return {
        success: true,
        data: statsData
      };
    }
    
    // 如果请求特定TLD的信息
    if (tld) {
      const tldInfo = await getTldInfo(tld);
      
      if (!tldInfo) {
        return {
          success: false,
          error: `TLD not found: ${tld}`
        };
      }
      
      return {
        success: true,
        data: tldInfo
      };
    }
    
    // 如果按类型筛选
    if (type) {
      const filteredList = await filterTldByType(type);
      return {
        success: true,
        data: filteredList,
        count: filteredList.length
      };
    }
    
    // 如果是搜索查询
    if (searchQuery) {
      const searchResults = await searchTld(searchQuery);
      return {
        success: true,
        data: searchResults,
        count: searchResults.length
      };
    }
    
    // 获取所有TLD
    const tldList = await loadTldList();
    return {
      success: true,
      data: tldList,
      count: tldList.length
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to retrieve TLD information: ${error.message}`
    };
  }
}); 