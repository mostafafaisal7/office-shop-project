'use client';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (quantity: number) => void;
}

const QuantitySelector = ({ quantity, setQuantity }: QuantitySelectorProps) => {

  return (
    <div>
      <label className="text-sm font-medium text-gray-900 block mb-3">Quantity:</label>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-900"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-16 px-3 py-2 border border-gray-300 rounded-md text-center text-gray-900"
        />
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="p-2 text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default QuantitySelector;
