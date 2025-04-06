import dayjs from 'dayjs';
import type { WhoisTag } from '~/types/whois';

/**
 * 生成域名标签
 * 根据域名的注册信息、过期时间等生成人性化标签
 * @param domain 域名
 * @param creationDate 创建日期
 * @param expirationDate 过期日期
 * @param isPremium 是否是溢价域名
 * @param t 国际化函数
 * @returns 域名标签数组
 */
export const generateDomainTags = (
  domain: string, 
  creationDate?: string, 
  expirationDate?: string, 
  isPremium?: boolean,
  t: (key: string, params?: any) => string = (key) => key
): WhoisTag[] => {
  const tags: WhoisTag[] = [];
  
  // 1. 检查是否即将过期（90天内）
  if (expirationDate) {
    const expiry = dayjs(expirationDate);
    const now = dayjs();
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
    
    // 最近续费（30天内续费）
    const updatedDate = dayjs(expirationDate).subtract(1, 'year');
    const daysSinceUpdate = now.diff(updatedDate, 'day');
    if (daysSinceUpdate >= 0 && daysSinceUpdate <= 30) {
      tags.push({
        type: 'renewal',
        label: t('domainTags.recentRenewal'),
        class: 'tag-renewed',
        description: t('domainTags.recentRenewalDesc')
      });
    }
  }
  
  // 2. 检查注册时间（新注册或长期注册）
  if (creationDate) {
    const creation = dayjs(creationDate);
    const now = dayjs();
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
  
  // 3. 检查是否是溢价域名
  if (isPremium) {
    tags.push({
      type: 'premium',
      label: t('domainTags.premium'),
      class: 'tag-premium',
      description: t('domainTags.premiumDesc')
    });
  }
  
  // 4. 添加域名区域标签（根据后缀）
  if (domain) {
    const tld = domain.split('.').pop()?.toLowerCase();
    
    // 域名长度
    const domainName = domain.split('.')[0];
    if (domainName) {
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
    }
    
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
  
  return tags;
}; 