<template>
  <div class="changelog-page">
    <div class="container">
      <h1 class="changelog-title">{{ $t('changelog.title') }}</h1>
      <div class="changelog-content" v-if="changelogContent" v-html="changelogContent"></div>
      <div class="changelog-loading" v-else>
        <div class="loader"></div>
        <p>{{ $t('changelog.loading') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 定义状态
const changelogContent = ref('');

// 获取更新日志内容
onMounted(async () => {
  try {
    const response = await fetch('/api/changelog');
    if (response.ok) {
      const data = await response.json();
      changelogContent.value = data.data.content;
    } else {
      console.error('无法加载更新日志');
    }
  } catch (error) {
    console.error('加载更新日志时出错:', error);
  }
});
</script>

<style lang="scss" scoped>
.changelog-page {
  padding: 2rem 0;
  
  .container {
    margin: 0 auto;
    padding: 0 1.5rem;
  }
  
  .changelog-title {
    margin-bottom: 2rem;
    font-size: 2rem;
    color: var(--heading-color);
    text-align: center;
    font-weight: 600;
  }
  
  .changelog-content {
    background-color: var(--card-bg);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    line-height: 1.5;
    letter-spacing: 0.01em;
    color: var(--text-color);
    font-size: 0.95rem;
    
    :deep(h1) {
      font-size: 1.6rem;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--heading-color);
    }
    
    :deep(h2) {
      font-size: 1.4rem;
      margin: 1.25rem 0 0.5rem 0;
      color: var(--primary-color);
      font-weight: 600;
      letter-spacing: 0;
      position: relative;
      padding-bottom: 0.25rem;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 3rem;
        height: 2px;
        background-color: var(--primary-color);
        opacity: 0.5;
      }
    }
    
    :deep(h3) {
      font-size: 1.15rem;
      margin: 1rem 0 0.5rem 0;
      color: var(--heading-color);
      font-weight: 600;
      letter-spacing: 0;
    }

    :deep(p) {
      margin: 0.3rem 0;
      line-height: 1.4;
    }
    
    :deep(ul), :deep(ol) {
      padding-left: 1.5rem;
      margin: 0.5rem 0 0.75rem;
      
      li {
        margin-bottom: 0.25rem;
        line-height: 1.4;
      }
    }
    
    :deep(strong) {
      color: var(--heading-color);
      font-weight: 600;
    }
    
    :deep(a) {
      color: var(--primary-color);
      text-decoration: none;
      border-bottom: 1px dotted var(--primary-color);
      
      &:hover {
        border-bottom-style: solid;
      }
    }
    
    :deep(code) {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 0.15rem 0.3rem;
      border-radius: 3px;
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.85em;
      color: var(--code-color, var(--heading-color));
    }
    
    :deep(pre) {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 0.75rem;
      border-radius: 5px;
      overflow-x: auto;
      margin: 0.75rem 0;
    }

    :deep(pre code) {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      display: block;
      line-height: 1.4;
      font-size: 0.85em;
    }
    
    :deep(blockquote) {
      margin: 0.75rem 0;
      padding: 0.5rem 0.75rem;
      border-left: 3px solid var(--primary-color);
      background-color: rgba(0, 0, 0, 0.02);
      color: var(--muted-text);
      font-style: italic;
      
      p {
        margin: 0.25rem 0;
      }
    }
    
    :deep(hr) {
      margin: 1rem 0;
      border: 0;
      height: 1px;
      background-color: var(--border-color);
    }
  }
  
  .changelog-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 0;
    
    .loader {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid var(--muted-border);
      border-top-color: var(--primary-color);
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    p {
      color: var(--muted-text);
      font-size: 1rem;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 响应式调整
@media (max-width: 768px) {
  .changelog-page {
    padding: 1rem 0;
    
    .changelog-title {
      font-size: 1.6rem;
      margin-bottom: 1rem;
    }
    
    .changelog-content {
      padding: 1.25rem;
      
      :deep(h1) {
        font-size: 1.5rem;
      }
      
      :deep(h2) {
        font-size: 1.3rem;
      }
      
      :deep(h3) {
        font-size: 1.1rem;
      }
    }
  }
}

@media (max-width: 480px) {
  .changelog-page {
    padding: 0.75rem 0;
    
    .container {
      padding: 0 0.75rem;
    }
    
    .changelog-title {
      font-size: 1.4rem;
      margin-bottom: 0.75rem;
    }
    
    .changelog-content {
      padding: 1rem;
      border-radius: 6px;
      
      :deep(h1) {
        font-size: 1.3rem;
        margin-bottom: 0.75rem;
      }
      
      :deep(h2) {
        font-size: 1.2rem;
        margin: 1rem 0 0.4rem;
      }
      
      :deep(h3) {
        font-size: 1.05rem;
        margin: 0.75rem 0 0.4rem;
      }
      
      :deep(p) {
        margin: 0.2rem 0;
      }
      
      :deep(ul), :deep(ol) {
        margin: 0.4rem 0 0.6rem;
        padding-left: 1.25rem;
        
        li {
          margin-bottom: 0.2rem;
        }
      }
      
      :deep(pre) {
        padding: 0.6rem;
        margin: 0.5rem 0;
      }
    }
  }
}
</style> 