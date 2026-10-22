// Starter website copy: editable business content, FAQs, policy drafts and draft articles.
//
// Site content is inserted only when a key is missing, so edits made in the admin dashboard
// survive restarts. Use CONTENT_UPGRADES to change a value that already exists in production.

const CONTACT = {
  phone: '+256 774 497 295',
  whatsapp: '+256774497295',
  email: 'info@altistravels.com',
  address: 'Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda',
  street: 'Equatorial Mall, Level 3, Room 342, Bombo Road',
  city: 'Kampala',
  country: 'UG',
  hours: 'Mon-Sat, 8:30-18:00 EAT',
  map_query: 'Equatorial Mall, Bombo Road, Kampala, Uganda'
};

const HERO = {
  title: 'Your Journey Begins with Altis Voyage',
  subtitle:
    'Flights, visa assistance, holiday packages, hotel bookings and study-abroad support from our team in Kampala. Tell us your plans and we will prepare a personalised quotation.',
  ctaPrimary: 'Explore Travel Packages',
  ctaSecondary: 'Request a Quote',
  image: 'https://images.hostinger.com/ff8ea400-4b7a-4f87-aabb-574af2bb1041.png'
};

const POLICY_NOTE =
  'This policy is a working draft prepared for Altis Voyage. It must be reviewed and approved by the business owner and a qualified legal adviser before it is relied upon.';

