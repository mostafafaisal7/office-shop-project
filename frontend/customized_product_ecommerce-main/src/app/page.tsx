import { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { ProductGrid } from "@/components/home/ProductGrid";
import { SchoolUniformsSection } from "@/components/home/SchoolUniformsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { 
  fetchProducts, 
  fetchCategories, 
  groupProductsByCategory, 
  transformProductForGrid,
  ApiProduct 
} from "@/services/api";
import { schoolStationaryProducts } from "@/data/products";

// SEO Metadata
export const metadata: Metadata = {
  title: "Custom School Stationary & Uniforms | Premium Quality Products",
  description: "Discover our premium collection of customizable school stationary, uniforms, and educational products. High-quality materials with personalization options for schools and institutions.",
  keywords: "school stationary, custom uniforms, educational products, school supplies, personalized stationary",
  openGraph: {
    title: "Custom School Stationary & Uniforms | Premium Quality Products",
    description: "Discover our premium collection of customizable school stationary, uniforms, and educational products.",
    type: "website",
    url: "https://yoursite.com",
    images: [
      {
        url: "https://yoursite.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Custom School Stationary Products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom School Stationary & Uniforms",
    description: "Premium quality customizable school products and uniforms.",
    images: ["https://yoursite.com/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Fallback function to transform static products
const transformStaticProductForGrid = (product: any) => {
  const primaryMedia = product.media.find((m: any) => m.is_primary) || product.media[0];
  return {
    id: product.id,
    name: product.name,
    price: `৳${product.base_price}`,
    image: primaryMedia.file_path
  };
};

export default async function Home() {
  let categoryGroups: { category: any; products: ApiProduct[] }[] = [];
  let hasApiData = false;

  try {
    // Try to fetch products first
    const products = await fetchProducts();
    
    try {
      // Try to fetch categories
      const categories = await fetchCategories();
      categoryGroups = groupProductsByCategory(products, categories);
    } catch (categoryError) {
      console.warn('Categories endpoint failed, grouping all products as "School Stationary":', categoryError);
      // If categories fail, group all products under a default category
      categoryGroups = [
        {
          category: { id: 1, name: "School Stationary", slug: "school-stationary" },
          products: products
        }
      ];
    }
    
    hasApiData = true;
  } catch (error) {
    console.error('Failed to fetch products from API, falling back to static data:', error);
    // Fallback to static data
    categoryGroups = [
      {
        category: { id: 1, name: "School Stationary", slug: "school-stationary" },
        products: schoolStationaryProducts as any[]
      }
    ];
  }

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Custom School Stationary & Uniforms",
    "description": "Premium collection of customizable school stationary, uniforms, and educational products",
    "url": "https://yoursite.com",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": categoryGroups.flatMap((group, groupIndex) =>
        group.products.slice(0, 4).map((product, productIndex) => ({
          "@type": "Product",
          "position": groupIndex * 4 + productIndex + 1,
          "name": product.name,
          "description": product.short_description || product.description,
          "image": hasApiData 
            ? (product.media.find(m => m.is_primary) || product.media[0])?.file_path
            : (product.media.find((m: any) => m.is_primary) || product.media[0])?.file_path,
          "offers": {
            "@type": "Offer",
            "price": product.base_price,
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          }
        }))
      )
    }
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <div className="min-h-screen bg-white">
        <HeroSection />
        <FeaturesSection />
        
        {categoryGroups.map((group, index) => (
          <ProductGrid
            key={group.category.id}
            title={group.category.name}
            products={group.products.map(hasApiData ? transformProductForGrid : transformStaticProductForGrid)}
            bgColor={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
            categorySlug={group.category.slug}
          />
        ))}
        
        <SchoolUniformsSection />
        
        <ContactSection />
      </div>
    </>
  );
}
