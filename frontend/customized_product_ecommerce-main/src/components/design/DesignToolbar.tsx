'use client';

import React, { useState, ChangeEvent } from 'react';

interface DesignToolbarProps {
  onColorChange: (color: string) => void;
  onAddText: (text: string) => void;
  onImageUpload: (fileOrUrl: File | string) => void;
  onApplyFilter: (filter: string, value: number) => void;
  onRemoveBg: () => void;
  onCrop: () => void;
}

const DesignToolbar = ({
  onColorChange,
  onAddText,
  onImageUpload,
  onApplyFilter,
  onRemoveBg,
  onCrop,
}: DesignToolbarProps) => {
  const [textInput, setTextInput] = useState('');
  const [filterValue, setFilterValue] = useState(0);
  const [colorValue, setColorValue] = useState('#000000'); // ✅ FIX: Add state for color input

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
  };

  const handleAddText = () => {
    if (textInput.trim()) {
      onAddText(textInput.trim());
      setTextInput('');
    }
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setColorValue(e.target.value); // ✅ FIX: Update state
    onColorChange(e.target.value);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setFilterValue(value);
    onApplyFilter('brightness', value);
  };

  return (
    <div className="flex flex-col space-y-4 p-4 bg-gray-100 rounded-md">
      <div>
        <label htmlFor="colorPicker" className="block mb-1 font-semibold text-gray-700">
          Color Picker
        </label>
        <input
          id="colorPicker"
          type="color"
          value={colorValue}
          onChange={handleColorChange}
          className="w-full h-8 cursor-pointer"
        />
      </div>

      <div>
        <label htmlFor="textInput" className="block mb-1 font-semibold text-gray-700">
          Text Tool
        </label>
        <input
          id="textInput"
          type="text"
          value={textInput}
          onChange={handleTextChange}
          placeholder="Enter text"
          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700"
        />
        <button
          onClick={handleAddText}
          className="mt-2 w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
        >
          Add Text
        </button>
      </div>

      <div className='text-gray-700'>
        <label htmlFor="imageUpload" className="block mb-1 font-semibold">
          Image Upload
        </label>
        <input
          id="imageUpload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="brightness" className="block mb-1 font-semibold text-gray-700">
          Brightness
        </label>
        <input
          id="brightness"
          type="range"
          min={-1}
          max={1}
          step={0.1}
          value={filterValue}
          onChange={handleFilterChange}
          className="w-full"
        />
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onCrop}
          className="flex-1 bg-gray-500 py-1 rounded hover:bg-gray-700"
        >
          Crop
        </button>
        <button
          onClick={onRemoveBg}
          className="flex-1 bg-gray-500 py-1 rounded hover:bg-gray-700"
        >
          Remove BG
        </button>
      </div>
    </div>
  );
};

export default DesignToolbar;