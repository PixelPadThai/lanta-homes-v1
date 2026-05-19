# Baan Sawan Property Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, bilingual (EN/TH) property listing for a two-bedroom villa in Old Town, Koh Lanta, Thailand.

**Architecture:** One HTML page with Tailwind CSS (CDN), Alpine.js (CDN) for reactivity, Keen Slider (CDN) for image galleries, and a PHP mailer for the contact form. All translatable text lives in a `lang.json` file. No build tools required.

**Tech Stack:** Tailwind CSS (Play CDN), Alpine.js 3 (CDN), Keen Slider 6 (CDN), PHP `mail()`, Google Fonts (Playfair Display + Inter)

**Note:** This is a static frontend project with no test framework. Each task uses browser verification instead of automated tests.

---

## File Structure

```
/
├── index.html              — Single page, CDN links, all sections
├── lang.json               — Bilingual text content (en/th)
├── css/
│   └── custom.css          — Theme overrides, animations, custom styles
├── js/
│   └── app.js              — Alpine stores/components, Keen Slider init
├── php/
│   └── send-mail.php       — Contact form email handler
├── images/                 — Property photos (user adds later)
└── video/                  — Drone video (user adds later)
```

---

## Task 1: Project Scaffolding & Base HTML

**Files:**
- Create: `index.html`
- Create: `css/custom.css` (empty placeholder)
- Create: `js/app.js` (empty placeholder)
- Create: `images/` directory
- Create: `video/` directory

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p css js php images video
```

- [ ] **Step 2: Create `index.html` with CDN links and Tailwind config**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Baan Sawan — Villa in Old Town, Koh Lanta</title>
    <meta name="description" content="Two-bedroom villa for sale in Old Town, Koh Lanta, Thailand. A renovation opportunity in one of Lanta's most charming neighborhoods.">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        earth: {
                            bg: '#FAF6F1',
                            text: '#3D3229',
                            accent: '#C4956A',
                            secondary: '#8B7355',
                            pill: '#E8DDD3',
                            'pill-text': '#6B5744',
                        }
                    },
                    fontFamily: {
                        heading: ['"Playfair Display"', 'serif'],
                        body: ['"Inter"', 'sans-serif'],
                    }
                }
            }
        }
    </script>

    <!-- Keen Slider CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/keen-slider@6/keen-slider.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/custom.css">
</head>
<body class="bg-earth-bg text-earth-text font-body" x-data>

    <!-- Sections will be added here by subsequent tasks -->

    <!-- Keen Slider JS -->
    <script src="https://cdn.jsdelivr.net/npm/keen-slider@6/keen-slider.min.js"></script>
    <!-- App JS (registers Alpine stores/components before Alpine inits) -->
    <script src="js/app.js"></script>
    <!-- Alpine.js (must be last — auto-inits after app.js registers stores) -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create empty `css/custom.css`**

```css
/* Custom styles — populated in Task 3 */
```

- [ ] **Step 4: Create empty `js/app.js`**

```js
// Alpine stores and components — populated in Task 2
```

- [ ] **Step 5: Verify and commit**

Open `index.html` in a browser. The page should load with a warm off-white background (`#FAF6F1`) and no errors in the console.

```bash
git add index.html css/custom.css js/app.js
git commit -m "feat: scaffold project with base HTML and CDN links"
```

---

## Task 2: Language System

**Files:**
- Create: `lang.json`
- Modify: `js/app.js`

- [ ] **Step 1: Create `lang.json` with all translatable content**

