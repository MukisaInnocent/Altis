const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_ROOT = process.env.DATA_ROOT || path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_ROOT, 'altis.db');
const IMAGES_ROOT = process.env.IMAGES_ROOT || path.join(__dirname, '..', 'images');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  filename TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  caption TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, filename)
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  destination TEXT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  meta TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL DEFAULT '',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  section_name TEXT NOT NULL,
  eyebrow TEXT DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  summary TEXT DEFAULT '',
  body TEXT DEFAULT '',
  image_path TEXT DEFAULT '',
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published')),
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL CHECK(item_type IN ('service', 'destination', 'tour')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  country TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  image_path TEXT DEFAULT '',
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_type, slug)
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_path TEXT DEFAULT '',
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  published_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Add slot support to databases created before image replacement was added.
const imageColumns = db.prepare('PRAGMA table_info(images)').all().map((column) => column.name);
if (!imageColumns.includes('slot')) db.exec('ALTER TABLE images ADD COLUMN slot TEXT DEFAULT NULL');

// CMS defaults retain the existing public design and copy until an administrator changes them.
const defaultSettings = {
  company_name: 'Altis Voyage Travel Services Ltd',
  primary_phone: '+256 788 748 128',
  secondary_phone: '+256 756 037 524',
  whatsapp_number: '+256 774 497 295',
  info_email: 'info@altistravels.com',
  bookings_email: 'bookings@altistravels.com',
  address: 'Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda',
  footer_tagline: 'Professional travel solutions from Kampala, Uganda.',
  home_seo_title: 'Altis Voyage Travel Services Ltd | Flights, Visas & Travel Services in Uganda',
  home_seo_description: 'Altis Voyage Travel Services Ltd is a professional travel agency in Uganda offering international and domestic flight tickets, visa services, travel insurance, holidays, cargo, university admissions and travel solutions.'
};
const addSetting = db.prepare('INSERT OR IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)');
Object.entries(defaultSettings).forEach(([key, value]) => addSetting.run(key, value));