export const SITE_CONTENT = [
  { key: 'hero', value: HERO },
  {
    key: 'about',
    value: {
      heading: 'Altis Voyage Travel Services Ltd',
      body: 'Altis Voyage Travel Services Ltd is a professional travel management company based in Kampala, Uganda, providing flight reservations, visa assistance, hotel bookings, holiday packages, travel insurance, airport transfers, and corporate travel solutions.'
    }
  },
  { key: 'contact', value: CONTACT },
  {
    key: 'stats',
    value: {
      items: [
        { value: '12+', label: 'Years operating' },
        { value: '4,800+', label: 'Travellers served' },
        { value: '40+', label: 'Destinations' }
      ]
    }
  },
  {
    key: 'why_choose',
    value: {
      heading: 'Why travellers choose Altis Voyage',
      intro: 'A Kampala travel team that plans the whole journey with you and tells you plainly what is and is not confirmed.',
      items: [
        { title: 'One team for the whole trip', text: 'Flights, visa assistance, hotels, holiday packages, travel insurance and airport transfers arranged through one point of contact.' },
        { title: 'Personal assistance', text: 'A consultant reviews every request and works out options around your dates, budget and the people travelling with you.' },
        { title: 'Clear quotations first', text: 'Nothing is booked until you have a written quotation and our team has confirmed availability with the supplier.' },
        { title: 'Honest about visas', text: 'We prepare and review applications carefully, and we are clear that visa decisions rest with the relevant authorities.' },
        { title: 'Easy to reach', text: 'Call, WhatsApp or email us, or visit our office at Equatorial Mall, Kampala, Monday to Saturday.' },
        { title: 'Local roots, worldwide reach', text: 'Safaris across Uganda and East Africa, and journeys to destinations around the world.' }
      ]
    }
  },
  {
    key: 'process',
    value: {
      heading: 'How booking with us works',
      steps: [
        { title: 'Send your request', text: 'Choose a package or service and tell us your dates, travellers and budget. You receive a reference number straight away.' },
        { title: 'We review and quote', text: 'A consultant checks availability with airlines, hotels and other suppliers and sends you options with a written quotation.' },
        { title: 'You decide', text: 'Ask questions, adjust the plan or accept the quotation. Your request is not a booking until you accept.' },
        { title: 'We confirm', text: 'Once payment terms are agreed, our team confirms the booking in writing and shares your travel documents.' }
      ]
    }
  },
  {
    key: 'visa_sources',
    value: {
      intro: 'Visa rules, fees and processing times change often. Always confirm the current requirements with the official source for your destination before you apply or travel.',
      items: [
        { name: 'Uganda - Directorate of Citizenship and Immigration Control', url: 'https://www.immigration.go.ug' },
        { name: 'United Kingdom - Check if you need a UK visa (GOV.UK)', url: 'https://www.gov.uk/check-uk-visa' },
        { name: 'United States - U.S. visas (Department of State)', url: 'https://travel.state.gov/content/travel/en/us-visas.html' },
        { name: 'Canada - Immigration and citizenship (Government of Canada)', url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html' },
        { name: 'Schengen area - EU visa policy (European Commission)', url: 'https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en' },
        { name: 'United Arab Emirates - Federal Authority for Identity, Citizenship, Customs and Port Security', url: 'https://icp.gov.ae' }
      ]
    }
  },
  {
    key: 'policy_privacy',
    value: {
      title: 'Privacy Policy',
      updated: '2026-10-22',
      approved: false,
      note: POLICY_NOTE,
      body: `## Who we are
Altis Voyage Travel Services Ltd ("Altis Voyage", "we") is a travel agency based at Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda. We are responsible for the personal information you share with us through this website, by phone, WhatsApp, email or in person.

## What we collect
- **Contact details** you give us: your name, email address, phone or WhatsApp number.
- **Travel details** you give us: destinations, dates, number of travellers, preferences, budget and anything else you write in an enquiry.
- **Service-specific details**: for visa and study-abroad enquiries this may include your nationality, the country you plan to visit or study in, and your study level or field. Please do not send passport scans, bank statements or other documents through the website forms; we will tell you how to share them securely if they are needed.
- **Technical information**: basic server logs (such as IP address and browser type) needed to run and protect the website. If you accept analytics cookies, Google Analytics and Meta (Facebook) may collect information about how you use the site. We never send your name, email, phone number or enquiry details to analytics or advertising tools.

## Why we use it
- To reply to your enquiry and prepare quotations.
- To make and manage bookings you ask us to make, which means sharing the necessary details with airlines, hotels, tour operators, insurers and other suppliers.
- To help with visa or study applications you ask us to support.
- To keep records required for accounting and legal purposes.
- To understand how the website is used and improve it, only where you have consented to analytics.

## Who we share it with
We share your information only with suppliers and authorities needed to deliver the service you request, with providers who host our website and database, or where the law requires it. We do not sell your personal information.

## How long we keep it
We keep enquiry and booking records for as long as needed to provide the service and meet legal and accounting obligations, and then delete or anonymise them. [Owner to confirm the retention period.]

## Your rights
Under Uganda's Data Protection and Privacy Act, 2019 you may ask to access, correct or delete the personal information we hold about you, or object to its use. Contact us using the details below. [Legal adviser to confirm registration and other obligations under the Act.]

## Cookies and analytics
The website stores a small amount of information in your browser to remember your saved trips and your cookie choice. Analytics and advertising cookies are loaded only if you accept them in the cookie banner. You can change your choice at any time with the "Cookie settings" link in the footer.

## Contact
Email info@altistravels.com or call +256 774 497 295.`
    }
  },
  {
    key: 'policy_terms',
    value: {
      title: 'Terms and Conditions',
      updated: '2026-10-22',
      approved: false,
      note: POLICY_NOTE,
      body: `## About these terms
These terms apply when you use the Altis Voyage website or ask Altis Voyage Travel Services Ltd to arrange travel services for you.

## Enquiries are not bookings
Submitting a form, sending a WhatsApp message or saving a package to "My Trip" is an **enquiry**. It does not reserve seats, rooms, permits or any other service, and it does not create a contract. A booking is confirmed only when our team confirms it to you in writing after you have accepted a quotation and agreed the payment terms.

## Prices and availability
Prices shown on the website are indicative "from" prices. Final prices depend on travel dates, availability, the number of travellers, supplier rates, taxes and exchange rates, and are confirmed in your written quotation. Flight fares and availability are guaranteed only once a ticket has been issued by the airline or an authorised supplier.

## Visa and study assistance
We help prepare and review visa and study applications. Decisions on visas, admissions and scholarships are made solely by the relevant governments, embassies, institutions and scholarship providers. We cannot guarantee any outcome. Fees paid to third parties are generally non-refundable if an application is refused.

## Your responsibilities
You are responsible for giving accurate information, holding a valid passport and any required visas, vaccinations and travel documents, and checking requirements with official sources before you travel.

## Suppliers
Flights, accommodation, tours and insurance are provided by third-party suppliers under their own terms. We share the key conditions with your quotation.

## Payments, changes and cancellations
Payment terms, deadlines and cancellation conditions are set out in your quotation and in our Refund and Cancellation Policy. [Owner to confirm.]

## Liability
[Owner and legal adviser to define the limits of liability that apply under Ugandan law.]

## Governing law
These terms are governed by the laws of the Republic of Uganda. [Legal adviser to confirm.]

## Contact
Email info@altistravels.com or call +256 774 497 295.`
    }
  },
  {
    key: 'policy_refund',
    value: {
      title: 'Refund and Cancellation Policy',
      updated: '2026-10-22',
      approved: false,
      note: 'Altis Voyage has not yet approved specific cancellation charges or refund timelines. Until it does, the conditions that apply to your booking are the ones stated in your written quotation.',
      body: `## Enquiries
Sending an enquiry is free and creates no obligation. You can withdraw an enquiry at any time before you accept a quotation.

## Confirmed bookings
Once a booking is confirmed, cancellation and change conditions depend on the suppliers involved, such as airlines, hotels, lodges, permit authorities and tour operators. Many airline tickets, gorilla permits and promotional rates are partly or fully non-refundable. The conditions that apply to your trip are stated in your quotation before you pay.

## Our service fees
[Owner to confirm whether Altis Voyage service or consultation fees are refundable, and under what conditions.]

## Visa and application fees
Government, embassy, visa centre and application fees are paid to third parties and are generally non-refundable, including when an application is refused.

## How to cancel
Contact us in writing at info@altistravels.com or on WhatsApp at +256 774 497 295 with your booking reference. We will confirm what can be refunded under the supplier conditions.

## Refund timelines
[Owner to confirm how and how quickly approved refunds are paid.]`
    }
  }
];

// One-off changes to content that already exists in production. Each runs once and is recorded
// in the `_applied_upgrades` site content key, so later admin edits are never overwritten.
// `apply` returns the new value, or null to leave the current value alone.
export const CONTENT_UPGRADES = [
  {
    id: '2026-10-contact',
    key: 'contact',
    // The owner confirmed the WhatsApp/phone number and the full office address in October 2026.
    apply: (current) => ({ ...(current || {}), ...CONTACT })
  },
  {
    id: '2026-10-hero',
    key: 'hero',
    // Replaces only the original starter headline; a headline edited in the dashboard is kept.
    apply: (current) => (current && current.title !== 'From Uganda to the World' ? null : { ...(current || {}), ...HERO })
  }
];

export const FAQS = [
  { category: 'booking', sort_order: 1, question: 'How does booking with Altis Voyage work?', answer: 'Choose a package or service and send us a request with your dates, travellers and budget. A consultant checks availability and sends you a written quotation. Your trip is booked only after you accept the quotation and our team confirms it in writing.' },
  { category: 'booking', sort_order: 2, question: 'Is my trip confirmed when I submit a request?', answer: 'No. A request is an enquiry, not a reservation. You receive a reference number so you can follow up, and our team contacts you with options. Nothing is reserved until we confirm the booking with you in writing.' },
  { category: 'booking', sort_order: 3, question: 'How quickly will you reply?', answer: 'We aim to reply within one working day. Our office hours are Monday to Saturday, 8:30 to 18:00 East Africa Time.' },
  { category: 'booking', sort_order: 4, question: 'Are the prices on the website final?', answer: 'No. Package prices are indicative "from" prices. The final price depends on your dates, availability, the number of travellers and supplier rates, and is confirmed in your quotation.' },
  { category: 'general', sort_order: 5, question: 'Can I contact you on WhatsApp?', answer: 'Yes. Use any WhatsApp button on the website to start a chat with our team, or message +256 774 497 295. You can also use the enquiry forms, call or email us.' },
  { category: 'flights', sort_order: 6, question: 'Do you show live flight prices?', answer: 'No. We check fares and availability with airlines and authorised suppliers after you send your request, then send you the options. A fare is guaranteed only once the ticket is issued.' },
  { category: 'flights', sort_order: 7, question: 'What do you need to quote a flight?', answer: 'Your departure and destination cities, travel dates, whether the trip is one-way or return, the number of travellers and your preferred travel class. Names exactly as they appear in each passport are needed when we book.' },
  { category: 'visa', sort_order: 8, question: 'Can you guarantee my visa?', answer: 'No. We help you prepare and review your application, but visa decisions are made only by the relevant embassy or immigration authority. No agency can guarantee approval.' },
  { category: 'visa', sort_order: 9, question: 'Where can I check the official visa requirements?', answer: 'Always check the official website of the embassy, consulate or immigration authority of the country you plan to visit. Requirements, fees and processing times change, and the official source takes priority over any guidance we give.' },
  { category: 'visa', sort_order: 10, question: 'Which documents will I need?', answer: 'It depends on the country and visa type. Commonly requested documents include a passport valid for at least six months, recent photographs, proof of funds, accommodation or invitation details and a flight reservation. We give you a checklist for your specific application.' },
  { category: 'study', sort_order: 11, question: 'Do you guarantee admission or scholarships?', answer: 'No. Admission and scholarship decisions are made by the institutions and scholarship providers. We help you find suitable options and prepare complete applications.' },
  { category: 'study', sort_order: 12, question: 'How can you help with studying abroad?', answer: 'We can help you compare study destinations and courses, prepare your application documents, keep track of deadlines and prepare your student visa application.' },
  { category: 'payments', sort_order: 13, question: 'How do I pay?', answer: 'We do not take payments on this website. Payment details and deadlines are included in your written quotation, and our team confirms them with you directly.' },
  { category: 'payments', sort_order: 14, question: 'What if I need to cancel?', answer: 'Cancellation conditions depend on the airlines, hotels and other suppliers in your booking, and are stated in your quotation before you pay. See our Refund and Cancellation Policy for details.' }
];

// Starter articles are seeded as unpublished drafts. Nothing here is shown publicly until the
// owner reviews and publishes it in the dashboard.
export const POSTS = [
  {
    slug: 'how-to-prepare-your-travel-enquiry',
    title: 'How to prepare your travel enquiry for a faster, more accurate quote',
    excerpt: 'The details our consultants need to put together the right options for you, first time.',
    category: 'Travel planning',
    tags: 'planning, quotations',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
    image_alt: 'Kampala city skyline at dusk',
    author: 'Altis Voyage team',
    sources: '',
    published: 0,
    body: `A complete enquiry means we can check availability and send you real options without a long back-and-forth. Here is what helps most.

## Your dates, and how flexible they are
Tell us your preferred departure and return dates and whether you can move them by a few days. Flexible dates often open up better fares and room availability.

## Who is travelling
Let us know the number of adults, children and infants. Children's ages matter for flights, hotel rooms and some activities.

## Your budget
A rough budget helps us recommend the right hotels, airlines and activities. It is not a commitment.

## Passports and visas
Check that every traveller's passport is valid for at least six months after your return date, and tell us your nationality so we can advise on visa requirements. Always confirm visa requirements on the official government website of the country you plan to visit.

## What happens next
You receive a reference number as soon as you submit your request. A consultant reviews it and contacts you with options and a written quotation. Nothing is booked until you accept the quotation and our team confirms it.`
  },
  {
    slug: 'gorilla-trekking-packing-list',
    title: 'What to pack for a gorilla trek in Uganda',
    excerpt: 'Practical clothing and gear for a day on the forest trails of Bwindi or Mgahinga.',
    category: 'Destination guides',
    tags: 'uganda, gorillas, packing',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    image_alt: 'Dense green rainforest on a hillside in western Uganda',
    author: 'Altis Voyage team',
    sources: 'Uganda Wildlife Authority | https://ugandawildlife.org',
    published: 0,
    body: `Gorilla trekking means walking on steep, muddy forest trails, sometimes for several hours. Packing well makes the day far more comfortable.

## Clothing
- Long-sleeved shirt and long trousers to protect against nettles and insects
- A lightweight waterproof jacket, since rain is possible in any month
- Comfortable, broken-in hiking boots with good grip
- Gardening or similar gloves for gripping branches

## Gear
- A small daypack with a rain cover
- Drinking water and snacks for the day
- A camera with spare batteries (flash photography is not allowed near the gorillas)
- Insect repellent and sunscreen

## Documents
- Your passport and gorilla permit. Permits are issued by the Uganda Wildlife Authority and must be booked in advance; we arrange them as part of a confirmed package.

## Before you go
Check current park rules, permit conditions and health requirements with the Uganda Wildlife Authority and your doctor before travelling.`
  }
];