```json
{
  "en": {
    "lang_toggle": "ไทย",
    "hero_title": "Baan Sawan",
    "hero_tagline": "A Two-Bedroom Villa in Old Town, Koh Lanta",
    "pill_bedrooms": "2 Bedrooms",
    "pill_bathrooms": "2 Bathrooms",
    "pill_living": "120 sqm Living",
    "pill_land": "200 sqm Land",
    "pill_year": "Built 2018",
    "pill_ownership": "Leasehold",
    "overview_title": "Property Overview",
    "overview_p1": "Nestled in the charming Old Town of Koh Lanta, Baan Sawan is a spacious two-bedroom villa offering a rare opportunity for those seeking a peaceful island retreat. The property features an open-plan living area, a modern kitchen, and generous outdoor space surrounded by tropical greenery.",
    "overview_p2": "While the villa has been unoccupied for some time and would benefit from cosmetic updates — fresh paint, minor repairs, and some TLC — the bones of the property are solid and well-constructed. This is an ideal opportunity for a buyer looking to add their personal touch at a competitive price.",
    "overview_p3": "Old Town is one of Koh Lanta's most sought-after areas, known for its authentic Thai-Chinese shophouses, waterfront restaurants, and vibrant local culture. Just minutes from pristine beaches and everyday amenities.",
    "gallery_title": "Gallery",
    "gallery_interior": "Interior",
    "gallery_exterior": "Exterior",
    "gallery_surroundings": "Surroundings",
    "video_title": "Aerial View",
    "video_subtitle": "Explore the surroundings from above",
    "details_title": "Property Details",
    "details_location_title": "Location",
    "details_location_text": "Old Town, Koh Lanta, Krabi Province, Thailand. A peaceful area with easy access to local markets, restaurants, and the pier. Approximately 20 minutes from Lanta's best beaches.",
    "details_condition_title": "Condition",
    "details_condition_text": "The villa is structurally sound but requires cosmetic renovation. Interior and exterior painting, minor fixture updates, and garden maintenance are recommended. Sold as-is at a price reflecting the property's current state.",
    "details_amenities_title": "Nearby",
    "details_amenities_text": "Old Town walking street, waterfront seafood restaurants, local markets, Lanta Community Hospital, schools, 7-Eleven, ATMs. Ferry pier within walking distance.",
    "details_price_title": "Price",
    "details_price_text": "Contact for pricing",
    "map_title": "Location",
    "contact_title": "Interested?",
    "contact_subtitle": "Get in touch to arrange a viewing or ask any questions",
    "contact_name": "Your Name",
    "contact_email": "Email Address",
    "contact_phone": "Phone Number",
    "contact_message": "Message",
    "contact_send": "Send Message",
    "contact_sending": "Sending...",
    "contact_success": "Thank you! Your message has been sent. We'll get back to you soon.",
    "contact_error": "Something went wrong. Please try again or contact us directly.",
    "contact_whatsapp": "Chat on WhatsApp",
    "contact_line": "Chat on LINE",
    "contact_agent": "Listed by",
    "contact_agent_name": "Agent Name",
    "footer_rights": "All rights reserved.",
    "footer_listed_by": "Listed by"
  },
  "th": {
    "lang_toggle": "EN",
    "hero_title": "บ้านสวรรค์",
    "hero_tagline": "วิลล่าสองห้องนอนในโอลด์ทาวน์ เกาะลันตา",
    "pill_bedrooms": "2 ห้องนอน",
    "pill_bathrooms": "2 ห้องน้ำ",
    "pill_living": "120 ตร.ม. พื้นที่ใช้สอย",
    "pill_land": "200 ตร.ม. ที่ดิน",
    "pill_year": "สร้างปี 2561",
    "pill_ownership": "สิทธิ์เช่า",
    "overview_title": "ภาพรวมทรัพย์สิน",
    "overview_p1": "บ้านสวรรค์ตั้งอยู่ในย่านโอลด์ทาวน์อันมีเสน่ห์ของเกาะลันตา เป็นวิลล่าสองห้องนอนกว้างขวาง เหมาะสำหรับผู้ที่มองหาที่พักอาศัยบนเกาะอันเงียบสงบ มีพื้นที่นั่งเล่นแบบเปิดโล่ง ครัวทันสมัย และพื้นที่กลางแจ้งกว้างขวางล้อมรอบด้วยพรรณไม้เขตร้อน",
    "overview_p2": "วิลล่าไม่ได้มีผู้อยู่อาศัยมาระยะหนึ่งและต้องการการปรับปรุงเล็กน้อย เช่น ทาสีใหม่ ซ่อมแซมเล็กน้อย แต่โครงสร้างยังแข็งแรงและก่อสร้างอย่างดี เหมาะสำหรับผู้ซื้อที่ต้องการตกแต่งตามสไตล์ของตัวเองในราคาที่คุ้มค่า",
    "overview_p3": "โอลด์ทาวน์เป็นหนึ่งในย่านที่เป็นที่ต้องการมากที่สุดของเกาะลันตา ขึ้นชื่อเรื่องตึกแถวไทย-จีน ร้านอาหารริมน้ำ และวัฒนธรรมท้องถิ่นที่มีชีวิตชีวา อยู่ห่างจากชายหาดและสิ่งอำนวยความสะดวกเพียงไม่กี่นาที",
    "gallery_title": "แกลเลอรี",
    "gallery_interior": "ภายใน",
    "gallery_exterior": "ภายนอก",
    "gallery_surroundings": "บริเวณโดยรอบ",
    "video_title": "มุมมองทางอากาศ",
    "video_subtitle": "สำรวจบริเวณโดยรอบจากมุมสูง",
    "details_title": "รายละเอียดทรัพย์สิน",
    "details_location_title": "ที่ตั้ง",
    "details_location_text": "โอลด์ทาวน์ เกาะลันตา จังหวัดกระบี่ ประเทศไทย พื้นที่เงียบสงบ เดินทางสะดวกไปยังตลาด ร้านอาหาร และท่าเรือ ห่างจากชายหาดที่ดีที่สุดของลันตาประมาณ 20 นาที",
    "details_condition_title": "สภาพ",
    "details_condition_text": "วิลล่ามีโครงสร้างแข็งแรง แต่ต้องการการปรับปรุงด้านความสวยงาม แนะนำให้ทาสีภายในและภายนอก ปรับปรุงอุปกรณ์เล็กน้อย และดูแลสวน ขายตามสภาพในราคาที่สะท้อนสถานะปัจจุบัน",
    "details_amenities_title": "สถานที่ใกล้เคียง",
    "details_amenities_text": "ถนนคนเดินโอลด์ทาวน์ ร้านอาหารทะเลริมน้ำ ตลาดท้องถิ่น โรงพยาบาลชุมชนลันตา โรงเรียน เซเว่นอีเลฟเว่น ตู้เอทีเอ็ม ท่าเรือเฟอร์รี่อยู่ในระยะเดินถึง",
    "details_price_title": "ราคา",
    "details_price_text": "ติดต่อสอบถามราคา",
    "map_title": "ที่ตั้ง",
    "contact_title": "สนใจไหม?",
    "contact_subtitle": "ติดต่อเพื่อนัดชมหรือสอบถามข้อมูลเพิ่มเติม",
    "contact_name": "ชื่อ",
    "contact_email": "อีเมล",
    "contact_phone": "เบอร์โทรศัพท์",
    "contact_message": "ข้อความ",
    "contact_send": "ส่งข้อความ",
    "contact_sending": "กำลังส่ง...",
    "contact_success": "ขอบคุณ! ข้อความของคุณถูกส่งเรียบร้อยแล้ว เราจะติดต่อกลับโดยเร็ว",
    "contact_error": "เกิดข้อผิดพลาด กรุณาลองอีกครั้งหรือติดต่อเราโดยตรง",
    "contact_whatsapp": "แชทผ่าน WhatsApp",
    "contact_line": "แชทผ่าน LINE",
    "contact_agent": "ลงประกาศโดย",
    "contact_agent_name": "ชื่อเอเจนต์",
    "footer_rights": "สงวนลิขสิทธิ์",
    "footer_listed_by": "ลงประกาศโดย"
  }
}
```

