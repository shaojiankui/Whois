<template>
  <div class="app-layout">
    <TheHeader />
    <main class="main-content">
      <slot />
    </main>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
// 移除了重复的语言监听代码
</script>

<style>
/* 全局样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--body-bg);
  transition: background-color 0.3s, color 0.3s;
}

.main-content {
  min-height: calc(100vh - 70px - 70px); /* 减去头部和底部的高度 */
}

h1, h2, h3, h4, h5, h6 {
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

input, button, textarea, select {
  font-family: inherit;
  font-size: inherit;
}

button {
  cursor: pointer;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  h1 {
    font-size: 1.8rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}
</style>
