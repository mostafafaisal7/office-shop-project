'use client';
import { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
}

/**
 * OPTIMIZED ProductGallery Component
 *
 * Performance improvements:
 * 1. Uses Next.js Image component for automatic optimization
 * 2. Priority loading for main image (LCP optimization)
 * 3. Lazy loading for thumbnails
 * 4. Reduced quality for faster loading
 * 5. Proper sizing to avoid layout shift
 */
const ProductGallery = ({ images }: ProductGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Product Image - Priority loaded for LCP */}
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
        <Image
          src={images[selectedImage]}
          alt="Product"
          fill
          className="object-cover"
          priority={selectedImage === 0} // Priority load first image
          quality={75} // Reduced quality for faster loading
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnail Slider */}
      <div className="relative">
        {images.length > 5 && (
          <>
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow"
              aria-label="Scroll left"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow"
              aria-label="Scroll right"
            >
              <ArrowRight size={20} />
            </button>
          </>
        )}
        <div
          ref={sliderRef}
          className="flex space-x-2 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 relative ${
                selectedImage === index ? 'border-blue-500' : 'border-gray-200'
              }`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <Image
                src={image}
                alt={`Product ${index + 1}`}
                fill
                className="object-cover"
                loading="lazy" // Lazy load thumbnails
                quality={60} // Lower quality for thumbnails
                sizes="80px"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;
