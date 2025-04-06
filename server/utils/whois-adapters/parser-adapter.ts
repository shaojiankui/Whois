/**
 * 新WHOIS解析器适配器
 * 将新的解析器系统与现有适配器系统集成
 */

import { WhoisResult, WhoisFormatted } from '~/types/domain';
import { WhoisParseHandler } from './index';
import { loadJsonConfig } from './config-loader';

// 域名相关信息接口
interface DomainInfo {
  name_servers: string[];
  status: string[];
  domain?: string;
  id?: string;
  whois_server?: string;
  updated_date?: string;
  updated_date_utc?: string;
  created_date?: string;
  created_date_utc?: string;
  expired_date?: string;
  expired_date_utc?: string;
  transfer_date?: string;
  transfer_date_utc?: string;
  dnssec?: boolean;
}

/**
 * WHOIS解析器适配器
 * 作为现有WhoisParseHandler接口与新解析器之间的桥梁
 */
export class ParserWhoisAdapter implements WhoisParseHandler {
  private debug: boolean = false;
  private language: string = 'en';
  
  // 从配置文件加载解析器键值对
  private parserKeys = loadJsonConfig('whois-parser-keys.json', {});
  private protectedWords = loadJsonConfig('protected-words.json', [
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
  ]);
  
  // 格式映射（js格式到PHP格式）
  private FORMAT_MAPPING: Record<string, string> = {
    "YYYY-MM-DD HH:mm:ss": "Y-m-d H:i:s",
    "YYYY/MM/DD HH:mm:ss": "Y/m/d H:i:s",
    "YYYYMMDD HH:mm:ss": "Ymd H:i:s",
    "YYYY-MM-DD": "Y-m-d",
    "YYYY/MM/DD": "Y/m/d",
    "ddd MMM DD YYYY": "D M d Y",
    "DD.MM.YYYY HH:mm:ss": "d.m.Y H:i:s",
    "DD-MMM-YYYY": "d-M-Y",
    "D.M.YYYY HH:mm:ss": "j.n.Y H:i:s",
    "D/M/YYYY HH:mm:ss": "j/n/Y H:i:s",
    "MM/DD/YYYY": "n/j/Y",
    "DD.MM.YYYY": "d.m.Y",
    "YYYY-MMM-DD HH:mm:ss": "Y-M-d H:i:s",
    "DD-MM-YYYY": "d-m-Y",
    "MMMM D YYYY": "F j Y",
    "ddd MMM DD HH:mm:ss YYYY": "D M d H:i:s Y",
    "DD MMM YYYY": "d M Y",
    "DD-MMM-YYYY HH:mm:ss": "d-M-Y H:i:s",
    "DD-MM-YYYY HH:mm:ss GMT%z": "d-m-Y H:i:s \G\M\T P",
    "MMM DD, YYYY": "M d, Y",
    "yyyy-mm-dd hh:mm:ss": "Y-m-d h:i:s"
  };

  /**
   * 解析WHOIS数据
   * @param domain 域名
   * @param text WHOIS原始数据
   * @param config 配置参数
   * @returns 解析结果
   */
  parse(domain: string, text: string, config?: any): WhoisResult {
    // 设置配置选项
    if (config) {
      this.debug = config.debug === true;
      this.language = config.lang || 'en';
    }

    try {
      // 提取TLD
      const tld = this.extractTld(domain);
      
      // 判断是否可注册域名
      const isAvailable = this.isExtNotFoundDomain(text);
      
      // 判断是否为保留域名
      const isReserved = this.isReservedDomain(text);

      // 如果域名可注册或者被保留，返回简化结果
      if (isAvailable) {
        return {
          domainName: domain,
          isAvailable: true,
          rawText: text,
          parseSuccess: true,
          statusCode: 0,
          tld
        };
      }
      
      if (isReserved) {
        return {
          domainName: domain,
          isAvailable: false,
          reserved: true,
          rawText: text,
          parseSuccess: true,
          statusCode: 0,
          tld
        };
      }
      
      // 预处理WHOIS数据
      const processedText = this.prehandleWhoisData(tld, text);
      
      // 解析WHOIS数据
      const formatted = this.parseRawWhois(processedText, tld);

      return {
        domainName: domain,
        isAvailable: false,
        rawText: text,
        parseSuccess: true,
        formatted,
        statusCode: 0,
        tld
      };
    } catch (error: any) {
      // 发生错误时，返回基本的错误结果
      return {
        domainName: domain,
        isAvailable: false,
        rawText: text,
        parseSuccess: false,
        error: `Parser error: ${error.message}`,
        formatted: this.createEmptyFormatted(domain),
        statusCode: 1
      };
    }
  }

