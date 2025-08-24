"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FilterState {
  categories: number[];
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
}

interface ProductFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableCategories: { id: number; name: string; count: number }[];
  availableColors: string[];
  availableSizes: string[];
  priceRange: [number, number];
  onResetFilters?: () => void;
}

export const ProductFilter = ({
  filters,
  onFiltersChange,
  availableCategories,
  availableColors,
  availableSizes,
  priceRange,
  onResetFilters
}: ProductFilterProps) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    color: true,
    sizes: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const newCategories = checked 
      ? [...filters.categories, categoryId]
      : filters.categories.filter(c => c !== categoryId);
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleColorChange = (color: string, checked: boolean) => {
    const newColors = checked 
      ? [...filters.colors, color]
      : filters.colors.filter(c => c !== color);
    
    onFiltersChange({
      ...filters,
      colors: newColors
    });
  };

  const handleSizeChange = (size: string, checked: boolean) => {
    const newSizes = checked 
      ? [...filters.sizes, size]
      : filters.sizes.filter(s => s !== size);
    
    onFiltersChange({
      ...filters,
      sizes: newSizes
    });
  };

  const handlePriceChange = (min: number, max: number) => {
    onFiltersChange({
      ...filters,
      priceRange: [min, max]
    });
  };

  const colorMap: { [key: string]: string } = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    pink: '#ec4899',
    gray: '#6b7280',
    black: '#000000',
    white: '#ffffff',
    orange: '#f97316',
    brown: '#92400e',
    navy: '#1e3a8a'
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6">
      {/* Filter Header with Reset Button */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">FILTERS</h2>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Categories Filter */}
      <div className="mb-8">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full mb-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">CATEGORIES</h3>
          {expandedSections.categories ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.categories && (
          <div className="space-y-3">
            {availableCategories.map((category) => (
              <label key={category.id} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.id)}
                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">{category.name}</span>
                </div>
                <span className="text-sm text-gray-500">{category.count}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-8">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full mb-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">PRICE</h3>
          {expandedSections.price ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.price && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Min: ৳{filters.priceRange[0]}</span>
              <span>Max: ৳{filters.priceRange[1]}</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minimum Price</label>
                <input
                  type="range"
                  min={priceRange[0]}
                  max={priceRange[1]}
                  value={filters.priceRange[0]}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value);
                    if (newMin <= filters.priceRange[1]) {
                      handlePriceChange(newMin, filters.priceRange[1]);
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((filters.priceRange[0] - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100}%, #e5e7eb ${((filters.priceRange[0] - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Maximum Price</label>
                <input
                  type="range"
                  min={priceRange[0]}
                  max={priceRange[1]}
                  value={filters.priceRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    if (newMax >= filters.priceRange[0]) {
                      handlePriceChange(filters.priceRange[0], newMax);
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((filters.priceRange[1] - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100}%, #3b82f6 ${((filters.priceRange[1] - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100}%, #3b82f6 100%)`
                  }}
                />
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <input
                  type="number"
                  min={priceRange[0]}
                  max={priceRange[1]}
                  value={filters.priceRange[0]}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value) || priceRange[0];
                    if (newMin <= filters.priceRange[1] && newMin >= priceRange[0]) {
                      handlePriceChange(newMin, filters.priceRange[1]);
                    }
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  min={priceRange[0]}
                  max={priceRange[1]}
                  value={filters.priceRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value) || priceRange[1];
                    if (newMax >= filters.priceRange[0] && newMax <= priceRange[1]) {
                      handlePriceChange(filters.priceRange[0], newMax);
                    }
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Filter */}
      <div className="mb-8">
        <button
          onClick={() => toggleSection('color')}
          className="flex items-center justify-between w-full mb-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">COLOR</h3>
          {expandedSections.color ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.color && (
          <div className="grid grid-cols-6 gap-3">
            {availableColors.map((color) => (
              <label key={color} className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.colors.includes(color)}
                  onChange={(e) => handleColorChange(color, e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-8 h-8 rounded-full border-2 ${
                    filters.colors.includes(color) 
                      ? 'border-gray-900 ring-2 ring-blue-500' 
                      : 'border-gray-300'
                  } ${color === 'white' ? 'border-gray-400' : ''}`}
                  style={{ backgroundColor: colorMap[color.toLowerCase()] || color }}
                  title={color}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sizes Filter */}
      <div className="mb-8">
        <button
          onClick={() => toggleSection('sizes')}
          className="flex items-center justify-between w-full mb-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">SIZES</h3>
          {expandedSections.sizes ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.sizes && (
          <div className="grid grid-cols-3 gap-2">
            {availableSizes.map((size) => (
              <label key={size} className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.sizes.includes(size)}
                  onChange={(e) => handleSizeChange(size, e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`px-3 py-2 text-center text-sm font-medium border rounded ${
                    filters.sizes.includes(size)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {size}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
