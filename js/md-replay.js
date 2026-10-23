(() => {
    'use strict';
    const root = document.getElementById('md-replay');
    if (!root) return;
    const data = window.OPTIBELT_DATA?.motor;
    if (!data) {
        document.getElementById('md-replay-help').textContent = 'Replay data could not load. Reload the page to try again.';
        return;
    }
    const get = (id) => document.getElementById(id);
    const scenarios = ['healthy', 'warning', 'fault'];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const buttons = [...root.querySelectorAll('[data-md-scenario]')];
    const chart = get('md-replay-chart');
    const pause = get('md-playback');
    const duration = 16000;
    const hold = 1800;
    let scenario = 0;
    let elapsed = 0;
    let frame = 0;
    let previousTime = null;
    let visible = false;
    let wantsPlayback = !reducedMotion.matches;
    let lastSample = -1;
    let width = 650;
    const left = 34, right = 12, top = 15, height = 215;
    const y = (value) => top + height * (1 - Math.max(0, Math.min(100, value)) / 100);
    const classify = (value) => value < 20 ? 'fault' : value > 80 ? 'healthy' : 'warning';
    const svg = (tag, attrs, value) => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attrs).forEach(([key, val]) => node.setAttribute(key, val));
        if (value !== undefined) node.textContent = value;
        return node;
    };
    [0, 20, 50, 80, 100].forEach((value) => {
        chart.append(svg('line', { x1: left, x2: width - right, y1: y(value), y2: y(value), class: value === 20 || value === 80 ? 'md-threshold' : 'md-gridline' }));
        chart.append(svg('text', { x: left - 9, y: y(value) + 4, 'text-anchor': 'end' }, value));
    });
    const ghost = svg('polyline', { class: 'md-trace-ghost' });
    const area = svg('path', { class: 'md-trace-area' });
    const trace = svg('polyline', { class: 'md-trace' });
    const scanline = svg('line', { class: 'md-scanline', y1: top, y2: top + height });
    const dot = svg('circle', { class: 'md-trace-dot', r: 5 });
    chart.append(ghost, area, trace, scanline, dot);
    const series = () => data[scenarios[scenario]];
    const x = (sample) => left + (sample.row - 1) / (series().rowCount - 1) * (width - left - right);
    let points = [];

    const draw = () => {
        const samples = series().samples;
        const position = Math.min(1, elapsed / duration) * (samples.length - 1);
        const index = Math.floor(position);
        const next = Math.min(samples.length - 1, index + 1);
        const fraction = position - index;
        const cx = x(samples[index]) + (x(samples[next]) - x(samples[index])) * fraction;
        const cy = y(samples[index].health) + (y(samples[next].health) - y(samples[index].health)) * fraction;
        const shown = [...points.slice(0, index + 1), `${cx},${cy}`];
        trace.setAttribute('points', shown.join(' '));
        area.setAttribute('d', `M${left},${y(0)} L${shown.join(' L')} L${cx},${y(0)} Z`);
        scanline.setAttribute('x1', cx);
        scanline.setAttribute('x2', cx);
        dot.setAttribute('cx', cx);
        dot.setAttribute('cy', cy);
        get('md-progress-fill').style.width = `${Math.min(100, elapsed / duration * 100)}%`;
        // Only the moving tracer is interpolated. Readouts always show an actual source sample.
        if (index !== lastSample) {
            lastSample = index;
            const sample = samples[index];
            const state = classify(sample.health);
            get('md-health-value').textContent = sample.health.toFixed(1);
            get('md-health-status').textContent = state[0].toUpperCase() + state.slice(1);
            get('md-health-status').dataset.state = state;
            get('md-health-explainer').textContent = {
                healthy: 'Above 80%: within the healthy operating band.',
                warning: '20–80%: a change in condition that needs attention.',
                fault: 'Below 20%: within the fault operating band.',
            }[state];
            get('md-source-row').textContent = `Source row ${sample.row.toLocaleString('en-GB')} / ${series().rowCount.toLocaleString('en-GB')}`;
        }
    };
    const prepare = () => {
        points = series().samples.map((sample) => `${x(sample)},${y(sample.health)}`);
        ghost.setAttribute('points', points.join(' '));
        buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === scenario)));
        const label = `${scenarios[scenario][0].toUpperCase()}${scenarios[scenario].slice(1)} replay`;
        get('md-replay-name').textContent = label;
        get('md-chart-title').textContent = `${label}: motor health-index demonstration`;
        lastSample = -1;
        draw();
    };
    const tick = (time) => {
        frame = 0;
        if (previousTime !== null) elapsed += Math.min(time - previousTime, 100);
        previousTime = time;
        if (elapsed >= duration + hold) {
            scenario = (scenario + 1) % scenarios.length;
            elapsed = 0;
            prepare();
        }
        draw();
        frame = requestAnimationFrame(tick);
    };
    const syncPlayback = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = null;
        pause.textContent = wantsPlayback ? 'Pause replay' : 'Play replay';
        get('md-playback-state').textContent = wantsPlayback ? 'Looping demo' : 'Paused demo';
        if (wantsPlayback && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    pause.addEventListener('click', () => { wantsPlayback = !wantsPlayback; syncPlayback(); });
    buttons.forEach((button, index) => button.addEventListener('click', () => {
        scenario = index;
        elapsed = 0;
        // A paused scenario opens on a representative reading from its own health band.
        if (!wantsPlayback) {
            const match = series().samples.findIndex((sample) => classify(sample.health) === scenarios[index]);
            elapsed = Math.max(0, match) / (series().samples.length - 1) * duration;
        }
        prepare();
        syncPlayback();
    }));
    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) wantsPlayback = false;
        syncPlayback();
    });
    document.addEventListener('visibilitychange', syncPlayback);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncPlayback(); }, { threshold: 0 }).observe(root);
    } else visible = true;
    const resize = () => {
        const measured = Math.round(chart.getBoundingClientRect().width);
        if (measured < 100) return;
        width = measured;
        chart.setAttribute('viewBox', `0 0 ${width} 250`);
        chart.querySelectorAll('.md-gridline, .md-threshold').forEach((line) => line.setAttribute('x2', width - right));
        prepare();
    };
    get('md-replay-content').hidden = false;
    root.querySelector('.md-scenarios').hidden = false;
    pause.hidden = false;
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(chart);
    else window.addEventListener('resize', resize);
    resize();
    prepare();
    syncPlayback();
})();
