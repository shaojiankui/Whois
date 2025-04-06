import { loadTldList } from './tld';
import { TldExtract } from './tldextract';
import { DomainInfo } from '../../types/domain';

/**
 * 域名检查结果
 */
export interface DomainCheckResult {
  domain: string;         // 原始域名
  isValid: boolean;       // 域名格式是否有效
  normalizedDomain?: string; // 标准化后的域名
  tld?: string;           // TLD部分
  sld?: string;           // SLD部分（二级域名）
  message?: string;       // 错误或提示消息
  domainInfo?: DomainInfo; // 完整域名信息
}

/**
 * 对域名进行高级标准化处理
 * @param domain 原始域名输入（可能包含协议、路径等）
 * @returns 标准化后的域名
 */
export function normalizeDomain(domain: string): string {
  // 只移除协议前缀 http:// 或 https://，保留www
  let normalized = domain.replace(/^(https?:\/\/)/i, '');
  
  // 移除URL中的路径、查询参数和锚点
  normalized = normalized.split('/')[0];
  normalized = normalized.split('?')[0];
  normalized = normalized.split('#')[0];
  
  // 移除端口号（如果有）
  normalized = normalized.split(':')[0];
  
  // 转换为小写并去除首尾空格
  return normalized.trim().toLowerCase();
}

/**
 * 验证域名格式并进行标准化
 */
export async function validateAndNormalizeDomain(domain: string): Promise<DomainCheckResult> {
  // 初始化结果
  const result: DomainCheckResult = {
    domain,
    isValid: false
  };
  
  // 基本格式检查
  if (!domain || typeof domain !== 'string') {
    result.message = 'Domain is required';
    return result;
  }
  
  // 移除空格和转换为小写
  const normalizedDomain = normalizeDomain(domain);
  
  // 验证域名基本格式
  // 域名可以包含字母、数字、连字符，长度在3-255之间
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(normalizedDomain)) {
    result.message = 'Invalid domain format';
    return result;
  }
  
  // 使用TldExtract提取域名信息
  const domainInfo = await TldExtract.parse(normalizedDomain);
  
  // 域名至少需要有两个部分（SLD.TLD）
  if (!domainInfo.suffix || !domainInfo.prefix) {
    result.message = 'Domain must have at least a second-level domain and a TLD';
    return result;
  }
  
  // 提取TLD
  const tld = domainInfo.suffix;
  
  // 验证TLD是否存在（此处可以连接实际的TLD列表）
  const tldList = await loadTldList();
  const validTlds = tldList.map(t => t.tld.toLowerCase());
  
  if (!validTlds.includes(tld)) {
    result.message = `Invalid or unsupported TLD: .${tld}`;
    result.isValid = false;
    result.normalizedDomain = normalizedDomain;
    result.tld = tld;
    result.sld = domainInfo.prefix;
    result.domainInfo = domainInfo;
    return result;
  }
  
  // 域名有效
  result.isValid = true;
  result.normalizedDomain = normalizedDomain;
  result.tld = tld;
  result.sld = domainInfo.prefix;
  result.domainInfo = domainInfo;
  
  return result;
}

/**
 * 拆分域名为组件部分
 */
export async function parseDomainComponents(domain: string): Promise<{
  tld: string;
  sld: string;
  subdomain: string;
  domain: string;
} | null> {
  const validation = await validateAndNormalizeDomain(domain);
  
  if (!validation.isValid || !validation.normalizedDomain) {
    return null;
  }
  
  const domainInfo = validation.domainInfo || await TldExtract.parse(validation.normalizedDomain);
  
  return {
    tld: domainInfo.suffix || '',
    sld: domainInfo.prefix || '',
    subdomain: domainInfo.subdomain || '',
    domain: validation.normalizedDomain
  };
}

/**
 * 判断是否是有效的域名格式
 */
export async function isValidDomain(domain: string): Promise<boolean> {
  return (await validateAndNormalizeDomain(domain)).isValid;
}

/**
 * 获取域名的根域（不包括子域名）
 */
export async function getRootDomain(domain: string): Promise<string | null> {
  const components = await parseDomainComponents(domain);
  
  if (!components) {
    return null;
  }
  
  return `${components.sld}.${components.tld}`;
}

/**
 * 生成随机域名（用于测试）
 */
export async function generateRandomDomain(): Promise<string> {
  const tldList = await loadTldList();
  const tld = tldList[Math.floor(Math.random() * tldList.length)].tld;
  
  // 生成随机的SLD
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let sld = '';
  const length = Math.floor(Math.random() * 10) + 5; // 5-15个字符
  
  for (let i = 0; i < length; i++) {
    sld += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return `${sld}.${tld}`;
} 