import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '@/utils/constants';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh and datetime serialization
    this.api.interceptors.response.use(
      (response) => {
        // Convert datetime objects to strings in response data
        if (response.data) {
          response.data = this.serializeDatetimes(response.data);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const { access_token } = response.data;
              
              localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, access_token);
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearAuthData();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(refreshToken: string) {
    return axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
  }

  private clearAuthData() {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
  }

  private serializeDatetimes(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.serializeDatetimes(item));
    }

    if (typeof obj === 'object') {
      const serialized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          
          // Check if it's a datetime field and convert to ISO string
          if ((key === 'created_at' || key === 'updated_at' || key.endsWith('_at')) && value) {
            try {
              // Handle various datetime formats
              if (typeof value === 'string') {
                // Already a string, validate it's a valid date
                const date = new Date(value);
                serialized[key] = isNaN(date.getTime()) ? value : date.toISOString();
              } else if (value instanceof Date) {
                serialized[key] = value.toISOString();
              } else if (typeof value === 'object') {
                // Handle datetime objects from Python/FastAPI
                const date = new Date(value);
                serialized[key] = isNaN(date.getTime()) ? JSON.stringify(value) : date.toISOString();
              } else {
                serialized[key] = value;
              }
            } catch (error) {
              console.warn(`Failed to serialize datetime field ${key}:`, error);
              serialized[key] = value;
            }
          } else {
            serialized[key] = this.serializeDatetimes(value);
          }
        }
      }
      return serialized;
    }

    return obj;
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete(url, config);
  }

  // File upload method
  async upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  }

  // Get API instance for direct use
  getApi(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
export default apiService;
