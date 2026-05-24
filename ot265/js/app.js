// All display text lives in lang.json (single source of truth, EN + TH).
// It is fetched at runtime by the lang store's init() below.

// Shared between the Old Town slider (renders the row) and the gallery
// component's lightbox (appends them to its scrollable column so one click
// scrolls to the matching image).
const OLDTOWN_IMAGES = [
    'aerial-old-town-overlooking-oldtown-strip-and-pier-web.jpg',
    'aerial-old-town-sunday-market-web.jpg',
    'aerial-old-town-laanta-festival-scene-and-strip-web.jpg',
    'aerial-old-town-laanta-festival-lighthouse-stage-scene-web.jpg',
    'aerial-old-town-laanta-festival-pier-building-scene-web.jpg',
    'aerial-old-town-laanta-festival-panorama-afterdark-web.jpg',
    'aerial-old-town-laanta-festival-carnival-roundabout-web.jpg',
    'aerial-old-townlaanta-festival-scene-lighthouse-web.jpg',
    'ip11-old-town-sunset-behind-mountain-from-pier-towards-oldtown-web.jpg',
    'ip11-old-town-restaurant-1-waterfront-sunset-web.jpg',
    'ip11-old-town-restaurant-1-waterfront-night-web.jpg',
    'ip11-old-town-restaurant-2-waterfront-sunset-web.jpg',
    'ip11-old-town-restaurant-2-waterfront-night-web.jpg',
    'ip11-old-town-restaurant-chinese-shrine-sunset-web.jpg',
    'ip11-old-town-grandmas-house-web.jpg',
];

