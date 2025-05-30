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
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ tlds.length }}</div>
            <div class="stat-label">总TLD数量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ getTldCountByStatus(true) }}</div>
            <div class="stat-label">已启用</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ getTldCountByStatus(false) }}</div>
            <div class="stat-label">已禁用</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-number">{{ getTopLevelSuffixCount() }}</div>
            <div class="stat-label">一级后缀</div>
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
              placeholder="搜索TLD名称或类型 (如: com, gTLD)" 
              class="search-input"
              @input="debouncedSearch"
              @keyup.escape="clearSearch"
              @keyup.enter="handleSearch"
            >
            <button v-if="searchQuery" @click="clearSearch" class="clear-search">✕</button>
          </div>
          
          <div class="filter-group">
            <select v-model="currentFilter" @change="handleFilterChange" class="filter-select">
              <option value="all">全部类型 ({{ filteredTlds.length }})</option>
              <option value="gTLD">通用顶级域 ({{ getTldCountByType('gTLD') }})</option>
              <option value="ccTLD">国家顶级域 ({{ getTldCountByType('ccTLD') }})</option>
              <option value="newgTLD">新通用顶级域 ({{ getTldCountByType('newgTLD') }})</option>
            </select>
          </div>
          
          <div class="filter-group">
            <select v-model="levelFilter" @change="handleFilterChange" class="filter-select">
              <option value="all">全部级别 ({{ filteredTlds.length }})</option>
              <option value="1">一级后缀 ({{ getTldCountByLevel(1) }})</option>
              <option value="2">二级后缀 ({{ getTldCountByLevel(2) }})</option>
              <option value="3">三级后缀 ({{ getTldCountByLevel(3) }})</option>
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
            <button @click="showAddModal = true" class="btn-add">
              <span class="btn-icon">➕</span>
              添加TLD
            </button>
          </div>
        </div>
        
        <!-- 搜索状态提示 -->
        <div v-if="searchQuery.trim()" class="search-status">
          <div v-if="filteredTlds.length > 0" class="search-results">
            <span class="search-icon">✅</span>
            找到 <strong>{{ filteredTlds.length }}</strong> 个匹配的TLD
            <span class="search-term">关键词: "{{ searchQuery.trim() }}"</span>
          </div>
          <div v-else class="search-no-results">
            <span class="search-icon">❌</span>
            没有找到匹配 <strong>"{{ searchQuery.trim() }}"</strong> 的TLD
            <div class="search-tips">
              <span>搜索提示：</span>
              <ul>
                <li>直接输入TLD名称，如: com, org, cn</li>
                <li>搜索类型，如: gTLD, ccTLD, newgTLD</li>
                <li>支持带点或不带点的格式: .com 或 com</li>
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
      
      <!-- TLD列表区域 -->
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
                <span class="tld-text">.{{ tld.tld || tld.name }}</span>
              </div>
            </td>
            <td class="tld-type">
              <span :class="`type-badge ${tld.type?.toLowerCase()}`">
                {{ tld.type }}
              </span>
            </td>
            <td class="servers-info">
              <div class="server-item" v-if="tld.whois_host || tld.whois_server">
                <span class="server-value">{{ tld.whois_host || tld.whois_server }}</span>
              </div>
              <div class="server-item" v-if="tld.rdap_server">
                <span class="server-value">{{ tld.rdap_server }}</span>
              </div>
              <div v-if="!(tld.whois_host || tld.whois_server) && !tld.rdap_server" class="server-empty">
                未配置服务器
              </div>
            </td>
            <td class="query-handler">
              <span :class="`handler-badge ${(tld.whois_adapter || tld.query_handler || 'tcp').toLowerCase()}`">
                {{ tld.whois_adapter || tld.query_handler || 'TCP' }}
              </span>
            </td>
            <td class="status">
              <span :class="`status-badge ${(tld.status === 1 || tld.enabled) ? 'enabled' : 'disabled'}`">
                <span class="status-icon">{{ (tld.status === 1 || tld.enabled) ? '✅' : '❌' }}</span>
                {{ (tld.status === 1 || tld.enabled) ? '启用' : '禁用' }}
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
        
        <div class="modal-body">
          <!-- 表单验证错误提示 -->
          <div v-if="formErrors.length > 0" class="form-errors">
            <div v-for="error in formErrors" :key="error" class="form-error">
              {{ error }}
            </div>
          </div>
          
          <form @submit.prevent="saveTld" class="tld-form">
            <div class="form-group">
              <label for="tld-name">TLD 名称 <span class="required">*</span></label>
              <input 
                id="tld-name"
                v-model="formData.name" 
                type="text" 
                placeholder="例如: com"
                required
                :disabled="showEditModal"
                :class="{ 'error': formFieldErrors.name }"
                @blur="validateField('name')"
              >
              <div v-if="formFieldErrors.name" class="field-error">{{ formFieldErrors.name }}</div>
            </div>
            
            <div class="form-group">
              <label for="tld-type">类型 <span class="required">*</span></label>
              <select 
                id="tld-type" 
                v-model="formData.type" 
                required
                :class="{ 'error': formFieldErrors.type }"
                @change="validateField('type')"
              >
                <option value="">请选择类型</option>
                <option value="gTLD">通用顶级域 (gTLD)</option>
                <option value="ccTLD">国家顶级域 (ccTLD)</option>
                <option value="newgTLD">新通用顶级域 (newgTLD)</option>
                <option value="sTLD">特殊顶级域 (sTLD)</option>
              </select>
              <div v-if="formFieldErrors.type" class="field-error">{{ formFieldErrors.type }}</div>
            </div>
            
            <div class="form-group">
              <label for="tld-level">级别 <span class="required">*</span></label>
              <select 
                id="tld-level" 
                v-model="formData.level" 
                required
                :class="{ 'error': formFieldErrors.level }"
                @change="validateField('level')"
              >
                <option value="">请选择级别</option>
                <option :value="1">一级后缀</option>
                <option :value="2">二级后缀</option>
                <option :value="3">三级后缀</option>
              </select>
              <div v-if="formFieldErrors.level" class="field-error">{{ formFieldErrors.level }}</div>
              <small class="form-help">选择域名后缀的级别层次</small>
            </div>
            
            <div class="form-group">
              <label for="whois-server">Whois 服务器</label>
              <input 
                id="whois-server"
                v-model="formData.whois_server" 
                type="text" 
                placeholder="例如: whois.verisign-grs.com"
                :class="{ 'error': formFieldErrors.whois_server }"
                @blur="validateField('whois_server')"
              >
              <div v-if="formFieldErrors.whois_server" class="field-error">{{ formFieldErrors.whois_server }}</div>
              <small class="form-help">输入完整的Whois服务器域名</small>
            </div>
            
            <div class="form-group">
              <label for="rdap-server">RDAP 服务器</label>
              <input 
                id="rdap-server"
                v-model="formData.rdap_server" 
                type="text" 
                placeholder="例如: https://rdap.verisign.com"
                :class="{ 'error': formFieldErrors.rdap_server }"
                @blur="validateField('rdap_server')"
              >
              <div v-if="formFieldErrors.rdap_server" class="field-error">{{ formFieldErrors.rdap_server }}</div>
              <small class="form-help">输入完整的RDAP服务器URL</small>
            </div>
            
            <div class="form-group">
              <label for="query-handler">查询方式 <span class="required">*</span></label>
              <select 
                id="query-handler" 
                v-model="formData.query_handler"
                required
                :class="{ 'error': formFieldErrors.query_handler }"
                @change="validateField('query_handler')"
              >
                <option value="tcp">TCP Whois</option>
                <option value="rdap">RDAP</option>
                <option value="web">Web 爬取</option>
              </select>
              <div v-if="formFieldErrors.query_handler" class="field-error">{{ formFieldErrors.query_handler }}</div>
              <small class="form-help">选择域名查询的方式</small>
            </div>
            
            <div class="form-group">
              <label for="parser-script">解析器脚本</label>
              <input 
                id="parser-script"
                v-model="formData.parser_script_path" 
                type="text" 
                placeholder="例如: parsers/com.js"
                :class="{ 'error': formFieldErrors.parser_script_path }"
                @blur="validateField('parser_script_path')"
              >
              <div v-if="formFieldErrors.parser_script_path" class="field-error">{{ formFieldErrors.parser_script_path }}</div>
              <small class="form-help">自定义解析器脚本路径（可选）</small>
            </div>
            
            <div class="form-group">
              <label for="availability-pattern">可用性检查模式</label>
              <input 
                id="availability-pattern"
                v-model="formData.availability_check_pattern" 
                type="text" 
                placeholder="例如: No Match|Available"
                :class="{ 'error': formFieldErrors.availability_check_pattern }"
                @blur="validateField('availability_check_pattern')"
              >
              <div v-if="formFieldErrors.availability_check_pattern" class="field-error">{{ formFieldErrors.availability_check_pattern }}</div>
              <small class="form-help">用于判断域名是否可用的正则表达式模式</small>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input 
                  v-model="formData.enabled" 
                  type="checkbox"
                >
                启用此 TLD
              </label>
              <small class="form-help">禁用的TLD将不会在查询时使用</small>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeModals" class="btn-outline">取消</button>
              <button 
                type="submit" 
                class="btn-primary" 
                :disabled="saving || !isFormValid"
              >
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- 确认删除对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content delete-dialog" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button @click="cancelDelete" class="modal-close">×</button>
        </div>
        <div class="delete-content">
          <div class="delete-icon">⚠️</div>
          <div class="delete-message">
            <p>您确定要删除 TLD <strong>.{{ deleteCandidate?.name }}</strong> 吗？</p>
            <p class="delete-warning">此操作无法撤销，将会影响相关的域名查询功能。</p>
          </div>
        </div>
        <div class="delete-actions">
          <button @click="cancelDelete" class="btn-outline">取消</button>
          <button 
            @click="confirmDelete" 
            class="btn-danger"
            :disabled="deleting"
          >
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
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
const levelFilter = ref('all');
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

