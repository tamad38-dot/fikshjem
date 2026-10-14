'use strict';
/* Kat Kat — sahne çizimi (gökyüzü, zemin, iş makineleri, vinç, kuleler, parçacıklar). */
(() => {
const { clamp, lerp, smooth, rnd, C } = K;
let c, V, S;
const X = wx => V.W / 2 + (wx - V.cx) * V.s;
const Y = wy => V.H - (wy - V.cy) * V.s;

const SKY = [
  [0, '#3f9cea', '#d6edfb'], [150, '#2b86d6', '#aad4f1'], [600, '#1b5fb0', '#80b3e1'], [1500, '#0d2f6b', '#3b6baa'],
  [3000, '#060f33', '#1c306c'], [5000, '#02040f', '#0a1233'], [8000, '#010208', '#130b2c'], [10000, '#000004', '#2b1555'],
];
function skyAt(alt) {
  let i = 0; while (i < SKY.length - 2 && alt > SKY[i + 1][0]) i++;
  const a = SKY[i], b = SKY[i + 1], t = clamp((alt - a[0]) / (b[0] - a[0]), 0, 1);
  return [K.mixRGB(K.hex(a[1]), K.hex(b[1]), t), K.mixRGB(K.hex(a[2]), K.hex(b[2]), t)];
}
const STARS = Array.from({ length: 320 }, (_, i) => [rnd(i), rnd(i + 500), 0.4 + rnd(i + 900) * 1.4, rnd(i + 1300) * 6.28]);

function glow(x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawSky() {
  const [top, bot] = skyAt(V.alt);
  const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, K.rgb(top)); g.addColorStop(1, K.rgb(bot));
  c.fillStyle = g; c.fillRect(0, 0, V.W, V.H);
  const sa = smooth(1500, 4200, V.alt);
  // nebula
  const na = smooth(4800, 8000, V.alt);
  if (na > 0.01) {
    const sh = V.cy * 0.002;
    glow(V.W * .25, V.H * (.3 + sh % .2), V.W * .55, '110,60,220', .28 * na); glow(V.W * .8, V.H * .6, V.W * .5, '30,170,220', .2 * na); glow(V.W * .5, V.H * .15, V.W * .45, '230,60,170', .18 * na);
  }
  // yıldızlar
  if (sa > 0.01) {
    for (const s of STARS) {
      const tw = .55 + .45 * Math.sin(V.t * (1 + s[2]) + s[3]);
      c.fillStyle = `rgba(255,255,255,${sa * tw * (.35 + s[2] * .35)})`;
      const px = s[0] * V.W, py = ((s[1] * V.H * 1.3 - V.cy * 0.015 * V.s) % (V.H * 1.3) + V.H * 1.3) % (V.H * 1.3);
      if (py > V.H) continue; c.beginPath(); c.arc(px, py, s[2] * .9, 0, 7); c.fill();
    }
    const ph = (V.t % 5.3) / 0.9; if (ph < 1 && V.alt > 3500) { const x = V.W * (.2 + .6 * rnd(Math.floor(V.t / 5.3))), y = V.H * .25 * rnd(Math.floor(V.t / 5.3) + 4);
      const g2 = c.createLinearGradient(x + ph * 260, y + ph * 120, x + ph * 260 - 90, y + ph * 120 - 40); g2.addColorStop(0, `rgba(255,255,255,${sa * (1 - ph)})`); g2.addColorStop(1, 'rgba(255,255,255,0)');
      c.strokeStyle = g2; c.lineWidth = 2; c.beginPath(); c.moveTo(x + ph * 260, y + ph * 120); c.lineTo(x + ph * 260 - 90, y + ph * 120 - 40); c.stroke(); }
  }
  // güneş
  const sun = 1 - smooth(500, 1600, V.alt);
  if (sun > 0.01) {
    const sx = V.W * .8, sy = V.H * .17 + V.alt * 0.02; glow(sx, sy, 260, '255,236,170', .55 * sun); glow(sx, sy, 90, '255,248,215', .9 * sun);
    c.fillStyle = `rgba(255,252,235,${sun})`; c.beginPath(); c.arc(sx, sy, 34, 0, 7); c.fill();
  }
  // ay
  const ma = smooth(3400, 5000, V.alt);
  if (ma > .01) {
    const mx = V.W * .2, my = V.H * .2, r = Math.min(V.W, V.H) * .08; glow(mx, my, r * 3, '200,215,255', .25 * ma);
    const mg = c.createRadialGradient(mx - r * .3, my - r * .3, r * .1, mx, my, r); mg.addColorStop(0, `rgba(245,247,255,${ma})`); mg.addColorStop(1, `rgba(170,182,210,${ma})`);
    c.fillStyle = mg; c.beginPath(); c.arc(mx, my, r, 0, 7); c.fill();
    c.fillStyle = `rgba(120,130,160,${.35 * ma})`; [[-.3, -.1, .22], [.25, .2, .17], [.1, -.4, .12], [-.1, .4, .1]].forEach(k => { c.beginPath(); c.arc(mx + k[0] * r, my + k[1] * r, k[2] * r, 0, 7); c.fill(); });
  }
  // halkalı gezegen
  const pa = smooth(6800, 8800, V.alt);
  if (pa > .01) {
    const px = V.W * .78, py = V.H * .3, r = Math.min(V.W, V.H) * .11; c.save(); c.globalAlpha = pa;
    c.strokeStyle = 'rgba(230,200,150,.55)'; c.lineWidth = r * .16; c.beginPath(); c.ellipse(px, py, r * 1.9, r * .5, -.35, Math.PI, 0); c.stroke();
    const pg = c.createRadialGradient(px - r * .4, py - r * .4, r * .1, px, py, r); pg.addColorStop(0, '#f6d7a4'); pg.addColorStop(.6, '#c98a55'); pg.addColorStop(1, '#5a3220'); c.fillStyle = pg; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = r * .08; for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(px, py + i * r * .24, r * Math.sqrt(1 - (i * .24) ** 2) * .98, r * .06, 0, 0, 7); c.stroke(); }
    c.strokeStyle = 'rgba(230,200,150,.75)'; c.lineWidth = r * .16; c.beginPath(); c.ellipse(px, py, r * 1.9, r * .5, -.35, 0, Math.PI); c.stroke(); c.restore();
  }
}

function drawClouds() {
  const fade = 1 - smooth(1100, 2600, V.alt); if (fade <= 0.01) return;
  const layers = [[.3, 0.55], [.55, 0.8], [.85, 1]];
  for (const [p, a] of layers) {
    const row = 520, lo = V.cy * p - 260, hi = V.cy * p + V.H / V.s + 260, span = V.W / V.s + 600;
    for (let j = Math.max(0, Math.floor(lo / row)); j <= Math.floor(hi / row); j++) for (let k = 0; k < 2; k++) {
      const key = j * 7 + k * 31 + p * 100, wy = j * row + rnd(key) * row * .8 + 90;
      const x = (((rnd(key + 2) * span + V.t * (6 + p * 14)) % span) + span) % span - span / 2;
      const sc = (0.6 + rnd(key + 3) * .8) * (0.55 + p * .6), spr = K.clouds[Math.floor(rnd(key + 4) * K.clouds.length)];
      const sy = V.H - (wy - V.cy * p) * V.s; c.globalAlpha = fade * a * (0.5 + .5 * rnd(key + 5));
      c.drawImage(spr, X(x) - 180 * sc * V.s, sy - 120 * sc * V.s, 360 * sc * V.s, 190 * sc * V.s);
    }
  }
  c.globalAlpha = 1;
}

function drawLimb() {
  const a = smooth(1100, 2800, V.alt); if (a < .01) return;
  const vis = V.H * (0.03 + 0.17 * smooth(1000, 7000, V.alt)), R = V.W * 2.4, cx = V.W / 2, cyc = V.H - vis + R;
  c.save(); c.globalAlpha = a;
  const atm = c.createRadialGradient(cx, cyc, R * .985, cx, cyc, R * 1.02); atm.addColorStop(0, 'rgba(120,200,255,.75)'); atm.addColorStop(1, 'rgba(120,200,255,0)');
  c.fillStyle = atm; c.beginPath(); c.arc(cx, cyc, R * 1.02, 0, 7); c.fill();
  const pg = c.createLinearGradient(0, V.H - vis, 0, V.H); pg.addColorStop(0, '#3d93d6'); pg.addColorStop(.35, '#1d62a3'); pg.addColorStop(1, '#0a2a52');
  c.fillStyle = pg; c.beginPath(); c.arc(cx, cyc, R, 0, 7); c.fill();
  c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < 18; i++) { c.beginPath(); c.ellipse(cx + (rnd(i) - .5) * V.W * 1.6, V.H - vis * rnd(i + 5) * .9, 60 + rnd(i + 2) * 160, 6 + rnd(i + 3) * 10, 0, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(70,150,80,.35)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(cx + (rnd(i + 40) - .5) * V.W * 1.4, V.H - vis * (.2 + rnd(i + 41) * .6), 90 + rnd(i) * 120, 14 + rnd(i + 8) * 16, 0, 0, 7); c.fill(); }
  c.restore(); c.restore();
}

/* ---- yakın zemin manzarası ---- */
function drawScenery(g0) {
  const u = Y(0) - g0; if (Y(0) - 160 * V.s > V.H + 50 || V.alt > 500) return;
  const night = V.dark;
  const layer = (p, col, amp, per, ph) => {
    const base = g0 + u * p; if (base - amp * 2 > V.H) return;
    c.fillStyle = col; c.beginPath(); c.moveTo(0, V.H);
    for (let x = 0; x <= V.W; x += 8) c.lineTo(x, base - amp * (0.55 + 0.45 * Math.sin(x * per + ph) * Math.cos(x * per * 0.37 + ph * 2)) - amp * .35);
    c.lineTo(V.W, V.H); c.fill();
  };
  const hz = K.hex('#cfe6f6');
  layer(.08, K.rgb(K.mixRGB([150, 182, 206], [20, 30, 60], night)), 120 * V.s + 30, .004, 1);
  layer(.18, K.rgb(K.mixRGB([128, 166, 176], [16, 26, 50], night)), 80 * V.s + 22, .0065, 3);
  // şehir silüeti
  const base = g0 + u * .3; if (base - 200 < V.H) {
    for (let i = 0; i < 40; i++) {
      const bw = (26 + rnd(i) * 40) * Math.max(.7, V.s), bh = (50 + rnd(i + 9) * 150) * Math.max(.7, V.s), x = (i / 40) * (V.W + 80) - 40 + rnd(i + 3) * 18;
      c.fillStyle = K.rgb(K.mixRGB([118, 142, 168], [20, 32, 60], night)); c.fillRect(x, base - bh, bw, bh + 40);
      c.fillStyle = night > .3 ? 'rgba(255,214,120,.55)' : 'rgba(255,255,255,.18)';
      for (let yy = base - bh + 8; yy < base - 6; yy += 14) for (let xx = x + 5; xx < x + bw - 6; xx += 11) if (rnd(i * 31 + xx + yy) > .5) c.fillRect(xx, yy, 4, 6);
    }
  }
  layer(.38, K.rgb(K.mixRGB([98, 146, 112], [12, 30, 40], night)), 46 * V.s + 14, .011, 5);
  // ağaçlar
  const tb = g0 + u * .6;
  for (let i = 0; i < 14; i++) {
    const x = ((i * 137 + 40) % (V.W + 120)) - 60, hgt = (36 + rnd(i + 3) * 40) * Math.max(.8, V.s * 1.2);
    c.fillStyle = K.rgb(K.mixRGB([46, 112, 62], [8, 26, 28], night)); c.beginPath(); c.moveTo(x - hgt * .32, tb); c.lineTo(x, tb - hgt); c.lineTo(x + hgt * .32, tb); c.fill();
  }
}

/* ---- zemin ---- */
function surf(x) {
  const h = S.h, f = (x - C.TX0) / C.DX; if (f <= 0) return h[0]; if (f >= C.NCOL - 1) return h[C.NCOL - 1];
  const i = f | 0, t = f - i; return h[i] * (1 - t) + h[i + 1] * t;
}
function drawGround() {
  const y0 = Y(0); if (y0 - 130 * V.s > V.H) return;
  const wl = V.cx - V.W / 2 / V.s, wr = V.cx + V.W / 2 / V.s;
  const edge = [];
  edge.push([0, Y(surf(wl))]);
  const i0 = Math.max(0, Math.floor((wl - C.TX0) / C.DX)), i1 = Math.min(C.NCOL - 1, Math.ceil((wr - C.TX0) / C.DX));
  for (let i = i0; i <= i1; i++) edge.push([X(C.TX0 + i * C.DX), Y(S.h[i])]);
  edge.push([V.W, Y(surf(wr))]);
  const sg = c.createLinearGradient(0, y0 - 40 * V.s, 0, y0 + 190 * V.s);
  sg.addColorStop(0, '#7a5434'); sg.addColorStop(.3, '#5c3e25'); sg.addColorStop(.62, '#4a3220'); sg.addColorStop(1, '#2e2216');
  c.fillStyle = sg; c.beginPath(); c.moveTo(0, V.H + 4); edge.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(V.W, V.H + 4); c.closePath(); c.fill();
  // taban kaya
  const yb = Y(C.BEDROCK + 2); if (yb < V.H) { c.save(); c.clip(); const rg = c.createLinearGradient(0, yb, 0, yb + 90 * V.s); rg.addColorStop(0, '#6b6a68'); rg.addColorStop(1, '#3a3a3c'); c.fillStyle = rg; c.fillRect(0, yb, V.W, V.H - yb);
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < V.W; x += 38 * V.s) c.fillRect(x, yb, 1.5, V.H - yb); c.restore(); }
  // çakıl / taş
  c.save(); c.clip();
  const gs = 38;
  for (let gx = Math.floor(wl / gs); gx <= Math.ceil(wr / gs); gx++) for (let gy = 0; gy < 5; gy++) {
    const k = gx * 13.7 + gy * 5.3; if (rnd(k) < .45) continue;
    const wx = gx * gs + rnd(k + 1) * gs, wy = -(gy * gs + rnd(k + 2) * gs) - 10; if (wy > surf(wx) - 8 || wy < C.BEDROCK + 4) continue;
    const r = (2 + rnd(k + 3) * 4) * V.s; c.fillStyle = rnd(k + 4) > .5 ? 'rgba(210,190,160,.35)' : 'rgba(25,15,8,.35)';
    c.beginPath(); c.ellipse(X(wx), Y(wy), r * 1.3, r, rnd(k + 5) * 3, 0, 7); c.fill();
  }
  c.restore();
  // beton (temel)
  if (S.pourLevel > C.BEDROCK) {
    c.save(); c.translate(X(0), Y(0)); c.scale(V.s, V.s);
    c.fillStyle = K.PAT.concrete;
    for (let i = 0; i < C.NCOL; i++) { const x = C.TX0 + i * C.DX; if (x < C.PIT_L - 40 || x > C.PIT_R + 40) continue; const top = Math.min(S.pourLevel, 0), bot = S.h[i]; if (bot < top) c.fillRect(x - .2, -top, C.DX + .4, top - bot); }
    // donatı
    c.strokeStyle = 'rgba(40,30,28,.55)'; c.lineWidth = 1.4; for (let y = -12; y > C.BEDROCK; y -= 18) { if (y > S.pourLevel - 4) continue; c.beginPath(); c.moveTo(C.PIT_L + 10, -y); c.lineTo(C.PIT_R - 10, -y); c.stroke(); }
    if (S.pourLevel > C.BEDROCK + 2) { const tl = Math.min(S.pourLevel, 0); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(C.PIT_L + 6, -tl, C.PIT_R - C.PIT_L - 12, 2.2); }
    c.restore();
  }
  // çim kenarı
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = i0; i < i1; i++) {
    const a = S.h[i], b = S.h[i + 1], depth = -(a + b) / 2, x0 = X(C.TX0 + i * C.DX), x1 = X(C.TX0 + (i + 1) * C.DX);
    if (depth < 8 && depth > -6) { c.strokeStyle = '#4fa83d'; c.lineWidth = 8 * V.s + 1; c.beginPath(); c.moveTo(x0, Y(a) + 1.5 * V.s); c.lineTo(x1, Y(b) + 1.5 * V.s); c.stroke();
      c.strokeStyle = '#7fd35e'; c.lineWidth = 2.2 * V.s + .5; c.beginPath(); c.moveTo(x0, Y(a) - 1.5 * V.s); c.lineTo(x1, Y(b) - 1.5 * V.s); c.stroke(); }
    else { c.strokeStyle = '#8a6a48'; c.lineWidth = 3 * V.s + .5; c.beginPath(); c.moveTo(x0, Y(a)); c.lineTo(x1, Y(b)); c.stroke(); }
  }
  // çim tutamları
  c.strokeStyle = '#5db547'; c.lineWidth = Math.max(1, 1.4 * V.s);
  for (let gx = Math.floor(wl / 14); gx <= Math.ceil(wr / 14); gx++) { const wx = gx * 14 + rnd(gx) * 10, sy = surf(wx); if (sy < -6 || rnd(gx + .5) < .35) continue; const px = X(wx), py = Y(sy) - 2 * V.s, hh = (5 + rnd(gx + 2) * 7) * V.s;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px - 2.5 * V.s, py - hh); c.moveTo(px, py); c.lineTo(px + 2 * V.s, py - hh * .8); c.stroke(); }
  // kule gölgesi
  if (S.floors.length && Y(0) < V.H) { const w = Math.max(...S.floors.slice(0, 12).map(f => f.w), 150), g = c.createRadialGradient(X(0), y0, 0, X(0), y0, w * V.s * 1.1);
    g.addColorStop(0, 'rgba(0,0,0,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.translate(0, y0); c.scale(1, .16); c.translate(0, -y0); c.fillStyle = g; c.fillRect(X(0) - w * V.s * 1.2, y0 - w * V.s * 1.2, w * V.s * 2.4, w * V.s * 2.4); c.restore(); }
}

/* ---- iş makineleri (y yukarı koordinat) ---- */
function rr(x, y, w, h, r, fill) { c.fillStyle = fill; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fill(); }
const vg = (x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(s => g.addColorStop(s[0], s[1])); return g; };
function limb(p, q, w, col, outline) { c.lineCap = 'round'; if (outline) { c.strokeStyle = outline; c.lineWidth = w + 5; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); } c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }

