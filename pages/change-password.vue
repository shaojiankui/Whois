<template>
    <div class="change-password-page">
      <div v-if="!isAuthenticated" class="not-authenticated">
        <h1>{{ $t('common.error') }}</h1>
        <p>{{ $t('user.loginRequired') }}</p>
        <div class="form-actions">
          <NuxtLink to="/login" class="btn-primary">{{ $t('common.login') }}</NuxtLink>
        </div>
      </div>
      
      <div v-else class="change-password-container">
        <h1>{{ $t('user.changePassword') }}</h1>
        
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <form @submit.prevent="handleSubmit" class="change-password-form">
          <div class="form-group">
            <label for="currentPassword">{{ $t('user.currentPassword') }}</label>
            <input 
              type="password" 
              id="currentPassword" 
              v-model="currentPassword" 
              required 
              :placeholder="$t('user.currentPasswordPlaceholder')"
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword">{{ $t('user.newPassword') }}</label>
            <input 
              type="password" 
              id="newPassword" 
              v-model="newPassword" 
              required 
              :placeholder="$t('user.newPasswordPlaceholder')"
              minlength="6"
            />
            <small>{{ $t('user.passwordRequirements') }}</small>
          </div>
          
          <div class="form-group">
            <label for="confirmNewPassword">{{ $t('user.confirmNewPassword') }}</label>
            <input 
              type="password" 
              id="confirmNewPassword" 
              v-model="confirmNewPassword" 
              required 
              :placeholder="$t('user.confirmPasswordPlaceholder')"
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="isLoading || !isFormValid">
              {{ isLoading ? $t('user.changingPassword') : $t('user.changePassword') }}
            </button>
            <NuxtLink to="/profile" class="btn-outline">{{ $t('user.backToProfile') }}</NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  
  // Router and initial setup
  const router = useRouter();
  const { t } = useI18n();
  const isAuthenticated = ref(false);
  const currentPassword = ref('');
  const newPassword = ref('');
  const confirmNewPassword = ref('');
  const errorMessage = ref('');
  const successMessage = ref('');
  const isLoading = ref(false);
  
  // Computed
  const isFormValid = computed(() => {
    return (
      currentPassword.value.length > 0 &&
      newPassword.value.length >= 6 &&
      newPassword.value === confirmNewPassword.value
    );
  });
  
  // Check authentication status on mount
  onMounted(async () => {
    try {
      const response = await fetch('/api/user/me', {
        credentials: 'include' // Send cookies for authentication
      });
      
      isAuthenticated.value = response.ok;
    } catch (error) {
      console.error('Error checking authentication:', error);
      isAuthenticated.value = false;
    }
  });
  
  // Handle form submission
  async function handleSubmit() {
    if (!isFormValid.value) {
      if (newPassword.value !== confirmNewPassword.value) {
        errorMessage.value = t('user.passwordsDoNotMatch');
      } else if (newPassword.value.length < 6) {
        errorMessage.value = t('user.passwordTooShort');
      }
      return;
    }
    
    errorMessage.value = '';
    successMessage.value = '';
    isLoading.value = true;
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: currentPassword.value,
          newPassword: newPassword.value,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || t('user.passwordChangeError'));
      }
      
      // Show success message
      successMessage.value = t('user.passwordChangeSuccess');
      currentPassword.value = '';
      newPassword.value = '';
      confirmNewPassword.value = '';
      
      // Redirect to profile after 2 seconds
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (error: any) {
      errorMessage.value = error.message || t('user.passwordChangeError');
    } finally {
      isLoading.value = false;
    }
  }
  </script>
  
  <style scoped>
  .change-password-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 2rem;
  }
  
  .not-authenticated {
    text-align: center;
    padding: 3rem;
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .change-password-container {
    width: 100%;
    max-width: 500px;
    padding: 2rem;
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-color);
  }
  
  h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: var(--text-color);
  }
  
  .change-password-form {
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
    color: var(--text-color-light);
  }
  
  input {
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 1rem;
    background-color: var(--input-bg);
    color: var(--text-color);
  }
  
  input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(17, 252, 212, 0.2);
  }
  
  small {
    color: var(--text-color-light);
    font-size: 0.8rem;
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