"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff, 
  Key, 
  Trash2, 
  Save,
  Globe,
  Moon,
  Sun,
  Monitor,
  Mail,
  Smartphone
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export default function DashboardSettingsPage() {
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [language, setLanguage] = useState('en');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setEmailNotifications(settings.emailNotifications ?? true);
        setPushNotifications(settings.pushNotifications ?? true);
        setMarketingEmails(settings.marketingEmails ?? false);
        setOrderUpdates(settings.orderUpdates ?? true);
        setLanguage(settings.language ?? 'en');
        setTwoFactorEnabled(settings.twoFactorEnabled ?? false);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      emailNotifications,
      pushNotifications,
      marketingEmails,
      orderUpdates,
      language,
      twoFactorEnabled,
    };
    
    localStorage.setItem('userSettings', JSON.stringify(settings));
    showToast('Settings saved successfully', 'success');
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long', 'error');
      return;
    }

    try {
      // Here you would typically call an API to change the password
      // For now, we'll just simulate success
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showToast('Failed to change password', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        // Here you would typically call an API to delete the account
        // For now, we'll just show a message
        showToast('Account deletion request submitted. You will receive a confirmation email.', 'info');
      } catch (error) {
        showToast('Failed to delete account', 'error');
      }
    }
  };

  const toggleTwoFactor = () => {
    if (!twoFactorEnabled) {
      showToast('Two-factor authentication setup would be implemented here', 'info');
    } else {
      showToast('Two-factor authentication disabled', 'success');
    }
    setTwoFactorEnabled(!twoFactorEnabled);
  };

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
                    <Settings className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Account Settings</h1>
                    <p className="text-blue-100">Manage your preferences and security settings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-card rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-card-foreground mb-6 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Preferences
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-card-foreground">Email Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Receive notifications via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-card-foreground">Push Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Receive push notifications on your device</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-card-foreground">Order Updates</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Get notified about order status changes</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orderUpdates}
                    onChange={(e) => setOrderUpdates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-card-foreground">Marketing Emails</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Receive promotional emails and offers</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingEmails}
                    onChange={(e) => setMarketingEmails(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="bg-white dark:bg-card rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-card-foreground mb-6 flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Appearance & Language
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-card-foreground mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors ${
                      theme === 'light' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    <span className="text-sm">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors ${
                      theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    <span className="text-sm">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors ${
                      theme === 'system' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm">System</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-card-foreground mb-3">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-card rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-card-foreground mb-6 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Settings
            </h2>
            
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-card-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <Button
                  variant={twoFactorEnabled ? "outline" : "default"}
                  size="sm"
                  onClick={toggleTwoFactor}
                >
                  {twoFactorEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>

              {/* Change Password */}
              <div className="p-4 bg-gray-50 dark:bg-muted rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-card-foreground mb-4 flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button onClick={handlePasswordChange} size="sm">
                    Change Password
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Settings */}
          <div className="bg-white dark:bg-card rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-card-foreground">Save Changes</h3>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Save your notification and appearance preferences</p>
              </div>
              <Button onClick={saveSettings} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-card rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <h2 className="text-xl font-semibold text-red-600 mb-6 flex items-center">
              <Trash2 className="h-5 w-5 mr-2" />
              Danger Zone
            </h2>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Delete Account</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAccount}
                  className="ml-4 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