function drawExcavator() {
  const E = S.exc; if (E.off < -1100) return;
  c.save(); c.translate(X(E.off), Y(0)); c.scale(V.s, -V.s);
  // paletli şasi
  rr(-455, 0, 238, 34, 17, '#23272d'); rr(-452, 3, 232, 28, 14, vg(0, 0, 0, 34, [[0, '#3a3f47'], [1, '#1b1e23']]));
  c.fillStyle = '#4a4f58'; [[-437, 17, 14], [-235, 17, 14], [-380, 10, 7], [-336, 10, 7], [-292, 10, 7]].forEach(w => { c.beginPath(); c.arc(w[0], w[1], w[2], 0, 7); c.fill(); c.fillStyle = '#1b1e23'; c.beginPath(); c.arc(w[0], w[1], w[2] * .38, 0, 7); c.fill(); c.fillStyle = '#4a4f58'; });
  c.setLineDash([6, 5]); c.lineDashOffset = -E.tread; c.strokeStyle = '#0f1114'; c.lineWidth = 3; c.beginPath(); c.moveTo(-440, 1.5); c.lineTo(-232, 1.5); c.moveTo(-440, 32.5); c.lineTo(-232, 32.5); c.stroke(); c.setLineDash([]);
  // gövde
  rr(-448, 34, 226, 40, 8, vg(0, 34, 0, 74, [[0, '#e8a010'], [.5, '#ffcf33'], [1, '#ffe27a']]));
  rr(-462, 36, 62, 66, 8, vg(0, 36, 0, 102, [[0, '#a8730a'], [1, '#d99410']]));
  c.fillStyle = 'rgba(0,0,0,.35)'; for (let x = -455; x < -405; x += 12) c.fillRect(x, 40, 5, 56);
  rr(-398, 74, 108, 16, 5, vg(0, 74, 0, 90, [[0, '#ffe27a'], [1, '#e8a010']]));
  c.fillStyle = '#2a2e35'; for (let x = -390; x < -300; x += 9) c.fillRect(x, 77, 4, 10);
  // kabin
  c.fillStyle = vg(0, 74, 0, 134, [[0, '#ffe27a'], [1, '#e8a010']]); c.beginPath(); c.moveTo(-402, 74); c.lineTo(-402, 118); c.quadraticCurveTo(-402, 134, -386, 134); c.lineTo(-332, 134); c.lineTo(-322, 74); c.fill();
  c.fillStyle = vg(0, 78, 0, 128, [[0, '#cfeaff'], [1, '#5fa6d8']]); c.beginPath(); c.moveTo(-394, 80); c.lineTo(-394, 116); c.quadraticCurveTo(-394, 126, -384, 126); c.lineTo(-340, 126); c.lineTo(-331, 80); c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(-388, 82); c.lineTo(-372, 82); c.lineTo(-392, 124); c.lineTo(-394, 124); c.fill();
  c.fillStyle = '#2a2e35'; c.fillRect(-370, 128, 14, 20); c.fillStyle = '#ff7a1f'; c.beginPath(); c.arc(-363, 152, 4, 0, 7); c.fill();
  // kol
  const P = E.P, El = E.elbow, Sx = E.stick, T = E.tip;
  const nx = -(El[1] - P[1]), ny = El[0] - P[0], nl = Math.hypot(nx, ny) || 1, bend = 30;
  const mid = [(P[0] + El[0]) / 2 + nx / nl * bend, (P[1] + El[1]) / 2 + ny / nl * bend];
  // silindir 1
  limb([P[0] - 40, P[1] - 4], [P[0] + (mid[0] - P[0]) * .75, P[1] + (mid[1] - P[1]) * .75 - 8], 8, '#9aa3ad', '#2a2e35'); limb([P[0] - 40, P[1] - 4], [P[0] + (mid[0] - P[0]) * .4, P[1] + (mid[1] - P[1]) * .4 - 4], 12, '#5d6670', '#2a2e35');
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#2b2208'; c.lineWidth = 31; c.beginPath(); c.moveTo(P[0], P[1]); c.quadraticCurveTo(mid[0], mid[1], El[0], El[1]); c.stroke();
  c.strokeStyle = '#f5b82e'; c.lineWidth = 25; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 4; c.beginPath(); c.moveTo(P[0], P[1] + 6); c.quadraticCurveTo(mid[0], mid[1] + 6, El[0], El[1] + 6); c.stroke();
  limb(El, Sx, 17, '#f5b82e', '#2b2208'); limb([El[0], El[1] + 5], [Sx[0], Sx[1] + 5], 3.5, 'rgba(255,255,255,.4)');
  // silindir 2 (çubuk)
  const q = [El[0] + (mid[0] - El[0]) * .55, El[1] + (mid[1] - El[1]) * .55 + 10]; limb(q, [Sx[0] + (El[0] - Sx[0]) * .35, Sx[1] + (El[1] - Sx[1]) * .35 + 4], 7, '#9aa3ad', '#2a2e35');
  [P, El, Sx].forEach(p => { c.fillStyle = '#2a2e35'; c.beginPath(); c.arc(p[0], p[1], 10, 0, 7); c.fill(); c.fillStyle = '#ffcf33'; c.beginPath(); c.arc(p[0], p[1], 5, 0, 7); c.fill(); });
  // kepçe (S noktasından aşağı sarkar; uç noktası (44,-36))
  c.save(); c.translate(Sx[0], Sx[1]); c.rotate(E.bucketRot);
  c.fillStyle = vg(0, 4, 0, -44, [[0, '#9aa4b0'], [1, '#4b535d']]); c.strokeStyle = '#1e2227'; c.lineWidth = 2.6; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-8, 4); c.quadraticCurveTo(-16, -30, 14, -42); c.lineTo(44, -36); c.lineTo(34, -14); c.quadraticCurveTo(26, -2, 10, 6); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#d9dee4'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(18 + k * 9, -41 + k * 1.2); c.lineTo(27 + k * 9, -50 + k * 1.2); c.lineTo(30 + k * 9, -39 + k * 1.2); c.fill(); }
  c.restore();
  c.restore();
}

