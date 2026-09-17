const state = {
  destinations: [],
  packages: [],
  services: [],
  testimonials: [],
  gallery: [],
  content: {}
};

const currency = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  maximumFractionDigits: 0
});

const fallbackImage = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80';

function bindImageFallbacks() {
  document.querySelectorAll('img').forEach((image) => {
    const useFallback = () => {
      if (image.src !== fallbackImage) image.src = fallbackImage;
    };
    image.addEventListener('error', useFallback, { once: true });
    if (image.complete && image.naturalWidth === 0) useFallback();
  });
}

function bindRevealMotion() {
  const sections = document.querySelectorAll('main > section:not(.hero-section)');
  if (!sections.length || !('IntersectionObserver' in window)) return;
  sections.forEach((section) => section.classList.add('reveal-ready'));
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.14 });
  sections.forEach((section) => observer.observe(section));
}

function toCurrency(value) {
  const amount = Number(value || 0);
  return currency.format(amount);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || 'Request failed');
  }
  return res.json();
}

async function loadData() {
  const responses = await Promise.allSettled([
    fetchJson('/api/content'),
    fetchJson('/api/destinations'),
    fetchJson('/api/packages'),
    fetchJson('/api/services'),
    fetchJson('/api/testimonials'),
    fetchJson('/api/gallery')
  ]);

  const failedRequests = responses.filter((response) => response.status === 'rejected');
  const values = responses.map((response) => response.status === 'fulfilled' ? response.value : []);
  const [contentData, destinations, packages, services, testimonials, gallery] = values;
  state.content = Object.fromEntries((contentData || []).map((item) => [item.key, item.value]));
  state.destinations = destinations || [];
  state.packages = packages || [];
  state.services = services || [];
  state.testimonials = testimonials || [];
  state.gallery = gallery || [];

  if (failedRequests.length) {
    const message = document.createElement('p');
    message.className = 'site-data-warning';
    message.textContent = 'Some travel data is temporarily unavailable. Please refresh or contact us directly.';
    document.querySelector('main')?.prepend(message);
    console.error('Data requests failed:', failedRequests.map((response) => response.reason));
  }
}

function applyContent() {
  const hero = state.content.hero || {};
  const about = state.content.about || {};
  const contact = state.content.contact || {};

  const heroTitle = document.querySelector('#hero-title');
  const heroSubtitle = document.querySelector('#hero-subtitle');
  const heroImage = document.querySelector('#hero-image');
  const aboutHeading = document.querySelector('#about-heading');
  const aboutBody = document.querySelector('#about-body');

  if (heroTitle) heroTitle.textContent = hero.title || 'From Uganda to the World';
  if (heroSubtitle) heroSubtitle.textContent = hero.subtitle || '';
  if (heroImage) heroImage.src = hero.image || fallbackImage;
  if (aboutHeading) aboutHeading.textContent = about.heading || 'A Ugandan agency with a global map';
  if (aboutBody) aboutBody.textContent = about.body || '';

  const phone = document.querySelector('#contact-phone');
  const email = document.querySelector('#contact-email');
  const address = document.querySelector('#contact-address');
  if (phone) phone.textContent = contact.phone || '';
  if (email) email.textContent = contact.email || '';
  if (address) address.textContent = contact.address || '';
}

function renderFeaturedDestinations() {
  const list = document.querySelector('#featured-destinations');
  if (!list) return;
  const items = (state.destinations || []).slice(0, 3);
  list.innerHTML = items.map((item) => `
    <article class="destination-card">
      <div class="card-img-wrapper">
        <img src="${item.image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80'}" alt="${item.name}" />
      </div>
      <div class="content">
        <div class="destination-meta">
          <span class="caption-num text-accent">${item.country || 'Uganda'}</span>
          <span class="caption-num">From ${toCurrency(item.price_from || 0)}</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.tagline || ''}</p>
      </div>
    </article>
  `).join('');
}

