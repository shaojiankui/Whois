<template>
  <div class="home-container">
    <!-- 头部搜索部分 -->
    <section class="hero-section">
      <h1 class="hero-title">{{ $t('home.title') }}</h1>
      <p class="hero-description">{{ $t('home.description') }}</p>
      
      <DomainInput class="hero-domain-input" />
      
      <div v-if="recentSearches.length > 0" class="recent-searches">
        <div class="recent-searches-header">
          <span class="material-icons">history</span>
          <h3>{{ $t('home.recentSearches') }}</h3>
        </div>
        <div class="recent-items">
          <NuxtLink 
            v-for="(item, index) in recentSearches" 
            :key="index" 
            :to="`/${item.domain || item}`"
            class="recent-item"
          >
            <span class="domain-text">{{ item.domain || item }}</span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 最近的搜索
const recentSearches = ref<any[]>([]);

// 从localStorage加载最近的搜索
onMounted(() => {
  try {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      const parsedSearches = JSON.parse(savedSearches);
      // 获取最近5条搜索记录
      recentSearches.value = parsedSearches.slice(0, 5);
    }
  } catch (err) {
    console.error('Error loading recent searches:', err);
  }
  
  // 如果有domain查询参数，自动跳转到域名查询页面
  const route = useRoute();
  if (route.query.domain) {
    const domain = route.query.domain as string;
    navigateTo(`/${domain}`);
  }
});
</script>

<style lang="scss" scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* Hero部分样式 */
.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem 4rem;
  
  .hero-title {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    font-weight: 700;
    
    @media (min-width: 768px) {
      font-size: 3rem;
    }
  }
  
  .hero-description {
    max-width: 700px;
    margin: 0 auto 2.5rem;
    font-size: 1.2rem;
    color: #666;
    line-height: 1.6;
  }
  
  .hero-domain-input {
    width: 100%;
  }
  
  /* 工具链接样式 */
  .tools-links {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
    width: 100%;
    
    .tool-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background-color: #f5f5f5;
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-color);
      font-weight: 500;
      transition: all 0.2s ease;
      border: 1px solid #e0e0e0;
      
      &:hover {
        background-color: var(--primary-color);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .tool-icon {
        font-size: 1.2rem;
      }
      
      .tool-text {
        font-size: 1rem;
      }
    }
  }
  
  .recent-searches {
    margin-top: 2rem;
    width: 100%;
    background-color: var(--card-bg);
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .recent-searches-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      
      .material-icons {
        color: var(--primary-color);
        margin-right: 0.5rem;
        font-size: 1.2rem;
      }
      
      h3 {
        font-size: 1rem;
        color: var(--text-color);
        font-weight: 600;
        margin: 0;
      }
    }
    
    .recent-items {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      
      .recent-item {
        display: flex;
        align-items: center;
        background-color: #2a2a2a;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        text-decoration: none;
        color: #ffffff;
        transition: all 0.2s;
        border: 1px solid #444;
        
        .domain-text {
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        &:hover {
          background-color: var(--primary-color);
          color: #111111;
          transform: translateY(-2px);
        }
      }
    }
    
    @media (max-width: 768px) {
      padding: 0.8rem;
      
      .recent-items {
        gap: 0.6rem;
        
        .recent-item {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
          
          .domain-text {
            max-width: 100px;
          }
        }
      }
    }
  }
}

:global(.light-theme) {
  .hero-section {
    .recent-searches {
      .recent-item {
        background-color: #e5e5e5; /* Light gray background for light theme */
        border-color: #d0d0d0;
        color: #333333; /* Dark text for light background */
        
        &:hover {
          background-color: var(--primary-color);
          color: #111111;
        }
      }
    }
  }
}

:global(.dark-theme) {
  .hero-section {
    .hero-description {
      color: #bbb;
    }
    
    .tools-links .tool-link {
      background-color: #2d2d2d;
      border-color: #444;
    }
    
    .recent-searches {
      .recent-item {
        background-color: #2a2a2a;
        border-color: #444;
        color: #ffffff;
        
        &:hover {
          background-color: var(--primary-color);
          color: #111111;
        }
      }
    }
  }
}
</style>