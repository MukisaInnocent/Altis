// Public site behaviour. Pages are rendered on the server (src/site/); this script adds filters,
// enquiry form submission, the "My Trip" list, the trip planner, WhatsApp click tracking and the
// analytics consent banner.

const config = readConfig();
const fallbackImage = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80';
const TRIP_KEY = 'altis-trip';
const LEGACY_CART_KEY = 'altis-cart';
const REQUESTS_KEY = 'altis-requests';
const CONSENT_KEY = 'altis-consent';

function readConfig() {
  try {
    return JSON.parse(document.getElementById('site-config')?.textContent || '{}');
  } catch {
    return {};
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

const currency = new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', currencyDisplay: 'code', maximumFractionDigits: 0 });

function toCurrency(value) {
  const amount = Number(value || 0);
  return amount > 0 ? currency.format(amount) : '';
}

// Browser storage can be unavailable (private mode, blocked cookies); the site still works.
function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage unavailable: nothing to persist. */
  }
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(payload.error || 'Request failed');
    error.status = res.status;
    error.errors = payload.errors || {};
    throw error;
  }
  return payload;
}

// ---------------------------------------------------------------------------------------------
// Analytics and consent. Nothing loads unless an ID is configured and the visitor accepts.
// Events never include names, contact details or what the customer typed.
// ---------------------------------------------------------------------------------------------

const trackingConfigured = Boolean(config.gaId || config.pixelId);
let trackingActive = false;

function consentChoice() {
  return readStore(CONSENT_KEY, null);
}

function loadScript(src) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function startTracking() {
  if (trackingActive || !trackingConfigured) return;
  trackingActive = true;

  if (config.gaId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', config.gaId);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.gaId)}`);
  }

  if (config.pixelId) {
    /* Standard Meta Pixel bootstrap, kept small. */
    const fbq = function fbq() { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = window.fbq || fbq;
    window._fbq = window._fbq || window.fbq;
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', config.pixelId);
    window.fbq('track', 'PageView');
  }

  if (config.item) track('view_item', { item_id: String(config.item.id), item_name: config.item.title }, ['ViewContent', { content_ids: [String(config.item.id)], content_type: 'product', content_name: config.item.title }]);
}

function track(event, params = {}, metaEvent = null) {
  if (!trackingActive) return;
  if (config.gaId && window.gtag) window.gtag('event', event, { page_type: config.page, ...params });
  if (config.pixelId && window.fbq && metaEvent) window.fbq('track', metaEvent[0], metaEvent[1] || {});
}

function bindConsent() {
  if (!trackingConfigured) return;
  const banner = document.querySelector('[data-consent-banner]');
  const choice = consentChoice();
  if (choice === 'granted') startTracking();
  if (!choice && banner) banner.hidden = false;

  banner?.querySelectorAll('[data-consent]').forEach((button) => button.addEventListener('click', () => {
    const value = button.dataset.consent;
    const previous = consentChoice();
    writeStore(CONSENT_KEY, value);
    banner.hidden = true;
    if (value === 'granted') startTracking();
    // Scripts that already loaded cannot be unloaded; a reload stops them.
    else if (previous === 'granted') window.location.reload();
  }));
  document.querySelectorAll('[data-consent-open]').forEach((button) => button.addEventListener('click', () => {
    if (banner) banner.hidden = false;
  }));
}

function bindWhatsappTracking() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-whatsapp]');
    if (link) track('whatsapp_click', { link_location: link.dataset.whatsapp }, ['Contact', { content_category: 'whatsapp' }]);
  });
}

// ---------------------------------------------------------------------------------------------
// My Trip: packages saved on this device, and requests sent from it.
// ---------------------------------------------------------------------------------------------

function migrateLegacyCart() {
  const legacy = readStore(LEGACY_CART_KEY, null);
  if (!Array.isArray(legacy)) return;
  const trip = readStore(TRIP_KEY, []);
  legacy.forEach((item) => {
    if (!trip.some((saved) => Number(saved.id) === Number(item.id))) trip.push({ id: Number(item.id), title: item.title, price: Number(item.price || 0) });
  });
  writeStore(TRIP_KEY, trip);
  try {
    localStorage.removeItem(LEGACY_CART_KEY);
  } catch {
    /* ignore */
  }
}