  /**
   * 提取域名的TLD部分
   * @param domain 域名
   * @returns TLD
   */
  private extractTld(domain: string): string {
    const parts = domain.split('.');
    if (parts.length < 2) return '';
    return parts.slice(1).join('.');
  }

  /**
   * 预处理WHOIS数据
   * @param tld TLD
   * @param rawData 原始WHOIS数据
   * @returns 预处理后的数据
   */
  private prehandleWhoisData(tld: string, rawData: string): string {
    // 方法名格式: prehandle_tld_whois
    const methodName = `prehandle_${tld.replace('.', '_')}_whois`;
    
    // 检查是否存在特定TLD的预处理方法
    if (typeof (this as any)[methodName] === 'function') {
      try {
        return (this as any)[methodName](rawData);
      } catch (e) {
        // 失败时使用原始数据
        console.error(`Error in ${methodName}:`, e);
      }
    }
    
    return rawData;
  }

  /**
   * 解析原始WHOIS数据
   * @param rawData 原始WHOIS数据
   * @param tld TLD
   * @returns 格式化结果
   */
  private parseRawWhois(rawData: string, tld: string): WhoisFormatted {
    // 初始化结果对象
    const whoisInfo: WhoisFormatted = { key: 'Whois解析' };
    const domain: DomainInfo = { name_servers: [], status: [] };
    const registrar: Record<string, any> = { key: '注册商' };
    const registrant: Record<string, any> = { key: '注册人' };
    const administrative: Record<string, any> = { key: '管理员' };
    const technical: Record<string, any> = { key: '技术支持' };
    const billing: Record<string, any> = { key: '账单' };

    if (!rawData) {
      return this.createEmptyFormatted('');
    }

    // 按行解析WHOIS数据
    const whoisLines = rawData.split('\n');

    for (const line of whoisLines) {
      const trimmedLine = line.trim();

      // 跳过太短或不含冒号的行
      if (trimmedLine.length < 5 || !trimmedLine.includes(':')) {
        continue;
      }

      // 跳过以冒号结尾的行
      if (trimmedLine[trimmedLine.length - 1] === ':') {
        continue;
      }

      // 分割键值对
      const [name, ...valueParts] = trimmedLine.split(':');
      const trimmedName = this.clearKeyName(name.trim());
      const value = valueParts.join(':').trim().replace(/&nbsp;/g, '');
      const keyName = this.searchKeyName(trimmedName);

      // 跳过无效行
      if (this.invalidLine(keyName, value)) {
        continue;
      }

      // 处理域名相关信息
      if (keyName === 'domain_id') {
        domain.id = value;
      } else if (keyName === 'domain_name') {
        domain.domain = value.toLowerCase();
      } else if (keyName === 'domain_status') {
        const status = [...domain.status];
        status.push(...value.split(','));
        domain.status = status;
      } else if (keyName === 'domain_dnssec') {
        domain.dnssec = this.isDNSSecEnabled(value);
      } else if (keyName === 'whois_server') {
        domain.whois_server = value;
      } else if (keyName === 'name_servers') {
        const nameServers = [...domain.name_servers];
        if (value.includes(',')) {
          nameServers.push(...value.split(',').map(server => server.trim()));
        } else {
          nameServers.push(value.trim());
        }
        domain.name_servers = nameServers;
      } else if (keyName === 'created_date') {
        domain.created_date = value.trim();
        domain.created_date_utc = this.parseDateString(value, tld);
      } else if (keyName === 'updated_date') {
        domain.updated_date = value.trim();
        domain.updated_date_utc = this.parseDateString(value, tld);
      } else if (keyName === 'expired_date') {
        domain.expired_date = value.trim();
        domain.expired_date_utc = this.parseDateString(value, tld);
      } else if (keyName === 'transfer_date') {
        domain.transfer_date = value.trim();
        domain.transfer_date_utc = this.parseDateString(value, tld);
      } else if (keyName === 'referral_url') {
        registrar.referral_url = value;
      } else {
        // 处理其他字段
        const nameParts = trimmedName.split(' ', 2);
        const guessKey = nameParts[0];

        // 检查键名分组
        const keyNameParts = keyName.split('_', 2);
        const keyNameGroup = keyNameParts[0];

        if (keyNameGroup === 'registrant' && keyNameParts.length > 1) {
          registrant[keyName] = value;
        }

        if (keyNameGroup === 'registrar' && keyNameParts.length > 1) {
          registrar[keyName] = value;
        }

        // 根据猜测的组处理联系人信息
        if (guessKey === 'holder') {
          const item = this.parseContact(trimmedName, value);
          registrant[item.key] = item.value;
        } else if (guessKey === 'admin' || guessKey === 'administrative') {
          const item = this.parseContact(trimmedName, value);
          administrative[item.key] = item.value;
        } else if (guessKey === 'tech' || guessKey === 'technical') {
          const item = this.parseContact(trimmedName, value);
          technical[item.key] = item.value;
        } else if (guessKey === 'bill' || guessKey === 'billing') {
          const item = this.parseContact(trimmedName, value);
          billing[item.key] = item.value;
        }
      }
    }

    // 清理和标准化数据
    domain.name_servers = this.fixNameServers(domain.name_servers);
    domain.status = this.fixDomainStatus(domain.status);

    // 组装结果对象
    whoisInfo.domain = domain;
    whoisInfo.registrar = registrar;
    whoisInfo.registrant = registrant;
    whoisInfo.administrative = administrative;
    whoisInfo.technical = technical;
    whoisInfo.billing = billing;

    return whoisInfo;
  }