// 删除确认对话框
const showDeleteDialog = ref(false);
const deleteCandidate = ref<any>(null);
const deleting = ref(false);

// 表单数据
const formData = ref({
  name: '',
  type: '',
  level: '',
  whois_server: '',
  rdap_server: '',
  query_handler: 'tcp',
  parser_script_path: '',
  availability_check_pattern: '',
  enabled: true
});

// 表单验证
const formErrors = ref<string[]>([]);
const formFieldErrors = ref<{[key: string]: string}>({});

// 计算属性
const filteredTlds = computed(() => {
  let filtered = tlds.value;
  
  // 按搜索查询过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(tld => {
      // 简化搜索逻辑，重点关注核心字段
      const tldName = (tld.tld || tld.name || '').toLowerCase();
      const tldType = (tld.type || '').toLowerCase();
      
      // 优先精确匹配TLD名称
      if (tldName.includes(query)) {
        return true;
      }
      
      // 其次匹配类型
      if (tldType.includes(query)) {
        return true;
      }
      
      // 支持去掉点号的搜索 (.com -> com)
      if (query.startsWith('.') && tldName === query.substring(1)) {
        return true;
      }
      if (!query.startsWith('.') && tldName === query) {
        return true;
      }
      
      return false;
    });
  }
  
  // 按类型过滤
  if (currentFilter.value !== 'all') {
    filtered = filtered.filter(tld => tld.type === currentFilter.value);
  }
  
  // 按级别过滤
  if (levelFilter.value !== 'all') {
    const level = parseInt(levelFilter.value);
    filtered = filtered.filter(tld => tld.level === level);
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

const isFormValid = computed(() => {
  const hasValidLevel = formData.value.level !== '' && formData.value.level !== null && formData.value.level !== undefined;
  return typeof formData.value.name === 'string' && 
         formData.value.name.trim().length > 0 && 
         typeof formData.value.type === 'string' &&
         formData.value.type.length > 0 && 
         hasValidLevel &&
         formErrors.value.length === 0 &&
         Object.keys(formFieldErrors.value).length === 0;
});

// 监听表单数据变化，实时验证
watch(() => formData.value, () => {
  if (showAddModal.value || showEditModal.value) {
    validateForm();
  }
}, { deep: true });

// 创建防抖搜索函数
let searchTimeout: NodeJS.Timeout | null = null;
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    handleSearch();
  }, 300);
};

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
        showError(data.message || '加载 TLD 列表失败');
      }
    } else {
      showError('无法连接到服务器');
    }
  } catch (error) {
    console.error('Error loading TLDs:', error);
    showError('加载 TLD 列表时发生错误');
  }
}