function renderFeaturedPackages() {
  const list = document.querySelector('#featured-packages');
  if (!list) return;
  const items = (state.packages || []).slice(0, 4);
  list.innerHTML = items.map((item) => `
    <article class="package-card">
      <div class="card-img-wrapper">
        <img src="${item.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80'}" alt="${item.title}" />
      </div>
      <div class="content">
        <span class="caption-num text-accent">${item.destination || 'Adventure'}</span>
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
        <div class="price-row">
          <span>${item.days || 0} days</span>
          <button class="button primary" data-add-cart="${item.id}">Book now</button>
        </div>
        <strong>${toCurrency(item.price || 0)}</strong>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-add-cart]').forEach((button) => {
    button.addEventListener('click', () => addToCart(Number(button.dataset.addCart)));
  });
}

function renderServices() {
  const list = document.querySelector('#services-list');
  if (!list) return;
  list.innerHTML = (state.services || []).map((service) => `
    <article class="service-card">
      <span class="service-icon">${service.icon || '✦'}</span>
      <h3>${service.title}</h3>
      <p>${service.summary || service.description || ''}</p>
    </article>
  `).join('');
}

function renderGallery() {
  const list = document.querySelector('#gallery-grid');
  if (!list) return;
  list.innerHTML = (state.gallery || []).slice(0, 6).map((item) => `
    <figure class="gallery-item">
      <img src="${item.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80'}" alt="${item.title || 'Gallery'}" />
      <figcaption><strong>${item.title || 'Traveller shot'}</strong><span>${item.category || 'Altis field note'} · On the road</span></figcaption>
    </figure>
  `).join('');
}

function renderTestimonials() {
  const list = document.querySelector('#testimonials-list');
  if (!list) return;
  list.innerHTML = (state.testimonials || []).slice(0, 2).map((item) => `
    <article class="testimonial">
      <span class="quote-mark">“</span>
      <p>${item.quote || ''}</p>
      <footer>
        <div>
          <strong>${item.name || 'Traveller'}</strong><br />
          <span>${item.location || ''}</span>
        </div>
        <div class="star-row">${'★'.repeat(item.rating || 5)}</div>
      </footer>
    </article>
  `).join('');
}

function addToCart(packageId) {
  const pkg = (state.packages || []).find((item) => item.id === Number(packageId));
  if (!pkg) return;
  const current = JSON.parse(localStorage.getItem('altis-cart') || '[]');
  const found = current.find((item) => item.id === Number(packageId));
  if (found) {
    found.quantity += 1;
  } else {
    current.push({ id: Number(packageId), quantity: 1, title: pkg.title, price: Number(pkg.price || 0) });
  }
  localStorage.setItem('altis-cart', JSON.stringify(current));
  renderCart();
  openCart();
}

function renderCart() {
  const cartPanel = document.querySelector('#cart-modal');
  if (!cartPanel) return;
  const items = JSON.parse(localStorage.getItem('altis-cart') || '[]');
  if (!items.length) {
    document.querySelectorAll('.cart-toggle').forEach(btn => btn.textContent = `Cart (0)`);
    cartPanel.innerHTML = `
      <div class="cart-shell">
        <div class="cart-header"><h3>Cart</h3><button class="cart-close" data-close-cart>Close</button></div>
        <p>Your cart is empty.</p>
      </div>
    `;
    return;
  }

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const count = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  document.querySelectorAll('.cart-toggle').forEach(btn => btn.textContent = `Cart (${count})`);
  cartPanel.innerHTML = `
    <div class="cart-shell">
      <div class="cart-header"><h3>Cart</h3><button class="cart-close" data-close-cart>Close</button></div>
      <div class="cart-items">
        ${items.map((item) => `
          <div class="cart-item">
            <div>
              <strong>${item.title}</strong>
              <div>${item.quantity} x ${toCurrency(item.price || 0)}</div>
            </div>
            <button data-remove-cart="${item.id}" class="mini-button">Remove</button>
          </div>
        `).join('')}
      </div>
      <div class="cart-total">Total: <strong>${toCurrency(total)}</strong></div>
      <a href="/inquiry.html" class="button primary full-width">Reserve this trip</a>
    </div>
  `;

  cartPanel.querySelectorAll('[data-close-cart]').forEach((btn) => btn.addEventListener('click', closeCart));
  cartPanel.querySelectorAll('[data-remove-cart]').forEach((btn) => {
    btn.addEventListener('click', () => removeFromCart(Number(btn.dataset.removeCart)));
  });
}

function openCart() {
  const cartPanel = document.querySelector('#cart-modal');
  if (!cartPanel) return;
  cartPanel.classList.remove('hidden');
}

function closeCart() {
  const cartPanel = document.querySelector('#cart-modal');
  if (!cartPanel) return;
  cartPanel.classList.add('hidden');
}

function removeFromCart(packageId) {
  const items = JSON.parse(localStorage.getItem('altis-cart') || '[]');
  const filtered = items.filter((item) => item.id !== Number(packageId));
  localStorage.setItem('altis-cart', JSON.stringify(filtered));
  renderCart();
}

function bindCartButton() {
  const button = document.querySelector('.cart-toggle');
  if (!button) return;
  button.addEventListener('click', () => {
    renderCart();
    openCart();
  });
}

function bindInquiryForm(selector = '#homepage-inquiry-form') {
  const form = document.querySelector(selector);
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    await fetchJson('/api/inquiries', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    alert('Your inquiry has been sent successfully.');
  });
}

function renderDestinationsPage() {
  const list = document.querySelector('#destinations-page-list');
  if (!list) return;

  const query = (document.querySelector('#destination-search')?.value || '').toLowerCase();
  const regionSelect = document.querySelector('#destination-region');
  const region = regionSelect ? regionSelect.value : (document.querySelector('.region-pill.active')?.dataset.region || 'all');

  const filtered = (state.destinations || []).filter((item) => {
    const matchesSearch = !query || `${item.name} ${item.country} ${item.tagline}`.toLowerCase().includes(query);
    const matchesRegion = region === 'all' || (item.region || '').toLowerCase() === region;
    return matchesSearch && matchesRegion;
  });

  list.innerHTML = (filtered.length ? filtered : state.destinations || []).map((item) => `
    <article class="destination-card">
      <div class="card-img-wrapper">
        <img src="${item.image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80'}" alt="${item.name}" />
      </div>
      <div class="content">
        <div class="destination-meta">
          <span class="caption-num text-accent">${item.country || 'Uganda'}</span>
          <span class="caption-num">From ${toCurrency(item.price_from || 0)}</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.tagline || ''}</p>
      </div>
    </article>
  `).join('');
}

function renderStorePage() {
  const list = document.querySelector('#store-page-list');
  if (!list) return;
  list.innerHTML = (state.packages || []).map((item) => `
    <article class="package-card">
      <div class="card-img-wrapper">
        <img src="${item.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80'}" alt="${item.title}" />
      </div>
      <div class="content">
        <span class="caption-num text-accent">${item.destination || 'Adventure'}</span>
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
        <div class="price-row">
          <span>${item.days || 0} days</span>
          <button class="button primary" data-add-cart="${item.id}">Add to cart</button>
        </div>
        <strong>${toCurrency(item.price || 0)}</strong>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-add-cart]').forEach((button) => {
    button.addEventListener('click', () => addToCart(Number(button.dataset.addCart)));
  });
}

