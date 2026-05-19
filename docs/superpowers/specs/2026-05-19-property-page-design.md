# Baan Sawan — Property Listing Page Design Spec

## Overview

A single-page, bilingual (EN/TH) property listing website for a two-bedroom villa in Old Town, Koh Lanta, Thailand. The page will be used by a real estate agent to share with prospective buyers. The property needs some renovation and is being sold as-is.

## Stack

- **Tailwind CSS** — via Play CDN (no build step)
- **Alpine.js** — via CDN, for reactivity (language toggle, mobile interactions, form state)
- **Keen Slider** — via CDN, for image galleries
- **PHP `mail()`** — for contact form email delivery (self-hosted server with mail server)
- **Google Fonts** — Playfair Display (headings) + Inter (body)

## File Structure

```
/
├── index.html            — Single page, all CDN links
├── lang.json             — All translatable text (en/th keys)
├── css/
│   └── custom.css        — Earthy theme overrides, fonts, animations
├── js/
│   └── app.js            — Alpine stores, Keen Slider init, form handling
├── php/
│   └── send-mail.php     — Receives form POST, validates, sends email
├── images/               — Property photos (added later by user)
│   └── placeholder.jpg
└── video/                — Drone video (added later by user)
    └── placeholder.mp4
```

## Color Palette (Warm & Earthy)

| Role        | Color     | Usage                              |
|-------------|-----------|-------------------------------------|
| Background  | `#FAF6F1` | Page background, warm off-white    |
| Text        | `#3D3229` | Primary text, dark brown           |
| Accent      | `#C4956A` | CTA buttons, highlights, terracotta|
| Secondary   | `#8B7355` | Subheadings, muted brown           |
| Pill BG     | `#E8DDD3` | Badge/pill backgrounds             |
| Pill Text   | `#6B5744` | Badge/pill text                    |
| WhatsApp    | `#25D366` | WhatsApp button                    |
| LINE        | `#06C755` | LINE button                        |

## Page Sections (top to bottom)

### 1. Hero Section
- Full-viewport background image (placeholder for now; will be a drone/exterior shot)
- Property name "Baan Sawan" (บ้านสวรรค์) centered, large, with subtle text shadow
- Tagline: "A two-bedroom villa in Old Town, Koh Lanta"
- Language toggle (EN | ไทย) — sticky pill, top-right corner, persists on scroll
- Animated scroll-down chevron indicator at bottom

### 2. Property Overview — Info Pills
- Horizontally scrollable row of rounded pill badges on mobile, flex-wrap on desktop:
  - 2 Bedrooms | 2 Bathrooms | XXX sqm Living | XXX sqm Land | Year Built: 20XX | Freehold/Leasehold
- Below pills: 2-3 short paragraphs describing the property, condition ("renovation opportunity"), and Old Town location appeal
- All text sourced from `lang.json`

### 3. Image Gallery
- Keen Slider carousel, full-width
- Category tabs above: "Interior" | "Exterior" | "Surroundings"
- Clicking a tab filters slides (destroys and reinitializes slider with filtered image set)
- Thumbnail strip below as a second synced Keen Slider
- Click-to-open lightbox: Alpine-controlled full-screen overlay with close button and arrow navigation
- Swipe on mobile, arrow buttons on desktop

### 4. Drone Video
- Full-width cinematic section
- Self-hosted `<video>` with `playsinline muted loop` attributes
- Lazy-loaded via Intersection Observer (only loads when scrolled into view)
- Play/unmute button overlay controlled by Alpine.js
- Subtle fixed-background or parallax effect behind the video

### 5. Property Details
- Two-column grid (stacks to single column on mobile) with icons:
  - Location & area details
  - Property condition / renovation notes
  - Nearby amenities (beaches, restaurants, schools)
  - Pricing: "Contact for price" or placeholder price
- All text from `lang.json`

### 6. Location / Map
- Embedded Google Maps iframe centered on Old Town, Koh Lanta
- Fallback: static map image with "View on Google Maps" link

### 7. Contact Section
- **Contact form** with fields: Name, Email, Phone, Message
  - Submits via `fetch()` POST to `php/send-mail.php` (JSON body)
  - Alpine.js manages form state: idle, loading, success, error
  - Inline success/error messages (no page reload)
  - Honeypot hidden field for basic spam prevention
- **Action buttons** below/beside the form:
  - WhatsApp button (green `#25D366`) — links to `https://wa.me/66XXXXXXXXX`
  - LINE button (green `#06C755`) — links to `https://line.me/ti/p/~PLACEHOLDER`
  - Both open respective apps on mobile, web versions on desktop
- Agent name/photo placeholder area

### 8. Footer
- Minimal: property name, "Listed by [Agent Name]", copyright year

## Bilingual System (EN/TH)

### `lang.json` structure:
```json
{
  "en": {
    "hero_title": "Baan Sawan",
    "hero_tagline": "A two-bedroom villa in Old Town, Koh Lanta",
    "nav_interior": "Interior",
    ...
  },
  "th": {
    "hero_title": "บ้านสวรรค์",
    "hero_tagline": "วิลล่าสองห้องนอนในโอลด์ทาวน์ เกาะลันตา",
    "nav_interior": "ภายใน",
    ...
  }
}
```

### How it works:
- Alpine.js global store holds current language key (`en` or `th`)
- `lang.json` fetched once on page load, cached in the store
- All translatable elements use `x-text` bindings reading from the store
- Toggle pill switches the language key; all text updates reactively
- Subtle fade transition on text change via Alpine `x-transition`

## Contact Form (PHP)

### `send-mail.php` behavior:
- Accepts POST with JSON body: `{ name, email, phone, message, honeypot }`
- If honeypot field is non-empty, silently returns success (bot trap)
- Validates: name and email required, email format check, basic sanitization
- Sends email via PHP `mail()` to placeholder recipient address
- Returns JSON: `{ "success": true }` or `{ "success": false, "error": "message" }`
- Sets appropriate CORS headers for same-origin requests

## Responsive Strategy

- **Mobile-first** using Tailwind breakpoints (`sm`, `md`, `lg`)
- Hero: full viewport on all sizes
- Info pills: horizontal scroll on mobile, flex-wrap on desktop
- Gallery: full-width swipe on mobile, arrow buttons visible on desktop
- Two-column sections: stack to single column on mobile
- Contact buttons: full-width stacked on mobile, side-by-side on desktop
- Sticky language toggle always accessible

## Placeholder Content

All text, measurements, prices, phone numbers, and email addresses are placeholders stored in `lang.json`. The user will replace these with real values before publishing. Image and video directories contain placeholder files that the user will replace with actual property media.