function getTldCountByType(type: string): number {
  return tlds.value.filter(tld => tld.type === type).length;
}

function getTldCountByStatus(status: boolean): number {
  return tlds.value.filter(tld => tld.enabled === status).length;
}

function getTldCountByLevel(level: number): number {
  return tlds.value.filter(tld => tld.level === level).length;
}

function getTopLevelSuffixCount(): number {
  // 统计level为1的一级后缀数量
  return tlds.value.filter(tld => tld.level === 1).length;
}

function handleSearch() {
  currentPage.value = 1; // 重置到第一页
  
  // 如果搜索结果为空且有搜索词，显示提示
  nextTick(() => {
    if (searchQuery.value.trim() && filteredTlds.value.length === 0) {
      console.log('No search results found for:', searchQuery.value);
    }
  });
}

function editTld(tld: any) {
  editingTld.value = tld;
  
  // 映射数据库字段到表单字段
  formData.value = {
    name: tld.tld || tld.name || '',
    type: tld.type || '',
    level: tld.level || '',
    whois_server: tld.whois_host || tld.whois_server || '',
    rdap_server: tld.rdap_server || '',
    query_handler: tld.whois_adapter || tld.query_handler || 'tcp',
    parser_script_path: tld.parser_script || tld.parser_script_path || '',
    availability_check_pattern: tld.whois_availability || tld.availability_check_pattern || '',
    enabled: tld.status === 1 || tld.enabled || false
  };
  
  clearFormErrors();
  showEditModal.value = true;
}