async function setupAdminLogin() {
  const form = document.querySelector('#admin-login-form');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await fetchJson('/api/admin/login', { method: 'POST', body: JSON.stringify(payload) });
      window.location.href = '/admin/index.html';
    } catch (error) {
      alert(error.message || 'Login failed');
    }
  });
}

const adminTableConfig = {
  destinations: { label: 'Destinations', singular: 'Destination', fields: ['name', 'country', 'region', 'tagline', 'description', 'image', 'price_from', 'featured'] },
  packages: { label: 'Packages', singular: 'Package', fields: ['title', 'destination', 'days', 'price', 'image', 'description', 'featured'] },
  services: { label: 'Services', singular: 'Service', fields: ['title', 'summary', 'description', 'icon', 'image'] },
  testimonials: { label: 'Testimonials', singular: 'Testimonial', fields: ['name', 'location', 'quote', 'trip', 'rating'] },
  gallery: { label: 'Gallery', singular: 'Gallery item', fields: ['title', 'image', 'category'] },
  site_content: { label: 'Site content', singular: 'Site content', fields: ['key', 'value'] },
  inquiries: { label: 'Inquiries', singular: 'Inquiry', fields: ['name', 'email', 'phone', 'interest', 'message', 'status'] }
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function adminFieldMarkup(field, value = '') {
  const multiline = ['description', 'quote', 'message', 'value'].includes(field);
  const type = ['price', 'price_from', 'days', 'rating'].includes(field) ? 'number' : field === 'image' ? 'url' : 'text';
  const label = field.replaceAll('_', ' ');
  const safeValue = escapeHtml(typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
  return `<label>${label}${multiline ? `<textarea name="${field}" rows="3">${safeValue}</textarea>` : `<input name="${field}" type="${type}" value="${safeValue}" ${field === 'key' ? 'required' : ''} />`}</label>`;
}

function adminRecordSummary(tableName, record) {
  const config = adminTableConfig[tableName];
  const fields = config.fields.filter((field) => field !== 'description' && field !== 'value');
  return fields.slice(0, 3).map((field) => `<span><b>${escapeHtml(field.replaceAll('_', ' '))}</b>${escapeHtml(record[field] || '—')}</span>`).join('');
}

async function renderAdminTable(tableName, selectedRecord = null) {
  const content = document.querySelector('#admin-content');
  const config = adminTableConfig[tableName];
  if (!content || !config) return;
  content.innerHTML = '<p class="admin-loading">Loading records…</p>';
  const records = await fetchJson(tableName === 'site_content' ? '/api/content' : `/api/admin/${tableName}`);
  const editing = selectedRecord || {};
  content.innerHTML = `
    <section class="admin-panel">
      <div class="admin-panel-heading"><div><p class="caption-num text-accent">${records.length} records</p><h2>${config.label}</h2></div><button class="button primary" type="button" data-admin-new>New ${config.singular}</button></div>
      <form class="admin-editor ${selectedRecord ? '' : 'hidden'}" data-admin-form>
        <input type="hidden" name="id" value="${escapeHtml(editing.id || '')}" />
        <div class="admin-fields">${config.fields.map((field) => adminFieldMarkup(field, editing[field])).join('')}</div>
        <div class="admin-form-actions"><button class="button primary" type="submit">${selectedRecord ? 'Save changes' : 'Create record'}</button><button class="button secondary" type="button" data-admin-cancel>Cancel</button></div>
      </form>
      <div class="admin-records">${records.length ? records.map((record) => `<article class="admin-record"><div><strong>#${record.id}</strong><div class="admin-record-summary">${adminRecordSummary(tableName, record)}</div></div><div class="admin-record-actions"><button class="mini-button" type="button" data-admin-edit="${record.id}">Edit</button><button class="mini-button danger" type="button" data-admin-delete="${record.id}">Delete</button></div></article>`).join('') : '<p class="lede">No records found.</p>'}</div>
    </section>`;

  content.querySelector('[data-admin-new]').addEventListener('click', () => renderAdminTable(tableName, {}));
  content.querySelector('[data-admin-cancel]').addEventListener('click', () => renderAdminTable(tableName));
  content.querySelectorAll('[data-admin-edit]').forEach((button) => button.addEventListener('click', () => {
    const record = records.find((item) => Number(item.id) === Number(button.dataset.adminEdit));
    renderAdminTable(tableName, record);
  }));
  content.querySelectorAll('[data-admin-delete]').forEach((button) => button.addEventListener('click', async () => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    await fetchJson(`/api/admin/${tableName}/${button.dataset.adminDelete}`, { method: 'DELETE' });
    await renderAdminTable(tableName);
  }));
  const form = content.querySelector('[data-admin-form]');
  if (form) form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());
    const id = formData.id;
    delete formData.id;
    ['price', 'price_from', 'days', 'rating', 'featured'].forEach((field) => {
      if (field in formData && formData[field] !== '') formData[field] = Number(formData[field]);
    });
    if (tableName === 'site_content') {
      try { formData.value = JSON.stringify(JSON.parse(formData.value)); } catch { /* Keep plain text content valid. */ }
    }
    await fetchJson(`/api/admin/${tableName}${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(formData) });
    await renderAdminTable(tableName);
  });
}

