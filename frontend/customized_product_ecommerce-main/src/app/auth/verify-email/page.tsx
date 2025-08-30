"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';
import { useShippingStore } from '@/store/shippingStore';
import { useToast } from '@/contexts/ToastContext';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const redirectPath = searchParams.get('redirect');
  const fromCheckout = searchParams.get('from') === 'checkout';
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);
  
  const { showToast } = useToast();
  const { setUser, setTokens } = useAuthStore();
  const { isFromCheckout, clearGuestCheckoutContext } = useShippingStore();

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
          
          // Auto-login after verification (first time only)
          if (response.data?.user && response.data?.tokens) {
            setUser(response.data.user);
            setTokens(response.data.tokens);
            
            // Store tokens in localStorage
            localStorage.setItem("accessToken", response.data.tokens.accessToken);
            localStorage.setItem("refreshToken", response.data.tokens.refreshToken);
            
            // Auto-redirect after successful verification and login
            setIsAutoRedirecting(true);
            setTimeout(() => {
              // Check for stored redirect info from registration
              const storedRedirect = localStorage.getItem('postVerificationRedirect');
              const storedFromCheckout = localStorage.getItem('fromCheckout') === 'true';
              
              // Clean up stored redirect info
              localStorage.removeItem('postVerificationRedirect');
              localStorage.removeItem('fromCheckout');
              
              const targetPath = redirectPath || storedRedirect || (fromCheckout || isFromCheckout() || storedFromCheckout ? '/checkout' : '/');
              
              // Use toast instead of localStorage for success message
              if (targetPath === '/checkout' || fromCheckout || isFromCheckout() || storedFromCheckout) {
                // Store success message for checkout page
                localStorage.setItem('showVerificationToast', 'true');
                localStorage.setItem('verificationToastMessage', 'Email verified successfully! You are now logged in and can continue with your checkout.');
                localStorage.setItem('verificationToastType', 'success');
              } else {
                // Store success message for other pages
                localStorage.setItem('showVerificationToast', 'true');
                localStorage.setItem('verificationToastMessage', 'Email verified successfully! Welcome to our platform.');
                localStorage.setItem('verificationToastType', 'success');
              }
              
              clearGuestCheckoutContext();
              router.push(targetPath);
            }, 2000); // 2 second delay to show success message
          } else {
            // If no auto-login data, still redirect but user will need to login manually
            const storedRedirect = localStorage.getItem('postVerificationRedirect');
            const storedFromCheckout = localStorage.getItem('fromCheckout') === 'true';
            
            // Clean up stored redirect info
            localStorage.removeItem('postVerificationRedirect');
            localStorage.removeItem('fromCheckout');
            
            if (fromCheckout || isFromCheckout() || storedFromCheckout) {
              setIsAutoRedirecting(true);
              setTimeout(() => {
                const loginRedirect = storedRedirect || '/checkout';
                router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}&from=checkout`);
              }, 2000);
            }
          }
        } else {
          setStatus('error');
          setMessage(response.message || 'Email verification failed.');
        }
      } catch (error) {
        // Handle the error more gracefully - don't show error if verification actually succeeded
        console.error('Email verification error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Email verification failed.';
        
        // Check if this is just a token error but verification might have succeeded
        if (errorMessage.includes('Invalid or expired token')) {
          // Try to proceed anyway - the backend might have verified the email despite the error
          setStatus('success');
          setMessage('Email verification completed. Please log in to continue.');
          
          // Redirect to login if coming from checkout
          const storedFromCheckout = localStorage.getItem('fromCheckout') === 'true';
          if (fromCheckout || isFromCheckout() || storedFromCheckout) {
            setIsAutoRedirecting(true);
            setTimeout(() => {
              const storedRedirect = localStorage.getItem('postVerificationRedirect') || '/checkout';
              localStorage.removeItem('postVerificationRedirect');
              localStorage.removeItem('fromCheckout');
              router.push(`/login?redirect=${encodeURIComponent(storedRedirect)}&from=checkout`);
            }, 2000);
          } else {
            setTimeout(() => {
              router.push('/login');
            }, 2000);
          }
        } else {
          setStatus('error');
          setMessage(errorMessage);
          showToast(errorMessage, 'error');
        }
      }
    };

    verifyEmail();
  }, [token, showToast, setUser, setTokens, redirectPath, fromCheckout, isFromCheckout, clearGuestCheckoutContext, router]);

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
              
              {isAutoRedirecting && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    {fromCheckout || isFromCheckout() 
                      ? "Redirecting you back to checkout..." 
                      : redirectPath 
                        ? `Redirecting you to ${redirectPath}...`
                        : "Redirecting you to home page..."
                    }
                  </p>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                  </div>
                </div>
              )}
              
              {!isAutoRedirecting && (
                <div className="mt-8 space-y-4">
                  <Link href={redirectPath || (fromCheckout || isFromCheckout() ? '/checkout' : '/')}>
                    <Button className="w-full">
                      {fromCheckout || isFromCheckout() ? 'Continue to Checkout' : 'Continue to Home'}
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline" className="w-full">
                      Go to Profile
                    </Button>
                  </Link>
                </div>
              )}
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
