import { useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { userService } from '@/services/user';
import { UserListItem, UserListResponse, UserFilters } from '@/types/user';

interface UseUsersReturn {
  users: UserListItem[];
  loading: boolean;
  error: string | null;
  response: UserListResponse | null;
  filters: UserFilters;
  setFilters: (filters: UserFilters) => void;
  refreshUsers: () => void;
  deleteUser: (id: number) => Promise<void>;
  toggleUserStatus: (id: number, isActive: boolean) => Promise<void>;
  handleTableChange: (pagination: any, filters: any, sorter: any) => void;
}

export function useUsers(): UseUsersReturn {
  const { message } = App.useApp();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<UserListResponse | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    per_page: 10,
    sort_by: 'id',
    sort_order: 'desc'
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.getUsers(filters);
      const data = result.data;
      
      if (data) {
        setUsers(data.users);
        setResponse(data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      // Don't show message.error here as it's already displayed in the UI
    } finally {
      setLoading(false);
    }
  }, [filters, message]);

  const refreshUsers = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: number) => {
    try {
      await userService.deleteUser(id);
      message.success('User deleted successfully');
      refreshUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete user';
      message.error(errorMessage);
      throw err;
    }
  }, [refreshUsers, message]);

  const toggleUserStatus = useCallback(async (id: number, isActive: boolean) => {
    try {
      await userService.toggleUserStatus(id, isActive);
      message.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      refreshUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update user status';
      message.error(errorMessage);
      throw err;
    }
  }, [refreshUsers, message]);

  const handleTableChange = useCallback((pagination: any, tableFilters: any, sorter: any) => {
    const newFilters: UserFilters = {
      ...filters,
      page: pagination.current,
      per_page: pagination.pageSize,
    };

    if (sorter.field) {
      newFilters.sort_by = sorter.field;
      newFilters.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    setFilters(newFilters);
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    response,
    filters,
    setFilters,
    refreshUsers,
    deleteUser,
    toggleUserStatus,
    handleTableChange,
  };
}
