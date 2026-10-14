'use strict';
/* Kat Kat — sanat: prosedürel dokular, kat çizimi, bulutlar.  Harici görsel yok. */
(() => {
const { rnd, clamp } = K;
const R = 3; // doku çözünürlük çarpanı
const PAT = K.PAT = {};
let pctx = null; // desen oluşturmak için bir ctx

function tile(wu, hu, fn) {
  const cv = document.createElement('canvas'); cv.width = wu * R; cv.height = hu * R;
  const c = cv.getContext('2d'); c.scale(R, R); fn(c, wu, hu);
  const p = (pctx || (pctx = document.createElement('canvas').getContext('2d'))).createPattern(cv, 'repeat');
  if (p.setTransform && typeof DOMMatrix !== 'undefined') p.setTransform(new DOMMatrix().scale(1 / R));
  return p;
}
const grad = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; };
const speckle = (c, w, h, n, seed, a = 0.08) => { for (let i = 0; i < n; i++) { const x = rnd(seed + i * 1.3) * w, y = rnd(seed + i * 2.7 + 9) * h; c.fillStyle = rnd(seed + i) > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; c.fillRect(x, y, 0.8, 0.8); } };

function build() {
  // --- tuğla ---
  PAT.brick = tile(64, 28, (c, w, h) => {
    c.fillStyle = '#cfc5b6'; c.fillRect(0, 0, w, h);
    const pal = ['#a8442f', '#b5503a', '#9a3b2a', '#bb5a42', '#a04030', '#8f3626'];
    for (let r = 0; r < 2; r++) for (let x = r ? -16 : 0; x < 64; x += 32) {
      const key = ((x % 64) + 64) % 64 + r * 100, col = pal[Math.floor(rnd(key) * pal.length)];
      const bx = x + 1, by = r * 14 + 1;
      c.fillStyle = grad(c, 0, by, 0, by + 12, [[0, col], [1, K.mix(col, '#000000', 0.22)]]); c.fillRect(bx, by, 30, 12);
      c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(bx, by, 30, 1.2);
      c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(bx, by + 10.8, 30, 1.2);
      speckle(c, 0, 0, 0, 0); for (let i = 0; i < 14; i++) { c.fillStyle = rnd(key + i * 3.1) > 0.5 ? 'rgba(255,230,200,.13)' : 'rgba(40,10,0,.16)'; c.fillRect(bx + rnd(key + i) * 30, by + rnd(key + i + 5) * 12, 1, 1); }
    }
  });
  // --- ahşap ---
  PAT.wood = tile(64, 52, (c, w, h) => {
    const pal = ['#b57f48', '#a87240', '#bd8a52', '#9f6a3a'];
    for (let r = 0; r < 4; r++) {
      const y = r * 13, col = pal[r % pal.length];
      c.fillStyle = grad(c, 0, y, 0, y + 13, [[0, K.mix(col, '#ffffff', 0.1)], [1, K.mix(col, '#000000', 0.18)]]); c.fillRect(0, y, w, 13);
      for (let g = 0; g < 7; g++) { c.strokeStyle = `rgba(70,35,10,${0.1 + rnd(r * 9 + g) * 0.14})`; c.lineWidth = 0.5; c.beginPath(); const gy = y + 1.5 + g * 1.7; c.moveTo(0, gy); c.bezierCurveTo(16, gy + (rnd(g + r) - .5) * 3, 40, gy + (rnd(g + r + 3) - .5) * 3, w, gy); c.stroke(); }
      if (rnd(r + 40) > 0.4) { const kx = 10 + rnd(r + 7) * 44; c.fillStyle = 'rgba(70,35,10,.45)'; c.beginPath(); c.ellipse(kx, y + 6.5, 2.4, 1.7, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(70,35,10,.25)'; c.beginPath(); c.ellipse(kx, y + 6.5, 4.6, 3.2, 0, 0, 7); c.stroke(); }
      c.fillStyle = 'rgba(30,14,4,.55)'; c.fillRect(0, y + 12.2, w, 0.9); c.fillStyle = 'rgba(255,230,190,.25)'; c.fillRect(0, y, w, 0.7);
    }
  });
  // --- taş ---
  PAT.stone = tile(96, 64, (c, w, h) => {
    c.fillStyle = '#5d5a55'; c.fillRect(0, 0, w, h);
    const rows = [[0, 20, [0, 38, 70, 96]], [20, 24, [0, 26, 60, 96]], [44, 20, [0, 44, 74, 96]]];
    rows.forEach((row, ri) => { const [y, hh, cuts] = row; for (let i = 0; i < cuts.length - 1; i++) {
      const x = cuts[i] + 1, ww = cuts[i + 1] - cuts[i] - 2, key = ri * 10 + i, tone = 150 + rnd(key) * 50;
      const col = `rgb(${tone | 0},${(tone - 4) | 0},${(tone - 14) | 0})`, dk = `rgb(${tone * .62 | 0},${(tone * .6) | 0},${(tone * .55) | 0})`;
      c.fillStyle = grad(c, x, y, x + ww, y + hh, [[0, col], [1, dk]]);
      c.beginPath(); c.roundRect ? c.roundRect(x, y + 1, ww, hh - 2, 2.5) : c.rect(x, y + 1, ww, hh - 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x + 1, y + hh - 2); c.lineTo(x + 1, y + 1.5); c.lineTo(x + ww - 1, y + 1.5); c.stroke();
      for (let s = 0; s < 22; s++) { c.fillStyle = rnd(key * 7 + s) > .5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.14)'; c.fillRect(x + rnd(key + s) * ww, y + 1 + rnd(key + s + 4) * (hh - 2), 1, 1); }
    } });
  });
  // --- beton ---
  PAT.concrete = tile(64, 64, (c, w, h) => {
    c.fillStyle = grad(c, 0, 0, 0, h, [[0, '#c0c3c6'], [1, '#aeb1b5']]); c.fillRect(0, 0, w, h);
    speckle(c, w, h, 700, 3, 0.1);
    for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(90,95,100,${0.05 + rnd(i) * 0.06})`; c.beginPath(); c.ellipse(rnd(i + 20) * w, rnd(i + 30) * h, 6 + rnd(i) * 8, 3 + rnd(i + 2) * 5, rnd(i) * 3, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, 0, w, 0.9); c.fillRect(0, 0, 0.9, h); c.fillRect(0, 32, w, 0.5);
    [[16, 16], [48, 16], [16, 48], [48, 48]].forEach(p => { c.fillStyle = 'rgba(40,44,50,.55)'; c.beginPath(); c.arc(p[0], p[1], 1.6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(p[0] - .4, p[1] - .4, .6, 0, 7); c.fill(); });
  });
  // --- çelik ---
  PAT.steel = tile(64, 64, (c, w, h) => {
    c.fillStyle = grad(c, 0, 0, 0, h, [[0, '#8493a2'], [.5, '#667585'], [1, '#56626f']]); c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(25,32,40,.55)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(3, 3); c.lineTo(61, 61); c.moveTo(61, 3); c.lineTo(3, 61); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(3, 1.7); c.lineTo(61, 59.7); c.moveTo(61, 1.7); c.lineTo(3, 59.7); c.stroke();
    c.fillStyle = grad(c, 0, 0, 0, 6, [[0, '#a8b5c2'], [1, '#6a7886']]); c.fillRect(0, 0, w, 6); c.fillRect(0, 58, w, 6);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 6, w, 1); c.fillRect(0, 58, w, 1);
    for (const x of [6, 32, 58]) for (const y of [3, 61]) { c.fillStyle = '#39434d'; c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x - .4, y - .5, .55, 0, 7); c.fill(); }
    c.fillStyle = '#ffb62e'; c.fillRect(0, 62.2, w, 1.8); speckle(c, w, h, 260, 11, 0.06);
  });
  // --- alüminyum ---
  PAT.alu = tile(64, 64, (c, w, h) => {
    c.fillStyle = grad(c, 0, 0, w, h, [[0, '#dde2e7'], [.5, '#c3cad2'], [1, '#aab2bb']]); c.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${0.05 + rnd(i) * 0.1})`; c.fillRect(0, rnd(i + 5) * h, w, 0.4); }
    c.fillStyle = 'rgba(30,40,55,.3)'; c.fillRect(0, 0, w, 0.9); c.fillRect(31.5, 0, 0.9, h); c.fillRect(0, 63, w, 1);
    for (const p of [[4, 4], [28, 4], [36, 4], [60, 4], [4, 60], [28, 60], [36, 60], [60, 60]]) { c.fillStyle = '#7f8993'; c.beginPath(); c.arc(p[0], p[1], 1.1, 0, 7); c.fill(); }
  });
  // --- karbon fiber ---
  PAT.carbon = tile(16, 16, (c) => {
    c.fillStyle = '#16181c'; c.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const h = ((i + j) & 1) === 0, x = i * 4, y = j * 4;
      c.fillStyle = h ? grad(c, x, y, x + 4, y, [[0, '#23262c'], [.5, '#4a4f58'], [1, '#1d2025']]) : grad(c, x, y, x, y + 4, [[0, '#23262c'], [.5, '#4a4f58'], [1, '#1d2025']]);
      c.fillRect(x + .2, y + .2, 3.6, 3.6);
    }
  });
  // --- titanyum ---
  PAT.titan = tile(64, 64, (c, w, h) => {
    c.fillStyle = grad(c, 0, 0, w, h, [[0, '#aab4c2'], [.45, '#7c8899'], [1, '#5f6b7d']]); c.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(255,255,255,${0.04 + rnd(i) * 0.09})`; c.fillRect(0, rnd(i + 8) * h, w, 0.35); }
    c.fillStyle = grad(c, 0, 0, w, 0, [[0, 'rgba(255,170,60,0)'], [.5, 'rgba(255,170,60,.55)'], [1, 'rgba(255,170,60,0)']]); c.fillRect(0, 31, w, 1.2);
    c.fillStyle = 'rgba(15,22,34,.5)'; c.fillRect(0, 0, w, .9); c.fillRect(0, 63, w, 1); c.fillRect(0, 0, .9, h);
    for (const p of [[5, 5], [59, 5], [5, 59], [59, 59]]) { c.fillStyle = '#c8d1de'; c.beginPath(); c.arc(p[0], p[1], 1.3, 0, 7); c.fill(); c.fillStyle = '#4b5666'; c.beginPath(); c.arc(p[0] + .3, p[1] + .3, .6, 0, 7); c.fill(); }
  });
  // --- mermer ---
  PAT.marble = tile(128, 64, (c, w, h) => {
    c.fillStyle = grad(c, 0, 0, w, h, [[0, '#f6f4ef'], [1, '#e1ded7']]); c.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { const g = c.createRadialGradient(rnd(i) * w, rnd(i + 3) * h, 2, rnd(i) * w, rnd(i + 3) * h, 30); g.addColorStop(0, 'rgba(150,150,160,.12)'); g.addColorStop(1, 'rgba(150,150,160,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    for (let i = 0; i < 6; i++) { const x0 = 10 + rnd(i * 3) * 100, y0 = 4 + rnd(i * 5) * 8;
      c.strokeStyle = i % 3 === 0 ? 'rgba(201,162,74,.55)' : 'rgba(110,112,125,.4)'; c.lineWidth = 0.4 + rnd(i) * 1.1;
      c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(x0 + 20 * (rnd(i + 1) - .5), y0 + 20, x0 - 25 * rnd(i + 2), y0 + 40, x0 + 30 * (rnd(i + 3) - .3), 62); c.stroke(); }
    c.fillStyle = 'rgba(80,80,90,.25)'; c.fillRect(0, 0, w, .7); c.fillRect(0, 0, .7, h); c.fillRect(63.6, 0, .6, h);
  });
  // --- kuantum ---
  PAT.quantum = tile(64, 64, (c, w, h) => {
    c.fillStyle = grad(c, 0, 0, 0, h, [[0, '#0d1d33'], [1, '#07101f']]); c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(25,224,255,.12)'; c.lineWidth = 0.5; for (let i = 0; i <= 64; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); }
    c.shadowColor = '#19e0ff'; c.shadowBlur = 4; c.strokeStyle = '#19e0ff'; c.lineWidth = 1.1; c.fillStyle = '#7ff3ff';
    const paths = [[[0, 16], [20, 16], [28, 24], [28, 40], [44, 40]], [[64, 8], [48, 8], [40, 16], [40, 28]], [[8, 64], [8, 52], [20, 44], [20, 32]], [[64, 52], [52, 52], [46, 58], [46, 64]]];
    paths.forEach(p => { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.stroke(); const e = p[p.length - 1]; c.beginPath(); c.arc(e[0], e[1], 1.8, 0, 7); c.fill(); });
  });
  // --- yıldız tozu ---
  PAT.cosmic = tile(96, 96, (c, w, h) => {
    c.fillStyle = '#150a33'; c.fillRect(0, 0, w, h);
    [['#7b2cff', 20, 24, 44], ['#ff3cac', 74, 62, 40], ['#2b86ff', 44, 78, 36], ['#a24bff', 80, 16, 30]].forEach(b => { const g = c.createRadialGradient(b[1], b[2], 2, b[1], b[2], b[3]); g.addColorStop(0, b[0] + 'aa'); g.addColorStop(1, b[0] + '00'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    for (let i = 0; i < 90; i++) { const x = rnd(i) * w, y = rnd(i + 70) * h, s = rnd(i + 9); c.fillStyle = `rgba(255,255,255,${0.35 + s * .6})`; c.beginPath(); c.arc(x, y, 0.3 + s * 0.8, 0, 7); c.fill(); }
  });
}

/* ---------- pencereler ---------- */
function windowAt(c, x, y, w, h, lit, seed, frame) {
  c.fillStyle = frame; c.fillRect(x - 2, y - 2, w + 4, h + 4);
  const g = lit ? grad(c, x, y, x, y + h, [[0, '#ffe9a8'], [1, '#ffb347']]) : grad(c, x, y, x + w, y + h, [[0, '#cfeaff'], [.5, '#7ab8e8'], [1, '#4b86c2']]);
  c.fillStyle = g; c.fillRect(x, y, w, h);
  if (!lit) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(x + w * .15, y + h); c.lineTo(x + w * .55, y); c.lineTo(x + w * .8, y); c.lineTo(x + w * .4, y + h); c.fill(); }
  else if (rnd(seed) > 0.4) { const cc = ['#e5586b', '#5aa9e6', '#6fcf97', '#f2c94c'][Math.floor(rnd(seed + 2) * 4)]; c.fillStyle = cc + 'cc'; c.fillRect(x, y, w * .3, h); }
  c.fillStyle = frame; c.fillRect(x + w / 2 - 0.7, y, 1.4, h); c.fillRect(x, y + h * .45, w, 1.2);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x - 3, y + h + 2, w + 6, 2.2); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 3, y + h + 4.2, w + 6, 1);
}

const WALL = { brick: '#f4efe6', wood: '#f4efe6', stone: '#e9e5dc', concrete: '#eef0f2', marble: '#d6a64a', alu: '#f2f5f8' };
const STRIP = { steel: 1, carbon: 1, titan: 1 };

function paintGlass(c, w, h, seed, dark, t) {
  c.fillStyle = grad(c, 0, 0, w, h, [[0, dark > .5 ? '#1a3a5c' : '#a5dcf0'], [.55, dark > .5 ? '#0f2742' : '#5fb0d6'], [1, dark > .5 ? '#0a1b30' : '#3a86b0']]); c.fillRect(0, 0, w, h);
  const off = (rnd(seed) * 40 + t * 3) % 80 - 20;
  c.fillStyle = 'rgba(255,255,255,.22)'; for (let k = -1; k < 3; k++) { const x = off + k * 80; c.beginPath(); c.moveTo(x, h); c.lineTo(x + 26, 0); c.lineTo(x + 44, 0); c.lineTo(x + 18, h); c.fill(); }
  if (dark > .4) for (let i = 0; i < w / 18; i++) for (let j = 0; j < 2; j++) if (rnd(seed * 7 + i * 3 + j) > .55) { c.fillStyle = 'rgba(255,214,120,.75)'; c.fillRect(i * 18 + 4, 8 + j * 20, 10, 10); }
  c.fillStyle = 'rgba(20,40,60,.8)'; for (let x = 0; x <= w; x += 36) c.fillRect(Math.min(x, w - 1.6), 0, 1.6, h); c.fillRect(0, h / 2 - .8, w, 1.6); c.fillRect(0, 0, w, 1.8); c.fillRect(0, h - 2, w, 2);
}

/* Bir katı yerel koordinatta (0..w, 0..h, y aşağı) çizer. */
K.drawFloor = function (c, f, w, h, o) {
  const mat = K.MATS[f.m], k = mat.k, dark = o.dark, t = o.t;
  c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
  if (f.chk) { // taşıyıcı kat
    c.fillStyle = PAT.concrete; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffc21f'; c.fillRect(0, h - 11, w, 11);
    c.fillStyle = '#1b1b1b'; for (let x = -12; x < w + 12; x += 24) { c.beginPath(); c.moveTo(x, h - 11); c.lineTo(x + 12, h - 11); c.lineTo(x + 4, h); c.lineTo(x - 8, h); c.fill(); }
    const cx = w / 2, pw = 78; c.fillStyle = 'rgba(8,16,30,.82)'; c.beginPath(); c.roundRect ? c.roundRect(cx - pw / 2, 7, pw, 24, 6) : c.rect(cx - pw / 2, 7, pw, 24); c.fill();
    c.strokeStyle = '#ffb62e'; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = '#fff'; c.font = '800 17px "Segoe UI",system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.num, cx, 20);
    c.fillStyle = '#ffb62e'; c.beginPath(); c.arc(cx - pw / 2 + 11, 19, 3, 0, 7); c.arc(cx + pw / 2 - 11, 19, 3, 0, 7); c.fill();
  } else if (k === 'glass') paintGlass(c, w, h, f.seed, dark, t);
  else if (k === 'quantum') {
    c.fillStyle = PAT.quantum; c.fillRect(0, 0, w, h);
  } else if (k === 'cosmic') {
    c.fillStyle = PAT.cosmic; c.fillRect(0, 0, w, h);
  } else { c.fillStyle = PAT[k]; c.fillRect(0, 0, w, h); }

  // pencere / kapı / şerit
  if (!f.chk) {
    const night = dark > 0.35;
    if (WALL[k]) {
      const fr = WALL[k], n = w > 235 ? 3 : w > 130 ? 2 : 1, ww = clamp(w * 0.16, 16, 34), wh = h * 0.52, gap = w / (n + 1);
      for (let i = 0; i < n; i++) {
        const cx = gap * (i + 1) - ww / 2, lit = night && rnd(f.seed * 13 + i) > 0.35;
        if (f.seed === 1 && ((n === 3 && i === 1) || (n === 2 && i === 1) || n === 1)) { // giriş kapısı
          const dw = ww * .95, dh = h - 6;
          c.fillStyle = fr; c.fillRect(cx - 3, h - dh - 3, dw + 6, dh + 3); c.fillStyle = grad(c, cx, 0, cx + dw, 0, [[0, '#6b3f1f'], [1, '#8a5428']]); c.fillRect(cx, h - dh, dw, dh);
          c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(cx + 3, h - dh + 4, dw - 6, dh * .38); c.fillRect(cx + 3, h - dh * .5, dw - 6, dh * .42);
          c.fillStyle = '#ffd25a'; c.beginPath(); c.arc(cx + dw - 4, h - dh * .5, 1.5, 0, 7); c.fill();
        } else windowAt(c, cx, h * 0.17, ww, wh, lit, f.seed * 5 + i, fr);
      }
    } else if (STRIP[k]) {
      const lit = night; c.fillStyle = 'rgba(8,14,22,.8)'; c.fillRect(w * .08, h * .3, w * .84, h * .38);
      c.fillStyle = lit ? 'rgba(255,214,120,.9)' : 'rgba(150,205,240,.85)'; c.fillRect(w * .08 + 2, h * .3 + 2, w * .84 - 4, h * .38 - 4);
      c.fillStyle = 'rgba(8,14,22,.6)'; for (let x = w * .08 + 28; x < w * .92; x += 34) c.fillRect(x, h * .3, 1.6, h * .38);
    } else if (k === 'quantum' || k === 'cosmic') {
      const n = Math.max(2, Math.floor(w / 46));
      for (let i = 0; i < n; i++) { const cx = w * (i + 1) / (n + 1), r = 7; const g = c.createRadialGradient(cx, h / 2, 1, cx, h / 2, r * 2.2); const col = k === 'quantum' ? '25,224,255' : '255,130,230';
        g.addColorStop(0, `rgba(${col},.95)`); g.addColorStop(.45, `rgba(${col},.45)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(cx - r * 2.2, 0, r * 4.4, h);
        c.fillStyle = '#05080f'; c.beginPath(); c.arc(cx, h / 2, r, 0, 7); c.fill(); c.fillStyle = `rgba(${col},.9)`; c.beginPath(); c.arc(cx, h / 2, r - 2, 0, 7); c.fill(); }
    }
  }
  // ışık/gölge
  c.fillStyle = grad(c, 0, 0, w, 0, [[0, 'rgba(255,255,255,.16)'], [.25, 'rgba(255,255,255,0)'], [.75, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.26)']]); c.fillRect(0, 0, w, h);
  c.fillStyle = grad(c, 0, 0, 0, h, [[0, 'rgba(255,255,255,.2)'], [.12, 'rgba(255,255,255,0)'], [.8, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.28)']]); c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, h - 1.2, w, 1.2); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 0, w, 1);
  if (dark > .2) { c.fillStyle = `rgba(6,10,40,${dark * 0.28})`; c.fillRect(0, 0, w, h); }
  c.restore();
};

/* Çatı (yerel koordinat; taban y=0, yukarı doğru -y) */
/* Animasyonlu parlama (önbelleğe alınmış kata eklenir) */
K.floorAnim = function (c, f, w, h, t) {
  const k = K.MATS[f.m].k; if (f.chk) return;
  if (k === 'quantum') { const p = (t * 0.7 + f.seed * .37) % 1; c.fillStyle = grad(c, p * (w + 80) - 80, 0, p * (w + 80), 0, [[0, 'rgba(25,224,255,0)'], [.5, 'rgba(25,224,255,.32)'], [1, 'rgba(25,224,255,0)']]); c.fillRect(0, 0, w, h); }
  else if (k === 'cosmic') for (let i = 0; i < 6; i++) { const a = (Math.sin(t * 2 + i * 1.7 + f.seed) + 1) / 2; c.fillStyle = `rgba(255,255,255,${a * .9})`; const x = rnd(f.seed * 3 + i) * w, y = rnd(f.seed * 5 + i) * h; c.fillRect(x - .5, y - 2.5, 1, 5); c.fillRect(x - 2.5, y - .5, 5, 1); }
};
/* Kat sprite önbelleği: her kat bir kez çizilir, sonra drawImage ile basılır */
const cache = new Map();
K.drawFloorCached = function (c, f, w, h, o) {
  const dq = Math.round(o.dark * 10) / 10, key = f.m + '|' + w + '|' + h + '|' + f.seed + '|' + (f.chk ? o.num : 0) + '|' + dq;
  let sp = cache.get(key);
  if (!sp) {
    const S2 = 2, cv = document.createElement('canvas'); cv.width = Math.ceil(w * S2); cv.height = Math.ceil(h * S2);
    const g = cv.getContext('2d'); g.scale(S2, S2); K.drawFloor(g, f, w, h, { dark: dq, t: 0, num: o.num });
    sp = cv; cache.set(key, sp); if (cache.size > 260) cache.delete(cache.keys().next().value);
  }
  c.drawImage(sp, 0, 0, w, h);
  if (f.m >= 10) K.floorAnim(c, f, w, h, o.t);
};

K.drawRoof = function (c, w) {
  const rh = Math.min(w * .42, 96), ov = 16;
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-ov, -3, w + ov * 2, 5);
  c.save(); c.beginPath(); c.moveTo(-ov, 0); c.lineTo(w / 2, -rh); c.lineTo(w + ov, 0); c.closePath(); c.clip();
  c.fillStyle = grad(c, 0, -rh, 0, 0, [[0, '#d9573e'], [1, '#8f2f20']]); c.fillRect(-ov, -rh, w + ov * 2, rh);
  c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1; for (let y = -rh + 10; y < 0; y += 10) { c.beginPath(); c.moveTo(-ov, y); c.lineTo(w + ov, y); c.stroke(); for (let x = -ov + ((y / 10) & 1) * 9; x < w + ov; x += 18) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 10); c.stroke(); } }
  c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(-ov, 0); c.lineTo(w / 2, -rh); c.lineTo(w / 2, 0); c.fill();
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(w / 2, -rh); c.lineTo(w + ov, 0); c.lineTo(w / 2, 0); c.fill();
  c.restore();
  c.strokeStyle = '#5a1a10'; c.lineWidth = 3; c.beginPath(); c.moveTo(-ov, 0); c.lineTo(w / 2, -rh); c.lineTo(w + ov, 0); c.stroke();
  const cx = w * .72; c.fillStyle = '#7b4a38'; c.fillRect(cx, -rh * .8, 16, rh * .65); c.fillStyle = '#4e2c20'; c.fillRect(cx - 2, -rh * .8 - 4, 20, 6);
  c.fillStyle = '#ffd25a'; c.beginPath(); c.arc(w / 2, -rh * .42, 7, 0, 7); c.fill(); c.strokeStyle = '#5a1a10'; c.lineWidth = 2; c.stroke();
};

/* ---------- bulut sprite'ları ---------- */
K.clouds = [];
function buildClouds() {
  for (let n = 0; n < 5; n++) {
    const cv = document.createElement('canvas'); cv.width = 360; cv.height = 190; const c = cv.getContext('2d');
    const puffs = 7 + n; for (let i = 0; i < puffs; i++) {
      const x = 50 + rnd(n * 20 + i) * 260, r = 26 + rnd(n * 20 + i + 3) * 30, y = 120 - rnd(n * 20 + i + 6) * 30 - r * .3;
      const g = c.createRadialGradient(x - r * .2, y - r * .3, r * .1, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.7, 'rgba(240,247,255,.8)'); g.addColorStop(1, 'rgba(215,230,248,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    }
    c.globalCompositeOperation = 'source-atop'; const base = c.createLinearGradient(0, 80, 0, 150); base.addColorStop(0, 'rgba(160,185,215,0)'); base.addColorStop(1, 'rgba(140,165,205,.5)'); c.fillStyle = base; c.fillRect(0, 0, 360, 190); c.globalCompositeOperation = 'source-over';
    K.clouds.push(cv);
  }
}

K.buildArt = () => { build(); buildClouds(); };
})();