- [ ] **Step 2: Add Alpine language store to `js/app.js`**

Replace the entire contents of `js/app.js` with:

```js
document.addEventListener('alpine:init', () => {

    // ── Language Store ──────────────────────────────────────────
    Alpine.store('lang', {
        current: 'en',
        data: {},

        async init() {
            try {
                const res = await fetch('lang.json');
                this.data = await res.json();
            } catch (e) {
                console.error('Failed to load translations:', e);
            }
        },

        t(key) {
            return this.data[this.current]?.[key] || key;
        },

        toggle() {
            this.current = this.current === 'en' ? 'th' : 'en';
        }
    });

});
```

- [ ] **Step 3: Verify and commit**

Open `index.html` in a browser. Open the console and run:
```js
Alpine.store('lang').t('hero_title')
// Should return "Baan Sawan"
Alpine.store('lang').toggle()
Alpine.store('lang').t('hero_title')
// Should return "บ้านสวรรค์"
```

```bash
git add lang.json js/app.js
git commit -m "feat: add bilingual language system with Alpine store"
```

---

## Task 3: Custom Theme CSS

**Files:**
- Modify: `css/custom.css`

- [ ] **Step 1: Write the full custom stylesheet**

Replace the entire contents of `css/custom.css` with:

```css
/* ── Base ──────────────────────────────────────────────────── */
html {
    scroll-behavior: smooth;
}

/* ── Hero ──────────────────────────────────────────────────── */
.hero-overlay {
    background: linear-gradient(
        to bottom,
        rgba(61, 50, 41, 0.35) 0%,
        rgba(61, 50, 41, 0.1) 50%,
        rgba(61, 50, 41, 0.55) 100%
    );
}

.hero-placeholder-bg {
    background: linear-gradient(135deg, #8B7355 0%, #C4956A 35%, #D4B896 60%, #87CEEB 100%);
}

/* ── Scroll Indicator ──────────────────────────────────────── */
@keyframes bounce-down {
    0%, 100% {
        transform: translateY(0);
        opacity: 1;
    }
    50% {
        transform: translateY(12px);
        opacity: 0.4;
    }
}

.scroll-indicator {
    animation: bounce-down 2s ease-in-out infinite;
}

/* ── Pills Scroll (hide scrollbar) ─────────────────────────── */
.pills-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.pills-scroll::-webkit-scrollbar {
    display: none;
}

/* ── Keen Slider Overrides ─────────────────────────────────── */
.gallery-slider {
    border-radius: 0.75rem;
    overflow: hidden;
}

.gallery-slider .keen-slider__slide {
    overflow: hidden;
}

.thumb-slider .keen-slider__slide {
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s ease;
}

.thumb-slider .keen-slider__slide:hover,
.thumb-slider .keen-slider__slide.active {
    opacity: 1;
}

/* ── Lightbox ──────────────────────────────────────────────── */
.lightbox-overlay {
    backdrop-filter: blur(4px);
}

/* ── Section Reveal Animation ──────────────────────────────── */
@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(24px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.reveal-hidden {
    opacity: 0;
}

.reveal-visible {
    animation: fade-in-up 0.7s ease-out forwards;
}

/* ── Video Section ─────────────────────────────────────────── */
.video-container video {
    object-fit: cover;
}

.video-placeholder {
    background: linear-gradient(135deg, #3D3229 0%, #8B7355 50%, #C4956A 100%);
}
```

- [ ] **Step 2: Verify and commit**

Refresh `index.html`. No visual changes yet (styles target elements not yet in the DOM), but no CSS errors should appear.

```bash
git add css/custom.css
git commit -m "feat: add custom theme CSS with animations and overrides"
```

---

## Task 4: Hero Section

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add hero section HTML**

In `index.html`, replace the `<!-- Sections will be added here by subsequent tasks -->` comment with:

```html
    <!-- Language Toggle (sticky) -->
    <div class="fixed top-4 right-4 z-50">
        <button
            @click="$store.lang.toggle()"
            class="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-earth-text shadow-lg hover:bg-white transition-all cursor-pointer"
            x-text="$store.lang.t('lang_toggle')"
        ></button>
    </div>

    <!-- Hero Section -->
    <section class="relative h-screen flex items-center justify-center hero-placeholder-bg">
        <div class="hero-overlay absolute inset-0"></div>

        <div class="relative z-10 text-center text-white px-4">
            <h1 class="font-heading text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg"
                x-text="$store.lang.t('hero_title')"></h1>
            <p class="text-lg md:text-2xl font-light tracking-wide drop-shadow-md"
               x-text="$store.lang.t('hero_tagline')"></p>
        </div>

        <!-- Scroll Indicator -->
        <a href="#overview" class="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator text-white/80 hover:text-white transition-colors">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
        </a>
    </section>
```

- [ ] **Step 2: Verify and commit**

Refresh browser. You should see:
- Full-viewport hero with a gradient placeholder background
- "Baan Sawan" centered in large serif text
- Tagline below
- Language toggle pill in the top-right corner
- Bouncing scroll arrow at the bottom
- Clicking the language toggle switches between "ไทย" and "EN" and updates the title/tagline

```bash
git add index.html
git commit -m "feat: add hero section with language toggle"
```

---

## Task 5: Property Overview & Info Pills

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`

- [ ] **Step 1: Add scroll-reveal Alpine component to `js/app.js`**

Add this inside the `alpine:init` listener in `js/app.js`, after the language store:

```js
    // ── Scroll Reveal ───────────────────────────────────────────
    Alpine.data('scrollReveal', () => ({
        revealed: false,

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.revealed = true;
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(this.$el);
        }
    }));
