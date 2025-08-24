'use client';

import { useEffect } from 'react';

export default function ErrorHandler() {
  useEffect(() => {
    const originalError = console.error;
    
    console.error = (...args) => {
      // Suppress specific TinyMCE warnings
      if (typeof args[0] === 'string' && 
          (args[0].includes('TinyMCE') || 
           args[0].includes('source-map'))) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}