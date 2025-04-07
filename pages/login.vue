<template>
  <div class="login-page">
    <div class="login-container card">
      <h1>{{ $t('auth.login') }}</h1>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">{{ $t('auth.email') }}</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            :placeholder="$t('auth.enterEmail')"
            class="w-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">{{ $t('auth.password') }}</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            :placeholder="$t('auth.enterPassword')"
            class="w-input"
          />
        </div>
        
        <div class="form-actions">
          <button type="submit" class="w-button" :disabled="isLoading">
            {{ isLoading ? $t('auth.loggingIn') : $t('auth.login') }}
          </button>
        </div>
        
        <div class="form-links">
          <NuxtLink :to="localePath('/register')">{{ $t('auth.noAccount') }}</NuxtLink>
          <NuxtLink :to="localePath('/forgot-password')">{{ $t('auth.forgotPassword') }}</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLocalePath } from '#i18n';

// I18n
const { t } = useI18n();
const localePath = useLocalePath();

// State
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const router = useRouter();

// Methods
async function handleLogin() {
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    const response = await fetch('/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
      credentials: 'include' // 确保包含 cookies
    });
    
    const data = await response.json();
    
    if (!response.ok || data.code !== 200) {
      throw new Error(data.message || t('auth.loginFailed'));
    }
    
    // 登录成功后，获取最新的用户信息
    const userResponse = await fetch('/api/user/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (userResponse.ok) {
      // 成功获取用户信息后再跳转
      router.push('/');
      
      // 强制刷新以确保所有组件都更新状态
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // 如果获取用户信息失败，仍然跳转，但可能会有状态不一致
      router.push('/');
    }
  } catch (error: any) {
    errorMessage.value = error.message || t('auth.errorOccurred');
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-color);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: var(--text-color);
}

.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid var(--error-color);
}

.form-actions {
  margin-top: 1rem;
}

.form-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  text-align: center;
}

.form-links a {
  color: var(--primary-color);
  text-decoration: none;
}

.form-links a:hover {
  color: var(--hover-color);
  text-decoration: underline;
}
</style> 