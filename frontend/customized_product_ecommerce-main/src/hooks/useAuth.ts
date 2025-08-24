import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpRequired: boolean;
  userId: number | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

// Customer auth service
const customerAuthService = {
  async login(credentials: LoginRequest) {
    const response = await fetch('http://127.0.0.1:8000/auth/customer/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    return response.json();
  },

  async verifyOtp(userId: number, otp: string) {
    const response = await fetch('http://127.0.0.1:8000/auth/customer/login/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, otp }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'OTP verification failed');
    }
    
    return response.json();
  },

  async logout() {
    const token = localStorage.getItem('customer_access_token');
    if (token) {
      await fetch('http://127.0.0.1:8000/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  },

  async getProfile() {
    const token = localStorage.getItem('customer_access_token');
    if (!token) {
      throw new Error('No access token');
    }

    const response = await fetch('http://127.0.0.1:8000/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get profile');
    }
    
    return response.json();
  }
};

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      otpRequired: false,
      userId: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null, otpRequired: false, userId: null });
          
          const response = await customerAuthService.login(credentials);
          
          // Check if OTP is required
          if (response.data?.otpRequired) {
            set({
              isLoading: false,
              otpRequired: true,
              userId: response.data.userId,
              error: null,
            });
            return;
          }
          
          // Handle direct token response (fallback)
          if (response.tokens) {
            const { accessToken, refreshToken } = response.tokens;
            const user = response.user;
            
            localStorage.setItem('customer_access_token', accessToken);
            localStorage.setItem('customer_refresh_token', refreshToken);
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              otpRequired: false,
              userId: null,
            });
          }
        } catch (error: any) {
          console.error('Login error:', error);
          let errorMessage = 'Login failed';
          
          if (error.message) {
            errorMessage = error.message;
          }
          
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            otpRequired: false,
            userId: null,
          });
          throw error;
        }
      },

      verifyOtp: async (otp: string) => {
        try {
          const { userId } = get();
          if (!userId) {
            throw new Error('No user ID found for OTP verification');
          }

          set({ isLoading: true, error: null });
          
          const response = await customerAuthService.verifyOtp(userId, otp);
          
          if (response.tokens) {
            const { accessToken, refreshToken } = response.tokens;
            const user = response.user;
            
            localStorage.setItem('customer_access_token', accessToken);
            localStorage.setItem('customer_refresh_token', refreshToken);
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              otpRequired: false,
              userId: null,
            });
          } else {
            throw new Error('No tokens received from OTP verification');
          }
        } catch (error: any) {
          console.error('OTP verification error:', error);
          let errorMessage = 'OTP verification failed';
          
          if (error.message) {
            errorMessage = error.message;
          }
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await customerAuthService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear tokens from localStorage
          localStorage.removeItem('customer_access_token');
          localStorage.removeItem('customer_refresh_token');
          
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            otpRequired: false,
            userId: null,
          });
        }
      },

      getProfile: async () => {
        try {
          set({ isLoading: true });
          
          const response = await customerAuthService.getProfile();
          
          if (response.data && response.data.id) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error: any) {
          console.error('Get profile error:', error);
          
          // If unauthorized, clear auth data
          if (error.message.includes('401') || error.message.includes('unauthorized')) {
            localStorage.removeItem('customer_access_token');
            localStorage.removeItem('customer_refresh_token');
            
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
      name: 'customer-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state on app start
export const initializeAuth = async () => {
  const token = localStorage.getItem('customer_access_token');
  
  if (token) {
    try {
      await useAuth.getState().getProfile();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }
};
