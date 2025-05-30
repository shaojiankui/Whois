import { SystemConfigModel } from '~/server/models/systemConfig'
import { requireAdmin } from '~/server/utils/admin'

export default defineEventHandler(async (event) => {
  try {
    // 验证管理员权限
    await requireAdmin(event)

    const category = getRouterParam(event, 'category')
    if (!category) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少配置类别参数'
      })
    }

    // 验证类别是否有效
    const validCategories = ['basic', 'email', 'cache', 'security', 'rate_limit', 'backup']
    if (!validCategories.includes(category)) {
      throw createError({
        statusCode: 400,
        statusMessage: '无效的配置类别'
      })
    }

    const body = await readBody(event)
    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        statusMessage: '无效的请求数据'
      })
    }

    const configModel = new SystemConfigModel()
    
    // 批量更新配置
    const results = []
    for (const [key, value] of Object.entries(body)) {
      // 构建完整的配置键名
      const fullKey = `${category}_${key}`
      
      // 确定值的类型
      let configType = 'string'
      let configValue = String(value)
      
      if (typeof value === 'number') {
        configType = 'number'
      } else if (typeof value === 'boolean') {
        configType = 'boolean'
        configValue = value ? 'true' : 'false'
      } else if (typeof value === 'object' && value !== null) {
        configType = 'json'
        configValue = JSON.stringify(value)
      }

      try {
        // 首先尝试更新
        const updated = await configModel.updateConfig(fullKey, configValue, configType)
        
        if (!updated) {
          // 如果更新失败，尝试创建新配置
          const created = await configModel.createConfig(
            fullKey, 
            configValue, 
            category, 
            configType,
            `${category}配置项: ${key}`
          )
          
          if (!created) {
            throw new Error(`配置项 ${key} 更新失败`)
          }
        }
        
        results.push({ key, success: true })
      } catch (error: any) {
        console.error(`更新配置项 ${key} 失败:`, error)
        results.push({ key, success: false, error: error.message })
      }
    }

    // 检查是否有失败的配置项
    const failedItems = results.filter(r => !r.success)
    if (failedItems.length > 0) {
      return {
        success: false,
        message: `${failedItems.length} 个配置项更新失败`,
        data: results
      }
    }

    return {
      success: true,
      message: '配置更新成功',
      data: results
    }
  } catch (error: any) {
    console.error(`更新${getRouterParam(event, 'category')}配置失败:`, error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || '更新配置失败'
    })
  }
}) 