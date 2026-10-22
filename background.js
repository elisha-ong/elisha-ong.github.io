// Procedural animated gradient: curved S-shaped light bands, with noise
// advected ALONG each curve instead of translating the entire background.
{
    const atmosphere = document.createElement('div'); atmosphere.className = 'atmos'; atmosphere.setAttribute('aria-hidden', 'true');
    const surface = document.createElement('canvas'); surface.setAttribute('aria-hidden', 'true'); atmosphere.appendChild(surface); document.body.prepend(atmosphere);
    const ctx = surface.getContext('2d', { alpha: false });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    const smooth = (a, b, x) => { const q = clamp((x - a) / (b - a)); return q * q * (3 - 2 * q) };
    const hash = (x, y) => { let z = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return z - Math.floor(z) };
    function noise(x, y) { let ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); return (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy) + (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy; }
    let last = 0;
    function render(ms) {
        if (!reduce && ms - last < 45) { requestAnimationFrame(render); return } last = ms;
        const w = Math.min(460, Math.max(280, Math.round(innerWidth / 3))), h = Math.min(350, Math.max(190, Math.round(innerHeight / 3)));
        if (surface.width !== w || surface.height !== h) { surface.width = w; surface.height = h }
        const pixels = ctx.createImageData(w, h), d = pixels.data, t = reduce ? 0 : ms * .00012, aspect = innerWidth / innerHeight;
        for (let j = 0; j < h; j++)for (let i = 0; i < w; i++) {
            const x = i / w, y = j / h;
            // The S bends from upper center to the right and curls back left.
            const center = .52 + .24 * Math.sin(y * 5.5 - 1.15) + .025 * Math.sin(y * 12 + 0.2);
            const dx = x - center;
            const bend = Math.exp(-Math.pow(dx / .175, 2));
            // The left-side stream curls toward the main S-shaped ribbon.
            const leftCenter = .08 + .29 * Math.sin(y * 3.4 + .5);
            const left = Math.exp(-Math.pow((x - leftCenter) / .23, 2));
            // Noise is sampled in curve-following coordinates; time shifts its
            // position along the ribbon (y), never sideways across the page.
            const n1 = noise(x * 5.8 + dx * 1.2, y * 5.2 - t * 3.0);
            const n2 = noise(x * 13 + dx * 2, y * 12 - t * 6.0);
            const texture = .65 + .55 * (n1 - .5) + .20 * (n2 - .5);
            const ribbon = bend * texture * (.78 + .22 * Math.sin(y * 9 - t * 13 + n1 * 3));
            const soft = left * (.50 + .35 * noise(x * 6, y * 6 - t * 2));
            const shadow = .10 * Math.sin(x * 8 + y * 4);
            const light = clamp(ribbon * .92 + soft * .55 + shadow, 0, 1.2);
            const blue = clamp(light);
            const teal = clamp(ribbon * .45 + soft * .3);
            const grain = (hash(i + Math.floor(t * 900), j + Math.floor(t * 700)) - .5) * 10;
            const idx = (j * w + i) * 4;
            d[idx] = clamp(10 + blue * 53 + teal * 10 + grain, 0, 255);
            d[idx + 1] = clamp(24 + blue * 95 + teal * 26 + grain, 0, 255);
            d[idx + 2] = clamp(49 + blue * 115 + teal * 25 + grain, 0, 255);
            d[idx + 3] = 255;
        }
        ctx.putImageData(pixels, 0, 0);
        if (!reduce) requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    window.addEventListener('resize', () => { if (reduce) render(0) }, { passive: true });
}
const TAU = Math.PI * 2, fr = v => ((v % 1) + 1) % 1, DPR = Math.min(devicePixelRatio || 1, 2), W = 180, H = 56;
// One list of lines per project: the last line is drawn in the accent color.
const WAVES = [
    [(x, t) => fr(x * 4 - t * .5) < .35 ? .85 : .15],
    [(x, t) => .5 + .36 * Math.sin(TAU * (3 * x - t * .5)), (x, t) => .5 + .2 * Math.sin(TAU * (3 * x - t * .5) - 1)],
    [(x, t) => [.85, .5, .15][Math.floor(fr(x * 1.5 - t * .2) * 3)]],
    [(x, t) => .5 + .38 * Math.sin(TAU * (x - t * .15)), (x, t) => .5 + .38 * Math.sin(TAU * (x - t * .15)) > .6 ? .88 : .12]];
const cs = [...document.querySelectorAll('.proj canvas')];
cs.forEach(c => { c.width = W * DPR; c.height = H * DPR });
function draw(t) {
    const st = getComputedStyle(document.documentElement), acc = st.getPropertyValue('--acc'), mu = st.getPropertyValue('--mute'), ln = st.getPropertyValue('--line');
    cs.forEach((c, i) => {
        const g = c.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
        g.strokeStyle = ln; g.lineWidth = 1; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
        const ws = WAVES[Number(c.dataset.wave) || 0]; if (!ws) return; ws.forEach((f, k) => {
            g.strokeStyle = k == ws.length - 1 ? acc : mu; g.globalAlpha = k == ws.length - 1 ? 1 : .55; g.lineWidth = 1.6; g.lineJoin = 'round'; g.beginPath();
            for (let s = 0; s <= 120; s++) { const x = s / 120, y = 5 + (1 - f(x, t)) * (H - 10); s ? g.lineTo(x * W, y) : g.moveTo(0, y) } g.stroke(); g.globalAlpha = 1
        })
    })
}
// Accessible project category tabs; canvases are independent of selected category.
const tabs = [...document.querySelectorAll('.project-tab')];
function selectProjectTab(tab, focus = false) {
    tabs.forEach(t => {
        const active = t === tab;
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectProjectTab(tab));
    tab.addEventListener('keydown', e => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        selectProjectTab(tabs[next], true);
    });
});
const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
if (still) { draw(0); matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => draw(0)) }
else { const loop = n => { draw(n / 1000); requestAnimationFrame(loop) }; requestAnimationFrame(loop) }