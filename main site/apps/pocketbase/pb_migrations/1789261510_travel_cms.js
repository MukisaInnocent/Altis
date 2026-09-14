/// <reference path="../pb_data/types.d.ts" />

const IMG = {
  hero: "https://images.hostinger.com/ff8ea400-4b7a-4f87-aabb-574af2bb1041.png",
  gorilla: "https://images.hostinger.com/c8d9efe2-440c-4c0d-b269-16fd05edb138.png",
  falls: "https://images.hostinger.com/110ca975-1703-4f2e-8e46-ae84dd12453a.png",
  bunyonyi: "https://images.hostinger.com/b9285622-3a3c-42e1-8b33-9c4b00452a35.png",
  kampala: "https://images.hostinger.com/e142d7ac-36a1-49bf-85c3-42a150130b8d.png",
  dubai: "https://images.hostinger.com/f6da86f0-b16c-43af-a1e8-976f2ad4df16.png",
  paris: "https://images.hostinger.com/743e2b8d-2b29-4407-85ae-3d3060d6cde4.png",
  zanzibar: "https://images.hostinger.com/7c37ccfb-ca26-4447-9cff-8d7ac49eb1a0.png",
  istanbul: "https://images.hostinger.com/17434d93-d614-4aea-b6ba-4ccda8e7110c.png",
  jeep: "https://images.hostinger.com/a1ba63e0-f1aa-46ed-a755-a27d54aaf866.png",
  lodge: "https://images.hostinger.com/2b609145-d692-466e-810d-089dd612da30.png",
  airport: "https://images.hostinger.com/1182a994-9184-4aa0-8d62-960e782bcd40.png",
  mara: "https://images.hostinger.com/dc600f9c-f8f7-4e01-b02d-35ee144e5656.png",
  london: "https://images.hostinger.com/e6c85103-5a43-4009-a4a5-861aad9ec794.png",
};

const ADMIN = "@request.auth.role = 'admin'";

