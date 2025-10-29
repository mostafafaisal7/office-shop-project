import { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthApiResponse, 
  UserProfileResponse,
  PasswordResetRequest, 
  PasswordResetConfirm,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ApiResponse
} from '@/types/auth';

// Use environment variable for API URL
const API_BASE_URL = typeof window === 'undefined'
  ? (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000');

class AuthApiService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }




  // async register(credentials: RegisterCredentials): Promise<AuthApiResponse> {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/auth/register`, {
  //       method: 'POST',
  //       headers: this.getAuthHeaders(),
  //       body: JSON.stringify({
  //         name: credentials.name,
  //         email: credentials.email,
  //         password: credentials.password,
  //       }),
  //     });

  //     const data = await response.json();
      
  //     if (!response.ok) {
  //       throw new Error(data.message || 'Registration failed');
  //     }

  //     return {
  //       success: true,
  //       message: data.message || 'Registration successful',
  //       data: data.data,
  //     };
  //   } catch (error) {
  //     console.error('Registration error:', error);
  //     throw error;
  //   }
  // }

async register(credentials: RegisterCredentials): Promise<AuthApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
        confirm_password: credentials.confirmPassword, // Map frontend to backend
        phone: credentials.phone ?? undefined,        // Optional
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return {
      success: true,
      message: data.message || 'Registration successful',
      data: data.data,
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}



  // async login(credentials: LoginCredentials): Promise<AuthApiResponse> {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/auth/login`, {
  //       method: 'POST',
  //       headers: this.getAuthHeaders(),
  //       body: JSON.stringify(credentials),
  //     });

  //     const data = await response.json();
      
  //     if (!response.ok) {
  //       throw new Error(data.message || 'Login failed');
  //     }

  //     // Check if the API response has the expected structure
  //     return {
  //       success: true,
  //       message: data.message || 'Login successful',
  //       data: data.data || data, // Try both data.data and data in case the API structure is different
  //     };
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     throw error;
  //   }
  // }


  // async login(credentials: LoginCredentials): Promise<AuthApiResponse> {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/auth/login`, {
  //       method: 'POST',
  //       headers: this.getAuthHeaders(),
  //       body: JSON.stringify(credentials),
  //     });
  
  //     const data = await response.json();
  
  //     if (!response.ok) {
  //       throw new Error(data.detail || 'Login failed'); // use backend's error
  //     }
  
  //     // Detect OTP requirement
  //     const otpRequired = data.detail?.toLowerCase().includes('otp sent') || false;
  
  //     // Normalize response while keeping your backend names
  //     let normalizedData: any = { otpRequired };
  
  //     if (data.access_token) {
  //       // Token-only response
  //       normalizedData = {
  //         user: data.user || null, // in case backend doesn’t send user
  //         tokens: {
  //           access_token: data.access_token,
  //           refresh_token: data.refresh_token,
  //         },
  //         otpRequired,
  //       };
  //     } else if (data.user && data.tokens) {
  //       // Nested response with user + tokens
  //       normalizedData = {
  //         user: data.user,
  //         tokens: data.tokens,
  //         otpRequired,
  //       };
  //     }
  

  //     return {
  //       success: true,
  //       message: data.detail || 'Login successful',
  //       data: {
  //         ...data,
  //         otpRequired,
  //       },
  //     };

  //     // };
      
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     throw error;
  //   }
  // }
  
  

  // Inside AuthApiService class

  async login(credentials: LoginCredentials): Promise<AuthApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/customer/login`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials),
      });
  
      const raw = await response.json();
  
      if (!response.ok) {
        throw new Error(raw.detail || raw.message || 'Login failed');
      }
  
      console.log("Raw login response:", raw); // Debug log
  
      // Handle the actual backend response structure
      if (raw.success && raw.data) {
        const { data } = raw;
        
        // OTP required case
        if (data.otpRequired) {
          return {
            success: true,
            message: raw.message || 'OTP sent successfully',
            detail: raw.message || 'OTP sent successfully',
            otpRequired: true,
            user: data.user,
            data: {
              otpRequired: true,
              userId: data.userId,
              user: data.user
            }
          };
        }
  
        // Fully logged in case
        if (data.user && data.tokens) {
          return {
            success: true,
            message: raw.message || 'Login successful',
            detail: raw.message || 'Login successful',
            user: data.user,
            tokens: data.tokens,
            otpRequired: false,
            data: {
              user: data.user,
              tokens: data.tokens,
              otpRequired: false
            }
          };
        }
      }
  
      // Fallback for unexpected response structure
      console.error("Login successful but unexpected response:", raw);
      throw new Error("Login failed - unexpected response structure");
  
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async verifyOtp(payload: { userId: number; otp: string }): Promise<AuthApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/customer/login/verify-otp`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
  
      const raw = await response.json();
  
      if (!response.ok) {
        throw new Error(raw.detail || raw.message || "OTP verification failed");
      }
  
      console.log("Raw OTP verification response:", raw); // Debug log
  
      // Handle the backend response structure
      return {
        success: true,
        message: raw.detail || "OTP verified successfully",
        detail: raw.detail || "OTP verified successfully",
        user: raw.user,
        tokens: raw.tokens,
        data: {
          user: raw.user,
          tokens: raw.tokens
        }
      };
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  }
  
  

  async logout(token: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Logout failed');
      }

      return {
        success: true,
        message: data.message || 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async logoutAll(token: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout-all`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Logout all failed');
      }

      return {
        success: true,
        message: data.message || 'Logged out from all devices',
      };
    } catch (error) {
      console.error('Logout all error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      return {
        success: true,
        message: data.message || 'Token refreshed',
        data: data.data,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async verifyEmail(request: VerifyEmailRequest): Promise<AuthApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${request.token}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases more gracefully
        const errorMessage = data.detail || data.message || 'Email verification failed';
        console.error('Email verification failed:', errorMessage);
        throw new Error(errorMessage);
      }

      // Handle the backend response format with auto-login
      return {
        success: data.success || true,
        message: data.message || data.detail || 'Email verified successfully',
        data: data.data || null,
        user: data.data?.user || null,
        tokens: data.data?.tokens || null,
      };
    } catch (error) {
      console.error('Email verification error:', error);
      // Re-throw the error to be handled by the calling component
      throw error;
    }
  }

  async resendVerificationEmail(request: ResendVerificationRequest, token?: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(request),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      return {
        success: true,
        message: data.message || 'Verification email sent',
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  async requestPasswordReset(request: PasswordResetRequest): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset-request`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      return {
        success: true,
        message: data.message || 'Password reset email sent',
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }





  // async confirmPasswordReset(request: PasswordResetConfirm): Promise<ApiResponse> {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/auth/password-reset-confirm`, {
  //       method: 'POST',
  //       headers: this.getAuthHeaders(),
  //       body: JSON.stringify({
  //         token: request.token,
  //         new_password: request.newPassword,
  //       }),
  //     });

  //     const data = await response.json();
      
  //     if (!response.ok) {
  //       throw new Error(data.message || 'Password reset failed');
  //     }

  //     return {
  //       success: true,
  //       message: data.message || 'Password reset successful',
  //     };
  //   } catch (error) {
  //     console.error('Password reset confirm error:', error);
  //     throw error;
  //   }
  // }




  async confirmPasswordReset(request: PasswordResetConfirm): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset-confirm`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        token: request.token,
        new_password: request.newPassword,          // Map frontend to backend
        confirm_password: request.confirmPassword,  // Map frontend to backend
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed');
    }

    return {
      success: true,
      message: data.message || 'Password reset successful',
    };
  } catch (error) {
    console.error('Password reset confirm error:', error);
    throw error;
  }
}





  async getCurrentUser(token: string): Promise<AuthApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user info');
      }

      // Normalize the user data if it exists
      if (data.data && data.data.user) {
        const rawUserData = data.data.user;
        const normalizedUser = {
          id: rawUserData.id || rawUserData.user_id,
          email: rawUserData.email,
          name: rawUserData.name || rawUserData.full_name,
          isEmailVerified: rawUserData.isEmailVerified || rawUserData.is_email_verified || rawUserData.is_verified || false,
          createdAt: rawUserData.createdAt || rawUserData.created_at || new Date().toISOString(),
          updatedAt: rawUserData.updatedAt || rawUserData.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          message: 'User info retrieved',
          data: {
            user: normalizedUser,
            tokens: data.data.tokens
          },
        };
      }

      return {
        success: true,
        message: 'User info retrieved',
        data: data.data,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  async getUserProfile(token: string): Promise<UserProfileResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user profile');
      }

      // Normalize the user data to handle different field names
      const rawUserData = data.data || data;
      const normalizedUserData = {
        id: rawUserData.id || rawUserData.user_id,
        email: rawUserData.email,
        name: rawUserData.name || rawUserData.full_name,
        isEmailVerified: rawUserData.isEmailVerified || rawUserData.is_email_verified || rawUserData.is_verified || false,
        createdAt: rawUserData.createdAt || rawUserData.created_at || new Date().toISOString(),
        updatedAt: rawUserData.updatedAt || rawUserData.updated_at || new Date().toISOString(),
      };

      return {
        success: true,
        message: 'User profile retrieved',
        data: { user: normalizedUserData },
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  async updateUserProfile(token: string, profileData: { name?: string; email?: string }): Promise<AuthApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user profile');
      }

      return {
        success: true,
        message: data.message || 'User profile updated successfully',
        data: data.data || data,
      };
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }
}

export const authApi = new AuthApiService();
