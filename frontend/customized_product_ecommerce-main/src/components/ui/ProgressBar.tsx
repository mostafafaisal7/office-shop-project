/**
 * ProgressBar Component
 *
 * Smooth progress indicator for loading states
 */

'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  isLoading?: boolean;
  variant?: 'primary' | 'success' | 'warning';
}

export default function ProgressBar({ isLoading = false, variant = 'primary' }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [isLoading]);

  const variantColors = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
  };

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
      <div
        className={`h-full ${variantColors[variant]} transition-all duration-300 ease-out`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
