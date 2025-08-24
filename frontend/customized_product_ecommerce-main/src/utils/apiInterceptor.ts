import { useAuthStore, getValidToken } from '@/store/authStore';

// API request interceptor to add authentication headers
export const createAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getValidToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add existing headers if they exist
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// Wrapper for authenticated API calls
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const response = await createAuthenticatedRequest(url, options);
  
  // If we get a 401, try to refresh the token once
  if (response.status === 401) {
    try {
      const { refreshToken } = useAuthStore.getState();
      await refreshToken();
      
      // Retry the request with the new token
      return createAuthenticatedRequest(url, options);
    } catch (error) {
      // If refresh fails, clear auth and redirect to login
      const { clearAuth } = useAuthStore.getState();
      clearAuth();
      throw new Error('Authentication failed. Please log in again.');
    }
  }
  
  return response;
};

// Helper function to make authenticated API calls with automatic error handling
export const apiCall = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await authenticatedFetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Specific methods for common HTTP verbs
export const api = {
  get: <T = any>(url: string, options?: RequestInit): Promise<T> =>
    apiCall<T>(url, { ...options, method: 'GET' }),
    
  post: <T = any>(url: string, data?: any, options?: RequestInit): Promise<T> =>
    apiCall<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T = any>(url: string, data?: any, options?: RequestInit): Promise<T> =>
    apiCall<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  patch: <T = any>(url: string, data?: any, options?: RequestInit): Promise<T> =>
    apiCall<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T = any>(url: string, options?: RequestInit): Promise<T> =>
    apiCall<T>(url, { ...options, method: 'DELETE' }),
};
