/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ntzvhyhuwriqpcrufvrz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
  async redirects() {
    return [
      { source: '/documents/incoming', destination: '/cong-van/den', permanent: true },
      { source: '/documents/incoming/:path*', destination: '/cong-van/den/:path*', permanent: true },
      { source: '/documents/sent', destination: '/cong-van/di', permanent: true },
      { source: '/documents/sent/:path*', destination: '/cong-van/di/:path*', permanent: true },
      { source: '/documents/search', destination: '/cong-van/tim-kiem', permanent: true },
      { source: '/documents/create', destination: '/cong-van/create', permanent: true },
      { source: '/documents/:path*', destination: '/cong-van/:path*', permanent: true },

      { source: '/tasks/incoming', destination: '/cong-viec/duoc-giao', permanent: true },
      { source: '/tasks/incoming/:path*', destination: '/cong-viec/duoc-giao/:path*', permanent: true },
      { source: '/tasks/sent', destination: '/cong-viec/da-giao', permanent: true },
      { source: '/tasks/sent/:path*', destination: '/cong-viec/da-giao/:path*', permanent: true },
      { source: '/tasks/:path*', destination: '/cong-viec/:path*', permanent: true },

      { source: '/meetings', destination: '/cuoc-hop', permanent: true },
      { source: '/meetings/:path*', destination: '/cuoc-hop/:path*', permanent: true },

      { source: '/vehicles', destination: '/xe', permanent: true },
      { source: '/vehicles/:path*', destination: '/xe/:path*', permanent: true },

      { source: '/hr', destination: '/nhan-su', permanent: true },
      { source: '/hr/:path*', destination: '/nhan-su/:path*', permanent: true },

      { source: '/payslips', destination: '/bang-luong', permanent: true },
      { source: '/payslips/:path*', destination: '/bang-luong/:path*', permanent: true },

      { source: '/news', destination: '/bang-tin', permanent: true },
      { source: '/news/:path*', destination: '/bang-tin/:path*', permanent: true },

      { source: '/profile', destination: '/ho-so', permanent: true },
      { source: '/profile/:path*', destination: '/ho-so/:path*', permanent: true },
    ]
  },
};

export default nextConfig;
