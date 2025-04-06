import { query, insert, update, remove } from '../database/mysql';
import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';

// TLD对象类型定义，根据实际数据库表结构
export interface TLD extends RowDataPacket {
  tld: string;                 // 顶级域名 (主键)
  type?: string;               // 类型，如newgTLD
  whois_adapter?: string;      // WHOIS适配器
  whois_host?: string;         // WHOIS服务器地址
  whois_availability?: string; // 可用性检查字符串
  whois_reserved?: string;     // 保留域名提示信息
  level?: number;              // 级别
  length?: string;             // 长度
  manager?: string;            // 管理机构
  region?: string;             // 区域/地区
  category?: string;           // 类别
  phone?: string;              // 联系电话
  backend?: string;            // 运营后端
  timezone_name?: string;      // 时区
  timezone_offset?: string;    // 时区偏移
  timezone_demo?: string;      // 时间demo
  timezone_format?: string;    // 自定义格式化
  timezone_showformat?: string;// 自定义显示格式化
  status?: number;             // 状态，0-禁用，1-启用
  description?: string;        // 描述
  remark?: string;             // 备注
  created_at?: string;         // 创建时间
  updated_at?: string;         // 更新时间
}

/**
 * 获取所有TLD数据
 * @returns TLD列表
 */
export const getAllTlds = async (): Promise<TLD[]> => {
  return await query<TLD[]>('SELECT * FROM domain_tlds WHERE status = 1');
};

/**
 * 根据TLD名称获取TLD
 * @param tldName TLD名称
 * @returns TLD对象
 */
export const getTldByName = async (tldName: string): Promise<TLD | null> => {
  const results = await query<TLD[]>('SELECT * FROM domain_tlds WHERE tld = ?', [tldName]);
  return results.length > 0 ? results[0] : null;
};

/**
 * 根据类型获取TLD列表
 * @param type TLD类型
 * @returns TLD列表
 */
export const getTldsByType = async (type: string): Promise<TLD[]> => {
  return await query<TLD[]>('SELECT * FROM domain_tlds WHERE type = ? AND status = 1', [type]);
};

/**
 * 根据区域获取TLD列表
 * @param region 区域/地区
 * @returns TLD列表
 */
export const getTldsByRegion = async (region: string): Promise<TLD[]> => {
  return await query<TLD[]>('SELECT * FROM domain_tlds WHERE region = ? AND status = 1', [region]);
};

/**
 * 根据类别获取TLD列表
 * @param category 类别
 * @returns TLD列表
 */
export const getTldsByCategory = async (category: string): Promise<TLD[]> => {
  return await query<TLD[]>('SELECT * FROM domain_tlds WHERE category = ? AND status = 1', [category]);
};

/**
 * 创建新的TLD
 * @param tld TLD对象
 * @returns 插入结果
 */
export const createTld = async (tld: Omit<TLD, 'created_at' | 'updated_at'>): Promise<OkPacket> => {
  return await insert('domain_tlds', tld);
};

/**
 * 更新TLD
 * @param tldName TLD名称
 * @param tld 要更新的TLD数据
 * @returns 更新结果
 */
export const updateTld = async (tldName: string, tld: Partial<TLD>): Promise<ResultSetHeader> => {
  return await update('domain_tlds', tld, 'tld = ?', [tldName]);
};

/**
 * 删除TLD
 * @param tldName TLD名称
 * @returns 删除结果
 */
export const deleteTld = async (tldName: string): Promise<ResultSetHeader> => {
  return await remove('domain_tlds', 'tld = ?', [tldName]);
};

/**
 * 禁用或启用TLD
 * @param tldName TLD名称
 * @param status 状态 (0-禁用，1-启用)
 * @returns 更新结果
 */
export const toggleTldStatus = async (tldName: string, status: 0 | 1): Promise<ResultSetHeader> => {
  return await update('domain_tlds', { status }, 'tld = ?', [tldName]);
};

/**
 * 搜索TLD
 * @param searchQuery 搜索关键词
 * @returns 搜索结果
 */
export const searchTlds = async (searchQuery: string): Promise<TLD[]> => {
  const queryPattern = `%${searchQuery}%`;
  return await query<TLD[]>(
    'SELECT * FROM domain_tlds WHERE tld LIKE ? OR manager LIKE ? OR description LIKE ? OR region LIKE ? OR category LIKE ?',
    [queryPattern, queryPattern, queryPattern, queryPattern, queryPattern]
  );
}; 