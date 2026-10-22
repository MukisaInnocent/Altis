import { formatDate, formatPrice, html, raw, safeUrl, slugify } from './html.js';
import { WHY_ICONS, icon } from './icons.js';
import { whatsappButton } from './layout.js';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80';

export function packagePath(pkg) {
  return `/packages/${pkg.id}-${slugify(pkg.title) || 'package'}`;
}

export function postPath(post) {
  return `/blog/${post.slug}`;
}

export function image(src, alt, { eager = false, className = '', width = 900, height = 600 } = {}) {
  return html`<img src="${safeUrl(src) || FALLBACK_IMAGE}" alt="${alt}" width="${width}" height="${height}"${raw(eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"')}${raw(className ? ` class="${className}"` : '')} />`;
}

// Unsplash images accept a width parameter, so phones can download a small copy of the hero.
function responsiveSrcset(url) {
  if (!/images\.unsplash\.com/.test(url)) return '';
  return [640, 1024, 1600].map((width) => `${url.replace(/([?&])w=\d+/, `$1w=${width}`)} ${width}w`).join(', ');
}

export function pageHero({ eyebrow, title, subtitle, image: background, short = false, actions = '' }) {
  const src = safeUrl(background) || FALLBACK_IMAGE;
  const srcset = responsiveSrcset(src);
  return html`
  <section class="page-hero${short ? ' page-hero--short' : ''}">
    <img class="page-hero-bg" src="${src}"${raw(srcset ? ` srcset="${srcset}" sizes="100vw"` : '')} alt="" width="1600" height="900" fetchpriority="high" decoding="async" />
    <div class="page-hero-overlay"></div>
    <div class="container page-hero-content">
      ${eyebrow ? html`<p class="caption-num text-accent">${eyebrow}</p>` : ''}
      <h1 class="font-display page-hero-title">${title}</h1>
      ${subtitle ? html`<p class="page-hero-sub">${subtitle}</p>` : ''}
      ${actions ? html`<div class="hero-actions page-hero-actions">${actions}</div>` : ''}
    </div>
  </section>`;
}

export function sectionTop({ eyebrow, heading, link, linkLabel, id }) {
  return html`
  <div class="section-top">
    <div>
      ${eyebrow ? html`<p class="caption-num text-accent">${eyebrow}</p>` : ''}
      <h2 class="section-heading font-display"${raw(id ? ` id="${id}"` : '')}>${heading}</h2>
    </div>
    ${link ? html`<a href="${link}" class="inline-link">${linkLabel}</a>` : ''}
  </div>`;
}

export function priceLabel(amount, currency) {
  const price = formatPrice(amount, currency);
  return price ? html`<span class="price-from">From <strong>${price}</strong><sup>*</sup></span>` : html`<span class="price-from">Price on request</span>`;
}

export const PRICE_NOTE = '* Indicative starting price. The final price depends on dates, availability and the number of travellers, and is confirmed in your written quotation.';

export function packageCard(pkg, { headingLevel = 3 } = {}) {
  const path = packagePath(pkg);
  const country = String(pkg.destination || '').split(',').pop().trim();
  const heading = raw(`<h${headingLevel}><a href="${path}">`);
  const headingEnd = raw(`</a></h${headingLevel}>`);
  return html`
  <article class="package-card" data-filter-item data-search="${`${pkg.title} ${pkg.destination} ${pkg.description}`.toLowerCase()}" data-country="${country.toLowerCase()}">
    <a class="card-img-wrapper" href="${path}" tabindex="-1" aria-hidden="true">${image(pkg.image, pkg.title)}</a>
    <div class="content">
      <span class="caption-num text-accent">${pkg.destination || 'Journey'}</span>
      ${heading}${pkg.title}${headingEnd}
      <p>${pkg.description || ''}</p>
      <div class="price-row">
        <span>${pkg.days ? `${pkg.days} days` : 'Flexible length'}</span>
        ${priceLabel(pkg.price)}
      </div>
      <div class="card-actions">
        <a class="button primary" href="/request-quote?package=${pkg.id}">Request a Quote</a>
        <a class="button secondary" href="${path}">View details</a>
        <button class="mini-button save-button" type="button" data-save-trip="${pkg.id}" data-title="${pkg.title}" data-price="${pkg.price || 0}" data-path="${path}">Save to My Trip</button>
      </div>
    </div>
  </article>`;
}

