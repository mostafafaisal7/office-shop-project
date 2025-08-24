'use client';

interface ColorSelectorProps {
  colors: { name: string; color: string }[];
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

const ColorSelector = ({ colors, selectedColor, setSelectedColor }: ColorSelectorProps) => {
  const handleColorClick = (colorName: string) => {
    // If the same color is clicked, unselect it
    if (selectedColor === colorName) {
      setSelectedColor('');
    } else {
      setSelectedColor(colorName);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-900 block mb-3">Color:</label>
      <div className="flex space-x-2">
        {colors.map((color) => (
          <button
            key={color.name}
            onClick={() => handleColorClick(color.name)}
            className={`w-8 h-8 rounded-full border-2 ${
              selectedColor === color.name ? 'border-gray-900' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color.color }}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;
