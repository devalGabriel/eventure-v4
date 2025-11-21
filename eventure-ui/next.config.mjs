import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  routing: {
    locales: ['ro', 'en'],
    defaultLocale: 'ro',
    localePrefix: 'always'
  }
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              // imagini locale, data:, blob:, și avatar din users-service
              "img-src 'self' data: blob: http://localhost:4102",
              "font-src 'self' data:",
              // conexiuni API (AUTH/USERS/NOTIF/etc) + SSE + (în viitor) WebSocket
              "connect-src 'self' http://localhost:3000 http://localhost:4001 http://localhost:4102 http://localhost:4003 http://localhost:4004 http://localhost:4005 ws: wss:",
               "frame-ancestors 'none'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default withNextIntl(nextConfig);
