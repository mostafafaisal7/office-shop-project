// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // Disable Turbopack to avoid font loading issues
//   experimental: {
//     turbo: false
//   },
  
//   // Allow TinyMCE assets
//   images: {
//     domains: ['cdn.tiny.cloud'],
//   },
  
//   // Optional: If you need CSP headers
//   async headers() {
//     return [
//       {
//         source: '/(.*)',
//         headers: [
//           {
//             key: 'Content-Security-Policy',
//             value: [
//               "default-src 'self';",
//               "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tiny.cloud;",
//               "connect-src 'self' https://cdn.tiny.cloud https://sp.tinymce.com;",
//               "img-src 'self' data: blob: https://cdn.tiny.cloud https://sp.tinymce.com;",
//               "style-src 'self' 'unsafe-inline' https://cdn.tiny.cloud;",
//               "font-src 'self' https://cdn.tiny.cloud;"
//             ].join(' ')
//           }
//         ]
//       }
//     ]
//   }

// };

// module.exports = nextConfig;


/** @type {import('next').NextConfig} */

// Load configuration from environment variables
const imageDomains = process.env.NEXT_PUBLIC_IMAGE_DOMAINS
  ? process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(',').map(d => d.trim())
  : ['cdn.tiny.cloud', 'localhost', '127.0.0.1'];

// Backend URLs for CSP
const backendUrls = process.env.NEXT_PUBLIC_BACKEND_URLS
  ? process.env.NEXT_PUBLIC_BACKEND_URLS.split(',').map(d => d.trim()).join(' ')
  : 'http://localhost:8000 http://127.0.0.1:8000';

const nextConfig = {
  // 1️⃣ Keep this as is (disables Turbopack)
  experimental: {
    turbo: false
  },

  // 2️⃣ Dynamic images.domains from environment variable
  images: {
    domains: imageDomains,
  },

  // 3️⃣ Dynamic CSP headers using backend URLs from environment
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
              `img-src 'self' data: blob: https://cdn.tiny.cloud https://sp.tinymce.com ${backendUrls};`,
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
