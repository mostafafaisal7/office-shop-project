// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import { AuthState, User, AuthTokens, LoginCredentials, RegisterCredentials } from '@/types/auth';
// import { authApi } from '@/services/authApi';

// interface AuthStore extends AuthState {
//   // Actions
//   // login: (credentials: LoginCredentials) => Promise<{ otpRequired?: boolean } | void>;
//   user: User | null;
//   tokens: AuthTokens | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   login: (credentials: LoginCredentials) => Promise<{
//     otpRequired?: boolean;
//     message?: string;
//     userId?: number;
//   } | void>;
//   verifyOtp: (data: { userId: number; otp: string }) => Promise<AuthTokens>;
//   register: (credentials: RegisterCredentials) => Promise<void>;
//   logout: () => Promise<void>;
//   logoutAll: () => Promise<void>;
//   refreshToken: () => Promise<void>;
//   setUser: (user: User | null) => void;
//   setTokens: (tokens: AuthTokens | null) => void;
//   setLoading: (loading: boolean) => void;
//   clearAuth: () => void;
//   initializeAuth: () => Promise<void>;
// }


// export const useAuthStore = create<AuthStore>()(
//   persist(
//     (set, get) => ({
//       // Initial state
//       user: null,
//       tokens: null,
//       isLoading: true, // ✅ start as loading
//       isAuthenticated: false,
//       isOtpRequired: false, // ✅ add this


//       // Actions
//       // login: async (credentials: LoginCredentials) => {
//       //   try {
//       //     set({ isLoading: true });
      
//       //     const response = await authApi.login(credentials);
      
//       //     console.log("Raw login API response:", response);
      
//       //     // Check if OTP is required
//       //     const otpRequired = response.detail?.toLowerCase().includes("otp sent") || false;
      
//       //     if (otpRequired) {
//       //       set({ isLoading: false });
//       //       return { otpRequired: true, message: response.detail || "OTP sent" };
//       //     }
      
//       //     // If login returns user & tokens
//       //     if (response.user && response.tokens) {
//       //       set({
//       //         user: response.user,
//       //         tokens: response.tokens,
//       //         isAuthenticated: true,
//       //         isLoading: false,
//       //       });
//       //       return { message: response.detail || "Login successful" };
//       //     }
      
//       //     // If neither OTP nor user/tokens exist
//       //     set({ isLoading: false });
//       //     console.error("Login failed - unexpected response structure:", response);
//       //     throw new Error(response.detail || "Login failed - unexpected response structure");
//       //   } catch (error) {
//       //     set({ isLoading: false });
//       //     console.error("Login error:", error);
//       //     throw error;
//       //   }
//       // },
//       // login: async (credentials: LoginCredentials) => {
//       //   try {
//       //     set({ isLoading: true });
      
//       //     const response = await authApi.login(credentials);
//       //     console.log("Raw login API response:", response);
      
//       //     // Detect OTP requirement
//       //     const otpRequired = response.otpRequired || false;
      
//       //     // If user and tokens exist
//       //     if (response.user && response.tokens) {
//       //       set({
//       //         user: response.user,
//       //         tokens: response.tokens,
//       //         isAuthenticated: true,
//       //         isLoading: false,
//       //       });
//       //       return { message: response.message || "Login successful" };
//       //     }
      
//       //     // If OTP required
//       //     if (otpRequired) {
//       //       set({ isLoading: false });
//       //       return { otpRequired: true, message: response.message || "OTP required" };
//       //     }
      
//       //     // If only a message exists
//       //     if (response.message) {
//       //       set({ isLoading: false });
//       //       console.warn("Login successful but with unexpected response structure:", response);
//       //       return { message: response.message };
//       //     }
      
//       //     // Truly unexpected
//       //     set({ isLoading: false });
//       //     throw new Error("Login failed - unexpected response structure");
//       //   } catch (error) {
//       //     set({ isLoading: false });
//       //     console.error("Login error:", error);
//       //     throw error;
//       //   }
//       // },
      
//         // 🔹 login
//     login: async (credentials: LoginCredentials) => {
//       set({ isLoading: true });
//       const response = await authApi.login(credentials);
//       set({ isLoading: false });

