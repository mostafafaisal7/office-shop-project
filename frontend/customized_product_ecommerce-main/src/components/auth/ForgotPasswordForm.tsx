"use client";

import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { authApi } from '@/services/authApi';
import { PasswordResetRequest } from '@/types/auth';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBack,
}) => {
  const [formData, setFormData] = useState<PasswordResetRequest>({
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { showToast } = useToast();

  const validateForm = (): boolean => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await authApi.requestPasswordReset(formData);
      setIsSubmitted(true);
      showToast('Password reset email sent! Please check your inbox.', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      showToast(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ email: value });
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
          <p className="text-gray-600 mt-2">
            We've sent a password reset link to{' '}
            <span className="font-medium">{formData.email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              try again
            </button>
          </p>
          
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Forgot password?</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Input
            type="email"
            name="email"
            label="Email address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            error={error}
            disabled={isLoading}
            className="pl-10"
          />
          <Mail className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>

          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Button>
        </div>
      </form>
    </div>
  );
};
