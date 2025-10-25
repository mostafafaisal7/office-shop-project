import React from 'react';
import { fetchProductById, fetchProducts, fetchProductReviews, fetchCategories, ApiProduct, ApiCategory } from '@/services/api';
import ProductPageClient from './ProductPageClient';
import ProductDetails from '@/components/product/ProductDetails';
import ProductFeatures from '@/components/product/ProductFeatures';
import RelatedProducts from '@/components/product/RelatedProducts';
import ReviewsSection from '@/components/product/ReviewsSection';
import ReviewImages from '@/components/product/ReviewImages';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';

// Define the props type for the page component
type Props = {
  params: {
    id: string;
  };
};

const ProductPage = async ({ params }: Props) => {
  const awaitedParams = await params;
  
  try {
    // Fetch the specific product from API
    const product: ApiProduct = await fetchProductById(awaitedParams.id);
    
    // Get all available sizes from variations
    const sizes = [...new Set(product.variations.map((v: any) => v.attributes?.size).filter(Boolean))];

    // Get all colors from product variations attributes
    const colorSet = new Set<string>();
    product.variations.forEach((v: any) => {
      if (v.attributes?.color) {
        colorSet.add(v.attributes.color);
      }
    });
    const colors = Array.from(colorSet).map(colorName => {
      if (colorName.toLowerCase() === 'red') return { name: 'Red', color: '#DC2626' };
      if (colorName.toLowerCase() === 'blue') return { name: 'Blue', color: '#2563EB' };
      if (colorName.toLowerCase() === 'green') return { name: 'Green', color: '#16A34A' };
      if (colorName.toLowerCase() === 'black') return { name: 'Black', color: '#000000' };
      if (colorName.toLowerCase() === 'white') return { name: 'White', color: '#FFFFFF' };
      return { name: colorName, color: '#6B7280' };
    });

    // Fetch reviews from API
    let reviewsData;
    try {
      reviewsData = await fetchProductReviews(awaitedParams.id);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to empty reviews data
      reviewsData = {
        reviews: [],
        total_count: 0,
        average_rating: 0,
        rating_distribution: {},
        helpful_reviews: []
      };
    }

    // Fetch categories to map category names
    const categories = await fetchCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    // Get related products from API (excluding current product)
    const allProducts = await fetchProducts();
    const relatedProducts = allProducts
      .filter((p: ApiProduct) => p.id !== product.id)
      .slice(0, 4) // Limit to 4 related products
      .map((p: ApiProduct) => {
        // Get the primary/most relevant category (first category ID)
        const primaryCategoryId = p.category_ids[0];
        const primaryCategory = primaryCategoryId ? categoryMap.get(primaryCategoryId) : null;
        
        return {
          id: p.id,
          name: p.name,
          price: `৳${p.base_price}`,
          image: p.media[0]?.file_path || '/placeholder-image.jpg',
          categoryName: primaryCategory?.name
        };
      });

    return (
      <div className="min-h-screen bg-gray-50">
        <Breadcrumb items={[
          { label: 'HOME', href: '/' },
          { label: product.name }
        ]} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductPageClient product={product} colors={colors} sizes={sizes} />

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16">
            <ProductDetails description={product.description} />
            <ProductFeatures product={product} />
          </div>

          {/* <RelatedProducts products={relatedProducts} /> */}

          {/* Reviews Section */}
          <ReviewsSection
            productId={awaitedParams.id}
            initialReviews={reviewsData.helpful_reviews}
            totalReviews={reviewsData.total_count}
            averageRating={reviewsData.average_rating}
            ratingDistribution={reviewsData.rating_distribution}
          />

          <RelatedProducts products={relatedProducts} />
          {/* <ReviewImages images={reviewsData.helpful_reviews.map(r => r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user_name)}&background=random`)} /> */}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching product:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist or couldn't be loaded.</p>
        </div>
      </div>
    );
  }
};

export default ProductPage;
