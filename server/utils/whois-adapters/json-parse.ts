import { WhoisParseHandler } from './index';
import { WhoisResult, DomainTag } from '~/types/domain';
import  {formatDateToUTC} from './date-formatter';
// 定义联系人接口
interface ContactInfo {
  key?: string;
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

// 注册商接口
interface RegistrarInfo extends ContactInfo {
  url?: string;
  iana_id?: string;
  abuse_email?: string;
  abuse_phone?: string;
  referral_url?: string;
  registrar_name?: string;
  registrar_ianaid?: string;
}

// 域名信息接口
interface DomainInfo {
  domain?: string;
  name_servers: string[];
  status: string[];
  created_date?: string;
  created_date_utc?: string;
  updated_date?: string;
  updated_date_utc?: string;
  expired_date?: string;
  expired_date_utc?: string;
  transfer_date?: string;
  transfer_date_utc?: string;
  id?: string;
  dnssec?: boolean;
  [key: string]: any;
}

// 格式化结果接口
interface FormattedResult {
  key?: string;
  domain: DomainInfo;
  registrar: RegistrarInfo;
  registrant: ContactInfo;
  administrative: ContactInfo;
  technical: ContactInfo;
  billing: ContactInfo;
  [key: string]: any;
}

/**
 * JSON WHOIS解析处理器
 * 专门用于解析RDAP JSON响应
 */
export class JsonWhoisParseHandler implements WhoisParseHandler {
  /**
   * 解析RDAP JSON响应
   * @param domain 查询的域名
   * @param text RDAP JSON响应文本
   * @param config 解析配置
   * @returns 结构化的WHOIS结果
   */
  parse(domain: string, text: string, config?: any): WhoisResult {
    const result: WhoisResult = {
      domainName: domain,
      isAvailable: false,
      rawText: text,
      parseSuccess: false,
      formatted: {
        key: "Whois解析",
        domain: {
          domain: domain,
          name_servers: [],
          status: []
        },
        registrar: {
          key: "注册商"
        },
        registrant: {
          key: "注册人"
        },
        administrative: {
          key: "管理员"
        },
        technical: {
          key: "技术支持"
        },
        billing: {
          key: "账单"
        }
      } as FormattedResult,
      statusCode: 1,
      tld: domain.split('.').pop()?.toLowerCase() || ''
    };

    try {
      // 解析JSON
      const data = JSON.parse(text);
      
      // 检查域名是否可注册
      if (data.status === 'not found' || 
          (typeof data.status === 'object' && data.status.includes('inactive')) || 
          data.errorCode === 404) {
        result.isAvailable = true;
        result.parseSuccess = true;
        return result;
      }

      // 检查是否为保留域名
      if (data.status && 
          (typeof data.status === 'string' && data.status.toLowerCase().includes('reserved')) || 
          (Array.isArray(data.status) && data.status.some((s: string) => s.toLowerCase().includes('reserved')))) {
        result.reserved = true;
      }

      // 解析详细信息
      if (data.ldhName) {
        result.domainName = data.ldhName;
        if (result.formatted?.domain) {
          result.formatted.domain.domain = data.ldhName;
        }
      }
      
      // 解析注册商
      if (data.entities) {
        const registrar = data.entities.find((e: any) => 
          e.roles && (e.roles.includes('registrar') || e.roles.includes('sponsor')));
        
        if (registrar && result.formatted?.registrar) {
          // 首先尝试从vCard获取信息
          let registrarName = '';
          let registrarUrl = '';
          let registrarEmail = '';
          let registrarPhone = '';
          
          if (registrar.vcardArray && registrar.vcardArray[1]) {
            for (const entry of registrar.vcardArray[1]) {
              if (entry[0] === 'fn') {
                registrarName = entry[3];
              } else if (entry[0] === 'url') {
                registrarUrl = entry[3];
              } else if (entry[0] === 'email') {
                registrarEmail = entry[3];
              } else if (entry[0] === 'tel') {
                registrarPhone = entry[3];
              }
            }
          }
          
          // 如果从vCard获取失败，尝试其他字段
          registrarName = registrarName || registrar.handle || 
                          registrar.publicIds?.[0]?.identifier || '';
          
          // 更新注册商信息
          if (registrarName) {
            result.formatted.registrar.name = registrarName;
          }
          
          if (registrarUrl) {
            result.formatted.registrar.url = registrarUrl;
          }
          
          if (registrarEmail) {
            result.formatted.registrar.abuse_email = registrarEmail;
          }
          
          if (registrarPhone) {
            result.formatted.registrar.abuse_phone = registrarPhone;
          }
          
          // 如果有IANA ID
          if (registrar.publicIds) {
            const ianaId = registrar.publicIds.find((id: any) => id.type === 'IANA Registrar ID');
            if (ianaId && ianaId.identifier) {
              result.formatted.registrar.iana_id = ianaId.identifier;
            }
          }
        }
      }
      
      // 解析nameservers
      if (data.nameservers) {
        const nameServers = data.nameservers.map((ns: any) => ns.ldhName || ns.hostName || '').filter(Boolean);
        if (nameServers.length > 0 && result.formatted?.domain) {
          result.formatted.domain.name_servers = nameServers;
        }
      }
      
      // 解析日期信息，并格式化日期
      const tld = result.tld;
      if (data.events) {
        // 创建日期
        const registration = data.events.find((e: any) => 
          e.eventAction === 'registration');
        if (registration && registration.eventDate && result.formatted?.domain) {
          const date = registration.eventDate || '';
          const formattedDate = formatDateToUTC(date, tld);
          result.formatted.domain.created_date = date;
          result.formatted.domain.created_date_utc = formattedDate;
        }
        
        // 更新日期
        const lastChanged = data.events.find((e: any) => 
          e.eventAction === 'last changed' || 
          e.eventAction === 'lastChanged' || 
          e.eventAction === 'last update');
        if (lastChanged && lastChanged.eventDate && result.formatted?.domain) {
          const date = lastChanged.eventDate || '';
          const formattedDate = formatDateToUTC(date, tld);
          result.formatted.domain.updated_date = date;
          result.formatted.domain.updated_date_utc = formattedDate;
        }
        
        // 过期日期
        const expiration = data.events.find((e: any) => 
          e.eventAction === 'expiration' || 
          e.eventAction === 'expiry');
        if (expiration && expiration.eventDate && result.formatted?.domain) {
          const date = expiration.eventDate || '';
          const formattedDate = formatDateToUTC(date, tld);
          result.formatted.domain.expired_date = date;
          result.formatted.domain.expired_date_utc = formattedDate;
        }
        
        // 转移日期
        const transfer = data.events.find((e: any) => 
          e.eventAction === 'transfer');
        if (transfer && transfer.eventDate && result.formatted?.domain) {
          const date = transfer.eventDate || '';
          const formattedDate = formatDateToUTC(date, tld);
          result.formatted.domain.transfer_date = date;
          result.formatted.domain.transfer_date_utc = formattedDate;
        }
      }
      
      // 解析状态
      if (data.status) {
        const statuses = Array.isArray(data.status) ? data.status : [data.status];
        if (statuses && result.formatted?.domain) {
          // 清理状态文本，移除URL部分
          result.formatted.domain.status = statuses.map((status: string) => {
            if (status.includes('http')) {
              return status.split('http')[0].trim();
            }
            return status.replace(/_/g, ' ').trim();
          });
        }
      }
      
      // 解析联系人信息
      if (data.entities) {
        // 处理注册人
        this.processContact(data.entities, 'registrant', result);
        
        // 处理管理员
        this.processContact(data.entities, 'administrative', result);
        
        // 处理技术联系人
        this.processContact(data.entities, 'technical', result);
        
        // 处理账单联系人
        this.processContact(data.entities, 'billing', result);
      }
      
      // 提取域名ID
      if (data.handle && result.formatted?.domain) {
        result.formatted.domain.id = data.handle;
      }
      
      // 提取DNSSEC信息
      if (data.secureDNS && result.formatted?.domain) {
        result.formatted.domain.dnssec = data.secureDNS.delegationSigned === true;
      }
      
      // 处理通知和备注
      if (data.notices && result.formatted?.domain) {
        data.notices.forEach((notice: any, index: number) => {
          if (notice.title && notice.description) {
            const key = `notice_${index}`;
            result.formatted!.domain[key] = `${notice.title}: ${notice.description.join(' ')}`;
          }
        });
      }
      
      if (data.remarks && result.formatted?.domain) {
        data.remarks.forEach((remark: any, index: number) => {
          if (remark.title && remark.description) {
            const key = `remark_${index}`;
            result.formatted!.domain[key] = `${remark.title}: ${remark.description.join(' ')}`;
          }
        });
      }
      
      // 处理任何自定义字段
      if (data.customProperties && result.formatted?.domain) {
        for (const [key, value] of Object.entries(data.customProperties)) {
          result.formatted.domain[`custom_${key}`] = String(value);
        }
      }
      
      // 处理网络信息
      if (data.ipNetwork && result.formatted?.domain) {
        if (data.ipNetwork.startAddress) {
          result.formatted.domain.ip_range_start = data.ipNetwork.startAddress;
        }
        if (data.ipNetwork.endAddress) {
          result.formatted.domain.ip_range_end = data.ipNetwork.endAddress;
        }
        if (data.ipNetwork.name) {
          result.formatted.domain.network_name = data.ipNetwork.name;
        }
        if (data.ipNetwork.type) {
          result.formatted.domain.network_type = data.ipNetwork.type;
        }
        if (data.ipNetwork.cidr) {
          result.formatted.domain.cidr = data.ipNetwork.cidr;
        }
      }
      
      result.parseSuccess = true;
      return result;
    } catch (error: any) {
      result.error = `Failed to parse RDAP data: ${error.message}`;
      return result;
    }
  }
  
