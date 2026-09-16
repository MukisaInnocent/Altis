const IMAGES = {
  gorilla: 'https://images.hostinger.com/c8d9efe2-440c-4c0d-b269-16fd05edb138.png',
  nile: 'https://images.hostinger.com/110ca975-1703-4f2e-8e46-ae84dd12453a.png',
  dubai: 'https://images.hostinger.com/f6da86f0-b16c-43af-a1e8-976f2ad4df16.png',
  zanzibar: 'https://images.hostinger.com/7c37ccfb-ca26-4447-9cff-8d7ac49eb1a0.png',
  goldenHour: 'https://images.hostinger.com/a1ba63e0-f1aa-46ed-a755-a27d54aaf866.png',
  migration: 'https://images.hostinger.com/dc600f9c-f8f7-4e01-b02d-35ee144e5656.png',
  savannaSuite: 'https://images.hostinger.com/2b609145-d692-466e-810d-089dd612da30.png',
  kampala: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=80',
  bwindiPhoto: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=80',
  savannaPhoto: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=900&q=80',
  maraPhoto: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  beachPhoto: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  cityPhoto: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80'
};

export const SITE_CONTENT = [
  {
    key: 'hero',
    value: {
      title: 'From Uganda to the World',
      subtitle:
        'Uganda-based, worldwide in reach. Safaris at home, journeys abroad - planned, booked and supported by people who answer the phone.',
      ctaPrimary: 'Explore Destinations',
      ctaSecondary: 'Plan Your Trip',
      image: 'https://images.hostinger.com/ff8ea400-4b7a-4f87-aabb-574af2bb1041.png'
    }
  },
  {
    key: 'about',
    value: {
      heading: 'Altis Voyage Travel Services Ltd',
      body: 'Altis Voyage Travel Services Ltd is a professional travel management company based in Kampala, Uganda, providing flight reservations, visa assistance, hotel bookings, holiday packages, travel insurance, airport transfers, and corporate travel solutions.'
    }
  },
  {
    key: 'contact',
    value: {
      phone: '+256 788 748 128 / +256 756 037 524',
      email: 'info@altistravels.com',
      address: 'Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda',
      hours: 'Mon-Sat, 8:30-18:00 EAT'
    }
  }
];

export const DESTINATIONS = [
  { name: 'Bwindi Impenetrable Forest', country: 'Uganda', region: 'uganda', tagline: 'Face to face with mountain gorillas', description: 'A classic Ugandan gorilla experience set in misty rainforest and rolling highland trails.', image: IMAGES.bwindiPhoto, price_from: 2900000, featured: 1 },
  { name: 'Murchison Falls National Park', country: 'Uganda', region: 'uganda', tagline: 'The Nile at its most powerful', description: 'A dramatic safari with river cruises, game drives and unforgettable river viewpoints.', image: IMAGES.savannaPhoto, price_from: 1850000, featured: 1 },
  { name: 'Queen Elizabeth National Park', country: 'Uganda', region: 'uganda', tagline: 'Tree-climbing lions and crater lakes', description: 'Wildlife, crater landscapes and evening drives in western Uganda.', image: IMAGES.savannaPhoto, price_from: 1600000, featured: 1 },
  { name: 'Maasai Mara', country: 'Kenya', region: 'international', tagline: 'The great migration', description: 'An iconic East African safari known for wide-open plains and dramatic wildlife crossings.', image: IMAGES.maraPhoto, price_from: 3400000, featured: 1 },
  { name: 'Zanzibar', country: 'Tanzania', region: 'international', tagline: 'Spice island shores', description: 'Beach, culture and island romance with stone town charm and Indian Ocean beauty.', image: IMAGES.beachPhoto, price_from: 2700000, featured: 1 },
  { name: 'Dubai', country: 'United Arab Emirates', region: 'international', tagline: 'Desert meets skyline', description: 'Luxury city breaks, desert adventure and seamless travel with premium stays.', image: IMAGES.cityPhoto, price_from: 4200000, featured: 1 }
];

