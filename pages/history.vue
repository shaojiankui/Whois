<template>
  <div class="history-page">
    <div class="container">
      <h1 class="page-title">{{ $t('history.title') }}</h1>
      <p class="page-description">{{ $t('history.description') }}</p>
      
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <div class="error-icon">❌</div>
        <p>{{ error }}</p>
        <button @click="fetchHistory" class="retry-button">{{ $t('common.retry') }}</button>
      </div>
      
      <div v-else-if="!isLoggedIn" class="auth-required">
        <div class="auth-message">
          <h2>{{ $t('auth.loginRequired') }}</h2>
          <p>{{ $t('history.loginToView') }}</p>
          <NuxtLink :to="localePath('/login')" class="login-button">
            {{ $t('auth.login') }}
          </NuxtLink>
        </div>
      </div>
      
      <div v-else-if="historyItems.length === 0" class="no-history">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h2>{{ $t('history.noHistory') }}</h2>
          <p>{{ $t('history.startSearching') }}</p>
          <NuxtLink :to="localePath('/')" class="search-button">
            {{ $t('history.startSearch') }}
          </NuxtLink>
        </div>
      </div>
      
      <div v-else class="history-content">
        <div class="history-stats">
          <div class="stat-card">
            <div class="stat-number">{{ historyItems.length }}</div>
            <div class="stat-label">{{ $t('history.totalQueries') }}</div>
          </div>
        </div>
        
        <div class="history-list">
          <div 
            v-for="item in historyItems" 
            :key="item.id" 
            class="history-item"
            @click="viewDomain(item.domain)"
          >
            <div class="item-header">
              <div class="domain-name">{{ item.domain }}</div>
              <div class="query-time">{{ formatDate(item.add_time) }}</div>
            </div>
            
            <div class="item-details">
              <div v-if="item.tag" class="domain-tag">
                {{ item.tag }}
              </div>
              
              <div class="price-info" v-if="item.reg_price">
                <span class="price-label">{{ $t('history.regPrice') }}:</span>
                <span class="price-value">${{ item.reg_price }}</span>
              </div>
            </div>
            
            <div class="item-actions">
              <button 
                @click.stop="viewDomain(item.domain)" 
                class="view-button"
              >
                {{ $t('history.viewDetails') }}
              </button>
              <button 
                @click.stop="deleteHistoryItem(item.id)" 
                class="delete-button"
                :title="$t('history.deleteItem')"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="pagination.hasMore" class="load-more">
          <button 
            @click="loadMore" 
            class="load-more-button"
            :disabled="isLoadingMore"
          >
            {{ isLoadingMore ? $t('common.loading') : $t('history.loadMore') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '~/composables/useAuthStore';

// Types
interface QueryHistory {
  id: number;
  user_id: number;
  domain: string;
  tag?: string;
  premium?: number;
  reg_price?: number;
  renew_price?: number;
  flag?: number;
  add_time: string;
  update_time: string;
  uuid?: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// Composables
const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

// State
const historyItems = ref<QueryHistory[]>([]);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const error = ref('');
const pagination = ref<Pagination>({
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

// Computed
const isLoggedIn = computed(() => authStore.isLoggedIn);

// Methods
const fetchHistory = async (page: number = 1) => {
  try {
    if (page === 1) {
      isLoading.value = true;
      error.value = '';
    } else {
      isLoadingMore.value = true;
    }
    
    const response = await fetch(`/api/user/history?page=${page}&pageSize=${pagination.value.pageSize}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || t('history.fetchError'));
    }
    
    if (page === 1) {
      historyItems.value = data.data.data;
    } else {
      historyItems.value.push(...data.data.data);
    }
    
    pagination.value = data.data.pagination;
    
  } catch (err: any) {
    console.error('Error fetching history:', err);
    error.value = err.message || t('history.fetchError');
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

const loadMore = () => {
  if (!pagination.value.hasMore || isLoadingMore.value) return;
  fetchHistory(pagination.value.page + 1);
};

const viewDomain = (domain: string) => {
  router.push(`/${domain}`);
};

const deleteHistoryItem = async (id: number) => {
  if (process.client && !(globalThis as any).confirm(t('history.confirmDelete'))) {
    return;
  }
  
  try {
    const response = await fetch(`/api/user/history/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(t('history.deleteError'));
    }
    
    // Remove item from list
    historyItems.value = historyItems.value.filter(item => item.id !== id);
    
  } catch (err: any) {
    console.error('Error deleting history item:', err);
    if (process.client) {
      (globalThis as any).alert(err.message || t('history.deleteError'));
    }
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// Lifecycle
onMounted(() => {
  if (isLoggedIn.value) {
    fetchHistory();
  } else {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.history-page {
  min-height: 80vh;
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.page-description {
  color: var(--muted-text);
  text-align: center;
  margin-bottom: 2rem;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-button {
  padding: 0.8rem 1.5rem;
  background: var(--primary-color);
  color: #000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.auth-required {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.auth-message {
  text-align: center;
  background: var(--card-bg);
  padding: 3rem;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.auth-message h2 {
  margin-bottom: 1rem;
  color: var(--text-color);
}

.login-button {
  display: inline-block;
  padding: 0.8rem 1.5rem;
  background: var(--primary-color);
  color: #000;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 1rem;
}

.no-history {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.empty-state {
  text-align: center;
  background: var(--card-bg);
  padding: 3rem;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.search-button {
  display: inline-block;
  padding: 0.8rem 1.5rem;
  background: var(--primary-color);
  color: #000;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 1rem;
}

.history-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  text-align: center;
  min-width: 120px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--muted-text);
  margin-top: 0.5rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--card-shadow);
}

.history-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.domain-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
}

.query-time {
  font-size: 0.9rem;
  color: var(--muted-text);
}

.item-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.domain-tag {
  background: var(--primary-color);
  color: #000;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.price-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.price-label {
  color: var(--muted-text);
  font-size: 0.9rem;
}

.price-value {
  color: var(--text-color);
  font-weight: 600;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.view-button,
.delete-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.view-button {
  background: var(--primary-color);
  color: #000;
}

.view-button:hover {
  background: var(--hover-color);
}

.delete-button {
  background: var(--error-color);
  color: white;
  min-width: 40px;
}

.delete-button:hover {
  opacity: 0.8;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more-button {
  padding: 0.8rem 2rem;
  background: var(--button-secondary-bg);
  color: var(--button-secondary-text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-button:hover:not(:disabled) {
  background: var(--primary-color);
  color: #000;
}

.load-more-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .item-actions {
    justify-content: flex-start;
  }
  
  .history-stats {
    justify-content: center;
  }
}
</style> 