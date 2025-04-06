/**
 * TLD（顶级域名）相关类型定义
 */

// TLD信息接口
export interface TldInfo {
  tld: string;                 // TLD名称（例如: com, net, org）
  type: string;                // TLD类型（例如: gTLD, ccTLD, newTLD）
  whois_adapter: string;       // WHOIS适配器类型
  whois_host: string;          // WHOIS服务器地址
  whois_availability: string;  // 可用性检查字符串
  whois_reserved: string;      // 保留域名提示信息
  level: number;               // 级别
  length: string;              // 长度
  manager: string;             // 管理机构
  region: string;              // 区域/地区
  category: string;            // 类别
  phone: string;               // 联系电话
  backend: string;             // 运营后端
  timezone_name: string;       // 时区
  timezone_offset: string;     // 时区偏移
  timezone_demo: string;       // 时间demo
  timezone_format: string;     // 自定义格式化
  timezone_showformat: string; // 自定义显示格式化
  status: number;              // 状态，0-禁用，1-启用
  description: string;         // 描述
  remark: string;              // 备注
  created_at: Date;            // 创建时间
  updated_at: Date;            // 更新时间
  
  // 兼容旧接口的字段
  queryHandler?: string;       // 查询处理器类型
  parseHandler?: string;       // 解析处理器类型
}

// 查询处理器类型
export enum QueryHandlerType {
  WHOIS = 'whois',   // 传统WHOIS TCP查询
  RDAP = 'rdap',     // RDAP HTTP查询
  WEB = 'web',       // 网页抓取
  CUSTOM = 'custom', // 自定义查询器
  NONE = 'none'      // 无可用WHOIS服务器
}

// 解析处理器类型
export enum ParseHandlerType {
  JSON = 'json',     // JSON解析
  PARSER = 'parser', // 递归的解析器
  CUSTOM = 'custom'  // 自定义解析器
}

// TLD配置信息
export interface TldConfig {
  whoisServer: string;          // WHOIS服务器地址
  availabilityPattern?: string[]; // 可用性判断模式
  registeredPattern?: string[];   // 已注册判断模式
  dateFormat?: string;          // 日期格式
  timezone?: string;            // 时区
  fields?: Record<string, string[]>; // 解析字段配置
  parseHandler?: ParseHandlerType;   // 解析处理器类型
}

// WHOIS配置
export interface WhoisConfig {
  host: string;               // WHOIS服务器地址
  adapter: string;            // 适配器类型
  availability: string[];     // 可用性判断模式
  reserved: string;           // 保留域名提示信息
}

// 时区信息
export interface TimezoneInfo {
  name: string;       // 时区名称
  offset: string;     // 时区偏移
  format: string;     // 格式化规则
  showFormat: string; // 显示格式化
}

// TLD统计信息
export interface TldStats {
  total: number;                 // 总数
  byType: Record<string, number>; // 按类型统计
  byLevel: Record<string, number>; // 按级别统计
} 