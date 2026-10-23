(() => {
    'use strict';
    const root = document.getElementById('optibelt-demo');
    if (!root || !window.OPTIBELT_DATA) return;
    const data = window.OPTIBELT_DATA;
    const get = (id) => document.getElementById(id);
    const text = (id, value) => { get(id).textContent = value; };
    const number = (value, digits = 1) => value.toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits });
    const classify = (health) => health < 20 ? 'fault' : health > 80 ? 'healthy' : 'warning';
    const title = (value) => value[0].toUpperCase() + value.slice(1);
    const svg = (tag, attrs = {}, content) => {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
        if (content !== undefined) element.textContent = content;
        return element;
    };

    // Automatic tab activation, with standard arrow/Home/End keyboard navigation.
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const activate = (selected) => {
        tabs.forEach((tab) => {
            const active = tab === selected;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            get(tab.getAttribute('aria-controls')).hidden = !active;
        });
        text('ob-source', {
            motor: 'Source: OPTIBELT motor replay CSVs. 121 evenly spaced rows per file, shown in file order. These are bundled demo datasets, not a live machine feed.',
            volume: 'Source: OPTIBELT synthetic LiDAR references. All 1,369 points per scan are shown. Volumes are the reference dataset targets, not new measurements.',
            belt: 'Illustrative inspection snapshot using the defect categories in OPTIBELT. Counts and health score are example values, not measured results.',
            system: 'Architecture adapted from the OPTIBELT source and README. This browser preview has no hardware connection and sends no control commands.',
        }[selected.dataset.view]);
    };
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', (event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            let next;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = tabs.length - 1;
            if (next === undefined) return;
            event.preventDefault();
            activate(tabs[next]);
            tabs[next].focus();
        });
    });

    const chart = get('ob-health-chart');
    const chartTitle = svg('title', { id: 'ob-health-title' });
    const chartDescription = svg('desc', { id: 'ob-health-description' }, 'Health index from 0 to 100 percent. Dashed lines mark 20 and 80 percent. Use the sample slider for exact values. Samples follow CSV file order, not a continuous time scale.');
    chart.append(chartTitle, chartDescription);
    const plot = { left: 38, top: 18, width: 600, height: 202 };
    const y = (value) => plot.top + plot.height * (1 - Math.max(0, Math.min(100, value)) / 100);
    [0, 20, 50, 80, 100].forEach((value) => {
        chart.append(svg('line', { x1: plot.left, x2: plot.left + plot.width, y1: y(value), y2: y(value), class: value === 20 || value === 80 ? 'ob-threshold' : 'ob-gridline' }));
        chart.append(svg('text', { x: plot.left - 10, y: y(value) + 4, 'text-anchor': 'end' }, String(value)));
    });
    const area = svg('path', { class: 'ob-trend-area' });
    const line = svg('polyline', { class: 'ob-trend' });
    const cursor = svg('line', { class: 'ob-cursor', y1: plot.top, y2: plot.top + plot.height });
    const dot = svg('circle', { class: 'ob-cursor-dot', r: 5 });
    chart.append(area, line, cursor, dot);
    let scenario = 'healthy';
    const slider = get('ob-sample');
    const updateSample = () => {
        const dataset = data.motor[scenario];
        const index = Number(slider.value);
        const sample = dataset.samples[index];
        const state = classify(sample.health);
        const x = plot.left + (sample.row - 1) / (dataset.rowCount - 1) * plot.width;
        cursor.setAttribute('x1', x);
        cursor.setAttribute('x2', x);
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y(sample.health));
        text('ob-health-value', number(sample.health));
        text('ob-health-status', title(state));
        get('ob-health-status').dataset.state = state;
        text('ob-row', `Row ${number(sample.row, 0)} of ${number(dataset.rowCount, 0)}`);
        slider.setAttribute('aria-valuetext', `Source row ${sample.row}, health ${number(sample.health)} percent, ${state}`);
        chartTitle.textContent = `${title(scenario)} replay: selected health ${number(sample.health)} percent, ${state}`;
        text('ob-health-message', {
            healthy: 'Above 80%: the drive is in the healthy operating band.',
            warning: '20–80%: the drive needs attention before its condition worsens.',
            fault: 'Below 20%: the drive is in the fault band.',
        }[state]);
    };
    const drawTrend = () => {
        const dataset = data.motor[scenario];
        const points = dataset.samples.map((sample) => `${plot.left + (sample.row - 1) / (dataset.rowCount - 1) * plot.width},${y(sample.health)}`);
        line.setAttribute('points', points.join(' '));
        area.setAttribute('d', `M${plot.left},${y(0)} L${points.join(' L')} L${plot.left + plot.width},${y(0)} Z`);
    };
    const updateScenario = () => {
        scenario = get('ob-scenario').value;
        const dataset = data.motor[scenario];
        drawTrend();
        slider.max = dataset.samples.length - 1;
        // File names are scenario labels; classify each point using the original thresholds.
        const selected = dataset.samples.findIndex((sample) => classify(sample.health) === scenario);
        slider.value = Math.max(0, selected);
        text('ob-replay-name', `${title(scenario)} replay`);
        text('ob-last-row', `Row ${number(dataset.rowCount, 0)}`);
        updateSample();
    };
    get('ob-scenario').addEventListener('change', updateScenario);
    slider.addEventListener('input', updateSample);
    // Keep axis labels at a readable size instead of shrinking the whole chart on phones.
    const resizeChart = () => {
        const width = Math.round(chart.getBoundingClientRect().width);
        if (width < 100) return;
        plot.width = width - plot.left - 16;
        chart.setAttribute('viewBox', `0 0 ${width} 236`);
        chart.querySelectorAll('.ob-gridline, .ob-threshold').forEach((guide) => guide.setAttribute('x2', plot.left + plot.width));
        drawTrend();
        updateSample();
    };
    if ('ResizeObserver' in window) new ResizeObserver(resizeChart).observe(chart);
    else window.addEventListener('resize', resizeChart);

    const updateStockpile = () => {
        const state = get('ob-stockpile').value;
        const dataset = data.stockpiles[state];
        const percent = dataset.volumeCm3 / data.stockpiles.full.volumeCm3 * 100;
        text('ob-volume-value', number(percent));
        text('ob-volume-status', title(state));
        text('ob-volume-cm', `${number(dataset.volumeCm3, 0)} cm³`);
        text('ob-volume-remaining', `${number(data.stockpiles.full.volumeCm3 - dataset.volumeCm3, 0)} cm³`);
        text('ob-volume-points', number(dataset.pointCount, 0));
        get('ob-volume-fill').style.width = `${percent}%`;
        const cloud = get('ob-point-cloud');
        cloud.replaceChildren();
        cloud.append(svg('title', {}, `${title(state)} synthetic stockpile, ${number(percent)} percent of reference capacity`));
        cloud.append(svg('desc', {}, 'Isometric projection of the repository XYZ scan points. Heights are calculated relative to the 560 millimetre ground plane. The numerical volume and point count are listed below.'));
        cloud.append(svg('path', { d: 'M320 105 L572 195 L320 285 L68 195 Z', class: 'ob-cloud-ground' }));
        const fragment = document.createDocumentFragment();
        [...dataset.points].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(([px, py, pz]) => {
            const height = 560 - pz;
            fragment.append(svg('circle', {
                cx: 320 + (px - py) * .7,
                cy: 195 + (px + py) * .25 - height * .6,
                r: height > .5 ? 2.1 : 1.3,
                class: height > .5 ? 'ob-cloud-dot' : 'ob-cloud-dot-ground',
            }));
        });
        cloud.append(fragment);
    };
    get('ob-stockpile').addEventListener('change', updateStockpile);
    updateScenario();
    resizeChart();
    updateStockpile();
    activate(tabs[0]);
    root.dataset.ready = 'true';
})();