const EAST_AFRICA = ['kenya', 'tanzania', 'rwanda', 'burundi', 'south sudan', 'ethiopia'];

// Region tokens for the filter pills. Kenya and Tanzania are stored as "international" in the
// original data, so they are also tagged "east-africa" for the East Africa pill.
function regionTokens(destination) {
  const tokens = new Set([String(destination.region || 'international').toLowerCase()]);
  const country = String(destination.country || '').toLowerCase();
  if (country === 'uganda') tokens.add('uganda');
  if (EAST_AFRICA.includes(country)) tokens.add('east-africa');
  return [...tokens].join(' ');
}

export function destinationCard(destination, packages = []) {
  const name = destination.name || '';
  const related = packages.find((pkg) => String(pkg.destination || '').toLowerCase().includes(name.toLowerCase().split(' ')[0]));
  return html`
  <article class="destination-card" data-filter-item data-region="${regionTokens(destination)}" data-search="${`${name} ${destination.country} ${destination.tagline}`.toLowerCase()}">
    <div class="card-img-wrapper">${image(destination.image, `${name}, ${destination.country || ''}`)}</div>
    <div class="content">
      <div class="destination-meta">
        <span class="caption-num text-accent">${destination.country || 'Uganda'}</span>
        ${formatPrice(destination.price_from) ? html`<span class="caption-num">From ${formatPrice(destination.price_from)}*</span>` : ''}
      </div>
      <h3>${name}</h3>
      <p>${destination.tagline || ''}</p>
      ${destination.description ? html`<p class="card-detail">${destination.description}</p>` : ''}
      <div class="card-actions">
        <a class="button primary" href="/request-quote?destination=${encodeURIComponent(name)}">Request a Quote</a>
        ${related ? html`<a class="button secondary" href="${packagePath(related)}">See package</a>` : ''}
      </div>
    </div>
  </article>`;
}

export function offerCard(site, offer, { expired = false } = {}) {
  const validity = [offer.valid_from && `from ${formatDate(offer.valid_from)}`, offer.valid_until && `until ${formatDate(offer.valid_until)}`].filter(Boolean).join(' ');
  return html`
  <article class="offer-card${expired ? ' is-expired' : ''}" id="offer-${offer.id}">
    ${offer.image ? html`<div class="card-img-wrapper">${image(offer.image, offer.title)}</div>` : ''}
    <div class="content">
      <div class="offer-meta">
        ${expired ? html`<span class="badge badge-muted">Expired</span>` : html`<span class="badge">Current offer</span>`}
        ${offer.destination ? html`<span class="caption-num text-accent">${offer.destination}</span>` : ''}
      </div>
      <h3>${offer.title}</h3>
      ${offer.description ? html`<p>${offer.description}</p>` : ''}
      ${formatPrice(offer.price, offer.currency) ? html`<p class="offer-price">From <strong>${formatPrice(offer.price, offer.currency)}</strong></p>` : ''}
      ${validity ? html`<p class="offer-validity">Valid ${validity}</p>` : ''}
      ${offer.terms ? html`<details class="offer-terms"><summary>Offer terms</summary><p>${offer.terms}</p></details>` : ''}
      ${expired ? '' : html`<div class="card-actions">
        <a class="button primary" href="/request-quote?offer=${offer.id}">Enquire About This Offer</a>
        ${whatsappButton(site, `Hello Altis Voyage, I'm interested in the offer: ${offer.title}`, { variant: 'secondary whatsapp-outline', location: 'offer' })}
      </div>`}
    </div>
  </article>`;
}

export function testimonialCard(item) {
  const rating = Math.max(0, Math.min(5, Number(item.rating) || 0));
  return html`
  <article class="testimonial">
    <span class="quote-mark" aria-hidden="true">“</span>
    <p>${item.quote || ''}</p>
    <footer>
      <div>
        <strong>${item.name || 'Traveller'}</strong><br />
        <span>${[item.location, item.trip].filter(Boolean).join(' · ')}</span>
        ${item.verified ? html`<span class="badge badge-verified">Verified booking</span>` : ''}
      </div>
      ${rating ? html`<div class="star-row" role="img" aria-label="${rating} out of 5 stars">${'★'.repeat(rating)}</div>` : ''}
    </footer>
  </article>`;
}

