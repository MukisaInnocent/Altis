const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'images');

// [category, filename, width, height, gradientFrom, gradientTo, label]
const items = [
  ['hero', 'sunset-savanna.svg', 1600, 900, '#0F3D3E', '#E08E45', 'Murchison Falls, Uganda'],
  ['hero', 'lake-bunyonyi.svg', 1600, 900, '#0B2E3A', '#3E8E7E', 'Lake Bunyonyi'],
  ['about', 'guides-briefing.svg', 1200, 900, '#1C2B2A', '#6B7B79', 'Our Guides'],
  ['destinations', 'bwindi.svg', 900, 1100, '#0F3D3E', '#7FAE9A', 'Bwindi Impenetrable Forest'],
  ['destinations', 'queen-elizabeth.svg', 900, 1100, '#26463F', '#E08E45', 'Queen Elizabeth NP'],
  ['destinations', 'jinja.svg', 900, 1100, '#0B2E3A', '#4FA6A0', 'Jinja — Source of the Nile'],
  ['destinations', 'ssese-islands.svg', 900, 1100, '#0F3D3E', '#3E8E7E', 'Ssese Islands'],
  ['tours', 'gorilla-trek.svg', 900, 700, '#1C2B2A', '#E08E45', '5-Day Gorilla Trek'],
  ['tours', 'nile-adventure.svg', 900, 700, '#0B2E3A', '#4FA6A0', 'Nile Source Adventure'],
  ['tours', 'savanna-safari.svg', 900, 700, '#26463F', '#D97B3E', 'Classic Savanna Safari'],
  ['gallery', 'gallery-1.svg', 800, 800, '#0F3D3E', '#E08E45', 'Golden Hour, Kidepo'],
  ['gallery', 'gallery-2.svg', 800, 800, '#0B2E3A', '#7FAE9A', 'Boat Cruise, Kazinga'],
  ['gallery', 'gallery-3.svg', 800, 800, '#26463F', '#4FA6A0', 'Crater Lakes, Fort Portal'],
  ['gallery', 'gallery-4.svg', 800, 800, '#1C2B2A', '#D97B3E', 'Chimp Trekking, Kibale'],
];

function svg(w, h, from, to, label, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g${id})"/>
  <text x="${w / 2}" y="${h / 2}" fill="rgba(255,255,255,0.92)" font-family="Georgia, serif" font-size="${Math.round(w / 18)}" text-anchor="middle" dominant-baseline="middle">${label}</text>
  <text x="24" y="${h - 24}" fill="rgba(255,255,255,0.55)" font-family="Arial, sans-serif" font-size="${Math.round(w / 45)}">Placeholder — replace with client photo</text>
</svg>`;
}

items.forEach(([cat, filename, w, h, from, to, label], i) => {
  const dir = path.join(ROOT, cat);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), svg(w, h, from, to, label, i));
});

console.log(`Generated ${items.length} placeholder images.`);
