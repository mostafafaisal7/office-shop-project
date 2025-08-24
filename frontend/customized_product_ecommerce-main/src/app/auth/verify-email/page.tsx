"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/authApi';
import { useToast } from '@/contexts/ToastContext';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await authApi.verifyEmail({ token });
        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully!');
          showToast('Email verified successfully!', 'success');
        } else {
          setStatus('error');
          setMessage(response.message || 'Email verification failed.');
        }
      } catch (error) {
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Email verification failed.';
        setMessage(errorMessage);
        showToast(errorMessage, 'error');
      }
    };

    verifyEmail();
  }, [token, showToast]);

  const handleResendVerification = async () => {
    // This would need the user's email - you might want to store it in localStorage
    // or redirect to a form where they can enter their email
    showToast('Please log in and request a new verification email from your profile.', 'info');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Verifying your email...</h2>
              <p className="mt-2 text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Email Verified!</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-8 space-y-4">
                <Link href="/">
                  <Button className="w-full">
                    Continue to Home
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full">
                    Go to Profile
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Verification Failed</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-8 space-y-4">
                <Button
                  onClick={handleResendVerification}
                  className="w-full"
                >
                  Request New Verification Email
                </Button>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
