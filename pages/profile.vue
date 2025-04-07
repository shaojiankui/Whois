<template>
  <div class="profile-page">
    <div v-if="!isAuthenticated" class="not-authenticated">
      <h1>{{ $t('common.error') }}</h1>
      <p>{{ $t('user.loginRequired') }}</p>
      <div class="form-actions">
        <NuxtLink to="/login" class="btn-primary">{{ $t('common.login') }}</NuxtLink>
      </div>
    </div>
    
    <div v-else class="profile-container">
      <h1>{{ $t('user.profile') }}</h1>
      
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div class="profile-section">
        <h2>{{ $t('user.accountInfo') }}</h2>
        
        <div class="profile-info">
          <div class="profile-info-item">
            <span class="label">{{ $t('user.username') }}:</span>
            <span class="value">{{ user?.username }}</span>
          </div>
          
          <div class="profile-info-item">
            <span class="label">{{ $t('user.email') }}:</span>
            <span class="value">{{ user?.email }}</span>
          </div>
          
          <div class="profile-info-item">
            <span class="label">{{ $t('user.name') }}:</span>
            <span class="value">{{ user?.name }}</span>
          </div>
          
          <div class="profile-info-item">
            <span class="label">{{ $t('user.registrationTime') }}:</span>
            <span class="value">{{ formatDate(user?.reg_time) }}</span>
          </div>
          
          <div class="profile-info-item">
            <span class="label">{{ $t('user.registrationIP') }}:</span>
            <span class="value">{{ maskIP(user?.reg_ip) }}</span>
          </div>
          
          <div class="profile-info-item">
            <span class="label">{{ $t('user.lastLoginIP') }}:</span>
            <span class="value">{{ maskIP(user?.last_ip) }}</span>
          </div>
        </div>
      </div>
      
      <div class="profile-section">
        <h2>{{ $t('user.security') }}</h2>
        
        <div class="form-actions">
          <NuxtLink to="/change-password" class="btn-outline">{{ $t('user.changePassword') }}</NuxtLink>
          <NuxtLink to="/settings" class="btn-outline">{{ $t('user.settings') }}</NuxtLink>
          <button @click="handleLogout" class="btn-danger">{{ $t('header.logout') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// Router and initial setup
const router = useRouter();
const isAuthenticated = ref(false);
const user = ref({
  id: null,
  username: '',
  email: '',
  name: '',
  reg_time: undefined as Date | string | undefined,
  reg_ip: '',
  last_ip: ''
});
const errorMessage = ref('');
const successMessage = ref('');

// Load user data
onMounted(async () => {
  try {
    const response = await fetch('/api/user/me', {
      credentials: 'include' // Send cookies for authentication
    });
    
    if (!response.ok) {
      isAuthenticated.value = false;
      return;
    }
    
    const data = await response.json();
    console.log('User data:', data); // 添加调试信息
    
    if (data.code === 200 && data.data) {
      isAuthenticated.value = true;
      user.value = data.data;
      console.log('User info:', user.value); // 添加调试信息
    } else {
      isAuthenticated.value = false;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    isAuthenticated.value = false;
  }
});

// Handle logout
async function handleLogout() {
  try {
    await fetch('/api/user/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    // Redirect to home page
    router.push('/');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Add date formatting and IP masking functions
function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

function maskIP(ip: string | undefined): string {
  if (!ip) return 'N/A';
  // Simple IP masking, keep first segment, replace others with *
  return ip.split('.').map((segment, index) => index === 0 ? segment : '*').join('.');
}
</script>

<style scoped>
.profile-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.not-authenticated {
  text-align: center;
  padding: 3rem;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-section {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
}

h1 {
  font-size: 1.8rem;
  color: var(--text-color);
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.4rem;
  color: var(--text-color);
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-info-item {
  display: flex;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color-light);
}

.label {
  font-weight: 500;
  min-width: 150px;
  color: var(--text-color-light);
}

.value {
  color: var(--text-color);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary {
  background-color: var(--primary-color);
  color: var(--bg-color);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
}

.btn-primary:hover {
  background-color: var(--hover-color);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: var(--bg-color);
}

.btn-danger {
  background-color: var(--error-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  opacity: 0.9;
}

.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid var(--error-color);
}

.success-message {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid var(--success-color);
}
</style> 