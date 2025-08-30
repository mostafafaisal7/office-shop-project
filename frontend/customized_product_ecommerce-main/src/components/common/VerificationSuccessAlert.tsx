"use client";

import { useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

export const VerificationSuccessAlert = () => {
  const { showToast } = useToast();

  useEffect(() => {
    // Check for verification success message using new toast system
    const showToastFlag = localStorage.getItem('showVerificationToast');
    const toastMessage = localStorage.getItem('verificationToastMessage');
    const toastType = localStorage.getItem('verificationToastType') as 'success' | 'error' | 'info' || 'success';
    
    if (showToastFlag === 'true' && toastMessage) {
      // Clear the flags
      localStorage.removeItem('showVerificationToast');
      localStorage.removeItem('verificationToastMessage');
      localStorage.removeItem('verificationToastType');
      
      // Show success toast
      setTimeout(() => {
        showToast(toastMessage, toastType, 5000); // Show for 5 seconds
      }, 500); // Small delay to ensure page is loaded
    }

    // Legacy support for old alert system (can be removed later)
    const showSuccess = localStorage.getItem('showVerificationSuccess');
    const verificationMessage = localStorage.getItem('verificationMessage');
    
    if (showSuccess === 'true' && verificationMessage) {
      // Clear the flags
      localStorage.removeItem('showVerificationSuccess');
      localStorage.removeItem('verificationMessage');
      
      // Show success toast instead of alert
      setTimeout(() => {
        showToast(verificationMessage, 'success', 5000);
      }, 500);
    }
  }, [showToast]);

  return null; // This component doesn't render anything visible
};
