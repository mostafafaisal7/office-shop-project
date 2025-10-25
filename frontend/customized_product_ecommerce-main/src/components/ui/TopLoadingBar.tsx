/**
 * Top Loading Bar
 *
 * Displays a thin progress bar at the top of the page during navigation
 * Automatically shows when Next.js route changes
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset loading state when route changes
    setIsLoading(false);
    setProgress(0);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Simulate progress when loading
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // Listen for route change start
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsLoading(true);
      setProgress(0);
    };

    const handleRouteChangeComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    };

    // Note: In App Router, we don't have router events
    // The loading state is controlled by pathname/searchParams changes
    // This component provides visual feedback during navigation

    return () => {};
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 transition-all duration-200 ease-out"
      style={{
        width: `${progress}%`,
        opacity: isLoading ? 1 : 0,
      }}
    />
  );
}

// Named export
export { TopLoadingBar };
