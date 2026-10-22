import {
  PRICE_NOTE,
  ctaBand,
  destinationCard,
  faqList,
  faqSection,
  image,
  offerCard,
  packageCard,
  packagePath,
  pageHero,
  postCard,
  postPath,
  priceLabel,
  processSteps,
  sectionTop,
  statsGrid,
  testimonialCard,
  ticker,
  whyChooseGrid
} from './components.js';
import { contactFields, dateFields, enquiryForm, field, row, travellerFields } from './forms.js';
import { formatDate, html, isoDate, markdown, plainText, safeUrl, slugify } from './html.js';
import { icon } from './icons.js';
import { breadcrumbs, organizationSchema, telHref, whatsappButton, whatsappHref } from './layout.js';

const IMAGES = {
  packages: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=70',
  destinations: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=70',
  flights: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=70',
  visa: 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&w=1600&q=70',
  study: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=70',
  offers: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=70',
  blog: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=70',
  about: 'https://images.unsplash.com/photo-1504598318550-17eba1008a68?auto=format&fit=crop&w=1600&q=70',
  contact: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=70'
};

export class NotFound extends Error {}
export class Redirect extends Error {
  constructor(location, status = 301) {
    super(location);
    this.location = location;
    this.status = status;
  }
}

function heroOrDefault(content) {
  return content.hero || {};
}

function contactCard(site, { heading = 'Prefer to talk?' } = {}) {
  const { contact } = site;
  return html`
  <div class="info-card callout-card">
    <div class="info-title"><span class="icon-badge">${icon('message')}</span><h2>${heading}</h2></div>
    <ul class="contact-lines">
      ${contact.phone ? html`<li>Call <a href="${telHref(contact.phone)}">${contact.phone}</a></li>` : ''}
      ${contact.email ? html`<li>Email <a href="mailto:${contact.email}">${contact.email}</a></li>` : ''}
      ${contact.hours ? html`<li class="muted">${contact.hours.replace(/-(?=\d)/g, '–')}</li>` : ''}
    </ul>
    ${whatsappButton(site, 'Hello Altis Voyage, I have a travel question.', { location: 'contact-card' })}
  </div>`;
}

function disclaimer(title, text) {
  return html`<aside class="disclaimer" role="note"><strong>${title}</strong><p>${text}</p></aside>`;
}

// ---------------------------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------------------------

