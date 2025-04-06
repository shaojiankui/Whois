import fs from 'fs';
import path from 'path';
import { loadTldList } from './tld';
import { DomainInfo } from '../../types/domain';

/**
 * TLD提取工具类
 * 用于从域名中提取TLD和域名前缀信息
 */
export class TldExtract {
  // TLD列表缓存
  private static tlds: string[] = [];
  // 已按长度排序的TLD列表
  private static sortedTlds: string[] = [];
  // 是否已初始化
  private static initialized: boolean = false;
  
  /**
   * 初始化TLD列表
   * 从配置文件加载所有TLD并按长度排序
   */
  private static async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // 从tld模块加载TLD列表
      const tldList = await loadTldList();
      this.tlds = tldList.map(info => info.tld.toLowerCase());
      
      // 按TLD长度排序（从长到短），确保最长匹配优先
      this.sortedTlds = [...this.tlds].sort((a, b) => {
        // 首先按点的数量排序（多点的域名如co.uk优先）
        const dotsA = (a.match(/\./g) || []).length;
        const dotsB = (b.match(/\./g) || []).length;
        
        if (dotsB !== dotsA) {
          return dotsB - dotsA;
        }
        
        // 然后按长度排序
        return b.length - a.length;
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('初始化TLD列表失败:', error);
      // 使用一些常见的TLD作为后备
      this.sortedTlds = ['com', 'org', 'net', 'co.uk', 'org.uk', 'gov', 'edu'];
      this.initialized = true;
    }
  }
  
  /**
   * 解析域名
   * @param domain 要解析的域名
   * @returns 域名信息对象
   */
  public static async parse(domain: string): Promise<DomainInfo> {
    // 确保已初始化
    await this.initialize();
    
    // 规范化域名（去除协议和路径，转小写）
    domain = this.normalizeDomain(domain);
    
    // 默认结果
    const result: DomainInfo = {
      domain,
      prefix: '',
      suffix: '',
    };
    
    // 如果域名为空或不包含点，无法解析
    if (!domain || !domain.includes('.')) {
      result.prefix = domain;
      return result;
    }
    
    // 尝试匹配最长的TLD
    for (const tld of this.sortedTlds) {
      if (domain.endsWith(`.${tld}`)) {
        result.suffix = tld;
        
        // 提取域名前缀（一级域名）
        const domainWithoutTld = domain.slice(0, -(tld.length + 1));
        
        // 如果没有子域名部分
        if (!domainWithoutTld.includes('.')) {
          result.prefix = domainWithoutTld;
        } else {
          // 有子域名，取最后一个点后面的部分作为前缀
          const parts = domainWithoutTld.split('.');
          result.prefix = parts.pop() || '';
          result.subdomain = parts.join('.');
        }
        
        // 如果TLD包含点（如co.uk），提取父级前缀
        if (tld.includes('.')) {
          result.parentPrefix = tld.split('.')[0];
        }
        
        // 兼容旧代码，设置sld和tld字段
        result.sld = result.prefix;
        result.tld = result.suffix;
        
        break;
      }
    }
    
    // 如果没有匹配到任何已知TLD，使用最后一个点后的部分作为TLD
    if (!result.suffix) {
      const parts = domain.split('.');
      result.suffix = parts.pop() || '';
      
      if (parts.length > 0) {
        result.prefix = parts.pop() || '';
        
        if (parts.length > 0) {
          result.subdomain = parts.join('.');
        }
      }
      
      // 兼容旧代码，设置sld和tld字段
      result.sld = result.prefix;
      result.tld = result.suffix;
    }
    
    return result;
  }
  
  /**
   * 规范化域名字符串
   * 去除协议、www前缀、路径和查询参数
   */
  private static normalizeDomain(input: string): string {
    // 只去除协议部分，保留www
    let domain = input.trim().toLowerCase();
    domain = domain.replace(/^(https?:\/\/)/i, '');
    
    // 去除路径和查询参数
    const pathIndex = domain.indexOf('/');
    if (pathIndex > 0) {
      domain = domain.substring(0, pathIndex);
    }
    
    // 去除端口号
    const portIndex = domain.indexOf(':');
    if (portIndex > 0) {
      domain = domain.substring(0, portIndex);
    }
    
    return domain;
  }
}

// 示例用法
// const info = TldExtract.parse('www.example.com');
// console.log(info);  // { domain: 'www.example.com', prefix: 'example', suffix: 'com', subdomain: 'www' } 