```

- [ ] **Step 2: Add overview section HTML to `index.html`**

Add this directly after the closing `</section>` of the Hero section:

```html
    <!-- Property Overview -->
    <section id="overview" class="py-16 md:py-24 px-4"
             x-data="scrollReveal" :class="revealed ? 'reveal-visible' : 'reveal-hidden'">
        <div class="max-w-5xl mx-auto">
            <!-- Info Pills -->
            <div class="flex gap-3 overflow-x-auto pb-4 pills-scroll md:flex-wrap md:justify-center mb-12">
                <span class="bg-earth-pill text-earth-pill-text px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                      x-text="$store.lang.t('pill_bedrooms')"></span>
                <span class="bg-earth-pill text-earth-pill-text px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                      x-text="$store.lang.t('pill_bathrooms')"></span>
                <span class="bg-earth-pill text-earth-pill-text px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                      x-text="$store.lang.t('pill_living')"></span>
                <span class="bg-earth-pill text-earth-pill-text px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                      x-text="$store.lang.t('pill_land')"></span>
                <span class="bg-earth-pill text-earth-pill-text px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                      x-text="$store.lang.t('pill_year')"></span>
                <span class="bg-earth-pill text-earth-pill-text px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                      x-text="$store.lang.t('pill_ownership')"></span>
            </div>

            <!-- Title -->
            <h2 class="font-heading text-3xl md:text-4xl text-center mb-8"
                x-text="$store.lang.t('overview_title')"></h2>

            <!-- Description -->
            <div class="space-y-4 text-earth-secondary leading-relaxed max-w-3xl mx-auto">
                <p x-text="$store.lang.t('overview_p1')"></p>
                <p x-text="$store.lang.t('overview_p2')"></p>
                <p x-text="$store.lang.t('overview_p3')"></p>
            </div>
        </div>
    </section>
```

- [ ] **Step 3: Verify and commit**

Refresh browser. Scroll past the hero:
- Six pills in a row (horizontally scrollable on mobile, wrapped/centered on desktop)
- "Property Overview" heading
- Three paragraphs of description
- Section fades in when scrolled into view
- Language toggle switches all text

```bash
git add index.html js/app.js
git commit -m "feat: add property overview with info pills and scroll reveal"
```

---

## Task 6: Image Gallery with Keen Slider

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`

- [ ] **Step 1: Add gallery Alpine component to `js/app.js`**

Add this inside the `alpine:init` listener in `js/app.js`, after the scrollReveal component:

```js
    // ── Gallery ─────────────────────────────────────────────────
    Alpine.data('gallery', () => ({
        activeCategory: 'interior',
        lightboxOpen: false,
        lightboxIndex: 0,
        mainSlider: null,
        thumbSlider: null,

        images: {
            interior: [
                { src: 'images/interior-1.jpg', alt: 'Living Room' },
                { src: 'images/interior-2.jpg', alt: 'Kitchen' },
                { src: 'images/interior-3.jpg', alt: 'Bedroom 1' },
                { src: 'images/interior-4.jpg', alt: 'Bedroom 2' },
                { src: 'images/interior-5.jpg', alt: 'Bathroom' },
            ],
            exterior: [
                { src: 'images/exterior-1.jpg', alt: 'Front View' },
                { src: 'images/exterior-2.jpg', alt: 'Garden' },
                { src: 'images/exterior-3.jpg', alt: 'Entrance' },
            ],
            surroundings: [
                { src: 'images/surround-1.jpg', alt: 'Old Town Street' },
                { src: 'images/surround-2.jpg', alt: 'Beach Nearby' },
                { src: 'images/surround-3.jpg', alt: 'Local Market' },
            ]
        },

        get currentImages() {
            return this.images[this.activeCategory] || [];
        },

        setCategory(cat) {
            if (cat === this.activeCategory) return;
            this.activeCategory = cat;
            this.rebuildSliders();
        },

        rebuildSliders() {
            if (this.mainSlider) { this.mainSlider.destroy(); this.mainSlider = null; }
            if (this.thumbSlider) { this.thumbSlider.destroy(); this.thumbSlider = null; }

            const mainEl = this.$refs.mainSlider;
            const thumbEl = this.$refs.thumbSlider;
            if (!mainEl || !thumbEl) return;

            // Clear existing slide DOM
            mainEl.innerHTML = '';
            thumbEl.innerHTML = '';

            const imgs = this.currentImages;

            // Build main slides
            imgs.forEach((img, idx) => {
                const slide = document.createElement('div');
                slide.className = 'keen-slider__slide';

                const inner = document.createElement('div');
                inner.className = 'relative w-full h-full bg-earth-pill flex items-center justify-center cursor-pointer';
                inner.style.aspectRatio = '16 / 10';

                const imgEl = document.createElement('img');
                imgEl.src = img.src;
                imgEl.alt = img.alt;
                imgEl.className = 'absolute inset-0 w-full h-full object-cover';
                imgEl.onerror = function() { this.style.display = 'none'; };

                const label = document.createElement('span');
                label.className = 'text-earth-secondary text-lg z-10';
                label.textContent = img.alt;

                inner.appendChild(imgEl);
                inner.appendChild(label);
                inner.addEventListener('click', () => this.openLightbox(idx));
                slide.appendChild(inner);
                mainEl.appendChild(slide);
            });

            // Build thumb slides
            imgs.forEach((img, idx) => {
                const slide = document.createElement('div');
                slide.className = 'keen-slider__slide';

                const inner = document.createElement('div');
                inner.className = 'relative h-16 md:h-20 bg-earth-pill rounded overflow-hidden flex items-center justify-center cursor-pointer';

                const imgEl = document.createElement('img');
                imgEl.src = img.src;
                imgEl.alt = img.alt;
                imgEl.className = 'absolute inset-0 w-full h-full object-cover';
                imgEl.onerror = function() { this.style.display = 'none'; };

                const label = document.createElement('span');
                label.className = 'text-earth-secondary text-xs z-10';
                label.textContent = img.alt;

                inner.appendChild(imgEl);
                inner.appendChild(label);
                inner.addEventListener('click', () => this.goToSlide(idx));
                slide.appendChild(inner);
                thumbEl.appendChild(slide);
            });

            // Init Keen Slider instances
            this.thumbSlider = new KeenSlider(thumbEl, {
                slides: { perView: 5, spacing: 8 },
                breakpoints: {
                    '(max-width: 640px)': {
                        slides: { perView: 3.5, spacing: 6 },
                    },
                },
            });

            this.mainSlider = new KeenSlider(mainEl, {
                slides: { perView: 1 },
                slideChanged: (s) => {
                    const idx = s.track.details.rel;
                    if (this.thumbSlider) {
                        this.thumbSlider.moveToIdx(Math.max(0, idx - 1));
                    }
                },
            });
        },

        goToSlide(idx) {
            if (this.mainSlider) this.mainSlider.moveToIdx(idx);
        },

        openLightbox(idx) {
            this.lightboxIndex = idx;
            this.lightboxOpen = true;
            document.body.style.overflow = 'hidden';
        },

        closeLightbox() {
            this.lightboxOpen = false;
            document.body.style.overflow = '';
        },

        lightboxPrev() {
            this.lightboxIndex = (this.lightboxIndex - 1 + this.currentImages.length) % this.currentImages.length;
        },

        lightboxNext() {
            this.lightboxIndex = (this.lightboxIndex + 1) % this.currentImages.length;
        },

        init() {
            this.$nextTick(() => this.rebuildSliders());
        },

        destroy() {
            if (this.mainSlider) this.mainSlider.destroy();
            if (this.thumbSlider) this.thumbSlider.destroy();
        }
    }));
```

