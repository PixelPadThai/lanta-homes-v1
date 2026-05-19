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

});
