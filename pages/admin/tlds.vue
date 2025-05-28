<template>
  <div class="admin-tlds-page">
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
    
    <div v-else class="tlds-container">
      <!-- 统计区域 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🌍</div>
            <div class="stat-info">
              <div class="stat-number">{{ tlds.length }}</div>
              <div class="stat-label">总TLD数量</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <div class="stat-number">{{ getTldCountByStatus(true) }}</div>
              <div class="stat-label">已启用</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">❌</div>
            <div class="stat-info">
              <div class="stat-number">{{ getTldCountByStatus(false) }}</div>
              <div class="stat-label">已禁用</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔄</div>
            <div class="stat-info">
              <div class="stat-number">{{ getTldCountByType('gTLD') }}</div>
              <div class="stat-label">通用域名</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作和搜索区域 -->
      <div class="search-section">
        <div class="section-header">
          <h3 class="section-title">TLD管理</h3>
          <div class="section-actions">
            <button @click="showAddModal = true" class="btn-add">
              <span class="btn-icon">➕</span>
              添加TLD
            </button>
          </div>
        </div>
        <div class="search-controls">
          <div class="search-input-group">
            <div class="search-icon">🔍</div>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索TLD名称、服务器或类型..." 
              class="search-input"
              @input="handleSearch"
            >
            <button v-if="searchQuery" @click="clearSearch" class="clear-search">✕</button>
          </div>
          <div class="search-filters">
            <select v-model="currentFilter" @change="handleFilterChange" class="filter-select">
              <option value="all">全部类型 ({{ filteredTlds.length }})</option>
              <option value="gTLD">通用顶级域 ({{ getTldCountByType('gTLD') }})</option>
              <option value="ccTLD">国家顶级域 ({{ getTldCountByType('ccTLD') }})</option>
              <option value="newgTLD">新通用顶级域 ({{ getTldCountByType('newgTLD') }})</option>
            </select>
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
      
      <!-- TLD列表区域 -->
      <div class="list-section">
        <div class="list-header">
          <div class="list-title">
            <span>TLD列表</span>
            <span class="list-count">({{ filteredTlds.length }} 个TLD)</span>
          </div>
          <div class="list-actions">
            <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
              <option :value="10">10条/页</option>
              <option :value="25">25条/页</option>
              <option :value="50">50条/页</option>
              <option :value="100">100条/页</option>
            </select>
          </div>
        </div>
        
        <div class="tlds-table-container">
          <table class="tlds-table">
            <thead>
              <tr>
                <th class="col-tld">TLD</th>
                <th class="col-type">类型</th>
                <th class="col-servers">服务器配置</th>
                <th class="col-handler">查询方式</th>
                <th class="col-status">状态</th>
                <th class="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tld in paginatedTlds" :key="tld.name" class="tld-row">
                <td class="tld-name">
                  <div class="tld-display">
                    <span class="tld-text">.{{ tld.name }}</span>
                  </div>
                </td>
                <td class="tld-type">
                  <span :class="`type-badge ${tld.type?.toLowerCase()}`">
                    {{ tld.type }}
                  </span>
                </td>
                <td class="servers-info">
                  <div class="server-item" v-if="tld.whois_server">
                    <span class="server-label">Whois:</span>
                    <span class="server-value">{{ tld.whois_server }}</span>
                  </div>
                  <div class="server-item" v-if="tld.rdap_server">
                    <span class="server-label">RDAP:</span>
                    <span class="server-value">{{ tld.rdap_server }}</span>
                  </div>
                  <div v-if="!tld.whois_server && !tld.rdap_server" class="server-empty">
                    未配置服务器
                  </div>
                </td>
                <td class="query-handler">
                  <span :class="`handler-badge ${tld.query_handler?.toLowerCase() || 'tcp'}`">
                    {{ tld.query_handler || 'TCP' }}
                  </span>
                </td>
                <td class="status">
                  <span :class="`status-badge ${tld.enabled ? 'enabled' : 'disabled'}`">
                    <span class="status-icon">{{ tld.enabled ? '✅' : '❌' }}</span>
                    {{ tld.enabled ? '启用' : '禁用' }}
                  </span>
                </td>
                <td class="actions">
                  <div class="action-buttons">
                    <button @click="editTld(tld)" class="btn-action btn-edit" title="编辑TLD">
                      <span class="btn-icon">✏️</span>
                    </button>
                    <button @click="deleteTld(tld)" class="btn-action btn-delete" title="删除TLD">
                      <span class="btn-icon">🗑️</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="filteredTlds.length === 0" class="empty-state">
            <div class="empty-icon">🌍</div>
            <div class="empty-title">{{ searchQuery ? '没有找到匹配的TLD' : '暂无TLD数据' }}</div>
            <div class="empty-desc">{{ searchQuery ? '尝试调整搜索条件' : '点击上方按钮添加TLD' }}</div>
          </div>
        </div>
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
          <span class="page-info">共 {{ filteredTlds.length }} 条记录</span>
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
    
    <!-- 添加/编辑 TLD 模态框 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? '添加 TLD' : '编辑 TLD' }}</h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <form @submit.prevent="saveTld" class="tld-form">
          <div class="form-group">
            <label for="tld-name">TLD 名称</label>
            <input 
              id="tld-name"
              v-model="formData.name" 
              type="text" 
              placeholder="例如: com"
              required
              :disabled="showEditModal"
            >
          </div>
          
          <div class="form-group">
            <label for="tld-type">类型</label>
            <select id="tld-type" v-model="formData.type" required>
              <option value="">请选择类型</option>
              <option value="gTLD">通用顶级域 (gTLD)</option>
              <option value="ccTLD">国家顶级域 (ccTLD)</option>
              <option value="newgTLD">新通用顶级域 (newgTLD)</option>
              <option value="sTLD">特殊顶级域 (sTLD)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="whois-server">Whois 服务器</label>
            <input 
              id="whois-server"
              v-model="formData.whois_server" 
              type="text" 
              placeholder="例如: whois.verisign-grs.com"
            >
          </div>
          
          <div class="form-group">
            <label for="rdap-server">RDAP 服务器</label>
            <input 
              id="rdap-server"
              v-model="formData.rdap_server" 
              type="text" 
              placeholder="例如: rdap.verisign.com"
            >
          </div>
          
          <div class="form-group">
            <label for="query-handler">查询方式</label>
            <select id="query-handler" v-model="formData.query_handler">
              <option value="tcp">TCP Whois</option>
              <option value="rdap">RDAP</option>
              <option value="web">Web 爬取</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="parser-script">解析器脚本</label>
            <input 
              id="parser-script"
              v-model="formData.parser_script_path" 
              type="text" 
              placeholder="例如: parsers/com.js"
            >
          </div>
          
          <div class="form-group">
            <label for="availability-pattern">可用性检查模式</label>
            <input 
              id="availability-pattern"
              v-model="formData.availability_check_pattern" 
              type="text" 
              placeholder="例如: No Match|Available"
            >
          </div>
          
          <div class="form-group checkbox-group">
            <label>
              <input 
                v-model="formData.enabled" 
                type="checkbox"
              >
              启用此 TLD
            </label>
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
const tlds = ref<any[]>([]);
const searchQuery = ref('');
const currentFilter = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const jumpPage = ref(1);

