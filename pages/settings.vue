<template>
  <div class="settings-page">
    <div v-if="!isAuthenticated" class="not-authenticated">
      <h1>{{ $t('common.error') }}</h1>
      <p>{{ $t('user.loginRequired') }}</p>
      <div class="form-actions">
        <NuxtLink to="/login" class="btn-primary">{{ $t('common.login') }}</NuxtLink>
      </div>
    </div>
    
    <div v-else class="settings-container">
      <h1>{{ $t('user.settings') }}</h1>
      
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div class="settings-section">
        <h2>{{ $t('user.preferences') }}</h2>
        
        <form @submit.prevent="savePreferences" class="preferences-form">
          <div class="form-group">
            <label for="defaultDomainSearchType">{{ $t('user.defaultSearchType') }}</label>
            <select id="defaultDomainSearchType" v-model="userPreferences.defaultSearchType">
              <option value="whois">{{ $t('whois.lookup') }}</option>
              <option value="dns">{{ $t('dns.title') }}</option>
              <option value="availability">{{ $t('domain.available') }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="resultsPerPage">{{ $t('user.resultsPerPage') }}</label>
            <select id="resultsPerPage" v-model="userPreferences.resultsPerPage">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="theme">{{ $t('user.theme') }}</label>
            <select id="theme" v-model="userPreferences.theme">
              <option value="light">{{ $t('header.lightMode') }}</option>
              <option value="dark">{{ $t('header.darkMode') }}</option>
              <option value="system">{{ $t('user.systemDefault') }}</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="isSaving">
              {{ isSaving ? $t('common.loading') : $t('common.save') }}
            </button>
          </div>
        </form>
      </div>
      
      <div class="settings-section">
        <h2>{{ $t('user.account') }}</h2>
        
        <div class="form-actions">
          <NuxtLink to="/profile" class="btn-outline">{{ $t('user.viewProfile') }}</NuxtLink>
          <NuxtLink to="/change-password" class="btn-outline">{{ $t('user.changePassword') }}</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

// Router and initial setup
const router = useRouter();
const { t } = useI18n();
const isAuthenticated = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isSaving = ref(false);

// User preferences with defaults
const userPreferences = ref({
  defaultSearchType: 'whois',
  resultsPerPage: '25',
  theme: 'light'
});

// Load user and preferences
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
    if (data.code === 200 && data.data) {
      isAuthenticated.value = true;
      // Load preferences
      await loadUserPreferences();
    } else {
      isAuthenticated.value = false;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    isAuthenticated.value = false;
  }
});

// Load user preferences
async function loadUserPreferences() {
  try {
    const response = await fetch('/api/user/preferences', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      return;
    }
    
    const data = await response.json();
    
    if (data.preferences) {
      userPreferences.value.defaultSearchType = data.preferences.defaultSearchType || 'whois';
      userPreferences.value.resultsPerPage = data.preferences.resultsPerPage || '25';
      userPreferences.value.theme = data.preferences.theme || 'light';
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

// Save user preferences
async function savePreferences() {
  errorMessage.value = '';
  successMessage.value = '';
  isSaving.value = true;
  
  try {
    // Save each preference individually
    const keys = Object.keys(userPreferences.value);
    
    for (const key of keys) {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          key,
          value: userPreferences.value[key as keyof typeof userPreferences.value]
        })
      });
    }
    
    successMessage.value = t('user.preferencesSaved');
  } catch (error: any) {
    errorMessage.value = error.message || t('user.preferencesError');
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.settings-page {
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

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
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

.preferences-form {
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

select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--input-bg);
  color: var(--text-color);
}

select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(17, 252, 212, 0.2);
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