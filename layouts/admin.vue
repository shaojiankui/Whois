<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo-section">
          <NuxtLink to="/" class="logo-link">
            <div class="logo-icon">🌐</div>
            <span v-if="!sidebarCollapsed" class="logo-text">{{ $t('common.title') }}</span>
          </NuxtLink>
        </div>
        <button @click="toggleSidebar" class="sidebar-toggle">
          <span class="toggle-icon">{{ sidebarCollapsed ? '→' : '←' }}</span>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div v-if="!sidebarCollapsed" class="nav-title">{{ $t('admin.dashboard') }}</div>
          <ul class="nav-list">
            <li class="nav-item">
              <NuxtLink to="/admin" class="nav-link" :class="{ active: $route.path === '/admin' }">
                <span class="nav-icon">📊</span>
                <span v-if="!sidebarCollapsed" class="nav-text">{{ $t('admin.overview') }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
        
        <div class="nav-section">
          <div v-if="!sidebarCollapsed" class="nav-title">{{ $t('admin.management') }}</div>
          <ul class="nav-list">
            <li class="nav-item">
              <NuxtLink to="/admin/users" class="nav-link" :class="{ active: $route.path === '/admin/users' }">
                <span class="nav-icon">👥</span>
                <span v-if="!sidebarCollapsed" class="nav-text">{{ $t('admin.userManagement') }}</span>
              </NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink to="/admin/tlds" class="nav-link" :class="{ active: $route.path === '/admin/tlds' }">
                <span class="nav-icon">🌍</span>
                <span v-if="!sidebarCollapsed" class="nav-text">{{ $t('admin.tldManagement') }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
        
        <div class="nav-section">
          <div v-if="!sidebarCollapsed" class="nav-title">{{ $t('admin.system') }}</div>
          <ul class="nav-list">
            <li class="nav-item">
              <NuxtLink to="/admin/settings" class="nav-link" :class="{ active: $route.path === '/admin/settings' }">
                <span class="nav-icon">⚙️</span>
                <span v-if="!sidebarCollapsed" class="nav-text">{{ $t('admin.systemSettings') }}</span>
              </NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink to="/admin/logs" class="nav-link" :class="{ active: $route.path === '/admin/logs' }">
                <span class="nav-icon">📋</span>
                <span v-if="!sidebarCollapsed" class="nav-text">{{ $t('admin.systemLogs') }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
      
      <!-- 底部用户信息 -->
      <div class="sidebar-footer">
        <div class="admin-user-info">
          <div class="user-avatar">
            <span class="avatar-text">{{ adminInitial }}</span>
          </div>
          <div v-if="!sidebarCollapsed" class="user-details">
            <div class="user-name">{{ adminName }}</div>
            <div class="user-role">{{ $t('admin.administrator') }}</div>
          </div>
        </div>
        <div class="footer-actions">
          <NuxtLink to="/" class="action-btn" :title="$t('common.backToSite')">
            <span class="action-icon">🏠</span>
            <span v-if="!sidebarCollapsed" class="action-text">{{ $t('common.backToSite') }}</span>
          </NuxtLink>
          <button @click="handleLogout" class="action-btn" :title="$t('common.logout')">
            <span class="action-icon">🚪</span>
            <span v-if="!sidebarCollapsed" class="action-text">{{ $t('common.logout') }}</span>
          </button>
        </div>
      </div>
    </aside>
    
    <!-- 主要内容区域 -->
    <main class="admin-main" :class="{ 'main-expanded': sidebarCollapsed }">
      <!-- 顶部栏 -->
      <header class="admin-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">{{ $t('admin.adminPanel') }}</span>
            <span class="breadcrumb-separator">></span>
            <span class="breadcrumb-item current">{{ pageTitle }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="header-actions">
            <!-- 语言切换 -->
            <div class="language-switcher">
              <select v-model="$i18n.locale" @change="changeLanguage" class="lang-select">
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <!-- 主题切换 -->
            <button @click="toggleTheme" class="theme-toggle" :title="$t('common.toggleTheme')">
              <span>{{ isDarkMode ? '☀️' : '🌙' }}</span>
            </button>
          </div>
        </div>
      </header>
      
      <!-- 页面内容 -->
      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '~/composables/useAuthStore';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();

// 侧边栏状态
const sidebarCollapsed = ref(false);

// 主题状态
const isDarkMode = ref(false);

// 计算属性
const adminName = computed(() => authStore.user.value?.username || 'Admin');
const adminInitial = computed(() => {
  const name = adminName.value;
  return name ? name.charAt(0).toUpperCase() : 'A';
});

const pageTitle = computed(() => {
  const path = router.currentRoute.value.path;
  switch (path) {
    case '/admin':
      return t('admin.overview');
    case '/admin/users':
      return t('admin.userManagement');
    case '/admin/tlds':
      return t('admin.tldManagement');
    case '/admin/settings':
      return t('admin.systemSettings');
    case '/admin/logs':
      return t('admin.systemLogs');
    default:
      return t('admin.overview');
  }
});

// 生命周期
onMounted(() => {
  // 检查本地存储的侧边栏状态（仅在客户端）
  if (process.client) {
    try {
      const savedSidebarState = window.localStorage.getItem('admin-sidebar-collapsed');
      if (savedSidebarState) {
        sidebarCollapsed.value = JSON.parse(savedSidebarState);
      }
      
      // 检查主题设置
      const savedTheme = window.localStorage.getItem('theme');
      isDarkMode.value = savedTheme === 'dark';
      if (isDarkMode.value) {
        window.document.documentElement.classList.add('dark');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }
});

// 方法
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  if (process.client) {
    try {
      window.localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(sidebarCollapsed.value));
    } catch (error) {
      console.error('Error saving sidebar state:', error);
    }
  }
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  if (process.client) {
    try {
      if (isDarkMode.value) {
        window.document.documentElement.classList.add('dark');
        window.localStorage.setItem('theme', 'dark');
      } else {
        window.document.documentElement.classList.remove('dark');
        window.localStorage.setItem('theme', 'light');
      }
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  }
}

function changeLanguage() {
  // 语言切换由i18n自动处理
}

async function handleLogout() {
  try {
    await authStore.logout();
    router.push('/');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
}

/* 侧边栏样式 */
.admin-sidebar {
  width: 240px;
  background-color: var(--card-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 100;
  transition: width 0.3s ease;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px; /* 固定高度，包含border */
  box-sizing: border-box;
}

.logo-section {
  flex: 1;
  min-width: 0; /* 防止flex item溢出 */
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-color);
}

.logo-icon {
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-toggle {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background-color: var(--bg-secondary);
  color: var(--text-color);
}

.toggle-icon {
  font-size: 0.9rem;
  transition: transform 0.3s ease;
}

/* 导航样式 */
.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-title {
  padding: 0 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.3s ease;
  border-radius: 0;
  position: relative;
}

.nav-link:hover {
  background-color: var(--bg-secondary);
  color: var(--primary-color);
}

.nav-link.active {
  background-color: var(--primary-color);
  color: white;
}

.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: var(--primary-hover);
}

.nav-icon {
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
}

.nav-text {
  font-weight: 500;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.sidebar-collapsed .sidebar-footer {
  padding: 1rem 0.5rem;
}

.admin-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sidebar-collapsed .admin-user-info {
  justify-content: center;
  margin-bottom: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-collapsed .user-avatar {
  width: 32px;
  height: 32px;
}

.avatar-text {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.sidebar-collapsed .avatar-text {
  font-size: 0.9rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
}

.sidebar-collapsed .footer-actions {
  flex-direction: column;
  gap: 0.375rem;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-color);
  text-decoration: none;
  flex: 1;
  justify-content: center;
  font-size: 0.85rem;
  min-height: 36px;
}

.sidebar-collapsed .action-btn {
  padding: 0.5rem;
  min-width: 40px;
  width: 40px;
  height: 40px;
  flex: none;
  justify-content: center;
  gap: 0;
  border-radius: 8px;
}

.sidebar-collapsed .action-btn .action-text {
  display: none;
}

.action-btn:hover {
  background-color: var(--bg-secondary);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-collapsed .action-btn:hover {
  transform: scale(1.05);
}

.action-icon {
  font-size: 1rem;
}

.sidebar-collapsed .action-icon {
  font-size: 1.1rem;
}

/* 主内容区域 */
.admin-main {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.main-expanded {
  margin-left: 60px;
}

.admin-header {
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72px; /* 固定高度，与sidebar-header相同 */
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 90;
}

.header-left {
  flex: 1;
}

.page-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.breadcrumb-item {
  color: var(--text-secondary);
}

.breadcrumb-item.current {
  color: var(--primary-color);
  font-weight: 500;
}

.breadcrumb-separator {
  color: var(--text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.language-switcher .lang-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--input-bg);
  color: var(--text-color);
  cursor: pointer;
}

.theme-toggle {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.2rem;
}

.theme-toggle:hover {
  background-color: var(--bg-secondary);
  border-color: var(--primary-color);
}

.admin-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    width: 240px;
  }
  
  .admin-sidebar.sidebar-open {
    transform: translateX(0);
  }
  
  .admin-main {
    margin-left: 0;
  }
  
  .main-expanded {
    margin-left: 0;
  }
  
  .admin-header {
    padding: 1rem;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .header-actions {
    gap: 0.5rem;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
}

/* 暗色主题支持 */
:global(.dark) .admin-sidebar {
  background-color: #1a1b1e;
  border-right-color: #2d2e32;
}

:global(.dark) .sidebar-header {
  border-bottom-color: #2d2e32;
}

:global(.dark) .nav-link:hover {
  background-color: #2d2e32;
}

:global(.dark) .sidebar-footer {
  border-top-color: #2d2e32;
}

:global(.dark) .admin-header {
  background-color: #1a1b1e;
  border-bottom-color: #2d2e32;
}
</style> 