// 消息状态
const successMessage = ref('');
const errorMessage = ref('');

// 模态框状态
const showAddModal = ref(false);
const showEditModal = ref(false);
const saving = ref(false);
const editingTld = ref<any>(null);

// 表单数据
const formData = ref({
  name: '',
  type: '',
  whois_server: '',
  rdap_server: '',
  query_handler: 'tcp',
  parser_script_path: '',
  availability_check_pattern: '',
  enabled: true
});

// 计算属性
const filteredTlds = computed(() => {
  let filtered = tlds.value;
  
  // 按搜索查询过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(tld => 
      tld.name.toLowerCase().includes(query) ||
      (tld.whois_server || '').toLowerCase().includes(query) ||
      (tld.type || '').toLowerCase().includes(query)
    );
  }
  
  // 按类型过滤
  if (currentFilter.value !== 'all') {
    filtered = filtered.filter(tld => tld.type === currentFilter.value);
  }
  
  return filtered;
});

const paginatedTlds = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTlds.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredTlds.value.length / pageSize.value);
});

// 生命周期
onMounted(async () => {
  await checkAuthentication();
  if (isAuthenticated.value && isAdmin.value) {
    await loadTlds();
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

async function loadTlds() {
  try {
    const response = await fetch('/api/admin/tld/list', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        tlds.value = data.data || [];
      } else {
        errorMessage.value = data.message || '加载 TLD 列表失败';
      }
    } else {
      errorMessage.value = '无法连接到服务器';
    }
  } catch (error) {
    console.error('Error loading TLDs:', error);
    errorMessage.value = '加载 TLD 列表时发生错误';
  }
}

function getTldCountByType(type: string): number {
  return tlds.value.filter(tld => tld.type === type).length;
}

function getTldCountByStatus(status: boolean): number {
  return tlds.value.filter(tld => tld.enabled === status).length;
}

function handleSearch() {
  currentPage.value = 1; // 重置到第一页
}

function editTld(tld: any) {
  editingTld.value = tld;
  formData.value = { ...tld };
  showEditModal.value = true;
}

async function deleteTld(tld: any) {
  // 简单的确认逻辑，在生产环境中可以用更好的UI组件
  const shouldDelete = process.client ? (globalThis as any).confirm(`确定要删除 TLD "${tld.name}" 吗？`) : true;
  if (!shouldDelete) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/tld/delete/${tld.name}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        successMessage.value = `TLD "${tld.name}" 删除成功`;
        await loadTlds();
        setTimeout(() => { successMessage.value = ''; }, 3000);
      } else {
        errorMessage.value = data.message || '删除失败';
      }
    } else {
      errorMessage.value = '删除操作失败';
    }
  } catch (error) {
    console.error('Error deleting TLD:', error);
    errorMessage.value = '删除 TLD 时发生错误';
  }
}

