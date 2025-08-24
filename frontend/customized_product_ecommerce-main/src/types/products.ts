interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  rating: number;
  reviewCount: number;
  details: string[];
  features: Record<string, string>;
  reviews: Review[];
  reviewImages: string[];
  totalReviews: number;
  averageRating: number;
  satisfactionRate: number;
  ratingDistribution: Record<number, number>;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  avatar: string;
  date: string;
}

export async function getProductById(id: string): Promise<Product | null> {
  // In a real app, this would fetch from your API
  try {
    const res = await fetch(`https://your-api.com/products/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

export async function getRelatedProducts(productId: string): Promise<Product[]> {
  // Fetch related products from your API
  try {
    const res = await fetch(`https://your-api.com/products/${productId}/related`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch related products:', error);
    return [];
  }
}