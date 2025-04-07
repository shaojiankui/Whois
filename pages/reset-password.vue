<template>
  <div class="reset-password-page">
    <div class="reset-password-container">
      <h1>Reset Password</h1>
      
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <form v-if="!successMessage" @submit.prevent="handleSubmit" class="reset-password-form">
        <div class="form-group">
          <label for="password">New Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="Enter your new password"
            minlength="6"
          />
          <small>Password must be at least 6 characters</small>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            required 
            placeholder="Confirm your new password"
          />
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="isLoading || !isFormValid">
            {{ isLoading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </div>
      </form>
      
      <div class="form-links" :class="{ center: successMessage }">
        <NuxtLink to="/login">Back to Login</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// State
const route = useRoute();
const router = useRouter();
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const token = ref('');

// Computed
const isFormValid = computed(() => {
  return password.value.length >= 6 && password.value === confirmPassword.value;
});

// Lifecycle
onMounted(() => {
  // Get token from query params
  token.value = route.query.token as string;
  
  if (!token.value) {
    errorMessage.value = 'Invalid or missing token. Please request a new password reset link.';
  }
});

// Methods
async function handleSubmit() {
  if (!isFormValid.value) {
    if (password.value !== confirmPassword.value) {
      errorMessage.value = 'Passwords do not match';
    } else if (password.value.length < 6) {
      errorMessage.value = 'Password must be at least 6 characters';
    }
    return;
  }
  
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    const response = await fetch('/api/user/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token.value,
        password: password.value,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
    
    // Show success message
    successMessage.value = 'Your password has been reset successfully. You can now login with your new password.';
    password.value = '';
    confirmPassword.value = '';
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (error: any) {
    errorMessage.value = error.message || 'An error occurred while processing your request';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.reset-password-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
}

.reset-password-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.reset-password-form {
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
  color: #555;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

small {
  color: #7f8c8d;
  font-size: 0.8rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.form-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.form-links a {
  color: #3498db;
  text-decoration: none;
}

.form-links a:hover {
  text-decoration: underline;
}

.center {
  text-align: center;
}
</style> 