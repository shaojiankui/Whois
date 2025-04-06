<template>
  <header class="header">
    <div class="container">
      <div class="logo">
        <NuxtLink :to="localePath('/')" class="logo-link">
          <span class="logo-text">{{ $t('header.title') }}</span>
        </NuxtLink>
      </div>
      
      <nav class="nav-desktop">
        <NuxtLink :to="localePath('/')" class="nav-link">{{ $t('header.home') }}</NuxtLink>
        <NuxtLink :to="localePath('/bulk-check')" class="nav-link">{{ $t('header.bulkCheck') }}</NuxtLink>
        <NuxtLink :to="localePath('/tld-list')" class="nav-link">{{ $t('header.tldList') }}</NuxtLink>
        <NuxtLink :to="localePath('/tld-extract')" class="nav-link">{{ $t('header.tldExtract') }}</NuxtLink>
      </nav>
      
      <div class="right-actions">
        <div class="lang-selector">
          <select v-model="selectedLocale" @change="changeLocale">
            <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
              {{ locale.name }}
            </option>
          </select>
        </div>
        
        <div class="auth-actions">
          <template v-if="isLoggedIn">
            <div class="user-menu" @click="toggleUserMenu" ref="userMenuTrigger">
              <div class="avatar">{{ userInitials }}</div>
              <span v-if="!isMobile">{{ userName }}</span>
              <div class="user-dropdown" v-if="showUserMenu">
                <NuxtLink :to="localePath('/profile')" class="dropdown-item">{{ $t('user.profile') }}</NuxtLink>
                <NuxtLink :to="localePath('/favorites')" class="dropdown-item">{{ $t('user.favorites') }}</NuxtLink>
                <NuxtLink :to="localePath('/history')" class="dropdown-item">{{ $t('user.history') }}</NuxtLink>
                <NuxtLink :to="localePath('/settings')" class="dropdown-item">{{ $t('user.settings') }}</NuxtLink>
                <button @click="logout" class="dropdown-item logout">{{ $t('header.logout') }}</button>
              </div>
            </div>
          </template>
          <template v-else>
            <NuxtLink :to="localePath('/login')" class="auth-link">{{ $t('header.login') }}</NuxtLink>
            <NuxtLink :to="localePath('/register')" class="auth-button">{{ $t('header.register') }}</NuxtLink>
          </template>
        </div>
        
        <button @click="toggleMobileMenu" class="mobile-menu-button">
          <span class="menu-icon"></span>
        </button>
      </div>
    </div>
    
    <div class="mobile-menu" :class="{ 'open': mobileMenuOpen }">
      <nav class="nav-mobile">
        <NuxtLink :to="localePath('/')" class="nav-link" @click="closeMobileMenu">{{ $t('header.home') }}</NuxtLink>
        <NuxtLink :to="localePath('/bulk-check')" class="nav-link" @click="closeMobileMenu">{{ $t('header.bulkCheck') }}</NuxtLink>
        <NuxtLink :to="localePath('/tld-list')" class="nav-link" @click="closeMobileMenu">{{ $t('header.tldList') }}</NuxtLink>
        <NuxtLink :to="localePath('/tld-extract')" class="nav-link" @click="closeMobileMenu">{{ $t('header.tldExtract') }}</NuxtLink>
        
        <template v-if="!isLoggedIn">
          <NuxtLink :to="localePath('/login')" class="nav-link auth" @click="closeMobileMenu">{{ $t('header.login') }}</NuxtLink>
          <NuxtLink :to="localePath('/register')" class="nav-link auth" @click="closeMobileMenu">{{ $t('header.register') }}</NuxtLink>
        </template>
        <template v-else>
          <NuxtLink :to="localePath('/profile')" class="nav-link" @click="closeMobileMenu">{{ $t('user.profile') }}</NuxtLink>
          <NuxtLink :to="localePath('/favorites')" class="nav-link" @click="closeMobileMenu">{{ $t('user.favorites') }}</NuxtLink>
          <NuxtLink :to="localePath('/history')" class="nav-link" @click="closeMobileMenu">{{ $t('user.history') }}</NuxtLink>
          <NuxtLink :to="localePath('/settings')" class="nav-link" @click="closeMobileMenu">{{ $t('user.settings') }}</NuxtLink>
          <button @click="logoutMobile" class="nav-link logout">{{ $t('header.logout') }}</button>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocalePath } from '#i18n';

// 国际化
const { locale, locales,setLocale } = useI18n();
const localePath = useLocalePath();
const selectedLocale = ref(locale.value);
const availableLocales = computed(() => locales.value);

// 移动导航
const mobileMenuOpen = ref(false);
const isMobile = ref(false);

// 用户下拉菜单
const showUserMenu = ref(false);
const userMenuTrigger = ref(null);

// 模拟用户登录状态（后期与API连接）
const isLoggedIn = ref(false);
const userName = ref('');
const userInitials = computed(() => {
  if (!userName.value) return '';
  return userName.value.split(' ').map(n => n[0]).join('').toUpperCase();
});

// 切换语言
const changeLocale = () => {
  // 只需简单设置locale值，Nuxt i18n会自动处理cookie
  locale.value = selectedLocale.value;
};

