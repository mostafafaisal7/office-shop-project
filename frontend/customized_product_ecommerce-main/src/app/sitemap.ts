import { MetadataRoute } from 'next'

// Revalidate sitemap every hour (3600 seconds)
export const revalidate = 3600

// Mark as dynamic to prevent build-time fetch errors
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
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
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]

  // During build, API might not be available, so return static pages only
  // Products will be added at runtime via revalidation
  if (process.env.NODE_ENV === 'production' && !process.env.API_URL) {
    console.log('Sitemap: Returning static pages only (API not available during build)')
    return staticPages
  }

  try {
    // Only fetch products at runtime when API is available
    const { fetchProducts } = await import('@/services/api')
    const products = await fetchProducts()

    if (!products || !Array.isArray(products)) {
      console.warn('Sitemap: No products returned from API')
      return staticPages
    }

    const productPages: MetadataRoute.Sitemap = products
      .filter(product => product && product.id && product.updated_at)
      .map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

    return [...staticPages, ...productPages]
  } catch (error) {
    console.error('Sitemap: Error fetching products:', error)
    // Return only static pages if API fails
    return staticPages
  }
}
