'use client';

import React, { useState } from 'react';
import { ImageIcon, Type, Palette, Grid, Users, Search, Upload } from 'lucide-react';

interface LeftSidebarProps {
  onAddText: (text: string) => void;
  onImageUpload: (file: File) => void;
  onImageClick: (imageUrl: string) => void;
  onDesignColor: (color: string) => void;
  onElements: () => void;
  onNames: () => void;
}

const LeftSidebar = ({
  onAddText,
  onImageUpload,
  onImageClick,
  onDesignColor,
  onElements,
  onNames,
}: LeftSidebarProps) => {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('blue');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create preview URL for the uploaded image and store it locally
      const imageUrl = URL.createObjectURL(file);
      setUploadedImages(prev => [...prev, imageUrl]);
      
      // Call the onImageUpload callback for any additional processing
      onImageUpload(file);
    }
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'text':
        return (
          <div className="w-[250px] border-r bg-white shadow-sm">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <Type className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Text</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Edit your text below, or click on the field you'd like to edit directly on your design.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-3">Enter Text</label>
                  <input
                    type="text"
                    placeholder="Write your text here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-5 py-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700 shadow-sm"
                  />
                </div>
                <button
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg text-base font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => onAddText(textInput || 'Sample Text')}
                >
                  Add Text Field
                </button>
              </div>
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="w-[250px] border-r bg-white shadow-sm">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <ImageIcon className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Images</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Upload images to add to your design. Click on uploaded images to add them to your canvas.
              </p>
              <div className="space-y-6">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-panel-upload"
                  />
                  <label
                    htmlFor="image-panel-upload"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg text-base font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Image
                  </label>
                </div>
                
                {uploadedImages.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold text-gray-700 mb-4">Uploaded Images</h4>
                    <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                      {uploadedImages.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                          onClick={() => onImageClick(imageUrl)}
                        >
                          <img
                            src={imageUrl}
                            alt={`Uploaded image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {uploadedImages.length === 0 && (
                  <div className="text-center py-8">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No images uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      // case 'elements':
      //   return (
      //     <div className="w-[250px] border-r bg-white shadow-sm">
      //       <div className="p-8">
      //         <div className="flex items-center mb-4">
      //           <Grid className="w-5 h-5 text-blue-600 mr-2" />
      //           <h3 className="text-lg font-semibold text-gray-800">Elements</h3>
      //         </div>
      //         <p className="text-sm text-gray-600 mb-6 leading-relaxed">
      //           Add shapes and design elements to your project.
      //         </p>
      //         <div className="space-y-6">
      //           <div>
      //             <div className="relative mb-6">
      //               <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      //               <input
      //                 type="text"
      //                 placeholder="Search elements..."
      //                 className="w-full border border-gray-300 rounded-lg pl-12 pr-5 py-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
      //               />
      //             </div>
      //           </div>
                
      //           <div>
      //             <h4 className="text-base font-semibold text-gray-700 mb-4">Recently Used</h4>
      //             <div className="grid grid-cols-4 gap-4">
      //               {Array(8).fill(0).map((_, i) => (
      //                 <div key={i} className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"></div>
      //               ))}
      //             </div>
      //           </div>
                
      //           <div>
      //             <h4 className="text-base font-semibold text-gray-700 mb-4">Basic Shapes</h4>
      //             <div className="grid grid-cols-3 gap-4">
      //               {[
      //                 { symbol: '□', name: 'Rectangle' },
      //                 { symbol: '○', name: 'Circle' },
      //                 { symbol: '△', name: 'Triangle' },
      //                 { symbol: '★', name: 'Star' },
      //                 { symbol: '→', name: 'Arrow' },
      //                 { symbol: '/', name: 'Line' }
      //               ].map((shape, i) => (
      //                 <button 
      //                   key={i} 
      //                   className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border border-blue-200 transition-all duration-200 hover:shadow-md text-blue-700 font-semibold text-xl"
      //                   title={`Add ${shape.name}`}
      //                 >
      //                   {shape.symbol}
      //                 </button>
      //               ))}
      //             </div>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   );
      // case 'designColor':
      //   return (
      //     <div className="w-[250px] border-r bg-white shadow-sm">
      //       <div className="p-8">
      //         <div className="flex items-center mb-4">
      //           <Palette className="w-5 h-5 text-blue-600 mr-2" />
      //           <h3 className="text-lg font-semibold text-gray-800">Material Color</h3>
      //         </div>
      //         <p className="text-sm text-gray-600 mb-6 leading-relaxed">
      //           Choose a color for your design material or background.
      //         </p>
      //         <div className="space-y-6">
      //           <div>
      //             <label className="block text-base font-medium text-gray-700 mb-4">Color Palette</label>
      //             <div className="grid grid-cols-6 gap-4">
      //               {['#ef4444', '#000000', '#f97316', '#8b5cf6', '#22c55e', '#ec4899', 
      //                 '#06b6d4', '#3b82f6', '#84cc16', '#6366f1', '#1e40af', '#eab308'].map((color, index) => {
      //                 const colorNames = ['red', 'black', 'orange', 'purple', 'green', 'pink', 
      //                   'cyan', 'blue', 'lime', 'violet', 'navy', 'yellow'];
      //                 return (
      //                   <button
      //                     key={color}
      //                     className={`w-12 h-12 rounded-xl border-2 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md ${
      //                       selectedColor === colorNames[index] ? 'border-gray-800 ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'
      //                     }`}
      //                     style={{ backgroundColor: color }}
      //                     onClick={() => {
      //                       setSelectedColor(colorNames[index]);
      //                       onDesignColor(colorNames[index]);
      //                     }}
      //                     title={`Select ${colorNames[index]} color`}
      //                   />
      //                 );
      //               })}
      //             </div>
      //           </div>
      //           <div className="bg-gray-50 rounded-xl p-5">
      //             <p className="text-base text-gray-700">
      //               Selected: <span className="font-semibold capitalize text-blue-600">{selectedColor}</span>
      //             </p>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   );
      // case 'names':
      //   return (
      //     <div className="w-[400px] border-r bg-white shadow-sm">
      //       <div className="p-8">
      //         <div className="flex items-center mb-4">
      //           <Users className="w-5 h-5 text-blue-600 mr-2" />
      //           <h3 className="text-lg font-semibold text-gray-800">Names & Sizes</h3>
      //         </div>
      //         <p className="text-sm text-gray-600 mb-6 leading-relaxed">
      //           Enter your full list and sizes for accurate pricing.
      //         </p>
      //         <div className="space-y-6">
      //           <div className="grid grid-cols-3 gap-4 mb-6">
      //             <div className="text-base font-semibold text-gray-700 bg-gray-50 p-3 rounded-xl text-center">Name</div>
      //             <div className="text-base font-semibold text-gray-700 bg-gray-50 p-3 rounded-xl text-center">Qty</div>
      //             <div className="text-base font-semibold text-gray-700 bg-gray-50 p-3 rounded-xl text-center">Size</div>
      //           </div>
      //           <div className="space-y-4 max-h-64 overflow-y-auto">
      //             {Array(6).fill(0).map((_, i) => (
      //               <div key={i} className="grid grid-cols-3 gap-4 text-gray-700">
      //                 <input 
      //                   className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" 
      //                   placeholder="Enter name..." 
      //                 />
      //                 <input 
      //                   className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" 
      //                   defaultValue="1" 
      //                   type="number"
      //                   min="1"
      //                 />
      //                 <select className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm">
      //                   <option value="">Select Size</option>
      //                   <option value="XS">XS</option>
      //                   <option value="S">S</option>
      //                   <option value="M">M</option>
      //                   <option value="L">L</option>
      //                   <option value="XL">XL</option>
      //                   <option value="XXL">XXL</option>
      //                 </select>
      //               </div>
      //             ))}
      //           </div>
      //           <div className="flex justify-between items-center pt-6 border-t border-gray-200">
      //             <button className="text-blue-600 text-base font-medium hover:text-blue-700 transition-colors">
      //               + Add New Row
      //             </button>
      //             <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg text-base font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg">
      //               Done
      //             </button>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-white shadow-sm">
      <div className="w-20 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 flex flex-col items-center py-6 space-y-4">
        <button
          onClick={() => setActivePanel(activePanel === 'text' ? null : 'text')}
          className={`group relative p-3 rounded-xl transition-all duration-200 ${
            activePanel === 'text' 
              ? 'bg-blue-100 text-blue-600 shadow-md' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Add Text"
        >
          <Type className="w-6 h-6 mx-auto" />
          <span className="text-xs mt-1 block font-medium">Add text</span>
          {activePanel === 'text' && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full ml-1"></div>
          )}
        </button>

        <button
          onClick={() => setActivePanel(activePanel === 'image' ? null : 'image')}
          className={`group relative p-3 rounded-xl transition-all duration-200 ${
            activePanel === 'image' 
              ? 'bg-blue-100 text-blue-600 shadow-md' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Images"
        >
          <ImageIcon className="w-6 h-6 mx-auto" />
          <span className="text-xs mt-1 block font-medium">Image</span>
          {activePanel === 'image' && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full ml-1"></div>
          )}
        </button>

        {/* <button
          onClick={() => setActivePanel(activePanel === 'designColor' ? null : 'designColor')}
          className={`group relative p-3 rounded-xl transition-all duration-200 ${
            activePanel === 'designColor' 
              ? 'bg-blue-100 text-blue-600 shadow-md' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Design Color"
        >
          <Palette className="w-6 h-6 mx-auto" />
          <span className="text-xs mt-1 block font-medium">Design Color</span>
          {activePanel === 'designColor' && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full ml-1"></div>
          )}
        </button>

        <button
          onClick={() => setActivePanel(activePanel === 'elements' ? null : 'elements')}
          className={`group relative p-3 rounded-xl transition-all duration-200 ${
            activePanel === 'elements' 
              ? 'bg-blue-100 text-blue-600 shadow-md' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Elements"
        >
          <Grid className="w-6 h-6 mx-auto" />
          <span className="text-xs mt-1 block font-medium">Elements</span>
          {activePanel === 'elements' && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full ml-1"></div>
          )}
        </button>

        <button
          onClick={() => setActivePanel(activePanel === 'names' ? null : 'names')}
          className={`group relative p-3 rounded-xl transition-all duration-200 ${
            activePanel === 'names' 
              ? 'bg-blue-100 text-blue-600 shadow-md' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Names"
        >
          <Users className="w-6 h-6 mx-auto" />
          <span className="text-xs mt-1 block font-medium">Names</span>
          {activePanel === 'names' && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full ml-1"></div>
          )}
        </button> */}
      </div>
      {renderPanel()}
    </div>
  );
};

export default LeftSidebar;