- [ ] **Step 2: Add gallery section HTML to `index.html`**

Add this directly after the closing `</section>` of the Property Overview section:

```html
    <!-- Image Gallery -->
    <section class="py-16 md:py-24 bg-white" x-data="gallery">
        <div class="max-w-6xl mx-auto px-4">
            <h2 class="font-heading text-3xl md:text-4xl text-center mb-8"
                x-text="$store.lang.t('gallery_title')"></h2>

            <!-- Category Tabs -->
            <div class="flex justify-center gap-2 mb-8">
                <button @click="setCategory('interior')"
                        :class="activeCategory === 'interior' ? 'bg-earth-accent text-white' : 'bg-earth-pill text-earth-pill-text hover:bg-earth-accent/20'"
                        class="px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
                        x-text="$store.lang.t('gallery_interior')"></button>
                <button @click="setCategory('exterior')"
                        :class="activeCategory === 'exterior' ? 'bg-earth-accent text-white' : 'bg-earth-pill text-earth-pill-text hover:bg-earth-accent/20'"
                        class="px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
                        x-text="$store.lang.t('gallery_exterior')"></button>
                <button @click="setCategory('surroundings')"
                        :class="activeCategory === 'surroundings' ? 'bg-earth-accent text-white' : 'bg-earth-pill text-earth-pill-text hover:bg-earth-accent/20'"
                        class="px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
                        x-text="$store.lang.t('gallery_surroundings')"></button>
            </div>

            <!-- Main Slider -->
            <div class="relative mb-4">
                <div x-ref="mainSlider" class="keen-slider gallery-slider"></div>

                <!-- Arrows (desktop) -->
                <button @click="mainSlider?.prev()"
                        class="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all hidden md:block cursor-pointer">
                    <svg class="w-5 h-5 text-earth-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>
                <button @click="mainSlider?.next()"
                        class="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all hidden md:block cursor-pointer">
                    <svg class="w-5 h-5 text-earth-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>

            <!-- Thumbnail Strip -->
            <div x-ref="thumbSlider" class="keen-slider thumb-slider"></div>
        </div>

        <!-- Lightbox -->
        <div x-show="lightboxOpen" x-transition.opacity
             class="fixed inset-0 z-50 bg-black/90 lightbox-overlay flex items-center justify-center p-4"
             @keydown.escape.window="closeLightbox()"
             @keydown.arrow-left.window="lightboxPrev()"
             @keydown.arrow-right.window="lightboxNext()">

            <button @click="closeLightbox()"
                    class="absolute top-4 right-4 text-white hover:text-earth-accent transition-colors cursor-pointer z-10">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>

            <button @click="lightboxPrev()"
                    class="absolute left-4 text-white hover:text-earth-accent transition-colors cursor-pointer">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>

            <div class="max-w-5xl w-full mx-16">
                <div class="relative bg-earth-pill w-full flex items-center justify-center rounded-lg overflow-hidden"
                     style="aspect-ratio: 16/10;">
                    <img :src="currentImages[lightboxIndex]?.src"
                         :alt="currentImages[lightboxIndex]?.alt"
                         class="absolute inset-0 w-full h-full object-cover"
                         onerror="this.style.display='none'">
                    <span class="text-earth-secondary text-xl z-10"
                          x-text="currentImages[lightboxIndex]?.alt"></span>
                </div>
            </div>

            <button @click="lightboxNext()"
                    class="absolute right-4 text-white hover:text-earth-accent transition-colors cursor-pointer">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </button>
        </div>
    </section>
```

- [ ] **Step 3: Verify and commit**

