'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Lock, Truck, MapPin, User, Mail, Phone, CheckCircle, AlertCircle, Wallet, DollarSign, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore, getCurrentUserId } from '@/store/authStore';
import { useShippingStore } from '@/store/shippingStore';
import { VerificationSuccessAlert } from '@/components/common/VerificationSuccessAlert';
import { shippingApi, ShippingAddress, ShippingMethod, ShippingCostCalculation, ProductShippingCostCalculation, ShippingProductCostRequest } from '@/services/shippingApi';
import { paymentApi, PaymentMethod as ApiPaymentMethod } from '@/services/paymentApi';
import PreviewCarousel from '@/components/PreviewCarousel';

interface ShippingInfo {
  full_name: string;
  phone: string;
  email: string;
  country: string;
  division: string;
  district: string;
  thana: string;
  postal_code: string;
  delivery_address: string;

}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface PayPalInfo {
  email: string;
}

type PaymentMethodType = 'card' | 'paypal' | 'cod';

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, getTotalQuantity, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    full_name: '',
    email: '',
    phone: '',
    country: 'Bangladesh',
    division: 'Dhaka',
    district: '',
    thana: '',
    postal_code:'',
    delivery_address: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [paypalInfo, setPaypalInfo] = useState<PayPalInfo>({
    email: ''
  });

  const [billingAddressSame, setBillingAddressSame] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<ApiPaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('1'); // Default shipping method
  const [availableShippingMethods, setAvailableShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoadingShippingMethods, setIsLoadingShippingMethods] = useState(false);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  const [shippingCostData, setShippingCostData] = useState<ProductShippingCostCalculation | null>(null);

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Comprehensive data restoration effect
  useEffect(() => {
    if (!isHydrated) return;

    console.log('=== CHECKOUT DATA RESTORATION DEBUG ===');
    console.log('isHydrated:', isHydrated);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('current shippingInfo.full_name:', shippingInfo.full_name);
    
    const { shouldRestoreCheckoutData, getStoredShippingData, clearGuestCheckoutContext, guestCheckoutContext } = useShippingStore.getState();
    
    console.log('shouldRestoreCheckoutData():', shouldRestoreCheckoutData());
    console.log('guestCheckoutContext:', guestCheckoutContext);
    
    const storedData = getStoredShippingData();
    console.log('getStoredShippingData():', storedData);
    
    // Check if we just came back from email verification
    const urlParams = new URLSearchParams(window.location.search);
    const fromVerification = urlParams.get('verified') === 'true';
    console.log('fromVerification URL param:', fromVerification);
    
    // Restore data if:
    // 1. User is authenticated
    // 2. We have stored data
    // 3. Current form is empty OR we're coming from verification
    if (isAuthenticated && user && storedData) {
      const shouldRestore = !shippingInfo.full_name || fromVerification || shouldRestoreCheckoutData();
      console.log('shouldRestore:', shouldRestore);
      
      if (shouldRestore) {
        console.log('RESTORING shipping data:', storedData);
        setShippingInfo(storedData);
        
        // Clear the guest context after restoring data
        if (shouldRestoreCheckoutData()) {
          setTimeout(() => {
            console.log('Clearing guest checkout context after restoration');
            clearGuestCheckoutContext();
          }, 1000);
        }
        
        // Clean up the URL parameter if present
        if (fromVerification) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
    
    console.log('=== END CHECKOUT DATA RESTORATION DEBUG ===');
  }, [isHydrated, isAuthenticated, user]); // Simplified dependencies

  // Redirect if cart is empty
  useEffect(() => {
    if (isHydrated && cartItems.length === 0 && !orderComplete) {
      router.push('/cart');
    }
  }, [cartItems, router, orderComplete, isHydrated]);

  // Load saved shipping addresses
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!isAuthenticated || !user || !isHydrated) return;

      setIsLoadingAddresses(true);
      try {
        // Get user ID with fallback
        const userId = user.id || (user as any).user_id || (user as any).userId || (user as any).sub;
        const userIdNumber = userId ? parseInt(userId) : 1; // Use fallback ID

        if (!isNaN(userIdNumber)) {
          const response = await shippingApi.getUserShippingAddresses(userIdNumber);
          
          if (response.success && response.data) {
            setSavedAddresses(Array.isArray(response.data) ? response.data : []);
          } else {
            console.log('No saved addresses found or error:', response.message);
            setSavedAddresses([]);
          }
        }
      } catch (error) {
        console.error('Error loading saved addresses:', error);
        setSavedAddresses([]);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    loadSavedAddresses();
  }, [isAuthenticated, user, isHydrated]);

  // Load available payment methods
