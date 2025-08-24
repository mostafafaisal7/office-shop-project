import { apiService } from './api';
import { AxiosResponse } from 'axios';
import { 
  UserListResponse, 
  UserDetail, 
  UserCreateRequest, 
  UserUpdateRequest,
  UserFilters 
} from '@/types/user';
import { ApiResponse } from '@/types/api';

class UserService {
  async getUsers(filters?: UserFilters): Promise<AxiosResponse<UserListResponse>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    
    return await apiService.get(url);
  }

  async getUserById(id: number): Promise<AxiosResponse<ApiResponse<UserDetail>>> {
    return await apiService.get(`/users/${id}`);
  }

  async createUser(userData: UserCreateRequest): Promise<AxiosResponse<ApiResponse<UserDetail>>> {
    return await apiService.post('/users/create', userData);
  }

  async updateUser(id: number, userData: UserUpdateRequest): Promise<AxiosResponse<ApiResponse<UserDetail>>> {
    return await apiService.patch(`/users/${id}`, userData);
  }

  async deleteUser(id: number): Promise<AxiosResponse<ApiResponse<void>>> {
    return await apiService.delete(`/users/${id}`);
  }

  async activateUser(id: number): Promise<AxiosResponse<ApiResponse<UserDetail>>> {
    return await apiService.patch(`/users/${id}`, { is_active: true });
  }

  async deactivateUser(id: number): Promise<AxiosResponse<ApiResponse<UserDetail>>> {
    return await apiService.patch(`/users/${id}`, { is_active: false });
  }

  async toggleUserStatus(id: number, isActive: boolean): Promise<AxiosResponse<ApiResponse<UserDetail>>> {
    return await apiService.patch(`/users/${id}`, { is_active: isActive });
  }
}

export const userService = new UserService();
export default userService;
