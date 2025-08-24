'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, ChevronLeft, ChevronRight, Loader2, Tag } from 'lucide-react';
import { fetchProductById, ApiProduct, calculateDiscount, DiscountResponse } from '@/services/api';
import { useDesignStore } from '@/store/designStore';
import { useCartStore } from '@/store/cartStore';
import { previewGenerator } from '@/utils/previewGenerator';
import SizeChartModal from '@/components/product/SizeChartModal';

interface QuantityPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    variation_id?: string;
  }>;
}

interface SizeQuantity {
  size: string;
  quantity: number;
  price: number;
}

export default function QuantityPage({ params, searchParams }: QuantityPageProps) {
  const router = useRouter();
  const { selectedVariation, loadDesign, setSelectedVariation, getCustomizationOptionId } = useDesignStore();
  const { addItemsFromQuantityPage, items: cartItems } = useCartStore();
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [sizeQuantities, setSizeQuantities] = useState<SizeQuantity[]>([]);
  const [productId, setProductId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [previewImages, setPreviewImages] = useState<{[key: string]: string}>({});
  const [availableViews, setAvailableViews] = useState<{area: string, image: string}[]>([]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<DiscountResponse | null>(null);
  const [isCalculatingDiscount, setIsCalculatingDiscount] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const unwrappedParams = await params;
        const unwrappedSearchParams = await searchParams;
        const productId = unwrappedParams.id;
        const urlVariationId = unwrappedSearchParams.variation_id;
        
        console.log('Quantity page - Loading product ID:', productId);
        console.log('Quantity page - URL variation_id:', urlVariationId);
        
        setProductId(productId);
        
        // Fetch product from API (same as design page)
        const product: ApiProduct = await fetchProductById(productId);
        
        if (product) {
          setCurrentProduct(product);
          
          // Get unique sizes from variations
          const uniqueSizes = new Set<string>();
          const sizeData: SizeQuantity[] = [];
          
          product.variations?.forEach((variation: any) => {
            if (variation.attributes?.size && !uniqueSizes.has(variation.attributes.size)) {
              uniqueSizes.add(variation.attributes.size);
              
              sizeData.push({
                size: variation.attributes.size,
                quantity: 0, // Always start with 0 quantity
                price: parseFloat(variation.price || product.base_price)
              });
            }
          });
          
          // Sort sizes in a logical order
          const sizeOrder = ['XS', 'S', 'Small', 'M', 'Medium', 'L', 'Large', 'XL', 'XXL', '2XL', '3XL', 'Universal'];
          sizeData.sort((a, b) => {
            const aIndex = sizeOrder.indexOf(a.size);
            const bIndex = sizeOrder.indexOf(b.size);
            if (aIndex === -1 && bIndex === -1) return a.size.localeCompare(b.size);
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          });
          
          setSizeQuantities(sizeData);
          
          // Extract available views from variations (same logic as design page)
          let currentVariation = null;
          
          // First priority: Use variation_id from URL if provided
          if (urlVariationId) {
            currentVariation = product.variations.find((v: any) => v.id.toString() === urlVariationId);
            console.log('Quantity page - Found variation by URL ID:', currentVariation);
          }
          
          // Second priority: If a specific variation is selected in store, look for that variation
          if (!currentVariation && selectedVariation && (selectedVariation.size || selectedVariation.color)) {
            currentVariation = product.variations.find((v: any) => {
              const attrs = v.attributes;
              const sizeMatch = !selectedVariation.size || attrs.size === selectedVariation.size;
              const colorMatch = !selectedVariation.color || attrs.color === selectedVariation.color;
              return sizeMatch && colorMatch;
            });
            console.log('Quantity page - Found variation by store selection:', currentVariation);
          }
          
          // Third priority: If no specific variation selected, use the first variation
          if (!currentVariation) {
            currentVariation = product.variations[0];
            console.log('Quantity page - Using first variation as fallback:', currentVariation);
          }
          
          // Always set the selected variation to ensure we have the correct variation ID
          if (currentVariation) {
            const newVariation = {
              size: currentVariation.attributes?.size,
              color: currentVariation.attributes?.color,
              variationId: currentVariation.id // Add the actual variation ID
            };
            
            // Only update if the variation has changed
            const hasChanged = !selectedVariation || 
              selectedVariation.size !== newVariation.size ||
              selectedVariation.color !== newVariation.color ||
              selectedVariation.variationId !== newVariation.variationId;
              
            if (hasChanged) {
              setSelectedVariation(newVariation);
              console.log('Quantity page - Set selected variation with ID:', currentVariation.id, newVariation);
            }
          }
          
          // Extract available views from the SELECTED variation's media where design: true
          const views: {area: string, image: string}[] = [];
          const areaMap = new Map<string, string>();
          
          // Collect design media only from the current selected variation
          if (currentVariation && currentVariation.media) {
            currentVariation.media.forEach((media: any) => {
              // Only include media where design is true and area exists
              if (media.design === true && media.area && media.file_path) {
                areaMap.set(media.area, media.file_path);
              }
            });
          }
          
          console.log('Found design areas for selected variation:', Array.from(areaMap.keys()));
          
          // Convert map to array and sort by common order
          const areaOrder = ['front', 'back', 'left', 'right'];
          areaOrder.forEach(area => {
            if (areaMap.has(area)) {
              views.push({ area, image: areaMap.get(area)! });
            }
          });
          
          // Add any other areas not in the standard order
          areaMap.forEach((image, area) => {
            if (!areaOrder.includes(area)) {
              views.push({ area, image });
            }
          });
          
          setAvailableViews(views);
          console.log('Available views:', views);
          
          if (views.length > 0) {
            // Generate preview images for all views
            await generatePreviewImages(unwrappedParams.id, views);
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params, searchParams, selectedVariation, cartItems]);

  // Calculate discount when quantities change
  useEffect(() => {
    const calculateDiscountForQuantity = async () => {
      const totalQuantity = getTotalQuantity();
      
      if (totalQuantity > 0 && currentProduct) {
        setIsCalculatingDiscount(true);
        try {
          const discount = await calculateDiscount(currentProduct.id, totalQuantity);
          setDiscountInfo(discount);
          console.log('Discount calculated:', discount);
        } catch (error) {
          console.error('Error calculating discount:', error);
          setDiscountInfo(null);
        } finally {
          setIsCalculatingDiscount(false);
        }
      } else {
        setDiscountInfo(null);
      }
    };

    // Debounce the discount calculation to avoid too many API calls
    const timeoutId = setTimeout(calculateDiscountForQuantity, 500);
    return () => clearTimeout(timeoutId);
  }, [sizeQuantities, currentProduct]);

  const generatePreviewImages = async (productId: string, views: {area: string, image: string}[]) => {
    setIsGeneratingPreviews(true);
    try {
      // Use the actual variation ID if available, otherwise fall back to string-based ID (same as design page)
      const variationId = selectedVariation?.variationId 
        ? selectedVariation.variationId.toString()
        : selectedVariation?.size || selectedVariation?.color || 'default';
      
      console.log('Using variation ID for preview generation:', variationId, 'from selectedVariation:', selectedVariation);
      
      const allPreviews = await previewGenerator.generatePreviewsForAllViews(
        productId,
        variationId,
        views,
        loadDesign
      );
      
      console.log('Generated previews:', allPreviews);
      setPreviewImages(allPreviews);
    } catch (error) {
      console.error('Error generating preview images:', error);
      // Fallback to original product images
      const fallbackPreviews: {[key: string]: string} = {};
      views.forEach(view => {
        fallbackPreviews[view.area] = view.image;
      });
      setPreviewImages(fallbackPreviews);
    } finally {
      setIsGeneratingPreviews(false);
    }
  };

  const getViewDisplayName = (area: string) => {
    const displayNames: { [key: string]: string } = {
      'front': 'Front',
      'back': 'Back',
      'left': 'Left',
      'right': 'Right'
    };
    return displayNames[area.toLowerCase()] || area.charAt(0).toUpperCase() + area.slice(1);
  };

  const nextImage = () => {
    setCurrentViewIndex((prev) => (prev + 1) % availableViews.length);
  };

  const prevImage = () => {
    setCurrentViewIndex((prev) => (prev - 1 + availableViews.length) % availableViews.length);
  };

  const getCurrentPreviewImage = () => {
    if (availableViews.length === 0) return '';
    const currentView = availableViews[currentViewIndex];
    return previewImages[currentView.area] || currentView.image;
  };

  const updateQuantity = (size: string, change: number) => {
    setSizeQuantities(prev => 
      prev.map(item => 
        item.size === size 
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      )
    );
  };

  const setQuantity = (size: string, quantity: number) => {
    setSizeQuantities(prev => 
      prev.map(item => 
        item.size === size 
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const getTotalQuantity = () => {
    return sizeQuantities.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return sizeQuantities.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const getDiscountedPrice = () => {
    const originalPrice = getTotalPrice();
    if (discountInfo && discountInfo.applicable) {
      return originalPrice - discountInfo.discount_amount;
    }
    return originalPrice;
  };

  const getUnitPrice = () => {
    const total = getTotalQuantity();
    if (total === 0) return 0;
    return getDiscountedPrice() / total;
  };

  const getDiscountAmount = () => {
    return discountInfo && discountInfo.applicable ? discountInfo.discount_amount : 0;
  };

  const getOriginalPrice = () => {
    return getTotalPrice();
  };

  const handleAddToCart = async () => {
    try {
      // Filter out items with 0 quantity
      const itemsToAdd = sizeQuantities.filter(sq => sq.quantity > 0);
      
      if (itemsToAdd.length === 0) {
        console.log('No items to add to cart');
        return;
      }
      
      // Get customization option ID if user is authenticated and has a design
      let customizationId: number | undefined = undefined;
      if (selectedVariation?.variationId) {
        try {
          // Try to get customization ID for the first available view (front view preferred)
          const primaryView = availableViews.find(v => v.area === 'front') || availableViews[0];
          if (primaryView) {
            customizationId = await getCustomizationOptionId(
              productId,
              selectedVariation.variationId,
              primaryView.area
            ) || undefined;
            console.log('Retrieved customization option ID for quantity page:', customizationId);
          }
        } catch (error) {
          console.error('Error getting customization option ID:', error);
        }
      }
      
      // Add items to cart with customization ID
      await addItemsFromQuantityPage(
        productId,
        currentProduct.name,
        itemsToAdd,
        customizationId // Use the fetched customization ID
      );
      
      console.log('Added to cart:', itemsToAdd);
      
      // Navigate to cart
      router.push('/cart');
    } catch (error) {
      console.error('Error adding items to cart:', error);
      // Show user-friendly error message
      alert('Unable to add items to cart. Please try again or reduce the number of items.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Product not found</div>
      </div>
    );
  }

  const totalQuantity = getTotalQuantity();
  const discountedPrice = getDiscountedPrice();
  const unitPrice = getUnitPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add quantity</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Product Image Slider */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
              {isGeneratingPreviews ? (
                <div className="aspect-square flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Generating preview...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Main Image */}
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-50">
                    {getCurrentPreviewImage() ? (
                      <img
                        src={getCurrentPreviewImage()}
                        alt={`${currentProduct.name} - ${availableViews[currentViewIndex]?.area || 'preview'}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No preview available
                      </div>
                    )}
                    
                    {/* Navigation Arrows */}
                    {availableViews.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* View Indicator */}
                  {availableViews.length > 0 && (
                    <div className="mt-4 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {getViewDisplayName(availableViews[currentViewIndex]?.area || '')}
                      </span>
                      <div className="flex justify-center mt-2 space-x-1">
                        {availableViews.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentViewIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                              index === currentViewIndex ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* View Thumbnails */}
            {availableViews.length > 1 && !isGeneratingPreviews && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {availableViews.map((view, index) => (
                  <button
                    key={view.area}
                    onClick={() => setCurrentViewIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === currentViewIndex 
                        ? 'border-blue-500 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={previewImages[view.area] || view.image}
                      alt={getViewDisplayName(view.area)}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Info and Sizes */}
          <div className="space-y-8">
            {/* Product Info */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentProduct.name}
              </h2>
              
              {/* Custom Design Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                  Custom Design Applied
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-600">
                    ৳{totalQuantity > 0 ? discountedPrice.toFixed(2) : '0.00'}
                  </span>
                  {totalQuantity > 0 && getDiscountAmount() > 0 && (
                    <span className="text-gray-500 text-lg line-through">
                      ৳{getOriginalPrice().toFixed(2)}
                    </span>
                  )}
                  {totalQuantity > 0 && (
                    <span className="text-gray-600 text-sm">
                      for {totalQuantity} units
                    </span>
                  )}
                </div>
                
                {/* Discount Information */}
                {totalQuantity > 0 && discountInfo && discountInfo.applicable && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <Tag className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-green-800">
                        {discountInfo.rule_name} - {discountInfo.discount_value}% off
                      </div>
                      <div className="text-xs text-green-600">
                        You save ৳{discountInfo.discount_amount.toFixed(2)} on {totalQuantity} units
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loading discount calculation */}
                {isCalculatingDiscount && totalQuantity > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-600">Calculating discount...</span>
                  </div>
                )}
                
                {totalQuantity > 0 && (
                  <div className="text-gray-600 text-base">
                    ৳{unitPrice.toFixed(2)} / unit
                  </div>
                )}
                <div className="text-gray-600 text-sm">No setup fee</div>
              </div>
            </div>

            {/* Size Selection */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-semibold text-gray-900">Select Quantities</h3>
                <button 
                  onClick={() => setIsSizeChartOpen(true)}
                  className="text-blue-600 hover:text-blue-700 underline text-sm font-medium cursor-pointer"
                >
                  See size chart
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {sizeQuantities.map((item) => (
                  <div key={item.size} className="border border-gray-200 rounded-lg p-2 hover:border-gray-300 transition-colors bg-white shadow-sm">
                    <div className="space-y-2">
                      {/* Size and Unit Price */}
                      <div className="text-center">
                        <label className="text-sm font-bold text-gray-900 block">
                          {item.size}
                        </label>
                        <span className="text-xs text-gray-600">
                          ৳{item.price.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-center">
                        <div className="flex items-center border border-gray-300 rounded-md bg-white shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.size, -1)}
                            className="p-1 hover:bg-gray-50 transition-colors rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 0}
                          >
                            <Minus className="w-3 h-3 text-gray-600" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => setQuantity(item.size, Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-12 px-1 py-1 border-0 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-none font-medium text-gray-700 text-sm"
                            min="0"
                            style={{ minWidth: '48px', maxWidth: '48px' }}
                          />
                          <button
                            onClick={() => updateQuantity(item.size, 1)}
                            className="p-1 hover:bg-gray-50 transition-colors rounded-r-md"
                          >
                            <Plus className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Total Price for this size */}
                      <div className="text-center">
                        <div className="text-xs font-bold text-blue-600">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Summary and Add to Cart */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky bottom-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                  <div className="text-3xl font-bold text-gray-900">
                    ৳{discountedPrice.toFixed(2)}
                  </div>
                  {totalQuantity > 0 && getDiscountAmount() > 0 && (
                    <div className="text-xl font-normal text-gray-500 line-through">
                      ৳{getOriginalPrice().toFixed(2)}
                    </div>
                  )}
                  {totalQuantity > 0 && (
                    <span className="text-lg font-normal text-gray-600">
                      for {totalQuantity} units
                    </span>
                  )}
                </div>
                
                {/* Discount badge in summary */}
                {totalQuantity > 0 && discountInfo && discountInfo.applicable && (
                  <div className="flex items-center gap-1 mt-1 justify-center sm:justify-start">
                    <Tag className="w-3 h-3 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      {discountInfo.discount_value}% off • Save ৳{discountInfo.discount_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="text-sm text-gray-600 mt-1">Shipping not included</div>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={totalQuantity === 0}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg ${
                  totalQuantity > 0
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white transform hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Size Chart Modal */}
      <SizeChartModal 
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
      />
    </div>
  );
}
