/**
 * 域名相关类型定义
 */

// 域名解析结果接口
export interface DomainInfo {
  // 完整域名
  domain: string;
  // 域名前缀（一级域名部分）
  prefix: string;
  // 域名后缀（TLD部分）
  suffix: string;
  // 子域名部分（如果有）
  subdomain?: string;
  // 父级前缀（对于多层次的域名，如example.co.uk，父级前缀是co）
  parentPrefix?: string;
  // 以下是WHOIS信息相关字段
  creationDate?: string;
  expiryDate?: string;
  updatedDate?: string;
  status?: string[];
  isAvailable?: boolean;
  isPremium?: boolean;
  registrantName?: string;
  registrantOrganization?: string;
  registrantEmail?: string;
  // 兼容字段
  sld?: string; // 二级域名部分
  tld?: string; // 顶级域名
}

// 域名标签类型枚举
export enum DomainTagType {
  // 时间相关标签
  LONG_HISTORY = 'long-history',      // 长注册历史（10年以上）
  RECENTLY_REGISTERED = 'recent-reg', // 最近注册（3个月内）
  EXPIRING_SOON = 'expiring-soon',    // 即将到期（30天内）
  RECENTLY_RENEWED = 'recent-renewal', // 最近续期（1个月内）
  
  // 特征相关标签
  NUMERIC_ONLY = 'numeric-only',      // 纯数字域名
  SHORT = 'short',                    // 短域名（4字符以下）
  PREMIUM = 'premium',                // 溢价域名
  
  // 区域相关标签
  COUNTRY_CODE = 'country-code',      // 国家代码域名
  INTERNATIONAL = 'international',    // 国际化域名
  
  // 状态相关标签
  WHOIS_PROTECTED = 'whois-protected', // WHOIS隐私保护
  CLIENTHOLDS = 'clienthold',         // 客户端保留状态
  CLIENTTRANSFERPROHIB = 'transfer-prohibited', // 禁止转移
  RESERVED = 'reserved'               // 保留域名
}

// 域名标签接口
export interface DomainTag {
  type: DomainTagType;    // 标签类型
  label: string;         // 显示文本
  description: string;   // 描述信息
  class: string;         // CSS类名
  priority: number;      // 优先级（用于排序）
}

// WHOIS查询结果接口
export interface WhoisResult {
  domainName: string;
  isAvailable?: boolean;
  premium?: boolean;
  reserved?: boolean;
  price?: number;
  period?: number;
  rawText?: string;
  parseSuccess?: boolean;
  error?: string;
  statusCode?: number;
  tld?: string;
  tags?: Array<DomainTag>;
  formatted?: WhoisFormatted;
}

// WHOIS格式化结果
export interface WhoisFormatted {
  key?: string;
  domain?: {
    name_servers?: string[];
    status?: string[];
    domain?: string;
    id?: string;
    whois_server?: string;
    updated_date?: string;
    updated_date_utc?: string;
    created_date?: string;
    created_date_utc?: string;
    expired_date?: string;
    expired_date_utc?: string;
    dnssec?: boolean;
  };
  registrar?: {
    key?: string;
    referral_url?: string;
    registrar_name?: string;
    registrar_ianaid?: string;
  };
  registrant?: ContactInfo;
  administrative?: ContactInfo;
  technical?: ContactInfo;
  billing?: ContactInfo;
}

// 联系人信息
export interface ContactInfo {
  key?: string;
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
} 