import { Suspense } from "react";
import { fetchProductsWithFilters, fetchCategories, transformProductForGrid, ProductFilters } from "@/services/api";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductsPageClient } from "./ProductsPageClient";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category_id?: string;
    status?: string;
    is_customizable?: string;
    min_price?: string;
    max_price?: string;
    tags?: string;
    sort?: string;
    page?: string;
    per_page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  try {
    // Await searchParams before using its properties
    const params = await searchParams;
    
    // Parse search params into filters
    const filters: ProductFilters = {
      q: params.q,
      category_id: params.category_id ? parseInt(params.category_id) : undefined,
      status: params.status || 'active',
      is_customizable: params.is_customizable ? params.is_customizable === 'true' : undefined,
      min_price: params.min_price ? parseInt(params.min_price) : undefined,
      max_price: params.max_price ? parseInt(params.max_price) : undefined,
      tags: params.tags ? params.tags.split(',') : undefined,
      sort_by: params.sort === 'name-asc' || params.sort === 'name-desc' ? 'name' :
               params.sort === 'price-low' || params.sort === 'price-high' ? 'base_price' :
               params.sort === 'newest' ? 'created_at' : undefined,
      sort_order: params.sort?.includes('desc') || params.sort === 'price-high' ? 'desc' : 'asc',
      page: params.page ? parseInt(params.page) : 1,
      per_page: params.per_page ? parseInt(params.per_page) : 15
    };

    const [productsResponse, categories] = await Promise.all([
      fetchProductsWithFilters(filters),
      fetchCategories()
    ]);

    const transformedProducts = productsResponse.products.map(transformProductForGrid);

    const breadcrumbItems = [
      { label: "Home", href: "/" },
      { label: "Products" }
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumbItems} />
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }>
            <ProductsPageClient 
              initialResponse={productsResponse}
              transformedProducts={transformedProducts}
              categories={categories}
              useServerFiltering={true}
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading products page:', error);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products" }]} />
          
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Products</h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
              We're having trouble loading the products. Please try refreshing the page or contact support if the problem persists.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