async function saveTld() {
  if (saving.value) return;
  
  saving.value = true;
  errorMessage.value = '';
  
  try {
    const url = showAddModal.value 
      ? '/api/admin/tld/add'
      : `/api/admin/tld/modify/${formData.value.name}`;
    
    const method = showAddModal.value ? 'POST' : 'PUT';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData.value)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        successMessage.value = showAddModal.value 
          ? `TLD "${formData.value.name}" 添加成功`
          : `TLD "${formData.value.name}" 更新成功`;
        
        closeModals();
        await loadTlds();
        setTimeout(() => { successMessage.value = ''; }, 3000);
      } else {
        errorMessage.value = data.message || '保存失败';
      }
    } else {
      errorMessage.value = '保存操作失败';
    }
  } catch (error) {
    console.error('Error saving TLD:', error);
    errorMessage.value = '保存 TLD 时发生错误';
  } finally {
    saving.value = false;
  }
}

function closeModals() {
  showAddModal.value = false;
  showEditModal.value = false;
  editingTld.value = null;
  
  // 重置表单
  formData.value = {
    name: '',
    type: '',
    whois_server: '',
    rdap_server: '',
    query_handler: 'tcp',
    parser_script_path: '',
    availability_check_pattern: '',
    enabled: true
  };
}

function handleFilterChange() {
  currentPage.value = 1; // 重置到第一页
}

function handlePageSizeChange() {
  currentPage.value = 1; // 重置到第一页
}

function goToPage(page: number) {
  currentPage.value = page;
}

