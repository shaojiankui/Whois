import { query } from '../database/mysql';
import { 
  TldInfo, 
  TldStats,
  WhoisConfig,
  TimezoneInfo
} from '~/types/tld';
import { tldCache } from './cache';

// 标记TLD数据是否已加载到内存
let isLoaded = false;
// 保存TLD列表以便快速访问
let tldList: TldInfo[] = [];

/**
 * 确保TLD数据已加载
 */
async function ensureTldDataLoaded(): Promise<void> {
  if (!isLoaded) {
    await loadTldList();
  }
}

/**
 * 从数据库加载TLD列表并缓存
 */
export async function loadTldList(): Promise<TldInfo[]> {
  // 先检查缓存
  const cached = tldCache.get<TldInfo[]>('tldList');
  if (cached && isLoaded) {
    return cached;
  }

  try {
    console.log('Loading TLD data from database...');
    // 从数据库获取
    let tlds = await query<TldInfo[]>('SELECT * FROM domain_tlds WHERE status = 1');
    tlds.forEach(tld => {
      tld.queryHandler = tld.whois_adapter || 'whois';
      tld.parseHandler = tld.whois_adapter === 'rdap' ? 'json' : 'parser';
    });
    
    // 保存到内存中
    tldList = tlds;
    
    // 将TLD列表存入缓存
    tldCache.set('tldList', tldList);
    
    isLoaded = true;
    console.log(`Loaded ${tldList.length} TLD records into memory cache`);
    
    return tldList;
  } catch (error) {
    console.error('Error loading TLD list:', error);
    return [];
  }
}

/**
 * 按类型过滤TLD列表
 */
export async function filterTldByType(type: string): Promise<TldInfo[]> {
  await ensureTldDataLoaded();
  return tldList.filter(tld => tld.type === type);
}

/**
 * 搜索TLD
 */
export async function searchTld(query: string): Promise<TldInfo[]> {
  await ensureTldDataLoaded();
  
  if (!query) {
    return [...tldList];
  }
  
  const lowercaseQuery = query.toLowerCase();
  
  return tldList.filter(tld => 
    tld.tld.toLowerCase().includes(lowercaseQuery) || 
    (tld.description && tld.description.toLowerCase().includes(lowercaseQuery)) ||
    (tld.region && tld.region.toLowerCase().includes(lowercaseQuery))
  );
}

/**
 * 获取TLD详细信息
 */
export async function getTldInfo(tld: string): Promise<TldInfo | null> {
  await ensureTldDataLoaded();
  
  // 从内存列表中查找
  const tldInfo = tldList.find(item => item.tld.toLowerCase() === tld.toLowerCase());
  
  if (tldInfo) {
    return tldInfo;
  }
  
  return null;
}

/**
 * 获取所有TLD列表
 */
export async function getAllTlds(): Promise<TldInfo[]> {
  await ensureTldDataLoaded();
  return [...tldList];
}

/**
 * 获取TLD的统计信息
 */
export async function getTldStats(): Promise<TldStats> {
  await ensureTldDataLoaded();
  
  // 按类型和级别统计数量
  const typeStats: Record<string, number> = {};
  const levelStats: Record<string, number> = {};
  
  tldList.forEach(tld => {
    // 按类型统计
    if (tld.type) {
      if (!typeStats[tld.type]) {
        typeStats[tld.type] = 0;
      }
      typeStats[tld.type]++;
    }
    
    // 按级别统计
    const levelKey = `level${tld.level}`;
    if (!levelStats[levelKey]) {
      levelStats[levelKey] = 0;
    }
    levelStats[levelKey]++;
  });
  
  return {
    total: tldList.length,
    byType: typeStats,
    byLevel: levelStats
  };
}

/**
 * 获取TLD的时区信息
 */
export async function getTldTimezone(tld: string): Promise<TimezoneInfo | null> {
  const tldInfo = await getTldInfo(tld);
  
  if (!tldInfo || !tldInfo.timezone_name) {
    return null;
  }
  
  return {
    name: tldInfo.timezone_name,
    offset: tldInfo.timezone_offset || '',
    format: tldInfo.timezone_format || '',
    showFormat: tldInfo.timezone_format || ''
  };
}

/**
 * 获取TLD的WHOIS相关信息
 */
export async function getWhoisConfig(tld: string): Promise<WhoisConfig | null> {
  const tldInfo = await getTldInfo(tld);
  
  if (!tldInfo) {
    return null;
  }
  
  // 解析可用性检查字符串为数组
  const availabilityPatterns = tldInfo.whois_availability 
    ? tldInfo.whois_availability.split('|').filter(Boolean) 
    : [];
  
  return {
    host: tldInfo.whois_host || '',
    adapter: tldInfo.whois_adapter || 'whois',
    availability: availabilityPatterns,
    reserved: tldInfo.whois_reserved || ''
  };
}

/**
 * 更新TLD配置
 */
export async function updateTldConfig(tldName: string, config: Partial<any>): Promise<boolean> {
  try {
    // 确保TLD为小写
    const tld = tldName.toLowerCase();
    
    // 构建更新字段
    const dbFields: Record<string, any> = {};
    
    // 映射配置字段到数据库字段
    if (config.whoisServer) dbFields.whois_host = config.whoisServer;
    if (config.host) dbFields.whois_host = config.host;
    if (config.adapter) dbFields.whois_adapter = config.adapter;
    
    // 处理可用性模式
    if (config.availabilityPattern) {
      const patterns = Array.isArray(config.availabilityPattern) 
        ? config.availabilityPattern 
        : [config.availabilityPattern];
      dbFields.whois_availability = patterns.join('|');
    }
    
    if (config.reserved) dbFields.whois_reserved = config.reserved;
    if (config.manager) dbFields.manager = config.manager;
    if (config.type) dbFields.type = config.type;
    if (config.description) dbFields.description = config.description;
    if (config.level !== undefined) dbFields.level = config.level;
    if (config.region) dbFields.region = config.region;
    if (config.category) dbFields.category = config.category;
    if (config.timezone) dbFields.timezone_name = config.timezone;
    
    // 没有要更新的字段
    if (Object.keys(dbFields).length === 0) {
      return false;
    }
    
    // 查询TLD是否存在
    const existingTld = await query<any[]>('SELECT tld FROM domain_tlds WHERE tld = ?', [tld]);
    
    if (existingTld.length > 0) {
      // 更新现有记录
      await query(
        `UPDATE domain_tlds SET ${Object.keys(dbFields).map(k => `${k} = ?`).join(', ')} WHERE tld = ?`,
        [...Object.values(dbFields), tld]
      );
    } else {
      // 创建新记录
      dbFields.tld = tld;
      await query(
        `INSERT INTO domain_tlds (${Object.keys(dbFields).join(', ')}) VALUES (${Object.keys(dbFields).map(() => '?').join(', ')})`,
        Object.values(dbFields)
      );
    }
    
    // 清除缓存，确保下次读取时获取最新数据
    tldCache.delete('tldList');
    isLoaded = false; // 强制重新加载
    
    return true;
  } catch (error) {
    console.error(`Error updating TLD config for ${tldName}:`, error);
    return false;
  }
} 