function drawTruck() {
  const T = S.truck; if (T.off < -1100) return;
  c.save(); c.translate(X(T.off), Y(0)); c.scale(V.s, -V.s);
  rr(-530, 22, 285, 12, 3, '#23272d');
  // kabin
  c.fillStyle = vg(0, 34, 0, 118, [[0, '#d9dde2'], [1, '#ffffff']]); c.beginPath(); c.moveTo(-532, 34); c.lineTo(-532, 98); c.lineTo(-516, 118); c.lineTo(-476, 118); c.lineTo(-468, 34); c.fill();
  c.fillStyle = vg(0, 70, 0, 112, [[0, '#cfeaff'], [1, '#5fa6d8']]); c.beginPath(); c.moveTo(-526, 70); c.lineTo(-526, 96); c.lineTo(-514, 111); c.lineTo(-482, 111); c.lineTo(-478, 70); c.fill();
  c.fillStyle = '#ff7a1f'; c.fillRect(-532, 34, 64, 8);
  c.fillStyle = '#fff3c4'; c.fillRect(-532, 52, 6, 10);
  // tambur
  c.save(); c.translate(-355, 92); c.rotate(.12);
  c.fillStyle = vg(0, -44, 0, 44, [[0, '#ffb04d'], [.45, '#f08a24'], [1, '#a85410']]); c.beginPath(); c.moveTo(-108, -26); c.quadraticCurveTo(-110, 44, -70, 44); c.lineTo(80, 36); c.quadraticCurveTo(116, 12, 100, -10); c.lineTo(86, -24); c.quadraticCurveTo(-20, -48, -108, -26); c.fill();
  c.save(); c.clip(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 7; const off = S.truck.spin;
  for (let k = -3; k < 9; k++) { c.beginPath(); c.moveTo(-120 + k * 30 + off, -50); c.lineTo(-84 + k * 30 + off, 50); c.stroke(); }
  c.restore(); c.strokeStyle = '#7a3b08'; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = '#c9ccd1'; c.beginPath(); c.arc(-100, 6, 11, 0, 7); c.fill(); c.restore();
  // oluk
  limb([-262, 106], [-112, 52], 17, '#8b939c', '#2a2e35'); limb([-262, 112], [-112, 58], 4, 'rgba(255,255,255,.5)');
  // tekerler
  [[-495, 22], [-330, 22], [-285, 22]].forEach(w => { c.fillStyle = '#15171b'; c.beginPath(); c.arc(w[0], w[1], 25, 0, 7); c.fill(); c.fillStyle = '#8b939c'; c.beginPath(); c.arc(w[0], w[1], 12, 0, 7); c.fill(); c.fillStyle = '#2a2e35'; c.beginPath(); c.arc(w[0], w[1], 4, 0, 7); c.fill(); });
  // akan beton
  if (T.pouring && S.pourLevel < 16) { const y1 = S.pourLevel; c.fillStyle = '#9c9fa3'; c.fillRect(-116, y1, 11, 52 - y1); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-114, y1, 2.5, 52 - y1); }
  c.restore();
}

