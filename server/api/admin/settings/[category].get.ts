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

    const configModel = new SystemConfigModel()
    
    // 获取指定类别的配置
    let configs
    switch (category) {
      case 'basic':
        configs = await configModel.getBasicConfig()
        break
      case 'email':
        configs = await configModel.getEmailConfig()
        break
      case 'cache':
        configs = await configModel.getCacheConfig()
        break
      case 'security':
        configs = await configModel.getSecurityConfig()
        break
      case 'rate_limit':
        configs = await configModel.getRateLimitConfig()
        break
      case 'backup':
        configs = await configModel.getBackupConfig()
        break
      default:
        configs = await configModel.getConfigsByCategory(category)
    }

    return {
      success: true,
      data: configs
    }
  } catch (error: any) {
    console.error(`获取${getRouterParam(event, 'category')}配置失败:`, error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || '获取配置失败'
    })
  }
}) 