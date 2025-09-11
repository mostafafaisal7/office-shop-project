/**
 * Utility functions for handling product image display with dynamic priority logic
 * 
 * Priority order:
 * 1. Custom design preview (from canvas/design system)
 * 2. Variation-specific image (from product variations)
 * 3. Default product image
 * 4. Fallback placeholder
 */

export interface ImageResult {
  url: string | null;
  alt: string;
  isCustomDesign: boolean;
  isVariation: boolean;
}

export interface ProductImageOptions {
  productName: string;
  customDesignImages?: string | string[] | any[] | null;
  variationDetails?: {
    name?: string;
    media?: Array<{
      file_path: string;
      alt_text?: string;
    }>;
  } | null;
  defaultImage?: string | null;
  color?: string | null;
  fallbackUrl?: string;
}

/**
 * Get the appropriate product image URL based on priority rules
 */
export function getProductImageWithPriority(options: ProductImageOptions): ImageResult {
  const {
    productName,
    customDesignImages,
    variationDetails,
    defaultImage,
    color,
    fallbackUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop'
  } = options;

  let imageUrl: string | null = null;
  let alt = productName;
  let isCustomDesign = false;
  let isVariation = false;

  // Priority 1: Custom design preview image
  if (customDesignImages) {
    try {
      let customImages: any[] = [];

      // Handle different input formats
      if (typeof customDesignImages === 'string') {
        try {
          // Try to parse as JSON
          customImages = JSON.parse(customDesignImages);
          if (!Array.isArray(customImages)) {
            customImages = [customImages];
          }
        } catch (parseError) {
          // If parse fails, treat as single URL string
          customImages = [customDesignImages];
        }
      } else if (Array.isArray(customDesignImages)) {
        customImages = customDesignImages;
      } else if (customDesignImages && typeof customDesignImages === 'object') {
        customImages = [customDesignImages];
      }

      // Extract URL from the first custom image
      if (customImages.length > 0) {
        const firstImage = customImages[0];
        
        if (typeof firstImage === 'string') {
          imageUrl = firstImage;
        } else if (firstImage && typeof firstImage === 'object') {
          // Try different possible properties for image URL
          imageUrl = firstImage.url || 
                    firstImage.file_path || 
                    firstImage.image_url || 
                    firstImage.preview_url ||
                    firstImage.src;
        }
        
        if (imageUrl) {
          alt = `${productName} (Custom Design)`;
          isCustomDesign = true;
        }
      }
    } catch (error) {
      console.warn('Failed to process custom design images:', error);
    }
  }

  // Priority 2: Variation image (only if no custom design found)
  if (!imageUrl && variationDetails?.media && variationDetails.media.length > 0) {
    const variationImage = variationDetails.media[0];
    imageUrl = variationImage.file_path;
    alt = variationImage.alt_text || 
          `${productName}${variationDetails.name ? ` (${variationDetails.name})` : ''}`;
    isVariation = true;
  }

  // Priority 3: Default product image
  if (!imageUrl && defaultImage) {
    imageUrl = defaultImage;
    alt = color ? `${productName} (${color})` : productName;
  }

  // Priority 4: Fallback
  if (!imageUrl) {
    imageUrl = fallbackUrl;
    alt = `${productName} - Product Image`;
  }

  return {
    url: imageUrl,
    alt,
    isCustomDesign,
    isVariation
  };
}

/**
 * Get image for cart items
 */
export function getCartItemImage(item: {
  name: string;
  image?: string;
  customDesign?: boolean;
  customizationId?: number;
  color?: string;
}): ImageResult {
  return getProductImageWithPriority({
    productName: item.name,
    customDesignImages: item.customizationId && item.image ? item.image : null,
    defaultImage: item.image,
    color: item.color
  });
}

/**
 * Get image for order items (customer side)
 */
export function getOrderItemImage(item: {
  product_name: string;
  customized_images?: string | null;
  variation_details?: {
    name?: string;
    media?: Array<{
      file_path: string;
      alt_text?: string;
    }>;
  } | null;
}): ImageResult {
  return getProductImageWithPriority({
    productName: item.product_name,
    customDesignImages: item.customized_images,
    variationDetails: item.variation_details
  });
}

/**
 * Get image for admin order items
 */
export function getAdminOrderItemImage(item: {
  product_name: string;
  customized_images?: string | string[] | any[];
  variation_details?: {
    name?: string;
    media?: Array<{
      file_path: string;
      alt_text?: string;
    }>;
  } | null;
}): ImageResult {
  return getProductImageWithPriority({
    productName: item.product_name,
    customDesignImages: item.customized_images,
    variationDetails: item.variation_details
  });
}