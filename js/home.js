// Only loaded on the homepage. Pointer depth runs on demand, never while idle.
(() => {
    const hero = document.querySelector('.engineering-hero');
    if (!hero) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1101px)');
    let frame = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;

    const paint = () => {
        hero.style.setProperty('--portrait-x', `${x.toFixed(2)}px`);
        hero.style.setProperty('--portrait-y', `${y.toFixed(2)}px`);
        hero.style.setProperty('--texture-x', `${(-x * 0.45).toFixed(2)}px`);
        hero.style.setProperty('--texture-y', `${(-y * 0.45).toFixed(2)}px`);
    };

    const animate = () => {
        x += (targetX - x) * 0.11;
        y += (targetY - y) * 0.11;
        const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < 0.04;
        if (settled) { x = targetX; y = targetY; }
        paint();
        frame = settled ? 0 : requestAnimationFrame(animate);
    };

    const start = () => { if (!frame) frame = requestAnimationFrame(animate); };
    const reset = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        x = y = targetX = targetY = 0;
        paint();
    };

    hero.addEventListener('pointermove', (event) => {
        if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
        const bounds = hero.getBoundingClientRect();
        targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 14;
        targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;
        start();
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
        if (reducedMotion.matches || !finePointer.matches) return;
        targetX = targetY = 0;
        start();
    });
    reducedMotion.addEventListener('change', reset);
    finePointer.addEventListener('change', reset);
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) reset(); }).observe(hero);
    }

})();
