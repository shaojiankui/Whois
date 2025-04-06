<template>
  <div class="tld-list-container">
    <h1 class="page-title">{{ $t('tldList.title') }}</h1>
    <p class="page-description">{{ $t('tldList.description') }}</p>
    
    <div class="search-filter-container">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="$t('tldList.search')" 
          class="search-input"
        />
      </div>
      
      <div class="filter-options">
        <div class="category-filter">
          <span class="filter-label">{{ $t('tldList.category') }}:</span>
          <div class="filter-buttons">
            <button 
              v-for="category in categoryOptions" 
              :key="category.value"
              @click="selectedCategory = category.value"
              class="filter-button"
              :class="{ 'active': selectedCategory === category.value }"
            >
              {{ $t(category.label) }}
            </button>
          </div>
        </div>
        
        <div class="type-filter">
          <span class="filter-label">{{ $t('tldList.type') }}:</span>
          <div class="filter-buttons">
            <button 
              v-for="type in typeOptions" 
              :key="type.value"
              @click="selectedType = type.value"
              class="filter-button"
              :class="{ 'active': selectedType === type.value }"
            >
              {{ $t(type.label) }}
            </button>
          </div>
        </div>
        
        <div class="level-filter">
          <span class="filter-label">{{ $t('tldList.level') }}:</span>
          <div class="filter-buttons">
            <button 
              v-for="level in levelOptions" 
              :key="level.value"
              @click="selectedLevel = level.value"
              class="filter-button"
              :class="{ 'active': selectedLevel === level.value }"
            >
              {{ $t(level.label) }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="tld-count">
      {{ $t('tldList.totalCount', { count: filteredTlds.length }) }}
    </div>
    
    <div v-if="isLoading" class="loading-container standard-card">
      <div class="loader"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>
    
    <div v-else-if="error" class="error-container standard-card">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="fetchTlds" class="retry-button">{{ $t('common.retry') }}</button>
    </div>
    
    <div v-else-if="filteredTlds.length === 0" class="no-results standard-card">
      <p>{{ $t('common.noData') }}</p>
    </div>
    
    <div v-else class="tld-grid">
      <div 
        v-for="tld in currentPageTlds" 
        :key="tld.tld" 
        class="tld-card standard-card"
        @click="showTldDetails(tld)"
      >
        <div class="tld-name">.{{ tld.tld }}</div>
        <div class="tld-type">{{ getTldTypeName(tld.type) }}</div>
        <div class="tld-info">
          <div class="info-item">
            <span class="info-label">{{ $t('domain.registrar') }}:</span>
            <span class="info-value">{{ tld.registry || '-' }}</span>
          </div>
          <div class="info-item" v-if="tld.countryCode">
            <span class="info-label">{{ $t('country') }}:</span>
            <span class="info-value">{{ tld.countryName || tld.countryCode }}</span>
          </div>
          <div class="info-item" v-if="tld.whoisServer">
            <span class="info-label">WHOIS:</span>
            <span class="info-value">{{ tld.whoisServer }}</span>
          </div>
          <div class="info-item" v-if="tld.category">
            <span class="info-label">{{ $t('tldList.category') }}:</span>
            <span class="info-value">{{ tld.category }}</span>
          </div>
          <div class="info-item" v-if="tld.creation">
            <span class="info-label">{{ $t('tldList.created') }}:</span>
            <span class="info-value">{{ formatDate(tld.creation) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 增强版分页控件 -->
    <div v-if="filteredTlds.length > 0" class="pagination-container">
      <div class="page-size-selector">
        <span class="page-size-label">{{ $t('tldList.pageSize') }}:</span>
        <select v-model="pageSize" class="page-size-select" @change="handlePageSizeChange">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
      
      <div class="pagination">
        <button 
          @click="goToFirstPage" 
          class="pagination-button" 
          :disabled="currentPage === 1"
          :class="{ 'disabled': currentPage === 1 }"
          title="First Page"
        >
          &laquo;
        </button>
        
        <button 
          @click="prevPage" 
          class="pagination-button" 
          :disabled="currentPage === 1"
          :class="{ 'disabled': currentPage === 1 }"
          title="Previous Page"
        >
          &lt;
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="pageNum in displayedPageNumbers" 
            :key="pageNum" 
            @click="goToPage(pageNum)"
            class="page-number-button"
            :class="{ 'active': currentPage === pageNum }"
          >
            {{ pageNum }}
          </button>
        </div>
        
        <button 
          @click="nextPage" 
          class="pagination-button" 
          :disabled="currentPage === totalPages"
          :class="{ 'disabled': currentPage === totalPages }"
          title="Next Page"
        >
          &gt;
        </button>
        
        <button 
          @click="goToLastPage" 
          class="pagination-button" 
          :disabled="currentPage === totalPages"
          :class="{ 'disabled': currentPage === totalPages }"
          title="Last Page"
        >
          &raquo;
        </button>
      </div>
      
      <div class="page-jumper">
        <span class="page-jumper-label">{{ $t('tldList.goTo') }}:</span>
        <input 
          type="number" 
          v-model="pageInputValue" 
          class="page-input" 
          :min="1" 
          :max="totalPages"
          @keyup.enter="jumpToPage"
        />
        <button @click="jumpToPage" class="jump-button">{{ $t('tldList.go') }}</button>
      </div>
    </div>
    
    <!-- TLD详情模态框 -->
    <div v-if="showModal" class="tld-modal-backdrop" @click="closeModal">
      <div class="tld-modal-content standard-card" @click.stop>
        <button class="modal-close-button" @click="closeModal">×</button>
        
        <div v-if="selectedTld" class="tld-detail-content">
          <h2 class="tld-detail-title">.{{ selectedTld.tld }}</h2>
          <div class="tld-detail-type">{{ getTldTypeName(selectedTld.type) }}</div>
          
          <div class="tld-detail-section">
            <h3>{{ $t('tldList.basicInfo') }}</h3>
            <div class="tld-detail-info">
              <div class="detail-row">
                <span class="detail-label">{{ $t('domain.registrar') }}:</span>
                <span class="detail-value">{{ selectedTld.registry || '-' }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.countryName">
                <span class="detail-label">{{ $t('country') }}:</span>
                <span class="detail-value">{{ selectedTld.countryName }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.category">
                <span class="detail-label">{{ $t('tldList.category') }}:</span>
                <span class="detail-value">{{ selectedTld.category }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.creation">
                <span class="detail-label">{{ $t('tldList.created') }}:</span>
                <span class="detail-value">{{ formatDate(selectedTld.creation) }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.backend">
                <span class="detail-label">{{ $t('tldList.backend') }}:</span>
                <span class="detail-value">{{ selectedTld.backend }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.phone">
                <span class="detail-label">{{ $t('tldList.phone') }}:</span>
                <span class="detail-value">{{ selectedTld.phone }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.description">
                <span class="detail-label">{{ $t('tldList.description') }}:</span>
                <span class="detail-value description-value">{{ selectedTld.description }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.remark">
                <span class="detail-label">{{ $t('tldList.remark') }}:</span>
                <span class="detail-value">{{ selectedTld.remark }}</span>
              </div>
            </div>
          </div>
          
          <div class="tld-detail-section">
            <h3>{{ $t('tldList.technicalInfo') }}</h3>
            <div class="tld-detail-info">
              <div class="detail-row">
                <span class="detail-label">WHOIS {{ $t('tldList.server') }}:</span>
                <span class="detail-value">{{ selectedTld.whoisServer || '-' }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.whois_adapter">
                <span class="detail-label">{{ $t('tldList.adapter') }}:</span>
                <span class="detail-value">{{ selectedTld.whois_adapter }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.whois_availability">
                <span class="detail-label">{{ $t('tldList.availabilityCheck') }}:</span>
                <span class="detail-value"><code>{{ selectedTld.whois_availability }}</code></span>
              </div>
              <div class="detail-row" v-if="selectedTld.whois_reserved">
                <span class="detail-label">{{ $t('tldList.reservedPattern') }}:</span>
                <span class="detail-value"><code>{{ selectedTld.whois_reserved }}</code></span>
              </div>
              <div class="detail-row" v-if="selectedTld.length">
                <span class="detail-label">{{ $t('tldList.length') }}:</span>
                <span class="detail-value">{{ selectedTld.length }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.level">
                <span class="detail-label">{{ $t('tldList.level') }}:</span>
                <span class="detail-value">{{ selectedTld.level }}</span>
              </div>
            </div>
          </div>
          
          <div class="tld-detail-section" v-if="selectedTld.timezone_name || selectedTld.timezone_offset">
            <h3>{{ $t('tldList.timeInfo') }}</h3>
            <div class="tld-detail-info">
              <div class="detail-row" v-if="selectedTld.timezone_name">
                <span class="detail-label">{{ $t('tldList.timezoneName') }}:</span>
                <span class="detail-value">{{ selectedTld.timezone_name }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.timezone_offset">
                <span class="detail-label">{{ $t('tldList.timezoneOffset') }}:</span>
                <span class="detail-value">{{ selectedTld.timezone_offset }}</span>
              </div>
              <div class="detail-row" v-if="selectedTld.timezone_format">
                <span class="detail-label">{{ $t('tldList.timezoneFormat') }}:</span>
                <span class="detail-value"><code>{{ selectedTld.timezone_format }}</code></span>
              </div>
              <div class="detail-row" v-if="selectedTld.timezone_showformat">
                <span class="detail-label">{{ $t('tldList.timezoneShowformat') }}:</span>
                <span class="detail-value"><code>{{ selectedTld.timezone_showformat }}</code></span>
              </div>
              <div class="detail-row" v-if="selectedTld.timezone_demo">
                <span class="detail-label">{{ $t('tldList.timezoneDemo') }}:</span>
                <span class="detail-value">{{ selectedTld.timezone_demo }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { apiGet } from '~/utils/api';
import dayjs from 'dayjs';
import { TLDInfo } from '~/types/tld';



// 状态变量
const isLoading = ref(true);
const error = ref('');
const tlds = ref<TLDInfo[]>([]);
const searchQuery = ref('');
const selectedCategory = ref('all');
const selectedType = ref('all');
const selectedLevel = ref('1');

// 分页相关
const currentPage = ref(1);
const pageSize = ref(50);
const pageInputValue = ref('');
const pageSizeOptions = [50, 100, 500];
const totalPages = computed(() => Math.ceil(filteredTlds.value.length / pageSize.value));

// 计算要显示的页码数字
const displayedPageNumbers = computed(() => {
  const totalPageCount = totalPages.value;
  const currentPageNum = currentPage.value;
  let startPage = 1;
  let endPage = totalPageCount;
  const maxDisplayedPages = 5; // 最多显示5个页码
  
  if (totalPageCount > maxDisplayedPages) {
    // 当前页在开头
    if (currentPageNum <= Math.ceil(maxDisplayedPages / 2)) {
      endPage = maxDisplayedPages;
    }
    // 当前页在末尾
    else if (currentPageNum > totalPageCount - Math.floor(maxDisplayedPages / 2)) {
      startPage = totalPageCount - maxDisplayedPages + 1;
    }
    // 当前页在中间
    else {
      startPage = currentPageNum - Math.floor(maxDisplayedPages / 2);
      endPage = currentPageNum + Math.floor(maxDisplayedPages / 2);
    }
  }
  
  // 生成页码数组
  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return pages;
});

// 模态框状态
const showModal = ref(false);
const selectedTld = ref<TLDInfo | null>(null);

// 分类选项
const categoryOptions = ref([
  { value: 'all', label: 'tldList.categories.all' }
]);

// 类型选项
const typeOptions = ref([
  { value: 'all', label: 'tldList.types.all' }
]);

// 级别选项
const levelOptions = [
  { value: 'all', label: 'tldList.levelAll' },
  { value: '1', label: 'tldList.level1' },
  { value: '2', label: 'tldList.level2' },
  { value: '3', label: 'tldList.level3' }
];

// 获取所有TLD类型和分类
const fetchTldTypes = async () => {
  try {
    // 获取类型
    const types = await apiGet('/api/tld/types');
    
    // 添加所有类型选项
    typeOptions.value = [
      { value: 'all', label: 'tldList.types.all' },
      ...types.map((type: string) => {
        // 根据类型设置对应的标签
        let label = '';
        switch (type) {
          case 'gTLD':
            label = 'tldList.types.generic';
            break;
          case 'ccTLD':
            label = 'tldList.types.country';
            break;
          case 'newgTLD':
            label = 'tldList.types.new';
            break;
          case 'chineseTLD':
            label = 'tldList.types.chinese';
            break;
          case 'specialTLD':
            label = 'tldList.types.special';
            break;
          case 'private':
            label = 'tldList.types.private';
            break;
          default:
            label = `Type: ${type}`;
        }
        return { value: type, label };
      })
    ];
    
    // 获取分类
    const categories = await apiGet('/api/tld/categories');
    
    // 添加所有分类选项
    categoryOptions.value = [
      { value: 'all', label: 'tldList.categories.all' },
      ...categories.map((category: string) => {
        return { value: category, label: category };
      })
    ];
    
    console.log('类型选项:', typeOptions.value);
    console.log('分类选项:', categoryOptions.value);
  } catch (err) {
    console.error('Error fetching TLD types and categories:', err);
  }
};

// 从MySQL数据库获取TLD数据
const fetchTlds = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    // 使用API工具获取数据
    tlds.value = await apiGet('/api/tlds');
    
    // 输出调试信息，查看不同的类型值
    console.log('TLD类型:', [...new Set(tlds.value.map(t => t.type))]);
    
  } catch (err) {
    console.error('Error fetching TLDs:', err);
    error.value = err.message || 'Failed to load TLD data';
  } finally {
    isLoading.value = false;
  }
};

// 转化TLD类型为显示名称
const getTldTypeName = (type: string): string => {
  switch (type) {
    case 'gTLD':
      return 'gTLD';
    case 'ccTLD':
      return 'ccTLD';
    case 'newgTLD':
      return 'New gTLD';
    case 'chineseTLD':
      return 'Chinese TLD';
    case 'specialTLD':
      return 'Special TLD';
    case 'private':
      return 'Private TLD';
    default:
      return type || '-';
  }
};

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

// 显示TLD详情
const showTldDetails = (tld: TLDInfo) => {
  selectedTld.value = tld;
  showModal.value = true;
  document.body.style.overflow = 'hidden'; // 防止背景滚动
};

// 关闭模态框
const closeModal = () => {
  showModal.value = false;
  document.body.style.overflow = ''; // 恢复背景滚动
};

// 过滤TLD列表
const filteredTlds = computed(() => {
  let filtered = [...tlds.value];
  
  // 按类型过滤
  if (selectedType.value !== 'all') {
    filtered = filtered.filter(tld => {
      // 处理type为null或空字符串的情况
      return tld.type === selectedType.value;
    });
  }
  
  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(tld => {
      // 处理category为null或空字符串的情况
      return tld.category === selectedCategory.value;
    });
  }
  
  // 按级别过滤
  if (selectedLevel.value !== 'all') {
    filtered = filtered.filter(tld => String(tld.level) === selectedLevel.value);
  }
  
  // 按搜索词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(tld => {
      // 检查各字段是否匹配搜索词
      return tld.name.toLowerCase().includes(query) || 
             (tld.countryName && tld.countryName.toLowerCase().includes(query)) ||
             (tld.description && tld.description.toLowerCase().includes(query)) ||
             (tld.registry && tld.registry.toLowerCase().includes(query)) ||
             (tld.category && tld.category.toLowerCase().includes(query)) ||
             (tld.type && tld.type.toLowerCase().includes(query)) ||
             // 添加对显示类型名称的搜索支持
             getTldTypeName(tld.type).toLowerCase().includes(query);
    });
  }
  
  return filtered;
});

// 当前页TLD列表
const currentPageTlds = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  return filteredTlds.value.slice(startIndex, startIndex + pageSize.value);
});

// 更改每页显示数量
const handlePageSizeChange = () => {
  currentPage.value = 1; // 重置到第一页
  scrollToTop();
};

// 跳转到特定页
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    scrollToTop();
  }
};

// 转到第一页
const goToFirstPage = () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
    scrollToTop();
  }
};

// 转到最后一页
const goToLastPage = () => {
  if (currentPage.value !== totalPages.value) {
    currentPage.value = totalPages.value;
    scrollToTop();
  }
};

// 通过输入框跳转
const jumpToPage = () => {
  const pageNum = parseInt(pageInputValue.value);
  if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages.value) {
    currentPage.value = pageNum;
    scrollToTop();
  }
  // 清空输入框
  pageInputValue.value = '';
};

// 转到下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    scrollToTop();
  }
};

