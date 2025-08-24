import { apiService } from './api';
import { AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  TokenResponse, 
  UserResponse, 
  RefreshTokenRequest,
  PasswordResetRequest,
  PasswordResetConfirm
} from '@/types/auth';
import { ApiResponse } from '@/types/api';

class AuthService {
  async login(credentials: LoginRequest): Promise<AxiosResponse<ApiResponse<TokenResponse & { user: UserResponse }>>> {
    return await apiService.post('/auth/admin/login', credentials);
  }

  async verifyOtp(userId: number, otp: string): Promise<AxiosResponse<ApiResponse<TokenResponse & { user: UserResponse }>>> {
    return await apiService.post('/auth/admin/login/verify-otp', { userId, otp });
  }

  async logout(): Promise<ApiResponse> {
    const response = await apiService.post('/auth/logout');
    return response.data;
  }

  async logoutAll(): Promise<ApiResponse> {
    const response = await apiService.post('/auth/logout-all');
    return response.data;
  }

  async refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<ApiResponse<TokenResponse>> {
    const response = await apiService.post('/auth/refresh', refreshTokenRequest);
    return response.data;
  }

  async getProfile(): Promise<AxiosResponse<ApiResponse<UserResponse>>> {
    return await apiService.get('/users/me');
  }

  async requestPasswordReset(request: PasswordResetRequest): Promise<ApiResponse> {
    const response = await apiService.post('/auth/password-reset-request', request);
    return response.data;
  }

  async confirmPasswordReset(request: PasswordResetConfirm): Promise<ApiResponse> {
    const response = await apiService.post('/auth/password-reset-confirm', request);
    return response.data;
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    const response = await apiService.get(`/auth/verify-email?token=${token}`);
    return response.data;
  }

  async resendVerificationEmail(email: string): Promise<ApiResponse> {
    const response = await apiService.post('/auth/resend-verification-email', { email });
    return response.data;
  }

  // Admin specific endpoints
  async getAdminDashboard(): Promise<ApiResponse> {
    const response = await apiService.get('/users/admin-only');
    return response.data;
  }
}

export const authService = new AuthService();
export default authService;
