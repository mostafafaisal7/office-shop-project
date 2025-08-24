"use client";

import { useState } from "react";
import { ApiProduct, ApiCategory, ProductGridItem } from "@/services/api";
import { ProductFilter } from "@/components/product/ProductFilter";
import { ProductsHeader } from "@/components/product/ProductsHeader";
import { ProductsGrid } from "@/components/product/ProductsGrid";
import { ProductsList } from "@/components/product/ProductsList";
import { ProductsPagination } from "@/components/product/ProductsPagination";
import { useProductFilters } from "@/hooks/useProductFilters";

interface CategoryPageClientProps {
  category: ApiCategory;
  initialProducts: ApiProduct[];
  transformedProducts: ProductGridItem[];
  allCategories: ApiCategory[];
}

export const CategoryPageClient = ({
  category,
  initialProducts,
  transformedProducts,
  allCategories
}: CategoryPageClientProps) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Get subcategories of the current category
  const subcategories = allCategories.filter(cat => cat.parent_id === category.id);
  
  const {
    filters,
    updateFilters,
    resetFilters,
    filteredProducts,
    totalProducts,
    totalPages,
    filterOptions
  } = useProductFilters({
    initialProducts: initialProducts,
    productsPerPage: 15,
    initialCategoryId: category.id,
    categories: subcategories.length > 0 ? subcategories : []
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

  return (
    <div>
      {/* Category Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{category.name}</h1>
            {category.description && (
              <p className="text-gray-600 max-w-2xl mx-auto">{category.description}</p>
            )}
            <div className="mt-4 text-sm text-gray-500">
              {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
            </div>
          </div>
        </div>
      </div>

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
          />

          {gridProducts.length > 0 ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found in this category</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                There are currently no products in the "{category.name}" category. Try adjusting your filters or browse other categories.
              </p>
              <a 
                href="/categories"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse All Categories
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
