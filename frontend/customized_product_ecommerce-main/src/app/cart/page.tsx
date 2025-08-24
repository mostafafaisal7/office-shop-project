'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, CreditCard, Truck, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface GroupedCartItem {
  productId: string;
  name: string;
  image?: string;
  color?: string;
  customDesign?: boolean;
  sizes: Array<{
    size: string;
    quantity: number;
    price: number;
    itemId: string;
  }>;
  totalQuantity: number;
  totalPrice: number;
}

export default function CartPage() {
  const router = useRouter();
  const { 
    items: cartItems, 
    updateQuantity, 
    removeItem, 
    getTotalQuantity, 
    getTotalPrice,
    isGeneratingPreviews,
    previewGenerationProgress,
    initializeCart
  } = useCartStore();

  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);

  // Initialize cart when component mounts
  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  // Group cart items by product and color
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: GroupedCartItem } = {};
    
    cartItems.forEach(item => {
      const groupKey = `${item.productId}-${item.color || 'default'}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          productId: item.productId,
          name: item.name,
          image: item.image,
          color: item.color,
          customDesign: item.customDesign,
          sizes: [],
          totalQuantity: 0,
          totalPrice: 0
        };
      }
      
      groups[groupKey].sizes.push({
        size: item.size || 'One Size',
        quantity: item.quantity,
        price: item.price,
        itemId: item.id
      });
      
      groups[groupKey].totalQuantity += item.quantity;
      groups[groupKey].totalPrice += item.price * item.quantity;
    });
    
    // Sort sizes within each group
    Object.values(groups).forEach(group => {
      group.sizes.sort((a, b) => {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
        const aIndex = sizeOrder.indexOf(a.size);
        const bIndex = sizeOrder.indexOf(b.size);
        if (aIndex === -1 && bIndex === -1) return a.size.localeCompare(b.size);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    });
    
    return Object.values(groups);
  }, [cartItems]);

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
  };

  const getSubtotal = () => {
    return getTotalPrice();
  };

  const getCartTotalQuantity = () => {
    return getTotalQuantity();
  };

  const getShipping = () => {
    const subtotal = getSubtotal();
    return subtotal > 100 ? 0 : 15.99; // Free shipping over ৳100
  };

  const getTax = () => {
    return getSubtotal() * 0.08; // 8% tax
  };

  const getDiscount = () => {
    return isPromoApplied ? getSubtotal() * 0.1 : 0; // 10% discount
  };

  const getTotal = () => {
    return getSubtotal() + getShipping() + getTax() - getDiscount();
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'save10') {
      setIsPromoApplied(true);
    } else {
      alert('Invalid promo code');
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  if (cartItems.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="bg-white rounded-lg shadow-sm p-12">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <button
              onClick={handleContinueShopping}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="text-gray-500">({getCartTotalQuantity()} items)</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Preview Generation Status */}
        {isGeneratingPreviews && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-blue-800 font-medium">Generating custom design previews...</p>
                <p className="text-blue-600 text-sm">Your designed images will appear shortly.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {groupedItems.map((group, groupIndex) => (
              <div key={`${group.productId}-${group.color || 'default'}`} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img
                      src={group.image || `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop`}
                      alt={group.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to a default product image if the design image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop';
                      }}
                    />
                    {/* Loading overlay for individual items */}
                    {group.sizes.some(size => previewGenerationProgress[size.itemId]) && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {group.name}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {/* Size Information */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="font-medium">Sizes:</span>
                        {group.sizes.map((sizeInfo, index) => (
                          <span key={sizeInfo.itemId} className="inline-flex items-center">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                              {sizeInfo.size} ({sizeInfo.quantity})
                            </span>
                            {index < group.sizes.length - 1 && <span className="mx-1 text-gray-400">•</span>}
                          </span>
                        ))}
                      </div>
                      {group.color && <div>Color: {group.color}</div>}
                      {group.customDesign && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Custom Design Applied
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 mt-2">
                      {group.sizes.length > 1 ? (
                        <span className="text-blue-600">Various prices</span>
                      ) : (
                        <span>৳{group.sizes[0].price.toFixed(2)} each</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <div className="text-sm text-gray-600 text-right">
                      Total: {group.totalQuantity} items
                    </div>
                    <button
                      onClick={() => {
                        // Remove all sizes of this product
                        group.sizes.forEach(sizeInfo => {
                          handleRemoveItem(sizeInfo.itemId);
                        });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove all sizes"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Individual Size Controls */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    {group.sizes.map((sizeInfo) => (
                      <div key={sizeInfo.itemId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                            {sizeInfo.size}:
                          </span>
                          <span className="text-sm text-gray-600">
                            ৳{sizeInfo.price.toFixed(2)} each
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity(sizeInfo.itemId, sizeInfo.quantity - 1)}
                              className="p-1 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={sizeInfo.quantity <= 1}
                            >
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                            <input
                              type="number"
                              value={sizeInfo.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 1;
                                if (newQuantity >= 1) {
                                  handleUpdateQuantity(sizeInfo.itemId, newQuantity);
                                }
                              }}
                              className="w-12 px-1 py-1 text-center text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                              min="1"
                            />
                            <button
                              onClick={() => handleUpdateQuantity(sizeInfo.itemId, sizeInfo.quantity + 1)}
                              className="p-1 hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveItem(sizeInfo.itemId)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remove this size"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          
                          <span className="text-sm font-medium text-gray-900 min-w-[60px] text-right">
                            ৳{(sizeInfo.price * sizeInfo.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group Total */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Product Total:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ৳{group.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <button
              onClick={handleContinueShopping}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Continue Shopping
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    disabled={isPromoApplied}
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={isPromoApplied || !promoCode}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
                {isPromoApplied && (
                  <div className="text-green-600 text-sm mt-1">
                    ✓ Promo code applied
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({getCartTotalQuantity()} items)</span>
                  <span className="font-medium">৳{getSubtotal().toFixed(2)}</span>
                </div>
                
                {isPromoApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount (SAVE10)</span>
                    <span>-৳{getDiscount().toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {getShipping() === 0 ? 'Free' : `৳${getShipping().toFixed(2)}`}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">৳{getTax().toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      ৳{getTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              {getShipping() === 0 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm mb-6">
                  <Truck className="w-4 h-4" />
                  <span>Free shipping on this order!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
                  <Truck className="w-4 h-4" />
                  <span>Free shipping on orders over ৳100</span>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Proceed to Checkout
              </button>

              {/* Security Info */}
              <div className="text-xs text-gray-500 text-center mt-4">
                🔒 Secure checkout with SSL encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
