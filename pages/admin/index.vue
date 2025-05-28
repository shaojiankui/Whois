<template>
  <div class="admin-dashboard">
    <!-- 权限检查中 -->
    <div v-if="!isAuthorized && !authError" class="auth-checking">
      <div class="loading-spinner"></div>
      <p>正在验证权限...</p>
    </div>
    
    <!-- 权限错误 -->
    <div v-else-if="authError" class="auth-error">
      <div class="error-icon">🚫</div>
      <h2>{{ authError }}</h2>
      <p>您没有访问此页面的权限。如果您认为这是一个错误，请联系管理员。</p>
      <NuxtLink to="/" class="back-button">返回首页</NuxtLink>
    </div>
    
    <!-- 管理员界面 -->
    <div v-else>
      <!-- 统计面板 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
            <div class="stat-change">+{{ stats.newUsersToday }} 今日新增</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🌍</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.supportedTlds }}</div>
            <div class="stat-label">支持的TLD</div>
            <div class="stat-change">{{ stats.enabledTlds }} 已启用</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🔍</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalQueries }}</div>
            <div class="stat-label">总查询次数</div>
            <div class="stat-change">+{{ stats.queriesToday }} 今日查询</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.avgResponseTime }}ms</div>
            <div class="stat-label">平均响应时间</div>
            <div class="stat-change" :class="{ positive: stats.responseTimeChange > 0, negative: stats.responseTimeChange < 0 }">
              {{ stats.responseTimeChange > 0 ? '+' : '' }}{{ stats.responseTimeChange }}%
            </div>
          </div>
        </div>
      </div>
      
      <!-- 最近活动 -->
      <div class="recent-activity">
        <h2>最近活动</h2>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon">👤</div>
            <div class="activity-content">
              <div class="activity-title">新用户注册</div>
              <div class="activity-desc">用户 "testuser" 完成注册</div>
              <div class="activity-time">2分钟前</div>
            </div>
          </div>
          
          
          <div class="activity-item">
            <div class="activity-icon">🌍</div>
            <div class="activity-content">
              <div class="activity-title">TLD配置更新</div>
              <div class="activity-desc">更新了 ".com" 的Whois服务器配置</div>
              <div class="activity-time">1小时前</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/composables/useAuthStore';

// 设置页面布局
definePageMeta({
  layout: 'admin'
});

// 权限检查
const authStore = useAuthStore();
const router = useRouter();
const isAuthorized = ref(false);
const authError = ref('');

// 检查权限
const checkPermissions = async () => {
  try {
    // 首先尝试获取用户信息
    const result = await authStore.fetchUserInfo();
    
    if (!result.success) {
      console.log('User not logged in, redirecting to login...');
      router.push('/login');
      return;
    }
    
    console.log('Current user:', authStore.user.value);
    console.log('User ID:', authStore.user.value?.id);
    console.log('Is admin:', authStore.isAdmin);
    
    // 检查是否为管理员
    if (!authStore.isAdmin) {
      authError.value = '访问被拒绝：需要管理员权限';
      console.error('Access denied: user is not admin');
      return;
    }
    
    // 通过所有检查
    isAuthorized.value = true;
    console.log('Admin access granted');
    
  } catch (error) {
    console.error('Permission check failed:', error);
    authError.value = '权限检查失败';
  }
};

// 在客户端检查权限
onMounted(() => {
  if (process.client) {
    checkPermissions();
  }
});

// 统计数据 - 修复类型定义
const stats = ref({
  totalUsers: 0,
  supportedTlds: 0,
  totalQueries: 0,
  newUsersToday: 0,
  enabledTlds: 0,
  queriesToday: 0,
  avgResponseTime: 250,
  responseTimeChange: 5
});

// 最近活动
const recentActivity = ref<Array<{
  id: number;
  icon: string;
  title: string;
  time: string;
}>>([]);

// 加载统计数据
const loadStats = async () => {
  try {
    // 加载用户统计
    const userResponse = await fetch('/api/admin/user/stats');
    if (userResponse.ok) {
      const userData = await userResponse.json();
      stats.value.totalUsers = userData.data.totalUsers || 0;
      stats.value.totalQueries = userData.data.totalQueries || 0;
      stats.value.queriesToday = userData.data.todayQueries || 0;
      stats.value.newUsersToday = userData.data.newUsersToday || 0;
    }
    
    // 加载TLD统计
    const tldResponse = await fetch('/api/admin/tld/list');
    if (tldResponse.ok) {
      const tldData = await tldResponse.json();
      const totalTlds = tldData.data.length || 0;
      stats.value.supportedTlds = totalTlds;
      stats.value.enabledTlds = tldData.data.filter((tld: any) => tld.enabled).length || 0;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

// 格式化时间
const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString('zh-CN');
};

// 组件挂载时加载数据
onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: var(--body-bg);
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--text-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: var(--card-shadow);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 3rem;
  margin-right: 1rem;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--muted-text);
  font-size: 0.9rem;
}

.quick-nav,
.recent-activity {
  margin-bottom: 3rem;
}

.quick-nav h2,
.recent-activity h2 {
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.nav-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.2s ease;
  box-shadow: var(--card-shadow);
  display: block;
}

.nav-card:hover:not(.disabled) {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.nav-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.nav-description {
  color: var(--muted-text);
  font-size: 0.9rem;
}

.activity-list {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: var(--muted-text);
  font-size: 0.8rem;
}

.no-activity {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  color: var(--muted-text);
  box-shadow: var(--card-shadow);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .nav-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}

.auth-checking {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  p {
    color: var(--text-color);
    font-size: 1.1rem;
  }
}

.auth-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  padding: 2rem;
  
  .error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  h2 {
    color: var(--error-color);
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  
  p {
    color: var(--text-color);
    margin-bottom: 2rem;
    max-width: 500px;
    line-height: 1.6;
  }
  
  .back-button {
    background-color: var(--primary-color);
    color: #000;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: var(--hover-color);
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 