// Load available payment methods
useEffect(() => {
  const loadPaymentMethods = async () => {
    if (!isHydrated) return;

    setIsLoadingPaymentMethods(true);
    try {
      const response = await paymentApi.getPaymentMethods();
      
      if (response.success && response.data) {
        // Filter only active payment methods
        const activePaymentMethods = response.data.filter(method => method.is_active);
        setAvailablePaymentMethods(activePaymentMethods);
        
        // ✅ Set default payment method to COD if available
        if (activePaymentMethods.length > 0) {
          const codMethod = activePaymentMethods.find(m => m.type === "cod");
          if (codMethod) {
            setPaymentMethod("cod");
            setSelectedPaymentMethodId(codMethod.id.toString());
          } else {
            // fallback to the first active method if COD not present
            setPaymentMethod(activePaymentMethods[0].type);
            setSelectedPaymentMethodId(activePaymentMethods[0].id.toString());
          }
        }
      } else {
        console.log("No payment methods found or error:", response.message);
        setAvailablePaymentMethods([]);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
      setAvailablePaymentMethods([]);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  loadPaymentMethods();
}, [isHydrated]);


  // Load available shipping methods when moving to step 2
  useEffect(() => {
    const loadShippingMethods = async () => {
      if (currentStep !== 2 || !isHydrated) return;

      setIsLoadingShippingMethods(true);
      try {
        const response = await shippingApi.getShippingMethods();
        
        if (response.success && response.data) {
          // Filter only active shipping methods
          const activeShippingMethods = response.data.filter((method: ShippingMethod) => method.is_active);
          setAvailableShippingMethods(activeShippingMethods);
          
          // Set default shipping method to the first active one
          if (activeShippingMethods.length > 0) {
            const defaultMethod = activeShippingMethods[0];
            setSelectedShippingMethodId(defaultMethod.id.toString());
            setSelectedShippingMethod(defaultMethod);
            
            // Calculate shipping cost for default method
            await calculateShippingCost(defaultMethod.id);
          }
        } else {
          console.log('No shipping methods found or error:', response.message);
          setAvailableShippingMethods([]);
        }
      } catch (error) {
        console.error('Error loading shipping methods:', error);
        setAvailableShippingMethods([]);
      } finally {
        setIsLoadingShippingMethods(false);
      }
    };

    loadShippingMethods();
  }, [currentStep, isHydrated]);

  // Function to calculate shipping cost using the new product-specific endpoint
  const calculateShippingCost = async (methodId: number) => {
    if (!isHydrated) return;

    setIsCalculatingShipping(true);
    try {
      // Transform cart items to the required format for the new endpoint
      const items = cartItems.map(item => ({
        product_id: parseInt(item.productId),
        quantity: item.quantity
      }));

      const request: ShippingProductCostRequest = {
        shipping_method_id: methodId,
        items: items
      };

      const response = await shippingApi.calculateProductShippingCost(request);
      
      if (response.success && response.data) {
        const costData = response.data as ProductShippingCostCalculation;
        setShippingCost(costData.total_cost);
        setShippingCostData(costData);
        console.log('Product shipping cost calculated:', {
          total_cost: costData.total_cost,
          product_breakdown: costData.product_breakdown,
          delivery_days: costData.delivery_days,
          items_sent: items
        });
      } else {
        console.error('Failed to calculate product shipping cost:', response.message);
        // Fallback to base cost if available
        const method = availableShippingMethods.find(m => m.id === methodId);
        if (method && method.base_cost !== undefined) {
          setShippingCost(method.base_cost);
          setShippingCostData(null);
        }
      }
    } catch (error) {
      console.error('Error calculating product shipping cost:', error);
      // Fallback to base cost if available
      const method = availableShippingMethods.find(m => m.id === methodId);
      if (method && method.base_cost !== undefined) {
        setShippingCost(method.base_cost);
        setShippingCostData(null);
      }
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  // Handle shipping method selection
  const handleShippingMethodSelect = async (method: ShippingMethod) => {
    setSelectedShippingMethodId(method.id.toString());
    setSelectedShippingMethod(method);
    await calculateShippingCost(method.id);
  };

  // Calculate totals
  const getSubtotal = () => getTotalPrice();
  const getShipping = () => {
    // Use calculated shipping cost if available (including 0 cost)
    if ((currentStep === 2 || currentStep === 3) && (shippingCost >= 0 && shippingCostData)) {
      return shippingCost;
    }
    // If we have a selected shipping method but no calculated cost yet, use base cost
    if ((currentStep === 2 || currentStep === 3) && selectedShippingMethod) {
      return selectedShippingMethod.base_cost || selectedShippingMethod.cost || 0;
    }
    // Fallback for step 1 or when shipping cost is not calculated yet
    return getSubtotal() > 100 ? 0 : 15.99;
  };
  const getTax = () => getSubtotal() * 0.08;
  const getDiscount = () => isPromoApplied ? getSubtotal() * 0.1 : 0;
  const getTotal = () => getSubtotal() + getShipping() + getTax() - getDiscount();

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'save10') {
      setIsPromoApplied(true);
    } else {
      alert('Invalid promo code');
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Check authentication status - logged in users can proceed directly
      console.log('Checkout auth check:', { 
        isAuthenticated, 
        hasUser: !!user, 
        userId: user?.id || 'none',
        isHydrated 
      });
      
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, opening login modal');
        console.log('Current shipping info to save:', shippingInfo);
        
        // Save current shipping info and context for after login
        const { setGuestCheckoutContext, setRedirectAfterAuth } = useShippingStore.getState();
        
        const contextToSave = {
          fromCheckout: true,
          originalPath: '/checkout',
          shippingData: shippingInfo,
          timestamp: Date.now()
        };
        
        console.log('Saving guest checkout context:', contextToSave);
        setGuestCheckoutContext(contextToSave);
        setRedirectAfterAuth('/checkout');
        
        // Verify the data was saved
        setTimeout(() => {
          const { getStoredShippingData, shouldRestoreCheckoutData } = useShippingStore.getState();
          console.log('Verification - stored data after save:', getStoredShippingData());
          console.log('Verification - should restore:', shouldRestoreCheckoutData());
        }, 100);
        
        // Automatically open the login modal from navigation
        const { openAuthModal } = useAuthStore.getState();
        openAuthModal('login');
        setIsProcessing(false);
        return;
      }

      // If a saved address is selected, skip saving and proceed to payment
      if (selectedAddressId) {
        console.log('Using existing saved address, skipping save operation');
        setCurrentStep(2);
        setIsProcessing(false);
        return;
      }

      // Check for user ID in different possible properties
      const userId = user.id || (user as any).user_id || (user as any).userId || (user as any).sub;
      console.log('User ID found:', userId);
      console.log('Checking user.id:', user.id);
      console.log('Checking user.user_id:', (user as any).user_id);
      console.log('Checking user.userId:', (user as any).userId);
      console.log('Checking user.sub:', (user as any).sub);
      
      if (!userId) {
        // If no user ID is found, let's try to use a hardcoded value for testing
        console.warn('No user ID found in user object. Using fallback ID for testing.');
        const fallbackUserId = 1; // You can change this to match your test user ID
        
        // Prepare shipping data for API with fallback user ID
        const shippingData: ShippingAddress = {
          user_id: fallbackUserId,
          guest_id: null,
          full_name: shippingInfo.full_name,
          phone: shippingInfo.phone,
          email: shippingInfo.email,
          delivery_address: shippingInfo.delivery_address,
          country: shippingInfo.country,
          division: shippingInfo.division,
          district: shippingInfo.district,
          thana: shippingInfo.thana,
          postal_code: shippingInfo.postal_code,
        };

        console.log('Using fallback shipping data:', shippingData);

        // Save shipping address with fallback
        const response = await shippingApi.createShippingAddress(shippingData);

        if (response.success) {
          // Set the address ID from the response for checkout
          if (response.data && response.data.id) {
            setSelectedAddressId(response.data.id.toString());
          }
          setCurrentStep(2);
        } else {
          alert(response.message || 'Failed to save shipping address. Please try again.');
        }
        setIsProcessing(false);
        return;
      }

      const userIdNumber = parseInt(userId);
      if (isNaN(userIdNumber)) {
        alert('Invalid user session. Please log in again.');
        setIsProcessing(false);
        return;
      }

      // Only save new address if no existing address is selected
      console.log('Saving new shipping address to database');
      
      // Prepare shipping data for API
      const shippingData: ShippingAddress = {
        user_id: userIdNumber,
        guest_id: null,

        full_name: shippingInfo.full_name,
        phone: shippingInfo.phone,
        email: shippingInfo.email,
        delivery_address: shippingInfo.delivery_address,
        country: shippingInfo.country,
        division: shippingInfo.division,
        district: shippingInfo.district,
        thana: shippingInfo.thana,
        postal_code: shippingInfo.postal_code,
      };

      // Save shipping address
      const response = await shippingApi.createShippingAddress(shippingData);

      if (response.success) {
        // Set the address ID from the response for checkout
        if (response.data && response.data.id) {
          setSelectedAddressId(response.data.id.toString());
        }
        // Successfully saved, proceed to payment step
        setCurrentStep(2);
      } else {
        // Show error message
        alert(response.message || 'Failed to save shipping address. Please try again.');
      }
    } catch (error) {
      console.error('Error saving shipping address:', error);
      alert('An error occurred while saving shipping address. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Get auth token for API call
      const { tokens } = useAuthStore.getState();
      
      if (!tokens?.accessToken) {
        alert('Please log in to complete your order');
        setIsProcessing(false);
        return;
      }

      // Validate required fields before sending
      if (!selectedShippingMethodId) {
        alert('Please select a shipping method');
        setIsProcessing(false);
        return;
      }

      if (!selectedAddressId) {
        alert('Please select or create a shipping address');
        setIsProcessing(false);
        return;
      }

      if (!selectedPaymentMethodId) {
        alert('Please select a payment method');
        setIsProcessing(false);
        return;
      }

      // Get user ID for the payload
      const userId = user?.id || (user as any)?.user_id || (user as any)?.userId || (user as any)?.sub || 1;
      const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId;

      // Prepare cart items for checkout API with the correct payload structure
      const checkoutData = {
        user_id: userIdNumber, // Add user_id to root level
        items: cartItems.map(item => {
          const productId = parseInt(item.productId);
          if (isNaN(productId) || !item.productId) {
            console.error('Invalid productId for cart item:', item);
            throw new Error(`Invalid product ID: ${item.productId}`);
          }
          
          // Ensure cart_item_id is a valid number
          const cartItemId = item.serverId && item.serverId > 0 ? item.serverId : Math.floor(Math.random() * 1000000);
          
          return {
            cart_item_id: cartItemId,
            product_id: productId,
            variation_id: null,
            quantity: item.quantity,
            customization_option_id: item.customizationId || 187, // Use default customization option ID if none exists
            customized_images: item.image ? (Array.isArray(item.image) ? item.image : [item.image]) : null
          };
        }),
        shipping_method_id: parseInt(selectedShippingMethodId), // Convert to integer
        shipping_address_id: selectedAddressId,
        payment_method_id: parseInt(selectedPaymentMethodId) // Convert to integer
      };

      console.log('=== CHECKOUT DEBUG INFO ===');
      console.log('Cart items before transformation:', cartItems);
      console.log('User ID being used:', userIdNumber);
      console.log('Sending checkout request with data:', JSON.stringify(checkoutData, null, 2));
      console.log('Selected shipping method ID:', selectedShippingMethodId);
      console.log('Selected address ID:', selectedAddressId);
      console.log('Selected payment method ID:', selectedPaymentMethodId);
      console.log('=== END DEBUG INFO ===');

      // Call our checkout API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Checkout failed:', result);
        alert(result.error || 'Checkout failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      console.log('Checkout successful:', result);

      // Use the real order ID from backend response
      const orderNum = result.order_id || result.order_number || 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setOrderNumber(orderNum);
      setOrderComplete(true);
      clearCart();

    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Order Number</p>
            <p className="text-lg font-bold text-gray-900">{orderNumber}</p>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            You will receive an email confirmation shortly with tracking information.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }
  
  return(
  <div className="min-h-screen bg-gray-50">
      <VerificationSuccessAlert />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push('/cart')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Address</span>
            </div>
            <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Shipping</span>
            </div>
            <div className={`w-12 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 text-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
                </div>

                {/* Saved Addresses Section */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Addresses</h3>
                    {isLoadingAddresses ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading saved addresses...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedAddresses.map((address, index) => (
                          <div
                            key={address.id || index}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedAddressId === address.id?.toString()
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setSelectedAddressId(address.id?.toString() || '');
                              // Auto-fill form with selected address
                              setShippingInfo({
                                full_name: address.full_name || '',
                                email: address.email || '',
                                phone: address.phone || '',
                                delivery_address: address.delivery_address || '',
                                country: address.country || 'Bangladesh',
                                division: address.division || '',
                                district: address.district || '',
                                thana: address.thana || '',
                                postal_code: address.postal_code || '',
                                
                              });
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="radio"
                                    name="savedAddress"
                                    checked={selectedAddressId === address.id?.toString()}
                                    onChange={() => {}}
                                    className="text-blue-600"
                                  />
                                  <span className="font-medium text-gray-900">
                                    {address.full_name}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 ml-6">
                                  <p>{address.country}{address.division} {address.district}</p>
                                  <p>{address.thana}, {address.postal_code}</p>
                                  <p>{address.delivery_address}</p>
                                  <p className="mt-1">
                                    <span className="text-gray-500">Phone:</span> {address.phone}
                                  </p>
                                  <p>
                                    <span className="text-gray-500">Email:</span> {address.email}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAddressId('');
                              setShippingInfo({
                                full_name: '',
                                email: '',
                                phone: '',
                                country: 'Bangladesh',
                                division: 'Dhaka',
                                district: '',
                                thana: '',
                                postal_code:'',
                                delivery_address: '',
                              });
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            + Add New Address
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleShippingSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.full_name}
                      onChange={(e) => setShippingInfo({...shippingInfo, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      required
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Bangladesh">Bangladesh</option>
                      {/* <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option> */}
                    </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Division *
                      </label>
                        <select
                        required
                        value={shippingInfo.division}
                        onChange={(e) => setShippingInfo({...shippingInfo, division: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Dhaka">Dhaka</option>
                        <option value="Chattogram">Chattogram</option>
                        <option value="Khulna">Khulna</option>
                        <option value="Barishal">Barishal</option>
                        <option value="Sylhet">Sylhet</option>
                        <option value="Rangpur">Chattogram</option>
                        <option value="Rajshahi">Rajshahi</option>
                        <option value="Mymensingh">Mymensingh</option>
                      </select>
                    </div>
                    
                    
                    
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        District *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.district}
                        onChange={(e) => setShippingInfo({...shippingInfo, district: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thana *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.thana}
                        onChange={(e) => setShippingInfo({...shippingInfo, thana: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        postal_code *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.postal_code}
                        onChange={(e) => setShippingInfo({...shippingInfo, postal_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.delivery_address}
                      onChange={(e) => setShippingInfo({...shippingInfo, delivery_address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Address...
                      </>
                    ) : (
                      'Continue to Shipping'
                    )}
                  </button>
                </form>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Shipping Summary */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{shippingInfo.full_name}</p>
                    <p>{shippingInfo.country}</p>
                    <p>{shippingInfo.division}, {shippingInfo.district} {shippingInfo.district}</p>
                    <p>{shippingInfo.thana} {shippingInfo.postal_code}</p>
                  </div>
                </div>

                {/* Shipping Method Selection */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Truck className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Choose Shipping Method</h2>
                  </div>

                  {isLoadingShippingMethods ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-3">Loading shipping methods...</p>
                    </div>
                  ) : availableShippingMethods.length > 0 ? (
                    <div className="space-y-4">
                      {availableShippingMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedShippingMethodId === method.id.toString()
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleShippingMethodSelect(method)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <input
                                type="radio"
                                name="shippingMethod"
                                checked={selectedShippingMethodId === method.id.toString()}
                                onChange={() => handleShippingMethodSelect(method)}
                                className="mt-1 text-blue-600"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">{method.name}</h4>
                                  <div className="text-right">
                                    {isCalculatingShipping && selectedShippingMethodId === method.id.toString() ? (
                                      <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="text-sm text-gray-500">Calculating...</span>
                                      </div>
                                    ) : (
                                      <span className="font-semibold text-gray-900">
                                        {selectedShippingMethodId === method.id.toString() && shippingCost >= 0 && shippingCostData
                                          ? `৳${shippingCost.toFixed(2)}`
                                          : selectedShippingMethodId === method.id.toString() && shippingCost >= 0
                                          ? `৳${shippingCost.toFixed(2)}`
                                          : `৳${(method.base_cost || method.cost || 0).toFixed(2)}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                                
                                {/* Cost breakdown for selected method */}
                                {selectedShippingMethodId === method.id.toString() && shippingCostData && (
                                  <div className="bg-gray-50 rounded-lg p-3 mt-3">
                                    <div className="text-xs text-gray-600">
                                      <div className="text-xs font-medium text-gray-700 mb-2">Product Breakdown:</div>
                                      
                                      {/* Show product breakdown */}
                                      {shippingCostData.product_breakdown.map((product, index) => {
                                        // Find the corresponding cart item to get the product name
                                        const cartItem = cartItems.find(item => parseInt(item.productId) === product.product_id);
                                        const productName = cartItem ? cartItem.name : `Product ${product.product_id}`;
                                        
                                        return (
                                          <div key={`${product.product_id}-${index}`} className="ml-2 mb-2 p-2 bg-white rounded border">
                                            <div className="flex justify-between text-xs mb-1">
                                              <span className="font-medium">{productName}</span>
                                              <span>Qty: {product.quantity}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                              <span>Base cost: ৳{product.base_cost.toFixed(2)}</span>
                                              <span className="font-medium">Final: ৳{product.final_cost.toFixed(2)}</span>
                                            </div>
                                            {product.applied_rules && product.applied_rules.length > 0 && (
                                              <div className="text-xs text-gray-500 mt-1">
                                                <div className="font-medium mb-1">Applied Rules:</div>
                                                {product.applied_rules.map((rule: any, ruleIndex: number) => (
                                                  <div key={ruleIndex} className="ml-2 mb-1">
                                                    <div className="text-xs">
                                                      Qty {rule.min_quantity}-{rule.max_quantity || '∞'}: 
                                                      <span className="ml-1">
                                                        {rule.adjustment_type === 'per_item' 
                                                          ? `+৳${rule.cost_adjustment}/item` 
                                                          : `+৳${rule.cost_adjustment}`
                                                        }
                                                      </span>
                                                      <span className="ml-1 text-green-600 font-medium">
                                                        (+৳{rule.total_adjustment.toFixed(2)})
                                                      </span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 ml-1">
                                                      Applied to {rule.applicable_quantity} items
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            <div className="text-xs text-gray-500">
                                              Source: {product.rule_source}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      
                                      <div className="flex justify-between font-medium border-t border-gray-200 pt-1 mt-2">
                                        <span>Total shipping:</span>
                                        <span>৳{shippingCostData.total_cost.toFixed(2)}</span>
                                      </div>
                                      
                                      {shippingCostData.delivery_days && (
                                        <div className="text-xs text-blue-600 mt-1">
                                          Estimated delivery: {shippingCostData.delivery_days} business days
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Shipping info */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Truck className="w-4 h-4" />
                          <span className="text-sm font-medium">Shipping Information</span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          Shipping costs are calculated based on your specific products and quantities ({getTotalQuantity()} items total). 
                          Different products may have different shipping characteristics and costs.
                        </p>
                      </div>

                      {/* Continue to Payment Button */}
                      <div className="pt-4">
                        <button
                          onClick={() => setCurrentStep(3)}
                          disabled={!selectedShippingMethod}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          Continue to Payment
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No shipping methods available at the moment.</p>
                      <p className="text-xs text-gray-400 mt-1">Please try again later or contact support.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Address Summary */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{shippingInfo.full_name}</p>
                    <p>{shippingInfo.country}</p>
                    <p>{shippingInfo.division}, {shippingInfo.district} {shippingInfo.thana}</p>
                    <p>{shippingInfo.country}</p>
                  </div>
                </div>

                {/* Shipping Method Summary */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Shipping Method</h3>
                    </div>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedShippingMethod ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{selectedShippingMethod.name}</p>
                          <p className="text-xs text-gray-500">{selectedShippingMethod.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ৳{shippingCost > 0 ? shippingCost.toFixed(2) : (selectedShippingMethod.base_cost || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p>No shipping method selected</p>
                    )}
                  </div>
                </div>

                {/* Payment Form */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Payment Information</h2>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    {/* Debug Info */}
                    <div className="bg-gray-100 p-3 rounded text-xs">
                      <p><strong>Current Payment Method:</strong> {paymentMethod}</p>
                      <p><strong>Available Methods:</strong> {availablePaymentMethods.map(m => `${m.name} (${m.type})`).join(', ')}</p>
                      <p><strong>Loading:</strong> {isLoadingPaymentMethods ? 'Yes' : 'No'}</p>
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Select Payment Method *
                      </label>
                      {isLoadingPaymentMethods ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Loading payment methods...</p>
                        </div>
                      ) : availablePaymentMethods.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {availablePaymentMethods.map((method) => {
                            const getIcon = () => {
                              switch (method.type) {
                                case 'card':
                                  return <CreditCard className="w-5 h-5 text-gray-600" />;
                                case 'paypal':
                                  return <Wallet className="w-5 h-5 text-gray-600" />;
                                case 'cod':
                                  return <DollarSign className="w-5 h-5 text-gray-600" />;
                                default:
                                  return <CreditCard className="w-5 h-5 text-gray-600" />;
                              }
                            };
                            <p className="text-sm text-gray-500 mt-2">Selected Payment Method: {paymentMethod}</p>

                            const getDefaultDescription = () => {
                              switch (method.type) {
                                case 'card':
                                  return 'Pay securely with your card';
                                case 'paypal':
                                  return 'Pay with your PayPal account';
                                case 'cod':
                                  return 'Pay when your order arrives';
                                default:
                                  return 'Secure payment option';
                              }
                            };

                            return (
                              <div
                                key={method.id}
                                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                  paymentMethod === method.type
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => {
                                  console.log('Clicked payment method:', method.type);
                                  setPaymentMethod(method.type as PaymentMethodType);
                                  setSelectedPaymentMethodId(method.id.toString());
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={method.type}
                                    checked={paymentMethod === method.type}
                                    onChange={() => {
                                      console.log('Changed payment method:', method.type);
                                      // setPaymentMethod(method.type as PaymentMethodType);
                                      // setSelectedPaymentMethodId(method.id.toString());
                                      setPaymentMethod(method.type);
                                      setSelectedPaymentMethodId(method.id.toString());
                                    }}
                                    className="text-blue-600"
                                  />
                                  {getIcon()}
                                  <div>
                                    <div className="font-medium text-gray-900">{method.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {method.description || getDefaultDescription()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No payment methods available at the moment.</p>
                        </div>
                      )}
                    </div>

                    {/* Card Payment Fields */}
                    {paymentMethod === 'card' && (
                      <div className="space-y-4 border-t border-gray-200 pt-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cardholder Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentInfo.cardholderName}
                            onChange={(e) => setPaymentInfo({...paymentInfo, cardholderName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter cardholder name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="1234 5678 9012 3456"
                            value={paymentInfo.cardNumber}
                            onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: formatCardNumber(e.target.value)})}
                            maxLength={19}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expiry Date *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="MM/YY"
                              value={paymentInfo.expiryDate}
                              onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: formatExpiryDate(e.target.value)})}
                              maxLength={5}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="123"
                              value={paymentInfo.cvv}
                              onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value.replace(/\D/g, '')})}
                              maxLength={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PayPal Payment Fields */}
                    {/* {paymentMethod === 'paypal' && (
                      <div className="space-y-4 border-t border-gray-200 pt-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            PayPal Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={paypalInfo.email}
                            onChange={(e) => setPaypalInfo({...paypalInfo, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your PayPal email"
                          />
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-blue-800">
                            <Wallet className="w-4 h-4" />
                            <span className="text-sm font-medium">PayPal Payment</span>
                          </div>
                          <p className="text-xs text-blue-700 mt-1">
                            You will be redirected to PayPal to complete your payment securely.
                          </p>
                        </div>
                      </div>
                    )} */}

                    {/* Cash on Delivery Info */}
                    {/* {paymentMethod === 'cod' && (
                      <div className="border-t border-gray-200 pt-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-amber-800">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm font-medium">Cash on Delivery</span>
                          </div>
                          <p className="text-xs text-amber-700 mt-1">
                            Pay in cash when your order is delivered to your doorstep. Please have the exact amount ready.
                          </p>
                        </div>
                      </div>
                    )} */}

                    {/* Billing Address Checkbox (only for card payments) */}
                    {paymentMethod === 'card' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="billingAddress"
                          checked={billingAddressSame}
                          onChange={(e) => setBillingAddressSame(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="billingAddress" className="text-sm text-gray-700">
                          Billing address is the same as shipping address
                        </label>
                      </div>
                    )}

                    {/* Security Info */}
                    {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm font-medium">Secure Payment</span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        {paymentMethod === 'card' && 'Your payment information is encrypted and secure. We never store your card details.'}
                        {paymentMethod === 'paypal' && 'Your PayPal payment is processed securely through PayPal\'s encrypted servers.'}
                        {paymentMethod === 'cod' && 'Cash on delivery is a secure payment option. Pay only when you receive your order.'}
                      </p>
                    </div> */}

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          {paymentMethod === 'card' && <CreditCard className="w-4 h-4" />}
                          {paymentMethod === 'paypal' && <Wallet className="w-4 h-4" />}
                          {/* {paymentMethod === 'cod' && <DollarSign className="w-4 h-4" />} */}
                          {paymentMethod === 'card' && `Pay Now - ৳${getTotal().toFixed(2)}`}
                          {paymentMethod === 'paypal' && `Pay with PayPal - ৳${getTotal().toFixed(2)}`}
                          {paymentMethod === 'cod' && `Place Order - ৳${getTotal().toFixed(2)}`}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Cart Items - Grouped by Product */}
              <div className="space-y-4 mb-6">
                {isHydrated ? (() => {
                  // Group items by productId
                  const groupedItems = cartItems.reduce((acc, item) => {
                    const key = item.productId || item.name;
                    if (!acc[key]) {
                      acc[key] = {
                        productId: item.productId || '',
                        name: item.name,
                        image: item.image || '', // This will be the image from the first item, but PreviewCarousel can handle both string and array
                        price: item.price,
                        items: []
                      };
                    }
                    acc[key].items.push(item);
                    return acc;
                  }, {} as Record<string, {
                    productId: string;
                    name: string;
                    image: string | string[]; // Can be single image or array
                    price: number;
                    items: typeof cartItems;
                  }>);

                  return Object.values(groupedItems).map((group) => {
                    const totalQuantity = group.items.reduce((sum, item) => sum + item.quantity, 0);
                    const totalPrice = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    
                    return (
                      <div key={group.productId || group.name} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <PreviewCarousel
                            images={group.image || `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop`}
                            alt={group.name}
                            size="sm"
                            showThumbnails={false} // Keep it simple in checkout summary
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                              {group.name}
                            </h4>
                            
                            {/* Size and quantity details */}
                            <div className="space-y-1">
                              {group.items.map((item, index) => (
                                <div key={item.id} className="text-xs text-gray-600 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {item.size && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">Size: {item.size}</span>}
                                    {item.color && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">Color: {item.color}</span>}
                                    <span className="font-medium">Qty: {item.quantity}</span>
                                  </div>
                                  <span className="text-gray-500">৳{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Total for this product */}
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-700">Total Quantity: {totalQuantity}</span>
                                <span className="font-semibold text-gray-900">৳{totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })() : (
                  <div className="border border-gray-100 rounded-lg p-3">
                    <div className="text-sm text-gray-500">Loading cart items...</div>
                  </div>
                )}
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isPromoApplied}
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={isPromoApplied || !promoCode}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
                {isPromoApplied && (
                  <div className="text-green-600 text-xs mt-1">
                    ✓ Promo code applied
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({isHydrated ? getTotalQuantity() : 0} items)</span>
                  <span className="font-medium">৳{isHydrated ? getSubtotal().toFixed(2) : '0.00'}</span>
                </div>
                
                {isPromoApplied && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount (SAVE10)</span>
                    <span>-৳{isHydrated ? getDiscount().toFixed(2) : '0.00'}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {currentStep === 2 && selectedShippingMethod 
                      ? `Shipping (${selectedShippingMethod.name})`
                      : 'Shipping'
                    }
                  </span>
                  <span className="font-medium">
                    {isHydrated && getShipping() === 0 ? 'Free' : `৳${isHydrated ? getShipping().toFixed(2) : '0.00'}`}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">৳{isHydrated ? getTax().toFixed(2) : '0.00'}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      ৳{isHydrated ? getTotal().toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="text-xs text-gray-500 text-center">
                🔒 Secure checkout with SSL encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
