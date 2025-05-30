<template>
  <div class="admin-users-page">
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
    
    <div v-else class="users-container">
      <!-- 统计区域 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ users.length }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ getTodayRegistrations() }}</div>
            <div class="stat-label">今日注册</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ getThisMonthRegistrations() }}</div>
            <div class="stat-label">本月注册</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ getActiveUsers() }}</div>
            <div class="stat-label">活跃用户</div>
          </div>
        </div>
      </div>
      
      <!-- 操作和搜索区域 -->
      <div class="search-section">
        <div class="search-controls-inline">
          <div class="search-input-group">
            <div class="search-icon">🔍</div>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索用户名、邮箱或姓名..." 
              class="search-input"
              @input="handleSearch"
            >
            <button v-if="searchQuery" @click="clearSearch" class="clear-search">✕</button>
          </div>
          
          <div class="filter-group">
            <select v-model="userFilter" @change="handleFilterChange" class="filter-select">
              <option value="all">所有用户</option>
              <option value="recent">最近注册</option>
              <option value="active">活跃用户</option>
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
      </div>
      
      <!-- 消息提示 -->
      <div v-if="successMessage" class="message success-message">
        <span class="message-icon">✅</span>
        {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="message error-message">
        <span class="message-icon">❌</span>
        {{ errorMessage }}
      </div>
      
      <!-- 用户列表区域 -->
      <table class="users-table">
        <thead>
          <tr>
            <th class="col-user">用户信息</th>
            <th class="col-time">注册时间</th>
            <th class="col-activity">活动信息</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="user.id" class="user-row">
            <td class="user-info">
              <div class="user-details">
                <span class="username">{{ user.username }}</span>
                <span class="user-separator">|</span>
                <span class="email">{{ user.email }}</span>
              </div>
            </td>
            <td class="reg-time">
              <div class="time-info">
                <span class="datetime">{{ formatDateShort(user.reg_time) }} {{ formatTimeShort(user.reg_time) }}</span>
              </div>
            </td>
            <td class="activity-info">
              <div class="activity-compact">
                <span class="activity-separator">|</span>
                <span class="activity-item">
                  <span class="activity-label">IP:</span>
                  <span class="activity-value">{{ maskIP(user.last_ip) }}</span>
                </span>
              </div>
            </td>
            <td class="actions">
              <div class="action-buttons">
                <button @click="viewUser(user)" class="btn-action btn-view" title="查看详情">
                  <span class="btn-icon">👁️</span>
                </button>
                <button @click="editUser(user)" class="btn-action btn-edit" title="编辑用户">
                  <span class="btn-icon">✏️</span>
                </button>
                <button @click="deleteUser(user)" class="btn-action btn-delete" title="删除用户">
                  <span class="btn-icon">🗑️</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <div class="empty-icon">👤</div>
        <div class="empty-title">{{ searchQuery ? '没有找到匹配的用户' : '暂无用户数据' }}</div>
        <div class="empty-desc">{{ searchQuery ? '尝试调整搜索条件' : '等待用户注册' }}</div>
      </div>
      
      <!-- 分页区域 -->
      <div class="pagination-container">
        <div class="page-size-selector">
          <span class="page-size-label">每页显示:</span>
          <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="page-info">共 {{ filteredUsers.length }} 条记录</span>
        </div>
        
        <div class="pagination">
          <button 
            @click="goToPage(1)" 
            class="pagination-button" 
            :disabled="currentPage === 1"
            :class="{ 'disabled': currentPage === 1 }"
            title="首页"
          >
            &laquo;
          </button>
          
          <button 
            @click="currentPage--" 
            class="pagination-button" 
            :disabled="currentPage === 1"
            :class="{ 'disabled': currentPage === 1 }"
            title="上一页"
          >
            &lt;
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in getPageNumbers()" 
              :key="page"
              @click="goToPage(page)" 
              class="page-number-button"
              :class="{ 'active': page === currentPage }"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            @click="currentPage++" 
            :disabled="currentPage >= totalPages"
            class="pagination-button"
            :class="{ 'disabled': currentPage >= totalPages }"
            title="下一页"
          >
            &gt;
          </button>
          
          <button 
            @click="goToPage(totalPages)" 
            :disabled="currentPage >= totalPages"
            class="pagination-button"
            :class="{ 'disabled': currentPage >= totalPages }"
            title="末页"
          >
            &raquo;
          </button>
        </div>
        
        <div class="page-jumper">
          <span class="page-jumper-label">跳转到:</span>
          <input 
            v-model="jumpPage" 
            @keyup.enter="jumpToPage"
            type="number" 
            :min="1" 
            :max="totalPages"
            class="page-input"
          >
          <button @click="jumpToPage" class="jump-button">确定</button>
        </div>
      </div>
    </div>
    
    <!-- 用户详情模态框 -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3>用户详情</h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <div class="modal-user-details" v-if="selectedUser">
          <div class="details-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">用户ID：</span>
                <span class="value">{{ selectedUser.id }}</span>
              </div>
              <div class="detail-item">
                <span class="label">用户名：</span>
                <span class="value">{{ selectedUser.username }}</span>
              </div>
              <div class="detail-item">
                <span class="label">邮箱：</span>
                <span class="value">{{ selectedUser.email }}</span>
              </div>
              <div class="detail-item">
                <span class="label">真实姓名：</span>
                <span class="value">{{ selectedUser.name || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">注册时间：</span>
                <span class="value">{{ formatDate(selectedUser.reg_time) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">最后更新：</span>
                <span class="value">{{ formatDate(selectedUser.update_time) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">注册IP：</span>
                <span class="value">{{ maskIP(selectedUser.reg_ip) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">最后登录IP：</span>
                <span class="value">{{ maskIP(selectedUser.last_ip) }}</span>
              </div>
            </div>
          </div>
          
          <div class="details-section">
            <h4>用户偏好设置</h4>
            <div class="preferences">
              <div v-if="userPreferences.length === 0" class="no-preferences">
                <p>暂无偏好设置</p>
              </div>
              <div v-else class="preference-list">
                <div v-for="pref in userPreferences" :key="pref.id" class="preference-item">
                  <div class="pref-key">{{ pref.preference_key }}</div>
                  <div class="pref-value">{{ pref.preference_value }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 编辑用户模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑用户</h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <form @submit.prevent="saveUser" class="user-form">
          <div class="form-group">
            <label for="edit-username">用户名</label>
            <input 
              id="edit-username"
              v-model="editFormData.username" 
              type="text" 
              required
              disabled
            >
            <small class="form-note">用户名不可修改</small>
          </div>
          
          <div class="form-group">
            <label for="edit-email">邮箱</label>
            <input 
              id="edit-email"
              v-model="editFormData.email" 
              type="email" 
              required
            >
          </div>
          
          <div class="form-group">
            <label for="edit-name">真实姓名</label>
            <input 
              id="edit-name"
              v-model="editFormData.name" 
              type="text" 
            >
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModals" class="btn-outline">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
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
const users = ref<any[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const userFilter = ref('all');
const jumpPage = ref(1);

// 用户详情相关
const selectedUser = ref<any>(null);
const userPreferences = ref<any[]>([]);

// 消息状态
const successMessage = ref('');
const errorMessage = ref('');

// 模态框状态
const showViewModal = ref(false);
const showEditModal = ref(false);
const saving = ref(false);

// 编辑表单数据
const editFormData = ref({
  id: null,
  username: '',
  email: '',
  name: ''
});

// 计算属性
const filteredUsers = computed(() => {
  if (!searchQuery.value) {
    return users.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    (user.name || '').toLowerCase().includes(query)
  );
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredUsers.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / pageSize.value);
});

// 生命周期
onMounted(async () => {
  await checkAuthentication();
  if (isAuthenticated.value && isAdmin.value) {
    await loadUsers();
  }
});

// 方法
async function checkAuthentication() {
  try {
    // 使用authStore获取用户信息
    await authStore.fetchUserInfo();
  } catch (error) {
    console.error('Error checking authentication:', error);
  }
}

async function loadUsers() {
  loading.value = true;
  try {
    const response = await fetch('/api/admin/user/list', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        users.value = data.data || [];
      } else {
        errorMessage.value = data.message || '加载用户列表失败';
      }
    } else {
      errorMessage.value = '无法连接到服务器';
    }
  } catch (error) {
    console.error('Error loading users:', error);
    errorMessage.value = '加载用户列表时发生错误';
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1; // 重置到第一页
}

function getTodayRegistrations(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return users.value.filter(user => {
    const regDate = new Date(user.reg_time);
    return regDate >= today;
  }).length;
}

function getThisMonthRegistrations(): number {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return users.value.filter(user => {
    const regDate = new Date(user.reg_time);
    return regDate >= firstDay;
  }).length;
}

function getActiveUsers(): number {
  // 定义活跃用户为有查询记录的用户
  return users.value.filter(user => (user.query_count || 0) > 0).length;
}

function clearSearch() {
  searchQuery.value = '';
  currentPage.value = 1;
}

function resetFilters() {
  searchQuery.value = '';
  userFilter.value = 'all';
  currentPage.value = 1;
  jumpPage.value = 1;
}

function handleFilterChange() {
  currentPage.value = 1;
}

function handlePageSizeChange() {
  currentPage.value = 1;
}

function formatDateShort(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('zh-CN');
}

function formatTimeShort(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function getPageNumbers(): number[] {
  const pages: number[] = [];
  const startPage = Math.max(1, currentPage.value - 2);
  const endPage = Math.min(totalPages.value, startPage + 4);
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return pages;
}

function jumpToPage() {
  const page = Number(jumpPage.value);
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

async function viewUser(user: any) {
  selectedUser.value = user;
  showViewModal.value = true;
  
  // 加载用户偏好设置
  await loadUserPreferences(user.id);
}

async function loadUserPreferences(userId: number) {
  try {
    const response = await fetch(`/api/admin/user/${userId}/preferences`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        userPreferences.value = data.data || [];
      }
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }
}

function editUser(user: any) {
  editFormData.value = {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name || ''
  };
  showEditModal.value = true;
}

async function saveUser() {
  if (saving.value) return;
  
  saving.value = true;
  errorMessage.value = '';
  
  try {
    const response = await fetch(`/api/admin/user/modify/${editFormData.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email: editFormData.value.email,
        name: editFormData.value.name
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        successMessage.value = `用户 "${editFormData.value.username}" 更新成功`;
        closeModals();
        await loadUsers();
        setTimeout(() => { successMessage.value = ''; }, 3000);
      } else {
        errorMessage.value = data.message || '保存失败';
      }
    } else {
      errorMessage.value = '保存操作失败';
    }
  } catch (error) {
    console.error('Error saving user:', error);
    errorMessage.value = '保存用户信息时发生错误';
  } finally {
    saving.value = false;
  }
}

async function deleteUser(user: any) {
  const shouldDelete = process.client ? (globalThis as any).confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复！`) : true;
  if (!shouldDelete) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/user/delete/${user.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        successMessage.value = `用户 "${user.username}" 删除成功`;
        await loadUsers();
        setTimeout(() => { successMessage.value = ''; }, 3000);
      } else {
        errorMessage.value = data.message || '删除失败';
      }
    } else {
      errorMessage.value = '删除操作失败';
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    errorMessage.value = '删除用户时发生错误';
  }
}

function closeModals() {
  showViewModal.value = false;
  showEditModal.value = false;
  selectedUser.value = null;
  userPreferences.value = [];
  
  // 重置编辑表单
  editFormData.value = {
    id: null,
    username: '',
    email: '',
    name: ''
  };
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

function maskIP(ip: string | undefined): string {
  if (!ip) return 'N/A';
  // Simple IP masking, keep first segment, replace others with *
  return ip.split('.').map((segment, index) => index === 0 ? segment : '*').join('.');
}
</script>

<style scoped>
/* 管理页面样式 */
.admin-users-page {
  min-height: 100vh;
}

/* 权限检查状态 */
.not-authenticated,
.access-denied {
  text-align: center;
  padding: 3rem;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.users-container {
  max-width: 1400px;
  margin: 0 auto;
}

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
}

.stat-label {
  color: var(--text-color-light);
  font-size: 0.85rem;
}

/* 搜索区域样式 */
.search-section {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.search-controls-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-input-group {
  flex: 1;
  min-width: 280px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-color-light);
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.search-input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: var(--text-color-light);
}

.filter-group {
  flex: 0 0 auto;
  min-width: 150px;
}

.filter-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
  cursor: pointer;
}

.filter-select:focus {
  border-color: var(--primary-color);
  outline: none;
}

.action-buttons-inline {
  flex: 0 0 auto;
  display: flex;
  gap: 0.5rem;
}

.btn-search {
  padding: 0.75rem 1.25rem;
  background-color: var(--primary-color);
  color: #111111;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.btn-search:hover:not(:disabled) {
  background-color: var(--hover-color);
  transform: translateY(-1px);
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  margin-right: 0.5rem;
}

.btn-reset {
  padding: 0.75rem 1.25rem;
  background-color: var(--primary-color);
  color: #111111;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.btn-reset:hover:not(:disabled) {
  background-color: var(--hover-color);
  transform: translateY(-1px);
}

.btn-reset:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 表格样式 */
.users-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8rem;
  background-color: var(--card-bg);
  overflow-x: auto;
  margin-bottom: 2rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.users-table th {
  background-color: var(--bg-secondary);
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  color: var(--text-color);
  font-weight: 600;
  font-size: 0.85rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.users-table th:first-child {
  border-top-left-radius: 8px;
}

.users-table th:last-child {
  border-top-right-radius: 8px;
}

.users-table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 8px;
}

.users-table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 8px;
}

.users-table td {
  padding: 0.75rem 0.5rem;
  color: var(--text-color);
  vertical-align: middle;
  transition: background-color 0.2s ease;
}

/* 列宽度定义 */
.col-id {
  width: 6%;
  min-width: 60px;
}

.col-user {
  width: 40%;
  min-width: 280px;
}

.col-time {
  width: 18%;
  min-width: 140px;
}

.col-activity {
  width: 20%;
  min-width: 160px;
}

.col-actions {
  width: 16%;
  min-width: 110px;
  text-align: center;
}

.user-row {
  border-bottom: 1px solid var(--border-color);
}

.user-row:hover {
  background-color: var(--bg-secondary);
}

.user-id {
  font-weight: 600;
  text-align: center;
}

.id-badge {
  background-color: var(--primary-color);
  color: #111111;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #111111;
  font-weight: bold;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
}

.username {
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
}

.user-separator {
  color: var(--text-color-light);
  margin: 0 0.25rem;
}

.email {
  color: var(--text-color-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.name {
  color: var(--text-color-light);
  font-style: italic;
  white-space: nowrap;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.datetime {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.activity-info {
  display: flex;
  align-items: center;
}

.activity-compact {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
}

.activity-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
}

.activity-label {
  color: var(--text-color-light);
  font-size: 0.75rem;
}

.activity-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
}

.activity-separator {
  display: none;
}

.actions {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 0.3rem;
  justify-content: center;
}

.btn-action {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.btn-view {
  background-color: #17a2b8;
  color: white;
}

.btn-view:hover {
  background-color: #138496;
  transform: translateY(-1px);
}

.btn-edit {
  background-color: var(--primary-color);
  color: #111111;
}

.btn-edit:hover {
  background-color: var(--hover-color);
  transform: translateY(-1px);
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--text-color-light);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.empty-desc {
  font-size: 0.9rem;
}

.pagination-container {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .pagination-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-size-label {
  font-weight: 600;
  white-space: nowrap;
  color: var(--text-color);
}

.page-size-select {
  padding: 0.4rem 0.8rem;
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

.page-jumper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-jumper-label {
  font-weight: 600;
  white-space: nowrap;
  color: var(--text-color);
}

.page-input {
  width: 60px;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
  text-align: center;
}

.page-input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.page-input::-webkit-inner-spin-button,
.page-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-input {
  -moz-appearance: textfield;
}

.jump-button {
  padding: 0.4rem 0.8rem;
  background-color: var(--primary-color);
  color: #111111;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.jump-button:hover {
  background-color: var(--hover-color);
}

.message {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.message-icon {
  font-size: 1.1rem;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.large-modal {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
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
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: var(--border-color);
  color: var(--text-color);
}

/* 用户详情样式 */
.modal-user-details {
  padding: 1.5rem;
}

.details-section {
  margin-bottom: 2rem;
}

.details-section h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: 1.1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-item .label {
  font-weight: 600;
  color: var(--text-color-light);
  min-width: 120px;
}

.detail-item .value {
  color: var(--text-color);
  text-align: right;
  flex: 1;
}

.preferences {
  max-height: 300px;
  overflow-y: auto;
}

.no-preferences {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-light);
}

.preference-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--bg-secondary);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.pref-key {
  font-weight: 500;
  color: var(--text-color);
}

.pref-value {
  color: var(--text-color-light);
  font-size: 0.9rem;
}

/* 用户表单样式 */
.user-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(17, 252, 212, 0.1);
}

.form-group input:disabled {
  background-color: var(--bg-secondary);
  color: var(--text-color-light);
  cursor: not-allowed;
}

.form-note {
  display: block;
  margin-top: 0.25rem;
  color: var(--text-color-light);
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: #111111;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--hover-color);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-outline:hover {
  background-color: var(--bg-secondary);
  border-color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-controls-inline {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .search-input-group {
    min-width: auto;
    width: 100%;
  }
  
  .filter-group {
    min-width: auto;
    width: 100%;
  }
  
  .action-buttons-inline {
    width: 100%;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .btn-search,
  .btn-reset {
    flex: 1;
    justify-content: center;
    min-width: auto;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
    max-height: 95vh;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .detail-item .value {
    text-align: left;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .users-table {
    font-size: 0.8rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .col-time,
  .col-activity,
  .col-actions {
    min-width: auto;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  
  .user-info {
    gap: 0.5rem;
  }
  
  .activity-compact {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
  
  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
  
  .activity-separator {
    display: none;
  }
  
  .activity-label {
    font-size: 0.75rem;
  }
  
  .activity-value {
    font-size: 0.8rem;
  }
  
  .action-buttons {
    gap: 0.3rem;
  }
  
  .btn-action {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .users-table {
    font-size: 0.75rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.5rem 0.3rem;
  }
  
  .user-details {
    gap: 0.1rem;
  }
  
  .username {
    font-size: 0.85rem;
  }
  
  .email,
  .name {
    font-size: 0.75rem;
  }
  
  .datetime {
    font-size: 0.8rem;
  }
}
</style> 