const defaultSections = [
  ['home-hero', 'Home', 'Hero', 'Altis Voyage Travel Services Ltd', 'Travel with\nintention.', 'Global travel planning for safaris, beach escapes, city breaks and extraordinary journeys designed around your pace, goals and dreams.', '', '/images/hero/lake-bunyonyi.svg'],
  ['home-ai', 'Home', 'Travel planning', 'AI concierge guide', 'Customer care that feels immediate, polished and personal.', 'Use the travel search to explore ideas quickly, then let our team turn those inspirations into a precise itinerary, a visa plan, or a tailored holiday route.', '', ''],
  ['home-intro', 'Home', 'Travel support', '02 / Travel support', 'Good journeys begin with good questions.', 'Altis Voyage Travel Services Ltd is a professional travel management company based in Kampala, Uganda. We provide flight reservations, visa assistance, hotel bookings, holiday packages, travel insurance, airport transfers, and corporate travel solutions.', '', ''],
  ['about-hero', 'About', 'Hero', 'About Altis Voyage', 'Travel made personal.', 'Professional, considered travel support from Kampala to the world.', '', ''],
  ['about-company', 'About', 'Company', 'Our company', 'Built around the details that make travel feel easy.', 'Altis Voyage Travel Services Ltd is a professional travel management company based in Kampala, Uganda, with a growing international outlook. We help travellers arrange flights, visas, accommodation, tours, transfers and complete itineraries for business and leisure travel.\n\nWe work with a practical, service-first mindset, helping clients move from inspiration to a clear action plan. The aim is to make the travel experience feel considered, exciting and easy to trust from the very first enquiry.', '', ''],
  ['about-mission', 'About', 'Mission', '', 'Mission', 'To provide exceptional travel services through professionalism, integrity, innovation and customer-focused planning.', '', ''],
  ['about-vision', 'About', 'Vision', '', 'Vision', 'To become one of the region’s most trusted and preferred travel partners for memorable journeys across East Africa and the wider world.', '', ''],
  ['about-team', 'About', 'Team', '', 'Our team', 'BUHIGIRO OLIVIER — Marketing\nNISHIMWE CYNTHIA — Director', '', ''],
  ['services-hero', 'Services', 'Hero', 'Our services', 'Everything you need to go further.', 'One trusted point of contact for the important details of travel.', '', ''],
  ['contact-hero', 'Contact', 'Hero', 'Contact centre', 'Let’s make a good plan.', 'Find the team at Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda.', '', ''],
  ['resources-hero', 'Resources', 'Hero', 'Travel resources', 'Useful things to know before you go.', 'Travel tips, visa guidance, destination ideas and planning notes from the Altis Voyage team.', '', '']
];
const addSection = db.prepare('INSERT OR IGNORE INTO site_sections (section_key, page_name, section_name, eyebrow, title, summary, body, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
defaultSections.forEach((section) => addSection.run(...section));

const defaultCatalog = [
  ['service', 'flight-reservations', 'Flight tickets', 'International and domestic flight ticket support for regional and long-haul travel across Africa, Europe, Asia, the Middle East and the wider world.', '', '', '', 1],
  ['service', 'visa-assistance', 'Visa services', 'Clear strategy, document reviews and application guidance to help travellers prepare with greater confidence and fewer surprises.', '', '', '', 2],
  ['service', 'hotel-reservations', 'Hotel reservations', 'Curated accommodation planning tailored to your route, comfort level, travel style and budget, from city stays to luxury hideaways.', '', '', '', 3],
  ['service', 'tour-packages', 'Holiday & tour packages', 'Tailor-made safaris, beach escapes, city getaways and multi-stop itineraries shaped around memorable experiences.', '', '', '', 4],
  ['service', 'travel-insurance', 'Travel insurance', 'Practical cover guidance and trip preparation support so clients can travel with more peace of mind.', '', '', '', 5],
  ['service', 'airport-transfers', 'Airport transfers', 'Smooth pickup and drop-off planning for arrivals, departures and onward connections across Kampala and major routes.', '', '', '', 6],
  ['service', 'corporate-travel', 'Corporate travel management', 'Business-focused travel planning for executives, teams and international meetings that need reliability and efficiency.', '', '', '', 7],
  ['service', 'family-reunification', 'Family reunification guidance', 'Thoughtful travel support for families reconnecting across borders with comfort, clarity and practical planning.', '', '', '', 8],
  ['service', 'cargo-shopping', 'Cargo & shopping', 'Practical cargo and shopping support for clients moving items and coordinating purchases across borders.', '', '', '', 9],
  ['service', 'university-admissions-scholarships', 'University admissions & scholarships', 'Guidance for students exploring international university admissions, scholarships and travel preparation.', '', '', '', 10],
  ['service', 'multi-country-itineraries', 'Multi-country itineraries', 'Connected journeys that blend culture, wildlife, luxury stays and unforgettable experiences into a single seamless trip.', '', '', '', 11],
  ['destination', 'bwindi', 'Bwindi', 'Misty rainforest trails, mountain gorillas and a deeply immersive African safari experience.', 'Uganda', '', '/images/destinations/bwindi.svg', 1],
  ['destination', 'queen-elizabeth', 'Queen Elizabeth', 'Savanna landscapes, crater lakes and classic game drives in one of East Africa’s most dramatic parks.', 'Uganda', '', '/images/destinations/queen-elizabeth.svg', 2],
  ['destination', 'jinja', 'Jinja', 'The source of the Nile, adrenaline-filled river days and laid-back lakeside evenings.', 'Uganda', '', '/images/destinations/jinja.svg', 3],
  ['destination', 'ssese-islands', 'Ssese Islands', 'Quiet beaches, island escapes and a relaxed lakefront rhythm away from the city rush.', 'Uganda', '', '/images/destinations/ssese-islands.svg', 4],
  ['destination', 'bali', 'Bali', 'Temple towns, emerald rice terraces, beach clubs and a balance of culture, wellness and tropical glamour.', 'Indonesia', '', '', 5],
  ['destination', 'dubai', 'Dubai', 'Iconic skylines, desert adventures, luxury shopping and a polished modern city experience.', 'UAE', '', '', 6],
  ['destination', 'paris', 'Paris', 'Timeless streets, world-class museums, boutique stays and romantic city energy.', 'France', '', '', 7],
  ['destination', 'santorini', 'Santorini', 'Whitewashed villages, sea views, sunset dining and graceful island living in the Aegean.', 'Greece', '', '', 8],
  ['tour', 'gorilla-trek', 'Gorilla Trek', 'An immersive rainforest expedition shaped around expert-led trekking, wildlife viewing and a close connection to Uganda’s rich natural landscape.', 'Bwindi, Uganda', '5 days', '/images/tours/gorilla-trek.svg', 1],
  ['tour', 'nile-source-adventure', 'Nile Source Adventure', 'A vibrant mix of rafting, scenic drives and cultural discovery centred around the source of the Nile and Uganda’s energetic outdoor spirit.', 'Jinja, Uganda', '4 days', '/images/tours/nile-adventure.svg', 2],
  ['tour', 'classic-savanna-safari', 'Classic Savanna Safari', 'A classic East African safari route built around game drives, lodge stays, big skies and time to soak up the rhythm of the savannah.', 'Uganda', '6 days', '/images/tours/savanna-safari.svg', 3],
  ['tour', 'dubai-desert-coast', 'Dubai Desert & Coast', 'A polished city-and-desert escape combining skyline glamour, adventure experiences and memorable Gulf evenings.', 'Dubai, UAE', '5 days', '', 4],
  ['tour', 'bali-wellness-escape', 'Bali Wellness Escape', 'A slower, restorative journey featuring beach time, temple culture, spa rituals and a laid-back tropical rhythm.', 'Bali, Indonesia', '6 days', '', 5],
  ['tour', 'european-classics', 'European Classics', 'A refined blend of iconic city culture, alpine scenery and elegant travelling for clients seeking a classic European route.', 'Paris & Switzerland', '7 days', '', 6],
  ['tour', 'island-honeymoon', 'Island Honeymoon', 'A romantic island itinerary built around sea views, sunset dining and beautifully paced moments for newlyweds.', 'Santorini & Athens', '6 days', '', 7]
];
const addCatalog = db.prepare('INSERT OR IGNORE INTO catalog_items (item_type, slug, title, summary, country, duration, image_path, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
defaultCatalog.forEach((item) => addCatalog.run(...item));
// Destinations and tours need a real uploaded image before they can appear publicly.
db.prepare("UPDATE catalog_items SET status = 'draft' WHERE item_type IN ('destination', 'tour') AND image_path = ''").run();

// Seed a default admin account if none exists (change on first login).
const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
if (adminCount === 0) {
  const defaultUser = process.env.ADMIN_USER || 'admin';
  const defaultPass = process.env.ADMIN_PASS || 'altisvoyage2026';
  const hash = bcrypt.hashSync(defaultPass, 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(defaultUser, hash);
  console.log(`[setup] Created default admin user "${defaultUser}" — change the password after first login.`);
}

// Keep the DB in sync with whatever is actually sitting in the image folders.
// Dropping a file into images/<category>/ is enough for it to show up here
// (inactive by default) even without using the admin UI.
function syncImagesFromDisk() {
  if (!fs.existsSync(IMAGES_ROOT)) return;
  const categories = fs.readdirSync(IMAGES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const existing = db.prepare('SELECT category, filename FROM images').all();
  const existingSet = new Set(existing.map((r) => `${r.category}/${r.filename}`));

  const insert = db.prepare(
    'INSERT INTO images (category, filename, active, sort_order) VALUES (?, ?, 1, ?)'
  );
  const validExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

  for (const category of categories) {
    const dir = path.join(IMAGES_ROOT, category);
    const files = fs.readdirSync(dir).filter((f) => validExt.has(path.extname(f).toLowerCase()));
    files.forEach((filename, idx) => {
      const key = `${category}/${filename}`;
      if (!existingSet.has(key)) {
        insert.run(category, filename, idx);
      }
    });

    const hasActive = db.prepare('SELECT 1 FROM images WHERE category = ? AND active = 1 LIMIT 1').get(category);
    if (!hasActive && files.length) {
      db.prepare('UPDATE images SET active = 1 WHERE category = ?').run(category);
    }
  }

  // Remove DB rows whose file no longer exists on disk.
  const all = db.prepare('SELECT id, category, filename FROM images').all();
  const del = db.prepare('DELETE FROM images WHERE id = ?');
  for (const row of all) {
    const p = path.join(IMAGES_ROOT, row.category, row.filename);
    if (!fs.existsSync(p)) del.run(row.id);
  }
}

module.exports = { db, syncImagesFromDisk, IMAGES_ROOT };