// 移动菜单
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : '';
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
  document.body.style.overflow = '';
};

// 用户菜单
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

// 注销
const logout = () => {
  // TODO: 实现注销逻辑，连接API
  isLoggedIn.value = false;
  showUserMenu.value = false;
};

const logoutMobile = () => {
  logout();
  closeMobileMenu();
};

// 点击外部关闭用户菜单
const handleOutsideClick = (event) => {
  if (userMenuTrigger.value && !userMenuTrigger.value.contains(event.target)) {
    showUserMenu.value = false;
  }
};

// 检查窗口尺寸
const checkWindowSize = () => {
  isMobile.value = window.innerWidth < 768;
};

// 页面加载时初始化
onMounted(() => {
  // 初始化语言选择器的值
  selectedLocale.value = locale.value;
  
  // 初始化用户状态（实际中从API获取）
  // TODO: 从API获取用户信息
  
  // 添加事件监听
  if (process.client) {
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', checkWindowSize);
    checkWindowSize();
  }
});

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('click', handleOutsideClick);
    window.removeEventListener('resize', checkWindowSize);
  }
});

// 监听全局语言变化，更新选择器
watch(() => locale.value, (newLocale) => {
  selectedLocale.value = newLocale;
});
</script>

<style lang="scss" scoped>
.header {
  background-color: var(--header-bg);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #222;
  
  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    height: 70px;
    position: relative;
  }
  
  .logo {
    display: flex;
    align-items: center;
    position: relative;
    z-index: 1001;
    
    .logo-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      
      .logo-text {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-left: 0.5rem;
      }
    }
  }
  
  .nav-desktop {
    display: flex;
    gap: 1.5rem;
    position: relative;
    z-index: 1001;
    
    @media (max-width: 768px) {
      display: none;
    }
    
    .nav-link {
      color: var(--text-color);
      text-decoration: none;
      font-weight: 500;
      position: relative;
      padding: 0.5rem 0;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background-color: var(--primary-color);
        transition: width 0.2s ease;
      }
      
      &:hover, &.router-link-active {
        color: var(--primary-color);
        
        &::after {
          width: 100%;
        }
      }
    }
  }
  
  .right-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    z-index: 1001;
  }
  
  .lang-selector {
    select {
      background-color: var(--input-bg);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0.3rem 0.5rem;
      cursor: pointer;
      
      &:focus {
        border-color: var(--primary-color);
        outline: none;
      }
    }
  }
  
  .auth-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    @media (max-width: 768px) {
      display: none;
    }
    
    .auth-link {
      color: var(--text-color);
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        color: var(--primary-color);
      }
    }
    
    .auth-button {
      background-color: var(--primary-color);
      color: #000;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: var(--hover-color);
      }
    }
    
    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      position: relative;
      
      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }
      
      .user-dropdown {
        position: absolute;
        top: 40px;
        right: 0;
        background-color: var(--card-bg);
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        width: 180px;
        z-index: 10;
        overflow: hidden;
        border: 1px solid var(--border-color);
        
        .dropdown-item {
          display: block;
          padding: 0.75rem 1rem;
          color: var(--text-color);
          text-decoration: none;
          transition: background-color 0.2s;
          
          &:hover {
            background-color: rgba(17, 252, 212, 0.1);
            color: var(--primary-color);
          }
          
          &.logout {
            border-top: 1px solid var(--border-color);
            color: var(--error-color);
            width: 100%;
            text-align: left;
            background: none;
            border-left: none;
            border-right: none;
            border-bottom: none;
            cursor: pointer;
            
            &:hover {
              background-color: rgba(239, 68, 68, 0.1);
            }
          }
        }
      }
    }
  }
  
  .mobile-menu-button {
    background: none;
    border: none;
    cursor: pointer;
    width: 24px;
    height: 24px;
    position: relative;
    display: none;
    
    @media (max-width: 768px) {
      display: block;
    }
    
    .menu-icon {
      position: absolute;
      width: 24px;
      height: 2px;
      background-color: var(--text-color);
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      transition: background-color 0.2s;
      
      &::before, &::after {
        content: '';
        position: absolute;
        width: 24px;
        height: 2px;
        background-color: var(--text-color);
        left: 0;
        transition: transform 0.2s;
      }
      
      &::before {
        top: -7px;
      }
      
      &::after {
        top: 7px;
      }
    }
  }
  
  .mobile-menu {
    position: fixed;
    top: 70px;
    left: 0;
    width: 100%;
    background-color: var(--card-bg);
    transform: translateY(-100%);
    opacity: 0;
    transition: transform 0.3s, opacity 0.3s;
    z-index: 90;
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    height: calc(100vh - 70px);
    overflow-y: auto;
    
    &.open {
      transform: translateY(0);
      opacity: 1;
    }
    
    .nav-mobile {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      
      .nav-link {
        padding: 1rem;
        color: var(--text-color);
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px solid var(--border-color);
        
        &:hover, &.router-link-active {
          color: var(--primary-color);
        }
        
        &.auth {
          margin-top: 1rem;
        }
        
        &.logout {
          color: var(--error-color);
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 1rem;
          padding: 1rem;
          font-weight: 500;
          
          &:hover {
            color: var(--error-color);
          }
        }
      }
    }
  }
}
</style> 