// 转到上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    scrollToTop();
  }
};

// 滚动到页面顶部
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 搜索时重置页码
watch(searchQuery, () => {
  currentPage.value = 1;
});

// 切换分类时重置页码
watch(selectedCategory, () => {
  currentPage.value = 1;
});

// 切换类型时重置页码
watch(selectedType, () => {
  currentPage.value = 1;
});

// 切换级别时重置页码
watch(selectedLevel, () => {
  currentPage.value = 1;
});

// 在组件挂载时加载数据
onMounted(() => {
  fetchTldTypes();
  fetchTlds();
});
</script>

<style lang="scss" scoped>
.tld-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.page-description {
  font-size: 1.1rem;
  color: var(--muted-text);
  margin-bottom: 2.5rem;
}

.search-filter-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (min-width: 992px) {
    flex-direction: row;
    align-items: flex-start;
  }
  
  .search-box {
    flex: 0 0 100%;
    
    @media (min-width: 992px) {
      flex: 0 0 30%;
      max-width: 320px;
    }
    
    .search-input {
      width: 100%;
      padding: 0.8rem 1.2rem;
      font-size: 1rem;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      outline: none;
      transition: all 0.2s;
      background-color: var(--input-bg);
      color: var(--text-color);
      
      &:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(17, 252, 212, 0.25);
      }
    }
  }
  
  .filter-options {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    
    @media (min-width: 768px) {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
  
  .category-filter,
  .type-filter,
  .level-filter {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    @media (min-width: 576px) {
      flex-direction: row;
      align-items: center;
    }
    
    .filter-label {
      font-weight: 600;
      margin-right: 0.5rem;
      white-space: nowrap;
    }
    
    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      
      .filter-button {
        padding: 0.5rem 1rem;
        background: var(--card-bg);
        color: var(--card-text-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          background: var(--border-color);
        }
        
        &.active {
          background: var(--primary-color);
          color: #111111;
          border-color: var(--primary-color);
        }
      }
    }
  }
}

