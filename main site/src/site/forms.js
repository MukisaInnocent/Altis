import { html, raw } from './html.js';

// Builders for the enquiry forms. Every form posts to /api/inquiries; app.js submits it with fetch
// and shows inline errors, and without JavaScript the browser posts it and is redirected to the
// confirmation page.

export function field({ name, label, type = 'text', required = false, value = '', options, hint, attrs = '', autocomplete, full = false }) {
  const requiredAttr = required ? raw(' required') : '';
  const extra = raw(attrs ? ` ${attrs}` : '');
  const auto = autocomplete ? raw(` autocomplete="${autocomplete}"`) : '';
  let control;
  if (type === 'select') {
    control = html`<select name="${name}"${requiredAttr}${extra}>${options.map((option) => {
      const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, option];
      return html`<option value="${optionValue}"${raw(String(optionValue) === String(value) ? ' selected' : '')}>${optionLabel}</option>`;
    })}</select>`;
  } else if (type === 'textarea') {
    control = html`<textarea name="${name}" rows="5"${requiredAttr}${extra}>${value}</textarea>`;
  } else {
    control = html`<input name="${name}" type="${type}" value="${value}"${requiredAttr}${auto}${extra} />`;
  }
  return html`<label class="${full ? 'field field-full' : 'field'}"><span class="field-label">${label}${required ? raw(' <abbr title="required">*</abbr>') : ''}</span>${control}${hint ? html`<small class="field-hint">${hint}</small>` : ''}<span class="field-error" data-error-for="${name}"></span></label>`;
}

export function row(...fields) {
  return html`<div class="field-row">${fields}</div>`;
}

export function contactFields() {
  return html`
    ${row(
      field({ name: 'name', label: 'Full name', required: true, autocomplete: 'name' }),
      field({ name: 'email', label: 'Email', type: 'email', autocomplete: 'email', hint: 'Email or phone is required.' })
    )}
    ${row(
      field({ name: 'phone', label: 'Phone / WhatsApp', type: 'tel', autocomplete: 'tel', attrs: 'placeholder="+256 7XX XXX XXX"' }),
      field({ name: 'preferred_contact', label: 'Preferred contact', type: 'select', options: [['whatsapp', 'WhatsApp'], ['phone', 'Phone call'], ['email', 'Email']] })
    )}`;
}

export function travellerFields({ adults = 1 } = {}) {
  return row(
    field({ name: 'adults', label: 'Adults', type: 'number', value: adults, attrs: 'min="1" max="50" inputmode="numeric"' }),
    field({ name: 'children', label: 'Children (2–11)', type: 'number', value: 0, attrs: 'min="0" max="50" inputmode="numeric"' })
  );
}

export function dateFields({ departLabel = 'Departure date', returnLabel = 'Return date' } = {}) {
  return row(
    field({ name: 'depart_date', label: departLabel, type: 'date', attrs: 'data-min-today' }),
    field({ name: 'return_date', label: returnLabel, type: 'date', attrs: 'data-min-today' })
  );
}

// Wraps fields in a form with the hidden service marker, a honeypot for bots, the booking
// disclaimer and the submit button.
export function enquiryForm({ service, id, heading, intro, submitLabel, hidden = {}, body }) {
  return html`
  <form class="inquiry-form" id="${id}" data-enquiry-form="${service}" action="/api/inquiries" method="post">
    ${heading ? html`<h2 class="form-heading font-display">${heading}</h2>` : ''}
    ${intro ? html`<p class="form-intro">${intro}</p>` : ''}
    <input type="hidden" name="service" value="${service}" />
    ${Object.entries(hidden).map(([name, value]) => html`<input type="hidden" name="${name}" value="${value}" />`)}
    <div class="form-status" role="alert" hidden></div>
    ${body}
    <div class="hp-field" aria-hidden="true"><label>Leave this field empty<input name="company_website" type="text" tabindex="-1" autocomplete="off" /></label></div>
    <p class="form-note">Sending this form is a request, not a booking. Our team will review it and reply with options and a quotation. See our <a href="/privacy-policy">Privacy Policy</a> for how we use your details.</p>
    <button class="button primary full-width" type="submit">${submitLabel}</button>
  </form>`;
}
