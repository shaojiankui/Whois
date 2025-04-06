/**
 * 配置加载器
 * 用于加载WHOIS解析器所需的配置文件
 */

import fs from 'fs';
import path from 'path';

/**
 * 配置缓存，避免重复加载
 * 使用Map以获得更好的性能
 */
const configCache = new Map<string, any>();

/**
 * 配置文件基础路径
 */
const CONFIG_BASE_PATH = path.resolve(process.cwd(), 'server/utils/whois-adapters/configs');

/**
 * 确保配置目录存在
 * @returns 返回配置目录路径
 */
function ensureConfigDirExists(): string {
  if (!fs.existsSync(CONFIG_BASE_PATH)) {
    try {
      fs.mkdirSync(CONFIG_BASE_PATH, { recursive: true });
    } catch (error) {
      console.error(`无法创建配置目录 ${CONFIG_BASE_PATH}:`, error);
    }
  }
  return CONFIG_BASE_PATH;
}

/**
 * 加载JSON配置文件
 * @param filename 配置文件名
 * @param defaultValue 默认值，当文件不存在时返回
 * @returns 配置内容
 */
export function loadJsonConfig<T = any>(filename: string, defaultValue: T): T {
  // 规范化文件名
  const normalizedFilename = filename.replace(/\\/g, '/');
  
  // 检查缓存
  if (configCache.has(normalizedFilename)) {
    return configCache.get(normalizedFilename);
  }

  const configDir = ensureConfigDirExists();
  const filePath = path.join(configDir, normalizedFilename);
  
  // 如果文件不存在，尝试创建带有默认值的文件
  if (!fs.existsSync(filePath)) {
    try {
      const defaultConfig = getDefaultConfig(normalizedFilename) || defaultValue;
      fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      configCache.set(normalizedFilename, defaultConfig);
      return defaultConfig;
    } catch (error) {
      console.warn(`无法创建配置文件 ${normalizedFilename}:`, error);
      return defaultValue;
    }
  }
  
  // 读取并解析文件
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      const config = JSON.parse(content);
      configCache.set(normalizedFilename, config);
      return config;
    } catch (parseError) {
      console.error(`解析配置文件 ${normalizedFilename} 时出错:`, parseError);
      // 解析失败时返回默认值
      return defaultValue;
    }
  } catch (readError) {
    console.error(`读取配置文件 ${normalizedFilename} 时出错:`, readError);
    return defaultValue;
  }
}

/**
 * 获取默认配置
 * @param filename 配置文件名
 * @returns 默认配置内容
 */
function getDefaultConfig(filename: string): any {
  // 为常用配置文件提供默认内容
  switch (filename) {
    case 'whois-parser-keys.json':
      return {
        "domain_id": [
          { "value": "domain id" },
          { "value": "registry domain id" }
        ],
        "domain_name": [
          { "value": "domain name" },
          { "value": "domain" }
        ],
        "domain_status": [
          { "value": "domain status" },
          { "value": "status" }
        ],
        "domain_dnssec": [
          { "value": "dnssec" }
        ],
        "whois_server": [
          { "value": "whois server" },
          { "value": "registrar whois server" }
        ],
        "name_servers": [
          { "value": "name server" },
          { "value": "nserver" },
          { "value": "nameserver" }
        ],
        "created_date": [
          { "value": "creation date" },
          { "value": "created on" },
          { "value": "created" },
          { "value": "registration date" }
        ],
        "updated_date": [
          { "value": "last update" },
          { "value": "updated date" },
          { "value": "updated on" },
          { "value": "last modified" },
          { "value": "changed" }
        ],
        "expired_date": [
          { "value": "expiration date" },
          { "value": "expire date" },
          { "value": "renewal date" },
          { "value": "expires on" },
          { "value": "registry expiry date" }
        ],
        "registrar_name": [
          { "value": "registrar" },
          { "value": "sponsoring registrar" }
        ],
        "registrar_url": [
          { "value": "registrar url" },
          { "value": "registrar website" }
        ],
        "registrar_iana_id": [
          { "value": "registrar iana id" }
        ],
        "registrar_abuse_contact_email": [
          { "value": "registrar abuse contact email" }
        ],
        "registrar_abuse_contact_phone": [
          { "value": "registrar abuse contact phone" }
        ]
      };
    case 'unsupported-tlds.json':
      return [];
    case 'protected-words.json':
      return [
        "REDACTED FOR PRIVACY",
        "GDPR masked",
        "is not disclosed",
        "Privacy Protection",
        "REDACTED",
        "DATA REDACTED",
        "PRIVACY",
        "Contact Privacy Inc",
        "Protected by",
        "Whois Privacy",
        "Information not available",
        "private",
        "TO BE DISCLOSED",
        "Not disclosed",
        "Registration information",
        "Contact data has been withdrawn",
        "Personal data not displayed"
      ];
    default:
      return null;
  }
}

/**
 * 保存JSON配置文件
 * @param filename 配置文件名
 * @param data 配置内容
 * @returns 是否成功保存
 */
export function saveJsonConfig(filename: string, data: any): boolean {
  // 规范化文件名
  const normalizedFilename = filename.replace(/\\/g, '/');
  
  const configDir = ensureConfigDirExists();
  const filePath = path.join(configDir, normalizedFilename);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    configCache.set(normalizedFilename, data); // 更新缓存
    return true;
  } catch (error) {
    console.error(`保存配置文件 ${normalizedFilename} 时出错:`, error);
    return false;
  }
}

/**
 * 清除配置缓存
 * @param filename 可选的特定文件名，如不提供则清除所有缓存
 */
export function clearConfigCache(filename?: string): void {
  if (filename) {
    const normalizedFilename = filename.replace(/\\/g, '/');
    configCache.delete(normalizedFilename);
  } else {
    configCache.clear();
  }
} 