/* ---- vinç ---- */
function drawCrane() {
  const a = S.craneIn; if (a <= 0.001) return;
  const jy = V.H * 0.065 - (1 - a) * (V.H * .25), mw = clamp(34 * V.s, 20, 38), mx = 62 + mw / 2;
  const top = Math.max(0, V.cy - 10), yTop = jy + 12, yBot = Y(0);
  // direk
  const y0 = Math.min(V.H + 10, yBot), step = 60;
  c.strokeStyle = '#d99410'; c.lineWidth = Math.max(2, 3 * V.s);
  c.beginPath(); c.moveTo(mx - mw / 2, yTop); c.lineTo(mx - mw / 2, y0); c.moveTo(mx + mw / 2, yTop); c.lineTo(mx + mw / 2, y0); c.stroke();
  c.strokeStyle = '#f5b82e'; c.lineWidth = Math.max(1.2, 2 * V.s); c.beginPath();
  const wStart = Math.floor(Math.max(0, V.cy - 10) / step) * step; for (let wy = wStart; Y(wy) > yTop - 2; wy += step) { const ya = Y(wy), yb = Y(wy + step); if (ya < 0 - 5 && yb < 0) break; const flip = (wy / step) & 1; c.moveTo(mx + (flip ? mw : -mw) / 2, ya); c.lineTo(mx + (flip ? -mw : mw) / 2, yb); c.moveTo(mx - mw / 2, yb); c.lineTo(mx + mw / 2, yb); }
  c.stroke();
  if (yBot < V.H + 10) { c.fillStyle = '#4a4f58'; c.fillRect(mx - mw, yBot - 6 * V.s, mw * 2, 8 * V.s); }
  // kule başı + kabin
  const th = 24;
  c.fillStyle = vg(0, jy - 8, 0, jy + 22, [[0, '#ffd25a'], [1, '#e8a010']]); c.fillRect(mx - mw / 2 - 4, jy - 8, mw + 8, 24);
  c.fillStyle = vg(0, jy + 14, 0, jy + 46, [[0, '#ffe27a'], [1, '#e8a010']]); c.fillRect(mx - mw / 2 - 12, jy + 14, 28, 32);
  c.fillStyle = vg(0, jy + 18, 0, jy + 40, [[0, '#cfeaff'], [1, '#5fa6d8']]); c.fillRect(mx - mw / 2 - 9, jy + 18, 20, 20);
  // karşı ağırlık kolu
  const cwEnd = 6;
  c.fillStyle = '#c98a12'; c.fillRect(cwEnd, jy + 3, mx - cwEnd, 6); c.fillStyle = '#7e8791'; for (let i = 0; i < 3; i++) { c.fillRect(cwEnd + 4 + i * 20, jy + 9, 18, 24); c.fillStyle = i % 2 ? '#7e8791' : '#6b747d'; }
  // jib
  const jEnd = V.W + 10, jx0 = mx + mw / 2;
  c.fillStyle = vg(0, jy - 2, 0, jy + 22, [[0, '#ffd25a'], [1, '#e8a010']]); c.fillRect(jx0, jy - 2, jEnd - jx0, 4); c.fillRect(jx0, jy + 17, jEnd - jx0, 4);
  c.strokeStyle = '#c98a12'; c.lineWidth = 2; c.beginPath(); for (let x = jx0; x < jEnd; x += 26) { c.moveTo(x, jy + 19); c.lineTo(x + 13, jy); c.lineTo(x + 26, jy + 19); } c.stroke();
  // tepe ve halatlar
  const ap = [mx, jy - 62]; c.fillStyle = '#d99410'; c.beginPath(); c.moveTo(mx - mw / 2, jy - 8); c.lineTo(ap[0], ap[1]); c.lineTo(mx + mw / 2, jy - 8); c.fill();
  c.strokeStyle = 'rgba(40,40,40,.75)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(ap[0], ap[1]); c.lineTo(Math.min(jEnd, mx + 420), jy - 1); c.moveTo(ap[0], ap[1]); c.lineTo(cwEnd + 20, jy + 3); c.stroke();
  c.fillStyle = '#ff3b3b'; c.globalAlpha = .5 + .5 * Math.sin(V.t * 5); c.beginPath(); c.arc(ap[0], ap[1] - 3, 3.2, 0, 7); c.fill(); c.globalAlpha = 1;
  // troley
  const hx = X(S.hookX); c.fillStyle = vg(0, jy + 20, 0, jy + 32, [[0, '#4a4f58'], [1, '#23272d']]); c.fillRect(hx - 15, jy + 20, 30, 12);
  S._trolley = [hx, jy + 32];
}