export const PACKAGES = [
  { title: 'Gorilla Trekking Expedition', destination: 'Bwindi Impenetrable Forest, Uganda', days: 4, price: 6850000, image: IMAGES.gorilla, description: 'Four days through the highlands: gorilla permit, lodge stay, Batwa community walk and Lake Bunyonyi wind-down.', featured: 1 },
  { title: 'Murchison Falls Safari', destination: 'Murchison Falls NP, Uganda', days: 3, price: 2450000, image: IMAGES.nile, description: 'Game drives, a Nile boat cruise to the base of the falls, and a hike to the top.', featured: 1 },
  { title: 'Dubai City Escape', destination: 'Dubai, UAE', days: 5, price: 5300000, image: IMAGES.dubai, description: 'Flights from Entebbe, 4-star hotel, desert safari, Burj Khalifa entry and UAE visa processing.', featured: 1 },
  { title: 'Zanzibar Beach Retreat', destination: 'Zanzibar, Tanzania', days: 6, price: 3950000, image: IMAGES.zanzibar, description: 'Beachfront resort, Stone Town walking tour, spice farm visit and sunset dhow cruise.', featured: 1 }
];

export const SERVICES = [
  { title: 'Visa Assistance', summary: 'Application preparation, document review and appointment booking for tourist, business and family-visit visas.', description: 'We prepare, review and submit every application with care.', icon: 'Stamp', image: '' },
  { title: 'Passport & Travel Documentation', summary: 'Guidance on Ugandan passport applications, renewals, yellow fever cards and travel documents.', description: 'Travel documentation handled with clarity and support.', icon: 'BookOpen', image: '' },
  { title: 'Accommodation Booking', summary: 'Lodges, hotels, apartments and resorts - negotiated rates across Uganda and worldwide.', description: 'Thoughtful stays for business, leisure and family travel.', icon: 'BedDouble', image: '' },
  { title: 'International Flights', summary: 'Best-route flight booking from Entebbe to anywhere, with flexible rebooking support.', description: 'Flights arranged with convenience and practical travel timing.', icon: 'Plane', image: '' },
  { title: 'Safari & Tour Planning', summary: 'Custom itineraries, permits, transport and expert local guides across East Africa.', description: 'We design the route, timing and support around your plans.', icon: 'Map', image: '' },
  { title: 'Travel Insurance & Support', summary: 'Trusted travel insurance options and 24/7 assistance while you travel.', description: 'A reliable partner for journey planning and risk awareness.', icon: 'ShieldCheck', image: '' }
];

export const TESTIMONIALS = [
  { name: 'Nakato Sarah', location: 'Kampala, Uganda', quote: 'They secured my Schengen visa documents and had my Paris itinerary ready in days. I just packed my bag.', trip: 'Paris & London Grand Tour', rating: 5 },
  { name: 'Okello James', location: 'Gulu, Uganda', quote: 'The gorilla trek was the greatest day of my life. Permits, lodge, transport - everything simply worked.', trip: 'Gorilla Trekking Expedition', rating: 5 },
  { name: 'Amina Hassan', location: 'Nairobi, Kenya', quote: 'Booked Dubai for our honeymoon. The desert safari dinner was unforgettable and the visa process was painless.', trip: 'Dubai City Escape', rating: 5 },
  { name: 'David Ssemwanga', location: 'Entebbe, Uganda', quote: 'As a first-time traveller I needed hand-holding. Their team answered every call, even at the airport at 5am.', trip: 'Istanbul Discovery', rating: 4 }
];

export const GALLERY = [
  { title: 'Silverback at dawn', image: IMAGES.gorilla, category: 'safari' },
  { title: 'The Nile through the gorge', image: IMAGES.nile, category: 'safari' },
  { title: 'Game drive, golden hour', image: IMAGES.goldenHour, category: 'safari' },
  { title: 'Migration crossing', image: IMAGES.migration, category: 'safari' },
  { title: 'Kampala at dusk', image: IMAGES.kampala, category: 'city' },
  { title: 'Blue hour in Dubai', image: IMAGES.dubai, category: 'city' },
  { title: 'Dhow off Zanzibar', image: IMAGES.zanzibar, category: 'beach' },
  { title: 'Savanna suite', image: IMAGES.savannaSuite, category: 'stays' }
];

export const SEED_TABLES = [
  { table: 'destinations', rows: DESTINATIONS },
  { table: 'packages', rows: PACKAGES },
  { table: 'services', rows: SERVICES },
  { table: 'testimonials', rows: TESTIMONIALS },
  { table: 'gallery', rows: GALLERY }
];
