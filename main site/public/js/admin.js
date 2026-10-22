// Staff dashboard. Authorisation is enforced by the API (pages/api/[...path].js); this script
// only drives the interface. Everything rendered below goes through the `h` template tag, which
// escapes interpolated values by default: enquiry text comes from the public and is untrusted.
(() => {
  'use strict';

  /* ------------------------------------------------------------------ safe templating */
  const RAW = Symbol('raw');
  const raw = (s) => ({ [RAW]: String(s ?? '') });
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function val(v) {
    if (v === null || v === undefined || v === false) return '';
    if (Array.isArray(v)) return v.map(val).join('');
    if (typeof v === 'object' && RAW in v) return v[RAW];
    return esc(v);
  }
  const h = (strings, ...vals) => {
    let out = strings[0];
    vals.forEach((v, i) => { out += val(v) + strings[i + 1]; });
    return raw(out);
  };
  const mount = (el, tpl) => { el.innerHTML = val(tpl); };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const ICONS = {
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    cap: '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    board: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'
  };
  const ic = (name, cls = '') => raw(`<svg class="adm-ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`);

  /* ------------------------------------------------------------------ formatting */
  const pad = (n) => String(n).padStart(2, '0');
  function parseTs(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    const text = String(value).trim();
    const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?/.exec(text);
    const date = m ? new Date(`${m[1]}T${m[2]}${m[3] || ':00'}Z`) : new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function rel(value) {
    const d = parseTs(value);
    if (!d) return '—';
    const seconds = (Date.now() - d.getTime()) / 1000;
    if (seconds < 45) return 'just now';
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
    if (seconds < 7 * 86400) return `${Math.round(seconds / 86400)}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDate(value) {
    const t = String(value || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return '—';
    return new Date(`${t}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  function fmtDateTime(value) {
    const d = parseTs(value);
    return d ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  }
  const fmtUGX = (n) => (Number(n) > 0 ? `UGX ${Number(n).toLocaleString('en')}` : '—');
  const todayIso = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
  const localKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const slugify = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const humanize = (key) => String(key).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const truncate = (s, n = 90) => (String(s || '').length > n ? `${String(s).slice(0, n - 1).trim()}…` : String(s || ''));

  /* ------------------------------------------------------------------ domain config */
  const STATUSES = [
    ['new', 'New', 'Received'], ['in_review', 'In review', 'Being reviewed'], ['quoted', 'Quoted', 'Quotation sent'],
    ['confirmed', 'Confirmed', 'Confirmed by our team'], ['completed', 'Completed', 'Completed'], ['closed', 'Closed', 'Closed'], ['cancelled', 'Cancelled', 'Cancelled']
  ];
  const STATUS = Object.fromEntries(STATUSES.map(([id, label, customer]) => [id, { label, customer }]));
  const SERVICES = [['general', 'General'], ['package', 'Package quote'], ['offer', 'Offer'], ['planner', 'Trip planner'], ['flight', 'Flight'], ['visa', 'Visa'], ['study', 'Study abroad']];
  const SERVICE = Object.fromEntries(SERVICES);
  const pill = (status) => h`<span class="adm-pill st-${status}">${STATUS[status]?.label || status || '—'}</span>`;
  const isOverdue = (rec) => rec.status === 'new' && parseTs(rec.created_at) && Date.now() - parseTs(rec.created_at).getTime() > 24 * 3600e3;

  const NAV = [
    { group: null, items: [{ key: 'overview', label: 'Dashboard', icon: 'dashboard' }] },
    { group: 'Inbox', items: [{ key: 'inquiries', label: 'Enquiries', icon: 'inbox', badge: true }] },
    { group: 'Catalogue', items: [{ key: 'packages', label: 'Packages', icon: 'package' }, { key: 'destinations', label: 'Destinations', icon: 'pin' }, { key: 'offers', label: 'Offers', icon: 'tag' }] },
    { group: 'Content', items: [{ key: 'posts', label: 'Blog posts', icon: 'file' }, { key: 'opportunities', label: 'Study opportunities', icon: 'cap' }, { key: 'faqs', label: 'FAQs', icon: 'help' }, { key: 'testimonials', label: 'Reviews', icon: 'star' }, { key: 'services', label: 'Services', icon: 'layers' }, { key: 'gallery', label: 'Gallery', icon: 'image' }] },
    { group: 'Website', items: [{ key: 'site_content', label: 'Site content', icon: 'sliders' }] }
  ];
  const TITLES = Object.fromEntries(NAV.flatMap((g) => g.items.map((i) => [i.key, i.label])));

  const REGIONS = [['uganda', 'Uganda'], ['east-africa', 'East Africa'], ['international', 'International']];
  const ofPublished = { key: 'published', all: 'All', on: 'Published', off: 'Drafts' };

  // Field types: text (default), textarea, longtext, number, url, image, date, bool, readonly, or an
  // array of [value, label] options for a select.
  const CONFIG = {
    packages: {
      singular: 'package', icon: 'package', help: 'Holiday packages shown on the website. Prices are indicative "from" prices in UGX.',
      columns: [{ key: 'title', label: 'Package', type: 'title', thumb: 'image', sub: (r) => r.destination }, { key: 'days', label: 'Days', type: 'num' }, { key: 'price', label: 'From price', type: 'price' }, { key: 'featured', label: 'Featured', type: 'toggle' }, { key: 'updated_at', label: 'Updated', type: 'rel' }],
      search: ['title', 'destination', 'description'], required: ['title'], defaults: { featured: 0 }, sort: { key: 'id', dir: 'desc' },
      filter: { key: 'featured', all: 'All', on: 'Featured', off: 'Not featured' },
      fields: [{ name: 'title', label: 'Title', wide: true }, { name: 'destination', label: 'Destination', hint: 'e.g. Bwindi Impenetrable Forest, Uganda. The last part is used as the country filter.' }, { name: 'days', label: 'Days', type: 'number' }, { name: 'price', label: 'Price from (UGX)', type: 'number', hint: 'Leave empty to show "Price on request".' }, { name: 'image', label: 'Image URL', type: 'image', wide: true }, { name: 'description', label: 'Description', type: 'textarea', wide: true }, { name: 'featured', label: 'Feature on the homepage', type: 'bool' }],
      publicUrl: (r) => `/packages/${r.id}-${slugify(r.title) || 'package'}`
    },
    destinations: {
      singular: 'destination', icon: 'pin', help: 'Places shown on the Destinations page and the homepage.',
      columns: [{ key: 'name', label: 'Destination', type: 'title', thumb: 'image', sub: (r) => [r.country, r.tagline].filter(Boolean).join(' · ') }, { key: 'region', label: 'Region', type: 'label' }, { key: 'price_from', label: 'From price', type: 'price' }, { key: 'featured', label: 'Featured', type: 'toggle' }],
      search: ['name', 'country', 'tagline', 'description'], required: ['name'], defaults: { featured: 0, region: 'international' }, sort: { key: 'id', dir: 'desc' },
      filter: { key: 'featured', all: 'All', on: 'Featured', off: 'Not featured' },
      fields: [{ name: 'name', label: 'Name' }, { name: 'country', label: 'Country' }, { name: 'region', label: 'Region', type: REGIONS }, { name: 'price_from', label: 'Price from (UGX)', type: 'number' }, { name: 'tagline', label: 'Tagline', wide: true }, { name: 'image', label: 'Image URL', type: 'image', wide: true }, { name: 'description', label: 'Description', type: 'textarea', wide: true }, { name: 'featured', label: 'Feature on the homepage', type: 'bool' }],
      publicUrl: () => '/destinations'
    },
    offers: {
      singular: 'offer', icon: 'tag', help: 'Only publish offers approved by Altis Voyage. Offers past their end date move to the "expired" list on the website automatically.',
      columns: [{ key: 'title', label: 'Offer', type: 'title', thumb: 'image', sub: (r) => r.destination }, { key: 'valid_until', label: 'Valid until', type: 'expiry' }, { key: 'price', label: 'Price', type: 'price' }, { key: 'published', label: 'Published', type: 'toggle' }],
      search: ['title', 'destination', 'description', 'terms'], required: ['title'], defaults: { currency: 'UGX', published: 0 }, sort: { key: 'id', dir: 'desc' }, filter: ofPublished,
      fields: [{ name: 'title', label: 'Title', wide: true }, { name: 'destination', label: 'Destination' }, { name: 'package_id', label: 'Linked package #', type: 'number', hint: 'Optional: the package ID this offer applies to.' }, { name: 'price', label: 'Price', type: 'number' }, { name: 'currency', label: 'Currency', hint: 'UGX, USD…' }, { name: 'valid_from', label: 'Valid from', type: 'date' }, { name: 'valid_until', label: 'Valid until', type: 'date' }, { name: 'description', label: 'Description', type: 'textarea', wide: true }, { name: 'terms', label: 'Terms', type: 'textarea', wide: true }, { name: 'image', label: 'Image URL', type: 'image', wide: true }, { name: 'published', label: 'Published on the website', type: 'bool' }],
      publicUrl: () => '/offers'
    },
    posts: {
      singular: 'article', icon: 'file', help: 'Travel advice articles. Add the date you last verified visa, immigration or scholarship facts.',
      columns: [{ key: 'title', label: 'Article', type: 'title', thumb: 'image', sub: (r) => r.category }, { key: 'published_at', label: 'Published', type: 'date' }, { key: 'published', label: 'Live', type: 'toggle' }, { key: 'updated_at', label: 'Updated', type: 'rel' }],
      search: ['title', 'excerpt', 'category', 'tags', 'body'], required: ['title'], defaults: { published: 0, author: 'Altis Voyage team' }, sort: { key: 'id', dir: 'desc' }, filter: ofPublished,
      fields: [{ name: 'title', label: 'Title', wide: true }, { name: 'slug', label: 'Web address', hint: 'The part after /blog/. Leave empty to create it from the title.' }, { name: 'category', label: 'Category' }, { name: 'tags', label: 'Tags', hint: 'Comma separated.' }, { name: 'author', label: 'Author' }, { name: 'excerpt', label: 'Summary', type: 'textarea', wide: true }, { name: 'image', label: 'Featured image URL', type: 'image', wide: true }, { name: 'image_alt', label: 'Image description (alt text)', wide: true }, { name: 'body', label: 'Article', type: 'longtext', wide: true, hint: 'Use ## for headings, - for bullet points, **bold** and [link text](https://…).' }, { name: 'sources', label: 'Sources', type: 'textarea', wide: true, hint: 'One per line as: Name | https://link' }, { name: 'published_at', label: 'Publish date', type: 'date' }, { name: 'reviewed_at', label: 'Facts last checked', type: 'date' }, { name: 'published', label: 'Published on the website', type: 'bool' }],
      publicUrl: (r) => `/blog/${r.slug}`
    },
    opportunities: {
      singular: 'opportunity', icon: 'cap', help: 'Only publish scholarships and programmes you have verified on the official source. Items past their deadline are hidden from the website automatically.',
      columns: [{ key: 'title', label: 'Opportunity', type: 'title', sub: (r) => [r.institution, r.country].filter(Boolean).join(' · ') }, { key: 'kind', label: 'Type', type: 'label', labels: { scholarship: 'Scholarship', program: 'Programme' } }, { key: 'deadline', label: 'Deadline', type: 'expiry', expiredLabel: 'Passed' }, { key: 'published', label: 'Published', type: 'toggle' }],
      search: ['title', 'institution', 'country', 'summary'], required: ['title'], defaults: { kind: 'scholarship', published: 0 }, sort: { key: 'id', dir: 'desc' }, filter: ofPublished,
      fields: [{ name: 'kind', label: 'Type', type: [['scholarship', 'Scholarship'], ['program', 'Study programme']] }, { name: 'title', label: 'Title' }, { name: 'institution', label: 'Institution / provider' }, { name: 'country', label: 'Country' }, { name: 'level', label: 'Study level' }, { name: 'deadline', label: 'Deadline', type: 'date' }, { name: 'summary', label: 'Summary', type: 'textarea', wide: true }, { name: 'eligibility', label: 'Eligibility', type: 'textarea', wide: true }, { name: 'documents', label: 'Required documents', type: 'textarea', wide: true }, { name: 'source_name', label: 'Source name', hint: 'e.g. Official scholarship page' }, { name: 'source_url', label: 'Source link', type: 'url' }, { name: 'verified_at', label: 'Details checked on', type: 'date' }, { name: 'published', label: 'Published on the website', type: 'bool' }],
      publicUrl: () => '/study-abroad'
    },
    faqs: {
      singular: 'FAQ', icon: 'help', help: 'Questions shown on the FAQ page and on service pages (by category).',
      columns: [{ key: 'question', label: 'Question', type: 'title', sub: (r) => truncate(r.answer, 110) }, { key: 'category', label: 'Category', type: 'label' }, { key: 'sort_order', label: 'Order', type: 'num' }, { key: 'published', label: 'Published', type: 'toggle' }],
      search: ['question', 'answer', 'category'], required: ['question', 'answer'], defaults: { published: 1, category: 'general' }, sort: { key: 'sort_order', dir: 'asc' }, filter: ofPublished,
      fields: [{ name: 'question', label: 'Question', type: 'textarea', wide: true }, { name: 'answer', label: 'Answer', type: 'textarea', wide: true }, { name: 'category', label: 'Category', type: [['booking', 'Booking'], ['general', 'General'], ['flights', 'Flights'], ['visa', 'Visa'], ['study', 'Study'], ['payments', 'Payments']] }, { name: 'sort_order', label: 'Order', type: 'number', hint: 'Lower numbers appear first.' }, { name: 'published', label: 'Published on the website', type: 'bool' }],
      publicUrl: () => '/faq'
    },
    testimonials: {
      singular: 'review', icon: 'star', help: 'Only add genuine reviews that the traveller has agreed to share. "Verified booking" shows only when the linked enquiry is Confirmed or Completed.',
      columns: [{ key: 'name', label: 'Traveller', type: 'title', sub: (r) => [r.trip, r.location].filter(Boolean).join(' · ') }, { key: 'rating', label: 'Rating', type: 'stars' }, { key: 'approved', label: 'Visible', type: 'toggle' }, { key: 'verified_booking', label: 'Verified', type: 'yesno' }],
      search: ['name', 'location', 'quote', 'trip'], required: ['name', 'quote'], defaults: { approved: 1, verified_booking: 0, rating: 5 }, sort: { key: 'id', dir: 'desc' },
      filter: { key: 'approved', all: 'All', on: 'Visible', off: 'Hidden' },
      fields: [{ name: 'name', label: 'Name' }, { name: 'location', label: 'Location' }, { name: 'trip', label: 'Trip' }, { name: 'rating', label: 'Rating (1–5)', type: 'number' }, { name: 'quote', label: 'Review', type: 'textarea', wide: true }, { name: 'inquiry_id', label: 'Linked enquiry #', type: 'number', hint: 'The enquiry this traveller booked under.' }, { name: 'verified_booking', label: 'Mark as verified booking', type: 'bool' }, { name: 'approved', label: 'Show on the website', type: 'bool' }],
      publicUrl: () => '/'
    },
    services: {
      singular: 'service', icon: 'layers', help: 'Services listed on the About page.',
      columns: [{ key: 'title', label: 'Service', type: 'title', sub: (r) => truncate(r.summary, 110) }, { key: 'icon', label: 'Icon', type: 'label' }],
      search: ['title', 'summary', 'description'], required: ['title'], defaults: {}, sort: { key: 'id', dir: 'asc' },
      fields: [{ name: 'title', label: 'Title' }, { name: 'icon', label: 'Icon name' }, { name: 'summary', label: 'Summary', type: 'textarea', wide: true }, { name: 'description', label: 'Description', type: 'textarea', wide: true }, { name: 'image', label: 'Image URL', type: 'image', wide: true }],
      publicUrl: () => '/about'
    },
    gallery: {
      singular: 'photo', icon: 'image', help: 'Photos shown in the homepage gallery.',
      columns: [{ key: 'title', label: 'Photo', type: 'title', thumb: 'image', sub: (r) => r.category }, { key: 'category', label: 'Category', type: 'label' }],
      search: ['title', 'category'], required: ['title', 'image'], defaults: {}, sort: { key: 'id', dir: 'asc' },
      fields: [{ name: 'title', label: 'Title' }, { name: 'category', label: 'Category' }, { name: 'image', label: 'Image URL', type: 'image', wide: true }],
      publicUrl: () => '/'
    },
    inquiries: {
      singular: 'enquiry', icon: 'inbox',
      fields: [{ name: 'name', label: 'Name' }, { name: 'phone', label: 'Phone / WhatsApp', type: 'tel' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'service', label: 'Service', type: SERVICES }, { name: 'interest', label: 'Interested in', wide: true }, { name: 'message', label: 'Message', type: 'textarea', wide: true }, { name: 'admin_notes', label: 'Internal notes', type: 'textarea', wide: true }],
      required: ['name'], defaults: { service: 'general', status: 'new' }
    }
  };

  const CONTENT_META = {
    hero: { label: 'Homepage hero', desc: 'The main headline, text and buttons at the top of the homepage.', group: 'Homepage & company' },
    about: { label: 'About us', desc: 'Company description. Add a story, team members and credentials when you have them.', group: 'Homepage & company' },
    contact: { label: 'Contact details', desc: 'Phone, WhatsApp, email, address and hours. Used on every page and in WhatsApp links.', group: 'Homepage & company' },
    stats: { label: 'Homepage figures', desc: 'The animated numbers under the hero, such as years operating.', group: 'Homepage & company' },
    why_choose: { label: 'Why choose us', desc: 'The strengths shown on the homepage and About page.', group: 'Homepage & company' },
    process: { label: 'How booking works', desc: 'The step-by-step process shown to customers.', group: 'Homepage & company' },
    visa_sources: { label: 'Official visa sources', desc: 'Links to official government sites shown on the Visa page.', group: 'Service pages' },
    policy_privacy: { label: 'Privacy Policy', desc: 'Mark as approved once the owner and a legal adviser have reviewed it.', group: 'Policies', policy: true },
    policy_terms: { label: 'Terms and Conditions', desc: 'Mark as approved once the owner and a legal adviser have reviewed it.', group: 'Policies', policy: true },
    policy_refund: { label: 'Refund and Cancellation Policy', desc: 'Cancellation charges and refund timelines must be confirmed by the owner.', group: 'Policies', policy: true }
  };
  const FIELD_LABELS = {
    ctaPrimary: 'Primary button text', ctaSecondary: 'Secondary button text', whatsapp: 'WhatsApp number', map_query: 'Map search text', street: 'Street address', hours: 'Opening hours',
    approved: 'Approved for publishing', updated: 'Last updated (date)', note: 'Notice shown above the policy', image: 'Hero image URL', url: 'Link', name: 'Name', text: 'Text', q: 'Question'
  };
  const FIELD_HINTS = {
    whatsapp: 'Digits with country code, e.g. +256774497295. Used for every WhatsApp button.', map_query: 'What Google Maps searches for, e.g. Equatorial Mall, Bombo Road, Kampala.', country: 'Two-letter country code, e.g. UG.',
    updated: 'Format YYYY-MM-DD. Set automatically when you save a policy.', approved: 'Switch on only after the policy has been reviewed. While off, a "draft under review" notice is shown.', body: 'Use ## for headings, - for bullet points and **bold**.'
  };
  const CONTENT_OPTIONAL = { about: { story: '', team: [{ name: '', role: '', bio: '' }], credentials: [''] } };
  const LONG_KEYS = new Set(['body', 'story', 'bio', 'answer', 'text', 'note', 'subtitle', 'intro', 'description', 'summary']);

  /* ------------------------------------------------------------------ state, api, toasts */
  const state = { tables: {}, view: null, session: null, q: {}, filters: {}, sorts: {}, enqMode: 'list', enqStatus: 'all', enqService: 'all', renderToken: 0, onSearch: null };
  try { state.enqMode = localStorage.getItem('adm-enq-mode') === 'board' ? 'board' : 'list'; } catch { /* default view */ }

  async function api(path, options = {}) {
    const res = await fetch(`/api/admin/${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options });
    if (res.status === 401) {
      location.replace('/admin/login.html?expired=1');
      throw Object.assign(new Error('Session expired'), { status: 401 });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status });
    return data;
  }
  async function load(table, force = false) {
    if (!force && state.tables[table]) return state.tables[table];
    const rows = await api(table);
    state.tables[table] = table === 'site_content' ? rows.filter((r) => !String(r.key).startsWith('_')) : rows;
    return state.tables[table];
  }
  const rowsOf = (table) => state.tables[table] || [];
  function putLocal(table, rec) {
    const list = rowsOf(table);
    const i = list.findIndex((r) => Number(r.id) === Number(rec.id));
    if (i >= 0) list[i] = rec; else list.unshift(rec);
    state.tables[table] = list;
  }

  const toastsEl = $('#adm-toasts');
  function toast(message, { kind = 'success', action = null, ms = 4500 } = {}) {
    const el = document.createElement('div');
    el.className = `adm-toast is-${kind}`;
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    mount(el, h`${ic(kind === 'error' ? 'alert' : 'check')}<span>${message}</span>${action ? h`<button type="button" class="adm-toast-action">${action.label}</button>` : ''}<button type="button" class="adm-toast-x" aria-label="Dismiss">${ic('x')}</button>`);
    const remove = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 250); };
    el.querySelector('.adm-toast-x').addEventListener('click', remove);
    el.querySelector('.adm-toast-action')?.addEventListener('click', () => { action.run(); remove(); });
    toastsEl.appendChild(el);
    setTimeout(remove, action ? Math.max(ms, 7000) : ms);
  }

  const confirmEl = $('#adm-confirm');
  function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
    $('#adm-confirm-title').textContent = title;
    $('#adm-confirm-text').textContent = message;
    const ok = $('#adm-confirm-ok');
    ok.textContent = confirmLabel;
    ok.classList.toggle('danger', danger);
    ok.classList.toggle('primary', !danger);
    return new Promise((resolve) => {
      confirmEl.addEventListener('close', () => resolve(confirmEl.returnValue === 'ok'), { once: true });
      confirmEl.returnValue = 'cancel';
      confirmEl.showModal();
    });
  }

  /* ------------------------------------------------------------------ shell: nav, theme, session */
  const view = $('#adm-view');
  const actionsEl = $('#adm-actions');
  const searchEl = $('#adm-search');
  const sidebar = $('#adm-sidebar');
  const scrim = $('#adm-scrim');

  function buildNav() {
    mount($('#adm-nav'), NAV.map((g) => h`${g.group ? h`<p class="adm-nav-group">${g.group}</p>` : ''}${g.items.map((i) => h`<a href="#/${i.key}" data-nav="${i.key}">${ic(i.icon)}<span>${i.label}</span>${i.badge ? h`<b class="adm-count" id="nav-badge-${i.key}" hidden>0</b>` : ''}</a>`)}`));
  }
  function setNavActive(key) {
    $$('#adm-nav a').forEach((a) => (a.dataset.nav === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    $('#adm-title').textContent = TITLES[key] || 'Dashboard';
    document.title = `${TITLES[key] || 'Dashboard'} | Altis Voyage`;
  }
  function updateBadge() {
    const count = rowsOf('inquiries').filter((r) => r.status === 'new').length;
    const badge = $('#nav-badge-inquiries');
    if (!badge) return;
    badge.hidden = count === 0;
    badge.textContent = String(count);
  }
  function setMenu(open) {
    sidebar.classList.toggle('is-open', open);
    scrim.hidden = !open;
    $('#adm-burger').setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('adm-lock', open || drawer.open);
  }
  $('#adm-burger').addEventListener('click', () => setMenu(!sidebar.classList.contains('is-open')));
  scrim.addEventListener('click', () => setMenu(false));
  $('#adm-nav').addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => button.addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('altis-theme', next); } catch { /* applies for this visit */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#f6f3ec' : '#060f1e');
    setTimeout(() => root.classList.remove('theme-switching'), 450);
  }));
  $('#admin-logout').addEventListener('click', async () => {
    try { await api('logout', { method: 'POST' }); } catch { /* leaving anyway */ }
    location.replace('/admin/login.html');
  });

  /* ------------------------------------------------------------------ drawer (slide-over) */
  const drawerRoot = $('#adm-drawer-root');
  const drawer = { open: false, key: '', dirty: false, initial: '', spec: null, opener: null };

  function openDrawer(spec) {
    drawer.spec = spec;
    drawer.key = spec.key;
    drawer.opener = document.activeElement;
    mount(drawerRoot, h`
      <div class="adm-overlay" data-drawer-close></div>
      <aside class="adm-drawer${spec.wide ? ' is-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="adm-drawer-title">
        <header class="adm-drawer-head">
          <div><p class="adm-eyebrow">${spec.eyebrow || ''}</p><h2 id="adm-drawer-title" class="font-display">${spec.title}</h2>${spec.badges ? h`<div class="adm-drawer-badges">${spec.badges}</div>` : ''}</div>
          <button class="adm-icon-btn" type="button" data-drawer-close aria-label="Close">${ic('x')}</button>
        </header>
        <div class="adm-drawer-body" id="adm-drawer-body">${spec.body}</div>
        <footer class="adm-drawer-foot">
          ${spec.remove ? h`<button class="adm-btn danger ghost" type="button" data-drawer-delete>${ic('trash')}Delete</button>` : h`<span></span>`}
          <div class="adm-foot-right">
            ${spec.viewUrl ? h`<a class="adm-btn ghost" href="${spec.viewUrl}" target="_blank" rel="noopener">View on site ${ic('external')}</a>` : ''}
            <button class="adm-btn" type="button" data-drawer-close>Cancel</button>
            <button class="adm-btn primary" type="button" data-drawer-save>${spec.saveLabel || 'Save changes'}</button>
          </div>
        </footer>
      </aside>`);
    drawer.open = true;
    document.body.classList.add('adm-lock');
    drawer.initial = spec.snapshot();
    drawer.dirty = false;
    requestAnimationFrame(() => {
      drawerRoot.classList.add('is-open');
      ($('.adm-drawer-body input:not([type=hidden]):not([readonly]), .adm-drawer-body textarea', drawerRoot) || $('.adm-drawer', drawerRoot))?.focus({ preventScroll: true });
    });
    spec.onMount?.($('#adm-drawer-body'));
  }
  function hideDrawer() {
    if (!drawer.open) return;
    drawer.open = false;
    drawer.key = '';
    drawerRoot.classList.remove('is-open');
    document.body.classList.toggle('adm-lock', sidebar.classList.contains('is-open'));
    setTimeout(() => { if (!drawer.open) drawerRoot.innerHTML = ''; }, 260);
    if (drawer.opener && document.contains(drawer.opener)) drawer.opener.focus({ preventScroll: true });
  }
  async function closeDrawer() {
    if (!drawer.open) return;
    if (drawer.dirty && !(await confirmDialog({ title: 'Discard changes?', message: 'You have unsaved changes. If you close now they will be lost.', confirmLabel: 'Discard changes', danger: true }))) return;
    drawer.dirty = false;
    goto(`#/${state.view}`);
  }
  function markDirty() {
    if (!drawer.open) return;
    drawer.dirty = drawer.spec.snapshot() !== drawer.initial;
    drawerRoot.classList.toggle('is-dirty', drawer.dirty);
  }
  drawerRoot.addEventListener('click', async (e) => {
    if (e.target.closest('[data-drawer-close]')) closeDrawer();
    else if (e.target.closest('[data-drawer-save]')) saveDrawer();
    else if (e.target.closest('[data-drawer-delete]')) {
      const spec = drawer.spec;
      if (await confirmDialog({ title: `Delete this ${spec.noun || 'record'}?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true })) {
        try { await spec.remove(); drawer.dirty = false; toast('Deleted'); goto(`#/${state.view}`); } catch (err) { toast(err.message, { kind: 'error' }); }
      }
    }
  });
  drawerRoot.addEventListener('input', markDirty);
  drawerRoot.addEventListener('change', markDirty);
  async function saveDrawer() {
    const button = $('[data-drawer-save]', drawerRoot);
    if (!button || button.disabled) return;
    button.disabled = true;
    button.classList.add('is-loading');
    try {
      const ok = await drawer.spec.save();
      if (ok === false) return;
      drawer.dirty = false;
      goto(`#/${state.view}`);
    } catch (err) {
      toast(err.message || 'Could not save', { kind: 'error' });
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  }
  // Keep keyboard focus inside the open drawer.
  document.addEventListener('keydown', (e) => {
    if (!drawer.open || confirmEl.open) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveDrawer(); return; }
    if (e.key !== 'Tab') return;
    const focusable = $$('button:not([disabled]), a[href], input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])', $('.adm-drawer', drawerRoot)).filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  window.addEventListener('beforeunload', (e) => { if (drawer.dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ------------------------------------------------------------------ routing */
  const route = () => {
    const [, key = 'overview', id = ''] = location.hash.replace(/^#\/?/, '#/').split('/');
    return { view: key || 'overview', id };
  };
  const goto = (hash) => { if (location.hash === hash) hashChanged(); else location.hash = hash; };

  async function hashChanged() {
    const { view: next } = route();
    if (next !== state.view || !view.firstElementChild) await renderView();
    await syncDrawer();
  }
  async function renderView() {
    const { view: key } = route();
    const token = ++state.renderToken;
    state.view = key;
    state.onSearch = null;
    setNavActive(key);
    actionsEl.innerHTML = '';
    searchEl.value = state.q[key] || '';
    searchEl.placeholder = key === 'overview' ? 'Search enquiries…' : `Search ${String(TITLES[key] || '').toLowerCase()}…`;
    mount(view, skeleton());
    view.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
    try {
      if (key === 'overview') await renderOverview(token);
      else if (key === 'inquiries') await renderEnquiries(token);
      else if (key === 'site_content') await renderContentList(token);
      else if (CONFIG[key]) await renderTable(key, token);
      else mount(view, h`<div class="adm-empty"><h2 class="font-display">Page not found</h2><p>That section does not exist.</p><a class="adm-btn primary" href="#/overview">Back to the dashboard</a></div>`);
    } catch (err) {
      if (err.status === 401) return;
      mount(view, h`<div class="adm-empty"><h2 class="font-display">Something went wrong</h2><p>${err.message}</p><button class="adm-btn primary" type="button" data-act="retry">Try again</button></div>`);
    }
  }
  const skeleton = () => h`<div class="adm-skel"><div class="sk sk-title"></div><div class="sk-row"><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div></div><div class="sk sk-block"></div></div>`;

  async function syncDrawer() {
    const { view: key, id } = route();
    if (!id) { hideDrawer(); return; }
    if (drawer.open && drawer.key === `${key}/${id}`) return;
    if (key === 'inquiries') await openEnquiry(id);
    else if (key === 'site_content') await openContent(id);
    else if (CONFIG[key]) await openRecord(key, id);
  }
  window.addEventListener('hashchange', hashChanged);

  /* ------------------------------------------------------------------ shared UI pieces */
  const kpi = ({ icon, label, value, sub, tone = '', href }) => h`<a class="adm-kpi ${tone}" ${href ? raw(`href="${esc(href)}"`) : ''}><span class="adm-kpi-icon">${ic(icon)}</span><span class="adm-kpi-label">${label}</span><strong class="font-display">${value}</strong><small>${sub || ' '}</small></a>`;
  const emptyState = ({ title, text, action }) => h`<div class="adm-empty"><h2 class="font-display">${title}</h2><p>${text}</p>${action || ''}</div>`;

  function enquirySummary(rec) {
    let d = {};
    try { d = typeof rec.details === 'string' && rec.details ? JSON.parse(rec.details) : rec.details || {}; } catch { d = {}; }
    if (rec.service === 'flight') return [d.from, d.to].filter(Boolean).join(' → ') || rec.interest;
    if (rec.service === 'visa') return [d.destination_country, d.visa_type].filter(Boolean).join(' · ') || rec.interest;
    if (rec.service === 'study') return [d.study_countries, d.study_level].filter(Boolean).join(' · ') || rec.interest;
    return d.packages || d.destination || rec.interest || truncate(rec.message, 70);
  }
  const contactLine = (rec) => [rec.email, rec.phone].filter(Boolean).join(' · ') || 'No contact details';
  const waDigits = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.startsWith('0') && digits.length === 10 ? `256${digits.slice(1)}` : digits;
  };

  /* ------------------------------------------------------------------ overview */
  async function renderOverview(token) {
    const [enq, packages, offers, posts, opps, reviews, content] = await Promise.all([
      load('inquiries', true), load('packages'), load('offers'), load('posts'), load('opportunities'), load('testimonials'), load('site_content', true)
    ]);
    if (token !== state.renderToken) return;
    updateBadge();
    const now = Date.now();
    const newOnes = enq.filter((r) => r.status === 'new');
    const overdue = enq.filter(isOverdue);
    const within = (days, offset = 0) => enq.filter((r) => { const t = parseTs(r.created_at)?.getTime(); return t && now - t >= offset * 86400e3 && now - t < (days + offset) * 86400e3; });
    const thisWeek = within(7), lastWeek = within(7, 7);
    const delta = thisWeek.length - lastWeek.length;
    const today = todayIso();
    const liveOffers = offers.filter((o) => Number(o.published) === 1 && !(o.valid_until && String(o.valid_until).slice(0, 10) < today));
    const drafts = posts.filter((p) => !Number(p.published)).length + offers.filter((o) => !Number(o.published)).length + opps.filter((o) => !Number(o.published)).length;
    const parsed = Object.fromEntries(content.map((r) => { try { return [r.key, JSON.parse(r.value)]; } catch { return [r.key, {}]; } }));

    const alerts = [];
    if (overdue.length) alerts.push({ tone: 'danger', icon: 'clock', text: `${overdue.length} enquir${overdue.length === 1 ? 'y has' : 'ies have'} been waiting over 24 hours`, href: '#/inquiries', cta: 'Reply now' });
    const draftPolicies = Object.entries(CONTENT_META).filter(([k, m]) => m.policy && parsed[k] && !parsed[k].approved).length;
    if (draftPolicies) alerts.push({ tone: 'warn', icon: 'file', text: `${draftPolicies} polic${draftPolicies === 1 ? 'y is' : 'ies are'} still marked as draft`, href: '#/site_content', cta: 'Review' });
    const staleOffers = offers.filter((o) => Number(o.published) === 1 && o.valid_until && String(o.valid_until).slice(0, 10) < today).length;
    if (staleOffers) alerts.push({ tone: 'warn', icon: 'tag', text: `${staleOffers} published offer${staleOffers === 1 ? ' has' : 's have'} passed its end date`, href: '#/offers', cta: 'Tidy up' });
    const staleOpps = opps.filter((o) => Number(o.published) === 1 && o.deadline && String(o.deadline).slice(0, 10) < today).length;
    if (staleOpps) alerts.push({ tone: 'warn', icon: 'cap', text: `${staleOpps} scholarship${staleOpps === 1 ? '' : 's'} past the deadline are still published`, href: '#/opportunities', cta: 'Tidy up' });
    const draftPosts = posts.filter((p) => !Number(p.published)).length;
    if (draftPosts) alerts.push({ tone: 'info', icon: 'file', text: `${draftPosts} article${draftPosts === 1 ? ' is' : 's are'} waiting to be reviewed and published`, href: '#/posts', cta: 'Open' });
    const hidden = reviews.filter((r) => !Number(r.approved)).length;
    if (hidden) alerts.push({ tone: 'info', icon: 'star', text: `${hidden} review${hidden === 1 ? ' is' : 's are'} hidden from the website`, href: '#/testimonials', cta: 'Open' });

    // 14-day chart in the browser's local days
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (13 - i)); return d; });
    const counts = Object.fromEntries(days.map((d) => [localKey(d), 0]));
    enq.forEach((r) => { const t = parseTs(r.created_at); if (t && localKey(t) in counts) counts[localKey(t)] += 1; });
    const series = days.map((d) => ({ d, n: counts[localKey(d)] }));
    const max = Math.max(3, ...series.map((s) => s.n));
    const byService = SERVICES.map(([id, label]) => [label, enq.filter((r) => (r.service || 'general') === id).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
    const maxService = Math.max(1, ...byService.map(([, n]) => n));
    const hour = new Date().getHours();
    const name = (state.session?.email || '').split('@')[0];

    mount(view, h`
      <section class="adm-page">
        <header class="adm-hero">
          <div><p class="adm-eyebrow">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 class="font-display">${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}${name ? `, ${name}` : ''}</h1>
            <p>${newOnes.length ? `You have ${newOnes.length} new enquir${newOnes.length === 1 ? 'y' : 'ies'} to look at.` : 'No new enquiries waiting. Nice work.'}</p></div>
          <div class="adm-hero-actions"><a class="adm-btn primary" href="#/inquiries">${ic('inbox')}Open enquiries</a><a class="adm-btn" href="#/offers/new">${ic('plus')}New offer</a><a class="adm-btn" href="#/posts/new">${ic('plus')}New article</a></div>
        </header>

        <div class="adm-kpis">
          ${kpi({ icon: 'inbox', label: 'New enquiries', value: newOnes.length, sub: overdue.length ? `${overdue.length} over 24h old` : 'All within 24 hours', tone: overdue.length ? 'is-warn' : '', href: '#/inquiries' })}
          ${kpi({ icon: 'trend', label: 'This week', value: thisWeek.length, sub: delta === 0 ? 'Same as last week' : `${delta > 0 ? '+' : ''}${delta} vs last week`, tone: delta > 0 ? 'is-up' : '' })}
          ${kpi({ icon: 'tag', label: 'Live offers', value: liveOffers.length, sub: `${packages.length} packages listed`, href: '#/offers' })}
          ${kpi({ icon: 'file', label: 'Drafts waiting', value: drafts, sub: 'Articles, offers, scholarships', href: '#/posts' })}
        </div>

        <div class="adm-grid-2">
          <section class="adm-card"><header class="adm-card-head"><h2 class="font-display">Enquiries, last 14 days</h2><span class="adm-muted">${enq.length} in total</span></header>
            <figure class="adm-chart" aria-label="Enquiries per day for the last 14 days">
              <svg viewBox="0 0 560 170" role="img" aria-hidden="true">
                ${[0, 0.5, 1].map((f) => h`<line class="grid" x1="0" x2="560" y1="${(142 - f * 120).toFixed(1)}" y2="${(142 - f * 120).toFixed(1)}"/>`)}
                ${series.map((s, i) => { const bar = Math.max(s.n ? 6 : 2, (s.n / max) * 120); const x = 8 + i * 39.5; return h`<g><rect class="bar${s.n ? '' : ' is-zero'}${i === 13 ? ' is-today' : ''}" x="${x}" y="${(142 - bar).toFixed(1)}" width="26" height="${bar.toFixed(1)}" rx="8"><title>${s.d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}: ${s.n}</title></rect>${s.n ? h`<text x="${x + 13}" y="${(142 - bar - 6).toFixed(1)}" text-anchor="middle" class="val">${s.n}</text>` : ''}<text x="${x + 13}" y="162" text-anchor="middle" class="day">${s.d.getDate()}</text></g>`; })}
              </svg>
            </figure>
          </section>
          <section class="adm-card"><header class="adm-card-head"><h2 class="font-display">By service</h2></header>
            ${byService.length ? h`<ul class="adm-hbars">${byService.map(([label, n]) => h`<li><span>${label}</span><div><i style="width:${Math.max(6, (n / maxService) * 100)}%"></i></div><b>${n}</b></li>`)}</ul>` : h`<p class="adm-muted">Nothing to chart yet.</p>`}
          </section>
        </div>

        <div class="adm-grid-2 is-wide-left">
          <section class="adm-card"><header class="adm-card-head"><h2 class="font-display">Recent enquiries</h2><a class="adm-link" href="#/inquiries">View all</a></header>
            ${enq.length ? h`<ul class="adm-recent">${[...enq].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 6).map((r) => h`<li><a href="#/inquiries/${r.id}"><span class="adm-avatar sm" aria-hidden="true">${(r.name || '?').slice(0, 1).toUpperCase()}</span><span class="adm-recent-main"><b>${r.name || 'Unnamed'}</b><small>${SERVICE[r.service] || 'General'} · ${truncate(enquirySummary(r), 48)}</small></span><span class="adm-recent-meta">${pill(r.status)}<small>${rel(r.created_at)}</small></span></a></li>`)}</ul>` : emptyState({ title: 'No enquiries yet', text: 'New requests from the website will appear here.' })}
          </section>
          <section class="adm-card"><header class="adm-card-head"><h2 class="font-display">Needs attention</h2></header>
            ${alerts.length ? h`<ul class="adm-alerts">${alerts.map((a) => h`<li class="is-${a.tone}"><span>${ic(a.icon)}</span><p>${a.text}</p><a href="${a.href}">${a.cta}</a></li>`)}</ul>` : h`<p class="adm-allclear">${ic('check')}Everything is up to date.</p>`}
          </section>
        </div>
      </section>`);
    state.onSearch = null;
  }

  /* ------------------------------------------------------------------ generic content tables */
  function cellHtml(cfg, col, rec) {
    const v = rec[col.key];
    switch (col.type) {
      case 'title': return h`<div class="adm-cell-title">${col.thumb ? h`<span class="adm-thumb${rec[col.thumb] ? '' : ' is-empty'}">${rec[col.thumb] ? h`<img src="${rec[col.thumb]}" alt="" loading="lazy" />` : ic('image')}</span>` : ''}<div><b>${v || 'Untitled'}</b>${col.sub && col.sub(rec) ? h`<small>${truncate(col.sub(rec), 100)}</small>` : ''}</div></div>`;
      case 'toggle': return h`<button type="button" class="adm-switch-btn" role="switch" aria-checked="${Number(v) === 1}" data-act="toggle" data-field="${col.key}" data-id="${rec.id}" aria-label="${col.label}: ${rec[Object.keys(rec).find((k) => ['title', 'name', 'question'].includes(k))] || rec.id}"><span></span></button>`;
      case 'price': return fmtUGX(v);
      case 'date': return v ? fmtDate(v) : '—';
      case 'rel': return h`<span title="${fmtDateTime(v)}">${rel(v)}</span>`;
      case 'num': return v === null || v === undefined || v === '' ? '—' : v;
      case 'label': return v ? (col.labels?.[v] || humanize(v)) : '—';
      case 'stars': return h`<span class="adm-stars" aria-label="${v || 0} out of 5">${'★'.repeat(Math.max(0, Math.min(5, Number(v) || 0)))}</span>`;
      case 'yesno': return Number(v) === 1 ? h`<span class="adm-pill st-completed">Verified</span>` : h`<span class="adm-muted">No</span>`;
      case 'expiry': { const t = String(v || '').slice(0, 10); return t ? h`${fmtDate(t)} ${t < todayIso() ? h`<span class="adm-pill st-cancelled">${col.expiredLabel || 'Expired'}</span>` : ''}` : h`<span class="adm-muted">No end date</span>`; }
      default: return v ?? '—';
    }
  }
  const sortValue = (rec, key) => { const v = rec[key]; return v === null || v === undefined ? '' : (typeof v === 'number' ? v : (/_at$/.test(key) ? String(v) : (Number.isFinite(Number(v)) && String(v).trim() !== '' ? Number(v) : String(v).toLowerCase()))); };
  function sortRows(rows, sort) {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => { const x = sortValue(a, sort.key), y = sortValue(b, sort.key); if (x === y) return Number(b.id) - Number(a.id); return (x > y ? 1 : -1) * dir; });
  }
  const matches = (rec, keys, q) => !q || keys.some((k) => String(rec[k] ?? '').toLowerCase().includes(q));

  async function renderTable(table, token) {
    const cfg = CONFIG[table];
    await load(table);
    if (token !== state.renderToken) return;
    state.filters[table] ||= 'all';
    state.sorts[table] ||= { ...cfg.sort };
    actionsEl.innerHTML = '';
    mount(actionsEl, h`<button class="adm-btn" type="button" data-act="refresh" aria-label="Refresh">${ic('refresh')}</button><a class="adm-btn primary" href="#/${table}/new">${ic('plus')}New ${cfg.singular}</a>`);
    mount(view, h`
      <section class="adm-page">
        <header class="adm-page-head"><div><h1 class="font-display">${TITLES[table]}</h1><p>${cfg.help || ''}</p></div></header>
        <div class="adm-toolbar">
          ${cfg.filter ? h`<div class="adm-chips" role="group" aria-label="Filter">${[['all', cfg.filter.all], ['on', cfg.filter.on], ['off', cfg.filter.off]].map(([id, label]) => h`<button type="button" class="adm-chip" data-act="filter" data-value="${id}" aria-pressed="${state.filters[table] === id}">${label}<b data-count="${id}"></b></button>`)}</div>` : ''}
          <span class="adm-muted" id="adm-count" aria-live="polite"></span>
        </div>
        <div id="adm-list"></div>
      </section>`);
    state.onSearch = () => paintTable(table);
    paintTable(table);
  }
  function paintTable(table) {
    const cfg = CONFIG[table];
    const q = (state.q[table] || '').trim().toLowerCase();
    const all = rowsOf(table);
    const f = cfg.filter;
    if (f) $$('[data-count]', view).forEach((b) => { const id = b.dataset.count; b.textContent = String(id === 'all' ? all.length : all.filter((r) => (Number(r[f.key]) === 1) === (id === 'on')).length); });
    const rows = sortRows(all.filter((r) => matches(r, cfg.search, q) && (state.filters[table] === 'all' || !f || (Number(r[f.key]) === 1) === (state.filters[table] === 'on'))), state.sorts[table]);
    $('#adm-count', view).textContent = `${rows.length} of ${all.length}`;
    const target = $('#adm-list', view);
    if (!rows.length) {
      mount(target, all.length ? emptyState({ title: 'No matches', text: 'Try a different search or filter.' }) : emptyState({ title: `No ${TITLES[table].toLowerCase()} yet`, text: `Add your first ${cfg.singular} to get started.`, action: h`<a class="adm-btn primary" href="#/${table}/new">${ic('plus')}New ${cfg.singular}</a>` }));
      return;
    }
    const sort = state.sorts[table];
    mount(target, h`<div class="adm-table-wrap"><table class="adm-table"><thead><tr>${cfg.columns.map((c) => h`<th scope="col" aria-sort="${sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}"><button type="button" data-act="sort" data-key="${c.key}">${c.label}${sort.key === c.key ? ic(sort.dir === 'asc' ? 'up' : 'down') : ''}</button></th>`)}<th class="adm-th-end"><span class="visually-hidden">Open</span></th></tr></thead>
      <tbody>${rows.map((r) => h`<tr class="adm-row" data-act="open" data-id="${r.id}" tabindex="0">${cfg.columns.map((c) => h`<td data-label="${c.label}">${cellHtml(cfg, c, r)}</td>`)}<td class="adm-td-end" aria-hidden="true">${ic('chevron')}</td></tr>`)}</tbody></table></div>`);
  }

  async function toggleField(table, id, field) {
    const rec = rowsOf(table).find((r) => Number(r.id) === Number(id));
    if (!rec) return;
    const next = Number(rec[field]) === 1 ? 0 : 1;
    const before = rec[field];
    rec[field] = next;
    paintCurrent();
    try {
      const saved = await api(`${table}/${id}`, { method: 'PUT', body: JSON.stringify({ [field]: next }) });
      putLocal(table, saved);
      paintCurrent();
      toast(`${humanize(field)} ${next ? 'on' : 'off'}`, { action: { label: 'Undo', run: () => toggleField(table, id, field) }, ms: 3500 });
    } catch (err) {
      rec[field] = before;
      paintCurrent();
      toast(err.message, { kind: 'error' });
    }
  }
  function paintCurrent() {
    if (state.view === 'inquiries') paintEnquiries();
    else if (CONFIG[state.view] && $('#adm-list', view)) paintTable(state.view);
    updateBadge();
  }

  /* generic form helpers */
  function fieldHtml(f, value, idPrefix = 'f') {
    const id = `${idPrefix}-${f.name}`;
    const hint = f.hint ? h`<small class="adm-hint">${f.hint}</small>` : '';
    const type = f.type;
    if (type === 'bool') return h`<div class="adm-field${f.wide ? ' wide' : ''}"><label class="adm-switch" for="${id}"><input id="${id}" name="${f.name}" type="checkbox" value="1" ${Number(value) === 1 || value === true ? raw('checked') : ''}><span class="track"></span><span class="lbl">${f.label}</span></label>${hint}</div>`;
    let control;
    if (Array.isArray(type)) control = h`<select id="${id}" name="${f.name}">${type.map(([v, l]) => h`<option value="${v}" ${String(v) === String(value ?? '') ? raw('selected') : ''}>${l}</option>`)}</select>`;
    else if (type === 'textarea' || type === 'longtext') control = h`<textarea id="${id}" name="${f.name}" rows="${type === 'longtext' ? 16 : 4}">${value ?? ''}</textarea>`;
    else if (type === 'readonly') control = h`<input id="${id}" name="${f.name}" value="${value ?? ''}" readonly placeholder="Assigned automatically" />`;
    else {
      const htmlType = { number: 'number', url: 'url', image: 'url', date: 'date', email: 'email', tel: 'tel' }[type] || 'text';
      control = h`<input id="${id}" name="${f.name}" type="${htmlType}" value="${type === 'date' ? String(value ?? '').slice(0, 10) : (value ?? '')}" ${htmlType === 'number' ? raw('inputmode="numeric"') : ''} ${htmlType === 'url' || htmlType === 'image' ? raw('placeholder="https://…"') : ''} />`;
    }
    return h`<div class="adm-field${f.wide || type === 'textarea' || type === 'longtext' ? ' wide' : ''}"><label class="adm-label" for="${id}">${f.label}${f.required ? h` <abbr title="required">*</abbr>` : ''}</label>${control}${type === 'image' ? h`<div class="adm-imgprev" data-preview="${f.name}"><img alt="" /></div>` : ''}${hint}<span class="adm-error" data-error-for="${f.name}"></span></div>`;
  }
  const formHtml = (cfg, rec) => h`<form class="adm-form" id="adm-form" novalidate>${cfg.fields.map((f) => fieldHtml({ ...f, required: cfg.required?.includes(f.name) }, rec[f.name]))}</form>`;
  function readForm(cfg, form) {
    const out = {};
    cfg.fields.forEach((f) => {
      if (f.type === 'readonly') return;
      const el = form.elements[f.name];
      if (!el) return;
      out[f.name] = f.type === 'bool' ? (el.checked ? 1 : 0) : el.value;
    });
    return out;
  }
  const snapshotForm = (form) => JSON.stringify([...new FormData(form).entries()]);
  function bindPreviews(root) {
    $$('[data-preview]', root).forEach((box) => {
      const input = root.querySelector(`[name="${box.dataset.preview}"]`);
      const img = box.querySelector('img');
      const update = () => { const v = input.value.trim(); const ok = /^(https?:\/\/|\/)/i.test(v); box.hidden = !ok; if (ok) { img.classList.remove('is-broken'); img.src = v; } };
      input.addEventListener('input', update);
      update();
    });
  }
  function validate(cfg, form, payload) {
    $$('.adm-error', form).forEach((e) => { e.textContent = ''; });
    $$('[aria-invalid]', form).forEach((e) => e.removeAttribute('aria-invalid'));
    let first = null;
    (cfg.required || []).forEach((name) => {
      if (String(payload[name] ?? '').trim()) return;
      const slot = form.querySelector(`[data-error-for="${name}"]`);
      if (slot) slot.textContent = 'This field is required.';
      const el = form.elements[name];
      el?.setAttribute('aria-invalid', 'true');
      first ||= el;
    });
    first?.focus();
    return !first;
  }

  async function openRecord(table, id) {
    const cfg = CONFIG[table];
    await load(table);
    const isNew = id === 'new';
    const rec = isNew ? { ...cfg.defaults } : rowsOf(table).find((r) => Number(r.id) === Number(id));
    if (!rec) { toast('That record no longer exists.', { kind: 'error' }); goto(`#/${table}`); return; }
    const url = !isNew && cfg.publicUrl ? cfg.publicUrl(rec) : null;
    const live = !isNew && ['published', 'approved'].some((k) => k in rec && Number(rec[k]) === 1);
    openDrawer({
      key: `${table}/${id}`, noun: cfg.singular, eyebrow: isNew ? 'New' : `${TITLES[table]} · #${rec.id}`,
      title: isNew ? `New ${cfg.singular}` : (rec.title || rec.name || rec.question || `Edit ${cfg.singular}`),
      badges: isNew ? '' : h`${'published' in rec ? h`<span class="adm-pill ${Number(rec.published) ? 'st-completed' : 'st-closed'}">${Number(rec.published) ? 'Published' : 'Draft'}</span>` : ''}${rec.updated_at ? h`<span class="adm-muted">Updated ${rel(rec.updated_at)}</span>` : ''}`,
      body: formHtml(cfg, rec), viewUrl: live ? url : null, saveLabel: isNew ? `Create ${cfg.singular}` : 'Save changes',
      snapshot: () => snapshotForm($('#adm-form')),
      onMount: (body) => bindPreviews(body),
      remove: isNew ? null : async () => { await api(`${table}/${rec.id}`, { method: 'DELETE' }); state.tables[table] = rowsOf(table).filter((r) => Number(r.id) !== Number(rec.id)); paintCurrent(); },
      save: async () => {
        const form = $('#adm-form');
        const payload = readForm(cfg, form);
        if (!validate(cfg, form, payload)) { toast('Please fill in the required fields.', { kind: 'error' }); return false; }
        const saved = await api(isNew ? table : `${table}/${rec.id}`, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload) });
        putLocal(table, saved);
        drawer.dirty = false;
        paintCurrent();
        toast(isNew ? `${humanize(cfg.singular)} created` : 'Changes saved');
        return true;
      }
    });
  }

  /* ------------------------------------------------------------------ enquiries */
  async function renderEnquiries(token) {
    await load('inquiries', true);
    if (token !== state.renderToken) return;
    updateBadge();
    mount(actionsEl, h`<button class="adm-btn" type="button" data-act="refresh" aria-label="Refresh">${ic('refresh')}</button><a class="adm-btn primary" href="#/inquiries/new">${ic('plus')}Log enquiry</a>`);
    mount(view, h`
      <section class="adm-page">
        <header class="adm-page-head"><div><h1 class="font-display">Enquiries</h1><p>Requests from every form on the website. Customers can see the status (not your notes) using their reference.</p></div></header>
        <div class="adm-toolbar">
          <div class="adm-chips" id="enq-chips" role="group" aria-label="Filter by status"></div>
          <label class="adm-select-inline"><span class="visually-hidden">Service</span><select id="enq-service"><option value="all">All services</option>${SERVICES.map(([id, label]) => h`<option value="${id}" ${state.enqService === id ? raw('selected') : ''}>${label}</option>`)}</select></label>
          <div class="adm-seg" role="group" aria-label="View"><button type="button" data-act="mode" data-mode="list" aria-pressed="${state.enqMode === 'list'}">${ic('list')}List</button><button type="button" data-act="mode" data-mode="board" aria-pressed="${state.enqMode === 'board'}">${ic('board')}Board</button></div>
          <span class="adm-muted" id="adm-count" aria-live="polite"></span>
        </div>
        <div id="adm-list"></div>
      </section>`);
    $('#enq-service', view).addEventListener('change', (e) => { state.enqService = e.target.value; paintEnquiries(); });
    state.onSearch = paintEnquiries;
    paintEnquiries();
  }
  function paintEnquiries() {
    if (!$('#adm-list', view) || state.view !== 'inquiries') return;
    const all = rowsOf('inquiries');
    const q = (state.q.inquiries || '').trim().toLowerCase();
    const board = state.enqMode === 'board';
    const base = all.filter((r) => matches(r, ['reference', 'name', 'email', 'phone', 'interest', 'message', 'details'], q) && (state.enqService === 'all' || (r.service || 'general') === state.enqService));
    mount($('#enq-chips', view), board ? '' : [['all', 'All', base.length], ...STATUSES.map(([id, label]) => [id, label, base.filter((r) => r.status === id).length])].map(([id, label, n]) => h`<button type="button" class="adm-chip st-chip-${id}" data-act="status-filter" data-value="${id}" aria-pressed="${state.enqStatus === id}">${label}<b>${n}</b></button>`));
    $$('[data-act="mode"]', view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.enqMode)));
    const target = $('#adm-list', view);
    const rows = sortRows(base.filter((r) => board || state.enqStatus === 'all' || r.status === state.enqStatus), { key: 'created_at', dir: 'desc' });
    $('#adm-count', view).textContent = `${rows.length} of ${all.length}`;
    if (!all.length) { mount(target, emptyState({ title: 'No enquiries yet', text: 'Requests sent from the website will appear here the moment they arrive.' })); return; }
    if (!rows.length && !board) { mount(target, emptyState({ title: 'No matches', text: 'Try a different search or status.' })); return; }
    if (!board) {
      mount(target, h`<div class="adm-table-wrap"><table class="adm-table is-enq"><thead><tr><th scope="col">Reference</th><th scope="col">Customer</th><th scope="col">Request</th><th scope="col">Status</th><th scope="col">Received</th><th class="adm-th-end"><span class="visually-hidden">Open</span></th></tr></thead><tbody>${rows.map((r) => h`<tr class="adm-row${isOverdue(r) ? ' is-overdue' : ''}" data-act="open" data-id="${r.id}" tabindex="0"><td data-label="Reference"><code>${r.reference || `#${r.id}`}</code></td><td data-label="Customer"><div class="adm-cell-title"><span class="adm-avatar sm" aria-hidden="true">${(r.name || '?').slice(0, 1).toUpperCase()}</span><div><b>${r.name || 'Unnamed'}</b><small>${contactLine(r)}</small></div></div></td><td data-label="Request"><span class="adm-svc">${SERVICE[r.service] || 'General'}</span><small class="adm-sub">${truncate(enquirySummary(r), 60)}</small></td><td data-label="Status">${pill(r.status)}${isOverdue(r) ? h` <span class="adm-overdue" title="Waiting more than 24 hours">${ic('clock')}Overdue</span>` : ''}</td><td data-label="Received"><span title="${fmtDateTime(r.created_at)}">${rel(r.created_at)}</span></td><td class="adm-td-end" aria-hidden="true">${ic('chevron')}</td></tr>`)}</tbody></table></div>`);
      return;
    }
    mount(target, h`<div class="adm-board" id="adm-board">${STATUSES.map(([id, label]) => { const col = rows.filter((r) => r.status === id); return h`<section class="adm-col st-col-${id}" data-status="${id}" aria-label="${label}"><header><span class="adm-dot st-${id}"></span><b>${label}</b><em>${col.length}</em></header><div class="adm-col-body">${col.map((r) => h`<article class="adm-kcard${isOverdue(r) ? ' is-overdue' : ''}" draggable="true" data-act="open" data-id="${r.id}" tabindex="0"><div class="adm-kcard-top"><code>${r.reference || `#${r.id}`}</code><span class="adm-svc">${SERVICE[r.service] || 'General'}</span></div><b>${r.name || 'Unnamed'}</b><p>${truncate(enquirySummary(r), 70)}</p><footer><span title="${fmtDateTime(r.created_at)}">${isOverdue(r) ? ic('clock') : ''}${rel(r.created_at)}</span><select data-move="${r.id}" aria-label="Change status of ${r.reference || r.id}">${STATUSES.map(([sid, sl]) => h`<option value="${sid}" ${sid === r.status ? raw('selected') : ''}>${sl}</option>`)}</select></footer></article>`)}${col.length ? '' : h`<p class="adm-col-empty">Drop here</p>`}</div></section>`; })}</div>`);
  }
  async function changeStatus(id, status, { undo = true } = {}) {
    const rec = rowsOf('inquiries').find((r) => Number(r.id) === Number(id));
    if (!rec || rec.status === status) return;
    const before = rec.status;
    rec.status = status;
    paintCurrent();
    try {
      putLocal('inquiries', await api(`inquiries/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }));
      paintCurrent();
      toast(`${rec.reference || `#${id}`} moved to ${STATUS[status].label}`, undo ? { action: { label: 'Undo', run: () => changeStatus(id, before, { undo: false }) } } : {});
    } catch (err) {
      rec.status = before;
      paintCurrent();
      toast(err.message, { kind: 'error' });
    }
  }

  const DETAIL_LABELS = { from: 'From', to: 'To', depart_date: 'Departure', return_date: 'Return', trip_type: 'Trip type', adults: 'Adults', children: 'Children', infants: 'Infants', cabin_class: 'Travel class', flexible_dates: 'Flexible dates', preferred_contact: 'Prefers', destination: 'Destination', packages: 'Packages of interest', budget: 'Budget', destination_country: 'Destination country', nationality: 'Nationality', visa_type: 'Visa type', travel_date: 'Travel date', applicants: 'Applicants', study_countries: 'Study countries', study_level: 'Level', field_of_study: 'Field of study', intake: 'Intake', highest_qualification: 'Qualification', funding: 'Funding', opportunity: 'Opportunity', offer: 'Offer', duration_days: 'Length (days)', interests: 'Interests', travel_month: 'Travel month' };
  async function openEnquiry(id) {
    await load('inquiries');
    if (id === 'new') {
      const cfg = CONFIG.inquiries;
      openDrawer({
        key: 'inquiries/new', eyebrow: 'New', title: 'Log an enquiry', saveLabel: 'Create enquiry',
        body: h`<p class="adm-help">Use this to record a request that came in by phone, WhatsApp or in person, so it is tracked with the rest.</p>${formHtml(cfg, cfg.defaults)}`,
        snapshot: () => snapshotForm($('#adm-form')),
        save: async () => {
          const form = $('#adm-form');
          const payload = { ...readForm(cfg, form), status: 'new' };
          if (!validate(cfg, form, payload)) return false;
          if (!payload.email.trim() && !payload.phone.trim()) { toast('Add an email address or phone number.', { kind: 'error' }); return false; }
          putLocal('inquiries', await api('inquiries', { method: 'POST', body: JSON.stringify(payload) }));
          drawer.dirty = false; paintCurrent(); toast('Enquiry logged'); return true;
        }
      });
      return;
    }
    const rec = rowsOf('inquiries').find((r) => Number(r.id) === Number(id));
    if (!rec) { toast('That enquiry no longer exists.', { kind: 'error' }); goto('#/inquiries'); return; }
    let details = {};
    try { details = typeof rec.details === 'string' && rec.details ? JSON.parse(rec.details) : rec.details || {}; } catch { details = {}; }
    const pkg = rec.package_id ? rowsOf('packages').find((p) => Number(p.id) === Number(rec.package_id)) : null;
    const wa = waDigits(rec.phone);
    const subject = encodeURIComponent(`Your Altis Voyage request ${rec.reference || ''}`);
    const mailBody = encodeURIComponent(`Hello ${rec.name || ''},\n\nThank you for contacting Altis Voyage about your request ${rec.reference || ''}.\n\n`);
    const waText = encodeURIComponent(`Hello ${rec.name || ''}, this is Altis Voyage about your request ${rec.reference || ''}.`);
    const fmtVal = (k, v) => (/date$/.test(k) ? fmtDate(v) : /^[a-z-]+$/.test(String(v)) && k !== 'from' && k !== 'to' ? humanize(String(v).replace(/-/g, ' ')) : v);
    openDrawer({
      key: `inquiries/${id}`, noun: 'enquiry', eyebrow: rec.reference || `Enquiry #${rec.id}`, title: rec.name || 'Unnamed customer',
      badges: h`<span class="adm-svc">${SERVICE[rec.service] || 'General'}</span>${pill(rec.status)}${isOverdue(rec) ? h`<span class="adm-overdue">${ic('clock')}Overdue</span>` : ''}<span class="adm-muted" title="${fmtDateTime(rec.created_at)}">Received ${rel(rec.created_at)}</span>`,
      body: h`<form id="adm-form" class="adm-enq" novalidate>
        <section class="adm-block"><h3>Contact</h3>
          <div class="adm-contact">
            ${rec.phone ? h`<div><span>${ic('phone')}${rec.phone}</span><div class="adm-contact-actions"><a class="adm-btn sm" href="tel:${rec.phone.replace(/[^\d+]/g, '')}">Call</a>${wa.length >= 9 ? h`<a class="adm-btn sm" href="https://wa.me/${wa}?text=${waText}" target="_blank" rel="noopener">WhatsApp</a>` : ''}<button class="adm-btn sm" type="button" data-copy="${rec.phone}">Copy</button></div></div>` : ''}
            ${rec.email ? h`<div><span>${ic('mail')}${rec.email}</span><div class="adm-contact-actions"><a class="adm-btn sm" href="mailto:${rec.email}?subject=${subject}&body=${mailBody}">Email</a><button class="adm-btn sm" type="button" data-copy="${rec.email}">Copy</button></div></div>` : ''}
            ${!rec.phone && !rec.email ? h`<p class="adm-muted">No contact details were given.</p>` : ''}
          </div></section>
        <section class="adm-block"><h3>Status</h3>
          <div class="adm-statuses" role="radiogroup" aria-label="Status">${STATUSES.map(([sid, label]) => h`<label class="adm-status-opt st-${sid}"><input type="radio" name="status" value="${sid}" ${sid === rec.status ? raw('checked') : ''}><span>${label}</span></label>`)}</div>
          <p class="adm-hint" id="enq-customer-view">Customer sees: <b>${STATUS[rec.status]?.customer || 'Received'}</b></p></section>
        <section class="adm-block"><h3>Request</h3>
          <dl class="adm-dl">${Object.entries(details).map(([k, v]) => h`<div><dt>${DETAIL_LABELS[k] || humanize(k)}</dt><dd>${fmtVal(k, v)}</dd></div>`)}${pkg ? h`<div><dt>Package</dt><dd><a class="adm-link" href="#/packages/${pkg.id}">${pkg.title}</a></dd></div>` : ''}${rec.interest ? h`<div><dt>Interested in</dt><dd>${rec.interest}</dd></div>` : ''}</dl>
          ${rec.message ? h`<blockquote class="adm-quote">${rec.message}</blockquote>` : h`<p class="adm-muted">No message was written.</p>`}</section>
        <section class="adm-block"><h3>Internal notes</h3><div class="adm-field wide"><label class="visually-hidden" for="f-admin_notes">Internal notes</label><textarea id="f-admin_notes" name="admin_notes" rows="5" placeholder="Quotation details, what you agreed, next steps…">${rec.admin_notes || ''}</textarea><small class="adm-hint">Only staff can see this.</small></div></section>
      </form>`,
      snapshot: () => snapshotForm($('#adm-form')),
      onMount: (body) => {
        body.addEventListener('change', (e) => { if (e.target.name === 'status') $('#enq-customer-view', body).innerHTML = `Customer sees: <b>${esc(STATUS[e.target.value]?.customer || '')}</b>`; });
        body.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-copy]');
          if (!b) return;
          try { await navigator.clipboard.writeText(b.dataset.copy); toast('Copied'); } catch { toast('Could not copy', { kind: 'error' }); }
        });
      },
      remove: async () => { await api(`inquiries/${rec.id}`, { method: 'DELETE' }); state.tables.inquiries = rowsOf('inquiries').filter((r) => Number(r.id) !== Number(rec.id)); paintCurrent(); },
      save: async () => {
        const form = $('#adm-form');
        const status = form.elements.status.value;
        putLocal('inquiries', await api(`inquiries/${rec.id}`, { method: 'PUT', body: JSON.stringify({ status, admin_notes: form.elements.admin_notes.value }) }));
        drawer.dirty = false; paintCurrent(); toast(`Saved. Status: ${STATUS[status].label}`); return true;
      }
    });
  }

  /* ------------------------------------------------------------------ site content */
  async function renderContentList(token) {
    await load('site_content', true);
    if (token !== state.renderToken) return;
    const rows = rowsOf('site_content');
    const parse = (r) => { try { return JSON.parse(r.value); } catch { return null; } };
    const groups = {};
    rows.forEach((r) => { (groups[CONTENT_META[r.key]?.group || 'Other'] ||= []).push(r); });
    const order = ['Homepage & company', 'Service pages', 'Policies', 'Other'];
    mount(view, h`<section class="adm-page"><header class="adm-page-head"><div><h1 class="font-display">Site content</h1><p>Text, contact details and policies that appear across the website. Changes go live as soon as you save.</p></div></header>
      ${order.filter((g) => groups[g]).map((g) => h`<h2 class="adm-group-title">${g}</h2><div class="adm-cards">${groups[g].sort((a, b) => Object.keys(CONTENT_META).indexOf(a.key) - Object.keys(CONTENT_META).indexOf(b.key)).map((r) => { const meta = CONTENT_META[r.key] || { label: humanize(r.key), desc: 'Custom content.' }; const v = parse(r); return h`<a class="adm-card adm-content-card" href="#/site_content/${r.id}"><header><h3 class="font-display">${meta.label}</h3>${meta.policy ? (v?.approved ? h`<span class="adm-pill st-completed">Approved</span>` : h`<span class="adm-pill st-new">Draft</span>`) : ''}</header><p>${meta.desc}</p><footer><span class="adm-muted">Updated ${rel(r.updated_at)}</span><span class="adm-link">Edit ${ic('chevron')}</span></footer></a>`; })}</div>`)}</section>`);
    state.onSearch = null;
  }

  const getAt = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
  function setAt(obj, path, value) { const parent = getAt(obj, path.slice(0, -1)); parent[path[path.length - 1]] = value; }
  const blankLike = (v) => (Array.isArray(v) ? v.map(blankLike) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)])) : typeof v === 'number' ? 0 : typeof v === 'boolean' ? false : '');

  function ceNode(value, path, key, depth = 0) {
    const pj = JSON.stringify(path);
    const label = FIELD_LABELS[key] || humanize(key);
    const hint = FIELD_HINTS[key] ? h`<small class="adm-hint">${FIELD_HINTS[key]}</small>` : '';
    if (typeof value === 'boolean') return h`<div class="adm-field wide"><label class="adm-switch"><input type="checkbox" data-path="${pj}" data-type="bool" ${value ? raw('checked') : ''}><span class="track"></span><span class="lbl">${label}</span></label>${hint}</div>`;
    if (typeof value === 'number') return h`<div class="adm-field"><label class="adm-label">${label}<input type="number" data-path="${pj}" data-type="number" value="${value}"></label>${hint}</div>`;
    if (Array.isArray(value)) {
      const objects = value.length && value.every((x) => x && typeof x === 'object' && !Array.isArray(x));
      if (!objects) return h`<div class="adm-field wide ce-group"><span class="adm-label">${label}</span>${hint}<div class="ce-list">${value.map((item, i) => h`<div class="ce-row"><input type="text" data-path="${JSON.stringify([...path, i])}" value="${item}" aria-label="${label} ${i + 1}"><button type="button" class="adm-icon-btn sm" data-ce="remove" data-path="${pj}" data-index="${i}" aria-label="Remove">${ic('x')}</button></div>`)}</div><button type="button" class="adm-btn sm" data-ce="add" data-path="${pj}">${ic('plus')}Add</button></div>`;
      return h`<div class="adm-field wide ce-group"><span class="adm-label">${label}</span>${hint}<div class="ce-repeater">${value.map((item, i) => h`<fieldset class="ce-item"><legend>${item.title || item.name || item.question || `Item ${i + 1}`}</legend><div class="ce-item-tools"><button type="button" class="adm-icon-btn sm" data-ce="up" data-path="${pj}" data-index="${i}" aria-label="Move up" ${i === 0 ? raw('disabled') : ''}>${ic('up')}</button><button type="button" class="adm-icon-btn sm" data-ce="down" data-path="${pj}" data-index="${i}" aria-label="Move down" ${i === value.length - 1 ? raw('disabled') : ''}>${ic('down')}</button><button type="button" class="adm-icon-btn sm danger" data-ce="remove" data-path="${pj}" data-index="${i}" aria-label="Remove item">${ic('trash')}</button></div><div class="adm-form">${Object.entries(item).map(([k, v]) => ceNode(v, [...path, i, k], k, depth + 1))}</div></fieldset>`)}</div><button type="button" class="adm-btn sm" data-ce="add" data-path="${pj}">${ic('plus')}Add item</button></div>`;
    }
    if (value && typeof value === 'object') return h`<fieldset class="adm-field wide ce-object"><legend>${label}</legend><div class="adm-form">${Object.entries(value).map(([k, v]) => ceNode(v, [...path, k], k, depth + 1))}</div></fieldset>`;
    const text = String(value ?? '');
    const long = LONG_KEYS.has(key) || text.length > 80 || text.includes('\n');
    if (key === 'image') return h`<div class="adm-field wide"><label class="adm-label">${label}<input type="url" data-path="${pj}" value="${text}" placeholder="https://…"></label>${text ? h`<div class="adm-imgprev"><img src="${text}" alt=""></div>` : ''}${hint}</div>`;
    return long
      ? h`<div class="adm-field wide"><label class="adm-label">${label}<textarea data-path="${pj}" rows="${text.length > 500 ? 18 : text.length > 160 ? 7 : 4}">${text}</textarea></label>${hint}</div>`
      : h`<div class="adm-field"><label class="adm-label">${label}<input type="text" data-path="${pj}" value="${text}"></label>${hint}</div>`;
  }
  async function openContent(id) {
    await load('site_content');
    const rec = rowsOf('site_content').find((r) => Number(r.id) === Number(id));
    if (!rec) { toast('That content block no longer exists.', { kind: 'error' }); goto('#/site_content'); return; }
    const meta = CONTENT_META[rec.key] || { label: humanize(rec.key) };
    let draft;
    let plain = false;
    try { draft = JSON.parse(rec.value); if (!draft || typeof draft !== 'object' || Array.isArray(draft)) throw new Error('plain'); } catch { draft = { value: String(rec.value ?? '') }; plain = true; }
    const optional = Object.entries(CONTENT_OPTIONAL[rec.key] || {}).filter(([k]) => !(k in draft));
    const renderBody = () => h`<div class="adm-ce" id="adm-ce">
      ${meta.desc ? h`<p class="adm-help">${meta.desc}</p>` : ''}
      <div class="adm-form">${Object.entries(draft).map(([k, v]) => ceNode(v, [k], plain ? 'body' : k))}</div>
      ${optional.length && !plain ? h`<div class="adm-addfields"><span class="adm-label">Add a section</span>${optional.filter(([k]) => !(k in draft)).map(([k]) => h`<button type="button" class="adm-btn sm" data-ce="addfield" data-key="${k}">${ic('plus')}${humanize(k)}</button>`)}</div>` : ''}
    </div>`;
    let body;
    const rerender = () => { const keep = body.scrollTop; mount(body, renderBody()); body.scrollTop = keep; markDirty(); };
    openDrawer({
      key: `site_content/${id}`, wide: true, noun: 'content block', eyebrow: 'Site content', title: meta.label,
      badges: meta.policy ? (draft.approved ? h`<span class="adm-pill st-completed">Approved</span>` : h`<span class="adm-pill st-new">Draft</span>`) : '',
      body: renderBody(), snapshot: () => JSON.stringify(draft), viewUrl: { policy_privacy: '/privacy-policy', policy_terms: '/terms', policy_refund: '/refund-policy', contact: '/contact', about: '/about', hero: '/', stats: '/', why_choose: '/', process: '/about', visa_sources: '/visa-services' }[rec.key] || null,
      onMount: (b) => {
        body = b;
        b.addEventListener('input', (e) => {
          const t = e.target.closest('[data-path]');
          if (!t || t.dataset.ce || t.dataset.type === 'bool') return;
          const path = JSON.parse(t.dataset.path);
          setAt(draft, path, t.dataset.type === 'number' ? (t.value === '' ? 0 : Number(t.value)) : t.value);
        });
        b.addEventListener('change', (e) => { const t = e.target; if (t.dataset?.type === 'bool') { setAt(draft, JSON.parse(t.dataset.path), t.checked); markDirty(); } });
        b.addEventListener('click', (e) => {
          const t = e.target.closest('[data-ce]');
          if (!t) return;
          const act = t.dataset.ce;
          if (act === 'addfield') { draft[t.dataset.key] = JSON.parse(JSON.stringify(CONTENT_OPTIONAL[rec.key][t.dataset.key])); optional.splice(0, optional.length, ...optional.filter(([k]) => k !== t.dataset.key)); rerender(); return; }
          const arr = getAt(draft, JSON.parse(t.dataset.path));
          const i = Number(t.dataset.index);
          if (act === 'add') arr.push(arr.length ? blankLike(arr[0]) : '');
          else if (act === 'remove') arr.splice(i, 1);
          else if (act === 'up' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
          else if (act === 'down' && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
          rerender();
        });
      },
      save: async () => {
        const value = plain ? draft.value : { ...draft };
        if (!plain && meta.policy) value.updated = todayIso();
        const saved = await api(`site_content/${rec.id}`, { method: 'PUT', body: JSON.stringify({ key: rec.key, value: plain ? value : JSON.stringify(value) }) });
        putLocal('site_content', saved);
        drawer.dirty = false;
        if (state.view === 'site_content') renderContentList(state.renderToken);
        toast(`${meta.label} saved. It is live on the website.`);
        return true;
      }
    });
  }

  /* ------------------------------------------------------------------ view events */
  view.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'open') goto(`#/${state.view}/${t.dataset.id}`);
    else if (act === 'toggle') toggleField(state.view, t.dataset.id, t.dataset.field);
    else if (act === 'filter') { state.filters[state.view] = t.dataset.value; $$('[data-act="filter"]', view).forEach((b) => b.setAttribute('aria-pressed', String(b === t))); paintTable(state.view); }
    else if (act === 'status-filter') { state.enqStatus = t.dataset.value; paintEnquiries(); }
    else if (act === 'mode') { state.enqMode = t.dataset.mode; try { localStorage.setItem('adm-enq-mode', state.enqMode); } catch { /* ignore */ } paintEnquiries(); }
    else if (act === 'sort') { const s = state.sorts[state.view]; state.sorts[state.view] = { key: t.dataset.key, dir: s.key === t.dataset.key && s.dir === 'asc' ? 'desc' : 'asc' }; paintTable(state.view); }
    else if (act === 'retry') renderView();
  });
  view.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches?.('[data-act="open"]')) { e.preventDefault(); e.target.click(); }
  });
  view.addEventListener('change', (e) => { if (e.target.matches('[data-move]')) changeStatus(e.target.dataset.move, e.target.value); });
  actionsEl.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-act="refresh"]')) return;
    const key = state.view;
    try { await load(key, true); if (key === 'inquiries') updateBadge(); paintCurrent(); toast('Up to date'); } catch (err) { toast(err.message, { kind: 'error' }); }
  });

  // Drag and drop between board columns
  view.addEventListener('dragstart', (e) => { const card = e.target.closest?.('.adm-kcard'); if (!card) return; e.dataTransfer.setData('text/plain', card.dataset.id); e.dataTransfer.effectAllowed = 'move'; card.classList.add('is-dragging'); });
  view.addEventListener('dragend', (e) => { e.target.closest?.('.adm-kcard')?.classList.remove('is-dragging'); $$('.adm-col.is-over', view).forEach((c) => c.classList.remove('is-over')); });
  view.addEventListener('dragover', (e) => { const col = e.target.closest?.('.adm-col'); if (!col) return; e.preventDefault(); $$('.adm-col.is-over', view).forEach((c) => c !== col && c.classList.remove('is-over')); col.classList.add('is-over'); });
  view.addEventListener('drop', (e) => { const col = e.target.closest?.('.adm-col'); if (!col) return; e.preventDefault(); col.classList.remove('is-over'); const id = e.dataTransfer.getData('text/plain'); if (id) changeStatus(id, col.dataset.status); });

  // Search box and shortcuts
  searchEl.addEventListener('input', () => {
    state.q[state.view] = searchEl.value;
    state.onSearch?.();
  });
  searchEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && state.view === 'overview' && searchEl.value.trim()) { state.q.inquiries = searchEl.value.trim(); goto('#/inquiries'); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !drawer.open) { e.preventDefault(); searchEl.focus(); }
    else if (e.key === 'Escape' && sidebar.classList.contains('is-open')) setMenu(false);
  });
  document.addEventListener('error', (e) => { if (e.target?.tagName === 'IMG') e.target.classList.add('is-broken'); }, true);

  /* ------------------------------------------------------------------ live updates */
  // New enquiries are checked for once a minute while the tab is visible.
  let knownIds = null;
  async function pollEnquiries() {
    if (document.visibilityState !== 'visible' || drawer.open) return;
    try {
      const rows = await api('inquiries');
      const ids = new Set(rows.map((r) => r.id));
      if (knownIds) {
        const fresh = rows.filter((r) => !knownIds.has(r.id));
        if (fresh.length) {
          state.tables.inquiries = rows;
          toast(`${fresh.length} new enquir${fresh.length === 1 ? 'y' : 'ies'} received`, { action: { label: 'View', run: () => goto('#/inquiries') }, ms: 9000 });
          if (state.view === 'inquiries') paintEnquiries(); else if (state.view === 'overview') renderOverview(state.renderToken);
        }
      }
      knownIds = ids;
      state.tables.inquiries = rows;
      updateBadge();
    } catch { /* the next poll will retry */ }
  }

  /* ------------------------------------------------------------------ start */
  async function init() {
    buildNav();
    try {
      const session = await api('session');
      state.session = session.user;
      $('#admin-status').textContent = session.user.email;
      $('#adm-avatar').textContent = session.user.email.slice(0, 1).toUpperCase();
    } catch { return; }
    load('inquiries').then((rows) => { knownIds = new Set(rows.map((r) => r.id)); updateBadge(); }).catch(() => {});
    if (!location.hash) location.replace('#/overview');
    await hashChanged();
    setInterval(pollEnquiries, 60000);
  }
  init();
})();
