/**
 * 配置加载器
 * 用于加载WHOIS解析器所需的配置
 */

/**
 * 配置缓存，避免重复加载
 * 使用Map以获得更好的性能
 */
const configCache = new Map<string, any>();

/**
 * 加载配置
 * @param configName 配置名称
 * @param defaultValue 默认值，当配置不存在时返回
 * @returns 配置内容
 */
export function loadJsonConfig<T = any>(configName: string, defaultValue: T): T {
  // 规范化配置名称
  const normalizedConfigName = configName.replace(/\\/g, '/');
  
  // 检查缓存
  if (configCache.has(normalizedConfigName)) {
    return configCache.get(normalizedConfigName);
  }

  // 使用内置默认配置
  const config = getDefaultConfig(normalizedConfigName) || defaultValue;
  
  // 缓存配置
  configCache.set(normalizedConfigName, config);
  return config;
}

/**
 * 获取默认配置
 * @param configName 配置名称
 * @returns 默认配置内容
 */
function getDefaultConfig(configName: string): any {
  // 为常用配置提供默认内容
  switch (configName) {
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
          { "value": "expiry date" },
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
 * 保存配置只更新内存缓存
 * @param configName 配置名称
 * @param data 配置内容
 * @returns 是否成功更新缓存
 */
export function saveJsonConfig(configName: string, data: any): boolean {
  try {
    // 规范化配置名称
    const normalizedConfigName = configName.replace(/\\/g, '/');
    
    // 更新内存缓存
    configCache.set(normalizedConfigName, data);
    console.log(`配置 ${normalizedConfigName} 已更新到内存缓存`);
    return true;
  } catch (error) {
    console.error(`更新配置缓存 ${configName} 时出错:`, error);
    return false;
  }
}

/**
 * 清除配置缓存
 * @param configName 可选的特定配置名称，如不提供则清除所有缓存
 */
export function clearConfigCache(configName?: string): void {
  if (configName) {
    const normalizedConfigName = configName.replace(/\\/g, '/');
    configCache.delete(normalizedConfigName);
  } else {
    configCache.clear();
  }
}