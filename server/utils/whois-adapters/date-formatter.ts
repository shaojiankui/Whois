/**
 * 日期格式化工具
 * 处理不同格式的日期并转换为标准格式
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { loadJsonConfig } from './config-loader';
import { getTldTimezone as fetchTldTimezone } from '../tld';

// 加载dayjs插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// 通用日期格式 - 按优先级排序
const dateFormats = [
  // ISO格式
  "YYYY-MM-DDTHH:mm:ssZ",
  "YYYY-MM-DDTHH:mm:ss.SSSZ",
  
  // 标准格式
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD',
  'YYYY/MM/DD HH:mm:ss',
  'YYYY/MM/DD',
  
  // 欧洲格式
  'DD-MM-YYYY HH:mm:ss',
  'DD-MM-YYYY',
  'DD/MM/YYYY HH:mm:ss',
  'DD/MM/YYYY',
  'DD.MM.YYYY HH:mm:ss',
  'DD.MM.YYYY',
  
  // 美国格式
  'MM-DD-YYYY HH:mm:ss',
  'MM-DD-YYYY',
  'MM/DD/YYYY HH:mm:ss',
  'MM/DD/YYYY',
  
  // 月份名称格式
  'DD MMM YYYY',
  'DD MMMM YYYY',
  'MMM DD YYYY',
  'MMMM DD YYYY',
  'MMM DD, YYYY',
  
  // 特殊格式
  'YYYY.MM.DD',
  'YYYYMMDD',
  'YYYYMMDD HH:mm:ss'
];

// 时区缓存
const timezoneCache = new Map<string, any>();

// 日期解析结果缓存，用于提高性能
const dateParseCache = new Map<string, dayjs.Dayjs | null>();

/**
 * 获取TLD对应的时区配置
 * @param tld 顶级域名
 * @returns 时区配置对象
 */
async function getTldTimezone(tld: string): Promise<any> {
  if (!tld) return null;
  
  // 尝试从缓存获取
  if (timezoneCache.has(tld)) {
    return timezoneCache.get(tld);
  }
  
  try {
    // 从数据库获取TLD时区信息
    const timezoneInfo = await fetchTldTimezone(tld);
    
    if (timezoneInfo) {
      // 将结果存入缓存
      timezoneCache.set(tld, timezoneInfo);
      return timezoneInfo;
    }
    
    // 没有找到配置，存入null
    timezoneCache.set(tld, null);
    return null;
  } catch (error) {
    console.error(`获取TLD时区信息失败 (${tld}):`, error);
    return null;
  }
}

/**
 * 清理日期字符串
 * @param dateStr 日期字符串
 * @returns 清理后的日期字符串
 */
function cleanDateString(dateStr: string): string {
  if (!dateStr) return '';
  
  // 移除多余的空白字符
  let cleanDate = dateStr.trim().replace(/\s+/g, ' ');
  
  // 修复常见的时区缩写
  cleanDate = cleanDate
    .replace(/ GMT([-+]\d{1,2}:?\d{2})?/i, '')
    .replace(/ UTC([-+]\d{1,2}:?\d{2})?/i, '')
    .replace(/\(.*?\)/g, '')  // 移除括号内的内容
    .trim();
  
  // 添加秒数（如果时间格式没有秒）
  if (/\d{1,2}:\d{2}$/.test(cleanDate)) {
    cleanDate += ':00';
  }
  
  // 处理特殊格式 "4/29/2012 22:12:37 UTC"
  if (/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}(:\d{2})? UTC/.test(cleanDate)) {
    cleanDate = cleanDate.replace(' UTC', 'Z');
  }
  
  return cleanDate;
}

/**
 * 尝试解析日期字符串
 * @param dateStr 日期字符串
 * @returns 解析后的Dayjs对象或null
 */
