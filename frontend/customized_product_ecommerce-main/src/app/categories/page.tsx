import { fetchCategories } from "@/services/api";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { RefreshButton } from "@/components/ui/RefreshButton";
import Link from "next/link";

export default async function CategoriesPage() {
  try {
    const categories = await fetchCategories();

    const breadcrumbItems = [
      { label: "Home", href: "/" },
      { label: "Categories" }
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <Breadcrumb items={breadcrumbItems} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Categories</h1>
            <p className="text-gray-600">Browse our products by category</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug || category.id}`}>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group cursor-pointer border border-gray-200">
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <div className="text-white text-center">
                      {/* <div className="text-4xl mb-2">📦</div> */}
                      <h3 className="text-xl font-semibold">{category.name}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                      View Products
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500">Categories will appear here once they are added.</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading categories page:', error);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
        
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Categories</h2>
          <p className="text-gray-600 text-center max-w-md mb-6">
            We're having trouble loading the categories. Please try refreshing the page or contact support if the problem persists.
          </p>
          <RefreshButton />
        </div>
      </div>
    );
  }
}
