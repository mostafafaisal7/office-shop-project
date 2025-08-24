import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest } from '@/types/auth';
import { authService } from '@/services/auth';
import { LOCAL_STORAGE_KEYS } from '@/utils/constants';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authService.login(credentials);
          
          
          // Handle both possible response structures
          let loginData: any = null;
          if (response.data?.data) {
            // Nested structure: response.data.data
            loginData = response.data.data;
          } else if (response.data && 'access_token' in response.data) {
            // Direct structure: response.data
            loginData = response.data;
          }
          
          if (loginData && loginData.access_token) {
            const { access_token, refresh_token, user } = loginData;
            
            // Store tokens in localStorage
            localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, access_token);
            localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('No data received from login response');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          let errorMessage = 'Login failed';
          
          if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear tokens from localStorage
          localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
          
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      getProfile: async () => {
        try {
          set({ isLoading: true });
          
          const response = await authService.getProfile();
          
          
          // Handle both possible response structures for getProfile
          let userData: any = null;
          if (response.data?.data) {
            // Nested structure: response.data.data
            userData = response.data.data;
          } else if (response.data && 'id' in response.data) {
            // Direct structure: response.data (check if it has user properties)
            userData = response.data;
          }
          
          if (userData && userData.id) {
            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error: any) {
          console.error('Get profile error:', error);
          
          // If unauthorized, clear auth data
          if (error.response?.status === 401) {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
            
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        }
      },

      clearError: () => set({ error: null }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state on app start
export const initializeAuth = async () => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  
  if (token) {
    try {
      await useAuth.getState().getProfile();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }
};
