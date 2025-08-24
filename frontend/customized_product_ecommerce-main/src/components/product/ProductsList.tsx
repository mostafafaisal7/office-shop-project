"use client";

import Link from "next/link";
import Image from "next/image";

interface ProductListItem {
  id: string;
  name: string;
  price: string;
  image: string;
}

interface ProductsListProps {
  products: ProductListItem[];
}

export const ProductsList = ({ products }: ProductsListProps) => {
  return (
    <div className="bg-white">
      <div className="space-y-4 p-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Product ID: {product.id}
              </p>
              <div className="mt-2">
                <span className="text-xl font-bold text-blue-600">
                  ৳{product.price}
                </span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                View Details
              </button>
            </div>
          </Link>
        ))}
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};
