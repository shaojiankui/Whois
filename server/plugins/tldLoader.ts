import { loadTldList } from '../utils/tld';

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🚀 预加载TLD数据到内存缓存...');
  
  try {
    // 加载TLD数据到内存缓存
    const tldList = await loadTldList();
    console.log(`✅ 成功加载 ${tldList.length} 条TLD记录到缓存`);
  } catch (error) {
    console.error('❌ 加载TLD数据失败:', error);
  }
}); 