/**
 * Lazy-loaded Design Components
 *
 * Heavy design components are lazy-loaded to improve initial page load time.
 * This file provides optimized imports for the design page.
 */

'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Loading component shown while design components load
 */
const DesignLoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading design tools...</p>
    </div>
  </div>
);

/**
 * Lazy-loaded DesignCanvas
 * The main canvas component is heavy due to fabric.js, so we lazy load it
 */
export const LazyDesignCanvas = dynamic(
  () => import('./DesignCanvas'),
  {
    loading: () => <DesignLoadingFallback />,
    ssr: false, // Canvas requires window object, so disable SSR
  }
);

/**
 * Lazy-loaded LeftSidebar
 * Contains tools and options, can be loaded after main content
 */
export const LazyLeftSidebar = dynamic(
  () => import('./LeftSidebar'),
  {
    loading: () => (
      <div className="w-full h-full bg-white animate-pulse">
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  }
);

/**
 * Lazy-loaded RightSidebar
 * Contains properties panel, can be loaded after main content
 */
export const LazyRightSidebar = dynamic(
  () => import('./RightSidebar'),
  {
    loading: () => (
      <div className="w-full h-full bg-white animate-pulse">
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  }
);

export default {
  LazyDesignCanvas,
  LazyLeftSidebar,
  LazyRightSidebar,
};
