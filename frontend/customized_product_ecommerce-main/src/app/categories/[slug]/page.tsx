import { Suspense } from "react";
import { fetchProductsWithFilters, fetchCategoryBySlug, fetchCategories, transformProductForGrid } from "@/services/api";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CategoryPageClient } from "./CategoryPageClient";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  try {
    // Await params first (Next.js 15 requirement)
    const { slug } = await params;

    // Fetch category by slug and all categories for breadcrumb/navigation
    const [currentCategory, categories] = await Promise.all([
      fetchCategoryBySlug(slug),
      fetchCategories()
    ]);

    if (!currentCategory) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[
              { label: "Home", href: "/" },
              { label: "Categories", href: "/categories" },
              { label: "Category Not Found" }
            ]} />
            
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
              <p className="text-gray-600 text-center max-w-md mb-6">
                The category you're looking for doesn't exist or may have been moved.
              </p>
              <a 
                href="/categories"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse All Categories
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Fetch products filtered by category
    const productsResponse = await fetchProductsWithFilters({
      category_id: currentCategory.id,
      per_page: 20
    });

    const categoryProducts = productsResponse.products;
    const transformedProducts = categoryProducts.map(transformProductForGrid);

    const breadcrumbItems = [
      { label: "Home", href: "/" },
      { label: "Categories", href: "/categories" },
      { label: currentCategory.name }
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
            <CategoryPageClient 
              category={currentCategory}
              initialProducts={categoryProducts}
              transformedProducts={transformedProducts}
              allCategories={categories}
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading category page:', error);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: "Categories", href: "/categories" },
            { label: "Error" }
          ]} />
          
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Category</h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
              We're having trouble loading this category. Please try refreshing the page or contact support if the problem persists.
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
