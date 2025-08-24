export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  is_admin?: boolean;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  is_active?: boolean;
  is_admin?: boolean;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  is_email_verified: boolean;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}