//       if (response.success && response.otpRequired) {
//         // const tokens = {
//         //   accessToken: response.data.tokens.access_token,
//         //   refreshToken: response.data.tokens.refresh_token,
//         // };
//         return {
//           otpRequired: true,
//           userId: response.userId,
//           // message: response.message,
//         };
//       }

//       if (response.success && response.user && response.tokens) {
//         const tokens = {
//           accessToken: response.tokens.access_token,
//           refreshToken: response.tokens.refresh_token,
//         };
//         set({ user: response.user, tokens, isAuthenticated: true });
//         localStorage.setItem("accessToken", tokens.accessToken);
//         localStorage.setItem("refreshToken", tokens.refreshToken);
      
//         return { message: response.message };
//       }

//      // authStore.ts (inside login)
//       if (response.otpRequired) {
//         set({ isLoading: false });
//         return {
//           otpRequired: true,
//           userId: response.userId, // ✅ pick from response.data.userId
//           message: response.message || "OTP sent",
//         };
//       }

//     },

//     // verifyOtp: async ({ userId, otp }: { userId: number; otp: string }) => {
//     //   try {
//     //     const response = await authApi.verifyOtp({ userId, otp });
    
//     //     console.log("Raw OTP verification response:", response);
    
//     //     // Handle response structure reliably
//     //     const tokens = response.data?.tokens || response.tokens;
//     //     const user = response.data?.user || response.user;
    
//     //     if (response.success && tokens && user) {
//     //       // Update Zustand store (or your state management)
//     //       set({
//     //         user,
//     //         tokens,
//     //         isAuthenticated: true,
//     //       });
    
//     //       // Optionally, save tokens in localStorage/sessionStorage if needed
//     //       localStorage.setItem("access_token", tokens.access_token);
//     //       localStorage.setItem("refresh_token", tokens.refresh_token);
    
//     //       return tokens;
//     //     }
    
//     //     // If the structure is unexpected but success is true, still treat it as verified
//     //     if (response.success) {
//     //       console.warn("OTP verified, but response missing tokens/user:", response);
//     //       return null;
//     //     }
    
//     //     // Otherwise, throw error
//     //     throw new Error(response.message || "OTP verification failed");
//     //   } catch (error: any) {
//     //     console.error("Verify OTP error caught:", error);
//     //     throw error;
//     //   }
//     // },
    
    
//     verifyOtp: async ({ userId, otp }: { userId: number; otp: string }) => {
//       try {
//         const response = await authApi.verifyOtp({ userId, otp });
    
//         console.log("Raw OTP verification response:", response);
    
//         // Check for expected structure
//         if (response.success && response.tokens && response.user) {
//           const tokens = {
//             accessToken: response.tokens.access_token,
//             refreshToken: response.tokens.refresh_token,
//           };
//           set({ user: response.user, tokens, isAuthenticated: true });
//           localStorage.setItem("accessToken", tokens.accessToken);
//           localStorage.setItem("refreshToken", tokens.refreshToken);

          
        
//           // return response.data.tokens;
//           return tokens;
//         }
    
//         // If structure is unexpected but success=true
//         if (response.success && !response.tokens) {
//           // Sometimes backend might not return tokens, so just update user
//           set({
//             user: response.user || null,
//             isAuthenticated: true,
//           });
//           return null;
//         }
    
//         // If response indicates failure
//         console.error("Unexpected OTP response structure:", response);
//         throw new Error(response.message || "OTP verification failed");
//       } catch (error) {
//         console.error("Verify OTP error caught:", error);
//         throw error;
//       }
//     },
    
    
      
      
        
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      

//       register: async (credentials: RegisterCredentials) => {
//         try {
//           set({ isLoading: true });
//           const response = await authApi.register(credentials);
          
//           if (response.success ) {
//             const tokens = {
//               accessToken: response.tokens.access_token,
//               refreshToken: response.tokens.refresh_token,
//             };
//             set({ user: response.user, tokens, isAuthenticated: true });
//             localStorage.setItem("accessToken", tokens.accessToken);
//             localStorage.setItem("refreshToken", tokens.refreshToken);
//           }
//         } catch (error) {
//           set({ isLoading: false });
//           throw error;
//         }
//       },

