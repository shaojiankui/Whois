/**
 * 域名标签功能实现
 * 提供基于域名信息（注册时间、到期日期、注册状态等）生成标签的工具函数
 */

import dayjs from 'dayjs';
import { DomainInfo, DomainTag, DomainTagType } from '../../types/domain';

/**
 * 标签配置信息
 */
const tagConfig: Record<DomainTagType, DomainTag> = {
  [DomainTagType.LONG_HISTORY]: {
    type: DomainTagType.LONG_HISTORY,
    label: '10年+',
    description: '注册超过10年的老域名',
    class: 'tag-history',
    priority: 80
  },
  [DomainTagType.RECENTLY_REGISTERED]: {
    type: DomainTagType.RECENTLY_REGISTERED,
    label: '新注册',
    description: '最近3个月内注册的域名',
    class: 'tag-recent',
    priority: 60
  },
  [DomainTagType.EXPIRING_SOON]: {
    type: DomainTagType.EXPIRING_SOON,
    label: '即将到期',
    description: '30天内即将到期的域名',
    class: 'tag-expiring',
    priority: 90
  },
  [DomainTagType.RECENTLY_RENEWED]: {
    type: DomainTagType.RECENTLY_RENEWED,
    label: '最近续期',
    description: '最近1个月内续期的域名',
    class: 'tag-renewed',
    priority: 50
  },
  [DomainTagType.NUMERIC_ONLY]: {
    type: DomainTagType.NUMERIC_ONLY,
    label: '纯数字',
    description: '纯数字组成的域名',
    class: 'tag-numeric',
    priority: 40
  },
  [DomainTagType.SHORT]: {
    type: DomainTagType.SHORT,
    label: '短域名',
    description: '短域名（SLD 4字符以下）',
    class: 'tag-short',
    priority: 70
  },
  [DomainTagType.PREMIUM]: {
    type: DomainTagType.PREMIUM,
    label: '溢价',
    description: '溢价域名',
    class: 'tag-premium',
    priority: 85
  },
  [DomainTagType.COUNTRY_CODE]: {
    type: DomainTagType.COUNTRY_CODE,
    label: '国别域',
    description: '国家代码顶级域名',
    class: 'tag-country',
    priority: 30
  },
  [DomainTagType.INTERNATIONAL]: {
    type: DomainTagType.INTERNATIONAL,
    label: '国际化域名',
    description: '包含非ASCII字符的国际化域名',
    class: 'tag-international',
    priority: 35
  },
  [DomainTagType.WHOIS_PROTECTED]: {
    type: DomainTagType.WHOIS_PROTECTED,
    label: '隐私保护',
    description: '域名启用了WHOIS隐私保护',
    class: 'tag-protected',
    priority: 20
  },
  [DomainTagType.CLIENTHOLDS]: {
    type: DomainTagType.CLIENTHOLDS,
    label: '暂停解析',
    description: '域名处于clientHold状态，暂停解析',
    class: 'tag-clienthold',
    priority: 95
  },
  [DomainTagType.CLIENTTRANSFERPROHIB]: {
    type: DomainTagType.CLIENTTRANSFERPROHIB,
    label: '禁止转移',
    description: '域名禁止转移到其他注册商',
    class: 'tag-transfer',
    priority: 55
  },
  [DomainTagType.RESERVED]: {
    type: DomainTagType.RESERVED,
    label: '保留',
    description: '保留域名，无法注册',
    class: 'tag-reserved',
    priority: 100
  }
};

/**
 * 为域名生成标签
 * @param domainInfo 域名信息
 * @returns 域名标签数组
 */
