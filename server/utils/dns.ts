import dns from 'dns';
import { promisify } from 'util';

// 将DNS解析方法转换为Promise形式
const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveCname = promisify(dns.resolveCname);
const resolveSoa = promisify(dns.resolveSoa);

// DNS记录类型
export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SOA';

// DNS查询结果
export interface DnsQueryResult {
  domain: string;
  type: DnsRecordType;
  success: boolean;
  records?: any[];
  error?: string;
  timestamp: string;
}

/**
 * 查询指定类型的DNS记录
 */
export async function queryDnsRecord(domain: string, type: DnsRecordType): Promise<DnsQueryResult> {
  const result: DnsQueryResult = {
    domain,
    type,
    success: false,
    timestamp: new Date().toISOString()
  };

  try {
    switch (type) {
      case 'A':
        result.records = await resolve4(domain);
        break;
      case 'AAAA':
        result.records = await resolve6(domain);
        break;
      case 'CNAME':
        result.records = await resolveCname(domain);
        break;
      case 'MX':
        result.records = await resolveMx(domain);
        break;
      case 'NS':
        result.records = await resolveNs(domain);
        break;
      case 'TXT':
        // TXT记录返回的是字符串数组的数组，需要扁平化处理
        const txtRecords = await resolveTxt(domain);
        result.records = txtRecords.map(txt => txt.join(''));
        break;
      case 'SOA':
        result.records = [await resolveSoa(domain)];
        break;
      default:
        throw new Error(`Unsupported DNS record type: ${type}`);
    }
    
    result.success = true;
  } catch (error: any) {
    result.success = false;
    result.error = error.message;
  }

  return result;
}

/**
 * 执行批量DNS查询
 */
export async function batchQueryDnsRecords(domain: string, types: DnsRecordType[]): Promise<DnsQueryResult[]> {
  // 并行查询所有指定类型的DNS记录
  const queryPromises = types.map(type => queryDnsRecord(domain, type));
  return Promise.all(queryPromises);
}

/**
 * 获取所有DNS记录
 */
export async function getAllDnsRecords(domain: string): Promise<DnsQueryResult[]> {
  const allTypes: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA'];
  return batchQueryDnsRecords(domain, allTypes);
}

/**
 * 格式化DNS记录以便于前端显示
 */
export function formatDnsResults(results: DnsQueryResult[]): any[] {
  return results.map(result => {
    // 格式化不同类型的记录
    let formattedRecords: any[] = [];
    
    if (result.success && result.records && result.records.length > 0) {
      switch (result.type) {
        case 'MX':
          // MX记录包含优先级和交换服务器
          formattedRecords = result.records.map((record: any) => ({
            priority: record.priority,
            exchange: record.exchange
          }));
          break;
        
        case 'SOA':
          // SOA记录有特定的结构
          formattedRecords = result.records.map((record: any) => ({
            nsname: record.nsname,
            hostmaster: record.hostmaster,
            serial: record.serial,
            refresh: record.refresh,
            retry: record.retry,
            expire: record.expire,
            minttl: record.minttl
          }));
          break;
        
        default:
          // 其他记录类型可以直接显示
          formattedRecords = result.records;
      }
    }
    
    return {
      type: result.type,
      success: result.success,
      records: formattedRecords,
      error: result.error,
      timestamp: result.timestamp
    };
  });
} 