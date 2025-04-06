<template>
  <div class="tld-page">
    <h1 class="page-title">{{ $t('tld.title') }}</h1>
    
    <div class="filters-container">
      <div class="search-box">
        <input
          type="text"
          v-model="searchQuery"
          @input="debouncedSearch"
          :placeholder="$t('tld.search')"
          class="search-input"
        />
      </div>
      
      <div class="type-filters">
        <select v-model="selectedType" @change="filterByType" class="type-select">
          <option value="">{{ $t('tld.allTypes') }}</option>
          <option value="gTLD">{{ $t('tld.gTLD') }}</option>
          <option value="ccTLD">{{ $t('tld.ccTLD') }}</option>
          <option value="newTLD">{{ $t('tld.newTLD') }}</option>
          <option value="IDN TLD">{{ $t('tld.idnTLD') }}</option>
        </select>
      </div>
    </div>
    
    <div class="tld-stats-bar" v-if="stats">
      <div class="stat-item">
        <span class="stat-label">{{ $t('tld.totalTLDs') }}:</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
      <div v-for="(count, type) in stats.byType" :key="type" class="stat-item">
        <span class="stat-label">{{ type }}:</span>
        <span class="stat-value">{{ count }}</span>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadTldList" class="retry-button">{{ $t('common.retry') }}</button>
    </div>
    
    <div v-else-if="tldList.length === 0" class="no-results">
      <p>{{ $t('tld.noResults') }}</p>
    </div>
    
    <div v-else class="tld-list">
      <table class="tld-table">
        <thead>
          <tr>
            <th>{{ $t('tld.tldColumn') }}</th>
            <th>{{ $t('tld.typeColumn') }}</th>
            <th>{{ $t('tld.managerColumn') }}</th>
            <th>{{ $t('tld.countryColumn') }}</th>
            <th>{{ $t('tld.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tld in tldList" :key="tld.tld">
            <td>.{{ tld.tld }}</td>
            <td>{{ tld.type }}</td>
            <td>{{ tld.manager }}</td>
            <td>{{ tld.country || '-' }}</td>
            <td>
              <button @click="showTldDetails(tld)" class="details-button">
                {{ $t('common.details') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- TLD详情弹窗 -->
    <div v-if="selectedTld" class="tld-details-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>.{{ selectedTld.tld }}</h2>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <div class="detail-label">{{ $t('tld.type') }}:</div>
            <div class="detail-value">{{ selectedTld.type }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">{{ $t('tld.manager') }}:</div>
            <div class="detail-value">{{ selectedTld.manager }}</div>
          </div>
          <div v-if="selectedTld.country" class="detail-row">
            <div class="detail-label">{{ $t('tld.country') }}:</div>
            <div class="detail-value">{{ selectedTld.country }}</div>
          </div>
          <div v-if="selectedTld.whoisServer" class="detail-row">
            <div class="detail-label">{{ $t('tld.whoisServer') }}:</div>
            <div class="detail-value">{{ selectedTld.whoisServer }}</div>
          </div>
          <div v-if="selectedTld.createDate" class="detail-row">
            <div class="detail-label">{{ $t('tld.creationDate') }}:</div>
            <div class="detail-value">{{ selectedTld.createDate }}</div>
          </div>
          <div v-if="selectedTld.website" class="detail-row">
            <div class="detail-label">{{ $t('tld.website') }}:</div>
            <div class="detail-value">
              <a :href="selectedTld.website" target="_blank" rel="noopener noreferrer">
                {{ selectedTld.website }}
              </a>
            </div>
          </div>
          <div v-if="selectedTld.language" class="detail-row">
            <div class="detail-label">{{ $t('tld.language') }}:</div>
            <div class="detail-value">{{ selectedTld.language }}</div>
          </div>
          <div v-if="selectedTld.description" class="detail-row">
            <div class="detail-label">{{ $t('tld.description') }}:</div>
            <div class="detail-value description">{{ selectedTld.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { debounce } from 'lodash-es';

// 状态
const tldList = ref<any[]>([]);
const filteredList = ref<any[]>([]);
const isLoading = ref(false);
const error = ref('');
const searchQuery = ref('');
const selectedType = ref('');
const selectedTld = ref<any>(null);
const stats = ref<any>(null);

// 在组件挂载时加载TLD列表
onMounted(() => {
  loadTldList();
  loadTldStats();
});

// 防抖搜索
const debouncedSearch = debounce(() => {
  searchTlds();
}, 300);

// 加载TLD列表
async function loadTldList() {
  isLoading.value = true;
  error.value = '';
  
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (searchQuery.value) {
      queryParams.append('query', searchQuery.value);
    }
    if (selectedType.value) {
      queryParams.append('type', selectedType.value);
    }
    
    // 调用API
    const response = await fetch(`/api/tld?${queryParams.toString()}`);
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || useNuxtApp().$i18n.t('common.errors.unknownError'));
    }
    
    tldList.value = data.data;
  } catch (err: any) {
    error.value = err.message || useNuxtApp().$i18n.t('common.errors.fetchError');
  } finally {
    isLoading.value = false;
  }
}

// 加载TLD统计信息
async function loadTldStats() {
  try {
    const response = await fetch('/api/tld?stats=true');
    const data = await response.json();
    
    if (response.ok && data.success) {
      stats.value = data.data;
    }
  } catch (err) {
    console.error('Failed to load TLD stats:', err);
  }
}

// 按类型筛选
function filterByType() {
  loadTldList();
}

// 搜索TLD
function searchTlds() {
  loadTldList();
}

// 显示TLD详情
function showTldDetails(tld: any) {
  selectedTld.value = tld;
}

// 关闭弹窗
function closeModal() {
  selectedTld.value = null;
}
</script>

<style lang="scss" scoped>
.tld-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  
  .search-box {
    flex: 1;
    min-width: 250px;
    
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      
      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }
    }
  }
  
  .type-filters {
    min-width: 150px;
    
    .type-select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      background-color: white;
      cursor: pointer;
      
      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    }
  }
}

.tld-stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  
  .stat-item {
    .stat-label {
      font-weight: 600;
      margin-right: 0.5rem;
    }
    
    .stat-value {
      font-weight: 700;
      color: var(--primary-color);
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1rem;
  }
}

.error-state {
  padding: 2rem;
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 4px;
  text-align: center;
  
  .error-message {
    color: #e53e3e;
    margin-bottom: 1rem;
  }
  
  .retry-button {
    padding: 0.5rem 1.5rem;
    background-color: #e53e3e;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      background-color: #c53030;
    }
  }
}

