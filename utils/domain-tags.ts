import dayjs from 'dayjs';
import type { WhoisTag } from '~/types/whois';

/**
 * 生成域名标签
 * 根据域名的注册信息、过期时间等生成人性化标签
 * @param domain 域名
 * @param data 域名完整数据
 * @param t 国际化函数
 * @returns 域名标签数组
 */
export const generateDomainTags = (
  domain: string, 
  data: {
    creationDate?: string;
    expirationDate?: string;
    updatedDate?: string;
    nameServers?: string[];
    isPremium?: boolean;
    status?: string[];
    domainStatus?: Record<string, string>;
  } = {},
  t: (key: string, params?: any) => string = (key) => key
): WhoisTag[] => {
  const tags: WhoisTag[] = [];
  const {
    creationDate,
    expirationDate,
    updatedDate,
    nameServers,
    isPremium,
    status,
    domainStatus
  } = data;
  
  // 1. 域名年龄和过期时间标签
  generateAgeTags(tags, creationDate, expirationDate, updatedDate, t);
  
  // 2. 域名特性标签
  generateDomainCharacteristicsTags(tags, domain, t);
  
  // 3. 域名区域和TLD类型标签
  generateRegionAndTldTags(tags, domain, t);
  
  // 4. 域名状态标签
  generateStatusTags(tags, status, domainStatus, t);
  
  // 5. 域名价值标签
  generateValueTags(tags, domain, isPremium, t);
  
  // 6. 域名服务器标签
  generateNameServerTags(tags, nameServers, t);
  
  return tags;
};

/**
 * 生成年龄相关标签
 */
function generateAgeTags(
  tags: WhoisTag[],
  creationDate?: string,
  expirationDate?: string,
  updatedDate?: string,
  t: (key: string, params?: any) => string = (key) => key
): void {
  const now = dayjs();
  
  // 过期相关标签
  if (expirationDate) {
    const expiry = dayjs(expirationDate);
    const daysTillExpiry = expiry.diff(now, 'day');
    
    if (daysTillExpiry < 0) {
      // 已过期
      tags.push({
        type: 'expiry',
        label: t('domainTags.expired'),
        class: 'tag-expired',
        description: t('domainTags.expiredDesc')
      });
    } else if (daysTillExpiry < 30) {
      // 即将过期（30天内）
      tags.push({
        type: 'expiry',
        label: t('domainTags.expiringNow'),
        class: 'tag-expired',
        description: t('domainTags.expiringNowDesc')
      });
    } else if (daysTillExpiry < 90) {
      // 即将过期（90天内）
      tags.push({
        type: 'expiry',
        label: t('domainTags.expiringSoon'),
        class: 'tag-renewal',
        description: t('domainTags.expiringSoonDesc')
      });
    }
  }
  
  // 最近更新/续费标签
  if (updatedDate) {
    const updated = dayjs(updatedDate);
    const daysSinceUpdate = now.diff(updated, 'day');
    
    if (daysSinceUpdate >= 0 && daysSinceUpdate <= 30) {
      tags.push({
        type: 'renewal',
        label: t('domainTags.recentRenewal'),
        class: 'tag-renewed',
        description: t('domainTags.recentRenewalDesc')
      });
    }
  }
  
  // 年龄相关标签
  if (creationDate) {
    const creation = dayjs(creationDate);
    const yearsRegistered = now.diff(creation, 'year');
    const daysRegistered = now.diff(creation, 'day');
    
    if (daysRegistered <= 7) {
      // 极新域名（7天内）
      tags.push({
        type: 'age',
        label: t('domainTags.brandNew'),
        class: 'tag-brandnew',
        description: t('domainTags.brandNewDesc')
      });
    } else if (yearsRegistered < 1) {
      // 新注册域名（1年内）
      tags.push({
        type: 'age',
        label: t('domainTags.newDomain'),
        class: 'tag-new',
        description: t('domainTags.newDomainDesc')
      });
    } else if (yearsRegistered >= 20) {
      // 非常老的域名（20年以上）
      tags.push({
        type: 'age',
        label: t('domainTags.vintage'),
        class: 'tag-vintage',
        description: t('domainTags.vintageDesc')
      });
    } else if (yearsRegistered >= 10) {
      // 长期注册域名（10年以上）
      tags.push({
        type: 'age',
        label: t('domainTags.longterm', { years: yearsRegistered }),
        class: 'tag-longterm',
        description: t('domainTags.longtermDesc', { years: yearsRegistered })
      });
    }
  }
}

/**
 * 生成域名特性标签
 */
