'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ArrowRight, X } from 'lucide-react';
import DesignCanvas from '@/components/design/DesignCanvas';
import LeftSidebar from '@/components/design/LeftSidebar';
import RightSidebar from '@/components/design/RightSidebar';
import { fetchProductById, ApiProduct } from '@/services/api';
import { useDesignStore } from '@/store/designStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useDesignSync } from '@/hooks/useDesignSync';
import { previewGenerator } from '@/utils/previewGenerator';
import { designApi } from '@/services/designApi';

interface DesignPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    variation_id?: string;
    option_id?: string;
    client_reference_id?: string;
  }>;
}

interface VariationAttributes {
  size: string;
  color?: string;
}

interface Variation {
  attributes: VariationAttributes;
  media: any[];
}

export default function DesignPage({ params, searchParams }: DesignPageProps) {
  const router = useRouter();
  
  // Helper function to format image URLs
  const formatImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '';
    
    console.log('Formatting image URL:', imageUrl);
    
    // If it's already a full URL or blob URL, return as is
    if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:')) {
      console.log('URL is already absolute or blob, returning as is:', imageUrl);
      return imageUrl;
    }
    
    // For uploads directory, check if file exists in frontend public directory first
    if (imageUrl.includes('/uploads/') || imageUrl.includes('uploads/')) {
      // Extract just the filename from the path
      const filename = imageUrl.split('/').pop();
      if (filename) {
        // Try to use the frontend's public directory first
        const frontendUrl = `/uploads/${filename}`;
        console.log('Converted uploads URL to frontend path:', frontendUrl);
        return frontendUrl;
      }
    }
    
    // If it's a relative URL that doesn't start with /, add the base path
    if (!imageUrl.startsWith('/')) {
      const formattedUrl = `/${imageUrl}`;
      console.log('Added leading slash to relative URL:', formattedUrl);
      return formattedUrl;
    }
    
    // Return the relative URL as is (will be served by Next.js from public directory)
    console.log('Returning relative URL as is:', imageUrl);
    return imageUrl;
  };
  const { 
    setDesignJson, 
    selectedObject, 
    selectedVariation, 
    setProductId, 
    setCurrentDesignArea,
    saveDesign,
    loadDesign,
    syncStatus,
    setSelectedVariation,
    getCustomizationOptionId
  } = useDesignStore();
  const { addItemFromProductPage } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { migrateLocalStorageToDatabase, clearLocalStorageDesigns } = useDesignStore();
  const { isAuthenticated: syncIsAuthenticated, pendingSyncsCount, manualSync } = useDesignSync();
  const [productImage, setProductImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('front');
  const [availableViews, setAvailableViews] = useState<{area: string, image: string}[]>([]);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewImages, setPreviewImages] = useState<{[key: string]: string}>({});
  const [previewActiveView, setPreviewActiveView] = useState('front');
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [productId, setProductIdState] = useState<string>('');
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewImages, setReviewImages] = useState<{[key: string]: string}>({});
  const [reviewActiveView, setReviewActiveView] = useState('front');
  const [reviewImageUrl, setReviewImageUrl] = useState<string>('');
  const [isReviewApproved, setIsReviewApproved] = useState(false);
  const [isGeneratingReviewPreviews, setIsGeneratingReviewPreviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingForOptionData, setIsWaitingForOptionData] = useState(false);
  const isWaitingForOptionDataRef = useRef(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const loadingStartTimeRef = useRef<number | null>(null);
  // ✅ NEW: Track loaded product to prevent unnecessary reloads
  const loadedProductIdRef = useRef<string | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  // ✅ FIXED: Consolidated single useEffect to monitor productImage and manage loading
  // Prevents circular dependencies and re-render loops
  useEffect(() => {
    console.log('productImage changed:', productImage);
    console.log('isLoading:', isLoading);

    // Only run validation if productImage exists and we're not loading
    if (productImage && productImage.trim() !== '') {
      // Test if the image can be loaded
      const img = new Image();
      img.onload = () => {
        console.log('✅ Product image loaded successfully:', productImage);
        // Clear loading state if still loading
        if (isLoading) {
          console.log('Clearing loading state as product image is loaded');
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            setLoadingTimeout(null);
          }
          setIsLoading(false);
        }
        // Clear any existing image load errors
        if (error && error.includes('Failed to load product image')) {
          setError(null);
        }
      };
      img.onerror = () => {
        console.error('❌ Failed to load product image:', productImage);
        // Only set error if this is a critical failure
        const errorTimeout = setTimeout(() => {
          setError('Failed to load product image. Please refresh the page and try again.');
          setIsLoading(false);
        }, 2000);
        return () => clearTimeout(errorTimeout);
      };
      img.src = productImage;
    }
  }, [productImage]);  // ✅ FIX: Only depend on productImage, not isLoading or error

  // ✅ FIXED: Simplified loading timeout with proper cleanup
  useEffect(() => {
    if (!isLoading) return;  // Early return if not loading

    // Set loading start time
    loadingStartTimeRef.current = Date.now();
    console.log('⏱️ Loading timeout started');

    const timeout = setTimeout(() => {
      const loadingDuration = Date.now() - (loadingStartTimeRef.current || Date.now());
      console.log(`⏱️ Loading timeout reached after ${loadingDuration}ms`);
      setError('Loading timeout. Please refresh the page and try again.');
      setIsLoading(false);
      loadingStartTimeRef.current = null;
    }, 30000); // 30 second timeout

    // Cleanup function
    return () => {
      clearTimeout(timeout);
      if (loadingStartTimeRef.current) {
        const loadingDuration = Date.now() - loadingStartTimeRef.current;
        console.log(`⏱️ Loading completed after ${loadingDuration}ms`);
        loadingStartTimeRef.current = null;
      }
    };
  }, [isLoading]);

  // Handle automatic migration when user logs in
  useEffect(() => {
    const handleMigration = async () => {
      if (isAuthenticated) {
        try {
          console.log('User is authenticated, checking for localStorage designs to migrate...');
          await migrateLocalStorageToDatabase();
          // Clear localStorage after successful migration
          clearLocalStorageDesigns();
          console.log('Migration completed and localStorage cleared');
        } catch (error) {
          console.error('Migration failed:', error);
        }
      }
    };

    handleMigration();
  }, [isAuthenticated, migrateLocalStorageToDatabase, clearLocalStorageDesigns]);

  // Handle loading existing customization options by client_reference_id
  useEffect(() => {
    (async () => {
      try {
        const unwrappedSearchParams = await searchParams;
        const clientReferenceId = unwrappedSearchParams.client_reference_id;
        
        if (clientReferenceId && isAuthenticated && fabricCanvas && currentProduct) {
          console.log('Loading customization options by client_reference_id:', clientReferenceId);
          
          try {
            const customizationOptions = await designApi.getCustomizationOptionsByClientReferenceId(clientReferenceId);
            console.log('Loaded customization options:', customizationOptions);
            
            if (customizationOptions.length > 0) {
              const firstOption = customizationOptions[0];
              
              // Set the variation from the first customization option if available
              if (firstOption.variation_id) {
                console.log('Setting variation from client_reference_id options:', firstOption.variation_id);
                // Find the variation in the current product
                if (currentProduct && currentProduct.variations) {
                  const foundVariation = currentProduct.variations.find((v: any) => 
                    v.id === firstOption.variation_id
                  );
                  if (foundVariation) {
                    const newVariation = {
                      size: foundVariation.attributes?.size,
                      color: foundVariation.attributes?.color,
                      variationId: foundVariation.id
                    };
                    setSelectedVariation(newVariation);
                    console.log('Set variation from client_reference_id:', newVariation);
                    
                    // Complete the product setup with all available design areas
                    if (isWaitingForOptionData) {
                      console.log('Client reference data loaded, completing product setup...');
                      setIsWaitingForOptionData(false);
                      isWaitingForOptionDataRef.current = false;
                      
                      // Set up views and product image based on the correct variation
                      const views: {area: string, image: string}[] = [];
                      const areaMap = new Map<string, string>();
                      
                      // Collect design media from the correct variation
                      if (foundVariation && foundVariation.media) {
                        foundVariation.media.forEach((media: any) => {
                          if (media.design === true && media.area && media.file_path) {
                            areaMap.set(media.area, media.file_path);
                          }
                        });
                      }
                      
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
                      console.log('Set available views from client_reference_id:', views);
                      
                      // Set the first available design area as active
                      const availableAreas = customizationOptions.map(opt => 
                        opt.design_area || opt.option_data?.design_area
                      ).filter(Boolean);
                      
                      const firstArea = availableAreas[0] || 'front';
                      const selectedView = views.find(view => view.area === firstArea);
                      if (selectedView) {
                        // Ensure the image URL is properly formatted
                        const imageUrl = formatImageUrl(selectedView.image);
                        
                        setActiveView(firstArea);
                        setCurrentDesignArea(firstArea);
                        setProductImage(imageUrl);
                        console.log('Set active view from client_reference_id:', firstArea, imageUrl);
                      } else if (views.length > 0) {
                        // Ensure the image URL is properly formatted
                        const imageUrl = formatImageUrl(views[0].image);
                        
                        setActiveView(views[0].area);
                        setCurrentDesignArea(views[0].area);
                        setProductImage(imageUrl);
                        console.log('Set fallback active view from client_reference_id:', views[0].area, imageUrl);
                      }
                      
                      // Clear timeout and set loading to false
                      if (loadingTimeout) {
                        clearTimeout(loadingTimeout);
                        setLoadingTimeout(null);
                      }
                      setIsLoading(false);
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error loading customization options by client_reference_id:', error);
            // Don't set error here as it might be a non-critical error
          }
        }
      } catch (error) {
        console.error('Error in client_reference_id loading effect:', error);
        // Don't set error here as it might be a non-critical error
      }
    })();
  }, [searchParams, isAuthenticated, fabricCanvas, currentProduct, isWaitingForOptionData]);

  // Handle loading existing customization option from dashboard (backward compatibility)
  useEffect(() => {
    (async () => {
      try {
        const unwrappedSearchParams = await searchParams;
        const optionId = unwrappedSearchParams.option_id;
        const clientReferenceId = unwrappedSearchParams.client_reference_id;
        
        // Only handle option_id if client_reference_id is not present
        if (optionId && !clientReferenceId && isAuthenticated && fabricCanvas && currentProduct) {
          console.log('Loading existing customization option:', optionId);
          
          // Add a delay and proper canvas readiness check
          const loadCustomizationOption = async () => {
            let retryCount = 0;
            const maxRetries = 10;
            
            const attemptLoad = async () => {
              try {
                // Check if canvas is properly initialized by testing basic properties
                if (!fabricCanvas || !fabricCanvas.width || !fabricCanvas.height) {
                  if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Canvas not ready, retry ${retryCount}/${maxRetries}`);
                    setTimeout(attemptLoad, 200 * retryCount); // Increasing delay
                    return;
                  } else {
                    console.warn('Canvas not ready after max retries, skipping load');
                    return;
                  }
                }
                
                // Test if canvas methods are available without calling them
                if (typeof fabricCanvas.getWidth !== 'function' || 
                    typeof fabricCanvas.getHeight !== 'function' ||
                    typeof fabricCanvas.loadFromJSON !== 'function') {
                  if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Canvas methods not ready, retry ${retryCount}/${maxRetries}`);
                    setTimeout(attemptLoad, 200 * retryCount);
                    return;
                  } else {
                    console.warn('Canvas methods not ready after max retries, skipping load');
                    return;
                  }
                }
                
                const customizationOption = await designApi.getCustomizationOption(parseInt(optionId));
                console.log('Loaded customization option:', customizationOption);
                
                if (customizationOption && customizationOption.canvas_data) {
                  // Set the variation from the customization option if available
                  if (customizationOption.variation_id) {
                    console.log('Setting variation from customization option:', customizationOption.variation_id);
                    // Find the variation in the current product
                    if (currentProduct && currentProduct.variations) {
                      const foundVariation = currentProduct.variations.find((v: any) => 
                        v.id === customizationOption.variation_id
                      );
                      if (foundVariation) {
                        const newVariation = {
                          size: foundVariation.attributes?.size,
                          color: foundVariation.attributes?.color,
                          variationId: foundVariation.id
                        };
                        setSelectedVariation(newVariation);
                        console.log('Set variation from customization option:', newVariation);
                        
                        // Now that we have the variation from option data, complete the product setup
                        if (isWaitingForOptionData) {
                          console.log('Option data loaded, completing product setup...');
                          setIsWaitingForOptionData(false);
                          isWaitingForOptionDataRef.current = false;
                          
                          // Set up views and product image based on the correct variation
                          const views: {area: string, image: string}[] = [];
                          const areaMap = new Map<string, string>();
                          
                          // Collect design media from the correct variation
                          if (foundVariation && foundVariation.media) {
                            foundVariation.media.forEach((media: any) => {
                              if (media.design === true && media.area && media.file_path) {
                                areaMap.set(media.area, media.file_path);
                              }
                            });
                          }
                          
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
                          console.log('Set available views from option data:', views);
                          
                          // Set the design area and product image
                          const designArea = customizationOption.design_area || 'front';
                          const selectedView = views.find(view => view.area === designArea);
                          if (selectedView) {
                            setProductImage(selectedView.image);
                            console.log('Set product image from option data:', selectedView.image);
                          } else if (views.length > 0) {
                            setProductImage(views[0].image);
                            console.log('Set fallback product image from option data:', views[0].image);
                          }
                          
                          // Clear timeout and set loading to false
                          if (loadingTimeout) {
                            clearTimeout(loadingTimeout);
                            setLoadingTimeout(null);
                          }
                          setIsLoading(false);
                        }
                      }
                    }
                  }
                  
                  // Set the design area from the customization option
                  const designArea = customizationOption.design_area || 'front';
                  setActiveView(designArea);
                  setCurrentDesignArea(designArea);
                  
                  // Skip canvas loading from customization option to prevent fabric.js errors
                  // The canvas will be loaded by the DesignCanvas component's useEffect
                  console.log('Customization option loaded, canvas will be handled by DesignCanvas component');
                  
                  // Don't override product image - keep the one from product data
                }
              } catch (error) {
                console.error('Error loading customization option:', error);
                // Don't set error here as it might be a non-critical error
              }
            };
            
            // Start the loading attempt
            setTimeout(attemptLoad, 300); // Initial delay
          };
          
          loadCustomizationOption();
        }
      } catch (error) {
        console.error('Error in option loading effect:', error);
      }
    })();
  }, [searchParams, isAuthenticated, fabricCanvas, currentProduct, isWaitingForOptionData]);

  // Set waiting flag synchronously based on URL params
  useEffect(() => {
    (async () => {
      const unwrappedSearchParams = await searchParams;
      const urlVariationId = unwrappedSearchParams.variation_id;
      const optionId = unwrappedSearchParams.option_id;
      const clientReferenceId = unwrappedSearchParams.client_reference_id;
      
      // If coming from project page (option_id or client_reference_id present), set waiting flag
      if ((optionId || clientReferenceId) && !urlVariationId) {
        setIsWaitingForOptionData(true);
        isWaitingForOptionDataRef.current = true;
        console.log('Coming from project page, waiting for option data before setting variation');
      } else {
        setIsWaitingForOptionData(false);
        isWaitingForOptionDataRef.current = false;
      }
    })();
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const unwrappedParams = await params;
        const unwrappedSearchParams = await searchParams;
        const productId = unwrappedParams.id;
        const urlVariationId = unwrappedSearchParams.variation_id;
        const optionId = unwrappedSearchParams.option_id;

        console.log('Loading product ID:', productId);
        console.log('URL variation_id:', urlVariationId);
        console.log('URL option_id:', optionId);
        console.log('isWaitingForOptionData:', isWaitingForOptionData);

        // ✅ FIX: Skip if already loaded this product (prevent re-render loops)
        if (loadedProductIdRef.current === productId && currentProduct) {
          console.log('✅ Product already loaded, skipping reload');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        loadedProductIdRef.current = productId;  // Mark as loading

        // Fetch product from API
        const product: ApiProduct = await fetchProductById(productId);
        console.log('Found product:', product);
        console.log('Product ID:', product.id);
        console.log('Product name:', product.name);
        console.log('Product variations count:', product.variations?.length || 0);
        console.log('Product media count:', product.media?.length || 0);
        console.log('Product is_customizable:', product.is_customizable);
        
        // Validate that we have a product
        if (!product) {
          throw new Error('Product not found');
        }
        
        // Set product ID in store for auto-save functionality
        setProductId(unwrappedParams.id);
        setProductIdState(unwrappedParams.id);
        
        setCurrentProduct(product);
        
        let designImageFound = false;
        let currentVariation = null;
        
        if (product && product.variations) {
          console.log('Product has variations:', product.variations.length);
          console.log('Selected variation:', selectedVariation);
          
          // First priority: Use variation_id from URL if provided
          if (urlVariationId) {
            currentVariation = product.variations.find((v: any) => v.id.toString() === urlVariationId);
            console.log('Found variation by URL ID:', currentVariation);
          }
          
          // Second priority: If a specific variation is selected in store, look for that variation
          if (!currentVariation && selectedVariation && (selectedVariation.size || selectedVariation.color)) {
            currentVariation = product.variations.find((v: any) => {
              const attrs = v.attributes as VariationAttributes;
              const sizeMatch = !selectedVariation.size || attrs.size === selectedVariation.size;
              const colorMatch = !selectedVariation.color || attrs.color === selectedVariation.color;
              return sizeMatch && colorMatch;
            });
            console.log('Found variation by store selection:', currentVariation);
          }
          
          // Third priority: Only use fallback if NOT waiting for option data
          if (!currentVariation && !isWaitingForOptionDataRef.current) {
            currentVariation = product.variations[0];
            console.log('Using first variation as fallback:', currentVariation);
          } else if (!currentVariation && isWaitingForOptionDataRef.current) {
            console.log('Skipping fallback variation, waiting for option data to load');
            // Don't set any variation yet, but continue with product setup
            // We'll set a temporary variation for product setup, but won't set selectedVariation
            currentVariation = product.variations[0]; // Temporary for product setup only
            console.log('Using temporary variation for product setup while waiting for option data');
          }
          
          // Only set the selected variation if NOT waiting for option data
          if (currentVariation && !isWaitingForOptionDataRef.current) {
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
              console.log('Set selected variation with ID:', currentVariation.id, newVariation);
            }
          } else if (isWaitingForOptionDataRef.current) {
            console.log('Skipping selectedVariation update, waiting for option data');
          }
          
          // Extract available views from the SELECTED variation's media where design: true
          const views: {area: string, image: string}[] = [];
          const areaMap = new Map<string, string>();
          
          // Collect design media only from the current selected variation
          if (currentVariation && currentVariation.media) {
            console.log('Current variation media:', currentVariation.media);
            currentVariation.media.forEach((media: any) => {
              // Only include media where design is true and area exists
              if (media.design === true && media.area && media.file_path) {
                areaMap.set(media.area, media.file_path);
                console.log('Found design media:', media.area, media.file_path);
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
          
          // Set the first available view as active, or default to 'front'
          if (views.length > 0) {
            setActiveView(views[0].area);
            setCurrentDesignArea(views[0].area); // Set initial design area in store
            
            // Ensure the image URL is properly formatted
            const imageUrl = formatImageUrl(views[0].image);
            setProductImage(imageUrl);
            designImageFound = true;
            console.log('Set initial product image:', imageUrl);
          }
          
          // If no design media found for active view, fall back to any design media
          if (!designImageFound && currentVariation && currentVariation.media) {
            const designMedia = currentVariation.media.find((m: any) => m.design === true);
            if (designMedia) {
              console.log('Found design media (fallback):', designMedia);
              
              // Ensure the image URL is properly formatted
              const imageUrl = formatImageUrl(designMedia.file_path);
              setProductImage(imageUrl);
              designImageFound = true;
              console.log('Set fallback product image:', imageUrl);
            }
          }
        }
        
        // If no variations or no design media found in variations, try product media as fallback
        if (!designImageFound && product && product.media && product.media.length > 0) {
          console.log('No variations or design media found, using product media as fallback');
          console.log('Product media:', product.media);
          
          // Create a simple view using the first product media
          const firstMedia = product.media[0];
          if (firstMedia && firstMedia.file_path) {
            // Ensure the image URL is properly formatted
            const imageUrl = formatImageUrl(firstMedia.file_path);
            
            const views: {area: string, image: string}[] = [
              { area: 'front', image: imageUrl }
            ];
            
            setAvailableViews(views);
            setActiveView('front');
            setCurrentDesignArea('front');
            setProductImage(imageUrl);
            designImageFound = true;
            
            console.log('Set fallback product image from product media:', imageUrl);
          }
        }
        
        if (!designImageFound) {
          console.log('No design media found for product');
          console.log('Product variations:', product?.variations);
          console.log('Product media:', product?.media);
          setProductImage('');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setError('Failed to load product. Please try again.');
      } finally {
        console.log('Setting isLoading to false');
        console.log('Final productImage state:', productImage);
        console.log('Final error state:', error);
        
        // Clear any existing timeout
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          setLoadingTimeout(null);
        }
        
        setIsLoading(false);
      }
    })();
  }, [params, searchParams]);

  const handleAddText = (text: string) => {
    setDesignJson({
      type: 'text',
      content: text,
      position: { x: 50, y: 50 },
      style: {
        fontSize: 40,
        color: '#000000'
      }
    });
  };

  const handleDesignColor = (color: string) => {
    setDesignJson({
      type: 'color',
      color: color,
      timestamp: Date.now()
    });
  };

  const handleImageUpload = (fileOrUrl: File | string) => {
    const isServerUrl = typeof fileOrUrl === 'string';
    console.log('🖼️ handleImageUpload called with:', isServerUrl ? 'SERVER URL' : 'FILE object');
    console.log('🖼️ Value:', isServerUrl ? fileOrUrl : fileOrUrl.name);

    // ✅ CRITICAL FIX: NEVER create blob URLs - only accept server URLs
    // LeftSidebar already handles upload and returns server URL
    if (!isServerUrl) {
      console.error('❌ ERROR: File object passed instead of server URL! This should not happen.');
      console.error('❌ LeftSidebar should upload first and pass server URL');
      alert('Error: Image must be uploaded first. Please try again.');
      return;
    }

    const imageUrl = fileOrUrl;  // Already a server URL
    console.log('✅ Adding to canvas with SERVER URL:', imageUrl);

    // Add image to canvas automatically
    setDesignJson({
      type: 'image',
      content: imageUrl,
      position: { x: 50, y: 50 }
    });
  };

  const handleImageClick = (imageUrl: string) => {
    // Add image to canvas when clicked
    setDesignJson({
      type: 'image',
      content: imageUrl,
      position: { x: 50, y: 50 }
    });
  };

  const handleSave = async () => {
    try {
      if (fabricCanvas) {
        const canvasData = fabricCanvas.toJSON();
        if (canvasData.objects && canvasData.objects.length > 0) {
          const currentViewImage = availableViews.find(v => v.area === activeView)?.image || '';
          
          console.log('💾 SAVE: Saving custom design with preview image...');
          
          // Generate and save preview image for current view only when there's custom content
          let previewImageUrl: string | undefined;
          if (isAuthenticated && selectedVariation?.variationId) {
            try {
              console.log('💾 Generating preview image for Save button...');
              previewImageUrl = await previewGenerator.generatePreview(
                canvasData,
                currentViewImage,
                { quality: 1, multiplier: 2 }
              );
              console.log('💾 Preview image generated for Save button');
            } catch (error) {
              console.error('Error generating preview image for Save:', error);
              // Continue without preview image
            }
          }
          
          await saveDesign(canvasData, currentViewImage, previewImageUrl);
          console.log('💾 Custom design saved manually via Save button', previewImageUrl ? 'with preview image' : 'without preview image');
          
          // Show success feedback
          // You could add a toast notification here if needed
        } else {
          console.log('💾 No design elements to save');
        }
      }
    } catch (error) {
      console.error('Error saving design manually:', error);
      // You could add error feedback here if needed
    }
  };

  const handleTextFormat = (format: string) => {
    setDesignJson({
      type: 'format',
      format,
      timestamp: Date.now()
    });
  };

  const handlePosition = (position: string) => {
    setDesignJson({
      type: 'position',
      position,
      timestamp: Date.now()
    });
  };

  const handleClearCanvas = () => {
    setDesignJson({
      type: 'clear',
      timestamp: Date.now()
    });
  };

  const handleTextColorChange = (color: string) => {
    setDesignJson({
      type: 'textColor',
      color: color,
      timestamp: Date.now()
    });
  };

  const handleFontChange = (font: string) => {
    setDesignJson({
      type: 'fontFamily',
      fontFamily: font,
      timestamp: Date.now()
    });
  };

  const handleFontSizeChange = (size: number) => {
    setDesignJson({
      type: 'fontSize',
      fontSize: size,
      timestamp: Date.now()
    });
  };

  const handleLayer = (action: string) => {
    if (action === 'delete') {
      setDesignJson({
        type: 'delete',
        timestamp: Date.now()
      });
    } else if (action === 'duplicate') {
      setDesignJson({
        type: 'duplicate',
        timestamp: Date.now()
      });
    } else if (action === 'bringToFront') {
      setDesignJson({
        type: 'bringToFront',
        timestamp: Date.now()
      });
    } else if (action === 'bringForward') {
      setDesignJson({
        type: 'bringForward',
        timestamp: Date.now()
      });
    } else if (action === 'sendBackward') {
      setDesignJson({
        type: 'sendBackward',
        timestamp: Date.now()
      });
    } else if (action === 'sendToBack') {
      setDesignJson({
        type: 'sendToBack',
        timestamp: Date.now()
      });
    }
  };

  const handleImageAction = (action: string) => {
    console.log('Image action:', action);
    setDesignJson({
      type: 'imageAction',
      action: action,
      timestamp: Date.now()
    });
  };

  const handleImageAdjust = (property: string, value: number) => {
    console.log('Image adjust:', property, value);
    setDesignJson({
      type: 'imageAdjust',
      property: property,
      value: value,
      timestamp: Date.now()
    });
  };

  const handleViewChange = async (area: string) => {
    if (area === activeView) return;

    try {
      // Save current view's design before switching
      if (fabricCanvas && activeView) {
        try {
          const canvasData = fabricCanvas.toJSON();
          if (canvasData && canvasData.objects && canvasData.objects.length > 0) {
            const currentViewImage = availableViews.find(v => v.area === activeView)?.image || '';
            await saveDesign(canvasData, currentViewImage);
            console.log('Saved design for view:', activeView);
          }
        } catch (error) {
          console.error('Error saving design for view change:', error);
        }
      }
      
      // Update active view
      setActiveView(area);
      setCurrentDesignArea(area);
      
      // Update product image
      const selectedView = availableViews.find(view => view.area === area);
      if (selectedView) {
        console.log('Switching to view:', area, 'with image:', selectedView.image);
        setProductImage(selectedView.image);
      }
      
      // Load design for the new view
      if (productId && selectedVariation) {
        setTimeout(async () => {
          try {
            // Use the actual variation ID if available, otherwise fall back to string-based ID
            const variationId = selectedVariation?.variationId 
              ? selectedVariation.variationId.toString()
              : selectedVariation?.size || selectedVariation?.color || 'default';
            
            console.log('Loading design for view change with variation ID:', variationId);
            const designData = await loadDesign(productId, variationId, area);
            
            if (designData && designData.canvas_data && fabricCanvas) {
              try {
                // Add comprehensive safety checks before calling loadFromJSON
                try {
                  // Test if canvas is ready for loadFromJSON operations
                  const canvasObjects = fabricCanvas.getObjects();
                  const canvasWidth = fabricCanvas.getWidth();
                  const canvasHeight = fabricCanvas.getHeight();
                  
                  // Use direct fabric.js loadFromJSON for view change
                  try {
                    fabricCanvas.loadFromJSON(designData.canvas_data, () => {
                      try {
                        fabricCanvas.renderAll();
                        console.log('Loaded design for view:', area);
                      } catch (renderError) {
                        console.error('Error rendering after view change load:', renderError);
                      }
                    });
                  } catch (loadError) {
                    console.error('Error loading design for view change:', loadError);
                    // Clear canvas if loading failed
                    try {
                      fabricCanvas.clear();
                      fabricCanvas.renderAll();
                    } catch (clearError) {
                      console.error('Error clearing canvas after failed load:', clearError);
                    }
                  }
                } catch (canvasTestError) {
                  console.error('Canvas test failed in view change:', canvasTestError);
                  // Try to clear canvas safely
                  try {
                    const testWidth = fabricCanvas.getWidth();
                    const testHeight = fabricCanvas.getHeight();
                    if (testWidth > 0 && testHeight > 0) {
                      fabricCanvas.clear();
                      fabricCanvas.renderAll();
                    }
                  } catch (clearError) {
                    console.warn('Cannot clear canvas in view change:', clearError);
                  }
                }
              } catch (loadError) {
                console.error('Error calling loadFromJSON for view change:', loadError);
                // Clear canvas on error
                try {
                  const testWidth = fabricCanvas.getWidth();
                  const testHeight = fabricCanvas.getHeight();
                  if (testWidth > 0 && testHeight > 0) {
                    fabricCanvas.clear();
                    fabricCanvas.renderAll();
                  }
                } catch (clearError) {
                  console.error('Error clearing canvas after view change load failure:', clearError);
                }
              }
            } else {
              console.log('No design data for view:', area);
              // Clear canvas when switching to a view with no saved design
              if (fabricCanvas) {
                try {
                  // Test if canvas methods are available before calling them
                  const testWidth = fabricCanvas.getWidth();
                  const testHeight = fabricCanvas.getHeight();
                  if (testWidth > 0 && testHeight > 0) {
                    fabricCanvas.clear();
                    fabricCanvas.renderAll();
                  }
                } catch (clearError) {
                  console.warn('Cannot clear canvas, methods not ready:', clearError);
                }
              }
            }
          } catch (error) {
            console.error('Error loading design for new view:', error);
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('Error in view change:', error);
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

  const handleCanvasReady = (canvas: any) => {
    console.log('Canvas ready callback triggered');
    
    // Ensure canvas is properly initialized before setting it
    if (canvas && canvas.width && canvas.height && canvas.width > 0 && canvas.height > 0) {
      try {
        // Test if we can safely call basic canvas methods
        const testWidth = canvas.getWidth();
        const testHeight = canvas.getHeight();
        
        if (testWidth > 0 && testHeight > 0) {
          setFabricCanvas(canvas);
          console.log('Canvas set and ready for use');
          return;
        }
      } catch (methodError) {
        console.log('Canvas methods not ready yet in handleCanvasReady, retrying...');
      }
      
      // Retry after a short delay
      setTimeout(() => {
        try {
          const testWidth = canvas.getWidth();
          const testHeight = canvas.getHeight();
          
          if (testWidth > 0 && testHeight > 0) {
            setFabricCanvas(canvas);
            console.log('Canvas set after retry');
          } else {
            console.error('Canvas still not ready after retry');
          }
        } catch (retryError) {
          console.error('Canvas still not ready after retry:', retryError);
        }
      }, 100);
    } else {
      console.warn('Canvas not properly initialized in ready callback');
    }
  };

// const designCanvasRef = useRef<any>(null);

// <DesignCanvas
//   ref={designCanvasRef}
//   productImage={productImage}
//   onCanvasReady={(canvas) => console.log('Canvas ready')}
// />

// // When generating preview:
// const handlePreview = () => {
//   const canvas = designCanvasRef.current?.getFabricCanvas();
//   if (!canvas) return;

//   const previewDataUrl = canvas.toDataURL({
//     format: 'png',
//     quality: 1,
//   });

//   console.log('Preview generated:', previewDataUrl);
// };


// const fabricCanvasRef = useRef<any>(null);

// <DesignCanvas
//   ref={fabricCanvasRef}   // optional if using imperative handle
//   productImage={productImage}
//   view={activeView}       // required prop
//   onCanvasReady={(canvas) => {
//     console.log('Canvas ready', canvas);
//     fabricCanvasRef.current = canvas; // <- THIS is crucial
//   }}
// />




// const handlePreview = async () => {
//   setIsGeneratingPreviews(true);

//   try {
//     if (fabricCanvas) {
//       const designPreview = fabricCanvas.toDataURL({
//         format: "png",
//         quality: 1,
//         multiplier: 2,
//       });

//       // if (designPreview) {
//       //   // ✅ store this instead of variation.image
//       //   savePreviewForCartAndAdmin(designPreview);
//       // }
//     }
//   } catch (err) {
//     console.error("Error generating preview:", err);
//   } finally {
//     setIsGeneratingPreviews(false);
//   }

const [isCanvasReady, setIsCanvasReady] = useState(false);

useEffect(() => {
  if (fabricCanvas) {
    fabricCanvas.on('after:render', () => {
      setIsCanvasReady(true);
    });
  }
}, [fabricCanvas]);


const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
const handlePreview = async () => {
  setIsGeneratingPreviews(true);

  try {
    console.log('Preview clicked, generating previews for all views...');

    // 1️⃣ Save current canvas design
    if (fabricCanvas) {
      try {
        const canvasData = fabricCanvas.toJSON();
        if (canvasData.objects && canvasData.objects.length > 0) {
          const currentViewImage = availableViews.find(v => v.area === activeView)?.image || '';
          await saveDesign(canvasData, currentViewImage);
          console.log('Saved current design for view:', activeView);
        }
      } catch (error) {
        console.error('Error saving canvas data for preview:', error);
      }
    }

    // 2️⃣ Generate previews for all views
    const variationId = selectedVariation?.variationId?.toString() || selectedVariation?.size || selectedVariation?.color || 'default';
    console.log('Using variation ID for preview:', variationId);

    const allPreviews = await previewGenerator.generatePreviewsForAllViews(
      productId.toString(),
      variationId,
      availableViews,
      loadDesign // this must return saved canvas_data for product + variation + view
    );

    console.log('Generated previews:', allPreviews);

    // 3️⃣ Set preview images state
    setPreviewImages(allPreviews);

    // 4️⃣ Set current preview image and active view
    const currentPreviewUrl = allPreviews[activeView];
    setPreviewImageUrl(currentPreviewUrl || '');
    setPreviewActiveView(activeView);

  } catch (error) {
    console.error('Error generating previews:', error);
    setPreviewImageUrl('');
  } finally {
    setIsGeneratingPreviews(false);
    setShowPreviewModal(true);
  }
};










  // For Next button / review previews
const handleNext = async () => {
  if (!fabricCanvas) return;

  setIsGeneratingReviewPreviews(true);

  try {
    console.log('🔹 Next clicked, generating review previews...');

    const canvasData = fabricCanvas.toJSON();
    const variationId = selectedVariation?.variationId?.toString();
    if (!variationId) throw new Error('Variation not selected');

    const currentViewImage = availableViews.find(v => v.area === activeView)?.image || '';
    await saveDesign(canvasData, currentViewImage);

    console.log('✅ Current design saved, generating review previews...');

    const allReviewPreviews = await previewGenerator.generatePreviewsForAllViews(
      productId,
      variationId,
      availableViews,
      loadDesign
    );

    console.log('✅ Review previews generated:', allReviewPreviews);

    setReviewImages(allReviewPreviews);
    setReviewImageUrl(allReviewPreviews[activeView] || '');
    setReviewActiveView(activeView);
    setShowReviewModal(true);

  } catch (error) {
    console.error('❌ Error generating review previews:', error);
    setReviewImageUrl('');
    setShowReviewModal(true);
  } finally {
    setIsGeneratingReviewPreviews(false);
  }
};
  const closePreviewModal = () => {
    setShowPreviewModal(false);
  };

  // Handle switching preview views
const handlePreviewViewChange = async (area: string) => {
  setPreviewActiveView(area);

  if (previewImages[area]) {
    setPreviewImageUrl(previewImages[area]);
    return;
  }

  try {
    const variationId = selectedVariation?.variationId?.toString();
    if (!variationId) return;

    const viewData = availableViews.find(v => v.area === area);
    if (!viewData) return;

    const savedDesign = await loadDesign(productId, variationId, area);
    if (!savedDesign?.canvas_data?.objects?.length) {
      console.warn('No canvas objects for preview:', area);
      setPreviewImageUrl(viewData.image);
      return;
    }

    const previewUrl = await previewGenerator.generatePreview(
      savedDesign.canvas_data,
      viewData.image,
      { quality: 1, multiplier: 2 }
    );

    setPreviewImages(prev => ({ ...prev, [area]: previewUrl }));
    setPreviewImageUrl(previewUrl);

  } catch (error) {
    console.error('❌ Error generating preview on demand:', error);
    const viewData = availableViews.find(v => v.area === area);
    setPreviewImageUrl(viewData?.image || '');
  }
};

  // Same logic for review modal
const handleReviewViewChange = async (area: string) => {
  setReviewActiveView(area);

  if (reviewImages[area]) {
    setReviewImageUrl(reviewImages[area]);
    return;
  }

  try {
    const variationId = selectedVariation?.variationId?.toString();
    if (!variationId) return;

    const viewData = availableViews.find(v => v.area === area);
    if (!viewData) return;

    const savedDesign = await loadDesign(productId, variationId, area);
    if (!savedDesign?.canvas_data?.objects?.length) {
      console.warn('No canvas objects for review preview:', area);
      setReviewImageUrl(viewData.image);
      return;
    }

    const reviewUrl = await previewGenerator.generatePreview(
      savedDesign.canvas_data,
      viewData.image,
      { quality: 1, multiplier: 2 }
    );

    setReviewImages(prev => ({ ...prev, [area]: reviewUrl }));
    setReviewImageUrl(reviewUrl);

  } catch (error) {
    console.error('❌ Error generating review preview on demand:', error);
    const viewData = availableViews.find(v => v.area === area);
    setReviewImageUrl(viewData?.image || '');
  }
};

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setIsReviewApproved(false);
  };

  const handleEditMyDesign = () => {
    setShowReviewModal(false);
  };

  const handleContinue = async () => {
    if (isReviewApproved) {
      const unwrappedParams = await params;
      
      // Check if the current product variation has size options
      let currentVariation = null;
      if (currentProduct && currentProduct.variations) {
        if (selectedVariation && (selectedVariation.size || selectedVariation.color)) {
          currentVariation = currentProduct.variations.find((v: any) => {
            const attrs = v.attributes as VariationAttributes;
            const sizeMatch = !selectedVariation.size || attrs.size === selectedVariation.size;
            const colorMatch = !selectedVariation.color || attrs.color === selectedVariation.color;
            return sizeMatch && colorMatch;
          });
        }
        
        if (!currentVariation) {
          currentVariation = currentProduct.variations[0];
        }
      }
      
      // Check if any variation has size attribute
      const hasSize = currentProduct?.variations?.some((variation: any) => 
        variation.attributes && variation.attributes.size
      );
      
      if (hasSize) {
        // Redirect to quantity page if product has size variations with variation_id parameter
        const quantityUrl = selectedVariation?.variationId 
          ? `/products/${unwrappedParams.id}/quantity?variation_id=${selectedVariation.variationId}`
          : `/products/${unwrappedParams.id}/quantity`;
        
        router.push(quantityUrl);
      } else {
        // Add item directly to cart if no size variations
        try {
          // Get customization option ID if user is authenticated
          let customizationId: number | undefined = undefined;
          if (isAuthenticated && selectedVariation?.variationId) {
            try {
              customizationId = await getCustomizationOptionId(
                unwrappedParams.id,
                selectedVariation.variationId,
                activeView // Use current active view
              ) || undefined;
              console.log('Retrieved customization option ID:', customizationId);
            } catch (error) {
              console.error('Error getting customization option ID:', error);
            }
          }
          
          // Generate and save preview images ONLY if user has created a custom design
          let mainPreviewImage = '';
          let hasCustomDesign = false;
          
          // Check if user has created any custom design elements
          if (fabricCanvas) {
            try {
              const canvasData = fabricCanvas.toJSON();
              hasCustomDesign = canvasData.objects && canvasData.objects.length > 0;
              console.log('Has custom design elements:', hasCustomDesign, 'with', canvasData.objects?.length || 0, 'objects');
            } catch (error) {
              console.error('Error checking canvas for custom design:', error);
              hasCustomDesign = false;
            }
          }
          
          if (hasCustomDesign && customizationId) {
            try {
              console.log('🎨 DESIGNED PRODUCT: Generating and saving preview images for Add to Cart...');
              
              // Generate previews for all views and save them to backend
              if (isAuthenticated && selectedVariation?.variationId) {
                const variationId = selectedVariation.variationId.toString();
                
                const allPreviews = await previewGenerator.generatePreviewsForAllViews(
                  unwrappedParams.id,
                  variationId,
                  availableViews,
                  loadDesign
                );
                
                // Save each preview image to backend for designed products
                for (const [area, previewUrl] of Object.entries(allPreviews)) {
                  try {
                    const designData = await loadDesign(unwrappedParams.id, variationId, area);
                    if (designData) {
                      const currentViewImage = availableViews.find(v => v.area === area)?.image || '';
                      await saveDesign(designData.canvas_data, currentViewImage, previewUrl);
                      console.log(`🎨 Saved custom design preview for area: ${area}`);
                    }
                  } catch (error) {
                    console.error(`Error saving preview for area ${area}:`, error);
                  }
                }
                
                // Use the preview for the current active view as the main image
                mainPreviewImage = allPreviews[activeView] || Object.values(allPreviews)[0] || '';
                console.log('🎨 Using custom design preview image:', mainPreviewImage);
              } else {
                // For guests with custom design, generate preview without saving to backend
                const variationId = selectedVariation?.size || selectedVariation?.color || 'default';
                const allPreviews = await previewGenerator.generatePreviewsForAllViews(
                  unwrappedParams.id,
                  variationId,
                  availableViews,
                  loadDesign
                );
                mainPreviewImage = Object.values(allPreviews)[0] || '';
                console.log('🎨 Using guest custom design preview (not saved to backend)');
              }
            } catch (error) {
              console.error('Error generating custom design preview:', error);
              // Final fallback to variation image
              mainPreviewImage = currentVariation?.media?.[0]?.file_path || currentProduct.media?.[0]?.file_path || '';
            }
          } else {
            // For non-designed products, just use the variation or product image
            mainPreviewImage = currentVariation?.media?.[0]?.file_path || currentProduct.media?.[0]?.file_path || '';
            console.log('📦 STANDARD PRODUCT: Using variation/product image:', mainPreviewImage);
          }
          
          // Add to cart with default quantity of 1
          await addItemFromProductPage(
            unwrappedParams.id,
            currentProduct.name,
            1, // Default quantity
            parseFloat(currentVariation?.price || currentProduct.base_price),
            currentVariation?.attributes?.size,
            currentVariation?.attributes?.color,
            mainPreviewImage, // Use the saved or fallback preview image
            customizationId // Use the fetched customization ID
          );
          
          // Redirect to cart page
          router.push('/cart');
        } catch (error) {
          console.error('Error adding item to cart:', error);
          // Fallback: still redirect to cart even if preview generation fails
          await addItemFromProductPage(
            unwrappedParams.id,
            currentProduct.name,
            1,
            parseFloat(currentVariation?.price || currentProduct.base_price),
            currentVariation?.attributes?.size,
            currentVariation?.attributes?.color,
            currentVariation?.media?.[0]?.file_path || currentProduct.media?.[0]?.file_path || '',
            undefined // No customization ID in fallback
          );
          router.push('/cart');
        }
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <div className="w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-200">
        <LeftSidebar
          onAddText={handleAddText}
          onImageUpload={handleImageUpload}
          onImageClick={handleImageClick}
          onDesignColor={handleDesignColor}
          onElements={() => {}}
          onNames={() => {}}
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-700">My Projects</h1>
              {/* Sync Status Indicator */}
              {isAuthenticated && (
                <div className="flex items-center gap-2 text-sm">
                  {syncStatus === 'syncing' && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span>Syncing to cloud...</span>
                    </div>
                  )}
                  {syncStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span>Saved to cloud</span>
                    </div>
                  )}
                  {syncStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <span>Sync failed</span>
                    </div>
                  )}
                  {syncStatus === 'idle' && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span>Cloud storage</span>
                    </div>
                  )}
                </div>
              )}
              {!isAuthenticated && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span>Local storage</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreview}
                disabled={isGeneratingPreviews}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                {isGeneratingPreviews ? 'Generating...' : 'Preview'}
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {error ? (
              <div className="w-full aspect-square max-w-[600px] mx-auto bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-red-500 text-lg font-medium mb-2">Error Loading Product</div>
                  <div className="text-red-600 mb-4">{error}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : isLoading || !productImage ? (
              <div className="w-full aspect-square max-w-[600px] mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <div className="text-gray-500">Loading product image...</div>
                </div>
              </div>
            ) : (
              <DesignCanvas 
                key={`canvas-${productId}-${activeView}`}
                productImage={productImage} 
                onCanvasReady={handleCanvasReady} 
              />
            )}
            
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {availableViews.map((view) => (
                <button
                  key={view.area}
                  onClick={() => handleViewChange(view.area)}
                  className={`p-2 border rounded-lg ${
                    activeView === view.area ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-cover bg-center rounded flex items-end justify-center text-white text-xs md:text-sm font-medium shadow-inner"
                       style={{ 
                         backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${view.image})`,
                         backgroundSize: 'cover',
                         backgroundPosition: 'center'
                       }}>
                    {getViewDisplayName(view.area)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-200">
        <RightSidebar
          onSave={handleSave}
          onClearCanvas={handleClearCanvas}
          onTextFormat={handleTextFormat}
          onPosition={handlePosition}
          onLayer={handleLayer}
          onTextColorChange={handleTextColorChange}
          onFontChange={handleFontChange}
          onFontSizeChange={handleFontSizeChange}
          onImageAction={handleImageAction}
          onImageAdjust={handleImageAdjust}
          selectedObjectType={selectedObject?.type === 'image' ? 'image' : selectedObject?.type === 'text' ? 'text' : null}
        />
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-800">Design Preview</h2>
              <button
                onClick={closePreviewModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 flex flex-col p-4 min-h-0">
              {/* Final Design Preview */}
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg mb-4 min-h-0">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Final Design Preview"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500 text-center p-8">
                    <div className="text-6xl mb-4">📝</div>
                    <div className="text-lg font-medium mb-2">No Preview Available</div>
                    <div className="text-sm max-w-md">
                      No design found for the {getViewDisplayName(previewActiveView)} view.
                    </div>
                  </div>
                )}
              </div>
              
              {/* View Selector */}
              <div className="flex flex-wrap justify-center gap-4 flex-shrink-0">
                {availableViews.map((view) => (
                  <button
                    key={view.area}
                    onClick={() => handlePreviewViewChange(view.area)}
                    className={`px-6 py-3 rounded-lg border transition-colors duration-200 font-medium ${
                      previewActiveView === view.area 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {getViewDisplayName(view.area)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full flex overflow-hidden">
            {/* Close Button */}
            <button
              onClick={closeReviewModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 z-10"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>

            {/* Left Side - Product Preview */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-8">
              {/* Product Image */}
              <div className="flex-1 flex items-center justify-center mb-6">
                {reviewImageUrl ? (
                  <img
                    src={reviewImageUrl}
                    alt="Design Review"
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: '70vh' }}
                  />
                ) : (
                  <div className="flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📝</div>
                      <div className="text-lg">No design preview available</div>
                    </div>
                  </div>
                )}
              </div>

              {/* View Buttons */}
              <div className="flex gap-3">
                {availableViews.map((view) => (
                  <button
                    key={view.area}
                    onClick={() => handleReviewViewChange(view.area)}
                    className={`px-6 py-2 rounded-lg border transition-colors duration-200 font-medium ${
                      reviewActiveView === view.area 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {getViewDisplayName(view.area)}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side - Review Content */}
            <div className="w-96 bg-white p-8 flex flex-col">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Review your design</h2>
                <p className="text-gray-600 mb-8">
                  It will be printed like this preview. Make sure you are happy before continuing.
                </p>

                {/* Checklist */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Are the text and images clear and easy to read?</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Do the design elements fit in the safety area?</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Does the background fill out to the edges?</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Is everything spelled correctly?</span>
                  </div>
                </div>

                {/* Approval Checkbox */}
                <div className="flex items-start gap-3 mb-8">
                  <input
                    type="checkbox"
                    id="reviewApproval"
                    checked={isReviewApproved}
                    onChange={(e) => setIsReviewApproved(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="reviewApproval" className="text-gray-700 cursor-pointer">
                    I have reviewed and approve my design.
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleContinue}
                  disabled={!isReviewApproved}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                    isReviewApproved
                      ? 'bg-cyan-400 hover:bg-cyan-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
                <button
                  onClick={handleEditMyDesign}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Edit my design
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
