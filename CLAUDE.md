# Baan Sawan — Property Listing Page

## What This Is

Single-page bilingual (EN/TH) property listing for a two-bedroom villa in Old Town, Koh Lanta, Thailand. Built for a real estate agent to share with prospective buyers.

## Tech Stack

- **Tailwind CSS** via Play CDN (no build step)
- **Alpine.js 3** via CDN — reactivity, language toggle, form state, gallery
- **Keen Slider 6** via CDN — image gallery carousel
- **PHP `mail()`** — contact form email delivery (self-hosted server with mail server)
- **Google Fonts** — Playfair Display (headings) + Inter (body)

No build tools. No npm. Just open `index.html` in a browser. Contact form requires a PHP server.

## File Map

```
index.html          — The entire page (all sections, CDN links, Tailwind config)
lang.json           — ALL text content lives here (en + th). Edit this to change any text.
js/app.js           — Alpine stores & components (lang, scrollReveal, gallery, droneVideo, contactForm)
css/custom.css      — Theme overrides only (colors, animations, slider styles)
php/send-mail.php   — Contact form handler (validates, sanitizes, sends via mail())
images/             — Property photos (user-supplied, referenced in js/app.js gallery images array)
video/              — Drone video (user-supplied, referenced as video/drone.mp4)
```

## Architecture Decisions

- **All translatable text is in `lang.json`** — never hardcode display text in HTML. Use `$store.lang.t('key_name')` via Alpine's `x-text` binding.
- **Gallery slides are built programmatically in JS** (not Alpine `x-for`) because Keen Slider needs direct DOM control. Image data lives in the `gallery` component's `images` object in `js/app.js`.
- **Script loading order matters**: Keen Slider JS → `app.js` (registers Alpine stores) → Alpine.js (deferred, auto-inits last).
- **Color palette** is defined as Tailwind custom colors under `earth.*` in the inline `tailwind.config` in `index.html`.

## Color Palette

| Token              | Hex       | Usage                    |
|--------------------|-----------|--------------------------|
| `earth-bg`         | `#FAF6F1` | Page background          |
| `earth-text`       | `#3D3229` | Primary text             |
| `earth-accent`     | `#C4956A` | CTAs, highlights         |
| `earth-secondary`  | `#8B7355` | Subtitles, body text     |
| `earth-pill`       | `#E8DDD3` | Badge/pill backgrounds   |
| `earth-pill-text`  | `#6B5744` | Badge/pill text          |

## Page Sections (in order)

1. **Language Toggle** — sticky top-right pill (EN/ไทย)
2. **Hero** — full-viewport, placeholder gradient bg (replace with real image via CSS)
3. **Property Overview** — info pills + 3 description paragraphs
4. **Image Gallery** — Keen Slider with Interior/Exterior/Surroundings tabs + lightbox
5. **Drone Video** — lazy-loaded self-hosted MP4 with play/mute controls
6. **Property Details** — 2x2 card grid (Location, Condition, Nearby, Price)
7. **Location Map** — Google Maps iframe (coords: 7.5361, 99.7503)
8. **Contact** — form (posts to PHP) + WhatsApp + LINE buttons
9. **Footer** — property name, agent, copyright

## How To Update Content

### Text: Edit `lang.json`
All display text (both languages) is in `lang.json`. Change values there, page updates automatically.

### Images: Update `js/app.js`
Gallery images are defined in the `images` object inside the `gallery` Alpine component (~line 54 of `app.js`). Update `src` paths to match your actual filenames in `images/`.

### Hero background: Edit `index.html` or `css/custom.css`
The hero uses class `hero-placeholder-bg` (a CSS gradient). To use a real photo, either:
- Add `style="background-image: url('images/hero.jpg'); background-size: cover; background-position: center;"` to the hero `<section>`
- Or replace the `.hero-placeholder-bg` rule in `css/custom.css`

### Contact details: Update these placeholders before going live
- `php/send-mail.php` line 52: `agent@example.com` → real recipient email
- `php/send-mail.php` line 61: `noreply@example.com` → real sender domain
- `index.html` line 404: `https://wa.me/66XXXXXXXXX` → real WhatsApp number
- `index.html` line 413: `https://line.me/ti/p/~PLACEHOLDER` → real LINE ID
- `lang.json`: search `"Agent Name"` and `"ชื่อเอเจนต์"` → real agent name

## Conventions

- Use Tailwind utility classes for styling. Only add to `css/custom.css` for things Tailwind can't do (animations, pseudo-elements, third-party overrides).
- All user-facing strings go in `lang.json` with both `en` and `th` translations.
- Alpine components are registered in `js/app.js` inside the `alpine:init` event listener.
- Keep it a single page — no routing, no SPA framework.