export function postCard(post) {
  const path = postPath(post);
  return html`
  <article class="post-card">
    ${post.image ? html`<a class="card-img-wrapper" href="${path}" tabindex="-1" aria-hidden="true">${image(post.image, post.image_alt || post.title)}</a>` : ''}
    <div class="content">
      <span class="caption-num text-accent">${post.category || 'Travel advice'}</span>
      <h3><a href="${path}">${post.title}</a></h3>
      ${post.excerpt ? html`<p>${post.excerpt}</p>` : ''}
      ${post.published_at ? html`<p class="post-date"><time datetime="${post.published_at}">${formatDate(post.published_at)}</time></p>` : ''}
    </div>
  </article>`;
}

export function faqList(faqs, { headingLevel = 3 } = {}) {
  if (!faqs.length) return '';
  return html`<div class="faq-list">${faqs.map((faq) => html`
    <details class="faq-item">
      <summary>${raw(`<span role="heading" aria-level="${headingLevel}">`)}${faq.question}${raw('</span>')}</summary>
      <p>${faq.answer}</p>
    </details>`)}</div>`;
}

export function faqSection(faqs, { heading = 'Frequently asked questions', eyebrow = 'Good to know' } = {}) {
  if (!faqs.length) return '';
  return html`
  <section class="section alt-panel">
    <div class="container narrow">
      ${sectionTop({ eyebrow, heading, link: '/faq', linkLabel: 'All FAQs' })}
      ${faqList(faqs)}
    </div>
  </section>`;
}

export function ctaBand(site, { eyebrow, heading, primary, secondary, whatsappMessage }) {
  return html`
  <section class="cta-band">
    <div class="container cta-inner">
      <div>
        <p class="caption-num">${eyebrow}</p>
        <h2 class="font-display">${heading}</h2>
      </div>
      <div class="cta-actions">
        ${primary ? html`<a href="${primary.href}" class="button primary">${primary.label}</a>` : ''}
        ${secondary ? html`<a href="${secondary.href}" class="button secondary">${secondary.label}</a>` : ''}
        ${whatsappMessage ? whatsappButton(site, whatsappMessage, { variant: 'secondary whatsapp-outline', location: 'cta-band' }) : ''}
      </div>
    </div>
  </section>`;
}

export function processSteps(process) {
  const steps = process?.steps || [];
  if (!steps.length) return '';
  return html`<ol class="process-steps">${steps.map((step, index) => html`
    <li class="process-step"><span class="process-number font-display">${String(index + 1).padStart(2, '0')}</span><h3>${step.title}</h3><p>${step.text}</p></li>`)}</ol>`;
}

export function whyChooseGrid(whyChoose) {
  const items = whyChoose?.items || [];
  if (!items.length) return '';
  return html`<div class="why-grid">${items.map((item, index) => html`
    <article class="why-card"><span class="icon-badge">${icon(WHY_ICONS[index % WHY_ICONS.length])}</span><h3>${item.title}</h3><p>${item.text}</p></article>`)}</div>`;
}

// Numbers such as "4,800+" count up when scrolled into view (app.js); the full text is the
// no-JavaScript fallback, so the figure is always readable.
export function statsGrid(stats) {
  const items = stats?.items || [];
  if (!items.length) return '';
  return html`<div class="stats-grid">${items.map((item) => {
    const match = /^([\d,]+)(\D*)$/.exec(String(item.value).trim());
    const target = match ? Number(match[1].replace(/,/g, '')) : null;
    return html`<div><p class="stat-number font-display"${raw(target ? ` data-count="${target}" data-suffix="${match[2].replace(/"/g, '')}"` : '')}>${item.value}</p><p class="caption-num">${item.label}</p></div>`;
  })}</div>`;
}

// Endlessly scrolling strip of destination and service names. The second copy is hidden from
// assistive technology and only exists to make the loop seamless.
export function ticker(items) {
  const list = items.filter(Boolean);
  if (list.length < 3) return '';
  const copy = (hidden) => html`<div class="ticker-set"${raw(hidden ? ' aria-hidden="true"' : '')} style="display:contents">${list.map((label) => html`<span class="ticker-item">${label}</span>`)}</div>`;
  return html`<div class="ticker" role="marquee" aria-label="Destinations and services"><div class="ticker-track">${copy(false)}${copy(true)}</div></div>`;
}
