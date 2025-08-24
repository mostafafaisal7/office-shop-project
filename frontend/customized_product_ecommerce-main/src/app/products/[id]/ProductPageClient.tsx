'use client';

import React, { useState, useEffect } from 'react';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ColorSelector from '@/components/product/ColorSelector';

import { ApiProduct } from '@/services/api';

interface Media {
  file_path: string;
  is_primary?: boolean;
  color?: string | null;
}

interface Variation {
  attributes: {
    size: string;
    color?: string;
  };
  media: Media[];
}

interface Color {
  name: string;
  color: string;
}

interface ProductPageClientProps {
  product: ApiProduct;
  colors: Color[];
  sizes: string[];
}

const ProductPageClient = ({ product, colors, sizes }: ProductPageClientProps) => {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [filteredImages, setFilteredImages] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<Color[]>(colors);
  const [availableSizes, setAvailableSizes] = useState<string[]>(sizes);

  // Filter available colors based on selected size
  useEffect(() => {
    if (selectedSize) {
      const colorsForSize = product.variations
        .filter((v: any) => v.attributes?.size === selectedSize && v.attributes?.color)
        .map((v: any) => v.attributes.color!)
        .filter((color: string, index: number, arr: string[]) => arr.indexOf(color) === index); // Remove duplicates
      
      const filteredColors = colors.filter(color => 
        colorsForSize.includes(color.name)
      );
      setAvailableColors(filteredColors);
      
      // If current selected color is not available for this size, reset it
      if (selectedColor && !colorsForSize.includes(selectedColor)) {
        setSelectedColor('');
      }
    } else {
      setAvailableColors(colors);
    }
  }, [selectedSize, colors, product.variations, selectedColor]);

  // Filter available sizes based on selected color
  useEffect(() => {
    if (selectedColor) {
      const sizesForColor = product.variations
        .filter((v: any) => v.attributes?.color === selectedColor)
        .map((v: any) => v.attributes.size)
        .filter((size: string, index: number, arr: string[]) => arr.indexOf(size) === index); // Remove duplicates
      
      setAvailableSizes(sizesForColor);
      
      // If current selected size is not available for this color, reset it
      if (selectedSize && !sizesForColor.includes(selectedSize)) {
        setSelectedSize('');
      }
    } else {
      setAvailableSizes(sizes);
    }
  }, [selectedColor, sizes, product.variations, selectedSize]);

  useEffect(() => {
    let imagesToShow: string[] = [];
    
    if (selectedColor) {
      // Show images from variations that match the selected color
      const matchingVariations = product.variations.filter((v: any) => v.attributes?.color === selectedColor);
      const variationImages = matchingVariations.flatMap((v: any) => v.media?.map((m: any) => m.file_path) || []);
      imagesToShow = variationImages;
      
      // If no variation images found for the selected color, fallback to product media with that color
      if (imagesToShow.length === 0) {
        const primaryMedia = product.media.find(
          (m: any) => m.is_primary && (m.color === selectedColor.toLowerCase() || m.color === null || m.color === undefined)
        );
        const otherMedia = product.media.filter(
          (m: any) => !m.is_primary && (m.color === selectedColor.toLowerCase() || m.color === null || m.color === undefined)
        );
        
        imagesToShow = [
          ...(primaryMedia ? [primaryMedia.file_path] : []),
          ...otherMedia.map((m: any) => m.file_path)
        ];
      }
    } else {
      // Show all images if no color is selected - both product media and variation media
      const productImages = product.media.map((m: any) => m.file_path);
      const variationImages = product.variations.flatMap((v: any) => v.media?.map((m: any) => m.file_path) || []);
      imagesToShow = [...productImages, ...variationImages];
    }

    setFilteredImages(imagesToShow);
  }, [selectedColor, product]);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductGallery images={filteredImages} />
        <ProductInfo
          title={product.name}
          price={`৳${product.base_price}`}
          rating={5}
          reviewCount={1}
          description={product.description}
          shortDescription={product.short_description}
          colors={availableColors}
          sizes={availableSizes}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          productId={product.id.toString()}
          isCustomizable={product.is_customizable}
        />
      </div>
    </div>
  );
};


export default ProductPageClient;
