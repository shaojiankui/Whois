/**
 * TLD特定解析器
 * 提供针对特定顶级域名的处理逻辑
 */

/**
 * TLD解析器接口
 */
export interface TLDParser {
  /**
   * 检查域名是否可注册
   * @param rawData WHOIS原始数据
   * @returns 是否可注册，或null（使用默认逻辑）
   */
  isAvailable?: (rawData: string) => boolean | null;
  
  /**
   * 预处理WHOIS数据
   * @param rawData WHOIS原始数据
   * @returns 处理后的数据，或null（使用原始数据）
   */
  preProcess?: (rawData: string) => string | null;
  
  /**
   * 解析WHOIS数据
   * @param whoisData 预处理后的WHOIS数据
   * @returns 解析结果，或null（使用通用解析逻辑）
   */
  parse?: (whoisData: string) => any | null;
}

/**
 * COM顶级域名解析器
 */
const ComParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('No match for domain')) {
      return true;
    }
    return null;
  }
};

/**
 * NET顶级域名解析器
 */
const NetParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('No match for domain')) {
      return true;
    }
    return null;
  }
};

/**
 * CN顶级域名解析器
 */
const CnParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('No matching record.') || 
        rawData.includes('The domain you want to register is available')) {
      return true;
    }
    return null;
  },
  
  preProcess(rawData: string): string | null {
    // 移除中文WHOIS信息中的特殊字符
    const processedData = rawData
      .replace(/[\u4e00-\u9fa5]+/g, '')  // 移除所有中文字符
      .replace(/\r\n/g, '\n')            // 统一换行符
      .replace(/\n{3,}/g, '\n\n');       // 合并多个换行
    
    return processedData;
  }
};

/**
 * JP顶级域名解析器
 */
const JpParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('No match!!') || 
        rawData.includes('No match for')) {
      return true;
    }
    return null;
  },
  
  preProcess(rawData: string): string | null {
    // 替换日文WHOIS信息中的字段
    let processed = rawData;
    processed = processed.replace(/\[登録年月日\]/g, "create date:");
    processed = processed.replace(/\[有効期限\]/g, "Expire date:");
    processed = processed.replace(/\[状態\]/g, "status:");
    processed = processed.replace(/\[最終更新\] /g, "update date:");
    processed = processed.replace(/\[名前\]/g, "Registrant Name:");
    processed = processed.replace(/\[Email\]/g, "Email:");
    processed = processed.replace(/\[郵便番号\]/g, "registrant zipcode:");
    processed = processed.replace(/\[住所\]/g, "registrant address:");
    processed = processed.replace(/\[電話番号\]/g, "registrant phone:");
    
    return processed;
  }
};

/**
 * UK顶级域名解析器
 */
const UkParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('No match for') || 
        rawData.includes('This domain name has not been registered')) {
      return true;
    }
    return null;
  },
  
  preProcess(rawData: string): string | null {
    // 预处理.uk域名的WHOIS信息，整理分组
    const sections: Record<string, string> = {
      "Registrant:": "Registrant:",
      "Registrar:": "Registrar:",
      "Name servers": "Name Servers:",
    };
    
    return prehandleWhoisSection(rawData, sections);
  }
};

/**
 * RU顶级域名解析器
 */
const RuParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('No entries found') || 
        rawData.includes('No information')) {
      return true;
    }
    return null;
  }
};

/**
 * EU顶级域名解析器
 */
const EuParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('Status: AVAILABLE') || 
        rawData.includes('not found')) {
      return true;
    }
    return null;
  },
  
  preProcess(rawData: string): string | null {
    const sections: Record<string, string> = {
      "Registrant:": "Registrant:",
      "Technical:": "Technical:",
      "Registrar:": "Registrar:",
      "Technical contact:": "Technical",
      "Name servers:": "Name servers:"
    };
    
    return prehandleWhoisSection(rawData, sections);
  }
};

/**
 * CC顶级域名解析器
 */
const CcParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('No match for') || 
        rawData.includes('Domain not found')) {
      return true;
    }
    return null;
  }
};

/**
 * IO顶级域名解析器
 */
const IoParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('is available for purchase')) {
      return true;
    }
    return null;
  },
  
  preProcess(rawData: string): string | null {
    // 移除.io域名中的营销信息
    return rawData
      .replace(/is available for purchase.*?\n/g, '')
      .replace(/Click here to buy.*?\n/g, '');
  }
};

/**
 * IT顶级域名解析器
 */
