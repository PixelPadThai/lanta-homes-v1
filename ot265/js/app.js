// All display text lives in lang.json (single source of truth, EN + TH).
// It is fetched at runtime by the lang store's init() below.

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
                { src: 'gallery-images/oldtown-2bed-house-4-bedroom-1-1-web.jpg',        alt: 'Master Bedroom',      group: 'Master Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-4-bedroom-1-2-web.jpg',        alt: 'Master Bedroom',      group: 'Master Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-4-bedroom-1-3-web.jpg',        alt: 'Master Bedroom',      group: 'Master Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-5-detached-toilet-1-web.jpg',  alt: 'Detached Bathroom',   group: 'Detached Bathroom' },
                { src: 'gallery-images/oldtown-2bed-house-6-bedroom-2-1-web.jpg',        alt: 'Second Bedroom',      group: 'Second Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-6-bedroom-2-2-web.jpg',        alt: 'Second Bedroom',      group: 'Second Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-6-bedroom-2-3-web.jpg',        alt: 'Second Bedroom',      group: 'Second Bedroom' },
                { src: 'gallery-images/oldtown-2bed-house-7-bedroom-2-toilet-1-web.jpg', alt: 'Bedroom 2 Bathroom',  group: 'Bedroom 2 Bathroom' },
                { src: 'gallery-images/oldtown-2bed-house-7-bedroom-2-toilet-2-web.jpg', alt: 'Bedroom 2 Bathroom',  group: 'Bedroom 2 Bathroom' },
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

        // Flat list of headers + images for the scrollable lightbox column
        get lightboxItems() {
            const items = [];
            let lastGroup = null;
            this.flatImages.forEach((img, idx) => {
                if (img.group && img.group !== lastGroup) {
                    items.push({ type: 'header', title: img.group });
                    lastGroup = img.group;
                }
                items.push({ type: 'image', src: img.src, alt: img.alt, flatIdx: idx });
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

                const imgEl = document.createElement('img');
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
                inner.addEventListener('click', () => this.openLightbox(idx));
                slide.appendChild(inner);
                mainEl.appendChild(slide);
            });

            imgs.forEach((img, idx) => {
                const slide = document.createElement('div');
                slide.className = 'keen-slider__slide';

                const inner = document.createElement('div');
                inner.className = 'relative w-full bg-earth-pill rounded overflow-hidden cursor-pointer';
                inner.style.aspectRatio = '3 / 2';

                const imgEl = document.createElement('img');
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

        openLightbox(idx) {
            this.lightboxIndex = idx;
            this.lightboxOpen = true;
            document.body.style.overflow = 'hidden';
            this.$nextTick(() => {
                // Lightbox is teleported to <body>, so $refs can't reach it - query the document.
                const target = document.querySelector(`[data-lb-idx="${idx}"]`);
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
        },

        destroy() {
            if (this.mainSlider) this.mainSlider.destroy();
            if (this.thumbSlider) this.thumbSlider.destroy();
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
                            video.src = video.dataset.src;
                            video.addEventListener('canplay', () => {
                                video.play().then(() => { this.playing = true; }).catch(() => {});
                            }, { once: true });
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
