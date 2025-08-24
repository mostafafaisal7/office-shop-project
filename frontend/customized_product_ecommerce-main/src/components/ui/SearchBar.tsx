"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchProductsWithFilters } from '@/services/api';

interface SearchResult {
  id: number;
  name: string;
  short_description: string;
  base_price: string;
  sku: string;
  tags: string[];
}

interface SearchBarProps {
  className?: string;
  onSearchSubmit?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ className = '', onSearchSubmit }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Search function using API
  const searchProducts = async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];

    try {
      const response = await fetchProductsWithFilters({
        q: searchQuery,
        per_page: 6 // Limit to 6 results for dropdown
      });

      return response.products.map(product => ({
        id: product.id,
        name: product.name,
        short_description: product.short_description,
        base_price: product.base_price,
        sku: product.sku,
        tags: product.tags
      }));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim()) {
      setIsLoading(true);
      // Debounce API calls
      debounceRef.current = setTimeout(async () => {
        try {
          const searchResults = await searchProducts(value);
          setResults(searchResults);
          setIsOpen(true);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      if (onSearchSubmit) {
        onSearchSubmit(query);
      } else {
        // Navigate to products page with search query
        router.push(`/products?q=${encodeURIComponent(query)}`);
      }
    }
  };

  // Handle result click
  const handleResultClick = (productId: number) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/products/${productId}`);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search products..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{result.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{result.short_description}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500">SKU: {result.sku}</span>
                        {result.tags.length > 0 && (
                          <span className="ml-2 text-xs text-blue-600">
                            {result.tags.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 text-right">
                      <span className="font-semibold text-blue-600 text-sm">৳{result.base_price}</span>
                    </div>
                  </div>
                </button>
              ))}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleSubmit}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all results for "{query}"
                </button>
              </div>
            </>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No products found for "{query}"</p>
              <button
                onClick={handleSubmit}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Search all products
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
