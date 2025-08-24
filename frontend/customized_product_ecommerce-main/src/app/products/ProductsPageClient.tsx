"use client";

import { useState } from "react";
import { ApiProduct, ApiCategory, ProductGridItem, ProductsResponse } from "@/services/api";
import { ProductFilter } from "@/components/product/ProductFilter";
import { ProductsHeader } from "@/components/product/ProductsHeader";
import { ProductsGrid } from "@/components/product/ProductsGrid";
import { ProductsList } from "@/components/product/ProductsList";
import { ProductsPagination } from "@/components/product/ProductsPagination";
import { useProductFilters } from "@/hooks/useProductFilters";

interface ProductsPageClientProps {
  initialProducts?: ApiProduct[];
  initialResponse?: ProductsResponse;
  transformedProducts?: ProductGridItem[];
  categories: ApiCategory[];
  useServerFiltering?: boolean;
}

export const ProductsPageClient = ({
  initialProducts = [],
  initialResponse,
  transformedProducts = [],
  categories,
  useServerFiltering = true
}: ProductsPageClientProps) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const {
    filters,
    updateFilters,
    resetFilters,
    filteredProducts,
    totalProducts,
    totalPages,
    filterOptions,
    loading
  } = useProductFilters({
    initialProducts,
    initialResponse,
    productsPerPage: 15,
    useServerFiltering,
    categories
  });

  // Transform filtered products for grid display
  const gridProducts = filteredProducts.map(product => {
    const primaryMedia = product.media.find(m => m.is_primary) || product.media[0];
    return {
      id: product.id,
      name: product.name,
      price: product.base_price,
      image: primaryMedia?.file_path || '/placeholder-image.jpg'
    };
  });

  // Transform filtered products for list display
  const listProducts = filteredProducts.map(product => {
    const primaryMedia = product.media.find(m => m.is_primary) || product.media[0];
    return {
      id: product.id.toString(),
      name: product.name,
      price: product.base_price,
      image: primaryMedia?.file_path || '/placeholder-image.jpg'
    };
  });

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handleFiltersChange = (newFilters: any) => {
    updateFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    updateFilters({ q: query });
  };

  return (
    <div className="flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ProductFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableCategories={filterOptions.categories}
          availableColors={filterOptions.colors}
          availableSizes={filterOptions.sizes}
          priceRange={filterOptions.priceRange}
          onResetFilters={resetFilters}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed left-0 top-0 h-full bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <ProductFilter
              filters={filters}
              onFiltersChange={handleFiltersChange}
              availableCategories={filterOptions.categories}
              availableColors={filterOptions.colors}
              availableSizes={filterOptions.sizes}
              priceRange={filterOptions.priceRange}
              onResetFilters={resetFilters}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        <ProductsHeader
          totalProducts={totalProducts}
          currentPage={filters.page}
          productsPerPage={15}
          sortBy={filters.sortBy}
          onSortChange={handleSortChange}
          onToggleFilters={() => setShowMobileFilters(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={filters.q}
          onSearchChange={handleSearchChange}
          loading={loading}
        />

        {viewMode === 'grid' ? (
          <ProductsGrid products={gridProducts} />
        ) : (
          <ProductsList products={listProducts} />
        )}

        {totalPages > 1 && (
          <ProductsPagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};