const ItParser: TLDParser = {
  preProcess(rawData: string): string | null {
    const sections: Record<string, string> = {
      "Registrant": "Registrant",
      "Admin Contact": "Admin",
      "Technical Contacts": "Technical",
      "Registrar": "Registrar",
      "Nameservers": "Nameservers:"
    };
    
    return prehandleWhoisSection(rawData, sections);
  }
};

/**
 * BE顶级域名解析器
 */
const BeParser: TLDParser = {
  preProcess(rawData: string): string | null {
    const sections: Record<string, string> = {
      "Registrar:": "Registrar",
      "Nameservers:": "Nameservers:",
    };
    
    return prehandleWhoisSection(rawData, sections);
  }
};

/**
 * BR顶级域名解析器
 */
const BrParser: TLDParser = {
  isAvailable(rawData: string): boolean | null {
    if (rawData.includes('No match for') || 
        rawData.includes('No objects found')) {
      return true;
    }
    return null;
  }
};

/**
 * KZ顶级域名解析器
 */
const KzParser: TLDParser = {
  preProcess(rawData: string): string | null {
    // 移除多余的点和特殊格式
    let processed = rawData;
    processed = processed.replace(/\.\./g, "");
    processed = processed.replace(/\.\.\./g, "");
    processed = processed.replace(/\.\.\.\./g, "");
    processed = processed.replace(/\.\.\.\.\./g, "");
    processed = processed.replace(/\.\.\.\.\.\./g, "");
    processed = processed.replace(/\.\.\.\.\.\.\./g, "");
    processed = processed.replace(/\.\.\.\.\.\.\.\./g, "");
    processed = processed.replace(/\.\.\.\.\.\.\.\.\./g, "");
    processed = processed.replace(/\.:/g, ":");
    processed = processed.replace(/Current Registar/g, "Registar Name");

    const sections: Record<string, string> = {
      "Organization Using Domain Name": "registrant",
      "Administrative Contact/Agent": "Administrative",
    };
    
    return prehandleWhoisSection(processed, sections);
  }
};

/**
 * AT顶级域名解析器
 */
const AtParser: TLDParser = {
  preProcess(rawData: string): string | null {
    // 处理AT域名的特殊格式
    const lines = rawData.trim().split('\n');
    let part = 0;
    const result: string[] = [];

    for (const line of lines) {
      if (line.trim() === '') {
        part++;
        result.push(line);
        continue;
      }

      if (part === 2) {
        result.push("registrant " + line);
      } else {
        result.push(line);
      }
    }

    return result.join('\n');
  }
};

/**
 * AR顶级域名解析器
 */
const ArParser: TLDParser = {
  preProcess(rawData: string): string | null {
    // 处理AR域名的特殊格式
    const lines = rawData.trim().split('\n');
    let part = 0;
    const result: string[] = [];

    for (const line of lines) {
      if (line.trim() === '') {
        part++;
        result.push(line);
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

    return result.join('\n');
  }
};

/**
 * BO顶级域名解析器
 */
const BoParser: TLDParser = {
  preProcess(rawData: string): string | null {
    // 替换西班牙语字段为英文
    let processed = rawData;
    processed = processed.replace(/Nombre Completo/g, "Name");
    processed = processed.replace(/Correo electrónico/g, "Email");
    processed = processed.replace(/País/g, "Country");
    processed = processed.replace(/Ciudad/g, "City");
    processed = processed.replace(/Dirección/g, "Street");
    processed = processed.replace(/Teléfono/g, "Phone");
    processed = processed.replace(/Fecha de activación/g, "Create Date");
    processed = processed.replace(/Fecha de corte/g, "Expire Date");

    const sections: Record<string, string> = {
      "CONTACTO ADMINISTRATIVO": "Admin",
      "CONTACTO TECNICO": "Technical",
      "CONTACTO FINANCIERO": "Bill",
      "TITULAR DEL DOMINIO": "Registrant",
    };
    
    return prehandleWhoisSection(processed, sections);
  }
};

/**
 * SG顶级域名解析器
 */
const SgParser: TLDParser = {
  preProcess(rawData: string): string | null {
    // 移除所有空行
    const processedData = rawData.replace(/(^[\r\n]*|[\r\n]+)[\s\t]*[\r\n]+/g, "\n");
    
    const sections: Record<string, string> = {
      "Technical Contact:": "Registrant",
      "Name Servers:": "Name Servers",
    };
    
    return prehandleWhoisSection(processedData, sections);
  }
};

/**
 * AM顶级域名解析器
 */
const AmParser: TLDParser = {
  preProcess(rawData: string): string | null {
    // 处理AM域名的复杂分组结构
    const lines = rawData.split('\n');
    const groupNames: Record<string, string> = {
      'Registrant:': 'Registrant:',
      'Administrative contact:': 'Admin:',
      'Technical contact:': 'Technical:',
      'DNS servers:': 'DNS servers:',
    };

    let currentGroup = '';
    let count = -1;
    const result: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        currentGroup = '';
        result.push('\n');
        continue;
      }
      
      if (groupNames[trimmedLine]) {
        currentGroup = groupNames[trimmedLine];
        count = -1;
        result.push(currentGroup);
        continue;
      } else if (trimmedLine && currentGroup) {
        count++;
        if (currentGroup !== 'DNS servers:') {
          if (count === 0) {
            result.push('Name:' + trimmedLine);
          } else if (count === 1) {
            result.push('Address:' + trimmedLine);
          } else if (count === 2) {
            result.push('State:' + trimmedLine);
          } else if (count === 3) {
            result.push('Country:' + trimmedLine);
          } else if (count === 4) {
            result.push('Email:' + trimmedLine);
          } else if (count === 5) {
            result.push('Phone:' + trimmedLine);
          }
        } else {
          result.push(trimmedLine);
        }
      } else if (!currentGroup) {
        result.push(trimmedLine);
      }
    }
    
    const sections: Record<string, string> = {
      'DNS servers:': 'Name servers:',
      'Admin:': 'Admin',
      'Technical:': 'Technical',
      'Registrant:': 'Registrant',
    };
    
    return prehandleWhoisSection(result.join('\n'), sections, true);
  }
};

