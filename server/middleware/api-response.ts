/**
 * API响应中间件
 * 处理所有API响应，确保返回格式统一
 */

import { defineEventHandler, getResponseStatus, H3Event } from 'h3'
import { ResponseData } from '../utils/response'

export default defineEventHandler(async (event) => {
  // 只处理API路由下的请求
  if (!event.path.startsWith('/api/')) {
    return
  }
  
  // 监听响应结束事件，确保未使用ResponseData格式的响应也能被处理
  event.node.res.on('beforeSend', (body) => {
    // 如果已经是ResponseData或被处理过，则跳过
    if (typeof body === 'string' && body.includes('"code":')) {
      try {
        const parsed = JSON.parse(body)
        if (parsed && typeof parsed === 'object' && 'code' in parsed) {
          return body
        }
      } catch (e) {
        // 解析失败，继续处理
      }
    }
    
    // 获取状态码
    const statusCode = getResponseStatus(event) || 200
    
    // 处理不同状态码
    if (statusCode >= 400) {
      // 错误响应
      const errorMessage = typeof body === 'string' ? body : 
                         (body && typeof body === 'object' && 'message' in body) ? 
                          body.message : '请求失败'
      
      return JSON.stringify(
        ResponseData.error(errorMessage, statusCode).toJSON()
      )
    } else {
      // 成功响应
      return JSON.stringify(
        ResponseData.success(body, '请求成功').toJSON()
      )
    }
  })
}); 