//       logout: async () => {
//         try {
//           const { tokens } = get();
//           if (tokens?.accessToken) {
//             await authApi.logout(tokens.accessToken);
//           }
//           // If we reach here, logout was successful
//           set({
//             user: null,
//             tokens: null,
//             isAuthenticated: false,
//             isLoading: false,
//           });
//         } catch (error) {
//           console.error('Logout error:', error);
//           // Clear auth state even if logout fails (for security)
//           set({
//             user: null,
//             tokens: null,
//             isAuthenticated: false,
//             isLoading: false,
//           });
//           // Re-throw the error so the UI can handle it
//           throw error;
//         }
//       },

//       logoutAll: async () => {
//         try {
//           const { tokens } = get();
//           if (tokens?.accessToken) {
//             await authApi.logoutAll(tokens.accessToken);
//           }
//           // If we reach here, logout was successful
//           set({
//             user: null,
//             tokens: null,
//             isAuthenticated: false,
//             isLoading: false,
//           });
//           localStorage.removeItem("accessToken");
//           localStorage.removeItem("refreshToken");

//         } catch (error) {
//           console.error('Logout all error:', error);
//           // Clear auth state even if logout fails (for security)
//           set({
//             user: null,
//             tokens: null,
//             isAuthenticated: false,
//             isLoading: false,
//           });
//           // Re-throw the error so the UI can handle it
//           throw error;
//         }
//       },

//       refreshToken: async () => {
//         try {
//           const { tokens } = get();
//           if (!tokens?.refreshToken) {
//             throw new Error('No refresh token available');
//           }

//           const response = await authApi.refreshToken(tokens.refreshToken);
          
//           if (response.success) {
//             const tokens = {
//               accessToken: response.tokens.access_token,
//               refreshToken: response.tokens.refresh_token,
//             };
//             set({ user: response.user, tokens, isAuthenticated: true });
//             localStorage.setItem("accessToken", tokens.accessToken);
//             localStorage.setItem("refreshToken", tokens.refreshToken);
//           }
          
//         } catch (error) {
//           console.error('Token refresh error:', error);
//           // Clear auth state if refresh fails
//           set({
//             user: null,
//             tokens: null,
//             isAuthenticated: false,
//             isLoading: false,
//           });
//           throw error;
//         }
//       },

//       setUser: (user: User | null) => {
//         set({ user, isAuthenticated: !!user });
//       },

//       setTokens: (tokens: AuthTokens | null) => {
//         set({ tokens });
//       },

//       setLoading: (isLoading: boolean) => {
//         set({ isLoading });
//       },

//       clearAuth: () => {
//         set({
//           user: null,
//           tokens: null,
//           isAuthenticated: false,
//           isLoading: false,
//         });
//       },

//       initializeAuth: async () => {
//         try {
//           let { tokens, user } = get();
    
//           // Load tokens from localStorage if missing
//           if (!tokens?.accessToken) {
//             const accessToken = localStorage.getItem("accessToken");
//             const refreshToken = localStorage.getItem("refreshToken");
    
//             if (accessToken && refreshToken) {
//               tokens = { accessToken, refreshToken };
//               set({ tokens });
//             }
//           }
    
//           // If tokens exist but user not loaded, fetch user
//           if (tokens?.accessToken && (!user || !user.name)) {
//             set({ isLoading: true });
//             try {
//               const response = await authApi.getUserProfile(tokens.accessToken);
//               if (response.success && response.user) {
//                 set({
//                   user: response.user,
//                   isAuthenticated: true,
//                   isLoading: false,
//                 });
//                 return;
//               }
//             } catch (err) {
//               console.error("Failed to fetch user profile during init:", err);
//               set({
//                 user: null,
//                 isAuthenticated: false,
//                 isLoading: false,
//               });
//             }
//           } else if (tokens?.accessToken && user?.name) {
//             set({ isAuthenticated: true, isLoading: false });
//           } else {
//             set({
//               user: null,
//               tokens: null,
//               isAuthenticated: false,
//               isLoading: false,
//             });
//           }
//         } catch (error) {
//           console.error("Auth initialization error:", error);
//           set({
//             user: null,
//             tokens: null,
//             isAuthenticated: false,
//             isLoading: false,
//           });
//         }
//       },
    
      
      
