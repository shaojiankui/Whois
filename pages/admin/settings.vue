<template>
  <div class="admin-settings-page">
    <div class="settings-container">
      <div class="coming-soon-card">
        <div class="icon">⚙️</div>
        <h2>系统设置</h2>
        <p>系统设置功能正在开发中，敬请期待！</p>
        <div class="features-preview">
          <h3>即将推出的功能：</h3>
          <ul>
            <li>基本系统配置</li>
            <li>邮件服务设置</li>
            <li>缓存配置</li>
            <li>安全设置</li>
            <li>API限流配置</li>
            <li>备份和恢复</li>
          </ul>
        </div>
        <NuxtLink to="/admin" class="back-button">返回管理首页</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 设置页面布局
definePageMeta({
  layout: 'admin'
});
</script>

<style scoped>
.admin-settings-page {
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.settings-container {
  max-width: 600px;
  width: 100%;
}

.coming-soon-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.coming-soon-card h2 {
  color: var(--text-color);
  margin-bottom: 1rem;
  font-size: 2rem;
}

.coming-soon-card > p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.features-preview {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.features-preview h3 {
  color: var(--text-color);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.features-preview ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-preview li {
  color: var(--text-secondary);
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color-light);
  position: relative;
  padding-left: 1.5rem;
}

.features-preview li:last-child {
  border-bottom: none;
}

.features-preview li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: bold;
}

.back-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background-color: var(--primary-hover);
}

@media (max-width: 768px) {
  .admin-settings-page {
    padding: 1rem;
  }
  
  .coming-soon-card {
    padding: 2rem;
  }
  
  .icon {
    font-size: 3rem;
  }
  
  .coming-soon-card h2 {
    font-size: 1.5rem;
  }
}
</style> 