function registerAlpine() {

    // ── Language Store ──────────────────────────────────────────
    Alpine.store('lang', {
        current: 'en',
        data: {},

        async init() {
            // lang.json is the single source of truth. Must be served over HTTP
            // (php -S in dev, Apache in prod) — fetch() is blocked on file://.
            try {
                // no-cache: revalidate against the server each load so text
                // edits appear after deploy without a cache-buster to juggle.
                const res = await fetch('lang.json', { cache: 'no-cache' });
                if (res.ok) this.data = await res.json();
            } catch (e) {
                console.error('Failed to load lang.json', e);
            }
            // Reveal translatable text once loaded (see custom.css lang gate).
            document.documentElement.classList.add('lang-ready');
        },

        t(key) {
            return this.data[this.current]?.[key] || key;
        },

        toggle() {
            this.current = this.current === 'en' ? 'th' : 'en';
            document.documentElement.lang = this.current;
        }
    });

    // ── Hero Slider ─────────────────────────────────────────────
    // Keen Slider with native mouse/touch drag. Slide 1 is the LCP
    // (eager + preloaded). Slides 2 & 3 carry `data-src`/`data-srcset`
    // and are upgraded to real src after window.load fires, so they
    // don't compete with critical assets. Autoplay (6s) pauses while
    // the user is dragging and resumes when the animation settles.
    Alpine.data('heroSlider', () => ({
        activeIdx: 0,
        transitioning: false,
        slider: null,

        slides: [
            { titleKey: 'hero_title',   tagKey: 'hero_tagline'   },
            { titleKey: 'hero_title_2', tagKey: 'hero_tagline_2' },
            { titleKey: 'hero_title_3', tagKey: 'hero_tagline_3' },
        ],

        init() {
            const start = () => {
                // Upgrade deferred slide images.
                this.$el.querySelectorAll('img[data-src]').forEach(img => {
                    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
                    if (img.dataset.sizes)  img.sizes  = img.dataset.sizes;
                    img.src = img.dataset.src;
                });
                this.buildSlider();
            };

            if (document.readyState === 'complete') {
                start();
            } else {
                window.addEventListener('load', start, { once: true });
            }
        },

        buildSlider() {
            const el = this.$refs.slider;
            if (!el) return;

            // Autoplay plugin — pauses on drag, resumes on settle. Hover
            // does NOT pause (the hero is large and users often rest the
            // cursor here while reading the page below).
            const autoplay = (slider, ms = 5000) => {
                let timeout;
                const clear = () => clearTimeout(timeout);
                const schedule = () => { clear(); timeout = setTimeout(() => slider.next(), ms); };
                slider.on('created',         schedule);
                slider.on('dragStarted',     clear);
                slider.on('animationEnded',  schedule);
                slider.on('updated',         schedule);
            };

            this.slider = new KeenSlider(el, {
                loop: true,
                slides: { perView: 1 },
                slideChanged: (s) => {
                    const idx = s.track.details.rel;
                    // Brief overlay fade to soften the text swap.
                    this.transitioning = true;
                    setTimeout(() => {
                        this.activeIdx = idx;
                        this.transitioning = false;
                    }, 200);
                },
            }, [autoplay]);
        }
    }));

    // ── Lang Toggle (hides once you scroll past the hero) ───────
    // Scroll-based rather than IntersectionObserver: on mobile the hero is
    // position:fixed, so it never "leaves" the viewport for an observer.
    Alpine.data('langToggle', () => ({
        visible: true,
        init() {
            const hero = document.querySelector('[data-hero]');
            const update = () => {
                const h = hero ? hero.getBoundingClientRect().height : window.innerHeight;
                this.visible = window.scrollY < h * 0.6;
            };
            update();
            window.addEventListener('scroll', update, { passive: true });
        }
    }));

    // ── Scroll Reveal ───────────────────────────────────────────
    Alpine.data('scrollReveal', (delay = 0) => ({
        revealed: false,

        init() {
            if (delay) this.$el.style.setProperty('--reveal-delay', delay + 'ms');

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

    // ── Gallery ─────────────────────────────────────────────────
    Alpine.data('gallery', () => ({
        activeCategory: 'exterior',
        lightboxOpen: false,
        lightboxIndex: 0,
        mainSlider: null,
        thumbSlider: null,

        images: {
            exterior: [
                { src: 'gallery-images/oldtown-2bed-house-1-front-1-web.jpg',           alt: 'Front of House',      group: 'Front Exterior' },
                { src: 'gallery-images/oldtown-2bed-house-1-front-2-web.jpg',           alt: 'Front Facade',        group: 'Front Exterior' },
                { src: 'gallery-images/oldtown-2bed-house-1-front-3-web.jpg',           alt: 'Front View',          group: 'Front Exterior' },
                { src: 'gallery-images/oldtown-2bed-house-10-back-west-side-1-web.jpg', alt: 'West Side',           group: 'Back & Sides' },
                { src: 'gallery-images/oldtown-2bed-house-11-back-side-1-web.jpg',      alt: 'Back of House',       group: 'Back & Sides' },
                { src: 'gallery-images/oldtown-2bed-house-11-back-side-2-web.jpg',      alt: 'Back Exterior',       group: 'Back & Sides' },
                { src: 'gallery-images/oldtown-2bed-house-12-back-side-view-1-web.jpg', alt: 'Rear Garden View',    group: 'Back & Sides' },
                { src: 'gallery-images/oldtown-2bed-house-12-back-side-view-2-web.jpg', alt: 'Rear View',           group: 'Back & Sides' },
            ],
            interior: [
                { src: 'gallery-images/oldtown-2bed-house-2-entry-room-2-web.jpg',       alt: 'Entry Room',          group: 'Living & Dining' },
                { src: 'gallery-images/oldtown-2bed-house-3-kitchen-1-web.jpg',          alt: 'Kitchen',             group: 'Kitchen' },
                { src: 'gallery-images/oldtown-2bed-house-3-kitchen-2-web.jpg',          alt: 'Kitchen',             group: 'Kitchen' },
                { src: 'gallery-images/oldtown-2bed-house-3-kitchen-3-web.jpg',          alt: 'Kitchen',             group: 'Kitchen' },
                { src: 'gallery-images/oldtown-2bed-house-4-bedroom-1-1-web.jpg',        alt: 'Second Bedroom',      group: 'Second Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-4-bedroom-1-2-web.jpg',        alt: 'Second Bedroom',      group: 'Second Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-4-bedroom-1-3-web.jpg',        alt: 'Second Bedroom',      group: 'Second Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-5-detached-toilet-1-web.jpg',  alt: 'Detached Bathroom',   group: 'Detached Bathroom' },
                { src: 'gallery-images/oldtown-2bed-house-6-bedroom-2-1-web.jpg',        alt: 'Master Bedroom',      group: 'Master Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-6-bedroom-2-2-web.jpg',        alt: 'Master Bedroom',      group: 'Master Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-6-bedroom-2-3-web.jpg',        alt: 'Master Bedroom',      group: 'Master Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-7-bedroom-2-toilet-1-web.jpg', alt: 'Master Bedroom Bathroom',  group: 'Master Bedroom Bathroom' },
                { src: 'gallery-images/oldtown-2bed-house-7-bedroom-2-toilet-2-web.jpg', alt: 'Master Bedroom Bathroom',  group: 'Master Bedroom Bathroom' },
                { src: 'gallery-images/oldtown-2bed-house-8-kitchen-1-web.jpg',          alt: 'Kitchen',             group: 'Kitchen' },
                { src: 'gallery-images/oldtown-2bed-house-8-kitchen-2-web.jpg',          alt: 'Kitchen',             group: 'Kitchen' },
                { src: 'gallery-images/oldtown-2bed-house-9-entry-1-web.jpg',            alt: 'Entry',               group: 'Living & Dining' },
                { src: 'gallery-images/oldtown-2bed-house-9-entry-room-1-web.jpg',       alt: 'Entry Room',          group: 'Living & Dining' },
                { src: 'gallery-images/oldtown-2bed-house-9-entry-room-2-web.jpg',       alt: 'Entry Room',          group: 'Living & Dining' },
            ],
            surroundings: [
                { src: 'gallery-images/oldtown-2bed-house-13-aerial-photo-1-web.jpg',   alt: 'Aerial View',         group: 'Aerial Photos' },
                { src: 'gallery-images/oldtown-2bed-house-13-aerial-photo-2-web.jpg',   alt: 'Aerial View',         group: 'Aerial Photos' },
                { src: 'gallery-images/oldtown-2bed-house-13-aerial-photo-3-web.jpg',   alt: 'Aerial Overview',     group: 'Aerial Photos' },
                { src: 'gallery-images/oldtown-2bed-house-14-floorplan-2d-web.jpg',     alt: 'Floor Plan',          group: 'Floor Plan' },
            ]
        },

        // Flat order: front exterior → interior → back → aerial & plan
        get flatImages() {
            const front = this.images.exterior.filter(i => i.group === 'Front Exterior');
            const back  = this.images.exterior.filter(i => i.group === 'Back & Sides');
            return [...front, ...this.images.interior, ...back, ...this.images.surroundings];
        },

        // Jump targets for each category tab
        get categoryStart() {
            const frontCount = this.images.exterior.filter(i => i.group === 'Front Exterior').length;
            const backCount  = this.images.exterior.filter(i => i.group === 'Back & Sides').length;
            return {
                exterior:     0,
                interior:     frontCount,
                surroundings: frontCount + this.images.interior.length + backCount,
            };
        },

        categoryForIndex(idx) {
            const s = this.categoryStart;
            if (idx < s.interior)                                    return 'exterior';  // front shots
            if (idx < s.interior + this.images.interior.length)     return 'interior';  // interior
            if (idx < s.surroundings)                                return 'exterior';  // back shots
            return 'surroundings';
        },

        // Kept for lightbox compatibility
        get currentImages() {
            return this.flatImages;
        },

        // Flat list of headers + images for the scrollable lightbox column.
        // Property photos first (grouped by room), then a "Discover Old Town"
        // section with the surrounding-area images. Each image carries a
        // string lbId ("g-N" / "ot-N") so click handlers can scroll to it.
        get lightboxItems() {
            const items = [];
            let lastGroup = null;
            this.flatImages.forEach((img, idx) => {
                if (img.group && img.group !== lastGroup) {
                    items.push({ type: 'header', title: img.group });
                    lastGroup = img.group;
                }
                const mobileSrc = img.src.replace('-web.jpg', '-mobile.jpg');
                items.push({
                    type: 'image',
                    src: img.src,
                    srcset: `${mobileSrc} 700w, ${img.src} 1200w`,
                    alt: img.alt,
                    lbId: `g-${idx}`
                });
            });

            items.push({ type: 'header', title: 'Discover Old Town' });
            OLDTOWN_IMAGES.forEach((file, idx) => {
                const src = 'oldtown-images/' + file;
                const mobileSrc = src.replace('-web.jpg', '-mobile.jpg');
                items.push({
                    type: 'image',
                    src,
                    srcset: `${mobileSrc} 700w, ${src} 1200w`,
                    alt: '',
                    lbId: `ot-${idx}`
                });
            });

            return items;
        },

        // Jump to the first image of a category - no slider rebuild needed
        setCategory(cat) {
            this.activeCategory = cat;
            if (this.mainSlider) {
                this.mainSlider.moveToIdx(this.categoryStart[cat]);
            }
        },

        buildSliders() {
            if (this.mainSlider) { this.mainSlider.destroy(); this.mainSlider = null; }
            if (this.thumbSlider) { this.thumbSlider.destroy(); this.thumbSlider = null; }

            const mainEl = this.$refs.mainSlider;
            const thumbEl = this.$refs.thumbSlider;
            if (!mainEl || !thumbEl) return;

            mainEl.innerHTML = '';
            thumbEl.innerHTML = '';

            const imgs = this.flatImages;

            imgs.forEach((img, idx) => {
                const slide = document.createElement('div');
                slide.className = 'keen-slider__slide';

                const inner = document.createElement('div');
                inner.className = 'relative w-full bg-earth-pill flex items-center justify-center cursor-pointer overflow-hidden';
                inner.style.aspectRatio = '3 / 2';

                const mobileSrc = img.src.replace('-web.jpg', '-mobile.jpg');
                const imgEl = document.createElement('img');
                imgEl.loading = 'lazy';
                imgEl.decoding = 'async';
                imgEl.srcset = `${mobileSrc} 700w, ${img.src} 1200w`;
                imgEl.sizes = '(max-width: 1023px) 100vw, 1100px';
                imgEl.src = img.src;
                imgEl.alt = img.alt;
                imgEl.className = 'absolute inset-0 w-full h-full object-cover';
                imgEl.onload = function() {
                    if (this.naturalHeight > this.naturalWidth) {
                        this.className = 'absolute inset-0 w-full h-full object-contain';
                    }
                };
                imgEl.onerror = function() { this.style.display = 'none'; };

                inner.appendChild(imgEl);
                inner.addEventListener('click', () => this.openLightbox());
                slide.appendChild(inner);
                mainEl.appendChild(slide);
            });

            imgs.forEach((img, idx) => {
                const slide = document.createElement('div');
                slide.className = 'keen-slider__slide';

                const inner = document.createElement('div');
                inner.className = 'relative w-full bg-earth-pill rounded overflow-hidden cursor-pointer';
                inner.style.aspectRatio = '3 / 2';

                const mobileSrc = img.src.replace('-web.jpg', '-mobile.jpg');
                const imgEl = document.createElement('img');
                imgEl.loading = 'lazy';
                imgEl.decoding = 'async';
                imgEl.srcset = `${mobileSrc} 700w, ${img.src} 1200w`;
                imgEl.sizes = '(max-width: 640px) 25vw, 16vw';
                imgEl.src = img.src;
                imgEl.alt = img.alt;
                imgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
                imgEl.onerror = function() { this.style.display = 'none'; };

                inner.appendChild(imgEl);
                inner.addEventListener('click', () => this.goToSlide(idx));
                slide.appendChild(inner);
                thumbEl.appendChild(slide);
            });

            this.thumbSlider = new KeenSlider(thumbEl, {
                slides: { perView: 6, spacing: 6 },
                breakpoints: {
                    '(max-width: 640px)': {
                        slides: { perView: 4, spacing: 4 },
                    },
                },
            });

            const thumbSlides = thumbEl.querySelectorAll('.keen-slider__slide');
            if (thumbSlides[0]) thumbSlides[0].classList.add('active');

            this.mainSlider = new KeenSlider(mainEl, {
                slides: { perView: 1 },
                slideChanged: (s) => {
                    const idx = s.track.details.rel;
                    this.lightboxIndex = idx;
                    this.activeCategory = this.categoryForIndex(idx);
                    thumbSlides.forEach((el, i) => el.classList.toggle('active', i === idx));
                    if (this.thumbSlider) {
                        this.thumbSlider.moveToIdx(Math.max(0, idx - 2));
                    }
                },
            });
        },

        goToSlide(idx) {
            if (this.mainSlider) this.mainSlider.moveToIdx(idx);
        },

        // Two entry points — both ignore which specific thumbnail was
        // clicked. Gallery clicks land at the top of the property photos;
        // Old Town clicks land at the first Old Town photo.
        openLightbox() {
            this.scrollLightboxTo('g-0');
        },

        openOldtownLightbox() {
            this.scrollLightboxTo('ot-0');
        },

        scrollLightboxTo(lbId) {
            this.lightboxOpen = true;
            document.body.style.overflow = 'hidden';
            this.$nextTick(() => {
                // Lightbox is teleported to <body>, so $refs can't reach it - query the document.
                const target = document.querySelector(`[data-lb-idx="${lbId}"]`);
                if (target) target.scrollIntoView({ block: 'start' });
            });
        },

        closeLightbox() {
            this.lightboxOpen = false;
            document.body.style.overflow = '';
        },

        lightboxPrev() {
            this.lightboxIndex = (this.lightboxIndex - 1 + this.flatImages.length) % this.flatImages.length;
        },

        lightboxNext() {
            this.lightboxIndex = (this.lightboxIndex + 1) % this.flatImages.length;
        },

        init() {
            this.$nextTick(() => this.buildSliders());
            // Cross-component triggers: the Old Town slider and the
            // hero's Open Gallery button live in their own Alpine roots,
            // so they ask us to open the lightbox via window events.
            window.addEventListener('open-oldtown-lightbox', () => {
                this.openOldtownLightbox();
            });
            window.addEventListener('open-gallery-lightbox', () => {
                this.openLightbox();
            });
        },

        destroy() {
            if (this.mainSlider) this.mainSlider.destroy();
            if (this.thumbSlider) this.thumbSlider.destroy();
        }
    }));

    // ── Lazy Map ────────────────────────────────────────────────
    // Maps iframe pulls ~350 KB of JS and blocks the main thread.
    // Swap its src in only when the section scrolls into view so it
    // stays out of the initial load / LCP critical path.
    Alpine.data('lazyMap', () => ({
        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const frame = this.$refs.frame;
                        if (frame && frame.dataset.src && !frame.src) {
                            frame.src = frame.dataset.src;
                        }
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '200px' });
            observer.observe(this.$el);
        }
    }));

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
                            this.loaded = true;
                            video.addEventListener('play',  () => { this.playing = true;  });
                            video.addEventListener('pause', () => { this.playing = false; });
                            video.src = video.dataset.src;
                            video.load();
                            video.play().catch(() => {});
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

    // ── Old Town Slider ─────────────────────────────────────────
    // Full-bleed auto-width slider for surrounding-area photos.
    // Slide heights are fixed per breakpoint in custom.css; images get
    // height:100% / width:auto so they keep their natural aspect ratio —
    // wider photos take more horizontal space, narrower ones less.
    Alpine.data('oldtownSlider', () => ({
        slider: null,

        init() {
            this.$nextTick(() => this.build());
        },

        build() {
            const el = this.$refs.slider;
            if (!el) return;

            el.innerHTML = '';
            OLDTOWN_IMAGES.forEach((file) => {
                const slide = document.createElement('div');
                slide.className = 'keen-slider__slide oldtown-slide';
                slide.style.cursor = 'pointer';

                const src = 'oldtown-images/' + file;
                const mobileSrc = src.replace('-web.jpg', '-mobile.jpg');
                const imgEl = document.createElement('img');
                imgEl.loading = 'lazy';
                imgEl.decoding = 'async';
                imgEl.srcset = `${mobileSrc} 700w, ${src} 1200w`;
                imgEl.sizes = '(max-width: 1023px) 100vw, (max-width: 1279px) 33vw, 20vw';
                imgEl.src = src;
                imgEl.alt = '';
                imgEl.onerror = function () { this.style.display = 'none'; };

                slide.appendChild(imgEl);
                slide.addEventListener('click', () => {
                    window.dispatchEvent(new CustomEvent('open-oldtown-lightbox'));
                });
                el.appendChild(slide);
            });

            // Autoplay plugin: nudge to next slide on an interval, pause on hover/drag.
            const autoplay = (slider, ms = 3000) => {
                let timeout, mouseOver = false;
                const clearNextTimeout = () => clearTimeout(timeout);
                const nextTimeout = () => {
                    clearTimeout(timeout);
                    if (mouseOver) return;
                    timeout = setTimeout(() => slider.next(), ms);
                };
                slider.on('created', () => {
                    slider.container.addEventListener('mouseover', () => { mouseOver = true;  clearNextTimeout(); });
                    slider.container.addEventListener('mouseout',  () => { mouseOver = false; nextTimeout(); });
                    nextTimeout();
                });
                slider.on('dragStarted',    clearNextTimeout);
                slider.on('animationEnded', nextTimeout);
                slider.on('updated',        nextTimeout);
            };

            this.slider = new KeenSlider(el, {
                loop: true,
                mode: 'free-snap',
                slides: { perView: 1, spacing: 8 },
                breakpoints: {
                    '(min-width: 1024px)': {
                        slides: { perView: 3, spacing: 10 },
                    },
                    '(min-width: 1280px)': {
                        slides: { perView: 5, spacing: 10 },
                    },
                },
            }, [autoplay]);
        },

        destroy() {
            if (this.slider) this.slider.destroy();
        }
    }));

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

    // Initialize lang store
    Alpine.store('lang').init();
}

// Register whether Alpine loads before or after this script:
//  - If Alpine isn't here yet (normal case), wait for its init event.
//  - If Alpine is already present, register immediately.
if (window.Alpine) {
    registerAlpine();
} else {
    document.addEventListener('alpine:init', registerAlpine);
}
