'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  altText?: string;
}

/**
 * Reusable ImageLightbox component for viewing images in full-screen modal
 * Features: Navigation, Zoom, Rotate, Download
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

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
        aria-label="Close lightbox"
      >
        <X size={24} />
      </button>

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 px-4 py-2 bg-black bg-opacity-60 text-white rounded-full text-sm z-10">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-60 px-4 py-2 rounded-full z-10">
        <button
          onClick={handleZoomOut}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Zoom out"
          disabled={zoom <= 0.5}
        >
          <ZoomOut size={20} />
        </button>

        <button
          onClick={handleZoomIn}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Zoom in"
          disabled={zoom >= 3}
        >
          <ZoomIn size={20} />
        </button>

        <button
          onClick={handleRotate}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Rotate"
        >
          <RotateCw size={20} />
        </button>

        <button
          onClick={handleDownload}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Download"
        >
          <Download size={20} />
        </button>

        <div className="px-3 py-2 text-white text-sm flex items-center border-l border-white border-opacity-30 ml-2">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center p-16">
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
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-20 left-4 text-white text-xs bg-black bg-opacity-60 px-3 py-2 rounded opacity-50 hover:opacity-100 transition-opacity">
        <div>← → : Navigate</div>
        <div>+ - : Zoom</div>
        <div>R : Rotate</div>
        <div>ESC : Close</div>
      </div>
    </div>
  );
};

export default ImageLightbox;
