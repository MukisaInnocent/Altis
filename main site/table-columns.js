// Writable columns per content table, with the type used to normalise incoming values.
//
// Inserts and updates are filtered through this list, so a request can never name a column that
// does not exist (or smuggle SQL through a column name). Empty strings become NULL for typed
// columns, because MySQL strict mode rejects '' for INT and DATE values.
export const TABLE_COLUMNS = {
  destinations: { name: 'text', country: 'text', region: 'text', tagline: 'text', description: 'text', image: 'text', price_from: 'int', featured: 'bool' },
  packages: { title: 'text', destination: 'text', days: 'int', price: 'int', image: 'text', description: 'text', featured: 'bool' },
  services: { title: 'text', summary: 'text', description: 'text', icon: 'text', image: 'text' },
  testimonials: { name: 'text', location: 'text', quote: 'text', trip: 'text', rating: 'int', approved: 'bool', verified_booking: 'bool', inquiry_id: 'int' },
  gallery: { title: 'text', image: 'text', category: 'text' },
  site_content: { key: 'text', value: 'text' },
  inquiries: {
    name: 'text', email: 'text', phone: 'text', interest: 'text', message: 'text', status: 'text',
    reference: 'text', service: 'text', details: 'text', package_id: 'int', admin_notes: 'text'
  },
  media: { title: 'text', file_name: 'text', mime_type: 'text', path: 'text' },
  offers: {
    title: 'text', destination: 'text', description: 'text', price: 'int', currency: 'text', valid_from: 'date',
    valid_until: 'date', terms: 'text', image: 'text', package_id: 'int', published: 'bool'
  },
  posts: {
    slug: 'text', title: 'text', excerpt: 'text', body: 'text', category: 'text', tags: 'text', image: 'text',
    image_alt: 'text', author: 'text', sources: 'text', published: 'bool', published_at: 'date', reviewed_at: 'date'
  },
  opportunities: {
    kind: 'text', title: 'text', country: 'text', institution: 'text', level: 'text', summary: 'text',
    eligibility: 'text', documents: 'text', deadline: 'date', source_name: 'text', source_url: 'text',
    verified_at: 'date', published: 'bool'
  },
  faqs: { question: 'text', answer: 'text', category: 'text', sort_order: 'int', published: 'bool' }
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normaliseValue(type, value) {
  if (value === undefined) return undefined;
  if (type === 'text') return value === null ? null : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (value === null || value === '') return null;
  if (type === 'int') {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number) : null;
  }
  if (type === 'bool') return value === true || value === 1 || value === '1' || value === 'true' || value === 'on' ? 1 : 0;
  if (type === 'date') {
    const text = String(value).slice(0, 10);
    return DATE_PATTERN.test(text) ? text : null;
  }
  return value;
}

// Tables without an entry (users, sessions) are written by dedicated functions and pass through.
export function sanitizeRow(tableName, row) {
  const columns = TABLE_COLUMNS[tableName];
  if (!columns) return row;

  const clean = {};
  for (const [column, type] of Object.entries(columns)) {
    if (!(column in row)) continue;
    const value = normaliseValue(type, row[column]);
    if (value !== undefined) clean[column] = value;
  }
  return clean;
}
