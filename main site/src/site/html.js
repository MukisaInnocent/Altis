// Small, dependency-free helpers for building server-rendered HTML safely.

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

// Tagged template that escapes every interpolated value unless it was produced by `raw()` or by
// another `html` call. Arrays are joined, and null/undefined/false render as nothing.
const RAW = Symbol('raw');

export function raw(value) {
  return { [RAW]: String(value ?? '') };
}

function renderValue(value) {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(renderValue).join('');
  if (typeof value === 'object' && RAW in value) return value[RAW];
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let output = strings[0];
  values.forEach((value, index) => {
    output += renderValue(value) + strings[index + 1];
  });
  return raw(output);
}

export function toHtmlString(value) {
  return renderValue(value);
}

export function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const ugx = new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', currencyDisplay: 'code', maximumFractionDigits: 0 });

export function formatPrice(amount, currency = 'UGX') {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (!currency || currency === 'UGX') return ugx.format(value);
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString('en')}`;
  }
}

export function formatDate(value) {
  const text = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
  const date = new Date(`${text}T00:00:00Z`);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function isoDate(value) {
  const text = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

export function todayIso() {
  // Offers and deadlines are judged in East Africa Time (UTC+3), where the business operates.
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function safeUrl(value) {
  const url = String(value || '').trim();
  if (/^https?:\/\//i.test(url) || url.startsWith('/') || /^mailto:/i.test(url)) return url;
  return '';
}

function inlineMarkdown(text) {
  let output = escapeHtml(text);
  output = output.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
    const url = safeUrl(href.replace(/&amp;/g, '&'));
    if (!url) return label;
    const external = /^https?:\/\//i.test(url);
    return `<a href="${escapeHtml(url)}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
  });
  return output;
}

// Renders the small Markdown subset used in policies and articles: ## headings, paragraphs,
// "-" and "1." lists, **bold** and [links](https://...). All input is escaped first.
export function markdown(source, { headingOffset = 0 } = {}) {
  const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(`<${list.tag}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);

    if (!trimmed) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(6, heading[1].length + headingOffset);
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
    } else if (bullet || numbered) {
      flushParagraph();
      const tag = bullet ? 'ul' : 'ol';
      if (!list || list.tag !== tag) {
        flushList();
        list = { tag, items: [] };
      }
      list.items.push((bullet || numbered)[1]);
    } else {
      flushList();
      paragraph.push(trimmed);
    }
  }
  flushParagraph();
  flushList();
  return raw(blocks.join('\n'));
}

export function plainText(source, max = 160) {
  const text = String(source || '')
    .replace(/[#*_>[\]()`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text;
}

export function jsonLd(data) {
  // `</` is escaped so content can never close the script element early.
  return raw(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
}
