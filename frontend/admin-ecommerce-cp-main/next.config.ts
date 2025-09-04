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
const nextConfig = {
  // 1️⃣ Keep this as is (disables Turbopack)
  experimental: {
    turbo: false
  },

  // 2️⃣ Update images.domains to include your backend for product uploads
  images: {
    domains: [
      'cdn.tiny.cloud',
      'localhost',        // Add if running frontend locally
      '127.0.0.1',        // Add if using IP
      'your-backend.com'  // Replace with your production backend domain
    ],
  },

  // 3️⃣ Update CSP headers to allow uploaded images from your backend
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
              // "img-src 'self' data: blob: https://cdn.tiny.cloud https://sp.tinymce.com http://localhost:8000 http://your-backend.com;", // <-- add backend URLs
              "img-src 'self' data: blob: https://cdn.tiny.cloud https://sp.tinymce.com http://localhost:8000 http://127.0.0.1:8000 http://your-backend.com;",

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
