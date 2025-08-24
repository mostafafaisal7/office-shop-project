"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";
import { LoginCredentials } from "@/types/auth";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onForgotPassword,
  onClose,
}) => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
    otp: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});
  const [otpRequired, setOtpRequired] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  


  const { login, verifyOtp, setTokens } = useAuthStore();
  const { showToast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {};

    if (!formData.email) newErrors.email = "Email or phone is required";
    if (!otpRequired && !formData.password) newErrors.password = "Password is required";
    if (otpRequired && !formData.otp) newErrors.otp = "OTP is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginCredentials]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    try {
      if (!otpRequired) {
        const response = await login({
          email: formData.email,
          password: formData.password,
        });
  
        if (response?.otpRequired) {
          if (!response.userId) throw new Error("User ID missing for OTP verification");
          setOtpRequired(true);
          setUserId(response.userId); // ✅ this will now be defined
          showToast(response.message || "OTP sent", "info");
          return; // stop redirect
        }
  
        showToast(response.message || "Login successful", "success");
        onClose?.();
      } else {
        if (!userId) throw new Error("User ID missing for OTP verification");
  
        const tokens = await verifyOtp({ userId, otp: formData.otp });
        setTokens(tokens); // save tokens
        showToast("Login successful!", "success");
        onClose?.();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Login failed", "error");
    }
  };
  

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          {otpRequired ? "Enter OTP" : "Welcome back"}
        </h2>
        <p className="text-gray-600 mt-2">
          {otpRequired ? "Check your email/phone for the OTP" : "Sign in to your account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!otpRequired ? (
          <>
            <div className="relative">
              <Input
                type="text"
                name="email"
                placeholder="Enter your email or phone"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                className="pl-10"
              />
              <Mail className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                className="pl-10 pr-10"
              />
              <Lock className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </>
        ) : (
          <div className="relative">
            <Input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={handleInputChange}
              error={errors.otp}
              className="pl-10"
            />
            <Smartphone className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
          </div>
        )}

        {!otpRequired && (
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </button>
          </div>
        )}

        <Button type="submit" className="w-full">
          {otpRequired ? "Verify OTP" : "Sign in"}
        </Button>
      </form>

      {!otpRequired && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