/* ---- kule ---- */
function drawTower() {
  const n = S.floors.length, H = C.FLOOR_H; if (!n) return;
  const wyMin = V.cy - 10, wyMax = V.cy + V.H / V.s + 10;
  const i0 = Math.max(0, Math.floor(wyMin / H) - 1), i1 = Math.min(n - 1, Math.ceil(wyMax / H));
  for (let i = i0; i <= i1; i++) {
    const f = S.floors[i], y0 = i * H, sw = S.sway(y0 + H / 2);
    c.save(); c.translate(X(f.cx - f.w / 2 + sw), Y(y0 + H)); c.scale(V.s, V.s); K.drawFloorCached(c, f, f.w, H + .6, { dark: V.dark, t: V.t, num: i + 1 }); c.restore();
  }
  if (S.roof) {
    const f = S.floors[n - 1], e = 1 - Math.pow(1 - S.roofT, 3), sw = S.sway(n * H);
    c.save(); c.translate(X(f.cx - f.w / 2 + sw), Y(n * H + (1 - e) * 260)); c.scale(V.s, V.s); c.globalAlpha = Math.min(1, S.roofT * 3); K.drawRoof(c, f.w); c.restore();
  }
}

function drawBlockAt(f, x, ybottom, rot, scale, alpha) {
  c.save(); c.translate(X(x), Y(ybottom)); c.scale(V.s * scale, V.s * scale); if (rot) c.rotate(rot); c.globalAlpha = alpha == null ? 1 : alpha;
  c.translate(-f.w / 2, -C.FLOOR_H); K.drawFloorCached(c, f, f.w, C.FLOOR_H, { dark: V.dark, t: V.t, num: S.floors.length + 1 }); c.restore();
}

