'use client';

import React, { useState, useEffect } from 'react';
import { X, Truck, Save, AlertCircle } from 'lucide-react';
import { shippingApi, ShippingMethod, ProductShippingCostCalculation, ShippingProductCostRequest } from '@/services/shippingApi';
import { useToast } from '@/contexts/ToastContext';
import { OrderItem } from '@/types/orders';

interface ShippingMethodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentMethodId: number;
  currentCost: number;
  orderItems: OrderItem[];
  onMethodSelected: (method: ShippingMethod, cost: number, costData: ProductShippingCostCalculation | null) => void;
}

export default function ShippingMethodSelector({
  isOpen,
  onClose,
  currentMethodId,
  currentCost,
  orderItems,
  onMethodSelected
}: ShippingMethodSelectorProps) {
  const { showToast } = useToast();
  const [availableShippingMethods, setAvailableShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(currentMethodId.toString());
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(currentCost);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingCostData, setShippingCostData] = useState<ProductShippingCostCalculation | null>(null);

  // Load available shipping methods
  useEffect(() => {
    const loadShippingMethods = async () => {
      if (!isOpen) return;

      setIsLoadingMethods(true);
      try {
        const response = await shippingApi.getShippingMethods();
        
        if (response.success && response.data) {
          // Filter only active shipping methods
          const activeShippingMethods = response.data.filter((method: ShippingMethod) => method.is_active);
          setAvailableShippingMethods(activeShippingMethods);
          
          // Find current method
          const currentMethod = activeShippingMethods.find((method: ShippingMethod) => method.id === currentMethodId);
          if (currentMethod) {
            setSelectedMethod(currentMethod);
            // Calculate shipping cost for the current method to ensure proper display
            await calculateShippingCost(currentMethod.id);
          }
        } else {
          console.log('No shipping methods found or error:', response.message);
          setAvailableShippingMethods([]);
        }
      } catch (error) {
        console.error('Error loading shipping methods:', error);
        setAvailableShippingMethods([]);
        showToast('Failed to load shipping methods', 'error');
      } finally {
        setIsLoadingMethods(false);
      }
    };

    loadShippingMethods();
  }, [isOpen, currentMethodId]);

  // Function to calculate shipping cost using the product-specific endpoint
  const calculateShippingCost = async (methodId: number) => {
    setIsCalculatingShipping(true);
    try {
      // Transform order items to the required format for the shipping cost calculation
      const items = orderItems.map(item => ({
        product_id: item.product_id,
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
    setSelectedMethodId(method.id.toString());
    setSelectedMethod(method);
    await calculateShippingCost(method.id);
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onMethodSelected(selectedMethod, shippingCost, shippingCostData);
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-lg bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Choose Shipping Method
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        {isLoadingMethods ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading shipping methods...</p>
          </div>
        ) : availableShippingMethods.length > 0 ? (
          <div className="space-y-6">
            {/* Shipping Methods */}
            <div className="space-y-4">
              {availableShippingMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethodId === method.id.toString()
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => handleShippingMethodSelect(method)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="radio"
                        name="shippingMethod"
                        checked={selectedMethodId === method.id.toString()}
                        onChange={() => handleShippingMethodSelect(method)}
                        className="mt-1 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{method.name}</h4>
                          <div className="text-right">
                            {isCalculatingShipping && selectedMethodId === method.id.toString() ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-gray-500">Calculating...</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {selectedMethodId === method.id.toString() && (shippingCost >= 0 || shippingCostData)
                                  ? formatCurrency(shippingCost)
                                  : formatCurrency(method.cost || method.base_cost || 0)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{method.description}</p>
                        
                        {/* Cost breakdown for selected method */}
                        {selectedMethodId === method.id.toString() && shippingCostData && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mt-3">
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Product Breakdown:</div>
                              
                              {/* Show product breakdown */}
                              {shippingCostData.product_breakdown.map((product, index) => {
                                // Find the corresponding order item to get the product name
                                const orderItem = orderItems.find(item => item.product_id === product.product_id);
                                const productName = orderItem ? orderItem.product_name : `Product ${product.product_id}`;
                                
                                return (
                                  <div key={`${product.product_id}-${index}`} className="ml-2 mb-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="font-medium">{productName}</span>
                                      <span>Qty: {product.quantity}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span>Base cost: {formatCurrency(product.base_cost)}</span>
                                      <span className="font-medium">Final: {formatCurrency(product.final_cost)}</span>
                                    </div>
                                    {product.applied_rules && product.applied_rules.length > 0 && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <div className="font-medium mb-1">Applied Rules:</div>
                                        {product.applied_rules.map((rule: any, ruleIndex: number) => (
                                          <div key={ruleIndex} className="ml-2 mb-1">
                                            <div className="text-xs">
                                              Qty {rule.min_quantity}-{rule.max_quantity || '∞'}: 
                                              <span className="ml-1">
                                                {rule.adjustment_type === 'per_item' 
                                                  ? `+${formatCurrency(rule.cost_adjustment)}/item` 
                                                  : `+${formatCurrency(rule.cost_adjustment)}`
                                                }
                                              </span>
                                              <span className="ml-1 text-green-600 dark:text-green-400 font-medium">
                                                (+{formatCurrency(rule.total_adjustment)})
                                              </span>
                                            </div>
                                            <div className="text-xs text-gray-400 ml-1">
                                              Applied to {rule.applicable_quantity} items
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Source: {product.rule_source}
                                    </div>
                                  </div>
                                );
                              })}
                              
                              <div className="flex justify-between font-medium border-t border-gray-200 dark:border-gray-600 pt-1 mt-2">
                                <span>Total shipping:</span>
                                <span>{formatCurrency(shippingCostData.total_cost)}</span>
                              </div>
                              
                              {shippingCostData.delivery_days && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
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
            </div>
            
            {/* Shipping info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                <Truck className="w-4 h-4" />
                <span className="text-sm font-medium">Shipping Information</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Shipping costs are calculated based on your specific products and quantities ({orderItems.reduce((sum, item) => sum + item.quantity, 0)} items total). 
                Different products may have different shipping characteristics and costs.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleConfirm}
                disabled={!selectedMethod || isCalculatingShipping}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Update Shipping Method
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No shipping methods available at the moment.</p>
            <p className="text-xs text-gray-400 mt-1">Please try again later or contact support.</p>
          </div>
        )}
      </div>
    </div>
  );
}
