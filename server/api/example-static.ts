/**
 * 示例API - 使用静态方法
 * 演示使用 ResponseData 静态方法快速返回
 */

import { eventHandler, getQuery } from 'h3';
import { ResponseData } from '../utils/response';
import { sendResponse } from '../utils/api-helpers';

export default eventHandler(async (event) => {
  try {
    // 获取查询参数
    const query = getQuery(event);
    const action = query.action as string;
    
    // 根据不同的操作返回不同的结果
    switch (action) {
      case 'success':
        // 使用静态成功方法
        sendResponse(event, ResponseData.success({
          message: '操作成功完成',
          timestamp: Date.now()
        }, '成功示例'));
        break;
        
      case 'error':
        // 使用静态错误方法
        sendResponse(event, ResponseData.error('操作失败示例', 400));
        break;
        
      default:
        // 使用链式方法
        sendResponse(event, new ResponseData()
          .setCode(200)
          .setMessage('未知操作')
          .setData({
            availableActions: ['success', 'error'],
            currentAction: action || 'none'
          }));
    }
  } catch (error: any) {
    // 错误处理
    sendResponse(event, ResponseData.error(error.message || '服务器内部错误'));
  }
}); 