function generateDomainCharacteristicsTags(
  tags: WhoisTag[],
  domain: string,
  t: (key: string, params?: any) => string = (key) => key
): void {
  if (!domain) return;
  
  // 解析域名部分
  const domainParts = domain.split('.');
  const domainName = domainParts[0];
  
  if (domainName) {
    // 域名长度标签
    if (domainName.length <= 3) {
      tags.push({
        type: 'length',
        label: t('domainTags.short'),
        class: 'tag-short',
        description: t('domainTags.shortDesc')
      });
    } else if (domainName.length >= 15) {
      tags.push({
        type: 'length',
        label: t('domainTags.long'),
        class: 'tag-long',
        description: t('domainTags.longDesc')
      });
    }
    
    // 纯数字域名
    if (/^\d+$/.test(domainName)) {
      tags.push({
        type: 'numeric',
        label: t('domainTags.numeric'),
        class: 'tag-numeric',
        description: t('domainTags.numericDesc')
      });
    }
    
    // 字母数字混合域名
    if (/^[a-z0-9]+$/i.test(domainName) && /[a-z]/i.test(domainName) && /\d/.test(domainName)) {
      tags.push({
        type: 'alphanumeric',
        label: t('domainTags.alphanumeric'),
        class: 'tag-alphanumeric',
        description: t('domainTags.alphanumericDesc')
      });
    }
    
    // 连字符域名
    if (domainName.includes('-')) {
      tags.push({
        type: 'hyphen',
        label: t('domainTags.hyphen'),
        class: 'tag-hyphen',
        description: t('domainTags.hyphenDesc')
      });
    }
    
    // 回文域名
    const reversedName = domainName.split('').reverse().join('');
    if (domainName.toLowerCase() === reversedName.toLowerCase() && domainName.length > 2) {
      tags.push({
        type: 'palindrome',
        label: t('domainTags.palindrome'),
        class: 'tag-palindrome',
        description: t('domainTags.palindromeDesc')
      });
    }
  }
}

/**
 * 生成区域和TLD类型标签
 */
function generateRegionAndTldTags(
  tags: WhoisTag[],
  domain: string,
  t: (key: string, params?: any) => string = (key) => key
): void {
  if (!domain) return;
  
  const tld = domain.split('.').pop()?.toLowerCase();
  
  if (tld) {
    // 国家/地区域名
    if (tld.length === 2) {
      if (['cn', 'hk', 'tw'].includes(tld)) {
        tags.push({
          type: 'region',
          label: t('domainTags.chinaRegion'),
          class: 'tag-region',
          description: t('domainTags.chinaRegionDesc')
        });
      } else if (['jp', 'kr'].includes(tld)) {
        tags.push({
          type: 'region',
          label: t('domainTags.asiaRegion'),
          class: 'tag-region',
          description: t('domainTags.asiaRegionDesc')
        });
      } else if (['uk', 'de', 'fr', 'es', 'it', 'nl'].includes(tld)) {
        tags.push({
          type: 'region',
          label: t('domainTags.europeRegion'),
          class: 'tag-region',
          description: t('domainTags.europeRegionDesc')
        });
      } else if (['us', 'ca'].includes(tld)) {
        tags.push({
          type: 'region',
          label: t('domainTags.northAmerica'),
          class: 'tag-region',
          description: t('domainTags.northAmericaDesc')
        });
      }
    }
    
    // 热门通用顶级域名
    if (['com', 'net', 'org'].includes(tld)) {
      tags.push({
        type: 'popular',
        label: t('domainTags.popular'),
        class: 'tag-popular',
        description: t('domainTags.popularDesc')
      });
    }
    
    // 新顶级域名
    if (['app', 'dev', 'io', 'ai', 'cloud', 'tech'].includes(tld)) {
      tags.push({
        type: 'newTLD',
        label: t('domainTags.tech'),
        class: 'tag-tech',
        description: t('domainTags.techDesc')
      });
    }
    
    // 行业特定域名
    if (['edu', 'gov', 'mil', 'int'].includes(tld)) {
      tags.push({
        type: 'restricted',
        label: t('domainTags.restricted'),
        class: 'tag-restricted',
        description: t('domainTags.restrictedDesc')
      });
    }
  }
}

/**
 * 生成状态标签
 */