function drawActiveBlock() {
  if (S.mode !== 'build' && S.mode !== 'menu' && S.mode !== 'collapse') return;
  const tr = S._trolley || [X(S.hookX), 40];
  if (S.hang && S.craneIn > .9) {
    const h = S.hang, bx = X(h.x), by = Y(h.y), top = by - C.FLOOR_H * V.s * h.scale, hy = top - 22 * V.s;
    c.strokeStyle = '#2a2e35'; c.lineWidth = Math.max(1.5, 2 * V.s); c.beginPath(); c.moveTo(tr[0], tr[1]); c.lineTo(bx + Math.sin(h.tilt) * 0, hy); c.stroke();
    // kanca
    c.fillStyle = '#e8a010'; c.strokeStyle = '#2a2e35'; c.lineWidth = 1.5; c.beginPath(); c.roundRect ? c.roundRect(bx - 9 * V.s, hy - 6 * V.s, 18 * V.s, 14 * V.s, 3) : c.rect(bx - 9 * V.s, hy - 6 * V.s, 18 * V.s, 14 * V.s); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(30,30,30,.85)'; c.lineWidth = Math.max(1.2, 1.6 * V.s);
    const hw = h.blk.w * V.s * h.scale / 2; c.beginPath(); c.moveTo(bx, hy + 8 * V.s); c.lineTo(bx - hw * .9, top + 2); c.moveTo(bx, hy + 8 * V.s); c.lineTo(bx + hw * .9, top + 2); c.stroke();
    // rehber
    if (S.guide && S.mode === 'build' && !S.fall) {
      const topY = S.floors.length * C.FLOOR_H, gy = Y(topY); c.save(); c.setLineDash([6, 7]); c.strokeStyle = 'rgba(255,255,255,.42)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, by + 4); c.lineTo(bx, gy); c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(255,214,120,.6)'; c.lineWidth = 2; c.strokeRect(bx - h.blk.w * V.s / 2, gy - C.FLOOR_H * V.s, h.blk.w * V.s, C.FLOOR_H * V.s); c.restore();
    }
    drawBlockAt(h.blk, h.x, h.y, h.tilt, h.scale, 1);
  }
  if (S.fall) { const f = S.fall; drawBlockAt(f.blk, f.x + S.sway(f.y), f.y, f.rot, 1, 1); }
}