function deleteTld(tld: any) {
  deleteCandidate.value = tld;
  showDeleteDialog.value = true;
}

function cancelDelete() {
  showDeleteDialog.value = false;
  deleteCandidate.value = null;
  deleting.value = false;
}

async function confirmDelete() {
  if (!deleteCandidate.value || deleting.value) return;
  
  deleting.value = true;
  
  try {
    const response = await fetch(`/api/admin/tld/delete/${deleteCandidate.value.name}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        showSuccess(`TLD "${deleteCandidate.value.name}" 删除成功`);
        await loadTlds();
        showDeleteDialog.value = false;
        deleteCandidate.value = null;
      } else {
        showError(data.message || '删除失败');
      }
    } else {
      showError('删除操作失败');
    }
  } catch (error) {
    console.error('Error deleting TLD:', error);
    showError('删除 TLD 时发生错误');
  } finally {
    deleting.value = false;
  }
}

// 表单验证方法
function validateField(fieldName: string) {
  const value = formData.value[fieldName as keyof typeof formData.value];
  delete formFieldErrors.value[fieldName];
  
  switch (fieldName) {
    case 'name':
      if (!value || typeof value !== 'string' || !value.trim()) {
        formFieldErrors.value[fieldName] = 'TLD名称不能为空';
      } else if (!/^[a-zA-Z0-9.-]+$/.test(value.trim())) {
        formFieldErrors.value[fieldName] = 'TLD名称只能包含字母、数字、连字符和点号';
      } else if (showAddModal.value && tlds.value.find(tld => (tld.tld || tld.name) === value.trim())) {
        formFieldErrors.value[fieldName] = '该TLD已存在';
      }
      break;
      
    case 'type':
      if (!value || typeof value !== 'string') {
        formFieldErrors.value[fieldName] = '请选择TLD类型';
      }
      break;
      
    case 'level':
      if (!value || (typeof value !== 'string' && typeof value !== 'number')) {
        formFieldErrors.value[fieldName] = '请选择TLD级别';
      } else {
        const levelNum = typeof value === 'string' ? parseInt(value) : value;
        if (isNaN(levelNum) || levelNum < 1 || levelNum > 3) {
          formFieldErrors.value[fieldName] = '请选择有效的TLD级别';
        }
      }
      break;
      
    case 'whois_server':
      if (value && typeof value === 'string' && value.trim()) {
        const serverPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!serverPattern.test(value.trim())) {
          formFieldErrors.value[fieldName] = '请输入有效的服务器域名';
        }
      }
      break;
      
    case 'rdap_server':
      if (value && typeof value === 'string' && value.trim()) {
        const urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+/;
        if (!urlPattern.test(value.trim())) {
          formFieldErrors.value[fieldName] = '请输入有效的RDAP服务器URL';
        }
      }
      break;
      
    case 'query_handler':
      if (!value || typeof value !== 'string') {
        formFieldErrors.value[fieldName] = '请选择查询方式';
      }
      break;
  }
}

function validateForm() {
  clearFormErrors();
  
  // 验证必填字段
  validateField('name');
  validateField('type');
  validateField('level');
  validateField('query_handler');
  
  // 验证可选字段
  if (formData.value.whois_server) {
    validateField('whois_server');
  }
  if (formData.value.rdap_server) {
    validateField('rdap_server');
  }
  
  // 检查服务器配置
  if (!formData.value.whois_server && !formData.value.rdap_server) {
    formErrors.value.push('至少需要配置一个Whois服务器或RDAP服务器');
  }
  
  // 根据查询方式验证对应的服务器配置
  if (formData.value.query_handler === 'tcp' && !formData.value.whois_server) {
    formErrors.value.push('选择TCP查询方式时必须配置Whois服务器');
  }
  
  if (formData.value.query_handler === 'rdap' && !formData.value.rdap_server) {
    formErrors.value.push('选择RDAP查询方式时必须配置RDAP服务器');
  }
}

function clearFormErrors() {
  formErrors.value = [];
  formFieldErrors.value = {};
}

async function saveTld() {
  if (saving.value) return;
  
  // 最终验证
  validateForm();
  if (!isFormValid.value) {
    showError('请检查表单中的错误信息');
    return;
  }
  
  saving.value = true;
  clearMessages();
  
  try {
    const url = showAddModal.value 
      ? '/api/admin/tld/add'
      : `/api/admin/tld/modify/${formData.value.name}`;
    
    const method = showAddModal.value ? 'POST' : 'PUT';
    
    // 清理表单数据
    const submitData = {
      ...formData.value,
      name: typeof formData.value.name === 'string' ? formData.value.name.trim() : formData.value.name,
      level: typeof formData.value.level === 'string' ? parseInt(formData.value.level) : formData.value.level,
      whois_server: typeof formData.value.whois_server === 'string' ? formData.value.whois_server.trim() || null : null,
      rdap_server: typeof formData.value.rdap_server === 'string' ? formData.value.rdap_server.trim() || null : null,
      parser_script_path: typeof formData.value.parser_script_path === 'string' ? formData.value.parser_script_path.trim() || null : null,
      availability_check_pattern: typeof formData.value.availability_check_pattern === 'string' ? formData.value.availability_check_pattern.trim() || null : null
    };
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(submitData)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        showSuccess(showAddModal.value 
          ? `TLD "${formData.value.name}" 添加成功`
          : `TLD "${formData.value.name}" 更新成功`);
        
        closeModals();
        await loadTlds();
      } else {
        showError(data.message || '保存失败');
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      showError(errorData.message || '保存操作失败');
    }
  } catch (error) {
    console.error('Error saving TLD:', error);
    showError('保存 TLD 时发生错误');
  } finally {
    saving.value = false;
  }
}

function closeModals() {
  showAddModal.value = false;
  showEditModal.value = false;
  editingTld.value = null;
  clearFormErrors();
  
  // 重置表单
  formData.value = {
    name: '',
    type: '',
    level: '',
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
  
  // 清除搜索防抖定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
}

function resetFilters() {
  searchQuery.value = '';
  currentFilter.value = 'all';
  levelFilter.value = 'all';
  currentPage.value = 1;
  jumpPage.value = 1;
  
  // 清除搜索防抖定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
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

// 消息显示方法
function showSuccess(message: string) {
  successMessage.value = message;
  errorMessage.value = '';
  setTimeout(() => { successMessage.value = ''; }, 5000);
}

function showError(message: string) {
  errorMessage.value = message;
  successMessage.value = '';
  setTimeout(() => { errorMessage.value = ''; }, 8000);
}

function clearMessages() {
  successMessage.value = '';
  errorMessage.value = '';
}
</script>

<style scoped>
/* 管理页面样式 */
.admin-tlds-page {
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
  justify-content: space-between;
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
  min-width: 200px;
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
  width: 100%;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-search,
.btn-reset,
.btn-add {
  flex: 1;
  justify-content: center;
  min-width: auto;
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

.btn-search:hover {
  background-color: var(--hover-color);
  transform: translateY(-1px);
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

.btn-reset:hover {
  background-color: var(--hover-color);
  transform: translateY(-1px);
}

.btn-add {
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

.btn-add:hover {
  background-color: var(--hover-color);
  transform: translateY(-1px);
}

.btn-icon {
  margin-right: 0.5rem;
}

/* 搜索状态提示样式 */
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

.search-results .search-icon {
  font-size: 1rem;
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

.search-no-results {
  color: var(--text-color);
  font-size: 0.9rem;
}

.search-no-results .search-icon {
  margin-right: 0.5rem;
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

/* 列表区域样式 */
.tlds-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
  background-color: var(--card-bg);
  overflow-x: auto;
  margin-bottom: 2rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tlds-table th {
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

.tlds-table th:first-child {
  border-top-left-radius: 8px;
}

.tlds-table th:last-child {
  border-top-right-radius: 8px;
}

.tlds-table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 8px;
}

.tlds-table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 8px;
}

.tlds-table td {
  padding: 0.75rem 1rem;
  color: var(--text-color);
  vertical-align: middle;
  transition: background-color 0.2s ease;
}

.tld-row {
  border-bottom: 1px solid var(--border-color);
}

.tld-row:hover {
  background-color: var(--bg-secondary);
}

.tld-name {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1rem;
  min-width: 100px;
}

.tld-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tld-text {
  font-weight: 600;
  color: var(--primary-color);
  font-family: monospace;
}

.tld-type {
  min-width: 90px;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.gtld {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-badge.cctld {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.type-badge.newgtld {
  background-color: #e8f5e8;
  color: #388e3c;
}

.type-badge.stld {
  background-color: #fff3e0;
  color: #f57c00;
}

.servers-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  min-width: 200px;
  max-width: 280px;
}

.server-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.server-value {
  color: var(--text-color);
  font-family: monospace;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  word-break: break-all;
  flex: 1;
}

.server-empty {
  color: var(--text-color-light);
  font-style: italic;
  font-size: 0.8rem;
}

.query-handler {
  text-align: center;
  min-width: 80px;
}

.handler-badge {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.handler-badge.tcp {
  background-color: #e3f2fd;
  color: #1976d2;
}

.handler-badge.rdap {
  background-color: #e8f5e8;
  color: #388e3c;
}

.handler-badge.web {
  background-color: #fff3e0;
  color: #f57c00;
}

.status {
  text-align: center;
  min-width: 80px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.enabled {
  background-color: #e8f5e8;
  color: #388e3c;
}

.status-badge.disabled {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-icon {
  font-size: 0.9em;
}

.actions {
  text-align: center;
  min-width: 100px;
}

.action-buttons {
  display: flex;
  gap: 0.4rem;
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
  position: relative;
  display: flex;
  flex-direction: column;
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
.modal-body {
  overflow-y: auto;
  flex: 1;
  max-height: calc(90vh - 100px);
}

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
  width: 12%;
  min-width: 100px;
}

.col-type {
  width: 10%;
  min-width: 90px;
}

.col-servers {
  width: 40%;
  min-width: 200px;
}

.col-handler {
  width: 10%;
  min-width: 80px;
}

.col-status {
  width: 10%;
  min-width: 80px;
}

.col-actions {
  width: 18%;
  min-width: 100px;
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

/* 新增功能样式 */

/* 消息关闭按钮 */
.message-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: auto;
  border-radius: 2px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.message-close:hover {
  opacity: 1;
}

.message {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 表单验证样式 */
.form-errors {
  background-color: #fee;
  border: 1px solid #fbb;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.form-error {
  color: #c53030;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.form-error:last-child {
  margin-bottom: 0;
}

.field-error {
  color: #c53030;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.form-group input.error,
.form-group select.error {
  border-color: #c53030;
  box-shadow: 0 0 0 2px rgba(197, 48, 48, 0.1);
}

.required {
  color: #c53030;
  font-weight: bold;
}

.form-note {
  font-size: 0.8rem;
  color: var(--text-color-light);
  font-style: italic;
  margin-top: 0.25rem;
}

.form-help {
  font-size: 0.8rem;
  color: var(--text-color-light);
  margin-top: 0.25rem;
  opacity: 0.7;
}

/* 按钮样式补充 */
.btn-secondary {
  padding: 0.75rem 1.5rem;
  background-color: var(--bg-secondary);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: var(--border-color);
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 删除确认对话框样式 */
.delete-dialog {
  max-width: 500px;
}

.delete-content {
  padding: 1.5rem;
  text-align: center;
  flex: 1;
}

.delete-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.delete-message {
  margin-bottom: 1.5rem;
}

.delete-message p {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.delete-warning {
  font-size: 0.9rem;
  color: var(--text-color-light);
}

.delete-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
}

/* 改进的表单操作按钮布局 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .delete-actions {
    flex-direction: column;
  }
}

/* 改进的输入框样式 */
.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(17, 252, 212, 0.1);
}

.form-group input:focus.error,
.form-group select:focus.error {
  border-color: #c53030;
  box-shadow: 0 0 0 2px rgba(197, 48, 48, 0.1);
}

/* 搜索区域响应式布局 */
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
  }
  
  .btn-add {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .search-section {
    padding: 1rem;
  }
  
  .search-controls-inline {
    gap: 0.5rem;
  }
}
</style> 