function clearSearch() {
  searchQuery.value = '';
  currentPage.value = 1; // 重置到第一页
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
</script>

<style scoped>
/* 管理页面样式 */
.admin-tlds-page {
  padding: 2rem;
  min-height: 100vh;
}

/* 权限检查状态 */
.auth-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.auth-error {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  padding: 2rem;
  text-align: center;
  color: var(--error-color);
}

.tlds-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 统计区域样式 */
.stats-section {
  padding: 1.5rem;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.stat-label {
  color: var(--text-color-light);
  font-size: 0.9rem;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.section-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-add {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: #111111;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background-color: var(--hover-color);
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: #111111;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-refresh:hover {
  background-color: var(--hover-color);
}

.search-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.search-input-group {
  flex: 1;
  max-width: 400px;
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

.search-filters {
  flex: 0 0 auto;
}

.filter-select {
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

/* 列表区域样式 */
.list-section {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.list-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.list-count {
  font-size: 0.9rem;
  color: var(--text-color-light);
  margin-left: 0.5rem;
}

.list-actions {
  display: flex;
  gap: 0.5rem;
}

.page-size-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
  cursor: pointer;
}

/* 表格样式 */
.tlds-table-container {
  overflow-x: auto;
  margin-bottom: 1rem;
}

.tlds-table {
  width: 100%;
  border-collapse: collapse;
}

.tlds-table th {
  background-color: var(--bg-secondary);
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  color: var(--text-color);
  font-weight: 600;
  font-size: 0.9rem;
}

.tlds-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
  vertical-align: middle;
}

.tld-row:hover {
  background-color: var(--bg-secondary);
}

.tld-name {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.tld-type {
  font-size: 0.85rem;
  background-color: rgba(17, 252, 212, 0.1);
  color: var(--text-color);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-enabled {
  background-color: #d4edda;
  color: #155724;
}

.status-disabled {
  background-color: #f8d7da;
  color: #721c24;
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.server-item {
  display: flex;
  gap: 0.5rem;
}

.server-label {
  color: var(--text-color-light);
  font-weight: 500;
  min-width: 50px;
}

.server-value {
  color: var(--text-color);
  font-family: monospace;
  background-color: rgba(17, 252, 212, 0.05);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.actions {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-action {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-view {
  background-color: #17a2b8;
  color: white;
}

.btn-view:hover {
  background-color: #138496;
}

.btn-edit {
  background-color: var(--primary-color);
  color: #111111;
}

.btn-edit:hover {
  background-color: var(--hover-color);
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
}

.btn-toggle {
  background-color: #ffc107;
  color: #212529;
}

.btn-toggle:hover {
  background-color: #e0a800;
}

/* 空状态样式 */
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

/* 分页样式 */
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

/* 消息样式 */
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
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
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

/* TLD表单样式 */
.tld-form {
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
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(17, 252, 212, 0.1);
}

.form-group input:disabled {
  background-color: var(--bg-secondary);
  color: var(--text-color-light);
  cursor: not-allowed;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
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

/* 表格列样式补充 */
.col-tld {
  width: 15%;
  min-width: 120px;
}

.col-type {
  width: 12%;
  min-width: 100px;
}

.col-servers {
  width: 35%;
  min-width: 250px;
}

.col-handler {
  width: 12%;
  min-width: 100px;
}

.col-status {
  width: 12%;
  min-width: 100px;
}

.col-actions {
  width: 14%;
  min-width: 120px;
  text-align: center;
}

.tld-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tld-text {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.servers-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.server-empty {
  color: var(--text-color-light);
  font-style: italic;
}

.query-handler {
  text-align: center;
}

.handler-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.handler-badge.tcp {
  background-color: #007bff;
  color: white;
}

.handler-badge.rdap {
  background-color: #28a745;
  color: white;
}

.handler-badge.web {
  background-color: #ffc107;
  color: #212529;
}

.status {
  text-align: center;
}

.status-icon {
  margin-right: 0.25rem;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
    max-height: 95vh;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .checkbox-group {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .tlds-table {
    font-size: 0.85rem;
  }
  
  .col-tld,
  .col-type,
  .col-servers,
  .col-handler,
  .col-status,
  .col-actions {
    min-width: auto;
  }
}
</style> 