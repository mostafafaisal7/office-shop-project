'use client';

import { memo, useCallback } from 'react';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string;
  setSelectedSize: (size: string) => void;
}

const SizeSelector = ({ sizes, selectedSize, setSelectedSize }: SizeSelectorProps) => {
  const handleSizeClick = useCallback((size: string) => {
    // If the same size is clicked, unselect it
    if (selectedSize === size) {
      setSelectedSize('');
    } else {
      setSelectedSize(size);
    }
  }, [selectedSize, setSelectedSize]);

  return (
    <div>
      <label className="text-sm font-medium text-gray-900 block mb-3">Sizes:</label>
      <div className="flex space-x-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => handleSizeClick(size)}
            className={`px-4 py-2 border rounded-md ${
              selectedSize === size
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      <div className="text-sm text-blue-600 mt-2">Size Chart</div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render if sizes, selectedSize, or setSelectedSize changes
export default memo(SizeSelector, (prevProps, nextProps) => {
  return (
    prevProps.selectedSize === nextProps.selectedSize &&
    prevProps.sizes === nextProps.sizes &&
    prevProps.setSelectedSize === nextProps.setSelectedSize
  );
});