  /**
   * 处理联系人信息
   * @param entities 实体列表
   * @param contactType 联系人类型
   * @param result WHOIS结果
   */
  private processContact(entities: any[], contactType: string, result: WhoisResult): void {
    const roleMap: Record<string, string[]> = {
      'registrant': ['registrant'],
      'administrative': ['administrative', 'admin'],
      'technical': ['technical', 'tech'],
      'billing': ['billing', 'bill']
    };
    
    const roles = roleMap[contactType] || [];
    const contact = entities.find((e: any) => 
      e.roles && e.roles.some((r: string) => roles.includes(r.toLowerCase())));
    
    if (!contact || !result.formatted) return;
    
    const contactObj = result.formatted[contactType as keyof typeof result.formatted] as ContactInfo;
    if (!contactObj) return;
    
    // 从vCard提取信息
    if (contact.vcardArray && contact.vcardArray[1]) {
      const vcard = contact.vcardArray[1];
      let address: string[] = [];
      
      for (const entry of vcard) {
        if (entry[0] === 'fn') {
          contactObj.name = entry[3];
        } else if (entry[0] === 'org') {
          contactObj.organization = entry[3];
        } else if (entry[0] === 'email') {
          contactObj.email = entry[3];
        } else if (entry[0] === 'tel') {
          contactObj.phone = entry[3];
        } else if (entry[0] === 'adr') {
          // vCard地址格式: [后缀框, 扩展地址, 街道地址, 城市, 省/州, 邮编, 国家]
          if (Array.isArray(entry[3])) {
            address = entry[3].filter(Boolean);
          }
        }
      }
      
      // 构建完整地址
      if (address.length > 0) {
        contactObj.address = address.join(', ');
      }
    }
    
    // 尝试从其他字段获取信息
    if (!contactObj.name && contact.handle) {
      contactObj.name = contact.handle;
    }
    
    // 处理公共ID
    if (contact.publicIds) {
      for (const id of contact.publicIds) {
        if (id.type && id.identifier) {
          contactObj[`id_${id.type.toLowerCase().replace(/\s+/g, '_')}`] = id.identifier;
        }
      }
    }
    
    // 处理自定义属性
    if (contact.customProperties) {
      for (const [key, value] of Object.entries(contact.customProperties)) {
        contactObj[`custom_${key}`] = String(value);
      }
    }
  }
}

// 导出默认实例
export default new JsonWhoisParseHandler(); 