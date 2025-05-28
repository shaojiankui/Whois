<template>
  <div class="bulk-check-container">
    <h1 class="page-title">{{ $t('bulkCheck.title') }}</h1>
    <p class="page-description">{{ $t('bulkCheck.description') }}</p>
    
    <div class="input-area">
      <textarea
        v-model="domainsInput"
        :placeholder="$t('bulkCheck.placeholder')"
        class="domains-textarea"
        :disabled="isProcessing"
      ></textarea>
      
      <div class="button-group">
        <button
          v-if="!isProcessing"
          @click="startCheck"
          class="primary-button"
          :disabled="!hasValidDomains"
        >
          {{ $t('bulkCheck.startCheck') }}
        </button>
        <button
          v-else
          @click="stopCheck"
          class="warning-button"
        >
          {{ $t('bulkCheck.stopCheck') }}
        </button>
        
        <button
          @click="exportToCsv"
          class="secondary-button"
          :disabled="!hasResults"
        >
          {{ $t('bulkCheck.exportCsv') }}
        </button>
      </div>
    </div>
    
    <div class="progress-section" v-if="isProcessing || hasResults">
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="progress-stats">
          <div class="stat-item">
            <div class="stat-label">{{ $t('bulkCheck.total') }}:</div>
            <div class="stat-value">{{ totalDomains }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ $t('bulkCheck.checked') }}:</div>
            <div class="stat-value">{{ checkedDomains }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ $t('bulkCheck.available') }}:</div>
            <div class="stat-value available">{{ availableDomains }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ $t('bulkCheck.taken') }}:</div>
            <div class="stat-value taken">{{ takenDomains }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ $t('bulkCheck.error') }}:</div>
            <div class="stat-value error">{{ errorDomains }}</div>
          </div>
        </div>
      </div>
      
      <div class="results-section">
        <h2>{{ $t('bulkCheck.results') }}</h2>
        <div class="results-table-container">
          <table class="results-table">
            <thead>
              <tr>
                <th>{{ $t('bulkCheck.domain') }}</th>
                <th>{{ $t('bulkCheck.status') }}</th>
                <th>{{ $t('bulkCheck.details') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(result, index) in results" :key="index" :class="getStatusClass(result.status)">
                <td>{{ result.domain }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(result.status)">
                    {{ getStatusText(result.status) }}
                  </span>
                </td>
                <td>
                  <NuxtLink v-if="result.status !== 'pending'" :to="`/${result.domain}`" class="details-link">
                    {{ $t('bulkCheck.details') }}
                  </NuxtLink>
                  <span v-else class="loading-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGet } from '~/utils/api';

// 定义结果类型
interface BulkCheckResult {
  domain: string;
  status: 'pending' | 'available' | 'taken' | 'reserved' | 'error' | 'cancelled';
  details: {
    checked?: string;
    message?: string;
    fromCache?: boolean;
    error?: string;
  } | null;
}

// 获取i18n实例
const { t } = useI18n();

// 域名输入
const domainsInput = ref('');

// 处理状态
const isProcessing = ref(false);
const results = ref<BulkCheckResult[]>([]);
const checkedDomains = ref(0);
const totalDomains = ref(0);
const stopProcessing = ref(false);

// 计算属性
const hasValidDomains = computed(() => {
  return domainsInput.value.trim().length > 0;
});

const hasResults = computed(() => {
  return results.value.length > 0;
});

const availableDomains = computed(() => {
  return results.value.filter(r => r.status === 'available').length;
});

const takenDomains = computed(() => {
  return results.value.filter(r => r.status === 'taken' || r.status === 'reserved').length;
});

const errorDomains = computed(() => {
  return results.value.filter(r => r.status === 'error').length;
});

const progressPercentage = computed(() => {
  if (totalDomains.value === 0) return 0;
  return Math.round((checkedDomains.value / totalDomains.value) * 100);
});

// 开始批量查询
const startCheck = async () => {
  if (!hasValidDomains.value || isProcessing.value) return;
  
  // 解析域名列表
  const domains = domainsInput.value
    .split('\n')
    .map(d => d.trim())
    .filter(d => d.length > 0);
  
  if (domains.length === 0) return;
  
  // 初始化查询状态
  isProcessing.value = true;
  stopProcessing.value = false;
  results.value = domains.map(domain => ({
    domain,
    status: 'pending',
    details: null
  }));
  
  totalDomains.value = domains.length;
  checkedDomains.value = 0;
  
  try {
    // 使用普通的POST请求进行批量查询
    const response = await fetch('/api/bulk-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ domains })
    });
    
    if (!response.ok) {
      throw new Error('网络请求失败');
    }
    
    const data = await response.json();
    
    if (data.code === 200) {
      // 更新所有结果
      data.data.results.forEach((result: any) => {
        const index = domains.findIndex(d => d === result.domain);
        if (index !== -1) {
          results.value[index] = {
            domain: result.domain,
            status: result.status,
            details: {
              checked: result.timestamp,
              message: result.message || result.error,
              fromCache: false
            }
          };
        }
      });
      
      checkedDomains.value = domains.length;
    } else {
      throw new Error(data.message || '查询失败');
    }
    
  } catch (error) {
    console.error('Bulk check failed:', error);
    
    // 标记所有域名为错误状态
    results.value.forEach((result, idx) => {
      if (result.status === 'pending') {
        result.status = 'error';
        result.details = { error: '查询失败' };
      }
    });
    
    checkedDomains.value = domains.length;
  } finally {
    isProcessing.value = false;
  }
};

// 检查单个域名
const checkDomain = async (domain: string, index: number) => {
  try {
    // 使用API工具调用
    const data = await apiGet(`/api/available?domain=${encodeURIComponent(domain)}`);
    
    // 更新结果
    if (!stopProcessing.value) {
      results.value[index].status = data.isAvailable ? 'available' : 'taken';
      results.value[index].details = {
        checked: new Date().toISOString(),
        message: data.message,
        fromCache: data.fromCache || false
      };
      checkedDomains.value++;
    }
  } catch (err: any) {
    console.error(`Error checking domain ${domain}:`, err);
    if (!stopProcessing.value) {
      results.value[index].status = 'error';
      results.value[index].details = { error: err.message };
      checkedDomains.value++;
    }
  }
};

// 停止查询
const stopCheck = () => {
  stopProcessing.value = true;
  isProcessing.value = false;
};

// 导出CSV
const exportToCsv = () => {
  if (!hasResults.value) return;
  
  // 准备CSV内容
  const headers = [t('bulkCheck.domain'), t('bulkCheck.status')];
  
  const rows = results.value.map(r => [
    r.domain,
    getStatusText(r.status)
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // 创建下载链接（仅在客户端执行）
  if (process.client && typeof window !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = (globalThis as any).document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `domain-check-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    (globalThis as any).document.body.appendChild(link);
    link.click();
    (globalThis as any).document.body.removeChild(link);
  }
};

// 获取状态样式类
const getStatusClass = (status: string) => {
  switch (status) {
    case 'available': return 'status-available';
    case 'taken': return 'status-taken';
    case 'reserved': return 'status-reserved';
    case 'error': return 'status-error';
    case 'cancelled': return 'status-cancelled';
    default: return 'status-pending';
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'available': return t('whois.available');
    case 'taken': return t('whois.notAvailable');
    case 'reserved': return t('whois.reserved');
    case 'error': return t('errors.error');
    case 'cancelled': return t('bulkCheck.cancelled');
    default: return t('common.loading');
  }
};

// 组件销毁前清理
onBeforeUnmount(() => {
  stopProcessing.value = true;
});
</script>

<style lang="scss" scoped>
.bulk-check-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--muted-text);
  margin-bottom: 2rem;
}

.input-area {
  margin-bottom: 2rem;
  
  .domains-textarea {
    width: 100%;
    min-height: 200px;
    padding: 1rem;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    resize: vertical;
    font-family: monospace;
    margin-bottom: 1rem;
    background-color: var(--input-bg);
    color: var(--text-color);
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(var(--primary-color), 0.25);
    }
    
    &:disabled {
      background-color: var(--body-bg);
      cursor: not-allowed;
    }
  }
  
  .button-group {
    display: flex;
    gap: 1rem;
    
    @media (max-width: 576px) {
      flex-direction: column;
    }
  }
  
  button {
    padding: 0.8rem 1.5rem;
    border-radius: 4px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &.primary-button {
      background-color: var(--primary-color);
      color: #000;
      
      &:hover:not(:disabled) {
        background-color: var(--hover-color);
        transform: translateY(-2px);
      }
    }
    
    &.secondary-button {
      background-color: var(--button-secondary-bg);
      color: var(--button-secondary-text);
      
      &:hover:not(:disabled) {
        background-color: var(--hover-color);
        color: #000;
        transform: translateY(-2px);
      }
    }
    
    &.warning-button {
      background-color: var(--error-color);
      color: white;
      
      &:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
    }
  }
}

.progress-section {
  margin-top: 3rem;
  
  .progress-container {
    margin-bottom: 2rem;
    
    .progress-bar {
      height: 20px;
      background-color: var(--border-color);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 1rem;
      
      .progress-fill {
        height: 100%;
        background-color: var(--primary-color);
        transition: width 0.3s ease;
      }
    }
    
    .progress-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      
      .stat-item {
        flex: 1;
        min-width: 120px;
        background-color: var(--card-bg);
        padding: 0.8rem;
        border-radius: 4px;
        box-shadow: var(--card-shadow);
        border: 1px solid var(--border-color);
        
        .stat-label {
          font-size: 0.9rem;
          color: var(--muted-text);
        }
        
        .stat-value {
          font-size: 1.4rem;
          font-weight: bold;
          
          &.available {
            color: var(--success-color);
          }
          
          &.taken {
            color: var(--error-color);
          }
          
          &.error {
            color: var(--warning-color);
          }
        }
      }
    }
  }
  
  .results-section {
    h2 {
      margin-bottom: 1rem;
    }
    
    .results-table-container {
      width: 100%;
      overflow-x: auto;
      background-color: var(--card-bg);
      border-radius: 8px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--border-color);
    }
    
    .results-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }
      
      th {
        background-color: rgba(0, 0, 0, 0.05);
        font-weight: bold;
      }
      
      tr {
        &.status-available {
          background-color: rgba(46, 204, 113, 0.1);
        }
        
        &.status-taken, &.status-reserved {
          background-color: rgba(231, 76, 60, 0.1);
        }
        
        &.status-error {
          background-color: rgba(243, 156, 18, 0.1);
        }
        
        &:hover {
          background-color: rgba(var(--primary-color), 0.05);
        }
      }
      
      .status-badge {
        display: inline-block;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: bold;
        
        &.status-available {
          background-color: var(--success-color);
          color: white;
        }
        
        &.status-taken, &.status-reserved {
          background-color: var(--error-color);
          color: white;
        }
        
        &.status-error, &.status-cancelled {
          background-color: var(--warning-color);
          color: white;
        }
        
        &.status-pending {
          background-color: var(--border-color);
          color: var(--text-color);
        }
      }
      
      .details-link {
        color: var(--primary-color);
        text-decoration: none;
        font-size: 0.9rem;
        
        &:hover {
          text-decoration: underline;
          color: var(--hover-color);
        }
      }
      
      .loading-dots {
        display: flex;
        gap: 4px;
        align-items: center;
        
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--muted-text);
          animation: pulse 1.5s infinite ease-in-out;
          
          &:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style> 