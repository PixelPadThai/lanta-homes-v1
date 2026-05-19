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

            mainEl.innerHTML = '';
            thumbEl.innerHTML = '';

            const imgs = this.currentImages;

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

});
