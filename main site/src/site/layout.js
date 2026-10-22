import { html, jsonLd, raw, toHtmlString } from './html.js';
import { icon } from './icons.js';

const NAV_LINKS = [
  { href: '/packages', label: 'Packages', key: 'packages' },
  { href: '/destinations', label: 'Destinations', key: 'destinations' },
  { href: '/flights', label: 'Flights', key: 'flights' },
  { href: '/visa-services', label: 'Visas', key: 'visa' },
  { href: '/study-abroad', label: 'Study Abroad', key: 'study' },
  { href: '/offers', label: 'Offers', key: 'offers' },
  { href: '/blog', label: 'Travel Advice', key: 'blog' },
  { href: '/about', label: 'About', key: 'about' },
  { href: '/contact', label: 'Contact', key: 'contact' }
];

export const whatsappIcon = raw('<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.03c-.25.69-1.44 1.32-1.98 1.36-.51.05-.99.24-3.33-.69-2.81-1.11-4.6-3.99-4.74-4.17-.14-.18-1.13-1.5-1.13-2.87 0-1.36.71-2.03.97-2.31.25-.28.55-.35.74-.35l.53.01c.17.01.4-.06.62.48.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.09.18-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.92 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.18.69-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.6.76 1.88.9.28.14.46.21.53.32.07.12.07.66-.18 1.35z"/></svg>');

// Runs before first paint so the saved (or device) theme never flashes the wrong colours.
const THEME_SCRIPT = raw(`<script>(function(){try{var t=localStorage.getItem('altis-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==='light'?'#f6f3ec':'#060f1e'}catch(e){}})()</script>`);

export function whatsappHref(site, message) {
  if (!site.whatsappDigits) return '';
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${site.whatsappDigits}${text}`;
}

// A WhatsApp click-to-chat link. The prefilled text names only the page or package, never
// anything the customer typed, so no personal information ends up in the URL.
export function whatsappButton(site, message, { label = 'WhatsApp us', variant = 'whatsapp', location = 'page' } = {}) {
  const href = whatsappHref(site, message);
  if (!href) return '';
  return html`<a class="button ${variant}" href="${href}" target="_blank" rel="noopener" data-whatsapp="${location}">${whatsappIcon}<span>${label}</span></a>`;
}

export function telHref(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}

function header(active) {
  return html`
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="scroll-progress" aria-hidden="true"></div>
  <header class="site-header">
    <div class="container nav-wrap">
      <a href="/" class="brand" aria-label="Altis Voyage home">
        <img src="/logo-header.jpg" alt="Altis Voyage Travel" class="brand-logo" width="174" height="72" fetchpriority="high" />
      </a>
      <nav class="main-nav" id="main-nav" aria-label="Main">
        <button class="nav-close-btn" type="button" aria-label="Close menu">✕</button>
        ${NAV_LINKS.map((link) => html`<a href="${link.href}"${raw(link.key === active ? ' class="nav-active" aria-current="page"' : '')}>${link.label}</a>`)}
        <a href="/request-quote" class="nav-drawer-cta">Request a Quote</a>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme" title="Switch colour theme">${icon('moon', 'icon-moon')}${icon('sun', 'icon-sun')}</button>
        <a class="cart-toggle trip-toggle" href="/my-trip" aria-label="My Trip requests">${icon('trip')}<span class="trip-label">My Trip</span><b class="trip-count" data-trip-count hidden>0</b></a>
        <a class="button primary header-cta" href="/request-quote">Request a Quote</a>
        <button class="mobile-menu-toggle" type="button" aria-label="Open menu" aria-controls="main-nav" aria-expanded="false">☰</button>
      </div>
    </div>
  </header>`;
}

function footer(site) {
  const { contact } = site;
  const year = new Date().getFullYear();
  return html`
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a class="footer-logo" href="/" aria-label="Altis Voyage home"><img src="/logo-header.jpg" alt="Altis Voyage Travel" width="233" height="96" loading="lazy" /></a>
        <p class="footer-copy">A Ugandan travel agency operating worldwide: holiday packages, flights, visa assistance, hotel bookings and study-abroad support.</p>
        <p class="footer-note">We prepare and review every application carefully. Visa, admission and scholarship decisions are made by the relevant authorities and institutions.</p>
      </div>
      <div>
        <h2 class="footer-heading">Services</h2>
        <ul>
          <li><a href="/packages">Travel packages</a></li>
          <li><a href="/flights">Flight booking</a></li>
          <li><a href="/visa-services">Visa assistance</a></li>
          <li><a href="/study-abroad">Study abroad &amp; scholarships</a></li>
          <li><a href="/offers">Current offers</a></li>
          <li><a href="/trip-planner">Trip planner</a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer-heading">Company</h2>
        <ul>
          <li><a href="/about">About us</a></li>
          <li><a href="/destinations">Destinations</a></li>
          <li><a href="/blog">Travel advice</a></li>
          <li><a href="/faq">FAQ</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/my-trip">Track a request</a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer-heading">Contact</h2>
        <ul class="footer-contact">
          ${contact.phone ? html`<li><a href="${telHref(contact.phone)}">${contact.phone}</a></li>` : ''}
          ${site.whatsappDigits ? html`<li><a href="${whatsappHref(site, 'Hello Altis Voyage, I have a travel question.')}" target="_blank" rel="noopener" data-whatsapp="footer">WhatsApp chat</a></li>` : ''}
          ${contact.email ? html`<li><a href="mailto:${contact.email}">${contact.email}</a></li>` : ''}
          ${contact.address ? html`<li>${contact.address}</li>` : ''}
          ${contact.hours ? html`<li>${contact.hours.replace(/-(?=\d)/g, '–')}</li>` : ''}
        </ul>
      </div>
    </div>
    <div class="footer-bottom container">
      <span>© ${year} Altis Voyage Travel Services Ltd. Kampala, Uganda.</span>
      <nav class="footer-legal" aria-label="Legal">
        <a href="/privacy-policy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/refund-policy">Refunds &amp; cancellations</a>
        ${site.trackingEnabled ? html`<button type="button" class="link-button" data-consent-open>Cookie settings</button>` : ''}
        <a href="/admin/login.html" rel="nofollow">Staff sign in</a>
      </nav>
    </div>
  </footer>`;
}

function consentBanner(site) {
  if (!site.trackingEnabled) return '';
  return html`
  <div class="consent-banner" data-consent-banner hidden role="dialog" aria-live="polite" aria-label="Cookie choices">
    <p>We use optional analytics and advertising cookies to understand how the site is used and to measure our campaigns. We never send your name, contact details or enquiry details to these tools. <a href="/privacy-policy">Privacy Policy</a></p>
    <div class="consent-actions">
      <button type="button" class="button secondary" data-consent="denied">Decline</button>
      <button type="button" class="button primary" data-consent="granted">Accept</button>
    </div>
  </div>`;
}

export function breadcrumbs(site, items) {
  const all = [{ name: 'Home', path: '/' }, ...items];
  return {
    markup: html`<nav class="breadcrumbs container" aria-label="Breadcrumb"><ol>${all.map((item, index) =>
      index === all.length - 1
        ? html`<li aria-current="page">${item.name}</li>`
        : html`<li><a href="${item.path}">${item.name}</a></li>`
    )}</ol></nav>`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: all.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${site.siteUrl}${item.path}` }))
    }
  };
}

