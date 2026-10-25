(() => {
    'use strict';
    const root = document.getElementById('tp-dashboard');
    if (!root) return;
    const get = (id) => document.getElementById(id);
    const data = window.TELEMETRY_DATA;
    if (!data?.series) {
        get('tp-load-note').textContent = 'The preview could not load. You can still explore the original project screenshots below.';
        return;
    }
    const chart = get('tp-chart');
    const pause = get('tp-play');
    const scrub = get('tp-scrub');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pollutants = [...root.querySelectorAll('[data-tp-pollutant]')];
    const views = [...root.querySelectorAll('[data-tp-view]')];
    const duration = 16000, hold = 2000;
    let key = 'NO2', mode = 'compare', width = 650;
    let elapsed = reduced.matches ? duration : 0;
    let wantsPlay = !reduced.matches, visible = false, frame = 0, previous = null;
    let min = 0, max = 100, lastIndex = -1;
    const left = 36, right = 12, top = 15, plotHeight = 205;
    const series = () => data.series[key];
    const x = (index) => left + index / (series().values.length - 1) * (width - left - right);
    const y = (value) => top + (max - value) / (max - min) * plotHeight;
    const svg = (tag, attrs, text) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
        if (text !== undefined) el.textContent = text;
        return el;
    };
    const axes = svg('g', {});
    const defs = svg('defs', {});
    const clip = svg('clipPath', {id: 'tp-reveal-clip'});
    const clipRect = svg('rect', {x: left, y: 0, height: 250, width: 0});
    clip.append(clipRect); defs.append(clip);
    const before = svg('polyline', {class: 'tp-before'});
    const ghost = svg('polyline', {class: 'tp-ghost'});
    const after = svg('polyline', {class: 'tp-after', 'clip-path': 'url(#tp-reveal-clip)'});
    const cursor = svg('line', {class: 'tp-cursor', y1: top, y2: top + plotHeight});
    const dot = svg('circle', {class: 'tp-dot', r: 4.5});
    chart.append(defs, axes, before, ghost, after, cursor, dot);
    const date = (index) => new Date(new Date(series().start).getTime() + index * 3600000);
    const dateLabel = (index) => date(index).toLocaleString('en-GB', {
        timeZone: 'UTC', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const draw = () => {
        const values = series().values;
        const position = Math.min(elapsed / duration, 1) * (values.length - 1);
        const index = Math.floor(position);
        const next = Math.min(index + 1, values.length - 1);
        const fraction = position - index;
        const cx = x(position);
        const column = mode === 'before' ? 0 : 1;
        // Interpolate only the visual tracer; all numeric readings use source samples.
        const value = values[index][column] + (values[next][column] - values[index][column]) * fraction;
        clipRect.setAttribute('width', Math.max(0, cx - left + 1));
        cursor.setAttribute('x1', cx); cursor.setAttribute('x2', cx);
        dot.setAttribute('cx', cx); dot.setAttribute('cy', y(value));
        if (index !== lastIndex) {
            lastIndex = index;
            get('tp-before-value').textContent = values[index][0].toFixed(1);
            get('tp-after-value').textContent = values[index][1].toFixed(1);
            get('tp-sample-label').textContent = `${dateLabel(index)} UTC`;
            scrub.value = index;
            scrub.setAttribute('aria-valuetext', `${dateLabel(index)} UTC. Before filtering ${values[index][0].toFixed(1)} ${series().unit}; filtered ${values[index][1].toFixed(1)} ${series().unit}.`);
        }
    };
    const render = () => {
        const current = series();
        const all = current.values.flat();
        min = Math.min(0, Math.floor(Math.min(...all) / 10) * 10);
        max = Math.max(10, Math.ceil(Math.max(...all) / 10) * 10);
        axes.replaceChildren();
        for (let i = 0; i <= 4; i++) {
            const value = min + (max - min) * i / 4;
            axes.append(svg('line', {x1: left, x2: width - right, y1: y(value), y2: y(value), class: 'tp-gridline'}));
            axes.append(svg('text', {x: left - 8, y: y(value) + 4, 'text-anchor': 'end'}, Number(value.toFixed(1))));
        }
        [0, 72, 167].forEach((index, i) => axes.append(svg('text', {
            x: x(index), y: 244, 'text-anchor': i === 0 ? 'start' : i === 2 ? 'end' : 'middle',
        }, date(index).toLocaleDateString('en-GB', {timeZone: 'UTC', day: 'numeric', month: 'short'}))));
        before.setAttribute('points', current.values.map((pair, i) => `${x(i)},${y(pair[0])}`).join(' '));
        const filteredPoints = current.values.map((pair, i) => `${x(i)},${y(pair[1])}`).join(' ');
        ghost.setAttribute('points', filteredPoints); after.setAttribute('points', filteredPoints);
        before.setAttribute('visibility', mode === 'after' ? 'hidden' : 'visible');
        [ghost, after].forEach(el => el.setAttribute('visibility', mode === 'before' ? 'hidden' : 'visible'));
        pollutants.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tpPollutant === key)));
        views.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tpView === mode)));
        get('tp-signal').textContent = `${current.name} / ${current.unit}`;
        root.querySelectorAll('[data-tp-unit]').forEach(el => { el.textContent = current.unit; });
        get('tp-source-file').textContent = current.source;
        get('tp-chart-title').textContent = `${current.name}: before filtering and Savitzky-Golay output`;
        lastIndex = -1;
        draw();
    };
    const tick = (time) => {
        if (previous !== null) elapsed += time - previous;
        previous = time;
        if (elapsed >= duration + hold) elapsed = 0;
        draw();
        frame = requestAnimationFrame(tick);
    };
    const sync = () => {
        cancelAnimationFrame(frame); frame = 0; previous = null;
        pause.textContent = wantsPlay ? 'Pause replay' : 'Play replay';
        get('tp-play-state').textContent = wantsPlay ? 'Looping replay' : 'Paused replay';
        if (wantsPlay && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    pause.addEventListener('click', () => {
        wantsPlay = !wantsPlay;
        if (wantsPlay && elapsed >= duration) elapsed = 0;
        sync();
    });
    pollutants.forEach(button => button.addEventListener('click', () => {
        key = button.dataset.tpPollutant;
        render(); sync();
    }));
    views.forEach(button => button.addEventListener('click', () => {
        mode = button.dataset.tpView;
        render();
    }));
    scrub.addEventListener('input', () => {
        wantsPlay = false;
        elapsed = Number(scrub.value) / (series().values.length - 1) * duration;
        draw(); sync();
    });
    reduced.addEventListener('change', () => {
        if (reduced.matches) { wantsPlay = false; elapsed = duration; draw(); }
        sync();
    });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, {threshold: 0}).observe(root);
    } else visible = true;
    const resize = () => {
        const measured = Math.round(chart.getBoundingClientRect().width);
        if (measured < 100) return;
        width = measured;
        chart.setAttribute('viewBox', `0 0 ${width} 250`);
        render();
    };
    root.querySelectorAll('[data-tp-enhanced]').forEach(el => { el.hidden = false; });
    get('tp-load-note').hidden = true;
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(chart);
    else window.addEventListener('resize', resize);
    resize(); sync();
})();