export function generateDomainTags(domainInfo: DomainInfo): DomainTag[] {
  const tags: DomainTag[] = [];
  const now = dayjs();
  
  // 1. 检查注册年龄
  if (domainInfo.creationDate) {
    const creationDate = dayjs(domainInfo.creationDate);
    const ageInYears = now.diff(creationDate, 'year');
    
    if (ageInYears >= 10) {
      tags.push(tagConfig[DomainTagType.LONG_HISTORY]);
    } else if (now.diff(creationDate, 'month') <= 3) {
      tags.push(tagConfig[DomainTagType.RECENTLY_REGISTERED]);
    }
  }
  
  // 2. 检查到期日期
  if (domainInfo.expiryDate) {
    const expiryDate = dayjs(domainInfo.expiryDate);
    if (expiryDate.diff(now, 'day') <= 30) {
      tags.push(tagConfig[DomainTagType.EXPIRING_SOON]);
    }
  }
  
  // 3. 检查最近更新（可能是续期）
  if (domainInfo.updatedDate) {
    const updatedDate = dayjs(domainInfo.updatedDate);
    // 如果更新日期距离到期日期约一年，可能是续期操作
    if (domainInfo.expiryDate) {
      const expiryDate = dayjs(domainInfo.expiryDate);
      const previousExpiry = expiryDate.subtract(12, 'month'); // 假设续期增加了1年
      
      const diffMonths = Math.abs(updatedDate.diff(previousExpiry, 'month'));
      if (diffMonths <= 1 && now.diff(updatedDate, 'month') <= 1) {
        tags.push(tagConfig[DomainTagType.RECENTLY_RENEWED]);
      }
    } else if (now.diff(updatedDate, 'month') <= 1) {
      // 如果没有到期信息，但是最近1个月内有更新，也可能是续期
      tags.push(tagConfig[DomainTagType.RECENTLY_RENEWED]);
    }
  }
  
  // 4. 检查域名SLD特征
  if (domainInfo.sld || domainInfo.prefix) {
    const sld = domainInfo.sld || domainInfo.prefix;
    // 纯数字域名
    if (/^\d+$/.test(sld)) {
      tags.push(tagConfig[DomainTagType.NUMERIC_ONLY]);
    }
    
    // 短域名（4字符或更少）
    if (sld.length <= 4) {
      tags.push(tagConfig[DomainTagType.SHORT]);
    }
  }
  
  // 5. 检查是否为溢价域名
  if (domainInfo.isPremium) {
    tags.push(tagConfig[DomainTagType.PREMIUM]);
  }
  
  // 6. 检查TLD类型
  const tld = domainInfo.tld || domainInfo.suffix;
  if (tld && tld.length === 2) {
    tags.push(tagConfig[DomainTagType.COUNTRY_CODE]);
  }
  
  // 7. 检查是否为国际化域名
  if (domainInfo.domain && /^xn--/.test(domainInfo.domain)) {
    tags.push(tagConfig[DomainTagType.INTERNATIONAL]);
  }
  
  // 8. 检查域名状态
  if (domainInfo.status && domainInfo.status.length > 0) {
    const statusLower = domainInfo.status.map(s => s.toLowerCase());
    
    // 检查WHOIS隐私保护状态
    if (statusLower.some(s => s.includes('privacy') || s.includes('protect'))) {
      tags.push(tagConfig[DomainTagType.WHOIS_PROTECTED]);
    }
    
    // 检查域名暂停解析状态
    if (statusLower.some(s => s.includes('clienthold'))) {
      tags.push(tagConfig[DomainTagType.CLIENTHOLDS]);
    }
    
    // 检查域名禁止转移状态
    if (statusLower.some(s => s.includes('clienttransferprohibited'))) {
      tags.push(tagConfig[DomainTagType.CLIENTTRANSFERPROHIB]);
    }
  }
  
  // 9. 检查域名是否为保留状态
  if (domainInfo.isAvailable === false && domainInfo.status?.some(s => 
      s.toLowerCase().includes('reserved') || 
      s.toLowerCase().includes('保留')
    )) {
    tags.push(tagConfig[DomainTagType.RESERVED]);
  }
  
  // 根据优先级排序
  return tags.sort((a, b) => b.priority - a.priority);
} 