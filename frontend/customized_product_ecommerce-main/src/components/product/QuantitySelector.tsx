'use client';
import { memo, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (quantity: number) => void;
}

const QuantitySelector = ({ quantity, setQuantity }: QuantitySelectorProps) => {
  const handleDecrement = useCallback(() => {
    setQuantity(Math.max(1, quantity - 1));
  }, [quantity, setQuantity]);

  const handleIncrement = useCallback(() => {
    setQuantity(quantity + 1);
  }, [quantity, setQuantity]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Math.max(1, parseInt(e.target.value) || 1));
  }, [setQuantity]);

  return (
    <div>
      <label className="text-sm font-medium text-gray-900 block mb-3">Quantity:</label>
      <div className="flex items-center space-x-3">
        <button
          onClick={handleDecrement}
          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-900"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={quantity}
          onChange={handleChange}
          className="w-16 px-3 py-2 border border-gray-300 rounded-md text-center text-gray-900"
        />
        <button
          onClick={handleIncrement}
          className="p-2 text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render if quantity or setQuantity changes
export default memo(QuantitySelector, (prevProps, nextProps) => {
  return (
    prevProps.quantity === nextProps.quantity &&
    prevProps.setQuantity === nextProps.setQuantity
  );
});