Refresh browser. Scroll to the gallery section:
- Three category tab buttons (Interior active by default, highlighted in terracotta)
- Main slider with placeholder slides showing labels (images won't load yet — labels are visible on pill-colored background)
- Thumbnail strip below
- Clicking a tab switches categories and rebuilds the slider
- Clicking a slide opens the lightbox overlay
- Arrow keys and ESC work in lightbox
- Swipe works on mobile

```bash
git add index.html js/app.js
git commit -m "feat: add image gallery with Keen Slider, tabs, and lightbox"
```

---

## Task 7: Drone Video Section

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`

- [ ] **Step 1: Add drone video Alpine component to `js/app.js`**

Add this inside the `alpine:init` listener in `js/app.js`, after the gallery component:

```js
    // ── Drone Video ─────────────────────────────────────────────
    Alpine.data('droneVideo', () => ({
        playing: false,
        muted: true,
        loaded: false,

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.loaded) {
                        const video = this.$refs.video;
                        if (video && video.dataset.src) {
                            video.src = video.dataset.src;
                            video.load();
                            this.loaded = true;
                        }
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.25 });

            observer.observe(this.$el);
        },

        togglePlay() {
            const video = this.$refs.video;
            if (!video) return;
            if (video.paused) {
                video.play();
                this.playing = true;
            } else {
                video.pause();
                this.playing = false;
            }
        },

        toggleMute() {
            const video = this.$refs.video;
            if (!video) return;
            video.muted = !video.muted;
            this.muted = video.muted;
        }
    }));
```

- [ ] **Step 2: Add video section HTML to `index.html`**

Add this directly after the closing `</section>` of the Image Gallery section (after the lightbox `</div>` and `</section>`):

```html
    <!-- Drone Video -->
    <section class="py-16 md:py-24" x-data="droneVideo">
        <div class="max-w-6xl mx-auto px-4">
            <h2 class="font-heading text-3xl md:text-4xl text-center mb-3"
                x-text="$store.lang.t('video_title')"></h2>
            <p class="text-center text-earth-secondary mb-8"
               x-text="$store.lang.t('video_subtitle')"></p>
        </div>

        <div class="relative max-w-6xl mx-auto px-4">
            <div class="video-container relative rounded-xl overflow-hidden shadow-lg">
                <!-- Placeholder background shown until video loads -->
                <div class="video-placeholder w-full flex items-center justify-center"
                     style="aspect-ratio: 16/9;">
                    <video x-ref="video"
                           class="absolute inset-0 w-full h-full object-cover"
                           playsinline muted loop
                           data-src="video/drone.mp4">
                    </video>

                    <span x-show="!loaded" class="text-white/60 text-lg z-10">Video placeholder</span>
                </div>

                <!-- Controls -->
                <div class="absolute bottom-4 right-4 flex gap-2 z-10">
                    <button @click="togglePlay()"
                            class="bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all cursor-pointer">
                        <!-- Play icon -->
                        <svg x-show="!playing" class="w-5 h-5 text-earth-text" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <!-- Pause icon -->
                        <svg x-show="playing" class="w-5 h-5 text-earth-text" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    </button>
                    <button @click="toggleMute()"
                            class="bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all cursor-pointer">
                        <!-- Muted icon -->
                        <svg x-show="muted" class="w-5 h-5 text-earth-text" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        </svg>
                        <!-- Unmuted icon -->
                        <svg x-show="!muted" class="w-5 h-5 text-earth-text" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </section>
```

- [ ] **Step 3: Verify and commit**

Refresh browser. Scroll to the video section:
- "Aerial View" heading with subtitle
- Dark gradient placeholder area in 16:9 ratio
- Play and mute buttons in the bottom-right corner
- "Video placeholder" text visible (video file doesn't exist yet)
- Buttons are clickable (play won't do anything without a video file)

```bash
git add index.html js/app.js
git commit -m "feat: add drone video section with lazy loading and controls"
```

---

## Task 8: Property Details Grid

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add property details section HTML to `index.html`**

Add this directly after the closing `</section>` of the Drone Video section:

```html
    <!-- Property Details -->
    <section class="py-16 md:py-24 bg-white"
             x-data="scrollReveal" :class="revealed ? 'reveal-visible' : 'reveal-hidden'">
        <div class="max-w-5xl mx-auto px-4">
            <h2 class="font-heading text-3xl md:text-4xl text-center mb-12"
                x-text="$store.lang.t('details_title')"></h2>

            <div class="grid md:grid-cols-2 gap-8">
                <!-- Location -->
                <div class="p-6 rounded-xl bg-earth-bg">
                    <div class="flex items-center gap-3 mb-3">
                        <svg class="w-6 h-6 text-earth-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <h3 class="font-heading text-xl font-semibold"
                            x-text="$store.lang.t('details_location_title')"></h3>
                    </div>
                    <p class="text-earth-secondary leading-relaxed"
                       x-text="$store.lang.t('details_location_text')"></p>
                </div>

                <!-- Condition -->
                <div class="p-6 rounded-xl bg-earth-bg">
                    <div class="flex items-center gap-3 mb-3">
                        <svg class="w-6 h-6 text-earth-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                        </svg>
                        <h3 class="font-heading text-xl font-semibold"
                            x-text="$store.lang.t('details_condition_title')"></h3>
                    </div>
                    <p class="text-earth-secondary leading-relaxed"
                       x-text="$store.lang.t('details_condition_text')"></p>
                </div>

                <!-- Nearby -->
                <div class="p-6 rounded-xl bg-earth-bg">
                    <div class="flex items-center gap-3 mb-3">
                        <svg class="w-6 h-6 text-earth-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                        <h3 class="font-heading text-xl font-semibold"
                            x-text="$store.lang.t('details_amenities_title')"></h3>
                    </div>
                    <p class="text-earth-secondary leading-relaxed"
                       x-text="$store.lang.t('details_amenities_text')"></p>
                </div>

                <!-- Price -->
                <div class="p-6 rounded-xl bg-earth-accent/10 border border-earth-accent/20">
                    <div class="flex items-center gap-3 mb-3">
                        <svg class="w-6 h-6 text-earth-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <h3 class="font-heading text-xl font-semibold"
                            x-text="$store.lang.t('details_price_title')"></h3>
                    </div>
                    <p class="text-earth-accent font-semibold text-lg"
                       x-text="$store.lang.t('details_price_text')"></p>
                </div>
            </div>
        </div>
    </section>
