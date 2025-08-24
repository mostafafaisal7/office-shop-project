"use client";

import React, { useState } from 'react';
import { User, Mail, Calendar, Shield, Settings, LogOut } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/authApi';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;

    try {
      setIsResendingVerification(true);
      await authApi.resendVerificationEmail({ email: user.email });
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
                  <p className="text-blue-100">{user?.email}</p>
                  {!user?.isEmailVerified && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Email not verified
                      </span>
                      <button
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className="text-xs text-blue-100 hover:text-white underline"
                      >
                        {isResendingVerification ? 'Sending...' : 'Resend verification'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Information */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Full Name</p>
                        <p className="text-sm text-gray-600">{user?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Email Address</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      </div>
                      {user?.isEmailVerified ? (
                        <div title="Verified">
                          <Shield className="h-5 w-5 text-green-500" />
                        </div>
                      ) : (
                        <div title="Not verified">
                          <Shield className="h-5 w-5 text-orange-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Member Since</p>
                        <p className="text-sm text-gray-600">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                  
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Navigate to settings page
                        showToast('Settings page coming soon!', 'info');
                      }}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Account Settings
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Navigate to orders page
                        showToast('Orders page coming soon!', 'info');
                      }}
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Orders
                    </Button>

                    {!user?.isEmailVerified && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                      >
                        <Mail className="h-4 w-4 mr-3" />
                        {isResendingVerification ? 'Sending...' : 'Verify Email'}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>

              {/* Email Verification Notice */}
              {!user?.isEmailVerified && (
                <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-orange-800">
                        Email Verification Required
                      </h3>
                      <p className="text-sm text-orange-700 mt-1">
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
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
