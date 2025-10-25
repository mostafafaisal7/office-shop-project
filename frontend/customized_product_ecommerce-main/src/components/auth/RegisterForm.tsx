"use client";

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { useShippingStore } from '@/store/shippingStore';
import { useToast } from '@/contexts/ToastContext';
import { RegisterCredentials } from '@/types/auth';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onClose?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onClose,
}) => {
  // const [formData, setFormData] = useState<RegisterCredentials>({
  //   name: '',
  //   email: '',
  //   password: '',
  //   confirmPassword: '',
  // });

  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    phone: '',   // ✅ added phone by fasal
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterCredentials>>({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { register, isLoading } = useAuthStore();
  const { getAutoFillData } = useShippingStore();
  const { showToast } = useToast();

  // Auto-fill form data from shipping info if available
  useEffect(() => {
    const autoFillData = getAutoFillData();
    if (autoFillData) {
      setFormData(prev => ({
        ...prev,
        email: autoFillData.email || prev.email,
        phone: autoFillData.phone || prev.phone,
      }));
    }
  }, [getAutoFillData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterCredentials> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';   // ✅ added phone by fasal                  
    } else if (!bdPhoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid Bangladeshi phone number";
    } // ✅ added phone by fasal
    


    


    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Get redirect information for email verification
      const { isFromCheckout } = useShippingStore.getState();
      const redirectPath = searchParams?.get('redirect') || (isFromCheckout() ? '/checkout' : pathname || '/');
      
      // Store redirect info for after email verification
      if (isFromCheckout() || redirectPath !== '/') {
        localStorage.setItem('postVerificationRedirect', redirectPath);
        localStorage.setItem('fromCheckout', isFromCheckout().toString());
      }

      await register(formData);
      showToast('Registration successful! Please check your email to verify your account.', 'success');
      onClose?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      showToast(errorMessage, 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof RegisterCredentials]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
        <p className="text-gray-600 mt-2">Join us and start shopping</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Input
            type="text"
            name="name"
            label="Full name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            disabled={isLoading}
            className="pl-10 text-gray-500"
          />
          <User className="absolute left-3 top-9 h-4 w-4 text-gray-500" />
        </div>

        <div className="relative">
          <Input
            type="email"
            name="email"
            label="Email address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            disabled={isLoading}
            className="pl-10 text-gray-500"
          />
          <Mail className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
        </div>

        <div className="relative">
          <Input
            type="tel"
            name="phone"
            label="Phone number"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleInputChange}
            error={errors.phone}
            disabled={isLoading}
            className="pl-10 text-gray-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-9 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.518 4.552a1 1 0 01-.502 1.21l-2.12 1.06a11.042 11.042 0 005.516 5.516l1.06-2.12a1 1 0 011.21-.502l4.552 1.518A1 1 0 0121 17.72V21a2 2 0 01-2 2h-1C9.163 23 1 14.837 1 5V5z"
            />
          </svg>
        </div>


        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            disabled={isLoading}
            className="pl-10 pr-10 text-gray-500"
          />
          <Lock className="absolute left-3 top-9.5 h-4 w-4 text-gray-400" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength.strength <= 2 ? 'text-red-600' :
                  passwordStrength.strength <= 3 ? 'text-yellow-600' :
                  passwordStrength.strength <= 4 ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            label="Confirm password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            disabled={isLoading}
            className="pl-10 pr-10 text-gray-500"
          />
          <Lock className="absolute left-3 top-9.5 h-4 w-4 text-gray-400" />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            required
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <span className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
          </span>
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          loadingText="Creating account..."
        >
          Create account
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
