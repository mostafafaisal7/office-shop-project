/**
 * Authentication API Service
 *
 * Refactored to use BaseApiClient for consistency and reduced duplication.
 * Maintains 100% backward compatibility with existing components.
 */

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
import { BaseApiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api';

class AuthApiService extends BaseApiClient {
  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthApiResponse> {
    try {
      const response = await this.post(
        API_ENDPOINTS.AUTH.REGISTER,
        {
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
          confirm_password: credentials.confirmPassword,
          phone: credentials.phone ?? undefined,
        },
        { requiresAuth: false }
      );

      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      // Handle nested backend response structure
      const backendResponse = response.data;
      const actualData = backendResponse?.data || backendResponse;
      const actualMessage = backendResponse?.message || response.message;

      return {
        success: true,
        message: actualMessage || 'Registration successful',
        data: actualData,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   * Supports OTP flow
   */
  async login(credentials: LoginCredentials): Promise<AuthApiResponse> {
    try {
      const response = await this.post(
        '/auth/customer/login',
        credentials,
        { requiresAuth: false }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      console.log("Raw login response from BaseApiClient:", response);

      // BaseApiClient wraps the backend response in { success, data, message }
      // The backend also returns { success, data, message }
      // So we need to check if response.data has its own 'data' property (nested)
      const backendResponse = response.data;

      // Handle nested response structure from backend
      const actualData = backendResponse.data || backendResponse;
      const actualMessage = backendResponse.message || response.message;

      console.log("Actual data:", actualData);

      // OTP required case
      if (actualData.otpRequired) {
        return {
          success: true,
          message: actualMessage || 'OTP sent successfully',
          detail: actualMessage || 'OTP sent successfully',
          otpRequired: true,
          user: actualData.user,
          data: {
            otpRequired: true,
            userId: actualData.userId,
            user: actualData.user
          }
        };
      }

      // Fully logged in case
      if (actualData.user && actualData.tokens) {
        return {
          success: true,
          message: actualMessage || 'Login successful',
          detail: actualMessage || 'Login successful',
          user: actualData.user,
          tokens: actualData.tokens,
          otpRequired: false,
          data: {
            user: actualData.user,
            tokens: actualData.tokens,
            otpRequired: false
          }
        };
      }

      // Fallback for unexpected response structure
      console.error("Login successful but unexpected response structure:", {
        response,
        backendResponse,
        actualData
      });
      throw new Error("Login failed - unexpected response structure");

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP after login
   */
  async verifyOtp(payload: { userId: number; otp: string }): Promise<AuthApiResponse> {
    try {
      const response = await this.post(
        '/auth/customer/login/verify-otp',
        payload,
        { requiresAuth: false }
      );

      if (!response.success) {
        throw new Error(response.message || "OTP verification failed");
      }

      console.log("Raw OTP verification response:", response);

      // Handle nested backend response structure
      const backendResponse = response.data;
      const actualData = backendResponse.data || backendResponse;
      const actualMessage = backendResponse.message || response.message;

      // Handle the backend response structure
      return {
        success: true,
        message: actualMessage || "OTP verified successfully",
        detail: actualMessage || "OTP verified successfully",
        user: actualData.user,
        tokens: actualData.tokens,
        data: {
          user: actualData.user,
          tokens: actualData.tokens
        }
      };
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  }

  /**
   * Logout current session
   */
  async logout(token: string): Promise<ApiResponse> {
    try {
      const response = await this.post(
        API_ENDPOINTS.AUTH.LOGOUT,
        {},
        { requiresAuth: true }
      );

      if (!response.success) {
        throw new Error(response.message || 'Logout failed');
      }

      return {
        success: true,
        message: response.message || 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(token: string): Promise<ApiResponse> {
    try {
      const response = await this.post(
        '/auth/logout-all',
        {},
        { requiresAuth: true }
      );

      if (!response.success) {
        throw new Error(response.message || 'Logout all failed');
      }

      return {
        success: true,
        message: response.message || 'Logged out from all devices',
      };
    } catch (error) {
      console.error('Logout all error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthApiResponse> {
    try {
      const response = await this.post(
        API_ENDPOINTS.AUTH.REFRESH,
        { refresh_token: refreshToken },
        { requiresAuth: false }
      );

      if (!response.success) {
        throw new Error(response.message || 'Token refresh failed');
      }

      return {
        success: true,
        message: response.message || 'Token refreshed',
        data: response.data,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<AuthApiResponse> {
    try {
      const response = await this.get(
        `${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${request.token}`,
        undefined,
        { requiresAuth: false }
      );

      if (!response.success) {
        const errorMessage = response.error || response.message || 'Email verification failed';
        console.error('Email verification failed:', errorMessage);
        throw new Error(errorMessage);
      }

      // Handle the backend response format with auto-login
      return {
        success: response.data?.success || true,
        message: response.message || 'Email verified successfully',
        data: response.data || null,
        user: response.data?.user || null,
        tokens: response.data?.tokens || null,
      };
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(request: ResendVerificationRequest, token?: string): Promise<ApiResponse> {
    try {
      const response = await this.post(
        API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
        request,
        { requiresAuth: !!token }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to resend verification email');
      }

      return {
        success: true,
        message: response.message || 'Verification email sent',
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<ApiResponse> {
    try {
      const response = await this.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        request,
        { requiresAuth: false }
      );

      if (!response.success) {
        throw new Error(response.message || 'Password reset request failed');
      }

      return {
        success: true,
        message: response.message || 'Password reset email sent',
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(request: PasswordResetConfirm): Promise<ApiResponse> {
    try {
      const response = await this.post(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        {
          token: request.token,
          new_password: request.newPassword,
          confirm_password: request.confirmPassword,
        },
        { requiresAuth: false }
      );

      if (!response.success) {
        throw new Error(response.message || 'Password reset failed');
      }

      return {
        success: true,
        message: response.message || 'Password reset successful',
      };
    } catch (error) {
      console.error('Password reset confirm error:', error);
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(token: string): Promise<AuthApiResponse> {
    try {
      const response = await this.get(
        API_ENDPOINTS.AUTH.ME,
        undefined,
        { requiresAuth: true }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get user info');
      }

      // Normalize the user data if it exists
      if (response.data && response.data.user) {
        const rawUserData = response.data.user;
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
            tokens: response.data.tokens
          },
        };
      }

      return {
        success: true,
        message: 'User info retrieved',
        data: response.data,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(token: string): Promise<UserProfileResponse> {
    try {
      const response = await this.get(
        '/users/me',
        undefined,
        { requiresAuth: true }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get user profile');
      }

      // Normalize the user data to handle different field names
      const rawUserData = response.data || response;
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

  /**
   * Update user profile
   */
  async updateUserProfile(token: string, profileData: { name?: string; email?: string }): Promise<AuthApiResponse> {
    try {
      const response = await this.patch(
        '/users/me',
        profileData,
        { requiresAuth: true }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to update user profile');
      }

      return {
        success: true,
        message: response.message || 'User profile updated successfully',
        data: response.data,
      };
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authApi = new AuthApiService();