export async function home(ctx) {
  const { site } = ctx;
  const content = await ctx.content();
  const hero = heroOrDefault(content);
  const [packages, destinations, testimonials, gallery, offers, posts] = await Promise.all([
    ctx.packages(), ctx.destinations(), ctx.testimonials(), ctx.gallery(), ctx.currentOffers(), ctx.posts()
  ]);
  const featuredPackages = [...packages].sort((a, b) => Number(b.featured || 0) - Number(a.featured || 0)).slice(0, 4);
  const featuredDestinations = [...destinations].sort((a, b) => Number(b.featured || 0) - Number(a.featured || 0)).slice(0, 6);
  const heroImage = safeUrl(hero.image);

  const services = [
    { href: '/packages', icon: 'compass', title: 'Holiday packages', text: 'Safaris, beach breaks and city escapes, adjusted to your dates and budget.' },
    { href: '/flights', icon: 'plane', title: 'Flight booking', text: 'Tell us your route and dates and we send you fare options to choose from.' },
    { href: '/visa-services', icon: 'passport', title: 'Visa assistance', text: 'Application preparation, document review and appointment booking.' },
    { href: '/study-abroad', icon: 'cap', title: 'Study abroad', text: 'Help choosing courses and destinations, preparing applications and student visas.' },
    { href: '/request-quote', icon: 'bed', title: 'Hotels & transfers', text: 'Hotels, lodges, airport transfers and travel insurance for any trip.' },
    { href: '/trip-planner', icon: 'sparkles', title: 'Trip planner', text: 'Answer a few questions and see the packages that match your plans.' }
  ];

  const titleWords = String(hero.title || 'Your Journey Begins with Altis Voyage').trim().split(/\s+/);
  const titleLead = titleWords.slice(0, -2).join(' ');
  const titleTail = titleWords.slice(-2).join(' ');

  const body = html`
  <section class="hero-section">
    ${heroImage ? html`<img class="hero-image hero-drift" src="${heroImage}" alt="" width="1600" height="1000" fetchpriority="high" />` : ''}
    <div class="hero-overlay"></div>
    <div class="hero-orbs" aria-hidden="true"><span></span><span></span></div>
    <div class="container hero-content">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="caption-num eyebrow-chip">Kampala, Uganda · Travel worldwide</p>
          <h1 class="hero-title">${titleLead}${titleLead ? ' ' : ''}<span class="gradient-text">${titleTail}</span></h1>
          <p class="hero-subtitle">${hero.subtitle || 'Discover destinations, explore travel opportunities and get personalised assistance for your next journey.'}</p>
          <div class="hero-actions">
            <a href="/packages" class="button primary">${hero.ctaPrimary || 'Explore Travel Packages'}</a>
            <a href="/request-quote" class="button secondary">${hero.ctaSecondary || 'Request a Quote'}</a>
          </div>
        </div>
        <aside class="hero-panel" aria-label="Quick links">
          <h2 class="panel-title">Where to next?</h2>
          <p class="panel-sub">Pick a service and tell us your plans.</p>
          <div class="quick-grid">
            <a class="quick-tile" href="/packages">${icon('compass')}<strong>Packages</strong><span>Safaris, beaches, cities</span></a>
            <a class="quick-tile" href="/flights">${icon('plane')}<strong>Flights</strong><span>Fare options from our team</span></a>
            <a class="quick-tile" href="/visa-services">${icon('passport')}<strong>Visas</strong><span>Prepare and review your application</span></a>
            <a class="quick-tile" href="/study-abroad">${icon('cap')}<strong>Study abroad</strong><span>Courses and scholarships</span></a>
          </div>
          ${whatsappButton(site, 'Hello Altis Voyage, I would like help planning a trip.', { label: 'Chat on WhatsApp', variant: 'whatsapp full-width', location: 'home-hero' })}
        </aside>
      </div>
      ${statsGrid(content.stats)}
    </div>
  </section>

  ${ticker([...destinations.map((item) => item.name), 'Flight booking', 'Visa assistance', 'Study abroad', 'Hotels & transfers', 'Travel insurance'])}

  <section class="section">
    <div class="container">
      ${sectionTop({ eyebrow: 'What we arrange', heading: 'Everything between you and departure', link: '/about', linkLabel: 'About Altis Voyage' })}
      <div class="bento">${services.map((service) => html`
        <a class="service-card service-link" href="${service.href}"><span class="card-icon">${icon(service.icon)}</span><h3>${service.title}</h3><p>${service.text}</p><span class="inline-link">Find out more</span></a>`)}</div>
    </div>
  </section>

  ${featuredPackages.length ? html`
  <section class="section alt-panel">
    <div class="container">
      ${sectionTop({ eyebrow: 'Travel packages', heading: 'Signature journeys', link: '/packages', linkLabel: 'All packages' })}
      <div class="package-grid">${featuredPackages.map((pkg) => packageCard(pkg))}</div>
      <p class="price-note">${PRICE_NOTE}</p>
    </div>
  </section>` : ''}

  ${featuredDestinations.length ? html`
  <section class="section">
    <div class="container">
      ${sectionTop({ eyebrow: 'Destinations', heading: 'Where we take you', link: '/destinations', linkLabel: 'All destinations' })}
      <div class="destination-grid">${featuredDestinations.map((destination) => destinationCard(destination, packages))}</div>
    </div>
  </section>` : ''}

  ${content.why_choose ? html`
  <section class="section alt-panel">
    <div class="container">
      ${sectionTop({ eyebrow: 'Why Altis Voyage', heading: content.why_choose.heading || 'Why travellers choose Altis Voyage' })}
      ${content.why_choose.intro ? html`<p class="lede section-lede">${content.why_choose.intro}</p>` : ''}
      ${whyChooseGrid(content.why_choose)}
    </div>
  </section>` : ''}

  ${content.process ? html`
  <section class="section">
    <div class="container">
      ${sectionTop({ eyebrow: 'How it works', heading: content.process.heading || 'How booking with us works', link: '/faq', linkLabel: 'Questions? Read the FAQ' })}
      ${processSteps(content.process)}
    </div>
  </section>` : ''}

  ${offers.length ? html`
  <section class="section alt-panel">
    <div class="container">
      ${sectionTop({ eyebrow: 'Current offers', heading: 'Travel offers', link: '/offers', linkLabel: 'All offers' })}
      <div class="offer-grid">${offers.slice(0, 3).map((offer) => offerCard(site, offer))}</div>
    </div>
  </section>` : ''}

  <section class="section">
    <div class="container">
      ${sectionTop({ eyebrow: 'Travellers', heading: 'Word from the road' })}
      ${testimonials.length
        ? html`<div class="testimonial-list">${testimonials.slice(0, 4).map(testimonialCard)}</div>`
        : html`<div class="empty-state"><p>Travelled with us? We would love to hear about your trip.</p><a class="button secondary" href="/contact">Share your experience</a></div>`}
    </div>
  </section>

  ${gallery.length ? html`
  <section class="section alt-panel">
    <div class="container">
      ${sectionTop({ eyebrow: 'Field notes', heading: 'From recent journeys' })}
      <div class="gallery-grid">${gallery.slice(0, 8).map((item) => html`
        <figure class="gallery-item">${image(item.image, item.title || 'Travel photo')}<figcaption><strong>${item.title || 'On the road'}</strong><span>${item.category || 'Altis field note'}</span></figcaption></figure>`)}</div>
    </div>
  </section>` : ''}

  ${posts.length ? html`
  <section class="section">
    <div class="container">
      ${sectionTop({ eyebrow: 'Travel advice', heading: 'Plan with confidence', link: '/blog', linkLabel: 'All articles' })}
      <div class="post-grid">${posts.slice(0, 3).map(postCard)}</div>
    </div>
  </section>` : ''}

  <section class="section inquiry-section alt-panel" id="enquire">
    <div class="container inquiry-wrap">
      <div>
        <p class="caption-num text-accent">Start here</p>
        <h2 class="section-heading font-display">Tell us where you're going</h2>
        <p class="lede">Send a request and a consultant replies within one working day with routes, dates, prices and visa guidance. You'll get a reference number straight away.</p>
        <div class="inline-actions">
          ${whatsappButton(site, 'Hello Altis Voyage, I would like help planning a trip.', { label: 'Chat on WhatsApp', location: 'home-enquiry' })}
          <a class="button secondary" href="/trip-planner">Try the trip planner</a>
        </div>
      </div>
      ${enquiryForm({
        service: 'general',
        id: 'homepage-inquiry-form',
        submitLabel: 'Send my request',
        body: html`
          ${contactFields()}
          ${field({ name: 'interest', label: "I'm interested in", type: 'select', options: ['Holiday package', 'Uganda safari', 'International travel', 'Flight booking', 'Visa assistance', 'Study abroad', 'Accommodation', 'Something else'] })}
          ${field({ name: 'message', label: 'Your plans', type: 'textarea', required: true, attrs: 'placeholder="Destination, dates, number of travellers, budget…"' })}`
      })}
    </div>
  </section>`;

  return {
    path: '/',
    active: 'home',
    title: 'Altis Voyage | Travel Packages, Flights, Visas & Study Abroad from Kampala',
    description: 'Kampala travel agency for holiday packages, Uganda safaris, flight bookings, visa assistance, hotel bookings and study-abroad support. Request a personalised quote.',
    image: heroImage,
    preloadImage: heroImage,
    schema: [organizationSchema(site), { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Altis Voyage', url: `${site.siteUrl}/` }],
    body
  };
}

// ---------------------------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------------------------

export async function packages(ctx) {
  const { site } = ctx;
  const list = await ctx.packages();
  const countries = [...new Set(list.map((pkg) => String(pkg.destination || '').split(',').pop().trim()).filter(Boolean))].sort();
  const query = String(ctx.query.q || '').slice(0, 80);
  const crumbs = breadcrumbs(site, [{ name: 'Travel packages', path: '/packages' }]);

  const body = html`
  ${pageHero({ eyebrow: 'Travel packages', title: 'Find your next journey', subtitle: 'Safaris, beach breaks and city escapes. Choose a package and request a quote; we adjust it to your dates, travellers and budget.', image: IMAGES.packages })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container">
      <div class="destinations-toolbar" data-filter-toolbar>
        <label class="visually-hidden" for="package-search">Search packages</label>
        <input id="package-search" type="search" placeholder="Search packages, e.g. gorilla, Dubai…" value="${query}" data-filter-search />
        <label class="visually-hidden" for="package-country">Filter by country</label>
        <select id="package-country" data-filter-select="country">
          <option value="all">All countries</option>
          ${countries.map((country) => html`<option value="${country.toLowerCase()}">${country}</option>`)}
        </select>
      </div>
      ${list.length
        ? html`<div class="package-grid" data-filter-list>${list.map((pkg) => packageCard(pkg, { headingLevel: 2 }))}</div>
          <p class="empty-state" data-filter-empty hidden>No packages match your search. <a href="/request-quote">Ask us for a custom trip</a> instead.</p>
          <p class="price-note">${PRICE_NOTE}</p>`
        : html`<div class="empty-state"><p>Our packages are being updated. Tell us where you'd like to go and we'll put together options for you.</p><a class="button primary" href="/request-quote">Request a Quote</a></div>`}
    </div>
  </section>
  ${ctaBand(site, { eyebrow: "Can't find what you need?", heading: 'We build fully custom itineraries', primary: { href: '/request-quote', label: 'Request a Quote' }, secondary: { href: '/trip-planner', label: 'Use the trip planner' }, whatsappMessage: 'Hello Altis Voyage, I would like a custom trip.' })}`;

  return {
    path: '/packages',
    active: 'packages',
    title: 'Travel Packages & Uganda Safaris',
    description: 'Browse Altis Voyage travel packages: gorilla trekking, Uganda safaris, Zanzibar beach breaks, Dubai city escapes and more. Request a personalised quotation.',
    schema: [crumbs.schema],
    body
  };
}

export async function packageDetail(ctx, slug) {
  const { site } = ctx;
  const id = Number.parseInt(slug, 10);
  const list = await ctx.packages();
  const pkg = list.find((item) => Number(item.id) === id);
  if (!pkg) throw new NotFound();
  const canonical = packagePath(pkg);
  if (`/packages/${slug}` !== canonical) throw new Redirect(canonical);

  const related = list.filter((item) => item.id !== pkg.id).slice(0, 2);
  const crumbs = breadcrumbs(site, [{ name: 'Travel packages', path: '/packages' }, { name: pkg.title, path: canonical }]);
  const message = `Hello Altis Voyage, I'm interested in the ${pkg.title} package.`;

  const body = html`
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container detail-layout">
      <article class="detail-main">
        <p class="caption-num text-accent">${pkg.destination || 'Travel package'}</p>
        <h1 class="font-display detail-title">${pkg.title}</h1>
        <div class="detail-image">${image(pkg.image, pkg.title, { eager: true, width: 1200, height: 800 })}</div>
        <dl class="detail-facts">
          <div><dt>Duration</dt><dd>${pkg.days ? `${pkg.days} days` : 'Flexible'}</dd></div>
          <div><dt>Destination</dt><dd>${pkg.destination || 'On request'}</dd></div>
          <div><dt>Price</dt><dd>${priceLabel(pkg.price)}</dd></div>
        </dl>
        <div class="prose">
          <p>${pkg.description || ''}</p>
          <h2>What happens when you request a quote</h2>
          <p>We check availability for your dates, adjust the itinerary to your group and send you a written quotation. Your package is booked only once you accept the quotation and our team confirms it in writing.</p>
        </div>
        <p class="price-note">${PRICE_NOTE}</p>
        <div class="inline-actions">
          <button class="button secondary" type="button" data-save-trip="${pkg.id}" data-title="${pkg.title}" data-price="${pkg.price || 0}" data-path="${canonical}">Save to My Trip</button>
          ${whatsappButton(site, message, { label: 'Ask on WhatsApp', location: 'package' })}
        </div>
      </article>
      <aside class="detail-aside" id="quote">
        ${enquiryForm({
          service: 'package',
          id: 'package-quote-form',
          heading: 'Request a Quote',
          intro: 'Tell us your dates and who is travelling.',
          submitLabel: 'Book Now – Request a Quote',
          hidden: { package_id: pkg.id, packages: pkg.title, interest: `Package: ${pkg.title}` },
          body: html`
            ${contactFields()}
            ${dateFields({ departLabel: 'Preferred start date', returnLabel: 'End date' })}
            ${travellerFields({ adults: 2 })}
            ${field({ name: 'message', label: 'Anything else we should know?', type: 'textarea', attrs: 'placeholder="Room preferences, dietary needs, celebrations…"' })}`
        })}
      </aside>
    </div>
  </section>
  ${related.length ? html`
  <section class="section alt-panel">
    <div class="container">
      ${sectionTop({ eyebrow: 'You might also like', heading: 'More journeys', link: '/packages', linkLabel: 'All packages' })}
      <div class="package-grid">${related.map((item) => packageCard(item))}</div>
    </div>
  </section>` : ''}`;

  return {
    path: canonical,
    active: 'packages',
    analyticsPage: 'package',
    title: `${pkg.title}${pkg.days ? ` – ${pkg.days} Days` : ''}`,
    description: plainText(`${pkg.title}${pkg.destination ? ` in ${pkg.destination}` : ''}. ${pkg.description || ''} Request a personalised quote from Altis Voyage.`, 158),
    image: safeUrl(pkg.image),
    preloadImage: safeUrl(pkg.image),
    whatsappMessage: message,
    schema: [
      crumbs.schema,
      {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: pkg.title,
        description: pkg.description || undefined,
        image: safeUrl(pkg.image) || undefined,
        url: `${site.siteUrl}${canonical}`,
        provider: { '@type': 'TravelAgency', name: 'Altis Voyage Travel Services Ltd', url: `${site.siteUrl}/` }
      }
    ],
    body,
    packageView: { id: pkg.id, title: pkg.title }
  };
}

// ---------------------------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------------------------

export async function destinations(ctx) {
  const { site } = ctx;
  const [list, packageList] = await Promise.all([ctx.destinations(), ctx.packages()]);
  const crumbs = breadcrumbs(site, [{ name: 'Destinations', path: '/destinations' }]);
  const regions = [['all', 'All'], ['uganda', 'Uganda'], ['east-africa', 'East Africa'], ['international', 'International']];

  const body = html`
  ${pageHero({ eyebrow: 'Where we go', title: 'The map, our way', subtitle: 'From gorilla highlands to Gulf skylines. Every journey includes planning, documentation guidance and support from our Kampala team.', image: IMAGES.destinations })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container">
      <div class="destinations-toolbar" data-filter-toolbar>
        <div class="region-tabs" role="group" aria-label="Destination regions">
          ${regions.map(([value, label], index) => html`<button class="region-pill${index === 0 ? ' active' : ''}" type="button" data-filter-pill="region" data-value="${value}" aria-pressed="${index === 0 ? 'true' : 'false'}">${label}</button>`)}
        </div>
        <label class="visually-hidden" for="destination-search">Search destinations</label>
        <input id="destination-search" type="search" placeholder="Search destinations…" data-filter-search />
      </div>
      <div class="destination-grid" data-filter-list>${list.map((destination) => destinationCard(destination, packageList))}</div>
      <p class="empty-state" data-filter-empty hidden>No destinations match. <a href="/request-quote">Tell us where you'd like to go</a>.</p>
      <p class="price-note">* Indicative starting prices. Final prices are confirmed in your quotation.</p>
    </div>
  </section>
  ${ctaBand(site, { eyebrow: 'Ready to go?', heading: "Let's plan your trip together", primary: { href: '/request-quote', label: 'Request a Quote' }, secondary: { href: '/packages', label: 'Explore packages' }, whatsappMessage: 'Hello Altis Voyage, I need help choosing a destination.' })}`;

  return {
    path: '/destinations',
    active: 'destinations',
    title: 'Destinations – Uganda, East Africa & Worldwide',
    description: 'Uganda safaris, East African escapes and international destinations including Dubai, Zanzibar and the Maasai Mara, planned by a Kampala travel agency.',
    schema: [crumbs.schema],
    body
  };
}

// ---------------------------------------------------------------------------------------------
// Flights
// ---------------------------------------------------------------------------------------------

export async function flights(ctx) {
  const { site } = ctx;
  const faqs = await ctx.faqs('flights');
  const crumbs = breadcrumbs(site, [{ name: 'Flight booking', path: '/flights' }]);

  const body = html`
  ${pageHero({ eyebrow: 'Flight booking', title: 'Flights from Entebbe to anywhere', subtitle: 'Tell us where and when you want to fly. We check fares with airlines and authorised suppliers and send you the options.', image: IMAGES.flights, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container inquiry-wrap">
      <div>
        <h2 class="section-heading font-display">How flight requests work</h2>
        <ol class="simple-steps">
          <li><strong>Send your route and dates.</strong> One-way, return or multi-city, for any number of travellers.</li>
          <li><strong>We search and quote.</strong> A consultant checks fares and schedules and sends you options, usually within one working day.</li>
          <li><strong>You choose, we book.</strong> Once you confirm an option and payment terms, we issue your ticket and send it to you.</li>
        </ol>
        ${disclaimer('Fares are not live prices', 'This website does not show live flight availability. Fares and seats are confirmed only when our travel team or an authorised supplier books them, and a fare is guaranteed only once the ticket is issued.')}
        <div class="info-card checklist-card">
          <div class="info-title"><span class="icon-badge">${icon('shield')}</span><h2>Have these ready</h2></div>
          <ul>
            <li>Each traveller's name exactly as in their passport</li>
            <li>Passport valid for at least 6 months after travel</li>
            <li>Any visa needed for your destination or transit points</li>
            <li>Baggage or seating needs, and any special assistance</li>
          </ul>
        </div>
        ${contactCard(site)}
      </div>
      ${enquiryForm({
        service: 'flight',
        id: 'flight-form',
        heading: 'Request Flight Assistance',
        submitLabel: 'Request Flight Assistance',
        body: html`
          <fieldset class="field-group">
            <legend class="field-label">Trip type <abbr title="required">*</abbr></legend>
            <div class="choice-row">
              <label class="choice"><input type="radio" name="trip_type" value="return" checked /> Return</label>
              <label class="choice"><input type="radio" name="trip_type" value="one-way" /> One-way</label>
              <label class="choice"><input type="radio" name="trip_type" value="multi-city" /> Multi-city</label>
            </div>
            <span class="field-error" data-error-for="trip_type"></span>
          </fieldset>
          ${row(
            field({ name: 'from', label: 'From (city or airport)', required: true, value: 'Entebbe (EBB)' }),
            field({ name: 'to', label: 'To (city or airport)', required: true, attrs: 'placeholder="e.g. Dubai (DXB)"' })
          )}
          ${row(
            field({ name: 'depart_date', label: 'Departure date', type: 'date', required: true, attrs: 'data-min-today' }),
            field({ name: 'return_date', label: 'Return date', type: 'date', attrs: 'data-min-today data-return-date' })
          )}
          ${field({ name: 'flexible_dates', label: 'Are your dates flexible?', type: 'select', options: [['no', 'No, these exact dates'], ['yes', 'Yes, a few days either way']] })}
          ${row(
            field({ name: 'adults', label: 'Adults (12+)', type: 'number', value: 1, required: true, attrs: 'min="1" max="50" inputmode="numeric"' }),
            field({ name: 'children', label: 'Children (2–11)', type: 'number', value: 0, attrs: 'min="0" max="50" inputmode="numeric"' })
          )}
          ${row(
            field({ name: 'infants', label: 'Infants (under 2)', type: 'number', value: 0, attrs: 'min="0" max="20" inputmode="numeric"' }),
            field({ name: 'cabin_class', label: 'Travel class', type: 'select', options: [['economy', 'Economy'], ['premium-economy', 'Premium economy'], ['business', 'Business'], ['first', 'First']] })
          )}
          ${contactFields()}
          ${field({ name: 'message', label: 'Additional requirements', type: 'textarea', attrs: 'placeholder="Preferred airline, baggage, wheelchair assistance, multi-city stops…"' })}`
      })}
    </div>
  </section>
  ${faqSection(faqs, { heading: 'Flight questions' })}`;

  return {
    path: '/flights',
    active: 'flights',
    analyticsPage: 'flights',
    title: 'Flight Booking from Entebbe – Request a Fare Quote',
    description: 'Request flight assistance from Altis Voyage in Kampala. Send your route, dates and travellers and our team will send you fare options from airlines and authorised suppliers.',
    whatsappMessage: 'Hello Altis Voyage, I would like help booking a flight.',
    schema: [crumbs.schema],
    body
  };
}

// ---------------------------------------------------------------------------------------------
// Visa services
// ---------------------------------------------------------------------------------------------

export async function visa(ctx) {
  const { site } = ctx;
  const [content, faqs] = await Promise.all([ctx.content(), ctx.faqs('visa')]);
  const sources = content.visa_sources || {};
  const crumbs = breadcrumbs(site, [{ name: 'Visa services', path: '/visa-services' }]);

  const body = html`
  ${pageHero({ eyebrow: 'Visa services', title: 'Visa assistance, honestly', subtitle: 'We help you prepare a complete, carefully checked application, book your appointment and understand what to expect.', image: IMAGES.visa, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container inquiry-wrap">
      <div>
        <h2 class="section-heading font-display">How we can help</h2>
        <ul class="feature-list">
          <li><strong>Application preparation</strong> for tourist, business, family-visit and student visas.</li>
          <li><strong>Document review</strong> so your application is complete and consistent before you submit it.</li>
          <li><strong>Appointment booking</strong> with embassies and visa application centres where applicable.</li>
          <li><strong>Supporting bookings</strong> such as flight reservations, hotel bookings and travel insurance.</li>
          <li><strong>Passport and travel documentation guidance</strong> for Ugandan passport applications, renewals and yellow fever cards.</li>
        </ul>
        ${disclaimer('We cannot guarantee a visa', 'Visa requirements, fees, processing times and decisions are set by the relevant embassy, consulate or immigration authority. Altis Voyage is not affiliated with any embassy and no agency can guarantee approval. Fees paid to third parties are generally non-refundable if an application is refused.')}
        <div class="info-card checklist-card">
          <div class="info-title"><span class="icon-badge">${icon('shield')}</span><h2>Commonly requested documents</h2></div>
          <ul>
            <li>Passport valid for at least 6 months beyond travel</li>
            <li>Recent passport-size photographs</li>
            <li>Bank statements or proof of funds</li>
            <li>Invitation letter or hotel confirmation</li>
            <li>Return flight reservation</li>
            <li>Yellow fever vaccination certificate</li>
          </ul>
          <p class="muted small">Requirements differ by country and visa type. We give you a checklist for your specific application. Please do not upload documents through this website.</p>
        </div>
        ${(sources.items || []).length ? html`
        <div class="info-card">
          <div class="info-title"><span class="icon-badge">${icon('globe')}</span><h2>Check official sources</h2></div>
          ${sources.intro ? html`<p class="muted">${sources.intro}</p>` : ''}
          <ul class="source-list">${sources.items.map((item) => safeUrl(item.url) ? html`<li><a href="${safeUrl(item.url)}" target="_blank" rel="noopener">${item.name}</a></li>` : '')}</ul>
        </div>` : ''}
      </div>
      ${enquiryForm({
        service: 'visa',
        id: 'visa-form',
        heading: 'Enquire About Visa Assistance',
        submitLabel: 'Enquire About Visa Assistance',
        body: html`
          ${row(
            field({ name: 'destination_country', label: 'Country you plan to visit', required: true, attrs: 'placeholder="e.g. United Kingdom"' }),
            field({ name: 'nationality', label: 'Your nationality', required: true, value: 'Ugandan' })
          )}
          ${row(
            field({ name: 'visa_type', label: 'Visa type', type: 'select', required: true, options: [['tourist', 'Tourist / visit'], ['business', 'Business'], ['family-visit', 'Family visit'], ['student', 'Student'], ['transit', 'Transit'], ['work', 'Work'], ['other', 'Other / not sure']] }),
            field({ name: 'travel_date', label: 'Intended travel date', type: 'date', attrs: 'data-min-today' })
          )}
          ${field({ name: 'applicants', label: 'Number of applicants', type: 'number', value: 1, attrs: 'min="1" max="50" inputmode="numeric"' })}
          ${contactFields()}
          ${field({ name: 'message', label: 'How can we help?', type: 'textarea', attrs: 'placeholder="Purpose of travel, previous travel, questions… Please do not include passport numbers."' })}`
      })}
    </div>
  </section>
  ${faqSection(faqs, { heading: 'Visa questions' })}`;

  return {
    path: '/visa-services',
    active: 'visa',
    analyticsPage: 'visa',
    title: 'Visa Assistance in Kampala – Applications & Document Review',
    description: 'Visa application preparation, document review and appointment booking for tourist, business, family-visit and student visas. Altis Voyage cannot guarantee visa decisions.',
    whatsappMessage: 'Hello Altis Voyage, I would like help with a visa application.',
    schema: [crumbs.schema],
    body
  };
}

// ---------------------------------------------------------------------------------------------
// Study abroad and scholarships
// ---------------------------------------------------------------------------------------------

export async function study(ctx) {
  const { site } = ctx;
  const [opportunities, faqs] = await Promise.all([ctx.openOpportunities(), ctx.faqs('study')]);
  const selected = opportunities.find((item) => Number(item.id) === Number(ctx.query.opportunity));
  const crumbs = breadcrumbs(site, [{ name: 'Study abroad & scholarships', path: '/study-abroad' }]);

  const body = html`
  ${pageHero({ eyebrow: 'Study abroad & scholarships', title: 'Study abroad with a plan', subtitle: 'Guidance on destinations and courses, help preparing applications, and student visa support from our Kampala team.', image: IMAGES.study, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container">
      <div class="why-grid">
        <article class="why-card"><span class="icon-badge">${icon('compass')}</span><h3>Choose a destination and course</h3><p>We help you compare countries, institutions and study pathways against your goals, qualifications and budget.</p></article>
        <article class="why-card"><span class="icon-badge">${icon('sparkles')}</span><h3>Prepare your application</h3><p>Support with application forms, personal statements, document checklists and deadlines.</p></article>
        <article class="why-card"><span class="icon-badge">${icon('passport')}</span><h3>Student visa and travel</h3><p>Student visa application preparation, flights, accommodation and pre-departure guidance.</p></article>
      </div>
      ${disclaimer('No guarantees on admission, scholarships or visas', 'Admission decisions are made by institutions, scholarship awards by the scholarship providers, and visa decisions by the relevant authorities. We help you prepare complete applications but cannot guarantee any outcome.')}
    </div>
  </section>

  <section class="section alt-panel" id="opportunities">
    <div class="container">
      ${sectionTop({ eyebrow: 'Verified opportunities', heading: 'Scholarships & study opportunities' })}
      ${opportunities.length
        ? html`<div class="opportunity-list">${opportunities.map((item) => html`
          <article class="opportunity-card" id="opportunity-${item.id}">
            <div class="offer-meta">
              <span class="badge">${item.kind === 'program' ? 'Study programme' : 'Scholarship'}</span>
              ${item.country ? html`<span class="caption-num text-accent">${item.country}</span>` : ''}
              ${item.level ? html`<span class="caption-num">${item.level}</span>` : ''}
            </div>
            <h3>${item.title}</h3>
            ${item.institution ? html`<p class="muted">${item.institution}</p>` : ''}
            ${item.summary ? html`<p>${item.summary}</p>` : ''}
            <dl class="detail-facts compact">
              ${item.deadline ? html`<div><dt>Deadline</dt><dd>${formatDate(item.deadline)}</dd></div>` : html`<div><dt>Deadline</dt><dd>Check with the provider</dd></div>`}
              ${item.eligibility ? html`<div><dt>Eligibility</dt><dd>${item.eligibility}</dd></div>` : ''}
              ${item.documents ? html`<div><dt>Documents</dt><dd>${item.documents}</dd></div>` : ''}
            </dl>
            <p class="source-line">
              ${safeUrl(item.source_url) ? html`Source: <a href="${safeUrl(item.source_url)}" target="_blank" rel="noopener">${item.source_name || 'Official page'}</a>` : item.source_name ? html`Source: ${item.source_name}` : ''}
              ${item.verified_at ? html` · Details checked ${formatDate(item.verified_at)}` : ''}
            </p>
            <a class="button secondary" href="/study-abroad?opportunity=${item.id}#study-form">Enquire about this opportunity</a>
          </article>`)}</div>
          <p class="price-note">Always confirm deadlines and eligibility on the provider's official page before applying.</p>`
        : html`<div class="empty-state"><p>We are verifying current scholarships and study opportunities before listing them here. Tell us what you are looking for and we will share options that match your profile.</p></div>`}
    </div>
  </section>

  <section class="section">
    <div class="container inquiry-wrap">
      <div>
        <p class="caption-num text-accent">Start your application</p>
        <h2 class="section-heading font-display">Enquire about study opportunities</h2>
        <p class="lede">Share your plans and a consultant will contact you to discuss destinations, courses, funding and next steps.</p>
        ${contactCard(site, { heading: 'Talk to a consultant' })}
      </div>
      ${enquiryForm({
        service: 'study',
        id: 'study-form',
        submitLabel: 'Enquire About Study Opportunities',
        hidden: selected ? { opportunity: selected.title } : {},
        body: html`
          ${selected ? html`<p class="selected-item">Enquiring about: <strong>${selected.title}</strong></p>` : ''}
          ${row(
            field({ name: 'study_countries', label: 'Preferred study countries', required: true, value: selected?.country || '', attrs: 'placeholder="e.g. UK, Canada"' }),
            field({ name: 'study_level', label: 'Study level', type: 'select', required: true, options: [['undergraduate', 'Undergraduate'], ['postgraduate', "Postgraduate (Master's)"], ['phd', 'PhD'], ['diploma', 'Diploma'], ['certificate', 'Certificate'], ['short-course', 'Short course'], ['not-sure', 'Not sure yet']] })
          )}
          ${row(
            field({ name: 'field_of_study', label: 'Field of study', attrs: 'placeholder="e.g. Nursing, Computer Science"' }),
            field({ name: 'intake', label: 'Preferred intake', attrs: 'placeholder="e.g. September 2027"' })
          )}
          ${row(
            field({ name: 'highest_qualification', label: 'Highest qualification', attrs: 'placeholder="e.g. UACE, Bachelor\'s degree"' }),
            field({ name: 'funding', label: 'Funding', type: 'select', options: [['self-funded', 'Self-funded'], ['scholarship', 'Looking for a scholarship'], ['both', 'Both'], ['not-sure', 'Not sure']] })
          )}
          ${contactFields()}
          ${field({ name: 'message', label: 'Anything else?', type: 'textarea' })}`
      })}
    </div>
  </section>
  ${faqSection(faqs, { heading: 'Study abroad questions' })}`;

  return {
    path: '/study-abroad',
    active: 'study',
    analyticsPage: 'study',
    title: 'Study Abroad & Scholarships – Application Support',
    description: 'Study abroad guidance from Altis Voyage in Kampala: choosing destinations and courses, preparing applications, verified scholarship listings and student visa support.',
    whatsappMessage: 'Hello Altis Voyage, I would like to ask about studying abroad.',
    schema: [crumbs.schema],
    body
  };
}

// ---------------------------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------------------------

export async function offers(ctx) {
  const { site } = ctx;
  const [current, expired] = await Promise.all([ctx.currentOffers(), ctx.expiredOffers()]);
  const crumbs = breadcrumbs(site, [{ name: 'Travel offers', path: '/offers' }]);

  const body = html`
  ${pageHero({ eyebrow: 'Travel offers', title: 'Current travel offers', subtitle: 'Promotions approved by the Altis Voyage team. Availability is limited and confirmed when we send your quotation.', image: IMAGES.offers, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container">
      ${current.length
        ? html`<div class="offer-grid">${current.map((offer) => offerCard(site, offer))}</div>`
        : html`<div class="empty-state"><p>There are no promotions running right now. Our packages can still be tailored to your budget.</p><div class="inline-actions"><a class="button primary" href="/packages">Explore Travel Packages</a><a class="button secondary" href="/request-quote">Request a Quote</a></div></div>`}
      <p class="price-note">Offer prices are subject to availability at the time of booking and to the terms shown with each offer.</p>
      ${expired.length ? html`
      <details class="expired-offers">
        <summary>Recently expired offers (${expired.length})</summary>
        <p class="muted">These offers are no longer available and are shown for reference only.</p>
        <div class="offer-grid">${expired.map((offer) => offerCard(site, offer, { expired: true }))}</div>
      </details>` : ''}
    </div>
  </section>
  ${ctaBand(site, { eyebrow: 'Looking for something specific?', heading: 'Tell us your budget and dates', primary: { href: '/request-quote', label: 'Request a Quote' }, whatsappMessage: 'Hello Altis Voyage, do you have any current travel offers?' })}`;

  return {
    path: '/offers',
    active: 'offers',
    title: 'Travel Offers & Promotions',
    description: 'Current travel offers and promotions from Altis Voyage in Kampala, with validity dates and terms. Enquire to check availability for your dates.',
    whatsappMessage: 'Hello Altis Voyage, do you have any current travel offers?',
    schema: [crumbs.schema],
    body
  };
}

// ---------------------------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------------------------

export async function blog(ctx) {
  const { site } = ctx;
  const posts = await ctx.posts();
  const categories = [...new Map(posts.filter((post) => post.category).map((post) => [slugify(post.category), post.category])).entries()];
  const activeCategory = slugify(ctx.query.category || '');
  const activeTag = slugify(ctx.query.tag || '');
  const visible = posts.filter((post) => (!activeCategory || slugify(post.category) === activeCategory)
    && (!activeTag || String(post.tags || '').split(',').map(slugify).includes(activeTag)));
  const crumbs = breadcrumbs(site, [{ name: 'Travel advice', path: '/blog' }]);
  const filtered = Boolean(activeCategory || activeTag);

  const body = html`
  ${pageHero({ eyebrow: 'Travel advice', title: 'Travel advice & guides', subtitle: 'Planning tips, destination guides, visa preparation and study-abroad guidance from the Altis Voyage team.', image: IMAGES.blog, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container">
      ${categories.length ? html`<nav class="region-tabs category-tabs" aria-label="Article categories">
        <a class="region-pill${!filtered ? ' active' : ''}" href="/blog">All</a>
        ${categories.map(([slug, label]) => html`<a class="region-pill${slug === activeCategory ? ' active' : ''}" href="/blog?category=${slug}">${label}</a>`)}
      </nav>` : ''}
      ${visible.length
        ? html`<div class="post-grid">${visible.map(postCard)}</div>`
        : html`<div class="empty-state"><p>${filtered ? 'No articles in this category yet.' : 'Our first travel guides are on their way.'} Have a question in the meantime? Ask our team.</p><div class="inline-actions"><a class="button primary" href="/contact">Ask a Travel Question</a>${whatsappButton(site, 'Hello Altis Voyage, I have a travel question.', { variant: 'secondary whatsapp-outline', location: 'blog-empty' })}</div></div>`}
    </div>
  </section>`;

  return {
    path: '/blog',
    active: 'blog',
    title: 'Travel Advice, Destination Guides & Visa Tips',
    description: 'Travel planning tips, destination guides, visa preparation and study-abroad advice from Altis Voyage, a travel agency in Kampala, Uganda.',
    // Filtered listings repeat the main page, so only the unfiltered list is indexed.
    noindex: filtered,
    schema: [crumbs.schema],
    body
  };
}

function relatedPackagesFor(post, list) {
  const words = `${post.tags || ''} ${post.category || ''} ${post.title || ''}`.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 3);
  const scored = list
    .map((pkg) => {
      const haystack = `${pkg.title} ${pkg.destination} ${pkg.description}`.toLowerCase();
      return { pkg, score: words.filter((word) => haystack.includes(word)).length };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.pkg);
  return (scored.length ? scored : list.filter((pkg) => Number(pkg.featured))).slice(0, 2);
}

export async function article(ctx, slug) {
  const { site } = ctx;
  const posts = await ctx.posts();
  const post = posts.find((item) => item.slug === slug);
  if (!post) throw new NotFound();
  const related = relatedPackagesFor(post, await ctx.packages());
  const path = postPath(post);
  const crumbs = breadcrumbs(site, [{ name: 'Travel advice', path: '/blog' }, { name: post.title, path }]);
  const updated = isoDate(post.updated_at);
  const published = isoDate(post.published_at) || isoDate(post.created_at);
  const sources = String(post.sources || '').split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [name, url] = line.split('|').map((part) => part.trim());
    return { name: name || url, url: safeUrl(url || (name && /^https?:/.test(name) ? name : '')) };
  });
  const tags = String(post.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);

  const body = html`
  ${crumbs.markup}
  <article class="section section-tight">
    <div class="container narrow">
      <header class="article-header">
        ${post.category ? html`<a class="caption-num text-accent" href="/blog?category=${slugify(post.category)}">${post.category}</a>` : ''}
        <h1 class="font-display detail-title">${post.title}</h1>
        <p class="article-meta">
          ${post.author ? html`By ${post.author} · ` : ''}
          ${published ? html`Published <time datetime="${published}">${formatDate(published)}</time>` : ''}
          ${updated && updated !== published ? html` · Updated <time datetime="${updated}">${formatDate(updated)}</time>` : ''}
        </p>
        ${post.reviewed_at ? html`<p class="article-reviewed">Information last checked on ${formatDate(post.reviewed_at)}. Requirements can change, so please confirm with official sources.</p>` : ''}
      </header>
      ${post.image ? html`<div class="detail-image">${image(post.image, post.image_alt || post.title, { eager: true, width: 1200, height: 700 })}</div>` : ''}
      <div class="prose">${markdown(post.body, { headingOffset: 0 })}</div>
      ${sources.length ? html`<aside class="info-card"><h2 class="small-heading">Sources</h2><ul class="source-list">${sources.map((source) => html`<li>${source.url ? html`<a href="${source.url}" target="_blank" rel="noopener">${source.name}</a>` : source.name}</li>`)}</ul></aside>` : ''}
      ${tags.length ? html`<p class="tag-list">${tags.map((tag) => html`<a class="tag" href="/blog?tag=${slugify(tag)}">#${tag}</a>`)}</p>` : ''}
      <aside class="article-cta">
        <h2 class="font-display">Planning a trip?</h2>
        <p>Our team can turn this advice into a plan with real prices and dates.</p>
        <div class="inline-actions">
          <a class="button primary" href="/packages">Explore Relevant Packages</a>
          <a class="button secondary" href="/request-quote">Ask a Travel Question</a>
          ${whatsappButton(site, `Hello Altis Voyage, I read your article "${post.title}" and have a question.`, { variant: 'secondary whatsapp-outline', location: 'article' })}
        </div>
      </aside>
    </div>
  </article>
  ${related.length ? html`
  <section class="section alt-panel">
    <div class="container">
      ${sectionTop({ eyebrow: 'Related journeys', heading: 'Packages you might like', link: '/packages', linkLabel: 'All packages' })}
      <div class="package-grid">${related.map((pkg) => packageCard(pkg))}</div>
    </div>
  </section>` : ''}`;

  return {
    path,
    active: 'blog',
    analyticsPage: 'article',
    ogType: 'article',
    title: post.title,
    description: plainText(post.excerpt || post.body, 158),
    image: safeUrl(post.image),
    schema: [
      crumbs.schema,
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: plainText(post.excerpt || post.body, 200),
        image: safeUrl(post.image) || undefined,
        datePublished: published || undefined,
        dateModified: updated || published || undefined,
        author: post.author ? { '@type': 'Organization', name: post.author } : undefined,
        publisher: { '@type': 'Organization', name: 'Altis Voyage Travel Services Ltd', logo: { '@type': 'ImageObject', url: `${site.siteUrl}/logo.jpg` } },
        mainEntityOfPage: `${site.siteUrl}${path}`
      }
    ],
    body
  };
}

// ---------------------------------------------------------------------------------------------
// About, contact and FAQ
// ---------------------------------------------------------------------------------------------

export async function about(ctx) {
  const { site } = ctx;
  const [content, services] = await Promise.all([ctx.content(), ctx.services()]);
  const aboutContent = content.about || {};
  const crumbs = breadcrumbs(site, [{ name: 'About us', path: '/about' }]);

  const body = html`
  ${pageHero({ eyebrow: 'About us', title: aboutContent.heading || 'Altis Voyage Travel Services Ltd', subtitle: 'A Kampala travel agency planning journeys across Uganda, East Africa and the world.', image: IMAGES.about, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container intro-block">
      <p class="caption-num text-accent">Who we are</p>
      <div>
        ${aboutContent.body ? html`<p class="lede">${aboutContent.body}</p>` : ''}
        ${aboutContent.story ? html`<div class="prose">${markdown(aboutContent.story)}</div>` : ''}
        ${statsGrid(content.stats)}
      </div>
    </div>
  </section>
  ${services.length ? html`
  <section class="section alt-panel">
    <div class="container">
      ${sectionTop({ eyebrow: 'Services', heading: 'What we do' })}
      <div class="service-grid">${services.map((service) => html`<article class="service-card"><h3>${service.title}</h3><p>${service.summary || service.description || ''}</p></article>`)}</div>
    </div>
  </section>` : ''}
  ${content.process ? html`
  <section class="section">
    <div class="container">
      ${sectionTop({ eyebrow: 'Working with us', heading: 'What happens after you enquire' })}
      ${processSteps(content.process)}
    </div>
  </section>` : ''}
  ${content.why_choose ? html`
  <section class="section alt-panel">
    <div class="container">
      ${sectionTop({ eyebrow: 'Why Altis Voyage', heading: content.why_choose.heading || 'Why travellers choose us' })}
      ${whyChooseGrid(content.why_choose)}
    </div>
  </section>` : ''}
  ${Array.isArray(aboutContent.team) && aboutContent.team.length ? html`
  <section class="section">
    <div class="container">
      ${sectionTop({ eyebrow: 'Our team', heading: 'The people behind your trip' })}
      <div class="why-grid">${aboutContent.team.map((member) => html`<article class="why-card"><h3>${member.name}</h3><p class="muted">${member.role || ''}</p>${member.bio ? html`<p>${member.bio}</p>` : ''}</article>`)}</div>
    </div>
  </section>` : ''}
  ${Array.isArray(aboutContent.credentials) && aboutContent.credentials.length ? html`
  <section class="section">
    <div class="container narrow">
      ${sectionTop({ eyebrow: 'Credentials', heading: 'Registrations & memberships' })}
      <ul class="feature-list">${aboutContent.credentials.map((item) => html`<li>${item}</li>`)}</ul>
    </div>
  </section>` : ''}
  ${ctaBand(site, { eyebrow: 'Visit, call or message us', heading: 'Contact Altis Voyage', primary: { href: '/contact', label: 'Contact Altis Voyage' }, secondary: { href: '/request-quote', label: 'Request a Quote' }, whatsappMessage: 'Hello Altis Voyage, I would like to talk to your team.' })}`;

  return {
    path: '/about',
    active: 'about',
    title: 'About Altis Voyage Travel Services Ltd',
    description: plainText(aboutContent.body || 'Altis Voyage Travel Services Ltd is a travel agency in Kampala, Uganda.', 158),
    schema: [crumbs.schema, organizationSchema(site)],
    body
  };
}

export async function contact(ctx) {
  const { site } = ctx;
  const faqs = await ctx.faqs('general');
  const info = site.contact;
  const mapQuery = encodeURIComponent(info.map_query || info.address || 'Kampala, Uganda');
  const crumbs = breadcrumbs(site, [{ name: 'Contact', path: '/contact' }]);

  const body = html`
  ${pageHero({ eyebrow: 'Contact', title: 'Talk to our team', subtitle: 'Call, WhatsApp, email or visit our office in Kampala. Or send a request below and we will reply within one working day.', image: IMAGES.contact, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container inquiry-wrap">
      <div>
        <div class="contact-grid">
          ${info.phone ? html`<div class="contact-item"><span class="caption-num text-accent">Phone</span><a href="${telHref(info.phone)}">${info.phone}</a></div>` : ''}
          ${site.whatsappDigits ? html`<div class="contact-item"><span class="caption-num text-accent">WhatsApp</span><a href="${whatsappHref(site, 'Hello Altis Voyage, I have a travel question.')}" target="_blank" rel="noopener" data-whatsapp="contact-details">Chat with us</a></div>` : ''}
          ${info.email ? html`<div class="contact-item"><span class="caption-num text-accent">Email</span><a href="mailto:${info.email}">${info.email}</a></div>` : ''}
          ${info.hours ? html`<div class="contact-item"><span class="caption-num text-accent">Office hours</span><span>${info.hours.replace(/-(?=\d)/g, '–')}</span></div>` : ''}
          ${info.address ? html`<div class="contact-item contact-item-wide"><span class="caption-num text-accent">Office</span><address>${info.address}</address><a class="inline-link" href="https://www.google.com/maps/search/?api=1&query=${mapQuery}" target="_blank" rel="noopener">Get directions</a></div>` : ''}
        </div>
        ${info.address ? html`<div class="map-embed"><iframe title="Map showing the Altis Voyage office at ${info.address}" src="https://www.google.com/maps?q=${mapQuery}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>` : ''}
        <div class="inline-actions">${whatsappButton(site, 'Hello Altis Voyage, I have a travel question.', { label: 'WhatsApp the Team', location: 'contact' })}</div>
      </div>
      ${enquiryForm({
        service: 'general',
        id: 'contact-form',
        heading: 'Send an Enquiry',
        submitLabel: 'Send an Enquiry',
        body: html`
          ${contactFields()}
          ${field({ name: 'interest', label: 'Subject', type: 'select', options: ['General question', 'Holiday package', 'Flight booking', 'Visa assistance', 'Study abroad', 'Existing booking', 'Feedback or review', 'Something else'] })}
          ${field({ name: 'message', label: 'Message', type: 'textarea', required: true })}`
      })}
    </div>
  </section>
  ${faqSection(faqs, { heading: 'Common questions' })}`;

  return {
    path: '/contact',
    active: 'contact',
    analyticsPage: 'contact',
    title: 'Contact Altis Voyage – Kampala Travel Agency',
    description: `Contact Altis Voyage in Kampala${info.phone ? ` on ${info.phone}` : ''}, by WhatsApp or email${info.address ? `, or visit us at ${info.address}` : ''}.`,
    schema: [crumbs.schema, organizationSchema(site)],
    body
  };
}

const FAQ_GROUPS = [
  ['booking', 'Booking & quotations'],
  ['general', 'Contacting us'],
  ['flights', 'Flights'],
  ['visa', 'Visas'],
  ['study', 'Study abroad'],
  ['payments', 'Payments & cancellations']
];

export async function faq(ctx) {
  const { site } = ctx;
  const all = await ctx.faqs();
  const crumbs = breadcrumbs(site, [{ name: 'FAQ', path: '/faq' }]);
  const known = new Set(FAQ_GROUPS.map(([key]) => key));
  const groups = [...FAQ_GROUPS, ['other', 'More questions']]
    .map(([key, label]) => [label, all.filter((item) => (key === 'other' ? !known.has(item.category) : item.category === key))])
    .filter(([, items]) => items.length);

  const body = html`
  ${pageHero({ eyebrow: 'FAQ', title: 'Frequently asked questions', subtitle: 'How enquiries, quotations and bookings work, and what we can and cannot promise.', image: IMAGES.about, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container narrow">
      ${groups.length ? groups.map(([label, items]) => html`<h2 class="faq-group-heading font-display">${label}</h2>${faqList(items)}`) : html`<p class="empty-state">No questions published yet.</p>`}
    </div>
  </section>
  ${ctaBand(site, { eyebrow: 'Still have a question?', heading: 'Ask our team directly', primary: { href: '/contact', label: 'Contact us' }, whatsappMessage: 'Hello Altis Voyage, I have a question.' })}`;

  return {
    path: '/faq',
    active: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Answers about travel enquiries, when bookings are confirmed, flight quotations, visa assistance, study abroad and payments at Altis Voyage.',
    schema: [
      crumbs.schema,
      all.length ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: all.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } }))
      } : null
    ],
    body
  };
}

// ---------------------------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------------------------

const POLICIES = {
  'privacy-policy': { key: 'policy_privacy', description: 'How Altis Voyage collects, uses and protects the personal information you share in enquiries and bookings.' },
  terms: { key: 'policy_terms', description: 'Terms for using the Altis Voyage website and travel services, including the difference between an enquiry and a confirmed booking.' },
  'refund-policy': { key: 'policy_refund', description: 'How cancellations, changes and refunds work for Altis Voyage bookings.' }
};

export async function policy(ctx, slug) {
  const { site } = ctx;
  const definition = POLICIES[slug];
  const content = await ctx.content();
  const policyContent = content[definition.key];
  if (!policyContent) throw new NotFound();
  const path = `/${slug}`;
  const crumbs = breadcrumbs(site, [{ name: policyContent.title, path }]);

  const body = html`
  ${crumbs.markup}
  <article class="section section-tight">
    <div class="container narrow">
      <h1 class="font-display detail-title">${policyContent.title}</h1>
      ${policyContent.updated ? html`<p class="article-meta">Last updated <time datetime="${isoDate(policyContent.updated)}">${formatDate(policyContent.updated)}</time></p>` : ''}
      ${!policyContent.approved && policyContent.note ? disclaimer('Draft under review', policyContent.note) : ''}
      <div class="prose">${markdown(policyContent.body)}</div>
    </div>
  </article>`;

  return { path, active: 'policy', title: policyContent.title, description: definition.description, schema: [crumbs.schema], body };
}

// ---------------------------------------------------------------------------------------------
// Request a quote, confirmation, My Trip and the trip planner
// ---------------------------------------------------------------------------------------------

export async function requestQuote(ctx) {
  const { site, query } = ctx;
  const [packageList, offerList, content] = await Promise.all([ctx.packages(), ctx.currentOffers(), ctx.content()]);
  const pkg = packageList.find((item) => Number(item.id) === Number(query.package));
  const offer = offerList.find((item) => Number(item.id) === Number(query.offer));
  const destination = String(query.destination || '').slice(0, 120);
  const service = offer ? 'offer' : pkg ? 'package' : 'general';
  const hidden = {};
  if (pkg) Object.assign(hidden, { package_id: pkg.id, interest: `Package: ${pkg.title}` });
  if (offer) Object.assign(hidden, { offer: offer.title, interest: `Offer: ${offer.title}` });
  const selected = pkg?.title || offer?.title;
  const crumbs = breadcrumbs(site, [{ name: 'Request a quote', path: '/request-quote' }]);

  const body = html`
  ${pageHero({ eyebrow: 'Request a quote', title: 'Tell us about your trip', subtitle: 'Share your plans and a consultant will send you options and a written quotation, usually within one working day.', image: IMAGES.packages, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container inquiry-wrap">
      <div>
        <h2 class="section-heading font-display">${content.process?.heading || 'How booking with us works'}</h2>
        ${processSteps(content.process)}
        ${disclaimer('A request is not a booking', 'Submitting this form does not reserve flights, rooms or permits. Your booking is confirmed only when our team confirms it in writing after you accept the quotation.')}
        ${contactCard(site)}
      </div>
      ${enquiryForm({
        service,
        id: 'quote-form',
        heading: 'Request a Quote',
        submitLabel: 'Send my quote request',
        hidden,
        body: html`
          ${selected ? html`<p class="selected-item">Requesting a quote for: <strong>${selected}</strong></p>` : ''}
          <div class="saved-trip-summary" data-saved-trip-summary hidden></div>
          <input type="hidden" name="packages" value="${pkg ? pkg.title : ''}" data-packages-field />
          ${field({ name: 'destination', label: 'Destination(s)', value: destination || pkg?.destination || offer?.destination || '', attrs: 'placeholder="Where would you like to go?"' })}
          ${dateFields()}
          ${field({ name: 'flexible_dates', label: 'Are your dates flexible?', type: 'select', options: [['no', 'No, these exact dates'], ['yes', 'Yes, a few days either way']] })}
          ${travellerFields({ adults: 2 })}
          ${field({ name: 'budget', label: 'Approximate budget (optional)', attrs: 'placeholder="e.g. UGX 5,000,000 per person"' })}
          ${contactFields()}
          ${field({ name: 'message', label: 'Tell us more', type: 'textarea', attrs: 'placeholder="Interests, hotel standard, special occasions, questions…"' })}`
      })}
    </div>
  </section>`;

  return {
    path: '/request-quote',
    active: 'quote',
    analyticsPage: 'quote',
    title: 'Request a Travel Quote',
    description: 'Request a personalised travel quotation from Altis Voyage for packages, safaris, flights, hotels and more. Free, with no obligation to book.',
    // Prefilled variants (?package=…) share one canonical page.
    noindex: Object.keys(query).some((key) => key !== 'path'),
    schema: [crumbs.schema],
    body
  };
}

export async function requestReceived(ctx) {
  const { site } = ctx;
  const reference = /^AV-\d{6}-[A-Z0-9]{5}$/.test(String(ctx.query.reference || '')) ? ctx.query.reference : '';
  const failed = ctx.query.error === '1';

  const body = html`
  <section class="section">
    <div class="container narrow">
      ${failed
        ? html`<h1 class="font-display detail-title">We couldn't send your request</h1>
          <p class="lede">Some details were missing or invalid. Please go back and check the form, or contact us directly.</p>
          <div class="inline-actions"><a class="button primary" href="/request-quote">Back to the form</a>${whatsappButton(site, 'Hello Altis Voyage, I had trouble sending a request on your website.', { variant: 'secondary whatsapp-outline', location: 'request-error' })}</div>`
        : html`<div class="confirmation-panel">
          <p class="caption-num text-accent">Request received</p>
          <h1 class="font-display detail-title">Thank you, we have your request</h1>
          ${reference ? html`<p class="reference-line">Your reference: <strong>${reference}</strong></p>` : ''}
          <p>This is not yet a confirmed booking. A consultant will review your request and contact you within one working day with options and a quotation.</p>
          <div class="inline-actions">
            <a class="button primary" href="/packages">Explore more packages</a>
            ${whatsappButton(site, reference ? `Hello Altis Voyage, I just sent request ${reference}.` : 'Hello Altis Voyage, I just sent a request on your website.', { variant: 'secondary whatsapp-outline', label: 'Follow up on WhatsApp', location: 'request-received' })}
          </div>
        </div>`}
    </div>
  </section>`;

  return { path: '/request-received', active: 'quote', title: 'Request received', description: 'Your Altis Voyage request has been received.', noindex: true, body };
}

export async function myTrip(ctx) {
  const body = html`
  ${pageHero({ eyebrow: 'My Trip', title: 'My Trip Requests', subtitle: 'Packages you have saved on this device and the requests you have sent us.', image: IMAGES.packages, short: true })}
  <section class="section section-tight">
    <div class="container inquiry-wrap">
      <div>
        <h2 class="section-heading font-display">Saved packages</h2>
        <div data-saved-trip-list><p class="muted">Loading…</p></div>
        <noscript><p>Turn on JavaScript to see packages saved on this device.</p></noscript>
        <h2 class="section-heading font-display spaced">Requests sent from this device</h2>
        <div data-request-list><p class="muted">No requests yet.</p></div>
      </div>
      <form class="inquiry-form" data-status-form>
        <h2 class="form-heading font-display">Check a request</h2>
        <p class="form-intro">Enter your reference and the email or phone number you used.</p>
        <div class="form-status" role="status" hidden></div>
        ${field({ name: 'reference', label: 'Reference', required: true, attrs: 'placeholder="AV-261022-ABCDE" pattern="[Aa][Vv]-\\d{6}-[A-Za-z0-9]{5}"' })}
        ${field({ name: 'contact', label: 'Email or phone', required: true })}
        <button class="button primary full-width" type="submit">Check status</button>
      </form>
    </div>
  </section>`;

  return { path: '/my-trip', active: 'trip', analyticsPage: 'my-trip', title: 'My Trip Requests', description: 'Your saved Altis Voyage packages and request status.', noindex: true, body };
}

export async function planner(ctx) {
  const { site } = ctx;
  const destinationsList = await ctx.destinations();
  const countries = [...new Set(destinationsList.map((item) => item.country).filter(Boolean))].sort();
  const crumbs = breadcrumbs(site, [{ name: 'Trip planner', path: '/trip-planner' }]);
  const interests = [
    ['wildlife', 'Wildlife & safari'], ['gorillas', 'Gorillas & primates'], ['beach', 'Beach & islands'], ['city', 'City break & shopping'],
    ['culture', 'Culture & history'], ['adventure', 'Adventure & hiking'], ['relaxation', 'Relaxation'], ['luxury', 'Luxury stays']
  ];

  const body = html`
  ${pageHero({ eyebrow: 'Trip planner', title: 'Find the trip that fits', subtitle: 'Answer a few questions and we will match you with packages from our current range. Then request a quote to make it yours.', image: IMAGES.destinations, short: true })}
  ${crumbs.markup}
  <section class="section section-tight">
    <div class="container planner-layout">
      <form class="inquiry-form" data-planner-form>
        <h2 class="form-heading font-display">Your trip</h2>
        ${field({ name: 'region', label: 'Where would you like to go?', type: 'select', options: [['any', 'Anywhere – surprise me'], ['uganda', 'Uganda'], ['east-africa', 'East Africa'], ['international', 'Beyond Africa'], ...countries.map((country) => [`country:${country.toLowerCase()}`, country])] })}
        ${row(
          field({ name: 'budget', label: 'Budget per traveller (UGX)', type: 'number', attrs: 'min="0" step="100000" inputmode="numeric" placeholder="e.g. 4000000"' }),
          field({ name: 'duration', label: 'Trip length (days)', type: 'number', attrs: 'min="1" max="60" inputmode="numeric" placeholder="e.g. 5"' })
        )}
        ${row(
          field({ name: 'travel_month', label: 'When?', type: 'month' }),
          field({ name: 'travellers', label: 'Travellers', type: 'number', value: 2, attrs: 'min="1" max="50" inputmode="numeric"' })
        )}
        <fieldset class="field-group">
          <legend class="field-label">Interests</legend>
          <div class="choice-grid">${interests.map(([value, label]) => html`<label class="choice"><input type="checkbox" name="interests" value="${value}" /> ${label}</label>`)}</div>
        </fieldset>
        <button class="button primary full-width" type="submit">Show matching trips</button>
        <p class="form-note">Recommendations come only from the packages currently listed on our website. Prices shown are indicative and confirmed in your quotation.</p>
      </form>
      <div class="planner-results" data-planner-results aria-live="polite">
        <div class="empty-state"><p>Your matches will appear here.</p></div>
      </div>
      <noscript><p>The trip planner needs JavaScript. You can still <a href="/request-quote">request a quote</a>.</p></noscript>
    </div>
  </section>`;

  return {
    path: '/trip-planner',
    active: 'planner',
    analyticsPage: 'planner',
    title: 'Trip Planner – Find a Package That Fits',
    description: 'Tell us your destination, budget, dates and interests and the Altis Voyage trip planner suggests matching travel packages you can request a quote for.',
    schema: [crumbs.schema],
    body
  };
}

export async function notFound(ctx) {
  const body = html`
  <section class="section">
    <div class="container narrow">
      <p class="caption-num text-accent">404</p>
      <h1 class="font-display detail-title">We couldn't find that page</h1>
      <p class="lede">The page may have moved. Try one of these instead:</p>
      <div class="inline-actions">
        <a class="button primary" href="/packages">Explore Travel Packages</a>
        <a class="button secondary" href="/request-quote">Request a Quote</a>
        <a class="button secondary" href="/">Home</a>
      </div>
    </div>
  </section>`;
  return { path: '/404', active: 'none', title: 'Page not found', description: 'This page could not be found.', noindex: true, body, status: 404 };
}

export const PAGES = {
  home,
  packages,
  destinations,
  flights,
  'visa-services': visa,
  'study-abroad': study,
  offers,
  blog,
  about,
  contact,
  faq,
  'privacy-policy': (ctx) => policy(ctx, 'privacy-policy'),
  terms: (ctx) => policy(ctx, 'terms'),
  'refund-policy': (ctx) => policy(ctx, 'refund-policy'),
  'request-quote': requestQuote,
  'request-received': requestReceived,
  'my-trip': myTrip,
  'trip-planner': planner
};

export const SITEMAP_PATHS = [
  '/', '/packages', '/destinations', '/flights', '/visa-services', '/study-abroad', '/offers', '/blog', '/about',
  '/contact', '/faq', '/request-quote', '/trip-planner', '/privacy-policy', '/terms', '/refund-policy'
];
