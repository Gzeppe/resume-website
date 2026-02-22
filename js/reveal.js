(function () {
    function initRevealOnScroll() {
        var elements = document.querySelectorAll('.reveal');
        if (!elements.length) return;

        /* Respect prefers-reduced-motion: reveal instantly, skip observer */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            elements.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px'
        });

        elements.forEach(function (el) { observer.observe(el); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRevealOnScroll);
    } else {
        initRevealOnScroll();
    }
})();
