'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Spin, Alert, Button } from 'antd';
import { useRouter } from 'next/navigation';
import UserForm from '@/components/users/UserForm';
import { userService } from '@/services/user';
import { UserDetail } from '@/types/user';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.getUserById(userId);
      // Handle both nested (response.data.data) and direct (response.data) response formats
      let userData: UserDetail | null = null;
      
      if (response.data) {
        // Check if response.data has a 'data' property (nested format)
        if ('data' in response.data && response.data.data) {
          userData = response.data.data as UserDetail;
        } else {
          // Direct format - response.data is the user data
          userData = response.data as UserDetail;
        }
      }
      
      if (userData && userData.id) {
        setUser(userData);
      } else {
        setError('User not found');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch user details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error || 'User not found'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => router.push('/dashboard/users')}>
              Back to Users
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <UserForm 
      userId={userId}
      initialData={{
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        is_verified: user.is_verified
      }}
      isEdit={true}
    />
  );
}
