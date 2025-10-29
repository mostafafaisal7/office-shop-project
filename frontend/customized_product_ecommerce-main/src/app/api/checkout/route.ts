import { NextRequest, NextResponse } from 'next/server';
import { imageService } from '@/services/imageService';
import { getCurrentUserId } from '@/store/authStore';

const BACKEND_URL = 'http://127.0.0.1:8000';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  customizationId?: number;
  serverId?: number;
}

interface CheckoutPayload {
  user_id: number;
  items: {
    cart_item_id: number;
    product_id: number;
    variation_id: number | null;
    quantity: number;
    customization_option_id?: number;
    customized_images?: string[] | null;
    // Design data (snapshot from cart)
    design_canvas_data?: any;
    design_svg_data?: string;
    design_elements?: any[];
  }[];
  shipping_method_id: number;
  shipping_address_id: string;
  payment_method_id: number;
}

export async function POST(request: NextRequest) {
  console.log('=== CHECKOUT API CALLED ===');
  
  try {
    console.log('Getting authorization header...');
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.log('No authorization header found');
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }
    
    console.log('Authorization header found:', authHeader.substring(0, 20) + '...');

    // Parse request body
    console.log('Parsing request body...');
    const requestBody = await request.json();
    console.log('Raw request body:', JSON.stringify(requestBody, null, 2));
    
    const { user_id, items, shipping_method_id, shipping_address_id, payment_method_id } = requestBody;
    
    console.log('Parsed fields:', {
      user_id,
      items: items?.length || 'undefined',
      shipping_method_id,
      shipping_address_id,
      payment_method_id
    });
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!shipping_method_id) {
      return NextResponse.json(
        { error: 'shipping_method_id is required' },
        { status: 400 }
      );
    }

    if (!shipping_address_id) {
      return NextResponse.json(
        { error: 'shipping_address_id is required' },
        { status: 400 }
      );
    }

    if (!payment_method_id) {
      return NextResponse.json(
        { error: 'payment_method_id is required' },
        { status: 400 }
      );
    }

    // Convert and validate the attributes
    const convertedShippingMethodId = parseInt(shipping_method_id);
    if (isNaN(convertedShippingMethodId)) {
      return NextResponse.json(
        { error: 'Invalid shipping_method_id: must be a valid number' },
        { status: 400 }
      );
    }

    const convertedPaymentMethodId = parseInt(payment_method_id);
    if (isNaN(convertedPaymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment_method_id: must be a valid number' },
        { status: 400 }
      );
    }

    // Log the new attributes for debugging
    console.log('Checkout request with new attributes:', {
      shipping_method_id: convertedShippingMethodId,
      shipping_address_id,
      payment_method_id: convertedPaymentMethodId,
      itemsCount: items.length
    });

    console.log('Processing checkout for', items.length, 'items');

    // Use user_id from request body or fallback
    let userId: number;
    if (user_id && typeof user_id === 'number') {
      userId = user_id;
      console.log('Using user ID from request body:', userId);
    } else {
      // Fallback to trying to get from backend
      try {
        const userResponse = await fetch(`${BACKEND_URL}/users/me`, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.id;
          console.log('Got user ID from backend:', userId);
        } else {
          console.warn('Could not get user ID from backend, using fallback');
          userId = 1; // Fallback user ID
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
        userId = 1; // Fallback user ID
      }
    }

    // Collect all customization IDs that need image generation
    const customizationIds = items
      .filter((item: CartItem) => item.customizationId)
      .map((item: CartItem) => item.customizationId!)
      .filter((id: number, index: number, array: number[]) => array.indexOf(id) === index); // Remove duplicates

    console.log('Found customization IDs:', customizationIds);

    // Generate and save images for customizations
    let customizationImageMap: Map<number, string[]> = new Map();
    let generatedImagePaths: string[] = [];

    if (customizationIds.length > 0) {
      try {
        console.log('Generating images for customizations...');
        const imageResults = await imageService.generateAndSaveMultipleCustomizations(customizationIds);
        
        // Build map of customization ID to image paths
        for (const result of imageResults) {
          const imagePaths = result.images.map(img => img.path);
          customizationImageMap.set(result.customizationId, imagePaths);
          generatedImagePaths.push(...imagePaths);
        }
        
        console.log('Generated images:', customizationImageMap);
      } catch (error) {
        console.error('Error generating images:', error);
        // Continue with checkout even if image generation fails
      }
    }

    // Transform cart items to checkout payload format
    const checkoutItems = items.map((item: any, index: number) => {
      console.log(`Processing cart item ${index}:`, item);
      
      // The item already has the correct structure from frontend
      const productId = item.product_id;
      
      // Validate product ID
      if (!productId || isNaN(productId)) {
        console.error('Invalid product_id for cart item:', item);
        throw new Error(`Invalid product ID: ${productId} for item at index ${index}`);
      }

      // The item already has the correct structure, just pass it through
      // Ensure customized_images is always an array or null
      let customizedImages: string[] | null = null;
      if (item.customized_images) {
        if (Array.isArray(item.customized_images)) {
          customizedImages = item.customized_images;
        } else if (typeof item.customized_images === 'string') {
          customizedImages = [item.customized_images];
        }
      }

      const checkoutItem: CheckoutPayload['items'][0] = {
        cart_item_id: item.cart_item_id,
        product_id: item.product_id,
        variation_id: item.variation_id,
        quantity: item.quantity,
        customization_option_id: item.customization_option_id,
        customized_images: customizedImages,
        // Include design data (snapshot from cart)
        design_canvas_data: item.design_canvas_data,
        design_svg_data: item.design_svg_data,
        design_elements: item.design_elements,
      };

      console.log(`Generated checkout item ${index}:`, checkoutItem);

      // Add generated image paths if customization exists
      if (item.customization_option_id && item.customization_option_id !== 187) {
        const imagePaths = customizationImageMap.get(item.customization_option_id) || [];
        if (imagePaths.length > 0) {
          checkoutItem.customized_images = imagePaths;
        }
      }

      return checkoutItem;
    });

    // Prepare final checkout payload with the correct structure
    const checkoutPayload: CheckoutPayload = {
      user_id: userId,
      items: checkoutItems,
      shipping_method_id: convertedShippingMethodId,
      shipping_address_id: shipping_address_id,
      payment_method_id: convertedPaymentMethodId
    };

    console.log('Sending checkout payload to backend:', JSON.stringify(checkoutPayload, null, 2));

    // Send to backend checkout endpoint
    try {
      const response = await fetch(`${BACKEND_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(checkoutPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Backend checkout failed:', response.status, responseData);
        
        // Clean up generated images on failure
        if (generatedImagePaths.length > 0) {
          try {
            await imageService.cleanupImages(generatedImagePaths);
            console.log('Cleaned up images after checkout failure');
          } catch (cleanupError) {
            console.error('Error cleaning up images:', cleanupError);
          }
        }

        return NextResponse.json(responseData, { status: response.status });
      }

      console.log('Checkout successful:', responseData);
      return NextResponse.json(responseData, { status: response.status });

    } catch (backendError) {
      console.error('Error communicating with backend:', backendError);
      
      // Clean up generated images on error
      if (generatedImagePaths.length > 0) {
        try {
          await imageService.cleanupImages(generatedImagePaths);
          console.log('Cleaned up images after backend error');
        } catch (cleanupError) {
          console.error('Error cleaning up images:', cleanupError);
        }
      }

      return NextResponse.json(
        { error: 'Failed to process checkout' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
