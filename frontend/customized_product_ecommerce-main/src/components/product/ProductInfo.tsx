import { Heart, ShoppingCart, Star, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ColorSelector from './ColorSelector';
import SizeSelector from './SizeSelector';
import QuantitySelector from './QuantitySelector';
import { useDesignStore } from '@/store/designStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/contexts/ToastContext';
import { fetchProductById, ApiProduct } from '@/services/api';

interface ProductInfoProps {
  title: string;
  price: string;
  rating: number;
  reviewCount: number;
  description: string;
  shortDescription: string;
  colors: { name: string; color: string }[];
  sizes: string[];
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  productId: string;
  isCustomizable: boolean;
}

const ProductInfo = ({
  title,
  price,
  rating,
  reviewCount,
  description,
  shortDescription,
  colors,
  sizes,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  productId,
  isCustomizable
}: ProductInfoProps) => {
  const router = useRouter();
  const { setSelectedVariation } = useDesignStore();
  const { addItemFromProductPage } = useCartStore();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<ApiProduct | null>(null);

  // Fetch product data when component mounts
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productData = await fetchProductById(productId);
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    
    loadProduct();
  }, [productId]);

  const handleStartDesign = async () => {
    let variationId: number | undefined;
    
    if (product && product.variations) {
      // Find matching variation based on selected size and color
      const matchingVariation = product.variations.find((v: any) => {
        const attrs = v.attributes;
        const sizeMatch = !selectedSize || attrs.size === selectedSize;
        const colorMatch = !selectedColor || attrs.color === selectedColor;
        return sizeMatch && colorMatch;
      });
      
      if (matchingVariation) {
        variationId = matchingVariation.id;
      }
    }
    
    // Set the selected variation in the design store with the actual variation ID
    setSelectedVariation({
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      variationId: variationId
    });
    
    // Navigate to design page with variation_id parameter
    const designUrl = variationId 
      ? `/products/${productId}/design?variation_id=${variationId}`
      : `/products/${productId}/design`;
    
    router.push(designUrl);
  };

  // Get the correct image based on selected variation
  const getProductImage = useMemo(() => {
    if (!product) return '';
    
    // If both size and color are selected, try to find matching variation
    if (selectedSize && selectedColor) {
      const matchingVariation = product.variations?.find((v: any) => 
        v.attributes.size === selectedSize && (v.attributes as any).color === selectedColor
      );
      if (matchingVariation && matchingVariation.media && matchingVariation.media.length > 0) {
        return matchingVariation.media[0].file_path;
      }
    }
    
    // If only size is selected, try to find matching variation
    if (selectedSize) {
      const matchingVariation = product.variations?.find((v: any) => 
        v.attributes.size === selectedSize
      );
      if (matchingVariation && matchingVariation.media && matchingVariation.media.length > 0) {
        return matchingVariation.media[0].file_path;
      }
    }
    
    // If only color is selected, try to find matching variation
    if (selectedColor) {
      const matchingVariation = product.variations?.find((v: any) => 
        (v.attributes as any).color === selectedColor
      );
      if (matchingVariation && matchingVariation.media && matchingVariation.media.length > 0) {
        return matchingVariation.media[0].file_path;
      }
    }
    
    // Fallback to product media
    if (product.media && product.media.length > 0) {
      // Try to find primary image first
      const primaryImage = product.media.find((m: any) => m.is_primary);
      if (primaryImage) {
        return primaryImage.file_path;
      }
      // Otherwise use first available image
      return product.media[0].file_path;
    }
    
    return '';
  }, [product, selectedSize, selectedColor]);

  const handleAddToCart = () => {
    // Parse price to number (remove $ sign)
    const numericPrice = parseFloat(price.replace('$', ''));
    
    addItemFromProductPage(
      productId,
      title,
      quantity,
      numericPrice,
      selectedSize || undefined,
      selectedColor || undefined,
      getProductImage
    );
    
    // Show beautiful toast notification
    showToast(
      `${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart successfully!`,
      'success',
      4000
    );
  };
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 mb-2">BY OFFICE SHOP BD</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-3xl font-bold text-blue-600">{price}</span>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-sm text-gray-500 ml-1">({reviewCount})</span>
          </div>
        </div>
      </div>

      {!isCustomizable && (
        <SizeSelector sizes={sizes} selectedSize={selectedSize} setSelectedSize={setSelectedSize} />
      )}
      <div className="mt-4">
        <ColorSelector selectedColor={selectedColor} setSelectedColor={setSelectedColor} colors={colors} />
      </div>
      {!isCustomizable && (
        <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
      )}

      {/* Options - Show short description from API */}
      {shortDescription && (
        <div className="text-sm text-gray-700">
          <div className="flex items-center space-x-2">
            {/* <div className="w-2 h-2 bg-blue-500 rounded-full"></div> */}
            <div dangerouslySetInnerHTML={{ __html: shortDescription }} />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-6">
        <Button variant="outline" className="flex-1 text-gray-900">
          <Heart className="w-4 h-4 mr-2" />
          REMOVE FAVOURITE
        </Button>
        {isCustomizable ? (
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handleStartDesign}
          >
            <Pencil className="w-4 h-4 mr-2" />
            START DESIGNING
          </Button>
        ) : (
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            ADD TO CART
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