.no-results {
  padding: 3rem;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 4px;
  
  p {
    color: #6c757d;
    font-size: 1.1rem;
  }
}

.tld-list {
  .tld-table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    tr:hover {
      background-color: #f8f9fa;
    }
    
    .details-button {
      padding: 0.4rem 0.8rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      
      &:hover {
        background-color: var(--secondary-color);
      }
    }
  }
}

.tld-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
      
      h2 {
        margin: 0;
        font-size: 1.5rem;
      }
      
      .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        color: #666;
        
        &:hover {
          color: #000;
        }
      }
    }
    
    .modal-body {
      padding: 1.5rem;
      
      .detail-row {
        display: flex;
        margin-bottom: 1rem;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .detail-label {
          width: 120px;
          font-weight: 600;
          flex-shrink: 0;
          padding-right: 1rem;
        }
        
        .detail-value {
          flex: 1;
          
          a {
            color: var(--primary-color);
            text-decoration: none;
            
            &:hover {
              text-decoration: underline;
            }
          }
          
          &.description {
            white-space: pre-line;
          }
        }
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 暗色主题支持 */
:global(.dark) {
  .tld-page {
    color: #f1f1f1;
  }
  
  .filters-container {
    .search-box .search-input,
    .type-filters .type-select {
      background-color: #2a2a2a;
      border-color: #444;
      color: #f1f1f1;
    }
  }
  
  .tld-stats-bar {
    background-color: #222;
    
    .stat-item .stat-value {
      color: #4dabf7;
    }
  }
  
  .tld-list {
    .tld-table {
      th {
        background-color: #222;
      }
      
      th, td {
        border-color: #444;
      }
      
      tr:hover {
        background-color: #333;
      }
    }
  }
  
  .tld-details-modal {
    .modal-content {
      background-color: #222;
      
      .modal-header {
        border-color: #444;
        
        .close-button {
          color: #ccc;
          
          &:hover {
            color: #fff;
          }
        }
      }
    }
  }
  
  .no-results {
    background-color: #2a2a2a;
    
    p {
      color: #aaa;
    }
  }
}
</style> 