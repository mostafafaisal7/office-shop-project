/**
 * Skeleton Loading Components
 *
 * Beautiful skeleton screens for better perceived performance
 */

'use client';

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4" />
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonProductGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonProductDetails() {
  return (
    <div className="animate-pulse">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Image skeleton */}
        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg" />

        {/* Details skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4" />
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2" />
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-5/6" />
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-4/6" />
          </div>
          <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
          <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded"
          style={{ width: `${100 - (i * 10)}%` }}
        />
      ))}
    </div>
  );
}