function tryParseDate(dateStr: string): dayjs.Dayjs | null {
  if (!dateStr) return null;
  
  // 先检查缓存
  const cacheKey = dateStr;
  if (dateParseCache.has(cacheKey)) {
    const cachedDate = dateParseCache.get(cacheKey);
    return cachedDate !== undefined ? cachedDate : null;
  }
  
  // 对于ISO日期格式，直接使用dayjs解析
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?$/.test(dateStr)) {
    const date = dayjs(dateStr);
    if (date.isValid()) {
      dateParseCache.set(cacheKey, date);
      return date;
    }
  }
  
  // 尝试使用各种格式
  for (const dateFormat of dateFormats) {
    const date = dayjs(dateStr, dateFormat);
    if (date.isValid()) {
      dateParseCache.set(cacheKey, date);
      return date;
    }
  }
  
  // 最后尝试使用不指定格式
  const date = dayjs(dateStr);
  if (date.isValid()) {
    dateParseCache.set(cacheKey, date);
    return date;
  }
  
  // 如果解析失败，存入null
  dateParseCache.set(cacheKey, null);
  return null;
}

/**
 * 格式化Dayjs为ISO字符串
 * @param date Dayjs对象
 * @returns 格式化后的日期字符串
 */
function formatToISOString(date: dayjs.Dayjs | null): string {
  if (!date || !date.isValid()) return '';
  
  return date.toISOString();
}

/**
 * 格式化日期为标准UTC格式
 * @param dateStr 日期字符串
 * @param tld 顶级域名（用于时区识别）
 * @returns 格式化后的UTC日期字符串
 */
export async function formatDate(dateStr: string, tld: string = ''): Promise<string> {
  if (!dateStr || typeof dateStr !== 'string') {
    return '';
  }
  
  // 清理日期字符串
  const cleanDate = cleanDateString(dateStr);
  if (!cleanDate) return '';
  
  try {
    // 获取TLD对应的时区配置
    const timezone = await getTldTimezone(tld);
    
    // 先尝试根据指定的时区格式解析
    let date: dayjs.Dayjs | null = null;
    
    if (timezone?.format) {
      date = dayjs(cleanDate, timezone.format || "YYYY-MM-DD HH:mm:ss");
      if (!date.isValid()) {
        date = null;
      }
    }
    
    // 如果指定格式不匹配，尝试通用解析
    if (!date) {
      date = tryParseDate(cleanDate);
    }
    
    // 如果无法解析，返回原始字符串
    if (!date) {
      return dateStr;
    }
    
    // 应用时区转换
    if (timezone) {
      const zoneName = timezone.name || 'UTC';
      const utcOffset = timezone.offset || '0';
      
      // 如果日期字符串不包含时区信息，并且有指定UTC偏移
      if (!cleanDate.includes('+') && !cleanDate.includes('Z') && utcOffset !== '0') {
        const offset = parseInt(utcOffset, 10);
        if (!isNaN(offset)) {
          // 添加UTC偏移小时
          date = date.add(offset, 'hour');
        }
      }
      
      // 转换为UTC时间
      if (zoneName !== 'UTC' && zoneName !== 'none') {
        try {
          // 先设置原始时区，然后转换到UTC
          date = dayjs.tz(date.format('YYYY-MM-DD HH:mm:ss'), zoneName).utc();
        } catch (e) {
          // 如果时区无效，使用原始日期
          console.warn(`无效时区 ${zoneName} 用于 ${tld}:`, e);
        }
      } else {
        // 确保转换为UTC
        date = date.utc();
      }
    } else {
      // 没有时区信息时，默认转换为UTC
      date = date.utc();
    }
    
    // 格式化输出为ISO字符串
    return formatToISOString(date);
  } catch (error) {
    // 处理出错时返回原始字符串
    console.error(`日期格式化错误 (${dateStr}):`, error);
    return dateStr;
  }
}

/**
 * 同步版本的日期格式化函数
 * 不会考虑TLD时区信息，仅进行基本的格式转换
 * @param dateStr 日期字符串
 * @returns 格式化后的UTC日期字符串
 */
export function formatDateToUTC(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return '';
  }
  
  // 清理日期字符串
  const cleanDate = cleanDateString(dateStr);
  if (!cleanDate) return '';
  
  try {
    // 尝试解析日期
    const date = tryParseDate(cleanDate);
    
    // 如果解析成功，转换为UTC并返回ISO格式
    if (date) {
      return date.utc().toISOString();
    }
    
    // 解析失败返回原始字符串
    return dateStr;
  } catch (error) {
    console.error(`UTC日期格式化错误 (${dateStr}):`, error);
    return dateStr;
  }
}

/**
 * 清除日期解析缓存
 */
export function clearDateCache(): void {
  dateParseCache.clear();
  timezoneCache.clear();
}