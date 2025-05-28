import { ref, computed } from 'vue';

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserPreferences {
  [key: string]: string;
}

// 全局状态
const user = ref<User | null>(null);
const token = ref<string | null>(null);
const preferences = ref<UserPreferences>({});

export const useAuthStore = () => {
  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => {
    if (!user.value) return false;
    // 用户ID为1的用户是管理员
    return user.value.id === 1;
  });
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

  async function fetchUserInfo() {
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
        if (result.code === 200 && result.data) {
          user.value = {
            id: result.data.id,
            username: result.data.username,
            email: result.data.email
          };
          return { success: true, user: user.value };
        } else {
          user.value = null;
          return { success: false, error: result.message || 'Failed to get user info' };
        }
      } else {
        user.value = null;
        return { success: false, error: 'Not authenticated' };
      }
    } catch (error: any) {
      console.error('Failed to fetch user info:', error);
      user.value = null;
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
    isLoggedIn,
    isAdmin,
    getPreference,
    
    // Actions
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    loadPreferences,
    setPreference,
    fetchUserInfo
  };
}; 