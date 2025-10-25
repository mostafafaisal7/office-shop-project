/**
 * Design Page Loading Skeleton
 *
 * Beautiful loading state for the design/canvas page
 */

'use client';

export default function DesignLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48" />
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
            <div className="h-10 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar Skeleton */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-4">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
            ))}
          </div>
        </div>

        {/* Canvas Area Skeleton */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-4">
            {/* Animated spinner */}
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-2">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-64 mx-auto" />
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 mx-auto" />
            </div>
          </div>

          {/* Mock canvas preview */}
          <div className="mt-8 w-full max-w-2xl aspect-[4/5] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg shadow-lg" />
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-4">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
