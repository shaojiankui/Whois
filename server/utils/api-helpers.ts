/**
 * API 辅助工具
 * 提供统一的 API 响应处理方法
 */

import { H3Event, eventHandler } from 'h3';
import { ResponseData } from './response';

/**
 * 发送响应
 * @param event H3事件
 * @param responseData 响应数据对象
 */
export function sendResponse(event: H3Event, responseData: ResponseData): void {
  event.node.res.setHeader('Content-Type', 'application/json');
  event.node.res.statusCode = responseData.code >= 400 ? responseData.code : 200;
  event.node.res.end(responseData.toString());
}

/**
 * 发送成功响应
 * @param event H3事件
 * @param data 数据
 * @param message 消息
 */
export function sendSuccess(event: H3Event, data: any = null, message: string = '操作成功'): void {
  sendResponse(event, ResponseData.success(data, message));
}

/**
 * 发送错误响应
 * @param event H3事件
 * @param message 错误消息
 * @param code 错误码
 */
export function sendError(event: H3Event, message: string = '操作失败', code: number = 500): void {
  sendResponse(event, ResponseData.error(message, code));
}

/**
 * 创建API处理器
 * 自动处理异常，并包装响应
 */
export function createApiHandler(handler: (event: H3Event) => Promise<ResponseData>) {
  return eventHandler(async (event: H3Event) => {
    try {
      const result = await handler(event);
      sendResponse(event, result);
    } catch (error: any) {
      console.error('API错误:', error);
      sendError(event, error.message || '服务器内部错误');
    }
  });
} 