async function setupAdminDashboard() {
  try {
    const session = await fetchJson('/api/admin/session');
    const status = document.querySelector('#admin-status');
    const content = document.querySelector('#admin-content');
    if (!session || !session.user) {
      window.location.href = '/admin/login.html';
      return;
    }
    if (status) status.textContent = `Signed in as ${session.user.email}`;
    const tabs = document.querySelectorAll('[data-admin-tab]');
    const selectTab = async (tableName) => {
      tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.adminTab === tableName));
      await renderAdminTable(tableName);
    };
    tabs.forEach((tab) => tab.addEventListener('click', () => selectTab(tab.dataset.adminTab)));
    await selectTab('destinations');
  } catch (error) {
    console.error('Admin dashboard failed:', error);
    window.location.href = '/admin/login.html';
  }

  const logoutButton = document.querySelector('#admin-logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await fetchJson('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login.html';
    });
  }
}

function bindMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.main-nav');
  const overlay = document.querySelector('#nav-overlay');
  if (!toggle || !nav) return;

  function openMenu() {
    nav.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    toggle.textContent = '✕';
    toggle.setAttribute('aria-label', 'Close Menu');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    toggle.textContent = '☰';
    toggle.setAttribute('aria-label', 'Open Menu');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    nav.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  if (overlay) overlay.addEventListener('click', closeMenu);

  // Close button inside the drawer
  const closeBtn = nav.querySelector('.nav-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  // Close when a nav link is tapped
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

async function setupHomePage() {
  await loadData();
  applyContent();
  renderFeaturedDestinations();
  renderFeaturedPackages();
  renderServices();
  renderGallery();
  renderTestimonials();
  bindCartButton();
  bindMobileMenu();
  renderCart();
  bindInquiryForm('#homepage-inquiry-form');
}

async function setupPage() {
  bindCartButton();
  bindMobileMenu();
  renderCart();

  const search = document.querySelector('#destination-search');
  if (search) {
    search.addEventListener('input', renderDestinationsPage);
  }
  const region = document.querySelector('#destination-region');
  if (region) {
    region.addEventListener('change', renderDestinationsPage);
  }

  document.querySelectorAll('.region-pill').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.region-pill').forEach((item) => item.classList.toggle('active', item === button));
      renderDestinationsPage();
    });
  });

  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  if (document.querySelector('#homepage-inquiry-form')) {
    bindInquiryForm('#homepage-inquiry-form');
  }
  if (document.querySelector('#inquiry-page-form')) {
    bindInquiryForm('#inquiry-page-form');
  }
  if (document.querySelector('#admin-login-form')) {
    setupAdminLogin();
  }
  if (document.querySelector('#admin-status')) {
    await loadData();
    await setupAdminDashboard();
  }
  if (document.querySelector('#destinations-page-list')) {
    await loadData();
    renderDestinationsPage();
  }
  if (document.querySelector('#store-page-list')) {
    await loadData();
    renderStorePage();
  }
  if (document.querySelector('#featured-destinations')) {
    await loadData();
    applyContent();
    renderFeaturedDestinations();
    renderFeaturedPackages();
    renderServices();
    renderGallery();
    renderTestimonials();
  }

  bindImageFallbacks();
  bindRevealMotion();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPage);
} else {
  setupPage();
}