function drawDebris() {
  for (const d of S.debris) {
    const sx = X(d.x), sy = Y(d.y); if (sy < -120 || sy > V.H + 120 || sx < -200 || sx > V.W + 200) continue;
    c.save(); c.translate(sx, sy); c.scale(V.s, V.s); c.rotate(-d.rot); c.translate(-d.blk.w / 2, -C.FLOOR_H / 2);
    K.drawFloorCached(c, d.blk, d.blk.w, C.FLOOR_H, { dark: V.dark, t: V.t, num: d.num || 0 }); c.restore();
  }
}

function drawParticles() {
  for (const p of S.parts) {
    const a = clamp(p.life / p.max, 0, 1), x = X(p.x), y = Y(p.y); if (x < -20 || x > V.W + 20 || y < -20 || y > V.H + 20) continue;
    if (p.type === 'dust') { const r = p.size * (1.6 - a * .6) * V.s; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${p.col},${.5 * a})`); g.addColorStop(1, `rgba(${p.col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    else if (p.type === 'spark') { c.globalCompositeOperation = 'lighter'; const r = p.size * V.s * (.4 + a); const g = c.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, `rgba(${p.col},${a})`); g.addColorStop(1, `rgba(${p.col},0)`); c.fillStyle = g; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); c.globalCompositeOperation = 'source-over'; }
    else { c.save(); c.translate(x, y); c.rotate(p.rot); c.fillStyle = `rgba(${p.col},${Math.min(1, a * 2)})`; const s = p.size * V.s; c.fillRect(-s / 2, -s / 3, s, s * .66); c.restore(); }
  }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const f of S.floaters) { const a = clamp(f.life / f.max, 0, 1); c.globalAlpha = Math.min(1, a * 2.2); c.font = `800 ${f.size * clamp(V.s, .8, 1.3)}px "Segoe UI",system-ui,sans-serif`; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.55)'; c.strokeText(f.text, X(f.x), Y(f.y)); c.fillStyle = f.col; c.fillText(f.text, X(f.x), Y(f.y)); }
  c.globalAlpha = 1;
}

