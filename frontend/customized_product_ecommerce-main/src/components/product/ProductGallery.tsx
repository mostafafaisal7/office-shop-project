'use client';
import { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
}

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
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img 
          src={images[selectedImage]} 
          alt="Product" 
          className="w-full h-full object-cover"
        />
      </div>
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
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                selectedImage === index ? 'border-blue-500' : 'border-gray-200'
              }`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;
