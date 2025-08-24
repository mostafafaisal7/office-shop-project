'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeChartModal({ isOpen, onClose }: SizeChartModalProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black/80 bg-opacity-30 transition-opacity duration-300"
        onClick={handleBackdropClick}
      />
      
      {/* Modal Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Size Chart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* T-shirt Diagram */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* T-shirt Chart Image */}
                <img
                  src="/uploads/chart.png"
                  alt="T-shirt size chart diagram"
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxWidth: '300px' }}
                />
              </div>
            </div>

            {/* Measurement Note */}
            <div className="text-center text-sm text-gray-600 mb-4">
              Measurements shown in the chart reflect the size of the garment, not the wearer.
            </div>
          </div>

          {/* Measurement Explanations */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Length (A):</h3>
              <p className="text-gray-700 text-sm">from high point on shoulder hem to bottom hem on the back.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Width (B):</h3>
              <p className="text-gray-700 text-sm">from side to side just below the sleeves (when placed flat).</p>
            </div>
          </div>

          {/* Size Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 font-semibold text-gray-900">Size</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-900">
                    Length (A)
                    <div className="text-xs font-normal text-gray-600">in</div>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-900">
                    Width (B)
                    <div className="text-xs font-normal text-gray-600">in</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-2 font-medium text-gray-900">S</td>
                  <td className="py-3 px-2 text-center text-gray-700">28</td>
                  <td className="py-3 px-2 text-center text-gray-700">18</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-2 font-medium text-gray-900">M</td>
                  <td className="py-3 px-2 text-center text-gray-700">29.3</td>
                  <td className="py-3 px-2 text-center text-gray-700">20</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-2 font-medium text-gray-900">L</td>
                  <td className="py-3 px-2 text-center text-gray-700">30.3</td>
                  <td className="py-3 px-2 text-center text-gray-700">22</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-2 font-medium text-gray-900">XL</td>
                  <td className="py-3 px-2 text-center text-gray-700">31.3</td>
                  <td className="py-3 px-2 text-center text-gray-700">24</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-2 font-medium text-gray-900">2XL</td>
                  <td className="py-3 px-2 text-center text-gray-700">32.5</td>
                  <td className="py-3 px-2 text-center text-gray-700">26</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium text-gray-900">3XL</td>
                  <td className="py-3 px-2 text-center text-gray-700">33.5</td>
                  <td className="py-3 px-2 text-center text-gray-700">28</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
