import { SystemConfigModel } from '~/server/models/systemConfig'
import { requireAdmin } from '~/server/utils/admin'

export default defineEventHandler(async (event) => {
  try {
    // 验证管理员权限
    await requireAdmin(event)

    const configModel = new SystemConfigModel()
    
    // 获取所有配置项，按类别分组
    const configs = await configModel.getAllConfigs()
    
    // 按类别分组
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = []
      }
      acc[config.category].push({
        key: config.config_key,
        value: configModel.parseConfigValue(config),
        type: config.config_type,
        description: config.description,
        created_at: config.created_at,
        updated_at: config.updated_at
      })
      return acc
    }, {} as Record<string, any[]>)

    return {
      success: true,
      data: groupedConfigs
    }
  } catch (error: any) {
    console.error('获取系统设置失败:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || '获取系统设置失败'
    })
  }
}) 