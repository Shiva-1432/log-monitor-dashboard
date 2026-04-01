/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // 1. Build-time environment validation
  async redirects() {
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_BACKEND_URL) {
      throw new Error('[FATAL] NEXT_PUBLIC_BACKEND_URL is missing in production environment');
    }
    return [];
  },

  // 2. Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ],
      },
    ];
  },

  // 3. Image Optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ],
  },
};

export default nextConfig;