/* kazı hedefleri */
function drawDigGuides() {
  c.save(); c.translate(X(0), Y(0)); c.scale(V.s, V.s);
  c.setLineDash([9, 7]); c.lineWidth = 2.2; c.strokeStyle = 'rgba(255,200,70,.9)';
  c.strokeRect(C.PIT_L, 0, C.PIT_R - C.PIT_L, C.PIT_DEPTH);
  c.setLineDash([]); c.fillStyle = 'rgba(255,200,70,.08)'; c.fillRect(C.PIT_L, 0, C.PIT_R - C.PIT_L, C.PIT_DEPTH);
  c.fillStyle = '#ffd25a'; c.font = '700 13px "Segoe UI",system-ui,sans-serif'; c.textAlign = 'center'; c.fillText('▼ ' + (K.lang === 'tr' ? 'hedef derinlik' : 'target depth'), 0, C.PIT_DEPTH + 18);
  c.restore();
}
function drawPourBand() {
  c.save(); c.translate(X(0), Y(0)); c.scale(V.s, V.s);
  c.fillStyle = 'rgba(74,222,128,.28)'; c.fillRect(C.PIT_L - 6, 0, C.PIT_R - C.PIT_L + 12, 9);
  c.strokeStyle = 'rgba(74,222,128,.95)'; c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(C.PIT_L - 14, 0); c.lineTo(C.PIT_R + 14, 0); c.moveTo(C.PIT_L - 14, 9); c.lineTo(C.PIT_R + 14, 9); c.stroke(); c.setLineDash([]);
  c.restore();
}

K.render = function (ctx, st, view) {
  c = ctx; S = st; V = view;
  c.clearRect(0, 0, V.W, V.H);
  drawSky(); drawClouds(); drawLimb();
  const g0 = V.H * 0.62; drawScenery(g0);
  drawGround();
  if (S.mode === 'dig') drawDigGuides();
  if (S.mode === 'pour') drawPourBand();
  drawExcavator(); drawTruck();
  drawCrane(); drawTower(); drawActiveBlock(); drawDebris(); drawParticles();
  // vinyet
  const vgr = c.createRadialGradient(V.W / 2, V.H / 2, Math.min(V.W, V.H) * .5, V.W / 2, V.H / 2, Math.max(V.W, V.H) * .78); vgr.addColorStop(0, 'rgba(0,0,0,0)'); vgr.addColorStop(1, 'rgba(0,0,0,.38)');
  c.fillStyle = vgr; c.fillRect(0, 0, V.W, V.H);
  if (S.flash > 0) { c.fillStyle = `rgba(255,255,255,${S.flash})`; c.fillRect(0, 0, V.W, V.H); }
};
K.skyAt = skyAt;
})();
