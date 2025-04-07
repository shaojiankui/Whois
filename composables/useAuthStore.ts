import { defineStore } from '#imports';

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserPreferences {
  [key: string]: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  preferences: UserPreferences;
}

export const useAuthStore = defineStore('auth', () => {
  // State using refs for Vue 3 reactivity
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const preferences = ref<UserPreferences>({});

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const getPreference = (key: string) => preferences.value[key];

  // Actions
  async function register(username: string, email: string, password: string) {
    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      user.value = data.user;
      token.value = data.token;
      
      await loadPreferences();
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async function logout() {
    try {
      await fetch('/api/user/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      user.value = null;
      token.value = null;
      preferences.value = {};
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async function requestPasswordReset(email: string) {
    try {
      const response = await fetch('/api/user/reset-password-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }
      
      return { success: true, ...data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async function resetPassword(token: string, password: string) {
    try {
      const response = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async function loadPreferences() {
    if (!user.value) return;
    
    try {
      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load preferences');
      }
      
      preferences.value = data.preferences || {};
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  async function setPreference(key: string, value: string) {
    if (!user.value) return { success: false, error: 'Not authenticated' };
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify({ key, value })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save preference');
      }
      
      preferences.value[key] = value;
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  return {
    // State
    user,
    token,
    preferences,
    
    // Getters
    isAuthenticated,
    getPreference,
    
    // Actions
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    loadPreferences,
    setPreference
  };
}); 