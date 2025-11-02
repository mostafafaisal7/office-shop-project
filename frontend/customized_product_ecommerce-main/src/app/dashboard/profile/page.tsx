"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, Settings, LogOut, Edit2, Save, X } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/authApi';

export default function DashboardProfilePage() {
  const { user, logout, setUser, tokens } = useAuthStore();
  const { showToast } = useToast();
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');

  const handleResendVerification = async () => {
    if (!user?.email || !tokens?.accessToken) return;

    try {
      setIsResendingVerification(true);
      await authApi.resendVerificationEmail({ email: user.email }, tokens.accessToken);
      showToast('Verification email sent! Please check your inbox.', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email';
      showToast(errorMessage, 'error');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
    } catch (error) {
      showToast('Logout failed', 'error');
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    if (!tokens?.accessToken) {
      showToast('Authentication required', 'error');
      return;
    }

    try {
      const response = await authApi.updateUserProfile(tokens.accessToken, {
        name: editedName.trim()
      });

      if (response.success && response.data) {
        // Handle different response structures
        const userData = response.data.user || response.data;

        // Check if userData has a name property (is a User object)
        const hasName = userData && typeof (userData as any).name === 'string';

        // Normalize the updated user data
        const updatedUser = {
          ...user!,
          name: hasName ? (userData as any).name : editedName.trim(),
          updatedAt: hasName
            ? ((userData as any).updatedAt || (userData as any).updated_at || new Date().toISOString())
            : new Date().toISOString(),
        };

        setUser(updatedUser);
        showToast('Name updated successfully', 'success');
        setIsEditing(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update name';
      showToast(errorMessage, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditedName(user?.name || '');
    setIsEditing(false);
  };

  // Update editedName when user data changes
  useEffect(() => {
    setEditedName(user?.name || '');
  }, [user?.name]);

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
                  <p className="text-blue-100">Manage your account information</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-card-foreground mb-6">Account Information</h2>
          
          <div className="space-y-6">
            {/* Name Field */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-card-foreground">Full Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                      {user?.name || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveName}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md"
                      title="Save"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                    title="Edit name"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-card-foreground">Email Address</p>
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">
                    {user?.email || 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {user?.isEmailVerified ? (
                  <div title="Verified" className="flex items-center space-x-1">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Verified</span>
                  </div>
                ) : (
                  <div title="Not verified" className="flex items-center space-x-1">
                    <Shield className="h-5 w-5 text-orange-500" />
                    <span className="text-xs text-orange-600 font-medium">Not Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-muted rounded-lg">
              <Calendar className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-card-foreground">Member Since</p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Verification Section */}
        {!user?.isEmailVerified && (
          <div className="bg-white dark:bg-card rounded-lg shadow-sm p-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-orange-800 dark:text-orange-400">
                    Email Verification Required
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Please verify your email address to access all features and ensure account security.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                  >
                    {isResendingVerification ? 'Sending...' : 'Send Verification Email'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-card-foreground mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={() => window.location.href = '/dashboard/settings'}
            >
              <Settings className="h-4 w-4 mr-3" />
              Account Settings
            </Button>

            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={() => window.location.href = '/dashboard/orders'}
            >
              <User className="h-4 w-4 mr-3" />
              My Orders
            </Button>

            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={() => window.location.href = '/dashboard/projects'}
            >
              <User className="h-4 w-4 mr-3" />
              My Projects
            </Button>

            <Button
              variant="outline"
              className="justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
