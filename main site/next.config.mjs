// Public pages are rendered on the server by pages/api/[...path].js (src/site/). Clean URLs are
// rewritten to /api/render/<page>, so every page gets its own title, description, canonical URL
// and structured data, and the contact details always come from the database.
const PAGES = [
  'packages', 'destinations', 'flights', 'visa-services', 'study-abroad', 'offers', 'blog', 'about', 'contact', 'faq',
  'privacy-policy', 'terms', 'refund-policy', 'request-quote', 'request-received', 'my-trip', 'trip-planner'
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  async redirects() {
    // The original static pages keep working for bookmarks and search results.
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/destinations.html', destination: '/destinations', permanent: true },
      { source: '/store.html', destination: '/packages', permanent: true },
      { source: '/inquiry.html', destination: '/request-quote', permanent: true },
      { source: '/visa', destination: '/visa-services', permanent: true },
      { source: '/study', destination: '/study-abroad', permanent: true },
      { source: '/privacy', destination: '/privacy-policy', permanent: true }
    ];
  },

  async rewrites() {
    return {
      afterFiles: [
        { source: '/', destination: '/api/render/home' },
        { source: `/:page(${PAGES.join('|')})`, destination: '/api/render/:page' },
        { source: '/packages/:slug', destination: '/api/render/package/:slug' },
        { source: '/blog/:slug', destination: '/api/render/article/:slug' },
        { source: '/sitemap.xml', destination: '/api/sitemap' }
      ],
      // Anything else that is not a real file gets the branded 404 page.
      fallback: [{ source: '/:path((?!api/|_next/).*)', destination: '/api/render/not-found' }]
    };
  },

  async headers() {
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      { source: '/admin/:path*', headers: [...noindex, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/api/:path*', headers: noindex },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
        ]
      },
      { source: '/css/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
      { source: '/js/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
      // Dashboard files are not versioned in their HTML, so they always revalidate.
      { source: '/css/admin.css', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/js/admin.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/js/admin-login.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }
    ];
  }
};

export default nextConfig;
