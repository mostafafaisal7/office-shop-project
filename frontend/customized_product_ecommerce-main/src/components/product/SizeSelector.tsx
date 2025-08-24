'use client';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string;
  setSelectedSize: (size: string) => void;
}

const SizeSelector = ({ sizes, selectedSize, setSelectedSize }: SizeSelectorProps) => {
  const handleSizeClick = (size: string) => {
    // If the same size is clicked, unselect it
    if (selectedSize === size) {
      setSelectedSize('');
    } else {
      setSelectedSize(size);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-900 block mb-3">Sizes:</label>
      <div className="flex space-x-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => handleSizeClick(size)}
            className={`px-4 py-2 border rounded-md ${
              selectedSize === size
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      <div className="text-sm text-blue-600 mt-2">Size Chart</div>
    </div>
  );
};

export default SizeSelector;
