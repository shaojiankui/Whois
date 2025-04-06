<template>
  <div class="dns-page">
    <h1 class="text-2xl font-bold text-center mb-6">{{ $t('dns.title') }}</h1>
    
    <div class="domain-input mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-grow">
          <input 
            type="text" 
            :placeholder="$t('dns.domainPlaceholder')" 
            v-model="domainInput"
            class="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            :class="{'border-red-500': hasError}"
            @keyup.enter="fetchDnsRecords"
          />
          <p v-if="hasError" class="text-red-500 mt-1">{{ error }}</p>
        </div>
        <div>
          <button 
            @click="fetchDnsRecords"
            class="w-full md:w-auto py-3 px-6 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            :disabled="isLoading"
          >
            <span v-if="isLoading">
              <i class="loading-spinner"></i>
              {{ $t('common.loading') }}
            </span>
            <span v-else>{{ $t('dns.search') }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="record-types mb-6">
      <h2 class="text-lg font-semibold mb-2">{{ $t('dns.recordTypesTitle') }}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div 
          v-for="type in recordTypes" 
          :key="type.value"
          class="flex items-center"
        >
          <input 
            type="checkbox" 
            :id="type.value" 
            v-model="type.selected"
            class="mr-2 h-5 w-5"
          />
          <label :for="type.value" class="cursor-pointer">{{ type.value }}</label>
        </div>
      </div>
    </div>
    
    <div v-if="currentDomain" class="results mt-8">
      <h2 class="text-xl font-semibold mb-4">
        {{ $t('dns.resultsFor') }} <span class="text-blue-600">{{ currentDomain }}</span>
      </h2>
      
      <div v-if="hasError && !isLoading" class="error-state p-4 bg-red-50 border border-red-200 rounded mb-4">
        <p class="text-red-700">{{ error }}</p>
        <button 
          @click="fetchDnsRecords" 
          class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          {{ $t('common.retry') }}
        </button>
      </div>
      
      <div v-else-if="isLoading" class="loading-state p-8 text-center">
        <div class="loading-spinner inline-block mb-3"></div>
        <p>{{ $t('dns.fetchingRecords') }}</p>
      </div>
      
      <div v-else-if="dnsRecords.length === 0" class="no-data p-8 text-center bg-gray-50 border border-gray-200 rounded">
        <p class="text-gray-500">{{ $t('dns.noRecordsFound') }}</p>
      </div>
      
      <div v-else class="dns-results">
        <div v-for="(record, index) in dnsRecords" :key="index" class="mb-6">
          <div class="record-header bg-gray-100 p-3 rounded-t border border-gray-200">
            <h3 class="text-lg font-medium">
              {{ record.type }} {{ $t('dns.records') }}
              <span v-if="record.fromCache" class="text-sm text-gray-500 ml-2">({{ $t('common.cached') }})</span>
            </h3>
          </div>
          
          <div class="record-body bg-white p-4 rounded-b border-b border-l border-r border-gray-200">
            <div v-if="!record.success" class="text-red-500">
              {{ record.error || $t('dns.queryFailed') }}
            </div>
            
            <div v-else-if="!record.records || record.records.length === 0" class="text-gray-500">
              {{ $t('dns.noResultsForType') }}
            </div>
            
            <div v-else>
              <!-- A 记录 -->
              <div v-if="record.type === 'A'" class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr>
                      <th class="text-left py-2">#</th>
                      <th class="text-left py-2">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(ip, i) in record.records" :key="i" class="border-t">
                      <td class="py-2">{{ i + 1 }}</td>
                      <td class="py-2">{{ ip }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- AAAA 记录 -->
              <div v-else-if="record.type === 'AAAA'" class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr>
                      <th class="text-left py-2">#</th>
                      <th class="text-left py-2">IPv6</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(ip, i) in record.records" :key="i" class="border-t">
                      <td class="py-2">{{ i + 1 }}</td>
                      <td class="py-2 font-mono">{{ ip }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- CNAME 记录 -->
              <div v-else-if="record.type === 'CNAME'" class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr>
                      <th class="text-left py-2">#</th>
                      <th class="text-left py-2">{{ $t('dns.target') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(target, i) in record.records" :key="i" class="border-t">
                      <td class="py-2">{{ i + 1 }}</td>
                      <td class="py-2">{{ target }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- MX 记录 -->
              <div v-else-if="record.type === 'MX'" class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr>
                      <th class="text-left py-2">#</th>
                      <th class="text-left py-2">{{ $t('dns.priority') }}</th>
                      <th class="text-left py-2">{{ $t('dns.exchange') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(mx, i) in record.records" :key="i" class="border-t">
                      <td class="py-2">{{ i + 1 }}</td>
                      <td class="py-2">{{ mx.priority }}</td>
                      <td class="py-2">{{ mx.exchange }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- NS 记录 -->
              <div v-else-if="record.type === 'NS'" class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr>
                      <th class="text-left py-2">#</th>
                      <th class="text-left py-2">{{ $t('dns.nameServer') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(ns, i) in record.records" :key="i" class="border-t">
                      <td class="py-2">{{ i + 1 }}</td>
                      <td class="py-2">{{ ns }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- TXT 记录 -->
              <div v-else-if="record.type === 'TXT'" class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr>
                      <th class="text-left py-2">#</th>
                      <th class="text-left py-2">{{ $t('dns.txtValue') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(txt, i) in record.records" :key="i" class="border-t">
                      <td class="py-2">{{ i + 1 }}</td>
                      <td class="py-2 break-all font-mono text-sm">{{ txt }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- SOA 记录 -->
              <div v-else-if="record.type === 'SOA'" class="overflow-x-auto">
                <table class="min-w-full" v-for="(soa, i) in record.records" :key="i">
                  <tbody>
                    <tr class="border-t">
                      <th class="text-left py-2 pr-4">{{ $t('dns.primaryNameServer') }}</th>
                      <td class="py-2">{{ soa.nsname }}</td>
                    </tr>
                    <tr class="border-t">
                      <th class="text-left py-2 pr-4">{{ $t('dns.hostmaster') }}</th>
                      <td class="py-2">{{ soa.hostmaster }}</td>
                    </tr>
                    <tr class="border-t">
                      <th class="text-left py-2 pr-4">{{ $t('dns.serial') }}</th>
                      <td class="py-2">{{ soa.serial }}</td>
                    </tr>
                    <tr class="border-t">
                      <th class="text-left py-2 pr-4">{{ $t('dns.refresh') }}</th>
                      <td class="py-2">{{ soa.refresh }}</td>
                    </tr>
                    <tr class="border-t">
                      <th class="text-left py-2 pr-4">{{ $t('dns.retry') }}</th>
                      <td class="py-2">{{ soa.retry }}</td>
                    </tr>
                    <tr class="border-t">
                      <th class="text-left py-2 pr-4">{{ $t('dns.expire') }}</th>
                      <td class="py-2">{{ soa.expire }}</td>
                    </tr>
                    <tr class="border-t">
                      <th class="text-left py-2 pr-4">{{ $t('dns.minimumTTL') }}</th>
                      <td class="py-2">{{ soa.minttl }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- 其他记录类型 -->
              <div v-else class="overflow-x-auto">
                <pre class="p-4 bg-gray-50 rounded text-sm">{{ JSON.stringify(record.records, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { apiGet } from '~/utils/api';

// 域名输入
const domainInput = ref('');
const hasError = ref(false);
const error = ref('');
const isLoading = ref(false);
const currentDomain = ref('');
const dnsRecords = ref<any[]>([]);

// DNS记录类型选项
const recordTypes = ref([
  { value: 'A', selected: true },
  { value: 'AAAA', selected: true },
  { value: 'CNAME', selected: true },
  { value: 'MX', selected: true },
  { value: 'NS', selected: true },
  { value: 'TXT', selected: true },
  { value: 'SOA', selected: true }
]);

// 计算当前选中的记录类型
const selectedTypes = computed(() => {
  return recordTypes.value
    .filter(type => type.selected)
    .map(type => type.value);
});

// 验证域名格式
function validateDomain(domain: string): boolean {
  if (!domain || domain.trim() === '') {
    error.value = useNuxtApp().$i18n.t('dns.errors.emptyDomain');
    return false;
  }

  // 简单的域名格式验证
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!domainRegex.test(domain.trim())) {
    error.value = useNuxtApp().$i18n.t('dns.errors.invalidDomain');
    return false;
  }

  return true;
}

// 标准化域名格式（去除空格，转为小写）
function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase();
}

// 获取DNS记录
async function fetchDnsRecords() {
  // 重置错误状态
  hasError.value = false;
  error.value = '';
  
  // 验证域名
  if (!validateDomain(domainInput.value)) {
    hasError.value = true;
    return;
  }
  
  const normalizedDomain = normalizeDomain(domainInput.value);
  currentDomain.value = normalizedDomain;
  
  // 检查是否有选中的记录类型
  if (selectedTypes.value.length === 0) {
    hasError.value = true;
    error.value = useNuxtApp().$i18n.t('dns.errors.noTypesSelected');
    return;
  }
  
  // 设置加载状态
  isLoading.value = true;
  dnsRecords.value = [];
  
  try {
    // 构建查询参数
    const queryParams = {
      domain: normalizedDomain,
      types: selectedTypes.value.join(',')
    };
    
    // 使用API工具调用接口
    const data = await apiGet('/api/dns', queryParams);
    
    // 更新记录
    dnsRecords.value = data;
  } catch (err: any) {
    hasError.value = true;
    error.value = err.message || useNuxtApp().$i18n.t('common.errors.fetchError');
  } finally {
    isLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.dns-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.loading-spinner {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: currentColor;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 暗色主题支持 */
:global(.dark) {
  .dns-page {
    color: #f1f1f1;
  }
  
  .domain-input input {
    background-color: #2a2a2a;
    border-color: #444;
    color: #f1f1f1;
  }
  
  .record-header {
    background-color: #222;
    border-color: #444;
  }
  
  .record-body {
    background-color: #2a2a2a;
    border-color: #444;
  }
  
  table {
    color: #e1e1e1;
    
    th {
      color: #999;
    }
    
    tr.border-t {
      border-color: #444;
    }
  }
  
  .loading-spinner {
    border-color: rgba(255, 255, 255, 0.1);
    border-top-color: currentColor;
  }
  
  .no-data, .error-state {
    background-color: #282828;
    border-color: #444;
  }
}
</style> 