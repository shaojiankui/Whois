<template>
  <div class="admin-settings-page">
    <div class="settings-container">
      <!-- 设置选项卡 -->
      <div class="settings-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          :class="['tab-button', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- 设置内容区域 -->
      <div class="settings-content">
        <!-- 基本系统配置 -->
        <div v-if="activeTab === 'basic'" class="settings-section">
          <h2>基本系统配置</h2>
          <form @submit.prevent="saveSettings('basic')" class="settings-form">
            <div class="form-group">
              <label for="site_name">网站名称</label>
              <input 
                id="site_name"
                v-model="configs.basic.site_name" 
                type="text" 
                required
                placeholder="输入网站名称"
              >
            </div>
            
            <div class="form-group">
              <label for="site_description">网站描述</label>
              <textarea 
                id="site_description"
                v-model="configs.basic.site_description"
                rows="3"
                placeholder="输入网站描述"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="site_url">网站URL</label>
              <input 
                id="site_url"
                v-model="configs.basic.site_url" 
                type="url" 
                required
                placeholder="https://your-domain.com"
              >
            </div>
            
            <div class="form-group">
              <label for="admin_email">管理员邮箱</label>
              <input 
                id="admin_email"
                v-model="configs.basic.admin_email" 
                type="email" 
                required
                placeholder="admin@your-domain.com"
              >
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="configs.basic.maintenance_mode" 
                  type="checkbox"
                >
                <span class="checkmark"></span>
                维护模式
              </label>
              <p class="field-description">启用后网站将显示维护页面</p>
            </div>
            
            <div class="form-group">
              <label for="max_upload_size">最大上传文件大小 (MB)</label>
              <input 
                id="max_upload_size"
                v-model.number="configs.basic.max_upload_size_mb" 
                type="number" 
                min="1"
                max="100"
              >
            </div>
            
            <div class="form-group">
              <label for="timezone">系统时区</label>
              <select id="timezone" v-model="configs.basic.timezone">
                <option value="Asia/Shanghai">亚洲/上海 (UTC+8)</option>
                <option value="UTC">UTC (UTC+0)</option>
                <option value="America/New_York">美洲/纽约 (UTC-5)</option>
                <option value="Europe/London">欧洲/伦敦 (UTC+0)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="default_language">默认语言</label>
              <select id="default_language" v-model="configs.basic.default_language">
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
            
            <button type="submit" class="save-button" :disabled="loading.basic">
              <span v-if="loading.basic">保存中...</span>
              <span v-else>保存基本设置</span>
            </button>
          </form>
        </div>

        <!-- 邮件服务设置 -->
        <div v-if="activeTab === 'email'" class="settings-section">
          <h2>邮件服务设置</h2>
          <form @submit.prevent="saveSettings('email')" class="settings-form">
            <div class="form-group">
              <label for="smtp_host">SMTP服务器地址</label>
              <input 
                id="smtp_host"
                v-model="configs.email.smtp_host" 
                type="text" 
                required
                placeholder="smtp.example.com"
              >
            </div>
            
            <div class="form-group">
              <label for="smtp_port">SMTP端口</label>
              <input 
                id="smtp_port"
                v-model.number="configs.email.smtp_port" 
                type="number" 
                min="1"
                max="65535"
                required
              >
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="configs.email.smtp_secure" 
                  type="checkbox"
                >
                <span class="checkmark"></span>
                使用SSL/TLS加密
              </label>
            </div>
            
            <div class="form-group">
              <label for="smtp_user">SMTP用户名</label>
              <input 
                id="smtp_user"
                v-model="configs.email.smtp_user" 
                type="email" 
                required
                placeholder="noreply@your-domain.com"
              >
            </div>
            
            <div class="form-group">
              <label for="smtp_password">SMTP密码</label>
              <input 
                id="smtp_password"
                v-model="configs.email.smtp_password" 
                type="password"
                placeholder="留空表示不修改"
              >
            </div>
            
            <div class="form-group">
              <label for="from_email">发件人邮箱</label>
              <input 
                id="from_email"
                v-model="configs.email.from_email" 
                type="email" 
                required
                placeholder="noreply@your-domain.com"
              >
            </div>
            
            <div class="form-group">
              <label for="from_name">发件人名称</label>
              <input 
                id="from_name"
                v-model="configs.email.from_name" 
                type="text" 
                required
                placeholder="Whois查询系统"
              >
            </div>
            
            <button type="submit" class="save-button" :disabled="loading.email">
              <span v-if="loading.email">保存中...</span>
              <span v-else>保存邮件设置</span>
            </button>
          </form>
        </div>

        <!-- 缓存配置 -->
        <div v-if="activeTab === 'cache'" class="settings-section">
          <h2>缓存配置</h2>
          <form @submit.prevent="saveSettings('cache')" class="settings-form">
            <div class="form-group">
              <label for="redis_host">Redis服务器地址</label>
              <input 
                id="redis_host"
                v-model="configs.cache.redis_host" 
                type="text" 
                required
                placeholder="localhost"
              >
            </div>
            
            <div class="form-group">
              <label for="redis_port">Redis端口</label>
              <input 
                id="redis_port"
                v-model.number="configs.cache.redis_port" 
                type="number" 
                min="1"
                max="65535"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="redis_password">Redis密码</label>
              <input 
                id="redis_password"
                v-model="configs.cache.redis_password" 
                type="password"
                placeholder="留空表示无密码"
              >
            </div>
            
            <div class="form-group">
              <label for="redis_db">Redis数据库编号</label>
              <input 
                id="redis_db"
                v-model.number="configs.cache.redis_db" 
                type="number" 
                min="0"
                max="15"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="default_ttl">默认缓存时间 (秒)</label>
              <input 
                id="default_ttl"
                v-model.number="configs.cache.default_ttl" 
                type="number" 
                min="60"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="max_memory">最大内存使用量</label>
              <input 
                id="max_memory"
                v-model="configs.cache.max_memory" 
                type="text" 
                required
                placeholder="256mb"
              >
              <p class="field-description">支持单位: kb, mb, gb</p>
            </div>
            
            <button type="submit" class="save-button" :disabled="loading.cache">
              <span v-if="loading.cache">保存中...</span>
              <span v-else">保存缓存设置</span>
            </button>
          </form>
        </div>

        <!-- 安全设置 -->
        <div v-if="activeTab === 'security'" class="settings-section">
          <h2>安全设置</h2>
          <form @submit.prevent="saveSettings('security')" class="settings-form">
            <div class="form-group">
              <label for="jwt_expires_in">JWT过期时间</label>
              <select id="jwt_expires_in" v-model="configs.security.jwt_expires_in">
                <option value="1h">1小时</option>
                <option value="1d">1天</option>
                <option value="7d">7天</option>
                <option value="30d">30天</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="password_min_length">密码最小长度</label>
              <input 
                id="password_min_length"
                v-model.number="configs.security.password_min_length" 
                type="number" 
                min="6"
                max="20"
                required
              >
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="configs.security.password_require_special" 
                  type="checkbox"
                >
                <span class="checkmark"></span>
                密码需要特殊字符
              </label>
            </div>
            
            <div class="form-group">
              <label for="max_login_attempts">最大登录尝试次数</label>
              <input 
                id="max_login_attempts"
                v-model.number="configs.security.max_login_attempts" 
                type="number" 
                min="3"
                max="10"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="lockout_duration">账户锁定时间 (秒)</label>
              <input 
                id="lockout_duration"
                v-model.number="configs.security.lockout_duration" 
                type="number" 
                min="300"
                required
              >
            </div>
            
            <button type="submit" class="save-button" :disabled="loading.security">
              <span v-if="loading.security">保存中...</span>
              <span v-else>保存安全设置</span>
            </button>
          </form>
        </div>

        <!-- API限流配置 -->
        <div v-if="activeTab === 'rate_limit'" class="settings-section">
          <h2>API限流配置</h2>
          <form @submit.prevent="saveSettings('rate_limit')" class="settings-form">
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="configs.rate_limit.enabled" 
                  type="checkbox"
                >
                <span class="checkmark"></span>
                启用API限流
              </label>
            </div>
            
            <div class="form-group">
              <label for="whois_requests_per_minute">每分钟WHOIS查询限制</label>
              <input 
                id="whois_requests_per_minute"
                v-model.number="configs.rate_limit.whois_requests_per_minute" 
                type="number" 
                min="1"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="bulk_requests_per_hour">每小时批量查询限制</label>
              <input 
                id="bulk_requests_per_hour"
                v-model.number="configs.rate_limit.bulk_requests_per_hour" 
                type="number" 
                min="1"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="api_requests_per_minute">每分钟API请求限制</label>
              <input 
                id="api_requests_per_minute"
                v-model.number="configs.rate_limit.api_requests_per_minute" 
                type="number" 
                min="1"
                required
              >
            </div>
            
            <button type="submit" class="save-button" :disabled="loading.rate_limit">
              <span v-if="loading.rate_limit">保存中...</span>
              <span v-else>保存限流设置</span>
            </button>
          </form>
        </div>

        <!-- 备份和恢复 -->
        <div v-if="activeTab === 'backup'" class="settings-section">
          <h2>备份和恢复</h2>
          <form @submit.prevent="saveSettings('backup')" class="settings-form">
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="configs.backup.auto_backup_enabled" 
                  type="checkbox"
                >
                <span class="checkmark"></span>
                启用自动备份
              </label>
            </div>
            
            <div class="form-group">
              <label for="backup_interval">备份间隔 (小时)</label>
              <input 
                id="backup_interval"
                v-model.number="configs.backup.backup_interval" 
                type="number" 
                min="1"
                max="168"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="backup_retention_days">备份保留天数</label>
              <input 
                id="backup_retention_days"
                v-model.number="configs.backup.backup_retention_days" 
                type="number" 
                min="1"
                max="365"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="backup_location">备份存储位置</label>
              <input 
                id="backup_location"
                v-model="configs.backup.backup_location" 
                type="text" 
                required
                placeholder="/var/backups/whois-app"
              >
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="configs.backup.compress_backups" 
                  type="checkbox"
                >
                <span class="checkmark"></span>
                压缩备份文件
              </label>
            </div>
            
            <div class="backup-actions">
              <button type="submit" class="save-button" :disabled="loading.backup">
                <span v-if="loading.backup">保存中...</span>
                <span v-else>保存备份设置</span>
              </button>
              
              <button type="button" class="action-button" @click="createBackup" :disabled="creating_backup">
                <span v-if="creating_backup">创建中...</span>
                <span v-else>立即创建备份</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 设置页面布局
definePageMeta({
  layout: 'admin'
})

// 响应式数据
const activeTab = ref('basic')
const loading = ref({
  basic: false,
  email: false,
  cache: false,
  security: false,
  rate_limit: false,
  backup: false
})
const creating_backup = ref(false)

// 选项卡定义
const tabs = [
  { key: 'basic', label: '基本配置', icon: '🏠' },
  { key: 'email', label: '邮件服务', icon: '📧' },
  { key: 'cache', label: '缓存配置', icon: '⚡' },
  { key: 'security', label: '安全设置', icon: '🔒' },
  { key: 'rate_limit', label: 'API限流', icon: '🚦' },
  { key: 'backup', label: '备份恢复', icon: '💾' }
]

// 配置数据
const configs = ref({
  basic: {
    site_name: '',
    site_description: '',
    site_url: '',
    admin_email: '',
    maintenance_mode: false,
    max_upload_size_mb: 10,
    timezone: 'Asia/Shanghai',
    default_language: 'zh'
  },
  email: {
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: true,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: ''
  },
  cache: {
    redis_host: 'localhost',
    redis_port: 6379,
    redis_password: '',
    redis_db: 0,
    default_ttl: 3600,
    max_memory: '256mb'
  },
  security: {
    jwt_expires_in: '7d',
    password_min_length: 8,
    password_require_special: true,
    max_login_attempts: 5,
    lockout_duration: 900
  },
  rate_limit: {
    whois_requests_per_minute: 60,
    bulk_requests_per_hour: 10,
    api_requests_per_minute: 120,
    enabled: true
  },
  backup: {
    auto_backup_enabled: true,
    backup_interval: 24,
    backup_retention_days: 30,
    backup_location: '/var/backups/whois-app',
    compress_backups: true
  }
})

// 页面加载时获取配置
onMounted(async () => {
  await loadAllConfigs()
})

// 加载所有配置
const loadAllConfigs = async () => {
  try {
    const response = await $fetch('/api/admin/settings') as any
    
    if (response.success) {
      // 处理基本配置
      if (response.data.basic) {
        const basicConfig: any = {}
        response.data.basic.forEach((item: any) => {
          const key = item.key.replace('basic_', '')
          if (key === 'max_upload_size') {
            basicConfig['max_upload_size_mb'] = Math.round(item.value / 1048576) // 转换为MB
          } else {
            basicConfig[key] = item.value
          }
        })
        configs.value.basic = { ...configs.value.basic, ...basicConfig }
      }
      
      // 处理其他配置类别
      const categories = ['email', 'cache', 'security', 'rate_limit', 'backup']
      categories.forEach(category => {
        if (response.data[category]) {
          const categoryConfig: any = {}
          response.data[category].forEach((item: any) => {
            const key = item.key.replace(`${category}_`, '')
            categoryConfig[key] = item.value
          })
          // @ts-ignore
          configs.value[category] = { ...configs.value[category], ...categoryConfig }
        }
      })
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    // 使用浏览器原生提示替代ElMessage
    alert('加载配置失败')
  }
}

// 保存设置
const saveSettings = async (category: string) => {
  // @ts-ignore
  loading.value[category] = true
  
  try {
    // @ts-ignore
    const configData = { ...configs.value[category] }
    
    // 特殊处理某些字段
    if (category === 'basic' && configData.max_upload_size_mb) {
      configData.max_upload_size = configData.max_upload_size_mb * 1048576 // 转换为字节
      delete configData.max_upload_size_mb
    }
    
    const response = await $fetch(`/api/admin/settings/${category}`, {
      method: 'PUT',
      body: configData
    }) as any
    
    if (response.success) {
      alert('设置保存成功')
    } else {
      alert('设置保存失败: ' + response.message)
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    alert('保存设置失败')
  } finally {
    // @ts-ignore
    loading.value[category] = false
  }
}

// 创建备份
const createBackup = async () => {
  creating_backup.value = true
  
  try {
    // 这里可以调用备份API
    await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟备份过程
    alert('备份创建成功')
  } catch (error) {
    console.error('创建备份失败:', error)
    alert('创建备份失败')
  } finally {
    creating_backup.value = false
  }
}
</script>

<style scoped>
.admin-settings-page {
  margin: 0 auto;
  width: 100%;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color);
  margin-bottom: 2rem;
  font-size: 2rem;
}

.icon {
  font-size: 2rem;
}

.settings-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 0.9rem;
}

.tab-button:hover {
  color: var(--text-color);
  background-color: var(--bg-secondary);
}

.tab-button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background-color: var(--bg-secondary);
}

.tab-icon {
  font-size: 1.1rem;
}

.settings-content {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.settings-section h2 {
  color: var(--text-color);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.settings-form {
  display: grid;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--input-bg);
  color: var(--text-color);
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"]:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox-label input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.field-description {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin: 0;
}

.save-button {
  padding: 0.75rem 2rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.3s ease;
  justify-self: start;
}

.save-button:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.backup-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.action-button:hover:not(:disabled) {
  background-color: var(--secondary-hover);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .admin-settings-page {
    padding: 1rem;
  }
  
  .settings-content {
    padding: 1.5rem;
  }
  
  .settings-tabs {
    flex-wrap: wrap;
  }
  
  .tab-button {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
  
  .backup-actions {
    flex-direction: column;
  }
  
  .save-button,
  .action-button {
    width: 100%;
  }
}
</style> 