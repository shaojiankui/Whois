<template>
  <div class="admin-logs-page">
    <div v-if="!isAuthenticated" class="not-authenticated">
      <h1>{{ $t('common.error') }}</h1>
      <p>{{ $t('user.loginRequired') }}</p>
      <div class="form-actions">
        <NuxtLink to="/login" class="btn-primary">{{ $t('common.login') }}</NuxtLink>
      </div>
    </div>

    <div v-else-if="!isAdmin" class="access-denied">
      <h1>{{ $t('common.error') }}</h1>
      <p>访问被拒绝：需要管理员权限</p>
      <div class="form-actions">
        <NuxtLink to="/" class="btn-primary">返回首页</NuxtLink>
      </div>
    </div>

    <div v-else class="logs-container">
      <!-- 统计区域 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ stats.summary?.totalLogs || 0 }}</div>
            <div class="stat-label">总日志数</div>
          </div>
        </div>
        <div class="stat-card error">
          <div class="stat-info">
            <div class="stat-number">{{ stats.summary?.todayErrors || 0 }}</div>
            <div class="stat-label">今日错误</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-info">
            <div class="stat-number">{{ stats.summary?.weekErrors || 0 }}</div>
            <div class="stat-label">本周错误</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ stats.summary?.avgExecutionTime || 0 }}ms</div>
            <div class="stat-label">平均执行时间</div>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选区域 -->
      <div class="search-section">
        <div class="search-controls-inline">
          <div class="search-input-group">
            <div class="search-icon">🔍</div>
            <input v-model="searchQuery" type="text" placeholder="搜索后缀、消息内容..." class="search-input"
              @input="debouncedSearch" @keyup.escape="clearSearch" @keyup.enter="handleSearch">
            <button v-if="searchQuery" @click="clearSearch" class="clear-search">✕</button>
          </div>

          <div class="filter-group">
            <select v-model="logLevelFilter" @change="handleFilterChange" class="filter-select">
              <option value="">所有级别 ({{ pagination.total || 0 }})</option>
              <option value="error">错误</option>
              <option value="warning">警告</option>
              <option value="info">信息</option>
              <option value="debug">调试</option>
            </select>
          </div>

          <div class="filter-group">
            <select v-model="logTypeFilter" @change="handleFilterChange" class="filter-select">
              <option value="">所有类型 ({{ pagination.total || 0 }})</option>
              <option value="whois_query">Whois查询</option>
              <option value="domain_check">域名检查</option>
              <option value="bulk_check">批量检查</option>
              <option value="user_login">用户登录</option>
              <option value="admin_operation">管理操作</option>
              <option value="system_error">系统错误</option>
            </select>
          </div>

          <div class="action-buttons-inline">
            <button @click="handleSearch" class="btn-search">
              <span class="btn-icon">🔍</span>
              搜索
            </button>
            <button @click="resetFilters" class="btn-reset">
              <span class="btn-icon">🔄</span>
              重置
            </button>
          </div>
        </div>

        <!-- 日期筛选 -->
        <div class="date-filter-section">
          <div class="date-filter-inline">
            <div class="date-group">
              <label for="start-date">开始日期:</label>
              <input id="start-date" v-model="startDate" type="datetime-local" class="date-input"
                @change="handleFilterChange">
            </div>
            <div class="date-group">
              <label for="end-date">结束日期:</label>
              <input id="end-date" v-model="endDate" type="datetime-local" class="date-input"
                @change="handleFilterChange">
            </div>
          </div>
        </div>

        <!-- 搜索状态提示 -->
        <div v-if="searchQuery.trim()" class="search-status">
          <div v-if="logs.length > 0" class="search-results">
            <span class="search-icon">✅</span>
            找到 <strong>{{ pagination.total || logs.length }}</strong> 条匹配的日志
            <span class="search-term">关键词: "{{ searchQuery.trim() }}"</span>
          </div>
          <div v-else class="search-no-results">
            <span class="search-icon">❌</span>
            没有找到匹配 <strong>"{{ searchQuery.trim() }}"</strong> 的日志
            <div class="search-tips">
              <span>搜索提示：</span>
              <ul>
                <li>搜索后缀，如: com, org, net</li>
                <li>搜索消息内容关键词</li>
                <li>结合日期范围和级别筛选</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 消息提示 -->
      <div v-if="successMessage" class="message success-message">
        <span class="message-icon">✅</span>
        {{ successMessage }}
        <button @click="successMessage = ''" class="message-close">✕</button>
      </div>

      <div v-if="errorMessage" class="message error-message">
        <span class="message-icon">❌</span>
        {{ errorMessage }}
        <button @click="errorMessage = ''" class="message-close">✕</button>
      </div>

      <!-- 日志列表区域 -->
      <table class="logs-table">
        <thead>
          <tr>
            <th class="col-level">级别</th>
            <th class="col-type">类型</th>
            <th class="col-message">消息</th>
            <th class="col-domain">后缀</th>
            <th class="col-time">执行时间</th>
            <th class="col-ip">IP地址</th>
            <th class="col-created">创建时间</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" class="log-row">
            <td class="log-level">
              <span :class="`level-badge ${log.log_level}`">
                {{ getLevelText(log.log_level) }}
              </span>
            </td>
            <td class="log-type">
              <span class="type-text">{{ getTypeText(log.log_type) }}</span>
            </td>
            <td class="log-message">
              <div class="message-text" :title="log.message">
                {{ truncateText(log.message, 50) }}
              </div>
            </td>
            <td class="log-domain">
              <span v-if="log.tld" class="domain-text">{{ log.tld }}</span>
              <span v-else class="no-domain">-</span>
            </td>
            <td class="log-execution-time">
              <span v-if="log.execution_time" class="time-value">{{ log.execution_time }}ms</span>
              <span v-else class="no-time">-</span>
            </td>
            <td class="log-ip">
              <span class="ip-text">{{ maskIP(log.user_ip) }}</span>
            </td>
            <td class="log-created">
              <div class="datetime-info">
                <div class="date">{{ formatDate(log.created_at) }}</div>
                <div class="time">{{ formatTime(log.created_at) }}</div>
              </div>
            </td>
            <td class="actions">
              <button @click="viewLogDetails(log)" class="btn-action btn-view" title="查看详情">
                <span class="btn-icon">👁️</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="logs.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-title">{{ searchQuery || logLevelFilter || logTypeFilter ? '没有找到匹配的日志' : '暂无日志数据' }}</div>
        <div class="empty-desc">{{ searchQuery || logLevelFilter || logTypeFilter ? '尝试调整搜索条件' : '系统运行正常，暂无错误日志' }}
        </div>
      </div>

      <!-- 分页区域 -->
      <div class="pagination-container">
        <div class="page-size-selector">
          <span class="page-size-label">每页显示:</span>
          <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="page-info">共 {{ pagination.total }} 条记录</span>
        </div>

        <div class="pagination">
          <button @click="goToPage(1)" class="pagination-button" :disabled="currentPage === 1"
            :class="{ 'disabled': currentPage === 1 }" title="首页">
            &laquo;
          </button>

          <button @click="currentPage--" class="pagination-button" :disabled="currentPage === 1"
            :class="{ 'disabled': currentPage === 1 }" title="上一页">
            &lt;
          </button>

          <div class="page-numbers">
            <button v-for="page in getPageNumbers()" :key="page" @click="goToPage(page)" class="page-number-button"
              :class="{ 'active': page === currentPage }">
              {{ page }}
            </button>
          </div>

          <button @click="currentPage++" :disabled="currentPage >= pagination.totalPages" class="pagination-button"
            :class="{ 'disabled': currentPage >= pagination.totalPages }" title="下一页">
            &gt;
          </button>

          <button @click="goToPage(pagination.totalPages)" :disabled="currentPage >= pagination.totalPages"
            class="pagination-button" :class="{ 'disabled': currentPage >= pagination.totalPages }" title="末页">
            &raquo;
          </button>
        </div>
      </div>
    </div>

    <!-- 日志详情模态框 -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3>日志详情</h3>
          <button @click="closeModal" class="modal-close">×</button>
        </div>

        <div class="modal-body" v-if="selectedLog">
          <div class="log-details">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">日志ID：</span>
                  <span class="value">{{ selectedLog.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">级别：</span>
                  <span class="value">
                    <span :class="`level-badge ${selectedLog.log_level}`">
                      {{ getLevelText(selectedLog.log_level) }}
                    </span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">类型：</span>
                  <span class="value">{{ getTypeText(selectedLog.log_type) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">后缀：</span>
                  <span class="value">{{ selectedLog.tld || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">执行时间：</span>
                  <span class="value">{{ selectedLog.execution_time ? selectedLog.execution_time + 'ms' : 'N/A'
                    }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">用户IP：</span>
                  <span class="value">{{ selectedLog.user_ip || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">创建时间：</span>
                  <span class="value">{{ formatDateTime(selectedLog.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>消息内容</h4>
              <div class="message-content">
                {{ selectedLog.message }}
              </div>
            </div>

            <div v-if="selectedLog.error_details" class="detail-section">
              <h4>错误详情</h4>
              <div class="json-content">
                <pre>{{ JSON.stringify(selectedLog.error_details, null, 2) }}</pre>
              </div>
            </div>

            <div v-if="selectedLog.request_data" class="detail-section">
              <h4>请求数据</h4>
              <div class="json-content">
                <pre>{{ JSON.stringify(selectedLog.request_data, null, 2) }}</pre>
              </div>
            </div>

            <div v-if="selectedLog.user_agent" class="detail-section">
              <h4>用户代理</h4>
              <div class="user-agent-content">
                {{ selectedLog.user_agent }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '~/composables/useAuthStore';

// 设置页面布局
// @ts-ignore
definePageMeta({
  layout: 'admin'
});

// 使用Auth Store
const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isLoggedIn);
const isAdmin = computed(() => authStore.isAdmin);

// 数据状态
const logs = ref<any[]>([]);
const stats = ref<any>({});
const searchQuery = ref('');
const logLevelFilter = ref('');
const logTypeFilter = ref('');
const startDate = ref('');
const endDate = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
});

// 模态框状态
const showDetailsModal = ref(false);
const selectedLog = ref<any>(null);

// 消息状态
const successMessage = ref('');
const errorMessage = ref('');
const loading = ref(false);

// 自动隐藏消息
function showSuccessMessage(message: string) {
  successMessage.value = message;
  setTimeout(() => {
    successMessage.value = '';
  }, 5000);
}

function showErrorMessage(message: string) {
  errorMessage.value = message;
  setTimeout(() => {
    errorMessage.value = '';
  }, 8000);
}

// 生命周期
onMounted(async () => {
  await checkAuthentication();
  if (isAuthenticated.value && isAdmin.value) {
    await loadStats();
    await loadLogs();
  }
});

// 方法
async function checkAuthentication() {
  try {
    await authStore.fetchUserInfo();
  } catch (error) {
    console.error('Error checking authentication:', error);
  }
}

async function loadStats() {
  try {
    const response = await fetch('/api/admin/logs/stats', {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        stats.value = data.data;
      }
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadLogs() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString()
    });

    if (searchQuery.value.trim()) {
      params.append('domain', searchQuery.value.trim());
    }
    if (logLevelFilter.value) {
      params.append('logLevel', logLevelFilter.value);
    }
    if (logTypeFilter.value) {
      params.append('logType', logTypeFilter.value);
    }
    if (startDate.value) {
      params.append('startDate', startDate.value);
    }
    if (endDate.value) {
      params.append('endDate', endDate.value);
    }

    const response = await fetch(`/api/admin/logs/list?${params}`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        logs.value = data.data.logs || [];
        pagination.value = data.data.pagination || {};
      } else {
        errorMessage.value = data.message || '加载日志失败';
      }
    } else {
      errorMessage.value = '无法连接到服务器';
    }
  } catch (error) {
    console.error('Error loading logs:', error);
    errorMessage.value = '加载日志时发生错误';
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  loadLogs();
}

// 防抖搜索
let searchTimeout: NodeJS.Timeout | null = null;
function debouncedSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    handleSearch();
  }, 300);
}

function handleFilterChange() {
  currentPage.value = 1;
  loadLogs();
}

function resetFilters() {
  searchQuery.value = '';
  logLevelFilter.value = '';
  logTypeFilter.value = '';
  startDate.value = '';
  endDate.value = '';
  currentPage.value = 1;
  loadLogs();
}

function clearSearch() {
  searchQuery.value = '';
  currentPage.value = 1;
  loadLogs();
}

function handlePageSizeChange() {
  currentPage.value = 1;
  loadLogs();
}

function goToPage(page: number) {
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page;
    loadLogs();
  }
}

function getPageNumbers(): number[] {
  const pages: number[] = [];
  const startPage = Math.max(1, currentPage.value - 2);
  const endPage = Math.min(pagination.value.totalPages, startPage + 4);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
}

function viewLogDetails(log: any) {
  selectedLog.value = log;
  showDetailsModal.value = true;
}

function closeModal() {
  showDetailsModal.value = false;
  selectedLog.value = null;
}

function getLevelText(level: string): string {
  const levels: Record<string, string> = {
    error: '错误',
    warning: '警告',
    info: '信息',
    debug: '调试'
  };
  return levels[level] || level;
}

function getTypeText(type: string): string {
  const types: Record<string, string> = {
    whois_query: 'Whois查询',
    domain_check: '域名检查',
    bulk_check: '批量检查',
    user_login: '用户登录',
    user_register: '用户注册',
    admin_operation: '管理操作',
    system_error: '系统错误',
    api_request: 'API请求'
  };
  return types[type] || type;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('zh-CN');
}

function formatTime(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('zh-CN');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function maskIP(ip: string | undefined): string {
  if (!ip || ip === 'unknown') return 'N/A';
  // 简单的IP掩码，保留前两段
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.**`;
  }
  return ip;
}
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --primary-color: #11fcce;
  --hover-color: #0dd4a8;
  --bg-primary: #1a1a1a;
  --bg-secondary: #f8fafc;
  --card-bg: #ffffff;
  --text-color: #1e293b;
  --text-color-light: #64748b;
  --border-color: #e2e8f0;
  --input-bg: #ffffff;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --info-color: #3b82f6;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* 页面布局 */
.admin-logs-page {
  min-height: 100vh;
  background-color: var(--bg-secondary);
}

.logs-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 统计卡片区域 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-1px);
}

.stat-card.error {
  /* 保持与其他卡片一致的样式 */
}

.stat-card.warning {
  /* 保持与其他卡片一致的样式 */
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
  line-height: 1;
}

.stat-label {
  color: var(--text-color-light);
  font-size: 0.85rem;
  font-weight: 500;
}

/* 搜索区域 */
.search-section {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-controls-inline {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0;
}

.search-input-group {
  position: relative;
  flex: 1;
  min-width: 280px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-light);
  font-size: 0.9rem;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-input::placeholder {
  color: var(--text-color-light);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-color-light);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.clear-search:hover {
  background-color: var(--border-color);
  color: var(--text-color);
}

.filter-group {
  min-width: 180px;
}

.filter-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  background: var(--input-bg);
  color: var(--text-color);
  transition: all 0.2s ease;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.action-buttons-inline {
  display: flex;
  gap: 0.5rem;
}

.btn-search,
.btn-reset {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-search {
  background-color: var(--primary-color);
  color: #111111;
}

.btn-search:hover {
  background-color: var(--hover-color);
  transform: translateY(-1px);
}

.btn-reset {
  background-color: var(--text-color-light);
  color: white;
}

.btn-reset:hover {
  background-color: #475569;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 0.85rem;
}

.date-filter-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.date-filter-inline {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.date-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-group label {
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
}

.date-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.875rem;
  background: var(--input-bg);
  color: var(--text-color);
  transition: all 0.2s ease;
}

.date-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* 搜索状态提示 */
.search-status {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.search-results {
  color: var(--text-color);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.search-no-results {
  color: var(--text-color);
  font-size: 0.9rem;
}

.search-term {
  margin-left: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-light);
  background-color: var(--card-bg);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

.search-tips {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--card-bg);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  text-align: left;
}

.search-tips span {
  font-weight: 600;
  color: var(--text-color);
  display: block;
  margin-bottom: 0.5rem;
}

.search-tips ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--text-color-light);
}

.search-tips li {
  margin-bottom: 0.25rem;
}

/* 消息提示 */
.message {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.message-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: auto;
  border-radius: 4px;
  opacity: 0.7;
  transition: all 0.2s ease;
  font-size: 1.2rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

/* 日志表格 */
.logs-table-container {
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 2rem;
}

.logs-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
  background-color: var(--card-bg);
}

.logs-table thead {
  background-color: var(--bg-secondary);
}

.logs-table th {
  background-color: var(--bg-secondary);
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  color: var(--text-color);
  font-weight: 600;
  font-size: 0.85rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logs-table th:first-child {
  border-top-left-radius: 8px;
}

.logs-table th:last-child {
  border-top-right-radius: 8px;
}

.logs-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  transition: background-color 0.2s ease;
}

.log-row {
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-color);
}

.log-row:hover {
  background-color: var(--bg-secondary);
}

.log-row:last-child td:first-child {
  border-bottom-left-radius: 8px;
}

.log-row:last-child td:last-child {
  border-bottom-right-radius: 8px;
}

/* 表格列宽 */
.col-level {
  width: 8%;
  min-width: 70px;
}

.col-type {
  width: 12%;
  min-width: 100px;
}

.col-message {
  width: 35%;
  min-width: 200px;
}

.col-domain {
  width: 15%;
  min-width: 120px;
}

.col-time {
  width: 10%;
  min-width: 80px;
  text-align: center;
}

.col-ip {
  width: 10%;
  min-width: 90px;
  text-align: center;
}

.col-created {
  width: 12%;
  min-width: 100px;
  text-align: center;
}

.col-actions {
  width: 8%;
  min-width: 70px;
  text-align: center;
}

/* 级别徽章 */
.level-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.level-badge.error {
  background-color: #e3f2fd;
  color: #d32f2f;
}

.level-badge.warning {
  background-color: #fff3e0;
  color: #f57c00;
}

.level-badge.info {
  background-color: #e8f5e8;
  color: #388e3c;
}

.level-badge.debug {
  background-color: #f3f4f6;
  color: #6b7280;
}

/* 表格内容样式 */
.log-level {
  text-align: center;
}

.type-text {
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
}

.message-text {
  font-size: 0.875rem;
  color: var(--text-color);
  line-height: 1.5;
  cursor: pointer;
  transition: color 0.2s ease;
}

.message-text:hover {
  color: var(--primary-color);
}

.domain-text {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-color);
  font-weight: 600;
}

.no-domain,
.no-time {
  color: var(--text-color-light);
  font-style: italic;
  font-size: 0.8rem;
}

.log-execution-time {
  text-align: center;
}

.time-value {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-color);
}

.log-ip {
  text-align: center;
}

.ip-text {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-color);
}

.log-created {
  text-align: center;
}

.datetime-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.datetime-info .date {
  font-size: 0.8rem;
  color: var(--text-color);
  font-weight: 600;
}

.datetime-info .time {
  font-size: 0.75rem;
  color: var(--text-color-light);
}

/* 操作按钮 */
.actions {
  text-align: center;
}

.btn-action {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  margin: 0 auto;
}

.btn-view {
  background-color: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-view:hover {
  background-color: var(--border-color);
}

/* 空状态 */
.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-color-light);
  background: var(--card-bg);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.3;
  display: block;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.75rem;
}

.empty-desc {
  font-size: 0.95rem;
  color: var(--text-color-light);
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.5;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.page-size-label {
  color: var(--text-color);
  font-weight: 600;
  white-space: nowrap;
}

.page-size-select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
}

.page-size-select:focus {
  border-color: var(--primary-color);
  outline: none;
}

.page-info {
  color: var(--text-color-light);
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.pagination-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:hover:not(.disabled) {
  background-color: var(--border-color);
}

.pagination-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number-button:hover {
  background-color: var(--border-color);
}

.page-number-button.active {
  background-color: var(--primary-color);
  color: #111111;
  border-color: var(--primary-color);
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
}

.large-modal {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  background-color: var(--card-bg);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-color-light);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background-color: var(--border-color);
  color: var(--text-color);
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

/* 日志详情 */
.log-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--card-bg);
}

.detail-section h4 {
  margin: 0;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
}

.detail-grid {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item .label {
  font-size: 0.75rem;
  color: var(--text-color-light);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.detail-item .value {
  font-size: 0.9rem;
  color: var(--text-color);
  font-weight: 500;
}

.message-content {
  padding: 1.5rem;
  background: var(--bg-secondary);
  font-size: 0.9rem;
  color: var(--text-color);
  line-height: 1.7;
  white-space: pre-wrap;
  border-radius: 6px;
  margin: 1rem 1.5rem;
  border: 1px solid var(--border-color);
}

.json-content {
  padding: 1.5rem;
  background: #1e293b;
  color: #e2e8f0;
  font-family: monospace;
  font-size: 0.85rem;
  overflow-x: auto;
  border-radius: 6px;
  margin: 1rem 1.5rem;
  border: 1px solid #475569;
}

.json-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.user-agent-content {
  padding: 1.5rem;
  background: var(--bg-secondary);
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--text-color);
  line-height: 1.6;
  word-break: break-all;
  border-radius: 6px;
  margin: 1rem 1.5rem;
  border: 1px solid var(--border-color);
}

/* 认证状态 */
.not-authenticated,
.access-denied {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  max-width: 500px;
  margin: 4rem auto;
}

.not-authenticated h1,
.access-denied h1 {
  color: var(--error-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.not-authenticated p,
.access-denied p {
  color: var(--text-color-light);
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.6;
}

.form-actions {
  display: flex;
  justify-content: center;
}

.btn-primary {
  background-color: var(--primary-color);
  color: #111111;
  padding: 0.875rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: var(--hover-color);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .logs-container {
    max-width: 100%;
    padding: 0;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 968px) {
  .admin-logs-page {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .search-controls-inline {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .search-input-group {
    max-width: none;
    min-width: auto;
  }

  .filter-group {
    min-width: auto;
  }

  .action-buttons-inline {
    justify-content: stretch;
    width: 100%;
  }

  .btn-search,
  .btn-reset {
    flex: 1;
    justify-content: center;
  }

  .date-filter-inline {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .date-group {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .date-group label {
    font-size: 0.8rem;
  }

  .pagination-container {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .pagination {
    justify-content: center;
  }

  .page-size-selector {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .logs-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .logs-table {
    min-width: 800px;
    font-size: 0.85rem;
  }

  .logs-table th,
  .logs-table td {
    padding: 0.75rem 0.5rem;
  }

  .col-level,
  .col-type,
  .col-domain,
  .col-time,
  .col-ip,
  .col-created,
  .col-actions {
    min-width: 80px;
  }

  .col-message {
    min-width: 180px;
  }

  .modal-content {
    margin: 0.5rem;
    max-height: calc(100vh - 1rem);
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }

  .message-content,
  .json-content,
  .user-agent-content {
    margin: 0;
    padding: 1rem;
    font-size: 0.8rem;
  }

  .search-tips ul {
    padding-left: 1rem;
  }
}

@media (max-width: 480px) {
  .admin-logs-page {
    padding: 0.5rem;
  }

  .search-section {
    padding: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .logs-table {
    min-width: 700px;
    font-size: 0.8rem;
  }

  .logs-table th,
  .logs-table td {
    padding: 0.5rem 0.25rem;
  }

  .page-numbers {
    gap: 0.125rem;
  }

  .page-number-button {
    padding: 0.5rem;
    min-width: 36px;
    font-size: 0.8rem;
  }

  .pagination-button {
    padding: 0.5rem;
    font-size: 0.8rem;
    min-width: 36px;
  }

  .btn-action {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }

  .level-badge {
    padding: 0.2rem 0.4rem;
    font-size: 0.65rem;
    min-width: 40px;
  }

  .type-text {
    padding: 0.2rem 0.4rem;
    font-size: 0.75rem;
    min-width: 60px;
  }

  .domain-text,
  .time-value,
  .ip-text {
    padding: 0.2rem 0.4rem;
    font-size: 0.7rem;
  }

  .datetime-info .date {
    font-size: 0.7rem;
  }

  .datetime-info .time {
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;
  }

  .modal-content {
    margin: 0.25rem;
    max-height: calc(100vh - 0.5rem);
  }

  .modal-header h3 {
    font-size: 1rem;
  }

  .detail-section h4 {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
  }

  .detail-item .label {
    font-size: 0.65rem;
  }

  .detail-item .value {
    font-size: 0.8rem;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-title {
    font-size: 1rem;
  }

  .empty-desc {
    font-size: 0.85rem;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-secondary: #1e293b;
    --card-bg: #334155;
    --text-color: #f1f5f9;
    --text-color-light: #94a3b8;
    --border-color: #475569;
    --input-bg: #1e293b;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  :root {
    --border-color: #000000;
    --text-color: #000000;
    --text-color-light: #333333;
  }

  .level-badge,
  .type-text,
  .domain-text,
  .time-value,
  .ip-text {
    border-width: 2px;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }

  .btn-action:hover,
  .pagination-button:hover,
  .page-number-button:hover,
  .btn-search:hover,
  .btn-reset:hover,
  .btn-primary:hover {
    transform: none !important;
  }
}
</style>