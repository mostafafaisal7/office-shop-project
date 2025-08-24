/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack to avoid font loading issues
  experimental: {
    turbo: false
  },
  
  // Allow TinyMCE assets
  images: {
    domains: ['cdn.tiny.cloud'],
  },
  
  // Optional: If you need CSP headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tiny.cloud;",
              "connect-src 'self' https://cdn.tiny.cloud https://sp.tinymce.com;",
              "img-src 'self' data: blob: https://cdn.tiny.cloud https://sp.tinymce.com;",
              "style-src 'self' 'unsafe-inline' https://cdn.tiny.cloud;",
              "font-src 'self' https://cdn.tiny.cloud;"
            ].join(' ')
          }
        ]
      }
    ]
  }

};

module.exports = nextConfig;