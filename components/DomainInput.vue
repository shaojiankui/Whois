<template>
  <div class="domain-input-container">
    <form @submit.prevent="handleSubmit" class="domain-form">
      <div class="input-wrapper">
        <input
          type="text"
          v-model="domainInput"
          :placeholder="$t('home.searchPlaceholder')"
          ref="inputEl"
          @input="validateDomain"
          class="domain-input"
          :class="{ 'error': hasError }"
        />
        <button 
          type="submit" 
          class="w-button"
          :disabled="isLoading || hasError"
        >
          <span v-if="isLoading">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('home.searchButton') }}</span>
        </button>
      </div>
      <p v-if="hasError" class="error-message">{{ $t('errors.invalidDomain') }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
const props = defineProps({
  domain: {
    type: String,
    default: ''
  }
});
// 域名输入值
const domainInput = ref('');
const hasError = ref(false);
const isLoading = ref(false);
const router = useRouter();

domainInput.value = props.domain;

// 输入框引用
const inputEl = ref<HTMLInputElement | null>(null);

// 检查域名是否有效，基本格式验证
const validateDomain = () => {
  if (!domainInput.value) {
    hasError.value = false;
    return;
  }
  
  // 只进行最基本的检查，确保有内容且包含至少一个点
  hasError.value = !domainInput.value.includes('.');
};

// 提交处理
const handleSubmit = async () => {
  if (!domainInput.value) return;
  
  isLoading.value = true;
  try {
    // 执行基本的清理（移除前后空格和转小写）
    const inputDomain = domainInput.value.trim().toLowerCase();
    
    // 将查询域名添加到最近查询中
    saveToRecentSearches(inputDomain);
    
    // 导航到查询结果页面，后端会自动规范化域名
    router.push(`/${inputDomain}`);
  } catch (error) {
    console.error('Error processing domain:', error);
  } finally {
    isLoading.value = false;
  }
};

// 保存到最近搜索
const saveToRecentSearches = (domain: string) => {
  try {
    // 获取现有查询
    let recentSearches = [];
    const storedSearches = localStorage.getItem('recentSearches');
    
    if (storedSearches) {
      const parsedSearches = JSON.parse(storedSearches);
      // 确保我们处理的是数组
      if (Array.isArray(parsedSearches)) {
        recentSearches = parsedSearches.map(item => {
          // 兼容旧格式
          if (typeof item === 'string') {
            return { domain: item, timestamp: Date.now() };
          }
          return item;
        });
      }
    }
    
    // 构建搜索项
    const searchItem = {
      domain: domain,
      timestamp: Date.now()
    };
    
    // 将新查询添加到开头并移除重复项
    const filteredSearches = recentSearches.filter(item => 
      item.domain !== domain
    );
    
    // 限制存储的条目数量为10个
    const updatedSearches = [searchItem, ...filteredSearches].slice(0, 10);
    
    // 保存到localStorage
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  } catch (error) {
    console.error('Error saving to recent searches:', error);
  }
};
</script>

<style lang="scss" scoped>
.domain-input-container {
  width: 100%;
  margin: 0 auto;
}

.domain-form {
  width: 100%;
}

.input-wrapper {
  display: flex;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.domain-input {
  flex: 1;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  border: 2px solid #aaa9a9;
  border-right: none;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
  background-color: var(--input-bg);
  color: var(--text-color);
//   border-color: #aaa9a9;
  &:focus {
    border-color: var(--primary-color);
  }
  
  &.error {
    border-color: var(--error-color);
  }
}


.error-message {
  color: var(--error-color);
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

// 响应式
@media (max-width: 768px) {
  .input-wrapper {
    flex-direction: row;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .domain-input {
    width: 100%;
    border-right: none;
    border-radius: 0;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    margin-bottom: 0;
  }
}
.w-button{
    width: 150px;
}
</style> 