.tld-count {
  margin-bottom: 1.5rem;
  font-weight: 600;
  color: var(--muted-text);
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  
  .loader {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-left-color: var(--primary-color);
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--error-color);
  }
  
  .retry-button {
    margin-top: 1rem;
    padding: 0.5rem 1.5rem;
    background-color: var(--primary-color);
    color: #111111;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background-color: var(--hover-color);
    }
  }
}

.no-results {
  padding: 2rem;
  text-align: center;
}

.tld-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.tld-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding: 1rem;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  .tld-name {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.3rem;
    color: var(--primary-color);
  }
  
  .tld-type {
    font-size: 0.8rem;
    display: inline-block;
    background-color: rgba(17, 252, 212, 0.1);
    color: var(--card-text-color);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-bottom: 0.7rem;
  }
  
  .tld-info {
    margin-bottom: 0.7rem;
    flex-grow: 1;
    
    .info-item {
      margin-bottom: 0.3rem;
      font-size: 0.85rem;
      
      .info-label {
        font-weight: 600;
        margin-right: 0.3rem;
      }
    }
  }
}

/* 增强版分页样式 */
.pagination-container {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .page-size-label {
    font-weight: 600;
    white-space: nowrap;
  }
  
  .page-size-select {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--card-bg);
    color: var(--card-text-color);
    cursor: pointer;
    
    &:focus {
      border-color: var(--primary-color);
      outline: none;
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  
  .pagination-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--card-bg);
    color: var(--card-text-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover:not(.disabled) {
      background-color: var(--border-color);
    }
    
    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .page-numbers {
    display: flex;
    gap: 0.25rem;
    
    .page-number-button {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--card-bg);
      color: var(--card-text-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: var(--border-color);
      }
      
      &.active {
        background-color: var(--primary-color);
        color: #111111;
        border-color: var(--primary-color);
      }
    }
  }
}

