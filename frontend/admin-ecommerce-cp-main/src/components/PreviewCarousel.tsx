'use client';

import React, { useState } from 'react';
import { LeftOutlined, RightOutlined, EyeOutlined } from '@ant-design/icons';
import { ImageLightbox } from './common/ImageLightbox';

interface PreviewCarouselProps {
  images: string | string[];
  alt: string;
  size?: number;
  showThumbnails?: boolean;
  style?: React.CSSProperties;
  enableLightbox?: boolean; // NEW: Enable lightbox on click
}

export const PreviewCarousel: React.FC<PreviewCarouselProps> = ({
  images,
  alt,
  size = 64,
  showThumbnails = true,
  style = {},
  enableLightbox = true // NEW: Default enabled
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false); // NEW: Lightbox state
  
  // Convert to array for consistent handling
  const imageArray = Array.isArray(images) ? images : [images];
  const hasMultipleImages = imageArray.length > 1;
  
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

  // NEW: Open lightbox handler
  const openLightbox = () => {
    if (enableLightbox) {
      setLightboxOpen(true);
    }
  };

  // NEW: Format all image URLs for lightbox
  const formattedImageArray = imageArray.map(img => formatImageUrl(img));

  return (
    <>
      <div style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Main Image */}
        <div
          style={{
            position: 'relative',
            width: size,
            height: size,
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: enableLightbox ? 'pointer' : 'default', // NEW: Pointer cursor
            transition: 'transform 0.2s', // NEW: Hover effect
          }}
          onClick={openLightbox} // NEW: Click to open lightbox
          onMouseEnter={(e) => {
            if (enableLightbox) {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (enableLightbox) {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
            }
          }}
        >
          <img
            src={formatImageUrl(imageArray[currentIndex]) || `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop`}
            alt={`${alt} ${hasMultipleImages ? `- View ${currentIndex + 1}` : ''}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.includes('unsplash')) {
                return; // Prevent infinite loop
              }
              target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop';
            }}
          />

          {/* NEW: View icon overlay on hover */}
          {enableLightbox && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s',
                pointerEvents: 'none'
              }}
              className="lightbox-overlay"
            >
              <EyeOutlined
                style={{
                  fontSize: size / 3,
                  color: 'white',
                  opacity: 0,
                  transition: 'opacity 0.3s'
                }}
                className="lightbox-icon"
              />
            </div>
          )}
        
        {/* Navigation Arrows - only show if multiple images */}
        {hasMultipleImages && (
          <>
            <div
              onClick={(e) => {
                e.stopPropagation(); // NEW: Prevent lightbox from opening
                prevImage();
              }}
              style={{
                position: 'absolute',
                left: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLDivElement).style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLDivElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
              }}
            >
              <LeftOutlined style={{ fontSize: '10px' }} />
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation(); // NEW: Prevent lightbox from opening
                nextImage();
              }}
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLDivElement).style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLDivElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
              }}
            >
              <RightOutlined style={{ fontSize: '10px' }} />
            </div>
          </>
        )}
        
        {/* Image Counter - only show if multiple images */}
        {hasMultipleImages && (
          <div 
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            {currentIndex + 1}/{imageArray.length}
          </div>
        )}
      </div>
      
      {/* Thumbnails - only show if multiple images and showThumbnails is true */}
      {hasMultipleImages && showThumbnails && imageArray.length <= 6 && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          {imageArray.map((image, index) => (
            <div
              key={index}
              onClick={() => goToImage(index)}
              style={{
                width: size / 6,
                height: size / 6,
                minWidth: '16px',
                minHeight: '16px',
                borderRadius: '4px',
                border: `2px solid ${index === currentIndex ? '#1890ff' : '#d9d9d9'}`,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.3s'
              }}
            >
              <img
                src={formatImageUrl(image) || `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&h=100&fit=crop`}
                alt={`${alt} thumbnail ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('unsplash')) {
                    return; // Prevent infinite loop
                  }
                  target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&h=100&fit=crop';
                }}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Dots indicator - for many images or when thumbnails are disabled */}
      {hasMultipleImages && (!showThumbnails || imageArray.length > 6) && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          {imageArray.map((_, index) => (
            <div
              key={index}
              onClick={() => goToImage(index)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? '#1890ff' : '#d9d9d9',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
            />
          ))}
        </div>
      )}
    </div>

    {/* NEW: ImageLightbox modal */}
    {enableLightbox && (
      <ImageLightbox
        images={formattedImageArray}
        initialIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        altText={alt}
      />
    )}

    {/* NEW: CSS for hover effect */}
    <style jsx>{`
      .lightbox-overlay:hover {
        background-color: rgba(0, 0, 0, 0.3) !important;
      }
      .lightbox-overlay:hover .lightbox-icon {
        opacity: 1 !important;
      }
    `}</style>
    </>
  );
};

export default PreviewCarousel;