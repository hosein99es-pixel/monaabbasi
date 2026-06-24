import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    const studioOrigin = process.env.SANITY_STUDIO_ORIGIN ?? 'http://localhost:3333'
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://cdn.sanity.io",
      "font-src 'self' data:",
      "connect-src 'self' https://*.api.sanity.io https://*.apicdn.sanity.io",
      `frame-ancestors 'self' ${studioOrigin} https://*.sanity.studio`,
      "base-uri 'self'",
      "form-action 'self' mailto:",
    ].join('; ')

    return [{
      source: '/(.*)',
      headers: [
        {key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy},
        {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
        {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
        {key: 'X-Content-Type-Options', value: 'nosniff'},
        {key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload'},
      ],
    }]
  },
};

export default nextConfig;
