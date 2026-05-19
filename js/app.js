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
