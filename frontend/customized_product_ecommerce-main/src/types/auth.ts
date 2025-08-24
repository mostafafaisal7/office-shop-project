export interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isOtpRequired: boolean;
  isAuthenticated: boolean;
  // ...
}



// export interface AuthState {
//   user: User | null;
//   tokens: AuthTokens | null;
//   isLoading: boolean;
//   isAuthenticated: boolean;
// }

// export interface LoginCredentials {
//   email: string;
//   password: string;
// }

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password?: string;
  otp?: string; // For OTP verification
}


// export interface RegisterCredentials {
//   name: string;
//   email: string;
//   password: string;
//   confirmPassword: string;
// }


// src/types/auth.ts   BY fasal
export interface RegisterCredentials {
  name: string;
  email: string;
  phone: string;   // ✅ added phone
  password: string;
  confirmPassword: string;
}


export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Define the type exactly as your backend sends it
export interface AuthApiResponse {
  success?: boolean;
  message?: string;
  detail?: string; // Keep for backward compatibility
  data?: {
    user?: User;
    tokens?: AuthTokens;
    otpRequired?: boolean;
    userId?: number;
  };
  user?: User;
  tokens?: AuthTokens; // { accessToken: string; refreshToken: string }
  otpRequired?: boolean;
  // Optional fallback fields if your backend sometimes sends accessToken/refreshToken directly
  accessToken?: string;
  refreshToken?: string;
}

export interface UserProfileResponse extends ApiResponse {
  data?: {
    user: User;
  };
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}
