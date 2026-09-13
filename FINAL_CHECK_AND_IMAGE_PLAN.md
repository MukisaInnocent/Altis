# Final Check and Image Plan

Checked: 13 September 2026

## Release status

The completed CMS, enquiry, navigation, footer, and image-deletion work is ready to deploy. The production frontend bundle has been generated. The backend must be restarted after deployment so its database migrations and the new default page sections are loaded.

| Area | Result | Verification |
| --- | --- | --- |
| Protected image deletion | Complete | Deleting a published image returned HTTP 409 in an isolated API test. An unused image deleted successfully. |
| CMS page content | Complete | A fresh database loaded 28 published page sections, including Honeymoon, Corporate Travel, Airport Transfers, Travel Insurance, Family Reunification, Why Choose Us, Gallery, FAQ, Privacy, and Terms. |
| Public pages | Complete | All 17 checked public routes returned HTTP 200 from the production build. |
| Travel Resources | Complete | Individual published post URLs work; an unknown post correctly returned HTTP 404. |
| Enquiry details | Complete | WhatsApp number, service, destination, travel and return dates, and traveller count were saved correctly. |
| Admin workflow | Complete | Page Sections are grouped by page, have live-page links, and Media shows live/draft/unused image usage. |
| Footer, CTA, navigation | Complete | Footer credit, registration number, and default CTA content are editable; the frontend includes scroll-to-top and Show more controls. |

## Important deployment step

1. Deploy the updated backend source and `backend/frontend/dist` folder.
2. Restart the backend process.
3. Hard-refresh the browser or clear the old service-worker cache.
4. In Admin, open Page Sections and review the new default wording before editing or publishing custom content.
5. Change the initial Admin password before public launch. The default account is created only for a new database and must not remain in use on a live site.

## Visual-content finding

The current library has 16 visible assets: 3 raster images and 13 SVG illustrations. This is enough for the application to function, but it is not enough for a premium travel website. Travel visitors need to see destinations, experiences, accommodation, people, and moments before they read long descriptions.

The next release should be a focused image-content release. It should use real, licensed photography - not randomly downloaded internet images - and retain the current CMS media workflow.

## Image-content target

Build a launch library of at least 60 high-quality travel photographs, plus the logo and any small decorative SVGs. Avoid reusing one image across many unrelated pages.

| Collection | Target | Where it appears |
| --- | ---: | --- |
| Hero images | 6 | Home, About, Services, Contact, Gallery, and seasonal campaigns |
| Destination images | 12 | Destination cards and destination detail pages |
| Tour and experience images | 12 | Safari, gorilla trekking, Nile adventure, beach, city, honeymoon, and multi-country packages |
| Service images | 8 | Flight support, visas, hotels, insurance, transfers, corporate travel, family reunification, and cargo/study travel |
| Gallery images | 16 | Gallery grid, social posts, and campaign content |
| Trust and team images | 6 | About page, office/team, client support, airport transfer, and planning moments |
| **Total** | **60** | **A visually credible starting library** |

## Recommended subject list

Prioritise Uganda and the journeys Altis Voyage actually sells:

- Bwindi gorilla trekking, Queen Elizabeth game drives, Jinja/Nile rafting, and Ssese Island beach scenes.
- Airport arrival and transfer moments, with consent from visible people.
- A mix of international travel: Dubai skyline/desert, Paris city scenes, Bali beach/culture, Santorini sunsets.
- Couples and honeymoon moments, families travelling together, and business travellers in airport or meeting settings.
- Hotel rooms, safari lodges, beach stays, aircraft/interior details, passports or luggage used tastefully, and travel-planning conversations.

## Technical image standards

- Prefer WebP or high-quality JPEG; do not rely on SVGs for photography.
- Hero image: at least 2400 x 1350 pixels, 16:9, under 700 KB after optimisation.
- Card image: at least 1600 x 1200 pixels, 4:3, under 350 KB after optimisation.
- Gallery image: at least 1600 pixels on the long side; include a small mix of portrait images.
- Use descriptive filenames such as `bwindi-gorilla-trek.webp`, not camera filenames.
- Add meaningful alt text in Media for every image.
- Obtain images from Altis Voyage, contracted photographers, licensed stock libraries, suppliers with written permission, or clearly approved generated imagery. Keep the licence/source record outside the public site.

## CMS and layout plan

### Phase 1 - Prepare the image library

1. Create a `services` media category alongside hero, destinations, tours, gallery, and about.
2. Upload the initial 60 optimised images through Admin, organised by category.
3. Add alt text, captions where useful, and confirm each uploaded image is visible.
4. Assign one primary image to every destination, tour, and service before publishing it.

### Phase 2 - Make images visible where they matter

1. Keep a strong primary visual on every page hero.
2. Add images to the Services listing cards; service records already support an image selection, but the listing layout needs to render those selected images.
3. Use one gallery of 8-12 related images on the most visual journeys, such as gorilla trekking, honeymoon trips, and safari packages.
4. Add a small image strip or two supporting images to travel articles; do not use text-only resource posts for visual destinations.
5. Use real team, office, and planning photographs on About to build trust.

### Phase 3 - Quality control

1. Check every image on desktop and mobile for cropping, readable text overlays, loading speed, and accurate alt text.
2. Do not hide or delete an image that is marked "Used on live site" until its replacement is assigned and published.
3. Check image rights and destination accuracy before publishing.
4. Review the Gallery every three months and replace weak, repetitive, or outdated images.

## Definition of done for the image release

The image release is complete when every public destination, tour, service, and key company page has a deliberate primary image; the public Gallery has at least 16 good images; the homepage has several strong visual entry points; all images have alt text; and the site remains fast on mobile.