  /**
   * 检查键名对应的值
   * @param key 键名
   * @returns 对应的标准键名
   */
  private searchKeyName(key: string): string {
    key = this.clearKeyName(key);

    // 从配置文件加载的解析器键值对
    if (!this.parserKeys || Object.keys(this.parserKeys).length === 0) {
      this.parserKeys = loadJsonConfig('whois-parser-keys.json', {});
    }

    // 遍历所有键名检查匹配
    for (const [keyName, keyValues] of Object.entries(this.parserKeys)) {
      // 1. 检查键名是否包含在key中
      if (key.includes(keyName)) {
        return keyName;
      }
      
      // 2. 检查key是否匹配任何别名
      if (Array.isArray(keyValues)) {
        for (const keyValue of keyValues) {
          const value = keyValue.value?.toString().toLowerCase();
          if (value && key === value) {
            return keyName;
          }
        }
      }
    }

    return '';
  }

  /**
   * 清理键名
   * @param key 原始键名
   * @returns 清理后的键名
   */
  private clearKeyName(key: string): string {
    // 移除括号部分
    if (key.includes('(')) {
      key = key.substring(0, key.indexOf('('));
    }

    // 替换特殊字符为空格
    key = key.replace(/-/g, ' ')
             .replace(/_/g, ' ')
             .replace(/\//g, ' ')
             .replace(/\\/g, ' ')
             .replace(/'/g, ' ')
             .replace(/\./g, ' ');
    
    // 多个空格替换为一个
    key = key.replace(/\s+/g, ' ');

    // 移除特定前缀
    key = key.replace('Registry ', ' ')
             .replace('Sponsoring ', ' ');
    
    // 去除首尾空格并转为小写
    return key.trim().toLowerCase();
  }

  /**
   * 清理值
   * @param key 原始值
   * @returns 清理后的值
   */
  private clearValueName(value: string): string {
    // 移除特定字符串
    value = value.replace('CLST', '')
                 .replace('Connected', '')
                 .replace('(GMT+0:00)', '')
                 .replace('(', '')
                 .replace(')', '');

    // 去除首尾空格并转为小写
    return value.trim().toLowerCase();
  }

  /**
   * 解析联系人信息
   * @param name 字段名
   * @param value 字段值
   * @returns 解析结果
   */
  private parseContact(name: string, value: string): { key: string, value: string } {
    // 去除空格
    name = name.replace(/ /g, '');
    value = value.trim();

    // 特殊字段处理
    if (name === 'emailaddress') {
      name = 'email';
    } else if (name === 'name') {
      name = 'organization';
    }

    return { key: name, value };
  }

  /**
   * 检查是否为域名未找到的情况
   * @param rawData 原始WHOIS数据
   * @returns 是否未找到
   */
  private isExtNotFoundDomain(rawData: string): boolean {
    const availabilityPatterns = [
      'No match for',
      'Status: AVAILABLE',
      'not found',
      'no match',
      'No entries found',
      'no data found',
      'not registered',
      'Domain not found',
      'domain does not exist',
      'domain doesn\'t exist',
      'The queried object does not exist',
      'is available',
      'is free',
      'No Object Found',
      'Domain name not known',
      'Status: free',
      'Status: available',
      'The domain you requested is not registered'
    ];

    const lowercased = rawData.toLowerCase();
    for (const pattern of availabilityPatterns) {
      if (lowercased.includes(pattern.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查是否为保留域名
   * @param rawData 原始WHOIS数据
   * @returns 是否为保留域名
   */
  private isReservedDomain(rawData: string): boolean {
    const reservedKeywords = [
      "Reserved Domain Name",
      "ICANN Reserved Name",
      "This name is reserved by the Registry",
      "has been reserved by aeDA Regulator",
      "Reserved:",
      "It has been reserved",
      "This domain name has been reserved for policy reasons",
      "This name is registry reserved",
      "Reserved by Registry Operator",
      "Domain name is invalid",
      "This name is not available for registration",
      "the Domain Name you apply can not be registered online",
      "Registry Reserved",
      "This domain has been reserved by the registry",
      "status: Blocked",
      "This is an ICANN reserved name",
      "Status: RESERVED",
      "Reserved Name and is not available",
      "Prohibited String - Object Cannot Be Registered",
      "domaintype: RESERVED",
      "This name is invalid and can not be registered",
      "Prohibited String"
    ];

    const lowercased = rawData.toLowerCase();
    for (const keyword of reservedKeywords) {
      if (lowercased.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查是否启用DNSSEC
   * @param value DNSSEC值
   * @returns 是否启用
   */
  private isDNSSecEnabled(value: string): boolean {
    value = this.clearValueName(value);
    return (value === 'signeddelegations' || value === 'signed');
  }

  /**
   * 解析日期字符串为UTC格式
   * @param value 日期字符串
   * @param tld TLD
   * @returns UTC格式日期
   */
  private parseDateString(value: string, tld: string): string {
    // 使用现有的日期格式化工具
    value = value.trim();
    value = value.replace(' CLST', '');
    
    try {
      // 使用formatDate函数进行格式化（异步但我们在同步环境中使用）
      // 实际场景下应该改为异步方法，但为了与PHP代码结构保持一致，这里简化处理
      // 直接返回简单的ISO格式化日期
      if (value) {
        // 使用原生Date对象处理常见日期格式
        const date = new Date(value);
        if (date.toString() !== 'Invalid Date') {
          return date.toISOString();
        }
        
        // 处理特殊格式的日期
        if (value.includes('.') && !value.includes('-') && !value.includes('/')) {
          // 欧洲格式的日期（日.月.年）
          const parts = value.split('.');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            const newDate = new Date(year, month, day);
            if (newDate.toString() !== 'Invalid Date') {
              return newDate.toISOString();
            }
          }
        }
      }
    } catch (error) {
      // 处理解析错误
      console.error(`Error parsing date: ${value}`, error);
    }
    
    // 返回原始值，实际应用中应改为异步调用formatDate
    return value;
  }

  /**
   * 标准化nameservers列表
   * @param nameServers 原始列表
   * @returns 标准化列表
   */
  private fixNameServers(nameServers: string[]): string[] {
    const fixedNameServers: string[] = [];

    for (const nameServer of nameServers) {
      fixedNameServers.push(nameServer.toLowerCase().trim());
    }

    return fixedNameServers;
  }

  /**
   * 标准化域名状态列表
   * @param status 原始状态列表
   * @returns 标准化状态列表
   */
  private fixDomainStatus(status: string[]): string[] {
    const fixedStatus: string[] = [];

    for (const state of status) {
      // 分割并保留主要状态部分
      const parts = state.split('http')[0];
      const formattedState = this.capitalizeWords(parts);
      
      // 去除空格
      const cleanState = formattedState.replace(/ /g, '');
      
      // 首字母小写
      const finalState = cleanState.charAt(0).toLowerCase() + cleanState.slice(1);
      
      fixedStatus.push(finalState.trim());
    }

    return fixedStatus;
  }

  /**
   * 转换字符串每个单词的首字母为大写
   * @param str 原始字符串
   * @returns 转换后的字符串
   */
  private capitalizeWords(str: string): string {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  /**
   * 检查行是否无效
   * @param keyName 键名
   * @param value 值
   * @returns 是否无效
   */
  private invalidLine(keyName: string, value: string): boolean {
    // 空值无效
    if (value === '') {
      return true;
    }

    // 加载保护词列表（如果尚未加载）
    if (!this.protectedWords || !Array.isArray(this.protectedWords) || this.protectedWords.length === 0) {
      this.protectedWords = loadJsonConfig('protected-words.json', [
        "REDACTED FOR PRIVACY", 
        "GDPR masked", 
        "is not disclosed",
        "Privacy Protection"
      ]);
    }

    // 包含保护词的值无效
    for (const word of this.protectedWords) {
      if (typeof word === 'string' && value.toLowerCase().includes(word.toLowerCase())) {
        return true;
      }
    }

    // 邮箱字段但不包含@的值无效
    if (keyName.includes('email') && !value.includes('@')) {
      return true;
    }

    // 包含特定提示的值无效
    if (value.includes('Please query the RDDS service of the Registrar')) {
      return true;
    }

    return false;
  }

  /**
   * 创建空的WhoisFormatted对象
   * @param domain 域名
   * @returns 空的格式化对象
   */
  private createEmptyFormatted(domain: string): WhoisFormatted {
    return {
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
    };
  }

  // TLD特定预处理方法
  // 实际实现应包含所有需要的TLD特定处理方法
  // 格式: prehandle_tld_whois
  
  private prehandle_it_whois(whoisData: string): string {
    const sections: Record<string, string> = {
      "Registrant": "Registrant",
      "Admin Contact": "Admin",
      "Technical Contacts": "Technical",
      "Registrar": "Registrar",
      "Nameservers": "Nameservers:"
    };
    return this.prehandleWhoisSection(whoisData, sections);
  }
  
  private prehandle_am_whois(whoisData: string): string {
    const lines = whoisData.split('\n');
    const group_names: Record<string, string> = {
      'Registrant:': 'Registrant:',
      'Administrative contact:': 'Admin:',
      'Technical contact:': 'Technical:',
      'DNS servers:': 'DNS servers:',
    };

    let current_group = '';
    let count = -1;
    const result: string[] = [];

    for (const line of lines) {
      const trimmed_line = line.trim();
      if (!trimmed_line) {
        current_group = '';
        result.push('\n');
      }
      
      if (group_names[trimmed_line]) {
        current_group = group_names[trimmed_line];
        count = -1;
        result.push(current_group);
      } else if (trimmed_line && current_group) {
        count++;
        if (current_group !== 'DNS servers:') {
          if (count === 0) {
            result.push('Name:' + trimmed_line);
          }
          if (count === 1) {
            result.push('Address:' + trimmed_line);
          }
          if (count === 2) {
            result.push('State:' + trimmed_line);
          }
          if (count === 3) {
            result.push('Country:' + trimmed_line);
          }
          if (count === 4) {
            result.push('Email:' + trimmed_line);
          }
          if (count === 5) {
            result.push('Phone:' + trimmed_line);
          }
        } else {
          result.push(trimmed_line);
        }
      } else if (!current_group) {
        result.push(trimmed_line);
      }
    }
    
    const sections: Record<string, string> = {
      'DNS servers:': 'Name servers:',
      'Admin:': 'Admin',
      'Technical:': 'Technical',
      'Registrant:': 'Registrant',
    };
    
    return this.prehandleWhoisSection(result.join('\n'), sections, true);
  }
  
  private prehandle_uk_whois(whoisData: string): string {
    const sections: Record<string, string> = {
      "Registrant:": "Registrant:",
      "Registrar:": "Registrar:",
      "Name servers": "Name Servers:",
    };
    return this.prehandleWhoisSection(whoisData, sections);
  }
  
  private prehandle_eu_whois(whoisData: string): string {
    const sections: Record<string, string> = {
      "Registrant:": "Registrant:",
      "Technical:": "Technical:",
      "Registrar:": "Registrar:",
      "Name servers:": "Name servers:"
    };
    return this.prehandleWhoisSection(whoisData, sections);
  }
  
  private prehandle_nl_whois(whoisData: string): string {
    const lines = whoisData.split('\n');
    const result: string[] = [];

    let inRegistrarSection = false;
    let lineAfterRegistrar = 0;

    for (const line of lines) {
      if (line.startsWith("Registrar:")) {
        inRegistrarSection = true;
        lineAfterRegistrar = 0;
        result.push(line); // 保留 "Registrar:" 行
        continue;
      }
      
      if (inRegistrarSection) {
        lineAfterRegistrar++;
        if (lineAfterRegistrar === 1 && line.trim() !== '') {
          result.push('Registrar name: ' + line);
        } else {
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }
    
    // 合并为单个字符串
    const resultString = result.join('\n');
    const sections: Record<string, string> = {
      "Domain nameservers:": "Nameservers:",
    };
    
    return this.prehandleWhoisSection(resultString, sections);
  }
  
  private prehandle_ar_whois(whoisData: string): string {
    // 按行处理字符串
    const lines = whoisData.split('\n');
    let part = 0;
    const result: string[] = [];

    for (const line of lines) {
      if (!line.trim()) {
        part++;
        result.push(line); // 保留空行分隔不同部分
        continue;
      }

      // 根据部分添加前缀
      if (part === 1) {
        result.push("domain " + line);
      } else if (part === 2) {
        result.push("registrant " + line);
      } else if (part === 3) {
        if (line.includes("created")) {
          result.push("nserver " + line);
        } else {
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }

    // 合并为单个字符串
    return result.join('\n');
  }
  
  private prehandle_sa_whois(whoisData: string): string {
    const sections: Record<string, string> = {
      "Name Servers:": "Nameservers:",
    };
    return this.prehandleWhoisSection(whoisData, sections);
  }
  
  private prehandleWhoisSection(whoisData: string, sections: Record<string, string>, prefix: boolean = false): string {
    const lines = whoisData.split('\n');
    const result: string[] = [];
    let currentPrefix: string | null = null;
  
    for (const line of lines) {
      const trimmedLine = line.trim();
  
      if (prefix) {
        for (const [key, value] of Object.entries(sections)) {
          if (trimmedLine.indexOf(key) === 0) {
            currentPrefix = value;
            continue;
          }
        }
      } else {
        if (sections[trimmedLine]) {
          currentPrefix = sections[trimmedLine];
          continue;
        }
      }
  
      if (trimmedLine === '') {
        currentPrefix = null;
      }
  
      if (currentPrefix && trimmedLine) {
        result.push(`${currentPrefix} ${line}`);
      } else {
        result.push(line);
      }
    }
  
    return result.join('\n');
  }
} 