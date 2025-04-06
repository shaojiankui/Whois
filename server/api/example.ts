/**
 * 示例API
 * 演示使用 ResponseData 链式返回
 */

import { eventHandler, getQuery } from 'h3';
import { ResponseData } from '../utils/response';
import { createApiHandler } from '../utils/api-helpers';

export default createApiHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const name = query.name || 'Guest';
  
  // 使用链式调用返回数据
  return new ResponseData()
    .setCode(200)
    .setMessage('欢迎使用API')
    .setData({
      greeting: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      query: query
    });
}); 