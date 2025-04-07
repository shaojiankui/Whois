<template>
  <div class="history-page-container">
    <h1 class="page-title">{{ $t('user.history') }}</h1>
    
    <div v-if="!isLoggedIn" class="login-required">
      <p>{{ $t('user.loginRequired') }}</p>
      <NuxtLink :to="localePath('/login')" class="login-link">
        {{ $t('header.login') }}
      </NuxtLink>
    </div>
    
    <div v-else-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchHistory" class="retry-button">
        {{ $t('common.retry') }}
      </button>
    </div>
    
    <div v-else-if="historyItems.length === 0" class="empty-state">
      <p>{{ $t('common.noRecords') }}</p>
    </div>
    
    <div v-else class="history-content">
      <table class="history-table">
        <thead>
          <tr>
            <th>{{ $t('common.domain') }}</th>
            <th>{{ $t('common.tag') }}</th>
            <th>{{ $t('common.searchTime') }}</th>
            <th>{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in historyItems" :key="index">
            <td>
              <NuxtLink :to="localePath(`/${item.domain}`)" class="domain-link">
                {{ item.domain }}
              </NuxtLink>
            </td>
            <td>
              <span class="tag" :class="getTagClass(item.tag)">
                {{ item.tag || 'whois' }}
              </span>
            </td>
            <td>{{ formatDate(item.add_time) }}</td>
            <td>
              <div class="action-buttons">
                <button class="view-button" @click="navigateToDomain(item.domain)">
                  {{ $t('common.view') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 分页控制 -->
      <div class="pagination">
        <button 
          class="pagination-button" 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          {{ $t('common.previous') }}
        </button>
        
        <span class="page-indicator">{{ $t('common.page') }} {{ currentPage }}</span>
        
        <button 
          class="pagination-button" 
          :disabled="historyItems.length < itemsPerPage"
          @click="changePage(currentPage + 1)"
        >
          {{ $t('common.next') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocalePath } from '#i18n';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { apiGet } from '~/utils/api';

const { t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

// 状态变量
const isLoggedIn = ref(false);
const loading = ref(true);
const error = ref<string | null>(null);
const historyItems = ref<any[]>([]);

// 分页
const currentPage = ref(1);
const itemsPerPage = ref(20);

// 检查用户是否登录
const checkUserAuth = async () => {
  try {
    const userData = await apiGet('/api/user/me');
    isLoggedIn.value = !!userData;
    return isLoggedIn.value;
  } catch (error) {
    console.error('Error checking authentication:', error);
    isLoggedIn.value = false;
    return false;
  }
};

// 获取历史记录
const fetchHistory = async () => {
  if (!isLoggedIn.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    console.log('Fetching history with page:', currentPage.value, 'limit:', itemsPerPage.value);
    
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value
    };
    
    const data = await apiGet('/api/user/history', params);
    console.log('Fetched history data:', data);
    
    historyItems.value = data.history;
    console.log('Fetched history items:', historyItems.value.length);
  } catch (err: any) {
    console.error('Error fetching history:', err);
    error.value = err.message || 'Failed to fetch history';
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 根据标签获取CSS类
const getTagClass = (tag) => {
  const tagMap = {
    'whois': 'tag-whois',
    'dns': 'tag-dns',
    'bulk': 'tag-bulk',
    'extract': 'tag-extract'
  };
  
  return tagMap[tag] || 'tag-default';
};

// 导航到域名
const navigateToDomain = (domain) => {
  router.push(localePath(`/${domain}`));
};

// 切换页面
const changePage = (page) => {
  if (page < 1) return;
  currentPage.value = page;
  fetchHistory();
};

// 组件挂载
onMounted(async () => {
  await checkUserAuth();
  
  if (isLoggedIn.value) {
    await fetchHistory();
  } else {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.history-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-title {
  margin-bottom: 2rem;
  font-size: 2rem;
  color: var(--text-color);
}

.login-required {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  p {
    margin-bottom: 1rem;
    font-size: 1.2rem;
    color: var(--text-color);
  }
  
  .login-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: var(--primary-color);
    color: var(--bg-color);
    text-decoration: none;
    border-radius: 4px;
    font-weight: 500;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: var(--hover-color);
    }
  }
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  p {
    margin-top: 1rem;
    color: var(--text-color);
  }
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--error-color) !important;
  margin-bottom: 1rem;
}

.retry-button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: var(--bg-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: var(--hover-color);
  }
}

.history-content {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }
  
  th {
    font-weight: 600;
    color: var(--text-color);
    background-color: var(--card-bg);
  }
  
  td {
    color: var(--text-color);
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover td {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .domain-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  .tag {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .tag-whois {
    background-color: rgba(17, 252, 212, 0.15);
    color: var(--primary-color);
  }
  
  .tag-dns {
    background-color: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }
  
  .tag-bulk {
    background-color: rgba(245, 158, 11, 0.15);
    color: var(--warning-color);
  }
  
  .tag-extract {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--success-color);
  }
  
  .tag-default {
    background-color: rgba(107, 114, 128, 0.15);
    color: #6b7280;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .view-button {
    padding: 0.25rem 0.5rem;
    background-color: var(--primary-color);
    color: var(--bg-color);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    
    &:hover {
      background-color: var(--hover-color);
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  
  .pagination-button {
    padding: 0.5rem 1rem;
    background-color: var(--card-bg);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    
    &:hover:not(:disabled) {
      background-color: var(--primary-color);
      color: var(--bg-color);
      border-color: var(--primary-color);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .page-indicator {
    color: var(--text-color);
  }
}

@media (max-width: 768px) {
  .history-table {
    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.875rem;
    }
    
    th:nth-child(2),
    td:nth-child(2) {
      display: none;
    }
  }
}
</style> 