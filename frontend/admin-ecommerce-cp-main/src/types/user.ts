export interface UserListItem {
  id: number;
  name: string;
  phone?: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface UserDetail extends UserListItem {
  created_at?: string;
  updated_at?: string;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
  is_verified?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: 'id' | 'name' | 'email' | 'role';
  sort_order?: 'asc' | 'desc';
}