function savedTrip() {
  const items = readStore(TRIP_KEY, []);
  return Array.isArray(items) ? items : [];
}

function sentRequests() {
  const items = readStore(REQUESTS_KEY, []);
  return Array.isArray(items) ? items : [];
}

function updateTripCount() {
  const count = savedTrip().length;
  document.querySelectorAll('[data-trip-count]').forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });
  document.querySelectorAll('.trip-toggle').forEach((link) => link.setAttribute('aria-label', `My Trip, ${count} saved`));
}

function refreshSaveButtons() {
  const saved = new Set(savedTrip().map((item) => Number(item.id)));
  document.querySelectorAll('[data-save-trip]').forEach((button) => {
    const isSaved = saved.has(Number(button.dataset.saveTrip));
    button.textContent = isSaved ? 'Saved to My Trip ✓' : 'Save to My Trip';
    button.setAttribute('aria-pressed', String(isSaved));
  });
}

function toggleSaved(button) {
  const id = Number(button.dataset.saveTrip);
  const trip = savedTrip();
  const index = trip.findIndex((item) => Number(item.id) === id);
  if (index >= 0) trip.splice(index, 1);
  else trip.push({ id, title: button.dataset.title, price: Number(button.dataset.price || 0), path: button.dataset.path });
  writeStore(TRIP_KEY, trip);
  updateTripCount();
  refreshSaveButtons();
}

function bindSaveButtons() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-save-trip]');
    if (button) toggleSaved(button);
  });
  refreshSaveButtons();
}

function renderMyTrip() {
  const list = document.querySelector('[data-saved-trip-list]');
  if (list) {
    const trip = savedTrip();
    list.innerHTML = trip.length
      ? `<ul class="trip-list">${trip.map((item) => `
          <li class="trip-item">
            <div><a href="${escapeHtml(item.path || `/request-quote?package=${item.id}`)}"><strong>${escapeHtml(item.title)}</strong></a>${toCurrency(item.price) ? `<span class="muted">From ${toCurrency(item.price)}*</span>` : ''}</div>
            <button class="mini-button" type="button" data-remove-trip="${Number(item.id)}">Remove</button>
          </li>`).join('')}</ul>
          <a class="button primary" href="/request-quote">Request a Quote for ${trip.length === 1 ? 'this trip' : 'these trips'}</a>
          <p class="price-note">* Indicative prices, confirmed in your quotation. Saving a package does not reserve it.</p>`
      : '<div class="empty-state"><p>You have not saved any packages yet.</p><a class="button primary" href="/packages">Explore Travel Packages</a></div>';
    list.querySelectorAll('[data-remove-trip]').forEach((button) => button.addEventListener('click', () => {
      writeStore(TRIP_KEY, savedTrip().filter((item) => Number(item.id) !== Number(button.dataset.removeTrip)));
      updateTripCount();
      renderMyTrip();
    }));
  }

  const requests = document.querySelector('[data-request-list]');
  if (requests) {
    const items = sentRequests();
    requests.innerHTML = items.length
      ? `<ul class="trip-list">${items.map((item) => `
          <li class="trip-item">
            <div><strong>${escapeHtml(item.reference)}</strong><span class="muted">${escapeHtml(item.label || 'Request')} · sent ${escapeHtml(item.date || '')}</span></div>
            <button class="mini-button neutral" type="button" data-check-reference="${escapeHtml(item.reference)}">Check status</button>
          </li>`).join('')}</ul>`
      : '<p class="muted">No requests have been sent from this device yet.</p>';
    requests.querySelectorAll('[data-check-reference]').forEach((button) => button.addEventListener('click', () => {
      const input = document.querySelector('[data-status-form] [name="reference"]');
      if (input) {
        input.value = button.dataset.checkReference;
        document.querySelector('[data-status-form] [name="contact"]')?.focus();
      }
    }));
  }
}

