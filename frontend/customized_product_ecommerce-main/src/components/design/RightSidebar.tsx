'use client';

import React, { useState } from 'react';
import { 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, 
  DollarSign, Copy, Trash, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  RotateCw, Maximize, MinusCircle, Type, ChevronDown, ChevronRight,
  Move, Palette, Settings, ChevronsUp, ChevronUp, ChevronDown as ChevronDownIcon, ChevronsDown,
  ImageIcon, AlertCircle
} from 'lucide-react';
import { useDesignStore } from '@/store/designStore';

interface RightSidebarProps {
  onSave: () => void;
  onClearCanvas: () => void;
  onTextFormat: (format: string) => void;
  onPosition: (position: string) => void;
  onLayer: (action: string) => void;
  onTextColorChange: (color: string) => void;
  onFontChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onImageAction?: (action: string) => void;
  onImageAdjust?: (property: string, value: number) => void;
  selectedObjectType?: string | null;
}

const RightSidebar = ({
  onSave,
  onClearCanvas,
  onTextFormat,
  onPosition,
  onLayer,
  onTextColorChange,
  onFontChange,
  onFontSizeChange,
  onImageAction,
  onImageAdjust,
  selectedObjectType
}: RightSidebarProps) => {
  
  // Get design store functions
  const { validateVariationSelection, syncStatus } = useDesignStore();
  
  // State for error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  
  // Enhanced save handler with validation
  const handleSave = async () => {
    try {
      // Clear any previous errors
      setErrorMessage(null);
      setShowError(false);
      
      // Validate variation selection before saving
      const validation = validateVariationSelection();
      if (!validation.isValid) {
        setErrorMessage(validation.error || 'Please select a product variation before saving your design');
        setShowError(true);
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
          setShowError(false);
        }, 5000);
        
        return;
      }
      
      // Call the original save function
      await onSave();
      
    } catch (error) {
      console.error('Save error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save design. Please try again.';
      setErrorMessage(errorMsg);
      setShowError(true);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setShowError(false);
      }, 5000);
    }
  };
  
  // Popular Google Fonts list
  const googleFonts = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Oswald',
    'Source Sans Pro',
    'Raleway',
    'PT Sans',
    'Lora',
    'Merriweather',
    'Playfair Display',
    'Poppins',
    'Nunito',
    'Ubuntu',
    'Crimson Text',
    'Dancing Script',
    'Pacifico',
    'Lobster',
    'Righteous'
  ];

  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];
  
  // State for current font and font size
  const [currentFont, setCurrentFont] = useState('Inter');
  const [currentFontSize, setCurrentFontSize] = useState(40);
  
  // State for image adjustment values
  const [imageAdjustments, setImageAdjustments] = useState({
    hue: 0,
    saturation: 100,
    brightness: 100,
    opacity: 100
  });
  
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    position: true,
    layers: true,
    text: true,
    colors: false,
    imageControls: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    onFontChange(font);
  };

  const handleFontSizeChange = (size: number) => {
    setCurrentFontSize(size);
    onFontSizeChange(size);
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 shadow-sm overflow-y-auto">
      <div className="p-3 space-y-2.5">
        {/* Position Controls */}
        <div className="border border-gray-200 rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('position')}
            className="w-full flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 rounded-t-lg"
          >
            <div className="flex items-center">
              <Move className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-medium text-gray-800">Position</span>
            </div>
            {expandedSections.position ? (
              <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            )}
          </button>
          {expandedSections.position && (
            <div className="p-3 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-1">
                <button 
                  onClick={() => onPosition('left')} 
                  className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  title="Align Left"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                </button>
                <button 
                  onClick={() => onPosition('center')} 
                  className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  title="Center"
                >
                  <Maximize className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                </button>
                <button 
                  onClick={() => onPosition('right')} 
                  className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  title="Align Right"
                >
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                </button>
                <button 
                  onClick={() => onPosition('top')} 
                  className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  title="Align Top"
                >
                  <ArrowUp className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                </button>
                <button 
                  onClick={() => onPosition('middle')} 
                  className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  title="Middle"
                >
                  <MinusCircle className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                </button>
                <button 
                  onClick={() => onPosition('bottom')} 
                  className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  title="Align Bottom"
                >
                  <ArrowDown className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Selected Text Button */}
        <button 
          onClick={() => onLayer('delete')} 
          className="w-full p-2.5 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-md border border-red-200 hover:border-red-300 transition-all duration-200 group flex items-center justify-center shadow-sm hover:shadow-md"
          title="Delete Selected Text"
        >
          <Trash className="w-4 h-4 text-red-600 mr-2 transition-colors duration-200" />
          <span className="text-sm font-medium text-red-600">Delete Selected</span>
        </button>

        {/* Layer Controls */}
        <div className="border border-gray-200 rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('layers')}
            className="w-full flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 rounded-t-lg"
          >
            <div className="flex items-center">
              <Copy className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-medium text-gray-800">Layers</span>
            </div>
            {expandedSections.layers ? (
              <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            )}
          </button>
          {expandedSections.layers && (
            <div className="p-3 border-t border-gray-200 space-y-2.5">
              {/* Duplicate Button */}
              <button 
                onClick={() => onLayer('duplicate')} 
                className="w-full p-2.5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group flex items-center justify-center shadow-sm hover:shadow-md"
                title="Duplicate Layer"
              >
                <Copy className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mr-2 transition-colors duration-200" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Duplicate</span>
              </button>

              {/* Layer Ordering Buttons */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">Layer Order</label>
                <div className="grid grid-cols-4 gap-1">
                  <button 
                    onClick={() => onLayer('bringToFront')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Bring to Front"
                  >
                    <ChevronsUp className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                  <button 
                    onClick={() => onLayer('bringForward')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Bring Forward"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                  <button 
                    onClick={() => onLayer('sendBackward')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Send Backward"
                  >
                    <ChevronDownIcon className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                  <button 
                    onClick={() => onLayer('sendToBack')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Send to Back"
                  >
                    <ChevronsDown className="w-4 h-4 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Image Controls - Only show when image is selected */}
        {selectedObjectType === 'image' && (
        <div className="border border-gray-200 rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('imageControls')}
            className="w-full flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 rounded-t-lg"
          >
            <div className="flex items-center">
              <ImageIcon className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-medium text-gray-800">Image</span>
            </div>
            {expandedSections.imageControls ? (
              <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            )}
          </button>
          {expandedSections.imageControls && (
            <div className="p-3 border-t border-gray-200 space-y-3">
              {/* Image Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => onImageAction?.('replace')}
                  className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 text-xs font-medium text-gray-700 hover:text-blue-700"
                >
                  Replace
                </button>
                <button 
                  onClick={() => onImageAction?.('crop')}
                  className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 text-xs font-medium text-gray-700 hover:text-blue-700"
                >
                  Crop
                </button>
                <button 
                  onClick={() => onImageAction?.('removeBg')}
                  className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 text-xs font-medium text-gray-700 hover:text-blue-700"
                >
                  Remove BG
                </button>
                <button 
                  onClick={() => onImageAction?.('sharpen')}
                  className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 text-xs font-medium text-gray-700 hover:text-blue-700"
                >
                  Sharpen
                </button>
              </div>
              
              {/* Adjust Controls */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 tracking-wide">Adjust</label>
                
                {/* Hue */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Hue</span>
                    <span className="text-xs text-gray-500">{imageAdjustments.hue}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={imageAdjustments.hue}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setImageAdjustments(prev => ({ ...prev, hue: value }));
                      onImageAdjust?.('hue', value);
                    }}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                {/* Saturation */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Saturation</span>
                    <span className="text-xs text-gray-500">{imageAdjustments.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={imageAdjustments.saturation}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setImageAdjustments(prev => ({ ...prev, saturation: value }));
                      onImageAdjust?.('saturation', value);
                    }}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Brightness</span>
                    <span className="text-xs text-gray-500">{imageAdjustments.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={imageAdjustments.brightness}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setImageAdjustments(prev => ({ ...prev, brightness: value }));
                      onImageAdjust?.('brightness', value);
                    }}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                {/* Opacity */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Opacity</span>
                    <span className="text-xs text-gray-500">{imageAdjustments.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={imageAdjustments.opacity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setImageAdjustments(prev => ({ ...prev, opacity: value }));
                      onImageAdjust?.('opacity', value);
                    }}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Text Formatting - Only show when text is selected */}
        {selectedObjectType === 'text' && (
        <div className="border border-gray-200 rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('text')}
            className="w-full flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 rounded-t-lg"
          >
            <div className="flex items-center">
              <Type className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-medium text-gray-800">Text</span>
            </div>
            {expandedSections.text ? (
              <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            )}
          </button>
          {expandedSections.text && (
            <div className="p-3 border-t border-gray-200 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 tracking-wide">Font</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 text-gray-700"
                    value={currentFont}
                    onChange={(e) => handleFontChange(e.target.value)}
                  >
                    {googleFonts.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 tracking-wide">Size</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 text-gray-700"
                    value={currentFontSize}
                    onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                  >
                    {fontSizes.slice(4, 10).map((size) => (
                      <option key={size} value={size}>
                        {size}px
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">Style</label>
                <div className="grid grid-cols-3 gap-1">
                  <button 
                    onClick={() => onTextFormat('bold')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Bold"
                  >
                    <Bold className="w-3 h-3 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                  <button 
                    onClick={() => onTextFormat('italic')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Italic"
                  >
                    <Italic className="w-3 h-3 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                  <button 
                    onClick={() => onTextFormat('underline')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Underline"
                  >
                    <Underline className="w-3 h-3 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">Align</label>
                <div className="grid grid-cols-3 gap-1">
                  <button 
                    onClick={() => onTextFormat('alignLeft')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Align Left"
                  >
                    <AlignLeft className="w-3 h-3 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                  <button 
                    onClick={() => onTextFormat('alignCenter')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Align Center"
                  >
                    <AlignCenter className="w-3 h-3 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                  <button 
                    onClick={() => onTextFormat('alignRight')} 
                    className="p-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-md border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                    title="Align Right"
                  >
                    <AlignRight className="w-3 h-3 text-gray-600 group-hover:text-blue-600 mx-auto transition-colors duration-200" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Color Picker - Only show when text is selected */}
        {selectedObjectType === 'text' && (
        <div className="border border-gray-200 rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('colors')}
            className="w-full flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 rounded-t-lg"
          >
            <div className="flex items-center">
              <Palette className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-medium text-gray-800">Colors</span>
            </div>
            {expandedSections.colors ? (
              <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
            )}
          </button>
          {expandedSections.colors && (
            <div className="p-3 border-t border-gray-200 space-y-2.5">
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  onChange={(e) => onTextColorChange(e.target.value)}
                  className="w-10 h-10 border-2 border-gray-300 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                  title="Choose custom color"
                />
                <span className="text-sm font-medium text-gray-700">Custom Color</span>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">Quick Colors</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[
                    { color: '#000000', name: 'Black' },
                    { color: '#FFFFFF', name: 'White' },
                    { color: '#EF4444', name: 'Red' },
                    { color: '#22C55E', name: 'Green' },
                    { color: '#3B82F6', name: 'Blue' },
                    { color: '#EAB308', name: 'Yellow' },
                    { color: '#EC4899', name: 'Pink' },
                    { color: '#06B6D4', name: 'Cyan' },
                    { color: '#F97316', name: 'Orange' },
                    { color: '#8B5CF6', name: 'Purple' },
                    { color: '#84CC16', name: 'Lime' },
                    { color: '#6B7280', name: 'Gray' }
                  ].map((colorItem) => (
                    <button
                      key={colorItem.color}
                      onClick={() => onTextColorChange(colorItem.color)}
                      className="w-7 h-7 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{ backgroundColor: colorItem.color }}
                      title={colorItem.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Error Message */}
        {showError && errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <button 
            onClick={handleSave}
            disabled={syncStatus === 'syncing'}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm ${
              syncStatus === 'syncing'
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
            }`}
          >
            {syncStatus === 'syncing' ? 'Saving...' : 'Save Design'}
          </button>
          <button 
            onClick={onClearCanvas}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            Clear Canvas
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
