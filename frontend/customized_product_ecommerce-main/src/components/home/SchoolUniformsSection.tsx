'use client';

import { useState } from 'react';
import Image from 'next/image';

interface UniformProduct {
  id: number;
  name: string;
  image: string;
  whatsappNumber?: string;
}

const uniformProducts: UniformProduct[] = [
  {
    id: 1,
    name: "UNISEX SCHOOL SOCKS",
    image: "/uploads/uniforms/Rectangle10161(1).png",
    whatsappNumber: "+1234567890"
  },
  {
    id: 2,
    name: "CLASSIC SCHOOL TIE",
    image: "/uploads/uniforms/Rectangle10161(2).png",
    whatsappNumber: "+1234567890"
  },
  {
    id: 3,
    name: "ELASTIC SCHOOL BELT",
    image: "/uploads/uniforms/Rectangle10161(3).png",
    whatsappNumber: "+1234567890"
  },
  {
    id: 4,
    name: "WINTER SCHOOL SWEATER",
    image: "/uploads/uniforms/Rectangle10161(4).png",
    whatsappNumber: "+1234567890"
  },
  {
    id: 5,
    name: "SCHOOL BLAZER WITH CREST",
    image: "/uploads/uniforms/Rectangle10161(5).png",
    whatsappNumber: "+1234567890"
  },
  {
    id: 6,
    name: "STUDENT ID CARD",
    image: "/uploads/uniforms/Rectangle10161(6).png",
    whatsappNumber: "+1234567890"
  },
  {
    id: 7,
    name: "HOUSE COLOR BADGES",
    image: "/uploads/uniforms/Rectangle10161(7).png",
    whatsappNumber: "+1234567890"
  },
  {
    id: 8,
    name: "CLASSIC SCHOOL TIE",
    image: "/uploads/uniforms/Rectangle10161(8).png",
    whatsappNumber: "+1234567890"
  }
];

const accessoryProducts: UniformProduct[] = [
  {
    id: 9,
    name: "SCHOOL BAG",
    image: "/uploads/placeholder-uniform.svg",
    whatsappNumber: "+1234567890"
  },
  {
    id: 10,
    name: "WATER BOTTLE",
    image: "/uploads/placeholder-uniform.svg",
    whatsappNumber: "+1234567890"
  },
  {
    id: 11,
    name: "LUNCH BOX",
    image: "/uploads/placeholder-uniform.svg",
    whatsappNumber: "+1234567890"
  },
  {
    id: 12,
    name: "SCHOOL SHOES",
    image: "/uploads/placeholder-uniform.svg",
    whatsappNumber: "+1234567890"
  },
  {
    id: 13,
    name: "SPORTS UNIFORM",
    image: "/uploads/placeholder-uniform.svg",
    whatsappNumber: "+1234567890"
  },
  {
    id: 14,
    name: "SCHOOL CAP",
    image: "/uploads/placeholder-uniform.svg",
    whatsappNumber: "+1234567890"
  },
  {
    id: 15,
    name: "NAME TAGS",
    image: "/uploads/placeholder-uniform.svg",
    whatsappNumber: "+1234567890"
  },
  {
    id: 16,
    name: "SCHOOL SOCKS",
    image: "/uploads/placeholder-uniform.svg",
    whatsappNumber: "+1234567890"
  }
];

export const SchoolUniformsSection = () => {
  const [activeTab, setActiveTab] = useState<'uniforms' | 'accessories'>('uniforms');

  const currentProducts = activeTab === 'uniforms' ? uniformProducts : accessoryProducts;

  const handleWhatsAppClick = (productName: string, whatsappNumber: string = "+1234567890") => {
    const message = encodeURIComponent(`Hi, I'm interested in ${productName}. Can you provide more details?`);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            School Uniforms & Accessories
          </h2>
          
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('uniforms')}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                  activeTab === 'uniforms'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Uniforms
              </button>
              <button
                onClick={() => setActiveTab('accessories')}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                  activeTab === 'accessories'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Accessories
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {currentProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to a placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = '/uploads/placeholder-uniform.svg';
                  }}
                />
              </div>
              
              {/* Product Info */}
              <div className="p-4 text-center">
                <h3 className="font-semibold text-gray-900 text-sm mb-4 min-h-[2.5rem] flex items-center justify-center">
                  {product.name}
                </h3>
                
                {/* WhatsApp Button */}
                <button
                  onClick={() => handleWhatsAppClick(product.name, product.whatsappNumber)}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WHATSAPP NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