function bindStatusForm() {
  const form = document.querySelector('[data-status-form]');
  if (!form) return;
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const params = new URLSearchParams({ reference: String(data.get('reference') || '').trim(), contact: String(data.get('contact') || '').trim() });
    status.hidden = false;
    status.className = 'form-status';
    status.textContent = 'Checking…';
    try {
      const result = await fetchJson(`/api/requests/status?${params}`);
      status.classList.add('is-success');
      status.innerHTML = `<strong>${escapeHtml(result.reference)}</strong>: ${escapeHtml(result.status)}<br><span class="muted">${escapeHtml(result.service)}, submitted ${escapeHtml(result.submitted)}</span>`;
    } catch (error) {
      status.classList.add('is-error');
      status.textContent = error.message;
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Filters for the packages and destinations lists.
// ---------------------------------------------------------------------------------------------

function bindFilters() {
  document.querySelectorAll('[data-filter-toolbar]').forEach((toolbar) => {
    const scope = toolbar.closest('section') || document;
    const items = [...scope.querySelectorAll('[data-filter-item]')];
    const empty = scope.querySelector('[data-filter-empty]');
    const search = toolbar.querySelector('[data-filter-search]');
    const selects = [...toolbar.querySelectorAll('[data-filter-select]')];
    const pills = [...toolbar.querySelectorAll('[data-filter-pill]')];
    let searchTimer = null;

    const apply = () => {
      const query = (search?.value || '').trim().toLowerCase();
      const filters = {};
      selects.forEach((select) => { filters[select.dataset.filterSelect] = select.value; });
      const activePill = pills.find((pill) => pill.classList.contains('active'));
      if (activePill) filters[activePill.dataset.filterPill] = activePill.dataset.value;

      let visible = 0;
      items.forEach((item) => {
        const matchesSearch = !query || (item.dataset.search || '').includes(query);
        const matchesFilters = Object.entries(filters).every(([key, value]) => value === 'all' || (item.dataset[key] || '').split(' ').includes(value));
        item.hidden = !(matchesSearch && matchesFilters);
        if (!item.hidden) visible += 1;
      });
      if (empty) empty.hidden = visible > 0;
    };

    search?.addEventListener('input', () => {
      apply();
      clearTimeout(searchTimer);
      const term = search.value.trim();
      if (term.length >= 3) searchTimer = setTimeout(() => track('search', { search_term: term.slice(0, 50) }, ['Search', {}]), 1200);
    });
    selects.forEach((select) => select.addEventListener('change', apply));
    pills.forEach((pill) => pill.addEventListener('click', () => {
      pills.forEach((other) => {
        other.classList.toggle('active', other === pill);
        other.setAttribute('aria-pressed', String(other === pill));
      });
      apply();
    }));
    apply();
  });
}

// ---------------------------------------------------------------------------------------------
// Enquiry forms
// ---------------------------------------------------------------------------------------------

function todayLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function serializeForm(form) {
  const payload = {};
  new FormData(form).forEach((value, key) => {
    payload[key] = key in payload ? `${payload[key]}, ${value}` : value;
  });
  return payload;
}

function showFieldErrors(form, errors = {}) {
  form.querySelectorAll('[data-error-for]').forEach((slot) => { slot.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
  let first = null;
  Object.entries(errors).forEach(([name, message]) => {
    const slot = form.querySelector(`[data-error-for="${name}"]`);
    if (slot) slot.textContent = message;
    const input = form.querySelector(`[name="${name}"]`);
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      first = first || input;
    }
  });
  first?.focus();
}

function rememberRequest(result, form) {
  const items = sentRequests();
  const label = form.querySelector('.form-heading')?.textContent?.trim() || form.querySelector('[type="submit"]')?.textContent?.trim();
  items.unshift({ reference: result.reference, label, date: todayLocal() });
  writeStore(REQUESTS_KEY, items.slice(0, 20));
}

function confirmationMarkup(result) {
  const whatsapp = config.whatsapp
    ? `<a class="button secondary whatsapp-outline" href="https://wa.me/${encodeURIComponent(config.whatsapp)}?text=${encodeURIComponent(`Hello Altis Voyage, I just sent request ${result.reference}.`)}" target="_blank" rel="noopener" data-whatsapp="form-confirmation">Follow up on WhatsApp</a>`
    : '';
  return `
    <div class="confirmation-panel" tabindex="-1">
      <p class="caption-num text-accent">Request received</p>
      <h2 class="font-display">Thank you, we have your request</h2>
      <p class="reference-line">Your reference: <strong>${escapeHtml(result.reference)}</strong></p>
      <p>This is not yet a confirmed booking. A consultant will review your request and contact you within one working day with options and a quotation.</p>
      <div class="inline-actions">${whatsapp}<a class="button secondary" href="/my-trip">View My Trip Requests</a></div>
    </div>`;
}

function bindEnquiryForms() {
  document.querySelectorAll('[data-min-today]').forEach((input) => { input.min = todayLocal(); });

  document.querySelectorAll('form[data-enquiry-form]').forEach((form) => {
    const service = form.dataset.enquiryForm;
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('[type="submit"]');
    let started = false;

    form.addEventListener('focusin', () => {
      if (started) return;
      started = true;
      track('form_start', { form_type: service });
    });

    const returnDate = form.querySelector('[data-return-date]');
    form.querySelectorAll('[name="trip_type"]').forEach((radio) => radio.addEventListener('change', () => {
      if (!returnDate) return;
      const oneWay = form.querySelector('[name="trip_type"]:checked')?.value === 'one-way';
      returnDate.disabled = oneWay;
      returnDate.closest('.field').classList.toggle('is-disabled', oneWay);
      if (oneWay) returnDate.value = '';
    }));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      showFieldErrors(form);
      status.hidden = true;
      submit.disabled = true;
      const originalLabel = submit.textContent;
      submit.textContent = 'Sending…';

      try {
        const result = await fetchJson('/api/inquiries', { method: 'POST', body: JSON.stringify(serializeForm(form)) });
        rememberRequest(result, form);
        track('generate_lead', { form_type: service }, ['Lead', { content_category: service }]);
        const panel = document.createElement('div');
        panel.innerHTML = confirmationMarkup(result);
        form.replaceWith(panel.firstElementChild);
        document.querySelector('.confirmation-panel')?.focus();
      } catch (error) {
        status.hidden = false;
        status.className = 'form-status is-error';
        status.textContent = error.status === 422
          ? 'Please check the highlighted fields.'
          : `${error.message || 'Your request could not be sent.'} You can also reach us on WhatsApp or by phone.`;
        showFieldErrors(form, error.errors);
        submit.disabled = false;
        submit.textContent = originalLabel;
      }
    });
  });

  prefillQuoteForm();
}

// The quote form lists saved packages and anything the trip planner passed along.
function prefillQuoteForm() {
  const summary = document.querySelector('[data-saved-trip-summary]');
  const packagesField = document.querySelector('[data-packages-field]');
  if (summary && packagesField) {
    const preselected = packagesField.value;
    const trip = savedTrip().filter((item) => item.title !== preselected);
    if (trip.length) {
      summary.hidden = false;
      summary.innerHTML = `<p class="field-label">Include your saved packages</p>${trip.map((item) => `
        <label class="choice"><input type="checkbox" value="${escapeHtml(item.title)}" checked data-saved-choice /> ${escapeHtml(item.title)}</label>`).join('')}`;
      const sync = () => {
        const chosen = [...summary.querySelectorAll('[data-saved-choice]:checked')].map((input) => input.value);
        packagesField.value = [preselected, ...chosen].filter(Boolean).join(', ');
      };
      summary.addEventListener('change', sync);
      sync();
    }
  }

  let planner = null;
  try {
    planner = JSON.parse(sessionStorage.getItem('altis-planner') || 'null');
  } catch {
    planner = null;
  }
  const quote = document.getElementById('quote-form');
  if (planner && quote) {
    const message = quote.querySelector('[name="message"]');
    const adults = quote.querySelector('[name="adults"]');
    const budget = quote.querySelector('[name="budget"]');
    if (message && !message.value) message.value = planner.summary;
    if (adults && planner.travellers) adults.value = planner.travellers;
    if (budget && planner.budget && !budget.value) budget.value = `${toCurrency(planner.budget)} per traveller`;
    const serviceInput = quote.querySelector('[name="service"]');
    if (serviceInput && serviceInput.value === 'general') serviceInput.value = 'planner';
    try {
      sessionStorage.removeItem('altis-planner');
    } catch {
      /* ignore */
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Trip planner: a deterministic, rule-based matcher over the packages in the database. It never
// invents trips or prices; it only ranks what is listed.
// ---------------------------------------------------------------------------------------------

const EAST_AFRICA = ['uganda', 'kenya', 'tanzania', 'rwanda', 'burundi', 'south sudan', 'ethiopia', 'democratic republic of the congo', 'drc'];
const INTEREST_KEYWORDS = {
  wildlife: ['safari', 'game drive', 'wildlife', 'lion', 'national park', 'migration', 'savanna', 'np'],
  gorillas: ['gorilla', 'chimp', 'primate', 'bwindi', 'mgahinga'],
  beach: ['beach', 'island', 'zanzibar', 'coast', 'dhow', 'ocean', 'shore'],
  city: ['city', 'dubai', 'skyline', 'shopping', 'burj', 'istanbul', 'paris', 'london'],
  culture: ['culture', 'community', 'stone town', 'walking tour', 'history', 'batwa', 'spice'],
  adventure: ['hike', 'trek', 'adventure', 'falls', 'rafting', 'expedition', 'desert'],
  relaxation: ['retreat', 'relax', 'resort', 'wind-down', 'spa', 'beachfront'],
  luxury: ['luxury', '4-star', '5-star', 'premium', 'suite', 'lodge']
};
const INTEREST_LABELS = {
  wildlife: 'wildlife', gorillas: 'gorillas', beach: 'beach', city: 'city break', culture: 'culture',
  adventure: 'adventure', relaxation: 'relaxation', luxury: 'luxury stays'
};

function packageCountry(pkg) {
  return String(pkg.destination || '').split(',').pop().trim().toLowerCase();
}

function scorePackage(pkg, criteria) {
  const text = `${pkg.title} ${pkg.destination} ${pkg.description}`.toLowerCase();
  const country = packageCountry(pkg);
  const reasons = [];
  let score = 0;
  let regionMatch = true;

  if (criteria.region.startsWith('country:')) {
    regionMatch = text.includes(criteria.region.slice(8));
  } else if (criteria.region === 'uganda') {
    regionMatch = country.includes('uganda');
  } else if (criteria.region === 'east-africa') {
    regionMatch = EAST_AFRICA.some((name) => country.includes(name));
  } else if (criteria.region === 'international') {
    regionMatch = !EAST_AFRICA.some((name) => country.includes(name));
  }
  if (criteria.region !== 'any') {
    if (regionMatch) {
      score += 30;
      reasons.push('In the region you chose');
    } else {
      score -= 40;
    }
  }

  const price = Number(pkg.price || 0);
  if (criteria.budget && price) {
    if (price <= criteria.budget) {
      score += 25;
      reasons.push('Starting price within your budget');
    } else if (price <= criteria.budget * 1.2) {
      score += 8;
      reasons.push('Starting price slightly above your budget');
    } else {
      score -= 20;
    }
  }

  const days = Number(pkg.days || 0);
  if (criteria.duration && days) {
    const difference = Math.abs(days - criteria.duration);
    if (difference === 0) {
      score += 20;
      reasons.push(`Exactly ${days} days`);
    } else if (difference <= 2) {
      score += 12;
      reasons.push(`${days} days, close to your ${criteria.duration}`);
    } else if (difference <= 4) {
      score += 4;
    } else {
      score -= 5;
    }
  }

  const matched = criteria.interests.filter((interest) => (INTEREST_KEYWORDS[interest] || []).some((word) => text.includes(word)));
  if (matched.length) {
    score += matched.length * 12;
    reasons.push(`Matches your interest in ${matched.map((interest) => INTEREST_LABELS[interest]).join(', ')}`);
  }

  return { pkg, score, reasons, regionMatch };
}

function packageUrl(pkg) {
  const slug = String(pkg.title || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return `/packages/${pkg.id}-${slug || 'package'}`;
}

function bindPlanner() {
  const form = document.querySelector('[data-planner-form]');
  const results = document.querySelector('[data-planner-results]');
  if (!form || !results) return;
  let packagesPromise = null;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const criteria = {
      region: String(data.get('region') || 'any'),
      budget: Number(data.get('budget')) || 0,
      duration: Number(data.get('duration')) || 0,
      travellers: Number(data.get('travellers')) || 1,
      month: String(data.get('travel_month') || ''),
      interests: data.getAll('interests').map(String)
    };
    results.innerHTML = '<p class="muted">Finding matches…</p>';

    try {
      packagesPromise = packagesPromise || fetchJson('/api/packages');
      const packages = await packagesPromise;
      const scored = packages.map((pkg) => scorePackage(pkg, criteria)).sort((a, b) => b.score - a.score);
      const matches = scored.filter((entry) => entry.score > 0 && entry.regionMatch).slice(0, 3);
      const regionLabel = form.querySelector('[name="region"]').selectedOptions[0]?.textContent || 'Anywhere';
      const interestLabels = [...form.querySelectorAll('[name="interests"]:checked')].map((input) => input.parentElement.textContent.trim());
      const summary = [
        'Trip planner request',
        `Destination: ${regionLabel}`,
        criteria.duration && `Length: ${criteria.duration} days`,
        criteria.month && `Travel month: ${criteria.month}`,
        `Travellers: ${criteria.travellers}`,
        criteria.budget && `Budget: ${toCurrency(criteria.budget)} per traveller`,
        interestLabels.length && `Interests: ${interestLabels.join(', ')}`,
        matches.length && `Suggested packages: ${matches.map((entry) => entry.pkg.title).join(', ')}`
      ].filter(Boolean).join('\n');
      try {
        sessionStorage.setItem('altis-planner', JSON.stringify({ summary, travellers: criteria.travellers, budget: criteria.budget }));
      } catch {
        /* ignore */
      }
      track('planner_search', { results: matches.length });

      results.innerHTML = matches.length
        ? `<h2 class="form-heading font-display">Your best matches</h2>
           ${matches.map((entry) => `
            <article class="planner-match">
              <img src="${escapeHtml(entry.pkg.image || fallbackImage)}" alt="${escapeHtml(entry.pkg.title)}" width="300" height="200" loading="lazy" />
              <div>
                <span class="caption-num text-accent">${escapeHtml(entry.pkg.destination || '')}</span>
                <h3><a href="${packageUrl(entry.pkg)}">${escapeHtml(entry.pkg.title)}</a></h3>
                <p class="muted">${entry.pkg.days ? `${Number(entry.pkg.days)} days` : ''}${toCurrency(entry.pkg.price) ? ` · From ${toCurrency(entry.pkg.price)}*` : ''}</p>
                <ul class="match-reasons">${entry.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
                <div class="card-actions">
                  <a class="button primary" href="/request-quote?package=${Number(entry.pkg.id)}">Request a Quote</a>
                  <a class="button secondary" href="${packageUrl(entry.pkg)}">View package</a>
                </div>
              </div>
            </article>`).join('')}
           <p class="price-note">* Indicative starting prices from our current packages, confirmed in your quotation.</p>`
        : `<div class="empty-state">
            <p>None of our current packages match all of that, but we can build a custom trip around your plans.</p>
            <a class="button primary" href="/request-quote">Request a custom quote</a>
          </div>`;
      results.focus?.();
    } catch {
      packagesPromise = null;
      results.innerHTML = '<div class="empty-state"><p>We could not load our packages just now. Please try again, or <a href="/request-quote">request a quote</a>.</p></div>';
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Navigation, images and motion
// ---------------------------------------------------------------------------------------------

function bindMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.main-nav');
  const overlay = document.querySelector('#nav-overlay');
  if (!toggle || !nav) return;

  function openMenu() {
    nav.classList.add('is-open');
    overlay?.classList.add('is-open');
    toggle.textContent = '✕';
    toggle.setAttribute('aria-label', 'Close menu');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    nav.querySelector('a')?.focus();
  }

  function closeMenu() {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    overlay?.classList.remove('is-open');
    toggle.textContent = '☰';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => (nav.classList.contains('is-open') ? closeMenu() : openMenu()));
  overlay?.addEventListener('click', closeMenu);
  nav.querySelector('.nav-close-btn')?.addEventListener('click', () => {
    closeMenu();
    toggle.focus();
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

function bindImageFallbacks() {
  document.addEventListener('error', (event) => {
    const target = event.target;
    if (target && target.tagName === 'IMG' && target.src !== fallbackImage) target.src = fallbackImage;
  }, true);
}

const prefersReducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cards and tiles fade up one after another as they scroll into view. The class is added by
// script, so without JavaScript everything is simply visible.
function bindRevealMotion() {
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) return;
  const groups = '.package-grid, .destination-grid, .bento, .why-grid, .offer-grid, .post-grid, .testimonial-list, .process-steps, .gallery-grid, .opportunity-list, .faq-list, .stats-grid, .contact-grid';
  const targets = [];
  document.querySelectorAll(groups).forEach((group) => {
    [...group.children].forEach((child, index) => {
      if (child.closest('.hero-section') || child.hidden) return;
      child.classList.add('reveal');
      child.style.setProperty('--i', String(Math.min(index, 8)));
      targets.push(child);
    });
  });
  document.querySelectorAll('.section-top, .inquiry-form, .article-cta, .map-embed, .detail-image').forEach((el) => {
    el.classList.add('reveal');
    targets.push(el);
  });
  const observer = new IntersectionObserver((entries, current) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      current.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  targets.forEach((el) => observer.observe(el));
}

// ---------------------------------------------------------------------------------------------
// Theme (Midnight / Daylight), header state, hover glow and counters
// ---------------------------------------------------------------------------------------------

function bindThemeToggle() {
  const root = document.documentElement;
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => button.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('altis-theme', next);
    } catch {
      /* The choice still applies for this visit. */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#f6f3ec' : '#060f1e');
    setTimeout(() => root.classList.remove('theme-switching'), 450);
  }));
}

function bindHeaderState() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

function bindCardGlow() {
  if (!window.matchMedia || !matchMedia('(hover: hover)').matches) return;
  const selector = '.package-card, .destination-card, .service-card, .offer-card, .post-card, .why-card';
  let frame = null;
  document.addEventListener('pointermove', (event) => {
    const card = event.target.closest?.(selector);
    if (!card || frame) return;
    frame = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      frame = null;
    });
  }, { passive: true });
}

function bindCounters() {
  const counters = [...document.querySelectorAll('[data-count]')];
  if (!counters.length || !('IntersectionObserver' in window) || prefersReducedMotion()) return;
  const format = new Intl.NumberFormat('en');
  const observer = new IntersectionObserver((entries, current) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      current.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${format.format(Math.round(target * eased))}${progress === 1 ? suffix : ''}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  counters.forEach((el) => observer.observe(el));
}

function setupPage() {
  bindImageFallbacks();
  bindMobileMenu();
  migrateLegacyCart();
  updateTripCount();
  bindSaveButtons();
  bindFilters();
  bindEnquiryForms();
  renderMyTrip();
  bindStatusForm();
  bindPlanner();
  bindWhatsappTracking();
  bindConsent();
  bindRevealMotion();
  bindThemeToggle();
  bindHeaderState();
  bindCardGlow();
  bindCounters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPage);
} else {
  setupPage();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service Worker registration failed:', err);
    });
  });
}