//     }),
//     {
//       name: 'auth-storage',
//       partialize: (state) => ({
//         user: state.user,
//         tokens: state.tokens,
//         isAuthenticated: state.isAuthenticated,
//         isOtpRequired: state.isOtpRequired,
//       }),
//       onRehydrateStorage: () => (state) => {
//         // After rehydration, if we have user and tokens, set authenticated to true
//         if (state?.user && state?.tokens) {
//           state.isAuthenticated = true;
//         }
//       },
//     }
//   )
// );

// // Token refresh interceptor
// let refreshPromise: Promise<void> | null = null;

// export const getValidToken = async (): Promise<string | null> => {
//   const { tokens, refreshToken: refreshTokenAction } = useAuthStore.getState();
  
//   if (!tokens?.accessToken) {
//     return null;
//   }

//   // Check if token is expired (basic check - you might want to decode JWT)
//   try {
//     // If there's already a refresh in progress, wait for it
//     if (refreshPromise) {
//       await refreshPromise;
//       return useAuthStore.getState().tokens?.accessToken || null;
//     }

//     return tokens.accessToken;
//   } catch (error) {
//     // Token might be expired, try to refresh
//     try {
//       refreshPromise = refreshTokenAction();
//       await refreshPromise;
//       refreshPromise = null;
//       return useAuthStore.getState().tokens?.accessToken || null;
//     } catch (refreshError) {
//       refreshPromise = null;
//       return null;
//     }
//   }
// };

// // Helper function to get current user ID
// export const getCurrentUserId = (): number | null => {
//   const { user, isAuthenticated } = useAuthStore.getState();
  
//   if (!isAuthenticated || !user?.id) {
//     return null;
//   }
  
//   // Convert string ID to number
//   const userId = parseInt(user.id);
//   return isNaN(userId) ? null : userId;
// };

// // Global flag to prevent concurrent user data fetching
// let isEnsureUserDataRunning = false;

// // Helper function to ensure user data is loaded
// export const ensureUserData = async (): Promise<User | null> => {
//   const { user, tokens, isAuthenticated, setUser } = useAuthStore.getState();
  
//   // If we already have complete user data, return it
//   if (user && user.name && user.email && isAuthenticated) {
//     return user;
//   }
  
//   // If already running, wait for it to complete
//   if (isEnsureUserDataRunning) {
//     // Wait a bit and return current user state
//     await new Promise(resolve => setTimeout(resolve, 100));
//     return useAuthStore.getState().user;
//   }
  
//   // If we have tokens, try to fetch fresh user data
//   if (tokens?.accessToken) {
//     isEnsureUserDataRunning = true;
    
//     try {
//       // First try getUserProfile (more complete data)
//       const response = await authApi.getUserProfile(tokens.accessToken);
      
//       if (response.success && response.data?.user) {
//         setUser(response.data.user);
//         return response.data.user;
//       }
//     } catch (error) {
//       console.error('Failed to fetch user profile in ensureUserData:', error);
      
//       // Fallback to getCurrentUser
//       try {
//         const response = await authApi.getCurrentUser(tokens.accessToken);
        
//         if (response.success && response.data?.user) {
//           setUser(response.data.user);
//           return response.data.user;
//         }
//       } catch (fallbackError) {
//         console.error('Failed to fetch current user in ensureUserData:', fallbackError);
//       }
//     } finally {
//       isEnsureUserDataRunning = false;
//     }
//   }
  
//   return null;
// };

// // Helper function to refresh user data
// export const refreshUserData = async (): Promise<User | null> => {
//   const { tokens, setUser } = useAuthStore.getState();
  
//   if (!tokens?.accessToken) {
//     return null;
//   }
  
//   try {
//     const response = await authApi.getUserProfile(tokens.accessToken);
    
//     if (response.success && response.data?.user) {
//       setUser(response.data.user);
//       return response.data.user;
//     }
//   } catch (error) {
//     console.error('Failed to refresh user data:', error);
//   }
  