migrate(
  (app) => {
    // ---- users: role field + locked rules + seeded admin ----
    const users = app.findCollectionByNameOrId("users");
    if (!users.fields.getByName("role")) {
      users.fields.add(
        new SelectField({
          name: "role",
          required: true,
          maxSelect: 1,
          values: ["admin", "editor"],
        }),
      );
    }
    users.createRule = null; // closed sign-up; accounts are created server-side
    users.updateRule =
      "(id = @request.auth.id && @request.body.role:changed = false) || @request.auth.role = 'admin'";
    app.save(users);

    try {
      app.findAuthRecordByEmail("users", "admin@altistravels.com");
    } catch (_) {
      const adminEmail = $os.getenv("PB_SUPERUSER_EMAIL");
      const adminPassword = $os.getenv("PB_SUPERUSER_PASSWORD");
      if (!adminEmail || !adminPassword) {
        throw new Error("PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD must be set before the CMS migration runs");
      }
      const admin = new Record(users);
      admin.setEmail(adminEmail);
      admin.setPassword(adminPassword);
      admin.set("name", "Site Admin");
      admin.set("role", "admin");
      admin.set("verified", true);
      app.save(admin);
    }

    // ---- helpers ----
    const stamps = [
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];
    function ensure(def) {
      try {
        return app.findCollectionByNameOrId(def.name);
      } catch (_) {
        const c = new Collection(def);
        app.save(c);
        return c;
      }
    }
    function cms(name, fields) {
      return ensure({
        type: "base",
        name,
        listRule: "",
        viewRule: "",
        createRule: ADMIN,
        updateRule: ADMIN,
        deleteRule: ADMIN,
        fields: fields.concat(stamps),
      });
    }
    function seed(collection, keyField, rows) {
      for (const row of rows) {
        let exists = null;
        try {
          exists = app.findFirstRecordByData(collection.name, keyField, row[keyField]);
        } catch (_) {}
        if (exists) continue;
        const r = new Record(collection);
        r.load(row);
        app.save(r);
      }
    }

    // ---- collections ----
    const destinations = cms("destinations", [
      { name: "name", type: "text", required: true, max: 120 },
      { name: "country", type: "text", max: 120 },
      {
        name: "region",
        type: "select",
        maxSelect: 1,
        values: ["uganda", "east-africa", "international"],
      },
      { name: "tagline", type: "text", max: 200 },
      { name: "description", type: "text" },
      { name: "image", type: "text" },
      { name: "price_from", type: "number", min: 0 },
      { name: "featured", type: "bool" },
    ]);

    const packages = cms("packages", [
      { name: "title", type: "text", required: true, max: 160 },
      { name: "destination", type: "text", max: 160 },
      { name: "days", type: "number", min: 0, onlyInt: true },
      { name: "price", type: "number", min: 0 },
      { name: "image", type: "text" },
      { name: "description", type: "text" },
      { name: "featured", type: "bool" },
    ]);

    const services = cms("services", [
      { name: "title", type: "text", required: true, max: 160 },
      { name: "summary", type: "text", max: 300 },
      { name: "description", type: "text" },
      { name: "icon", type: "text", max: 60 },
      { name: "image", type: "text" },
    ]);

    const testimonials = cms("testimonials", [
      { name: "name", type: "text", required: true, max: 120 },
      { name: "location", type: "text", max: 120 },
      { name: "quote", type: "text" },
      { name: "trip", type: "text", max: 160 },
      { name: "rating", type: "number", min: 0, max: 5 },
    ]);

    const gallery = cms("gallery", [
      { name: "title", type: "text", required: true, max: 160 },
      { name: "image", type: "text" },
      {
        name: "category",
        type: "select",
        maxSelect: 1,
        values: ["safari", "city", "beach", "culture", "stays"],
      },
    ]);

    const siteContent = cms("site_content", [
      { name: "key", type: "text", required: true, max: 80 },
      { name: "value", type: "json" },
    ]);

    const media = cms("media", [
      { name: "title", type: "text", max: 160 },
      {
        name: "file",
        type: "file",
        maxSelect: 1,
        maxSize: 10485760,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
        thumbs: ["200x200", "800x600"],
      },
    ]);

    const inquiries = ensure({
      type: "base",
      name: "inquiries",
      listRule: ADMIN,
      viewRule: ADMIN,
      createRule: "",
      updateRule: ADMIN,
      deleteRule: ADMIN,
      fields: [
        { name: "name", type: "text", required: true, max: 120 },
        { name: "email", type: "email", required: true },
        { name: "phone", type: "text", max: 60 },
        {
          name: "interest",
          type: "select",
          maxSelect: 1,
          values: ["safari", "international", "visa", "accommodation", "planning", "other"],
        },
        { name: "message", type: "text", required: true },
        {
          name: "status",
          type: "select",
          maxSelect: 1,
          values: ["new", "in-progress", "closed"],
        },
      ].concat(stamps),
    });

    // ---- seed content ----
    seed(destinations, "name", [
      { name: "Bwindi Impenetrable Forest", country: "Uganda", region: "uganda", tagline: "Face to face with mountain gorillas", description: "A misty ancient rainforest sheltering half of the world's remaining mountain gorillas. Guided treks lead you through dense vines to a habituated family.", image: IMG.gorilla, price_from: 2900000, featured: true },
      { name: "Murchison Falls National Park", country: "Uganda", region: "uganda", tagline: "The Nile at its most powerful", description: "The world's longest river forces itself through a 7-metre gorge. Game drives, boat safaris and the thundering falls themselves.", image: IMG.falls, price_from: 1850000, featured: true },
      { name: "Lake Bunyonyi", country: "Uganda", region: "uganda", tagline: "The lake of a thousand islands", description: "Terraced hills wrapped around calm, bilharzia-free water — perfect for canoeing, swimming and slow mornings after a gorilla trek.", image: IMG.bunyonyi, price_from: 950000, featured: false },
      { name: "Kampala", country: "Uganda", region: "uganda", tagline: "Seven hills of energy", description: "Uganda's capital: markets, mosques, craft villages, nightlife and the warmest welcome in East Africa.", image: IMG.kampala, price_from: 450000, featured: false },
      { name: "Queen Elizabeth National Park", country: "Uganda", region: "uganda", tagline: "Tree-climbing lions and crater lakes", description: "Classic savanna safari with elephants, hippos on the Kazinga Channel and the famous Ishasha lions.", image: IMG.jeep, price_from: 1600000, featured: true },
      { name: "Maasai Mara", country: "Kenya", region: "east-africa", tagline: "The great migration", description: "Between July and October over a million wildebeest cross the Mara river — nature's greatest spectacle, a short hop from Entebbe.", image: IMG.mara, price_from: 3400000, featured: true },
      { name: "Zanzibar", country: "Tanzania", region: "east-africa", tagline: "Spice island shores", description: "White sand, dhow sails at sunset, Stone Town's carved doors and warm Indian Ocean water.", image: IMG.zanzibar, price_from: 2700000, featured: true },
      { name: "Dubai", country: "United Arab Emirates", region: "international", tagline: "Desert meets skyline", description: "Record-breaking towers, old-town souks, desert safaris and world-class shopping — with direct flights from Entebbe.", image: IMG.dubai, price_from: 4200000, featured: true },
      { name: "Paris", country: "France", region: "international", tagline: "The city of light", description: "Museums, boulevards, cafés and the Eiffel Tower. We handle Schengen visa guidance end to end.", image: IMG.paris, price_from: 7800000, featured: false },
      { name: "Istanbul", country: "Türkiye", region: "international", tagline: "Where two continents meet", description: "Mosques, bazaars, Bosphorus ferries and extraordinary food — e-visa friendly for Ugandan travellers.", image: IMG.istanbul, price_from: 4600000, featured: false },
      { name: "London", country: "United Kingdom", region: "international", tagline: "A world city classic", description: "Theatre, history, shopping and family visits — with full UK visa application support.", image: IMG.london, price_from: 8200000, featured: false },
    ]);

    seed(packages, "title", [
      { title: "Gorilla Trekking Expedition", destination: "Bwindi Impenetrable Forest, Uganda", days: 4, price: 6850000, image: IMG.gorilla, description: "Four days through the highlands: gorilla permit, lodge stay, Batwa community walk and Lake Bunyonyi wind-down. Permits included and secured for you.", featured: true },
      { title: "Murchison Falls Safari", destination: "Murchison Falls NP, Uganda", days: 3, price: 2450000, image: IMG.falls, description: "Game drives, a Nile boat cruise to the base of the falls, and a hike to the top. Lodge accommodation and park fees included.", featured: true },
      { title: "Dubai City Escape", destination: "Dubai, UAE", days: 5, price: 5300000, image: IMG.dubai, description: "Flights from Entebbe, 4-star hotel, desert safari with dinner, Burj Khalifa entry and UAE visa processing handled by our team.", featured: true },
      { title: "Zanzibar Beach Retreat", destination: "Zanzibar, Tanzania", days: 6, price: 3950000, image: IMG.zanzibar, description: "Beachfront resort, Stone Town walking tour, spice farm visit and a sunset dhow cruise. Flights and transfers included.", featured: true },
      { title: "Paris & London Grand Tour", destination: "France & United Kingdom", days: 8, price: 12800000, image: IMG.paris, description: "Two capitals in one journey: Eurostar between them, guided city tours, museum passes and full Schengen + UK visa guidance.", featured: false },
      { title: "Istanbul Discovery", destination: "Istanbul, Türkiye", days: 5, price: 4700000, image: IMG.istanbul, description: "Old city highlights, Bosphorus dinner cruise, Grand Bazaar shopping time and e-visa support throughout.", featured: false },
    ]);

    seed(services, "title", [
      { title: "Visa Assistance", summary: "Application preparation, document review and appointment booking for tourist, business and family-visit visas.", description: "We guide you through requirements, check your documents and book appointments. Visa approval is determined by the relevant authorities — we make sure your application is complete and honest.", icon: "Stamp", image: IMG.airport },
      { title: "Passport & Travel Documentation", summary: "Guidance on Ugandan passport applications, renewals, yellow fever cards and travel documents.", description: "Step-by-step help with passport applications and renewals, certified copies, invitation letters and every supporting document your journey needs.", icon: "BookOpen", image: IMG.kampala },
      { title: "Accommodation Booking", summary: "Lodges, hotels, apartments and resorts — negotiated rates across Uganda and worldwide.", description: "From safari lodges inside the parks to city hotels and beach resorts, we book verified stays that match your budget and style.", icon: "BedDouble", image: IMG.lodge },
      { title: "International Flights", summary: "Best-route flight booking from Entebbe to anywhere, with flexible rebooking support.", description: "We compare carriers and routes out of Entebbe, hold fares, and help with changes when plans shift.", icon: "Plane", image: IMG.airport },
      { title: "Safari & Tour Planning", summary: "Custom itineraries, permits, transport and expert local guides across East Africa.", description: "Gorilla and chimp permits, 4x4 transport, park fees and licensed guides — assembled into one seamless itinerary.", icon: "Map", image: IMG.jeep },
      { title: "Travel Insurance & Support", summary: "Trusted travel insurance options and 24/7 assistance while you travel.", description: "Medical cover, trip cancellation and lost-luggage protection, plus a phone number that is always answered.", icon: "ShieldCheck", image: IMG.bunyonyi },
    ]);

    seed(testimonials, "name", [
      { name: "Nakato Sarah", location: "Kampala, Uganda", quote: "They secured my Schengen visa documents and had my Paris itinerary ready in days. I just packed my bag.", trip: "Paris & London Grand Tour", rating: 5 },
      { name: "Okello James", location: "Gulu, Uganda", quote: "The gorilla trek was the greatest day of my life. Permits, lodge, transport — everything simply worked.", trip: "Gorilla Trekking Expedition", rating: 5 },
      { name: "Amina Hassan", location: "Nairobi, Kenya", quote: "Booked Dubai for our honeymoon. The desert safari dinner was unforgettable and the visa process was painless.", trip: "Dubai City Escape", rating: 5 },
      { name: "David Ssemwanga", location: "Entebbe, Uganda", quote: "As a first-time traveller I needed hand-holding. Their team answered every call, even at the airport at 5am.", trip: "Istanbul Discovery", rating: 4 },
    ]);

    seed(gallery, "title", [
      { title: "Silverback at dawn", image: IMG.gorilla, category: "safari" },
      { title: "The Nile through the gorge", image: IMG.falls, category: "safari" },
      { title: "Game drive, golden hour", image: IMG.jeep, category: "safari" },
      { title: "Migration crossing", image: IMG.mara, category: "safari" },
      { title: "Kampala at dusk", image: IMG.kampala, category: "city" },
      { title: "Blue hour in Dubai", image: IMG.dubai, category: "city" },
      { title: "Dhow off Zanzibar", image: IMG.zanzibar, category: "beach" },
      { title: "Savanna suite", image: IMG.lodge, category: "stays" },
    ]);

    seed(siteContent, "key", [
      { key: "hero", value: { title: "From Uganda to the World", subtitle: "Uganda-based, worldwide in reach. Safaris at home, journeys abroad — planned, booked and supported by people who answer the phone.", image: IMG.hero, ctaPrimary: "Explore Destinations", ctaSecondary: "Plan Your Trip" } },
      { key: "contact", value: { phone: "+256 788 748 128 / +256 756 037 524", email: "info@altistravels.com", address: "Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda", hours: "Mon–Sat, 8:30–18:00 EAT", poBox: "P.O. Box 210166 Kampala-Uganda", regNo: "80034849146981", bookingsEmail: "bookings@altistravels.com", website: "www.altistravels.com" } },
      { key: "about", value: { heading: "Altis Voyage Travel Services Ltd", body: "Altis Voyage Travel Services Ltd is a professional travel management company based in Kampala, Uganda, providing flight reservations, visa assistance, hotel bookings, holiday packages, travel insurance, airport transfers, and corporate travel solutions.", missionHeading: "Mission", mission: "To provide exceptional travel services through professionalism, integrity, innovation, and customer-focused solutions.", visionHeading: "Vision", vision: "To become one of Africa's most trusted and preferred travel service providers." } },
      { key: "services", value: { items: ["Flight Reservations & Ticketing", "Visa Assistance", "Hotel Reservations", "Holiday & Tour Packages", "Travel Insurance", "Airport Transfers", "Corporate Travel Management", "Family Reunification Guidance for Diaspora"] } },
      { key: "why-us", value: { heading: "Why Choose Us", items: ["Professional team with expertise in travel services", "Competitive and transparent pricing", "Personalized service tailored to your needs", "Fast response times to your inquiries", "Reliable travel support before, during, and after your journey", "Global travel solutions and partnerships"] } },
    ]);
  },
  (app) => {
    for (const name of ["destinations", "packages", "services", "testimonials", "gallery", "site_content", "media", "inquiries"]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (e) {
        if (e.message.includes("no rows in result set")) continue;
        throw e;
      }
    }
    try {
      app.delete(app.findAuthRecordByEmail("users", "admin@altistravels.com"));
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }
  },
);