```

- [ ] **Step 2: Verify and commit**

Refresh browser. Scroll to the details section:
- "Property Details" heading
- Four cards in a 2x2 grid on desktop, stacked on mobile
- Each card has a terracotta icon, title, and description
- Price card has a distinct tinted background
- Section fades in on scroll
- Language toggle switches all text

```bash
git add index.html
git commit -m "feat: add property details grid with icons"
```

---

## Task 9: Location Map

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add map section HTML to `index.html`**

Add this directly after the closing `</section>` of the Property Details section:

```html
    <!-- Location Map -->
    <section class="py-16 md:py-24">
        <div class="max-w-5xl mx-auto px-4">
            <h2 class="font-heading text-3xl md:text-4xl text-center mb-8"
                x-text="$store.lang.t('map_title')"></h2>

            <div class="rounded-xl overflow-hidden shadow-lg">
                <iframe
                    src="https://maps.google.com/maps?q=7.5361,99.7503&z=15&output=embed"
                    width="100%"
                    height="400"
                    style="border:0;"
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    title="Baan Sawan location on map"
                ></iframe>
            </div>
        </div>
    </section>
```

- [ ] **Step 2: Verify and commit**

Refresh browser. Scroll to the map section:
- "Location" heading (translates when toggled)
- Embedded Google Map showing Old Town, Koh Lanta area
- Rounded corners, shadow
- Map is interactive (pan, zoom)

```bash
git add index.html
git commit -m "feat: add location map section with Google Maps embed"
```

---

## Task 10: Contact Section & PHP Mailer

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Create: `php/send-mail.php`

- [ ] **Step 1: Add contact form Alpine component to `js/app.js`**

Add this inside the `alpine:init` listener in `js/app.js`, after the droneVideo component:

```js
    // ── Contact Form ────────────────────────────────────────────
    Alpine.data('contactForm', () => ({
        name: '',
        email: '',
        phone: '',
        message: '',
        honeypot: '',
        state: 'idle',

        async submit() {
            if (this.state === 'sending') return;
            this.state = 'sending';

            try {
                const res = await fetch('php/send-mail.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: this.name,
                        email: this.email,
                        phone: this.phone,
                        message: this.message,
                        honeypot: this.honeypot
                    })
                });

                const data = await res.json();

                if (data.success) {
                    this.state = 'success';
                    this.name = '';
                    this.email = '';
                    this.phone = '';
                    this.message = '';
                } else {
                    this.state = 'error';
                }
            } catch (e) {
                this.state = 'error';
            }
        },

        resetState() {
            if (this.state === 'success' || this.state === 'error') {
                this.state = 'idle';
            }
        }
    }));
```

- [ ] **Step 2: Add contact section HTML to `index.html`**

Add this directly after the closing `</section>` of the Location Map section:

```html
    <!-- Contact Section -->
    <section id="contact" class="py-16 md:py-24 bg-white" x-data="contactForm">
        <div class="max-w-5xl mx-auto px-4">
            <h2 class="font-heading text-3xl md:text-4xl text-center mb-3"
                x-text="$store.lang.t('contact_title')"></h2>
            <p class="text-center text-earth-secondary mb-12"
               x-text="$store.lang.t('contact_subtitle')"></p>

            <div class="grid md:grid-cols-2 gap-12">
                <!-- Form -->
                <form @submit.prevent="submit()" class="space-y-4">
                    <!-- Honeypot (hidden from humans) -->
                    <input type="text" name="website" x-model="honeypot"
                           class="!absolute !-top-full !-left-full !w-0 !h-0 !opacity-0"
                           tabindex="-1" autocomplete="off" aria-hidden="true">

                    <div>
                        <input type="text" x-model="name" required
                               :placeholder="$store.lang.t('contact_name')"
                               class="w-full px-4 py-3 rounded-lg border border-earth-pill bg-earth-bg focus:outline-none focus:ring-2 focus:ring-earth-accent/50 transition-all"
                               @focus="resetState()">
                    </div>
                    <div>
                        <input type="email" x-model="email" required
                               :placeholder="$store.lang.t('contact_email')"
                               class="w-full px-4 py-3 rounded-lg border border-earth-pill bg-earth-bg focus:outline-none focus:ring-2 focus:ring-earth-accent/50 transition-all"
                               @focus="resetState()">
                    </div>
                    <div>
                        <input type="tel" x-model="phone"
                               :placeholder="$store.lang.t('contact_phone')"
                               class="w-full px-4 py-3 rounded-lg border border-earth-pill bg-earth-bg focus:outline-none focus:ring-2 focus:ring-earth-accent/50 transition-all"
                               @focus="resetState()">
                    </div>
                    <div>
                        <textarea x-model="message" rows="4"
                                  :placeholder="$store.lang.t('contact_message')"
                                  class="w-full px-4 py-3 rounded-lg border border-earth-pill bg-earth-bg focus:outline-none focus:ring-2 focus:ring-earth-accent/50 transition-all resize-none"
                                  @focus="resetState()"></textarea>
                    </div>

                    <button type="submit" :disabled="state === 'sending'"
                            class="w-full bg-earth-accent text-white py-3 rounded-lg font-medium hover:bg-earth-secondary transition-colors disabled:opacity-50 cursor-pointer">
                        <span x-text="state === 'sending' ? $store.lang.t('contact_sending') : $store.lang.t('contact_send')"></span>
                    </button>

                    <!-- Success -->
                    <div x-show="state === 'success'" x-transition
                         class="p-4 bg-green-50 text-green-700 rounded-lg text-sm"
                         x-text="$store.lang.t('contact_success')"></div>

                    <!-- Error -->
                    <div x-show="state === 'error'" x-transition
                         class="p-4 bg-red-50 text-red-700 rounded-lg text-sm"
                         x-text="$store.lang.t('contact_error')"></div>
                </form>

                <!-- Contact Info & Messaging Buttons -->
                <div class="flex flex-col justify-center space-y-6">
                    <!-- Agent Info -->
                    <div class="text-center md:text-left">
                        <p class="text-earth-secondary text-sm mb-1"
                           x-text="$store.lang.t('contact_agent')"></p>
                        <p class="font-heading text-xl font-semibold"
                           x-text="$store.lang.t('contact_agent_name')"></p>
                    </div>

                    <!-- WhatsApp -->
                    <a href="https://wa.me/66XXXXXXXXX" target="_blank" rel="noopener"
                       class="flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-lg font-medium hover:opacity-90 transition-opacity">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span x-text="$store.lang.t('contact_whatsapp')"></span>
                    </a>

                    <!-- LINE -->
                    <a href="https://line.me/ti/p/~PLACEHOLDER" target="_blank" rel="noopener"
                       class="flex items-center justify-center gap-3 bg-[#06C755] text-white py-4 rounded-lg font-medium hover:opacity-90 transition-opacity">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                        <span x-text="$store.lang.t('contact_line')"></span>
                    </a>
                </div>
            </div>
        </div>
    </section>