function generateStatusTags(
  tags: WhoisTag[],
  status?: string[],
  domainStatus?: Record<string, string>,
  t: (key: string, params?: any) => string = (key) => key
): void {
  // 检查域名锁定状态
  const isLocked = checkDomainLockStatus(status, domainStatus);
  if (isLocked) {
    tags.push({
      type: 'locked',
      label: t('domainTags.locked'),
      class: 'tag-locked',
      description: t('domainTags.lockedDesc')
    });
  }
  
  // 检查域名赎回期状态
  const isRedemption = checkRedemptionStatus(status, domainStatus);
  if (isRedemption) {
    tags.push({
      type: 'redemption',
      label: t('domainTags.redemption'),
      class: 'tag-redemption',
      description: t('domainTags.redemptionDesc')
    });
  }
}

/**
 * 生成价值标签
 */
function generateValueTags(
  tags: WhoisTag[],
  domain: string,
  isPremium?: boolean,
  t: (key: string, params?: any) => string = (key) => key
): void {
  // 溢价域名标签
  if (isPremium) {
    tags.push({
      type: 'premium',
      label: t('domainTags.premium'),
      class: 'tag-premium',
      description: t('domainTags.premiumDesc')
    });
  }
  
  // 潜在品牌域名
  const domainName = domain.split('.')[0];
  if (domainName && isBrandName(domainName)) {
    tags.push({
      type: 'brand',
      label: t('domainTags.brand'),
      class: 'tag-brand',
      description: t('domainTags.brandDesc')
    });
  }
}

/**
 * 生成名称服务器标签
 */
function generateNameServerTags(
  tags: WhoisTag[],
  nameServers?: string[],
  t: (key: string, params?: any) => string = (key) => key
): void {
  if (!nameServers || nameServers.length === 0) {
    tags.push({
      type: 'noNameServer',
      label: t('domainTags.noNameServer'),
      class: 'tag-nonameserver',
      description: t('domainTags.noNameServerDesc')
    });
    return;
  }
  
  // 检测常见DNS提供商
  const nsLower = nameServers.map(ns => ns.toLowerCase());
  
  if (nsLower.some(ns => ns.includes('cloudflare'))) {
    tags.push({
      type: 'cloudflare',
      label: t('domainTags.cloudflare'),
      class: 'tag-dns',
      description: t('domainTags.cloudflareDesc')
    });
  } else if (nsLower.some(ns => ns.includes('aws') || ns.includes('amazon'))) {
    tags.push({
      type: 'aws',
      label: t('domainTags.aws'),
      class: 'tag-dns',
      description: t('domainTags.awsDesc')
    });
  } else if (nsLower.some(ns => ns.includes('google'))) {
    tags.push({
      type: 'google',
      label: t('domainTags.google'),
      class: 'tag-dns',
      description: t('domainTags.googleDesc')
    });
  }
}

/**
 * 检查域名是否处于锁定状态
 */
function checkDomainLockStatus(
  status?: string[],
  domainStatus?: Record<string, string>
): boolean {
  // 检查字符串数组
  if (status && Array.isArray(status)) {
    const lockStatuses = [
      'clienttransferprohibited',
      'clientupdateprohibited',
      'clientdeleteprohibited'
    ];
    
    return status.some(s => 
      lockStatuses.some(lock => 
        s.toLowerCase().includes(lock)
      )
    );
  }
  
  // 检查对象格式
  if (domainStatus && typeof domainStatus === 'object') {
    const lockStatuses = [
      'clienttransferprohibited',
      'clientupdateprohibited',
      'clientdeleteprohibited'
    ];
    
    return Object.keys(domainStatus).some(key => 
      lockStatuses.some(lock => 
        key.toLowerCase().includes(lock)
      )
    );
  }
  
  return false;
}

/**
 * 检查域名是否处于赎回期
 */
function checkRedemptionStatus(
  status?: string[],
  domainStatus?: Record<string, string>
): boolean {
  // 检查字符串数组
  if (status && Array.isArray(status)) {
    const redemptionStatuses = [
      'redemptionperiod',
      'pendingdelete'
    ];
    
    return status.some(s => 
      redemptionStatuses.some(rs => 
        s.toLowerCase().includes(rs)
      )
    );
  }
  
  // 检查对象格式
  if (domainStatus && typeof domainStatus === 'object') {
    const redemptionStatuses = [
      'redemptionperiod',
      'pendingdelete'
    ];
    
    return Object.keys(domainStatus).some(key => 
      redemptionStatuses.some(rs => 
        key.toLowerCase().includes(rs)
      )
    );
  }
  
  return false;
}

/**
 * 判断是否可能是品牌名
 */
function isBrandName(domainName: string): boolean {
  // 这里可以实现更复杂的品牌检测逻辑
  // 简单实现：较长的、不含数字的单词可能是品牌
  return domainName.length >= 5 && 
    domainName.length <= 10 && 
    !/\d/.test(domainName) && 
    !/[\-_]/.test(domainName);
} 