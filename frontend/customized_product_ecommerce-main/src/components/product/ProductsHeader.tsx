"use client";

import { useState } from "react";
import { Filter, Grid, List, Search } from "lucide-react";

interface ProductsHeaderProps {
  totalProducts: number;
  currentPage: number;
  productsPerPage: number;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onToggleFilters?: () => void;
  showFilters?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  loading?: boolean;
}

export const ProductsHeader = ({
  totalProducts,
  currentPage,
  productsPerPage,
  sortBy,
  onSortChange,
  onToggleFilters,
  showFilters = true,
  viewMode = 'grid',
  onViewModeChange,
  searchQuery = '',
  onSearchChange,
  loading = false
}: ProductsHeaderProps) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const startItem = (currentPage - 1) * productsPerPage + 1;
  const endItem = Math.min(currentPage * productsPerPage, totalProducts);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearchQuery);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearchChange) {
      onSearchChange(localSearchQuery);
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 space-y-3">
      {/* Search Bar */}
      {onSearchChange && (
        <div className="flex items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products by name, description, or SKU..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={loading}
              />
              {loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleFilters}
            className="lg:hidden flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          
          <div className="text-sm text-gray-600">
            <span>
              {loading ? 'Loading...' : `Showing ${startItem}-${endItem} of ${totalProducts} products`}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="sort" className="text-sm text-gray-700">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="default">Default</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {onViewModeChange && (
            <div className="flex items-center bg-white border border-gray-300 rounded-md">
              <button 
                onClick={() => onViewModeChange('grid')}
                className={`p-2 border-r border-gray-300 transition-colors ${
                  viewMode === 'grid' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => onViewModeChange('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