//   return null;
// };


import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User, AuthTokens, LoginCredentials, RegisterCredentials, AuthApiResponse } from '@/types/auth';
import { authApi } from '@/services/authApi';

interface AuthStore extends AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ otpRequired?: boolean; message?: string; userId?: number } | void>;
  verifyOtp: (data: { userId: number; otp: string }) => Promise<AuthTokens | null>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isLoading: true,
      isAuthenticated: false,
      isOtpRequired: false,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response: AuthApiResponse = await authApi.login(credentials);
          console.log("AuthStore received response:", response);
      
          // OTP required case
          if (response.otpRequired || response.data?.otpRequired) {
            set({ isLoading: false });
            return {
              otpRequired: true,
              userId: response.data?.userId || (response.user?.id ? parseInt(response.user.id) : undefined),
              message: response.message || response.detail || "OTP required",
            };
          }
      
          // Successful login with user + tokens
          if (response.user && response.tokens) {
            const tokens: AuthTokens = {
              accessToken: response.tokens.accessToken || response.accessToken!,
              refreshToken: response.tokens.refreshToken || response.refreshToken!,
            };
            set({ user: response.user, tokens, isAuthenticated: true, isLoading: false });
            localStorage.setItem("accessToken", tokens.accessToken);
            localStorage.setItem("refreshToken", tokens.refreshToken);
            return { message: response.message || response.detail || "Login successful" };
          }
      
          // Check data object for user and tokens
          if (response.data?.user && response.data?.tokens) {
            const tokens: AuthTokens = {
              accessToken: response.data.tokens.accessToken || response.data.tokens.accessToken,
              refreshToken: response.data.tokens.refreshToken || response.data.tokens.refreshToken,
            };
            set({ user: response.data.user, tokens, isAuthenticated: true, isLoading: false });
            localStorage.setItem("accessToken", tokens.accessToken);
            localStorage.setItem("refreshToken", tokens.refreshToken);
            return { message: response.message || response.detail || "Login successful" };
          }
      
          // Backend returned just a message
          if (response.message || response.detail) {
            set({ isLoading: false });
            return { message: response.message || response.detail };
          }
      
          // Unexpected response
          set({ isLoading: false });
          console.error("Login failed - unexpected response structure:", response);
          throw new Error("Login failed - unexpected response structure");
        } catch (error: any) {
          set({ isLoading: false });
          console.error("Login error:", error);
          throw error;
        }
      },
      
      

      verifyOtp: async ({ userId, otp }: { userId: number; otp: string }) => {
        try {
          const response: AuthApiResponse = await authApi.verifyOtp({ userId, otp });
          console.log("Raw OTP verification response:", response);

          if (response.success && response.tokens && response.user) {
            const tokens: AuthTokens = {
              accessToken: response.tokens.accessToken || response.accessToken!,
              refreshToken: response.tokens.refreshToken || response.refreshToken!,
            };
            set({ user: response.user, tokens, isAuthenticated: true });
            localStorage.setItem("accessToken", tokens.accessToken);
            localStorage.setItem("refreshToken", tokens.refreshToken);
            return tokens;
          }

          if (response.success && response.user && !response.tokens) {
            set({ user: response.user, isAuthenticated: true });
            return null;
          }

          throw new Error(response.detail || "OTP verification failed");
        } catch (error: any) {
          console.error("Verify OTP error caught:", error);
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        try {
          set({ isLoading: true });
          const response: AuthApiResponse = await authApi.register(credentials);
          set({ isLoading: false });

          if (response.success && response.user && response.tokens) {
            const tokens: AuthTokens = {
              accessToken: response.tokens.accessToken || response.accessToken!,
              refreshToken: response.tokens.refreshToken || response.refreshToken!,
            };
            set({ user: response.user, tokens, isAuthenticated: true });
            localStorage.setItem("accessToken", tokens.accessToken);
            localStorage.setItem("refreshToken", tokens.refreshToken);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          const { tokens } = get();
          if (tokens?.accessToken) await authApi.logout(tokens.accessToken);
          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        } catch (error) {
          console.error("Logout error:", error);
          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
          throw error;
        }
      },

      logoutAll: async () => {
        try {
          const { tokens } = get();
          if (tokens?.accessToken) await authApi.logoutAll(tokens.accessToken);
          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        } catch (error) {
          console.error("Logout all error:", error);
          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
          throw error;
        }
      },

      refreshToken: async () => {
        try {
          const { tokens } = get();
          if (!tokens?.refreshToken) throw new Error("No refresh token available");

          const response: AuthApiResponse = await authApi.refreshToken(tokens.refreshToken);

          if (response.success && response.user && response.tokens) {
            const newTokens: AuthTokens = {
              accessToken: response.tokens.accessToken || response.accessToken!,
              refreshToken: response.tokens.refreshToken || response.refreshToken!,
            };
            set({ user: response.user, tokens: newTokens, isAuthenticated: true });
            localStorage.setItem("accessToken", newTokens.accessToken);
            localStorage.setItem("refreshToken", newTokens.refreshToken);
          }
        } catch (error) {
          console.error("Token refresh error:", error);
          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
          throw error;
        }
      },

      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
      setTokens: (tokens: AuthTokens | null) => set({ tokens }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      clearAuth: () => set({ user: null, tokens: null, isAuthenticated: false, isLoading: false }),

      initializeAuth: async () => {
        try {
          let { tokens, user } = get();

          // Load tokens from localStorage if missing
          if (!tokens?.accessToken) {
            const accessToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");
            if (accessToken && refreshToken) tokens = { accessToken, refreshToken };
            set({ tokens });
          }

          // Fetch user if needed
          if (tokens?.accessToken && (!user || !user.name)) {
            set({ isLoading: true });
            try {
              const response = await authApi.getUserProfile(tokens.accessToken);
              if (response.success && response.data?.user) {
                set({ user: response.data.user, isAuthenticated: true, isLoading: false });
                return;
              }
            } catch (err) {
              console.error("Failed to fetch user profile:", err);
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          } else if (tokens?.accessToken && user?.name) {
            set({ isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        isOtpRequired: state.isOtpRequired,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user && state?.tokens) state.isAuthenticated = true;
      },
    }
  )
);

// Token refresh interceptor
let refreshPromise: Promise<void> | null = null;
export const getValidToken = async (): Promise<string | null> => {
  const { tokens, refreshToken: refreshTokenAction } = useAuthStore.getState();
  if (!tokens?.accessToken) return null;

  try {
    if (refreshPromise) {
      await refreshPromise;
      return useAuthStore.getState().tokens?.accessToken || null;
    }
    return tokens.accessToken;
  } catch {
    try {
      refreshPromise = refreshTokenAction();
      await refreshPromise;
      refreshPromise = null;
      return useAuthStore.getState().tokens?.accessToken || null;
    } catch {
      refreshPromise = null;
      return null;
    }
  }
};

// Current user helpers
export const getCurrentUserId = (): number | null => {
  const { user, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !user?.id) return null;
  const userId = parseInt(user.id);
  return isNaN(userId) ? null : userId;
};

let isEnsureUserDataRunning = false;
export const ensureUserData = async (): Promise<User | null> => {
  const { user, tokens, isAuthenticated, setUser } = useAuthStore.getState();
  if (user && user.name && user.email && isAuthenticated) return user;

  if (isEnsureUserDataRunning) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return useAuthStore.getState().user;
  }

  if (tokens?.accessToken) {
    isEnsureUserDataRunning = true;
    try {
      const response = await authApi.getUserProfile(tokens.accessToken);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch (err) {
      console.error("Failed getUserProfile in ensureUserData:", err);
    } finally {
      isEnsureUserDataRunning = false;
    }
  }
  return null;
};

export const refreshUserData = async (): Promise<User | null> => {
  const { tokens, setUser } = useAuthStore.getState();
  if (!tokens?.accessToken) return null;

  try {
    const response = await authApi.getUserProfile(tokens.accessToken);
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      return response.data.user;
    }
  } catch (err) {
    console.error("Failed to refresh user data:", err);
  }
  return null;
};
