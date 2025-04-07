<template>
  <div class="register-page">
    <div class="register-container card">
      <h1>{{ $t('auth.createAccount') }}</h1>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">{{ $t('auth.username') }}</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required 
            :placeholder="$t('auth.chooseUsername')"
            class="w-input"
          />
        </div>
        
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
            :placeholder="$t('auth.createPassword')"
            minlength="6"
            class="w-input"
          />
          <small class="text-muted">{{ $t('auth.passwordRequirement') }}</small>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">{{ $t('auth.confirmPassword') }}</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            required 
            :placeholder="$t('auth.confirmPasswordPlaceholder')"
            class="w-input"
          />
        </div>
        
        <div class="form-actions">
          <button type="submit" class="w-button" :disabled="isLoading || !isFormValid">
            {{ isLoading ? $t('auth.creatingAccount') : $t('auth.createAccount') }}
          </button>
        </div>
        
        <div class="form-links">
          <NuxtLink :to="localePath('/login')">{{ $t('auth.alreadyHaveAccount') }}</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLocalePath } from '#i18n';

// I18n
const { t } = useI18n();
const localePath = useLocalePath();

// State
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const router = useRouter();

// Computed
const isFormValid = computed(() => {
  return (
    username.value.trim().length > 0 &&
    email.value.trim().length > 0 &&
    password.value.length >= 6 &&
    password.value === confirmPassword.value
  );
});

// Methods
async function handleRegister() {
  if (!isFormValid.value) {
    if (password.value !== confirmPassword.value) {
      errorMessage.value = t('auth.passwordsDoNotMatch');
    } else if (password.value.length < 6) {
      errorMessage.value = t('auth.passwordTooShort');
    }
    return;
  }
  
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    const response = await fetch('/api/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || t('auth.registrationFailed'));
    }
    
    // Success, redirect to login page
    router.push('/login?registered=true');
  } catch (error: any) {
    errorMessage.value = error.message || t('auth.errorOccurred');
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
}

.register-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-color);
}

.register-form {
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

small {
  color: var(--muted-text);
  font-size: 0.8rem;
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