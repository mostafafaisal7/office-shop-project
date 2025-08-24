"use client";

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from './AuthModal';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireEmailVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  requireEmailVerification = false,
}) => {
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [mounted, isLoading, isAuthenticated]);

  // Show loading while checking authentication
  if (!mounted || isLoading) {
    return <LoadingSkeleton title="Loading..." bgColor="bg-gray-50" />;
  }

  // Show auth modal if not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return (
        <>
          {fallback}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialView="login"
          />
        </>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Authentication Required</h2>
            <p className="mt-2 text-gray-600">
              Please sign in to access this page
            </p>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialView="login"
        />
      </div>
    );
  }

  // Check email verification if required
  if (requireEmailVerification && user && !user.isEmailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Email Verification Required</h2>
            <p className="mt-2 text-gray-600">
              Please verify your email address to access this page. Check your inbox for a verification link.
            </p>
            <button
              onClick={() => {
                // You can implement resend verification email here
                console.log('Resend verification email');
              }}
              className="mt-4 text-blue-600 hover:text-blue-500 font-medium"
            >
              Resend verification email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and verified (if required)
  return <>{children}</>;
};
