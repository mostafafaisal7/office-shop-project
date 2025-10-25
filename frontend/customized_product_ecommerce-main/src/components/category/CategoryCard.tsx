'use client';

import LoadingLink from '@/components/ui/LoadingLink';

interface CategoryCardProps {
  id: number;
  name: string;
  slug?: string;
  description?: string;
}

export default function CategoryCard({ id, name, slug, description }: CategoryCardProps) {
  return (
    <LoadingLink href={`/categories/${slug || id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-200 active:scale-95">
        <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <div className="text-white text-center">
            <h3 className="text-xl font-semibold">{name}</h3>
          </div>
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {description}
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
    </LoadingLink>
  );
}

export { CategoryCard };
