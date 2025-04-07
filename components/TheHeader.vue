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
            <div class="user-menu">
              <div @click="toggleUserMenu" ref="userMenuTrigger" class="user-avatar-wrapper">
                <span class="sr-only">Open user menu</span>
                <div ref="avatarRef" class="user-avatar">
                  {{ initialLetter }}
                </div>
              </div>

              <transition 
                name="dropdown"
                enter-active-class="dropdown-enter-active"
                leave-active-class="dropdown-leave-active"
              >
                <div v-show="showUserMenu" class="user-dropdown">
                  <NuxtLink :to="localePath('/profile')" class="dropdown-item">
                    {{ $t("header.profile") }}
                  </NuxtLink>
                  <NuxtLink :to="localePath('/settings')" class="dropdown-item">
                    {{ $t("header.settings") }}
                  </NuxtLink>
                  <div class="dropdown-divider"></div>
                  <NuxtLink :to="localePath('/ui-guide')" class="dropdown-item">
                    {{ $t("ui.designSystem") }}
                  </NuxtLink>
                  <div class="dropdown-divider"></div>
                  <button @click="handleLogout" class="dropdown-item logout">
                    {{ $t("header.logout") }}
                  </button>
                </div>
              </transition>
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
import { useRouter } from 'vue-router';

// 国际化
const { locale, locales,setLocale } = useI18n();
const localePath = useLocalePath();
const selectedLocale = ref(locale.value);
const availableLocales = computed(() => locales.value);
const router = useRouter();

// 移动导航
const mobileMenuOpen = ref(false);
const isMobile = ref(false);

// 用户下拉菜单
const showUserMenu = ref(false);
const userMenuTrigger = ref(null);

// 用户登录状态
const isLoggedIn = ref(false);
const userName = ref('');
const userInitials = computed(() => {
  if (!userName.value) return '';
  return userName.value.split(' ').map(n => n[0]).join('').toUpperCase();
});

// 用户相关变量
const avatarRef = ref(null);
const initialLetter = computed(() => {
  if (!userName.value) return 'U';
  return userName.value.charAt(0).toUpperCase();
});

// 获取当前用户信息
const fetchUserInfo = async () => {
  try {
    const response = await fetch('/api/user/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('User info response:', result); // 添加调试信息
      if (result.code === 200 && result.data) {
        isLoggedIn.value = true;
        userName.value = result.data.name || result.data.username || 'User';
        console.log('User name set to:', userName.value); // 添加调试信息
      } else {
        isLoggedIn.value = false;
      }
    } else {
      isLoggedIn.value = false;
    }
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    isLoggedIn.value = false;
  }
};

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

// 切换用户菜单
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

// 注销处理函数
const handleLogout = async () => {
  try {
    const response = await fetch('/api/user/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      isLoggedIn.value = false;
      showUserMenu.value = false;
      router.push(localePath('/'));
      
      // 刷新页面以更新导航栏状态
      window.location.reload();
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

// 保持现有的mobile logout函数
const logoutMobile = () => {
  handleLogout();
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
  
  // 获取用户信息
  fetchUserInfo();
  
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

// 监听路由变化时检查用户状态
watch(() => router.currentRoute.value.path, () => {
  fetchUserInfo();
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
      position: relative;
      
      .user-avatar-wrapper {
        cursor: pointer;
        display: flex;
        align-items: center;
      }
      
      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: var(--bg-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1.1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        text-transform: uppercase;
      }
      
      .user-dropdown {
        position: absolute;
        top: 45px;
        right: 0;
        background-color: var(--card-bg);
        border-radius: 8px;
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
        }
        
        .dropdown-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 0.25rem 0;
        }
        
        .logout {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          font-family: inherit;
          color: var(--error-color);
          
          &:hover {
            background-color: rgba(239, 68, 68, 0.1);
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

// 下拉菜单动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.dropdown-enter-active {
  transform: translateY(0);
  opacity: 1;
}

.dropdown-leave-active {
  transform: translateY(-10px);
  opacity: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style> 