export function organizationSchema(site) {
  const { contact } = site;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'Altis Voyage Travel Services Ltd',
    alternateName: 'Altis Voyage',
    url: `${site.siteUrl}/`,
    logo: `${site.siteUrl}/logo.jpg`,
    image: `${site.siteUrl}/logo.jpg`
  };
  if (contact.phone) schema.telephone = contact.phone;
  if (contact.email) schema.email = contact.email;
  if (contact.street || contact.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: contact.street || contact.address,
      addressLocality: contact.city || 'Kampala',
      addressCountry: contact.country || 'UG'
    };
  }
  if (contact.hours) {
    schema.openingHoursSpecification = {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:30',
      closes: '18:00'
    };
  }
  return schema;
}

// Renders a full page. `page.body` is trusted HTML produced with the `html` helper.
export function layout(site, page) {
  const canonical = `${site.siteUrl}${page.path === '/' ? '/' : page.path}`;
  const title = page.title.includes('Altis Voyage') ? page.title : `${page.title} | Altis Voyage`;
  const image = page.image || site.defaultImage;
  const schemas = (page.schema || []).filter(Boolean);
  const clientConfig = {
    whatsapp: site.whatsappDigits,
    gaId: site.gaId,
    pixelId: site.pixelId,
    page: page.analyticsPage || page.active || 'page',
    item: page.packageView || null
  };

  return '<!DOCTYPE html>' + toHtmlString(html`
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${page.description}" />
  ${page.noindex ? raw('<meta name="robots" content="noindex, follow" />') : html`<link rel="canonical" href="${canonical}" />`}
  ${site.gscToken ? html`<meta name="google-site-verification" content="${site.gscToken}" />` : ''}
  <meta property="og:site_name" content="Altis Voyage" />
  <meta property="og:type" content="${page.ogType || 'website'}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${page.description}" />
  <meta property="og:url" content="${canonical}" />
  ${image ? html`<meta property="og:image" content="${image}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Manrope:wght@400..800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/main.css?v=${site.assetVersion}" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <meta name="theme-color" content="#060f1e" />
  ${THEME_SCRIPT}
  <link rel="apple-touch-icon" href="/logo.jpg" />
  ${page.preloadImage ? html`<link rel="preload" as="image" href="${page.preloadImage}" fetchpriority="high" />` : ''}
  ${schemas.map((schema) => jsonLd(schema))}
  <script id="site-config" type="application/json">${raw(JSON.stringify(clientConfig).replace(/</g, '\\u003c'))}</script>
</head>
<body class="page-${page.active || 'default'}">
  ${header(page.active)}
  <main id="main">
    ${page.body}
  </main>
  ${footer(site)}
  ${site.whatsappDigits ? html`<a class="whatsapp-float" href="${whatsappHref(site, page.whatsappMessage || 'Hello Altis Voyage, I would like some help planning a trip.')}" target="_blank" rel="noopener" data-whatsapp="floating" aria-label="Chat with Altis Voyage on WhatsApp">${whatsappIcon}</a>` : ''}
  ${consentBanner(site)}
  <div id="nav-overlay" class="nav-overlay"></div>
  <script src="/js/app.js?v=${site.assetVersion}" defer></script>
</body>
</html>`);
}