```

- [ ] **Step 3: Create `php/send-mail.php`**

```php
<?php
header('Content-Type: application/json');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Parse JSON body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit;
}

// Honeypot check — if filled, it's a bot; silently succeed
if (!empty($input['honeypot'])) {
    echo json_encode(['success' => true]);
    exit;
}

// Extract and sanitize
$name    = strip_tags(trim($input['name'] ?? ''));
$email   = filter_var(trim($input['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone   = strip_tags(trim($input['phone'] ?? ''));
$message = strip_tags(trim($input['message'] ?? ''));

// Validate required fields
if (empty($name) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name and email are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

// Build email
$to      = 'agent@example.com'; // PLACEHOLDER — replace with real email
$subject = "Baan Sawan Inquiry from $name";

$body  = "New inquiry from the Baan Sawan property listing:\n\n";
$body .= "Name:    $name\n";
$body .= "Email:   $email\n";
$body .= "Phone:   $phone\n\n";
$body .= "Message:\n$message\n";

$headers  = "From: noreply@example.com\r\n"; // PLACEHOLDER — replace with real domain
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send
$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
}
```

- [ ] **Step 4: Verify and commit**

Refresh browser. Scroll to the contact section:
- "Interested?" heading with subtitle
- Form with four fields (name, email, phone, message)
- "Send Message" button (will show error without a PHP server, which is expected)
- WhatsApp button (green, links to placeholder `wa.me` URL)
- LINE button (green, links to placeholder LINE URL)
- Agent name placeholder shows
- Language toggle switches all labels and placeholder text

```bash
git add index.html js/app.js php/send-mail.php
git commit -m "feat: add contact form, WhatsApp/LINE buttons, and PHP mailer"
```

---

## Task 11: Footer & Final Polish

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add footer HTML to `index.html`**

Add this directly after the closing `</section>` of the Contact section, and before the `<script>` tags:

```html
    <!-- Footer -->
    <footer class="py-8 border-t border-earth-pill">
        <div class="max-w-5xl mx-auto px-4 text-center text-earth-secondary text-sm">
            <p class="font-heading text-lg mb-2">Baan Sawan</p>
            <p>
                <span x-text="$store.lang.t('footer_listed_by')"></span>
                <span x-text="$store.lang.t('contact_agent_name')"></span>
            </p>
            <p class="mt-2">
                &copy; 2026 Baan Sawan.
                <span x-text="$store.lang.t('footer_rights')"></span>
            </p>
        </div>
    </footer>
```

- [ ] **Step 2: Verify full page end-to-end**

Open `index.html` in a browser and check the complete page flow:

1. **Hero** — Full screen, gradient background, title, tagline, scroll arrow
2. **Language toggle** — Sticky top-right, switches all text between EN/TH
3. **Overview** — Pills row, heading, three paragraphs, fades in on scroll
4. **Gallery** — Three category tabs, slider with placeholder slides, thumbnail strip, lightbox works
5. **Video** — Heading, dark placeholder area, play/mute buttons
6. **Details** — Four cards in a 2x2 grid with icons
7. **Map** — Google Maps embed of Old Town area
8. **Contact** — Form, WhatsApp button, LINE button, agent info
9. **Footer** — Property name, agent, copyright

Test on mobile viewport (browser dev tools):
- Pills scroll horizontally
- Gallery slides are swipeable
- Details cards stack vertically
- Contact form and buttons are full-width
- Everything is readable and well-spaced

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add footer — page complete"
```

---

## Self-Review Checklist

- **Spec coverage:** All 8 sections from the spec are implemented (Hero, Overview, Gallery, Video, Details, Map, Contact, Footer). Bilingual system with `lang.json` and Alpine store. Contact form with PHP mailer. WhatsApp and LINE buttons. Keen Slider gallery with categories and lightbox. Drone video with lazy loading. Responsive mobile-first design. Scroll reveal animations.
- **Placeholder scan:** No TBDs or TODOs in the plan. All code blocks are complete. Commit messages are provided. Verification steps are specific.
- **Type consistency:** Alpine component names are consistent: `scrollReveal`, `gallery`, `droneVideo`, `contactForm`. Store method `$store.lang.t()` is used consistently. All `lang.json` keys match between usage in HTML and the JSON file.
