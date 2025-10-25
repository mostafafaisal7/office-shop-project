"use client";

import Image from "next/image";
import { useState, useCallback, memo } from "react";
import LoadingLink from "@/components/ui/LoadingLink";

interface ProductCardProps {
  id: number;
  name: string;
  price: string;
  image: string;
  originalPrice?: string;
}

const ProductCard = ({ id, name, price, image, originalPrice }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(image);

  const handleImageError = useCallback(() => {
    if (!imageError) {
      setImageError(true);
      // Try a fallback Unsplash image first
      setImageSrc('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop');
    }
  }, [imageError]);

  return (
    <LoadingLink href={`/products/${id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-200 active:scale-95">
        <div className="aspect-square overflow-hidden bg-gray-50">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No Image</p>
              </div>
            </div>
          ) : (
            <Image
              src={imageSrc}
              alt={name}
              width={300}
              height={300}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
              loading="lazy"
              quality={75}
            />
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-2 text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
            {name.toUpperCase()}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  ৳{originalPrice}
                </span>
              )}
              <span className="text-lg font-bold text-gray-900">
                ৳{price}
              </span>
            </div>
          </div>
        </div>
      </div>
    </LoadingLink>
  );
};

// Memoize ProductCard to prevent unnecessary re-renders in grids/lists
// Only re-render if product data actually changes
export default memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.price === nextProps.price &&
    prevProps.image === nextProps.image &&
    prevProps.originalPrice === nextProps.originalPrice
  );
});

// Named export for backward compatibility
export { ProductCard };