/**
 * 辅助函数：根据分段名称预处理WHOIS数据
 * @param whoisData WHOIS数据
 * @param sections 分段映射
 * @param prefix 是否使用前缀匹配
 * @returns 处理后的WHOIS数据
 */
function prehandleWhoisSection(whoisData: string, sections: Record<string, string>, prefix = false): string {
  const lines = whoisData.split('\n');
  const result: string[] = [];
  
  let currentPrefix: string | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (prefix) {
      // 检查行是否以任何分段名称开头
      for (const [key, value] of Object.entries(sections)) {
        if (trimmedLine.indexOf(key) === 0) {
          currentPrefix = value;
          result.push(line);
          continue;
        }
      }
    } else {
      // 检查行是否完全匹配任何分段名称
      if (sections[trimmedLine]) {
        currentPrefix = sections[trimmedLine];
        result.push(line);
        continue;
      }
    }
    
    // 如果遇到空行，重置当前前缀
    if (trimmedLine === '') {
      currentPrefix = null;
      result.push(line);
      continue;
    }
    
    // 如果当前有前缀且行非空，添加前缀
    if (currentPrefix && trimmedLine) {
      result.push(`${currentPrefix} ${line}`);
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

/**
 * TLD解析器映射表
 */
const TLD_PARSERS: Record<string, TLDParser> = {
  'com': ComParser,
  'net': NetParser,
  'org': NetParser, // 使用与.net相同的解析逻辑
  'cn': CnParser,
  'jp': JpParser,
  'uk': UkParser,
  'co.uk': UkParser,
  'org.uk': UkParser,
  'me.uk': UkParser,
  'ru': RuParser,
  'eu': EuParser,
  'cc': CcParser,
  'io': IoParser,
  'it': ItParser,
  'be': BeParser,
  'br': BrParser,
  'kz': KzParser,
  'at': AtParser,
  'ar': ArParser,
  'bo': BoParser,
  'sg': SgParser,
  'am': AmParser
};

/**
 * TLD特定解析器类
 * 用于获取特定TLD的解析器
 */
export class TLDSpecificParser {
  /**
   * 获取特定TLD的解析器
   * @param tld 顶级域名
   * @returns TLD解析器，如果不存在则返回null
   */
  static getParser(tld: string): TLDParser | null {
    // 确保输入的TLD不包含点并且是小写
    const cleanTld = tld.toLowerCase().replace(/^\./, '');
    
    // 首先尝试完整匹配
    if (TLD_PARSERS[cleanTld]) {
      return TLD_PARSERS[cleanTld];
    }
    
    // 其次尝试二级域名匹配（如co.uk）
    for (const key of Object.keys(TLD_PARSERS)) {
      if (cleanTld.endsWith(`.${key}`)) {
        return TLD_PARSERS[key];
      }
    }
    
    // 最后返回null，表示没有找到匹配的解析器
    return null;
  }
  
  /**
   * 注册TLD解析器
   * @param tld 顶级域名
   * @param parser 解析器
   */
  static registerParser(tld: string, parser: TLDParser): void {
    const cleanTld = tld.toLowerCase().replace(/^\./, '');
    TLD_PARSERS[cleanTld] = parser;
  }
} 