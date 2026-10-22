import crypto from 'node:crypto';

// Every customer request (package quote, flight, visa, study abroad, offer, planner or general
// question) is stored in the existing `inquiries` table. The service-specific answers are kept as
// JSON in `details`, so no separate table is needed per service.

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+\d][\d\s().-]{6,39}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const text = (max) => ({ type: 'text', max });
const date = () => ({ type: 'date' });
const count = (min, max) => ({ type: 'count', min, max });
const choice = (...options) => ({ type: 'choice', options });

// Shared trip fields used by package, offer, planner and general quote requests.
const TRIP_FIELDS = {
  destination: text(200),
  depart_date: date(),
  return_date: date(),
  flexible_dates: choice('yes', 'no'),
  adults: count(1, 50),
  children: count(0, 50),
  budget: text(100),
  preferred_contact: choice('email', 'phone', 'whatsapp'),
  packages: text(1000)
};

export const SERVICES = {
  general: { label: 'General enquiry', fields: TRIP_FIELDS, required: [] },
  package: { label: 'Package quote', fields: TRIP_FIELDS, required: [] },
  offer: { label: 'Travel offer', fields: { ...TRIP_FIELDS, offer: text(255) }, required: [] },
  planner: { label: 'Trip planner', fields: { ...TRIP_FIELDS, duration_days: count(1, 120), interests: text(300), travel_month: text(20) }, required: [] },
  flight: {
    label: 'Flight booking',
    fields: {
      trip_type: choice('return', 'one-way', 'multi-city'),
      from: text(120),
      to: text(120),
      depart_date: date(),
      return_date: date(),
      flexible_dates: choice('yes', 'no'),
      adults: count(1, 50),
      children: count(0, 50),
      infants: count(0, 20),
      cabin_class: choice('economy', 'premium-economy', 'business', 'first'),
      preferred_contact: choice('email', 'phone', 'whatsapp')
    },
    required: ['trip_type', 'from', 'to', 'depart_date', 'adults']
  },
  visa: {
    label: 'Visa assistance',
    fields: {
      destination_country: text(120),
      nationality: text(120),
      visa_type: choice('tourist', 'business', 'family-visit', 'student', 'transit', 'work', 'other'),
      travel_date: date(),
      applicants: count(1, 50),
      preferred_contact: choice('email', 'phone', 'whatsapp')
    },
    required: ['destination_country', 'nationality', 'visa_type']
  },
  study: {
    label: 'Study abroad',
    fields: {
      study_countries: text(200),
      study_level: choice('certificate', 'diploma', 'undergraduate', 'postgraduate', 'phd', 'short-course', 'not-sure'),
      field_of_study: text(200),
      intake: text(60),
      highest_qualification: text(200),
      funding: choice('self-funded', 'scholarship', 'both', 'not-sure'),
      opportunity: text(255),
      preferred_contact: choice('email', 'phone', 'whatsapp')
    },
    required: ['study_countries', 'study_level']
  }
};

export const STATUSES = {
  new: 'Received',
  in_review: 'Being reviewed',
  quoted: 'Quotation sent',
  confirmed: 'Confirmed by our team',
  completed: 'Completed',
  closed: 'Closed',
  cancelled: 'Cancelled'
};

export class ValidationError extends Error {
  constructor(errors) {
    super('Please check the highlighted fields.');
    this.errors = errors;
  }
}

export function createReference(now = new Date()) {
  const stamp = now.toISOString().slice(2, 10).replaceAll('-', '');
  const bytes = crypto.randomBytes(5);
  const suffix = Array.from(bytes, (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join('');
  return `AV-${stamp}-${suffix}`;
}

function clean(value, max = 255) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function readField(definition, raw) {
  if (raw === undefined || raw === null || raw === '') return { value: null };
  if (definition.type === 'text') return { value: clean(raw, definition.max) || null };
  if (definition.type === 'date') {
    const value = clean(raw, 10);
    return DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value)) ? { value } : { error: 'Enter a valid date.' };
  }
  if (definition.type === 'count') {
    const value = Number(raw);
    return Number.isInteger(value) && value >= definition.min && value <= definition.max
      ? { value }
      : { error: `Enter a number between ${definition.min} and ${definition.max}.` };
  }
  if (definition.type === 'choice') {
    const value = clean(raw, 40).toLowerCase();
    return definition.options.includes(value) ? { value } : { error: 'Choose one of the listed options.' };
  }
  return { value: null };
}

// Validates a public submission and returns the row to insert. Throws ValidationError.
export function buildInquiry(payload = {}) {
  const errors = {};
  const serviceKey = SERVICES[payload.service] ? payload.service : 'general';
  const service = SERVICES[serviceKey];

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 200).toLowerCase();
  const phone = clean(payload.phone, 40);
  const message = clean(payload.message, 3000);

  if (name.length < 2) errors.name = 'Enter your full name.';
  if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid phone number, including the country code.';
  if (!email && !phone) errors.email = 'Give us an email address or phone number so we can reply.';
  if (serviceKey === 'general' && message.length < 5) errors.message = 'Tell us a little about your plans.';

  const details = {};
  for (const [field, definition] of Object.entries(service.fields)) {
    const { value, error } = readField(definition, payload[field]);
    if (error) errors[field] = error;
    else if (value !== null) details[field] = value;
  }
  for (const field of service.required) {
    if (!(field in details) && !errors[field]) errors[field] = 'This field is required.';
  }

  const departField = details.depart_date || details.travel_date;
  const today = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (departField && departField < today) errors[details.depart_date ? 'depart_date' : 'travel_date'] = 'Choose a date in the future.';
  if (details.depart_date && details.return_date && details.return_date < details.depart_date) {
    errors.return_date = 'The return date must be after the departure date.';
  }
  if (details.trip_type === 'return' && !details.return_date && !errors.return_date) {
    errors.return_date = 'Add a return date, or choose a one-way trip.';
  }

  const packageId = Number(payload.package_id);
  if (Object.keys(errors).length) throw new ValidationError(errors);

  return {
    name,
    email,
    phone,
    interest: clean(payload.interest, 255) || service.label,
    message,
    status: 'new',
    reference: createReference(),
    service: serviceKey,
    details: JSON.stringify(details),
    package_id: Number.isInteger(packageId) && packageId > 0 ? packageId : null
  };
}

// The public status lookup needs the reference plus the email or phone used on the request, so a
// guessed reference alone reveals nothing. Only the status and service are returned.
export function matchesContact(inquiry, contact) {
  const value = clean(contact, 200).toLowerCase();
  if (!value) return false;
  if (inquiry.email && inquiry.email.toLowerCase() === value) return true;
  const digits = (input) => String(input || '').replace(/\D/g, '');
  return Boolean(inquiry.phone) && digits(inquiry.phone).length >= 7 && digits(inquiry.phone) === digits(value);
}

export function publicStatus(inquiry) {
  return {
    reference: inquiry.reference,
    service: SERVICES[inquiry.service]?.label || 'Enquiry',
    status: STATUSES[inquiry.status] || 'Received',
    submitted: String(inquiry.created_at || '').slice(0, 10)
  };
}

// Small in-memory sliding-window limiter. It resets when the app restarts, which is acceptable for
// slowing down form spam and password guessing on a single Hostinger Node process.
const buckets = new Map();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const recent = (buckets.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) {
    for (const [bucketKey, times] of buckets) if (!times.some((time) => now - time < windowMs)) buckets.delete(bucketKey);
  }
  return true;
}

export function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}