.page-jumper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .page-jumper-label {
    font-weight: 600;
    white-space: nowrap;
  }
  
  .page-input {
    width: 60px;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--input-bg);
    color: var(--text-color);
    text-align: center;
    
    &:focus {
      border-color: var(--primary-color);
      outline: none;
    }
    
    /* 移除数字输入框的上下箭头 */
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    /* Firefox */
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
    
    &:hover {
      background-color: var(--hover-color);
    }
  }
}

.tld-modal-backdrop {
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

.tld-modal-content {
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 2rem;
}

.modal-close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--card-text-color);
  
  &:hover {
    color: var(--primary-color);
  }
}

.tld-detail-content {
  .tld-detail-title {
    font-size: 2rem;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
  }
  
  .tld-detail-type {
    font-size: 1rem;
    background-color: rgba(17, 252, 212, 0.1);
    color: var(--card-text-color);
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 1.5rem;
  }
  
  .tld-detail-section {
    margin-bottom: 2rem;
    
    h3 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .tld-detail-info {
      .detail-row {
        display: flex;
        margin-bottom: 0.8rem;
        
        @media (max-width: 576px) {
          flex-direction: column;
          margin-bottom: 1rem;
        }
        
        .detail-label {
          font-weight: 600;
          min-width: 120px;
          margin-right: 1rem;
        }
        
        .detail-value {
          a {
            color: var(--primary-color);
            text-decoration: none;
            
            &:hover {
              text-decoration: underline;
            }
          }
        }
        
        &.patterns-row {
          flex-direction: column;
          
          .pattern-list {
            list-style: none;
            padding: 0;
            margin: 0;
            
            li {
              margin-bottom: 0.5rem;
              
              code {
                background-color: rgba(17, 252, 212, 0.05);
                color: var(--card-text-color);
                padding: 0.2rem 0.4rem;
                border-radius: 4px;
                font-family: monospace;
              }
            }
          }
        }
      }
    }
  }
  
  .description-value {
    white-space: pre-line;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 10px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>