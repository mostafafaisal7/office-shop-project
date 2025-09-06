'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PreviewCarouselProps {
  images: string | string[];
  alt: string;
  className?: string;
  showThumbnails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PreviewCarousel: React.FC<PreviewCarouselProps> = ({
  images,
  alt,
  className = '',
  showThumbnails = true,
  size = 'md'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Convert to array for consistent handling
  const imageArray = Array.isArray(images) ? images : [images];
  const hasMultipleImages = imageArray.length > 1;
  
  // Size classes
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20', 
    lg: 'w-32 h-32'
  };
  
  const thumbnailSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imageArray.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + imageArray.length) % imageArray.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const formatImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    
    // Convert relative paths to full URLs if needed
    if (!imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('/images/')) {
        return `http://127.0.0.1:8000/static/products/${imageUrl.replace('/images/products/', '')}`;
      } else if (imageUrl.startsWith('/static/')) {
        return `http://127.0.0.1:8000${imageUrl}`;
      }
    }
    return imageUrl;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Image */}
      <div className={`relative ${sizeClasses[size]} bg-gray-100 rounded-lg overflow-hidden`}>
        <img
          src={formatImageUrl(imageArray[currentIndex]) || `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop`}
          alt={`${alt} ${hasMultipleImages ? `- View ${currentIndex + 1}` : ''}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src.includes('unsplash')) {
              return; // Prevent infinite loop
            }
            target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop';
          }}
        />
        
        {/* Navigation Arrows - only show if multiple images */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </>
        )}
        
        {/* Image Counter - only show if multiple images */}
        {hasMultipleImages && (
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
            {currentIndex + 1}/{imageArray.length}
          </div>
        )}
      </div>
      
      {/* Thumbnails - only show if multiple images and showThumbnails is true */}
      {hasMultipleImages && showThumbnails && imageArray.length <= 6 && (
        <div className="flex gap-1 mt-2 justify-center">
          {imageArray.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`${thumbnailSizes[size]} rounded border-2 overflow-hidden transition-all ${
                index === currentIndex 
                  ? 'border-blue-500' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`View ${index + 1}`}
            >
              <img
                src={formatImageUrl(image) || `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&h=100&fit=crop`}
                alt={`${alt} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('unsplash')) {
                    return; // Prevent infinite loop
                  }
                  target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&h=100&fit=crop';
                }}
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Dots indicator - for many images or when thumbnails are disabled */}
      {hasMultipleImages && (!showThumbnails || imageArray.length > 6) && (
        <div className="flex gap-1 mt-2 justify-center">
          {imageArray.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewCarousel;