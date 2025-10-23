'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  altText?: string;
}

/**
 * Reusable ImageLightbox component for viewing images in centered 400x400 popup
 * Features: Navigation, Zoom, Rotate, Download, Click outside to close
 *
 * Usage:
 * ```tsx
 * const [lightboxOpen, setLightboxOpen] = useState(false);
 * const [selectedImageIndex, setSelectedImageIndex] = useState(0);
 *
 * <ImageLightbox
 *   images={imageUrls}
 *   initialIndex={selectedImageIndex}
 *   isOpen={lightboxOpen}
 *   onClose={() => setLightboxOpen(false)}
 * />
 * ```
 */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  altText = 'Image'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset state when lightbox opens/closes or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, zoom, rotation]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setRotation(0);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(images[currentIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ margin: 0, padding: '1rem' }}
    >
      {/* Responsive Centered Modal - larger for better viewing */}
      <div
        className="relative bg-white rounded-lg shadow-2xl"
        style={{
          width: 'min(800px, 90vw)',
          height: 'min(800px, 90vh)',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-20"
          aria-label="Close lightbox"
        >
          <X size={20} className="text-gray-700" />
        </button>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-2 left-2 px-3 py-1 bg-black bg-opacity-70 text-white rounded-full text-xs z-10">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Main Image Container */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg p-2">
          <img
            src={images[currentIndex]}
            alt={`${altText} ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              cursor: zoom > 1 ? 'move' : 'default'
            }}
            draggable={false}
          />

          {/* Navigation Arrows - Inside Modal */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-60 text-white hover:bg-opacity-80 rounded-full transition-all z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-60 text-white hover:bg-opacity-80 rounded-full transition-all z-10"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Control Bar - Bottom of Modal */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 bg-black bg-opacity-70 px-3 py-1.5 rounded-full">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors disabled:opacity-30"
            aria-label="Zoom out"
            disabled={zoom <= 0.5}
            title="Zoom Out (-)"
          >
            <ZoomOut size={16} />
          </button>

          <button
            onClick={handleZoomIn}
            className="p-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors disabled:opacity-30"
            aria-label="Zoom in"
            disabled={zoom >= 3}
            title="Zoom In (+)"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={handleRotate}
            className="p-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            aria-label="Rotate"
            title="Rotate (R)"
          >
            <RotateCw size={16} />
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            aria-label="Download"
            title="Download"
          >
            <Download size={16} />
          </button>

          <div className="px-2 py-1 text-white text-xs flex items-center border-l border-white border-opacity-30 ml-1">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level to ensure proper centering
  return typeof document !== 'undefined'
    ? createPortal(lightboxContent, document.body)
    : null;
};

export default ImageLightbox;
