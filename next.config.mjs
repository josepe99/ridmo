// Baseline hardening for every response. No CSP on purpose: the site loads Microsoft Clarity
// and Next inline scripts, so a useful CSP needs nonces and its own rollout. These headers do not
// affect next/image, the service worker (public/sw.js) or Web Push.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  // Browsers ignore HSTS on plain http, so this is inert on localhost.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native argon2 binding: must be required at runtime, not bundled.
  serverExternalPackages: ['@node-rs/argon2'],
  // Dev-only: origins allowed to request dev server resources (HMR, /_next/*).
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      // Allow larger payloads for server actions (e.g., image uploads)
      bodySizeLimit: '25mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.ridmo.com.py',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  turbopack: {},
}

export default nextConfig
