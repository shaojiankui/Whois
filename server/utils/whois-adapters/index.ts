import { WhoisResult } from '~/types/domain';
import { JsonWhoisParseHandler } from './json-parse';
import { ParserWhoisAdapter } from './parser-adapter';
import TcpQueryHandler from './tcp-query';
import RdapQueryHandler from './rdap-query';
import { DomainInfo } from '~/types/domain';
import config from '~/config';

/**
 * WHOIS查询处理器接口
 */
export interface WhoisQueryHandler {
  /**
   * 执行WHOIS查询
   * @param domainExtractInfo 要查询的域名信息
   * @param config 查询配置
   * @returns WHOIS查询结果文本
   */
  query(domainExtractInfo: DomainInfo, config?: any): Promise<string>;
}

/**
 * WHOIS解析处理器接口
 */
export interface WhoisParseHandler {
  /**
   * 解析WHOIS响应文本
   * @param domain 查询的域名
   * @param text WHOIS响应文本
   * @param config 解析配置
   * @returns 结构化的WHOIS结果
   */
  parse(domain: string, text: string, config?: any): WhoisResult;
}

/**
 * 查询处理器类型枚举
 */
export enum QueryHandlerType {
  WHOIS = 'whois',
  RDAP = 'rdap'
}

/**
 * 解析处理器类型枚举
 */
export enum ParseHandlerType {
  JSON = 'json',
  PARSER = 'parser' 
}

// 查询处理器注册表
export const queryHandlers: Record<string, WhoisQueryHandler> = {
  [QueryHandlerType.WHOIS]: TcpQueryHandler,
  [QueryHandlerType.RDAP]: RdapQueryHandler
};

// 解析处理器注册表
export const parseHandlers: Record<string, WhoisParseHandler> = {
  [ParseHandlerType.JSON]: new JsonWhoisParseHandler(),
  [ParseHandlerType.PARSER]: new ParserWhoisAdapter()
};

/**
 * 注册WHOIS查询处理器
 * @param name 处理器名称
 * @param handler 查询处理器实例
 */
export function registerQueryHandler(name: string, handler: WhoisQueryHandler): void {
  queryHandlers[name] = handler;
  console.log(`Registered query handler: ${name}`);
}

/**
 * 注册WHOIS解析处理器
 * @param name 处理器名称
 * @param handler 解析处理器实例
 */
export function registerParseHandler(name: string, handler: WhoisParseHandler): void {
  parseHandlers[name] = handler;
  console.log(`Registered parse handler: ${name}`);
}

/**
 * 获取WHOIS查询处理器
 * @param name 处理器名称
 * @returns 查询处理器实例
 */
export function getQueryHandler(name: string): WhoisQueryHandler | undefined {
  return queryHandlers[name];
}

/**
 * 获取WHOIS解析处理器
 * @param name 处理器名称
 * @returns 解析处理器实例
 */
export function getParseHandler(name: string): WhoisParseHandler | undefined {
  return parseHandlers[name];
}

/**
 * 初始化WHOIS适配器系统
 */
export function initWhoisAdapters(): void {
  // 注册默认处理器
  registerQueryHandler(QueryHandlerType.WHOIS, TcpQueryHandler);
  registerQueryHandler(QueryHandlerType.RDAP, RdapQueryHandler);
  registerParseHandler(ParseHandlerType.JSON, new JsonWhoisParseHandler());
  registerParseHandler(ParseHandlerType.PARSER, new ParserWhoisAdapter());
  
  console.log('WHOIS适配器系统已初始化');
  console.log('✅ 全局配置：'+JSON.stringify(config));
} 