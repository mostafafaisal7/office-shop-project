import { MetadataRoute } from 'next'
import { fetchProducts, fetchCategories } from '@/services/api'

// Revalidate sitemap every hour (3600 seconds)
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://yoursite.com'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ]

  try {
    // Fetch products for dynamic pages
    const products = await fetchProducts()
    
    const productPages = products.map((product) => ({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...productPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return only static pages if API fails
    return staticPages
  }
}
