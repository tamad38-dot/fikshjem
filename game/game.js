'use strict';
/* Kat Kat — oyun mantığı, girdi, arayüz.  MIT Lisansı © 2026 Fix One */
(() => {
const { C, clamp, lerp, smooth, rnd, t: T } = K;
const $ = id => document.getElementById(id);
const H = C.FLOOR_H;
const DEBUG = /[?&]debug/.test(location.search);

const cv = $('c'), ctx = cv.getContext('2d');
const V = { W: 0, H: 0, s: 1, cx: 0, cy: 0, t: 0, dark: 0, alt: 0, dpr: 1 };
const ptr = { x: 0, y: 0, wx: 0, wy: 0, down: false };
let keyHold = false, paused = false, last = 0;

/* ---------- durum ---------- */
const S = K.S = {
  mode: 'menu', floors: [], h: new Float32Array(C.NCOL), pourLevel: -200,
  exc: { off: -1200, P: [-300, 62], elbow: [0, 0], stick: [0, 0], tip: [70, 170], tipT: [70, 170], bucketRot: 0, tread: 0, digT: 0 },
  truck: { off: -1200, pouring: false, spin: 0 },
  craneIn: 0, hookX: 0, hookT: 0, hookV: 0, hang: null, fall: null, cool: 0,
  debris: [], parts: [], floaters: [], roof: false, roofT: 0, flash: 0, guide: true,
  lives: 3, combo: 0, score: 0, quality: 1, digQ: 0, pourQ: 0, stress: 0, pending: null, swayAmp: 0, swayT: 0, swayImp: 0,
  shake: 0, wind: 0, t: 0, over: null, hintT: 0, collapseT: 0, endT: 0,
  sway: y => { const n = S.floors.length; if (!n) return 0; const top = n * H; return S.swayAmp * Math.sin(S.swayT) * Math.pow(Math.min(1, Math.max(0, y) / Math.max(top, 260)), 1.6); },
};
let settings = Object.assign({ sound: true, guide: true, lang: (navigator.language || 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en' }, K.store.get('settings', {}));
let best = K.store.get('best', { floors: 0, score: 0 });
let saved = K.store.get('chk', null);
K.lang = settings.lang; S.guide = settings.guide; K.snd.setOn(settings.sound);

/* ---------- boyut ---------- */
function resize() {
  V.dpr = Math.min(window.devicePixelRatio || 1, 2); V.W = window.innerWidth; V.H = window.innerHeight;
  cv.width = Math.round(V.W * V.dpr); cv.height = Math.round(V.H * V.dpr);
}
window.addEventListener('resize', resize); resize();

/* ---------- zemin ---------- */
const MAXD = 14;
function colX(i) { return C.TX0 + i * C.DX; }
function flatTerrain() { S.h.fill(0); }
function filledPit() {
  for (let i = 0; i < C.NCOL; i++) { const ax = Math.abs(colX(i)); S.h[i] = ax <= C.PIT_R ? -C.PIT_DEPTH : Math.min(0, -C.PIT_DEPTH + (ax - C.PIT_R) * (MAXD / C.DX)); }
  S.pourLevel = 0;
}
function relax() {
  const h = S.h, N = C.NCOL;
  for (let it = 0; it < 3; it++) for (let i = 0; i < N - 1; i++) { const d = h[i] - h[i + 1]; if (d > MAXD) { const m = (d - MAXD) / 2; h[i] -= m; h[i + 1] += m; } else if (d < -MAXD) { const m = (-d - MAXD) / 2; h[i] += m; h[i + 1] -= m; } }
}
function addPile(vol) {
  const cx = 390, R = 175; let sw = 0; const idx = [];
  for (let i = 0; i < C.NCOL; i++) { const d = Math.abs(colX(i) - cx); if (d < R) { const w = Math.cos(d / R * Math.PI / 2); idx.push([i, w]); sw += w; } }
  for (const [i, w] of idx) S.h[i] = Math.min(150, S.h[i] + vol * 0.45 * w / sw);
}
function digAt(tx, ty) {
  if (tx > 215) return 0;
  const R = 30, y = Math.max(ty, C.BEDROCK); let removed = 0;
  const i0 = Math.max(0, Math.floor((tx - R - C.TX0) / C.DX)), i1 = Math.min(C.NCOL - 1, Math.ceil((tx + R - C.TX0) / C.DX));
  for (let i = i0; i <= i1; i++) { const dx = Math.abs(colX(i) - tx); if (dx > R) continue; const target = y + (R - Math.sqrt(R * R - dx * dx)) * 0.5; if (S.h[i] > target) { removed += S.h[i] - target; S.h[i] = target; } }
  if (removed > 0) { relax(); addPile(removed); }
  return removed;
}
function digProgress() {
  let s = 0, n = 0; for (let i = 0; i < C.NCOL; i++) { const x = colX(i); if (x >= C.PIT_L && x <= C.PIT_R) { s += -S.h[i] / C.PIT_DEPTH; n++; } }
  return s / n;
}
function digProgressClamped() {
  let s = 0, n = 0; for (let i = 0; i < C.NCOL; i++) { const x = colX(i); if (x >= C.PIT_L && x <= C.PIT_R) { s += clamp(-S.h[i] / C.PIT_DEPTH, 0, 1); n++; } }
  return s / n;
}

/* ---------- iskelet ---------- */
function ik(sx, sy) {
  const E = S.exc, P = E.P, L1 = 270, L2 = 230;
  let dx = sx - P[0], dy = sy - P[1], d = Math.hypot(dx, dy); const dmax = L1 + L2 - 2, dmin = Math.abs(L1 - L2) + 40;
  if (d > dmax) { dx *= dmax / d; dy *= dmax / d; d = dmax; }
  if (d < dmin) { if (d < 1) { dx = dmin; dy = 0; } else { dx *= dmin / d; dy *= dmin / d; } d = dmin; }
  const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), th = Math.atan2(dy, dx);
  E.elbow = [P[0] + L1 * Math.cos(th + a), P[1] + L1 * Math.sin(th + a)]; E.stick = [P[0] + dx, P[1] + dy];
}

/* ---------- parçacık ---------- */
function burst(x, y, n, o) {
  for (let i = 0; i < n && S.parts.length < 700; i++) {
    const a = (o.a0 != null ? o.a0 + Math.random() * (o.a1 - o.a0) : Math.random() * 6.283), sp = (o.sp || 100) * (0.4 + Math.random() * 0.8);
    S.parts.push({ x: x + (Math.random() - .5) * (o.jx || 0), y: y + (Math.random() - .5) * (o.jy || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: (o.life || 1) * (.6 + Math.random() * .6), max: o.life || 1, g: o.g == null ? 600 : o.g, drag: o.drag || 0, size: (o.size || 6) * (.6 + Math.random() * .8), col: o.col || '200,190,170', type: o.type || 'chip', rot: Math.random() * 6, vr: (Math.random() - .5) * 10 });
  }
}
function floater(x, y, text, col, size = 22) { S.floaters.push({ x, y, text, col, size, life: 1.3, max: 1.3, vy: 60 }); }
function updateParts(dt) {
  for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts.splice(i, 1); continue; } p.vy -= p.g * dt; p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
  for (let i = S.floaters.length - 1; i >= 0; i--) { const f = S.floaters[i]; f.life -= dt; if (f.life <= 0) { S.floaters.splice(i, 1); continue; } f.y += f.vy * dt; f.vy *= 1 - 2 * dt; }
}
const dustAt = (x, y, n, big) => burst(x, y, n, { type: 'dust', sp: big ? 160 : 90, a0: 0, a1: 3.14, life: big ? 1.4 : .9, size: big ? 46 : 26, g: -20, drag: 2, jx: 20, col: '205,195,180' });

/* ---------- ekran / arayüz ---------- */
const SCREENS = ['scMenu', 'scHow', 'scSet', 'scPause', 'scOver', 'scWin'];
function showScreen(id) { SCREENS.forEach(s => $(s).classList.toggle('hidden', s !== id)); }
function hideScreens() { SCREENS.forEach(s => $(s).classList.add('hidden')); }
function banner(title, sub) { const b = $('banner'); $('bnT').textContent = title; $('bnS').textContent = sub || ''; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
let hintTxt = '';
function setHint(txt) { const h = $('hint'); if (txt === hintTxt) return; hintTxt = txt; h.textContent = txt; h.classList.toggle('on', !!txt); }
const HAT = '<svg viewBox="0 0 24 24"><path d="M3 17.5h18v2.2H3zM4.8 16.2a7.2 7.2 0 0 1 14.4 0zM10.8 5.2h2.4v4.3h-2.4z"/></svg>';
const HATL = HAT.replace('<svg', '<svg class="lost"');
function applyLang() {
  document.documentElement.lang = K.lang;
  const set = (id, k, o) => { const e = $(id); if (e) e.textContent = T(k, o); };
  set('mSub', 'sub'); set('btnPlay', 'play'); set('btnHow', 'how'); set('btnSet', 'set'); set('hwTitle', 'howT'); set('btnHowClose', 'ok');
  set('stTitle', 'settingsT'); set('stSnd', 'sound'); set('stGuide', 'guide'); set('stLang', 'lang'); set('btnSetClose', 'ok'); set('tgLang', 'langName');
  set('psTitle', 'pauseT'); set('btnResume', 'resume'); set('btnPauseSet', 'set'); set('btnPauseMenu', 'menu'); set('hFloorLbl', 'floor'); set('windLbl', 'wind'); set('stabLbl', 'stab');
  set('btnOvNew', 'newGame'); set('btnOvMenu', 'menu'); set('btnWnNew', 'newGame'); set('btnWnMenu', 'menu');
  $('hwList').innerHTML = [1, 2, 3, 4, 5, 6, 7].map(i => '<li>' + T('h' + i) + '</li>').join('');
  $('tgSound').setAttribute('aria-checked', settings.sound); $('tgGuide').setAttribute('aria-checked', settings.guide);
  $('btnSound').classList.toggle('off', !settings.sound);
  refreshMenu(); updateAct();
}
function refreshMenu() {
  const bc = $('btnCont');
  if (saved && saved.n > 0) { bc.classList.remove('hidden'); bc.textContent = T('cont', { n: saved.n }); } else bc.classList.add('hidden');
  $('mBest').textContent = best.floors ? T('best', { n: K.fmt(best.floors), s: K.fmt(best.score) }) : '';
}
function saveSettings() { K.store.set('settings', settings); }

let lastHud = {};
function setTxt(id, v) { if (lastHud[id] !== v) { lastHud[id] = v; $(id).textContent = v; } }
function updateAct() {
  const b = $('btnRoof');
  b.classList.toggle('roof', S.mode === 'build');
  if (S.mode === 'dig') { b.textContent = T('pour'); b.classList.toggle('hidden', digProgressClamped() < 0.95); }
  else if (S.mode === 'build') { b.textContent = T('roof'); b.classList.toggle('hidden', S.floors.length < 1 || !!S.pending); }
  else b.classList.add('hidden');
}
function updateHud() {
  const n = S.floors.length, mode = S.mode, building = mode === 'build' || mode === 'collapse';
  setTxt('hFloor', K.fmt(n)); setTxt('hMeters', K.fmt(n * 3) + ' m'); setTxt('hScore', K.fmt(S.score));
  const nextN = n + 1, tier = K.tierOf(Math.min(C.MAX_FLOORS, nextN)), mat = K.MATS[tier];
  setTxt('matName', mat.n[K.lang]); setTxt('matTier', T('tier', { n: tier + 1 }).toUpperCase());
  $('matSwatch').style.background = mat.c;
  $('hMat').classList.toggle('hidden', !(mode === 'build'));
  $('progFill').style.height = (n / C.MAX_FLOORS * 100).toFixed(2) + '%';
  const lv = $('hLives'), key = S.lives + '/' + mode; if (lastHud.lives !== key) { lastHud.lives = key; lv.innerHTML = [0, 1, 2].map(i => i < S.lives ? HAT : HATL).join(''); }
  $('hLives').classList.toggle('hidden', !building);
  $('hWind').classList.toggle('hidden', !building); $('hStab').classList.toggle('hidden', !building); $('hProg').classList.toggle('hidden', !building);
  const wv = Math.abs(S.wind) / 12; setTxt('windVal', wv.toFixed(1) + ' m/s'); $('windArrow').style.transform = S.wind < 0 ? 'scaleX(-1)' : '';
  const r = S.stress, ar = Math.abs(r);
  $('stabMark').style.left = (50 + clamp(r, -1.2, 1.2) / 1.2 * 42) + '%';
  setTxt('stabTxt', ar < .5 ? T('stOk') : ar < .85 ? T('stWarn') : T('stBad'));
  $('stabTxt').style.color = ar < .5 ? '#7ee8a2' : ar < .85 ? '#ffc65a' : '#ff7b7b';
  const pb = $('phaseBar');
  if (mode === 'dig') { pb.classList.remove('hidden'); const p = digProgressClamped(); setTxt('phaseLbl', T('dig')); setTxt('phasePct', Math.floor(p * 100) + '%'); $('phaseFill').style.width = (p * 100) + '%'; }
  else if (mode === 'pour') { pb.classList.remove('hidden'); const p = clamp((S.pourLevel - C.BEDROCK) / -C.BEDROCK, 0, 1); setTxt('phaseLbl', T('pour')); setTxt('phasePct', S.pourLevel >= -9 && S.pourLevel <= 0.5 ? '✔' : ''); $('phaseFill').style.width = (p * 100) + '%'; }
  else pb.classList.add('hidden');
  updateAct();
  let hint = '';
  if (mode === 'dig') hint = T('digHint'); else if (mode === 'pour') hint = T('pourHint'); else if (mode === 'build' && n < 3 && !S.fall) hint = T('buildHint');
  setHint(S.hintT > 0 || mode === 'pour' ? hint : (mode === 'dig' ? hint : ''));
}
const hud = $('hud');

/* ---------- oyun akışı ---------- */
function resetCommon() {
  S.floors = []; S.debris = []; S.parts = []; S.floaters = []; S.fall = null; S.hang = null; S.pending = null; S.roof = false; S.roofT = 0; S.over = null;
  S.reachedN = 0; S.lives = 3; S.combo = 0; S.score = 0; S.stress = 0; S.swayAmp = 0; S.swayImp = 0; S.cool = 0; S.flash = 0; S.shake = 0; S.hookT = 0; S.hookX = 0;
}
function newRun() {
  resetCommon(); flatTerrain(); S.pourLevel = -200; S.digQ = 0; S.pourQ = 0; S.quality = 1;
  S.exc.off = -1200; S.exc.tip = [70, 170]; S.exc.tipT = [70, 170]; S.truck.off = -1200; S.truck.pouring = false; S.craneIn = 0;
  S.mode = 'dig'; S.phase = 'enter'; S.phaseT = 0; S.digDone = 0; S.hintT = 6;
  hideScreens(); hud.classList.remove('hidden'); snapCamera(); banner(T('dig'), '');
}
function resumeRun() {
  if (!saved) return newRun();
  resetCommon(); filledPit();
  S.floors = saved.f.map((a, i) => { const mm = K.MATS[a[2]]; return { cx: a[0], w: a[1], m: a[2], seed: i + 1, chk: !!a[3], mass: a[1] * H * mm.d * (a[3] ? 1.25 : 1) }; });
  S.quality = saved.q; S.score = saved.s; S.reachedN = S.floors.length; S.exc.off = -1200; S.truck.off = -1200; S.craneIn = 0;
  hideScreens(); hud.classList.remove('hidden'); startBuild(true);
}
function startBuild(snap) {
  S.mode = 'build'; S.exc.off = -1200; S.truck.off = -1200; S.hintT = 5;
  const a = analyze(); S.stress = a.signed;
  nextBlock(); if (snap) { S.craneIn = 1; snapCamera(); }
}
function nextBlock() {
  const n = S.floors.length + 1; if (n > C.MAX_FLOORS) return;
  const tier = K.tierOf(n), mat = K.MATS[tier], chk = n % C.CHECK_EVERY === 0;
  const w = Math.round(C.BASE_W * mat.w * (chk ? 1.5 : 1) * (0.95 + 0.1 * rnd(n * 3.3)));
  const blk = { w, m: tier, seed: n, chk, mass: w * H * mat.d * (chk ? 1.25 : 1) };
  S.hang = { blk, x: S.hookX, y: hangY(), tilt: 0, scale: 0.05 };
}
function hangY() { return S.floors.length * H + 0.35 * V.H / camScale(); }
function camScale() { return clamp(Math.min(V.W / 820, V.H / 760), .28, 1.25); }
function swingAmp() { return clamp(Math.min(350, V.W / camScale() / 2 - 130), 70, 350); }
function omega(n) { const tier = K.tierOf(n); return clamp((1.1 + tier * .1 + Math.min(.5, n / 4000)) * (n < 5 ? .8 : 1), .8, 2.8); }
function windNow() {
  const n = S.floors.length, mx = 150 * smooth(30, 1500, n) * (1 - 0.55 * S.quality);
  return mx * Math.sin(S.t * .37 + 1.3) * (.6 + .4 * Math.sin(S.t * .91));
}

function analyze() {
  const n = S.floors.length; let M = 0, MX = 0, signed = 0, fail = -1, info = null;
  for (let i = n - 1; i >= 0; i--) {
    const f = S.floors[i]; M += f.mass; MX += f.mass * f.cx;
    const bl = i === 0 ? -C.FOUND_W / 2 : S.floors[i - 1].cx - S.floors[i - 1].w / 2, br = i === 0 ? C.FOUND_W / 2 : S.floors[i - 1].cx + S.floors[i - 1].w / 2;
    const l = Math.max(f.cx - f.w / 2, bl), r = Math.min(f.cx + f.w / 2, br), half = (r - l) / 2, com = MX / M;
    const ratio = half <= 0 ? 99 : (com - (l + r) / 2) / half;
    if (Math.abs(ratio) > Math.abs(signed)) signed = ratio;
    if (Math.abs(ratio) > 1) { fail = i; info = { lo: l, hi: r, dir: Math.sign(ratio) }; }
  }
  return { signed, fail, info };
}

function drop() {
  if (S.mode !== 'build' || S.fall || S.pending || S.craneIn < .99 || !S.hang || S.hang.scale < .9 || S.cool > 0) return;
  const h = S.hang; K.snd.drop(); S.hintT = 0;
  S.fall = { blk: h.blk, x: h.x - S.sway(h.y), y: h.y, vx: S.wind * .9, vy: 0, rot: h.tilt, vr: 0 }; S.hang = null;
}

function land() {
  const f = S.fall, blk = f.blk, n = S.floors.length, topY = n * H;
  const below = n ? S.floors[n - 1] : { cx: 0, w: C.FOUND_W };
  const l = Math.max(f.x - blk.w / 2, below.cx - below.w / 2), r = Math.min(f.x + blk.w / 2, below.cx + below.w / 2);
  S.fall = null;
  if (r - l < 0.12 * blk.w) return miss(f, blk, below);
  let x = f.x, perfect = false;
  if (Math.abs(x - below.cx) <= 5) { x = below.cx; perfect = true; }
  const tier = blk.m;
  S.floors.push({ cx: x, w: blk.w, m: blk.m, seed: blk.seed, chk: blk.chk, mass: blk.mass });
  const nn = S.floors.length, a = analyze();
  // puan
  let pts = 10 * (tier + 1) * (blk.chk ? 3 : 1);
  if (perfect) { S.combo++; pts += 20 * Math.min(S.combo, 10); } else S.combo = 0;
  S.score += pts;
  // efek
  const heavy = clamp(blk.mass / 20000, .5, 1.4);
  K.snd.land(heavy); S.shake = Math.max(S.shake, 4 + 5 * heavy);
  dustAt(x - blk.w / 2, topY + 4, 5, false); dustAt(x + blk.w / 2, topY + 4, 5, false);
  burst(x, topY + 6, 10, { a0: 0.2, a1: 2.9, sp: 220, life: .8, size: 6, col: K.hex(K.MATS[tier].c).join(','), g: 900 });
  S.swayImp = clamp(Math.abs(x - below.cx) * .09 + 1.5, 0, 14);
  floater(x, topY + H + 24, perfect ? T('perfect') + (S.combo > 1 ? ' ' + T('combo', { n: S.combo }) : '') : '+' + pts, perfect ? '#ffe27a' : '#ffffff', perfect ? 26 : 20);
  if (perfect) { K.snd.perfect(S.combo); burst(x, topY + H / 2, 18, { type: 'spark', sp: 260, life: .8, size: 5, col: '255,226,130', g: 100, drag: 2 }); }
  S.cool = 0.32;
  if (a.fail >= 0) { S.pending = { k: a.fail, t: 0, info: a.info }; S.stress = a.signed; K.snd.creak(); return; }
  S.stress = a.signed;
  // dönüm noktaları
  if (nn % C.CHECK_EVERY === 0) { checkpoint(); }
  else if (K.tierOf(nn + 1) !== K.tierOf(nn)) { const m = K.MATS[K.tierOf(nn + 1)]; banner(T('newMat'), m.n[K.lang]); K.snd.milestone(); }
  else if (nn % 100 === 0 || nn === 10 || nn === 50) { banner(T('milestone', { n: K.fmt(nn) }), ''); K.snd.milestone(); confetti(x, topY + H); }
  if (nn >= C.MAX_FLOORS) { finishRoof(true); return; }
  nextBlock();
}
function checkpoint() {
  const nn = S.floors.length; S.lives = 3;
  saved = { n: nn, q: S.quality, s: S.score, f: S.floors.map(f => [Math.round(f.cx * 10) / 10, f.w, f.m, f.chk ? 1 : 0]) }; K.store.set('chk', saved);
  banner(T('checkpoint'), T('checkpointS', { n: nn })); K.snd.checkpoint(); confetti(S.floors[nn - 1].cx, nn * H);
  updateBest();
}
function confetti(x, y) {
  const cols = ['255,226,130', '255,120,120', '120,200,255', '140,235,160', '255,160,235'];
  for (let i = 0; i < 5; i++) burst(x, y, 12, { type: 'chip', a0: .3, a1: 2.8, sp: 520, life: 1.8, size: 9, col: cols[i], g: 700, drag: .6 });
}
function miss(f, blk, below) {
  S.lives--; S.combo = 0; K.snd.miss(); S.shake = 8;
  const dir = f.x >= below.cx ? 1 : -1;
  S.debris.push({ blk, x: f.x, y: f.y + H / 2 - 4, vx: dir * 190, vy: 120, rot: f.rot || 0, vr: -dir * 3.4, free: true });
  floater(f.x, f.y + 70, T('miss'), '#ff8f8f', 26); dustAt(f.x, S.floors.length * H + 4, 6, false);
  if (S.lives <= 0) { setTimeout(() => { if (S.mode === 'build') endRun('miss'); }, 900); S.pending = { dead: true }; return; }
  nextBlock();
}

function startCollapse() {
  const p = S.pending; S.pending = null; const k = p.k, n = S.floors.length;
  const px = p.info.dir > 0 ? p.info.hi : p.info.lo, py = k * H;
  const take = S.floors.splice(k); // k ve üstü
  const dir = p.info.dir; S.col = { t: 0, rel: [], dir, px, py, theta: 0, w: 0, released: false };
  take.slice(0, 90).forEach((f, j) => {
    const d = { blk: f, x: f.cx, y: py + (j + .5) * H, vx: 0, vy: 0, rot: 0, vr: 0, rigid: true, num: k + j + 1 };
    S.col.rel.push([f.cx - px, (j + .5) * H]); S.debris.push(d);
  });
  S.mode = 'collapse'; S.collapseT = 0; K.snd.collapse(); S.shake = 18; S.flash = .25;
  S.swayAmp = 0;
}
function updateCollapse(dt) {
  const c = S.col; if (!c) return;
  if (!c.released) {
    c.t += dt; c.w += c.dir * 3.2 * dt; c.theta += c.w * dt;
    let i = 0; for (const d of S.debris) { if (!d.rigid) continue; const r = c.rel[i++], cs = Math.cos(c.theta), sn = Math.sin(c.theta); d.x = c.px + r[0] * cs - r[1] * sn; d.y = c.py + r[0] * sn + r[1] * cs; d.rot = c.theta; }
    if (Math.abs(c.theta) > .3 || c.t > .8) {
      c.released = true; i = 0;
      for (const d of S.debris) { if (!d.rigid) continue; d.rigid = false; d.free = true; const rx = d.x - c.px, ry = d.y - c.py; let vx = -c.w * ry, vy = c.w * rx; const sp = Math.hypot(vx, vy); if (sp > 650) { vx *= 650 / sp; vy *= 650 / sp; }
        d.vx = vx + c.dir * (90 + Math.random() * 140); d.vy = vy + Math.random() * 60; d.vr = c.w * .8 + (Math.random() - .5) * 3; }
      S.shake = 14;
    }
  }
}
function updateDebris(dt) {
  for (let i = S.debris.length - 1; i >= 0; i--) {
    const d = S.debris[i]; if (!d.free) continue;
    d.vy -= C.GRAV * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt;
    const r = Math.abs(Math.sin(d.rot)) * d.blk.w / 2 + Math.abs(Math.cos(d.rot)) * H / 2;
    if (d.y - r < 0 && V.cy < 600) {
      d.y = r; if (d.vy < -170) { dustAt(d.x, 4, 3, true); K.snd.thud(); S.shake = Math.max(S.shake, 5); }
      d.vy = -d.vy * .26; d.vx *= .72; d.vr *= .55; if (Math.abs(d.vy) < 40) { d.vy = 0; d.vx *= .9; d.vr *= .85; }
    }
    if (d.y < V.cy - 900) S.debris.splice(i, 1);
  }
}

function endRun(reason) {
  if (S.mode === 'over') return;
  S.mode = 'over'; S.over = reason; updateBest();
  const n = S.floors.length;
  const bad = reason === 'collapse';
  $('ovBadge').textContent = T(bad ? 'badgeCol' : 'badgeMiss'); $('ovTitle').textContent = T(bad ? 'collapsedT' : 'missT'); $('ovMsg').textContent = T(bad ? 'collapsedM' : 'missM');
  $('ovStats').innerHTML = `<div><b>${K.fmt(S.reachedN)}</b><small>${T('floors')}</small></div><div><b>${K.fmt(S.reachedN * 3)} m</b><small>${T('meters')}</small></div><div><b>${K.fmt(S.score)}</b><small>${T('score')}</small></div>`;
  const bc = $('btnOvCont'); if (saved && saved.n > 0) { bc.classList.remove('hidden'); bc.textContent = T('contFrom', { n: saved.n }); } else bc.classList.add('hidden');
  hud.classList.add('hidden'); setHint('');
  setTimeout(() => { if (S.mode === 'over') showScreen('scOver'); }, 250);
}
function updateBest() {
  const n = Math.max(S.reachedN || 0, S.floors.length);
  if (n > best.floors || (n === best.floors && S.score > best.score)) { best = { floors: n, score: Math.max(S.score, n === best.floors ? best.score : 0) }; K.store.set('best', best); }
  if (S.score > best.score && n >= best.floors) { best.score = S.score; K.store.set('best', best); }
}
function finishRoof(top) {
  if (S.mode === 'done' || !S.floors.length) return;
  S.mode = 'done'; S.roof = true; S.roofT = 0; S.fall = null; S.hang = null; S.pending = null; S.topWin = !!top;
  S.score += S.floors.length * 15; K.snd.win(); updateBest(); setHint('');
  setTimeout(() => {
    confetti(S.floors[S.floors.length - 1].cx, S.floors.length * H + 60); confetti(S.floors[S.floors.length - 1].cx - 120, S.floors.length * H + 40); confetti(S.floors[S.floors.length - 1].cx + 120, S.floors.length * H + 40);
  }, 700);
  setTimeout(() => {
    const n = S.floors.length; $('wnBadge').textContent = T(top ? 'badgeTop' : 'badgeDone'); $('wnTitle').textContent = T(top ? 'topT' : 'doneT'); $('wnMsg').textContent = T(top ? 'topM' : 'doneM', { n: K.fmt(n) });
    $('wnStats').innerHTML = `<div><b>${K.fmt(n)}</b><small>${T('floors')}</small></div><div><b>${K.fmt(n * 3)} m</b><small>${T('meters')}</small></div><div><b>${K.fmt(S.score)}</b><small>${T('score')}</small></div>`;
    hud.classList.add('hidden'); showScreen('scWin');
  }, 2600);
}

/* ---------- güncelleme ---------- */
function snapCamera() { updateCamera(1, true); }
function updateCamera(dt, snap) {
  let ts, tcy; const m = S.mode;
  if (m === 'dig' || m === 'pour') { ts = Math.min(V.W / 1280, V.H / 620); tcy = -0.38 * V.H / ts; }
  else { ts = camScale(); const topY = S.floors.length * H; tcy = topY - 0.35 * V.H / ts; if (m === 'collapse' || m === 'over') ts *= .9; if (m === 'done') { ts *= .85; tcy = topY - 0.45 * V.H / ts; } }
  V.cx = m === 'menu' && V.W > 900 ? -V.W * 0.21 / ts : 0;
  const rate = (m === 'collapse' || m === 'over') ? 1.6 : 4, k = snap ? 1 : 1 - Math.exp(-rate * dt);
  V.s += (ts - V.s) * k; V.cy += (tcy - V.cy) * k;
}
function toWorld(px, py) { ptr.wx = (px - V.W / 2) / V.s; ptr.wy = V.cy + (V.H - py) / V.s; }

function update(dt) {
  S.t += dt; V.t += dt; if (S.hintT > 0) S.hintT -= dt; if (S.cool > 0) S.cool -= dt;
  S.shake *= Math.exp(-7 * dt); S.flash = Math.max(0, S.flash - dt * 1.2);
  const m = S.mode;
  S.wind = (m === 'build' || m === 'collapse') ? windNow() : 0;
  const hold = ptr.down || keyHold;
  if (m === 'menu') updateMenu(dt);
  else if (m === 'dig') updateDig(dt, hold);
  else if (m === 'pour') updatePour(dt, hold);
  else if (m === 'build') updateBuild(dt);
  else if (m === 'collapse') { updateCollapse(dt); S.collapseT += dt; if (S.collapseT > 2.8) endRun('collapse'); }
  else if (m === 'done') { S.roofT = Math.min(1, S.roofT + dt / 1.1); }
  if (m === 'build' || m === 'collapse' || m === 'done') { S.craneIn = Math.min(1, S.craneIn + dt * 1.3); }
  updateDebris(dt); updateParts(dt);
  // sway
  const n = S.floors.length;
  S.swayImp *= Math.exp(-1.6 * dt);
  const st = Math.abs(S.stress), windAmp = Math.abs(S.wind) * .045;
  let amp = windAmp + (st > .6 ? (st - .6) * 26 : 0) + S.swayImp;
  if (S.pending && !S.pending.dead) amp += S.pending.t * 22;
  S.swayAmp = n ? amp : 0; S.swayT += dt * (1.5 + st * 2);
  updateCamera(dt, false);
  V.alt = Math.max(0, V.cy / H); V.dark = smooth(1200, 3500, V.alt);
  K.snd.ambient(0.03 + 0.1 * smooth(0, 800, V.alt) * (1 - smooth(3000, 5000, V.alt)));
  if (m === 'build' || m === 'collapse' || m === 'done') S.reachedN = Math.max(S.reachedN || 0, n);
}

function updateMenu(dt) {
  if (!S.menuInit) { S.menuInit = true; demoTower(); }
  S.craneIn = 1; S.hookT += dt * 1.3; S.hookX = Math.sin(S.hookT) * 220; S.hookV = Math.cos(S.hookT) * 220 * 1.3;
  const tilt = clamp(-S.hookV * .00045, -.13, .13);
  if (!S.hang) S.hang = { blk: { w: 190, m: 5, seed: 99, chk: false, mass: 1 }, x: 0, y: 0, tilt: 0, scale: 1 };
  S.hang.x = S.hookX; S.hang.y = S.floors.length * H + 0.35 * V.H / camScale(); S.hang.tilt = lerp(S.hang.tilt, tilt, .1);
  S.swayAmp = 3.5; S.swayT += dt * 1.2; S.wind = 0; S.stress = 0;
}
function demoTower() {
  filledPit(); S.floors = [];
  for (let i = 0; i < 12; i++) { const mm = K.MATS[i], w = Math.round(C.BASE_W * mm.w); S.floors.push({ cx: Math.sin(i * 1.9) * 9, w, m: i, seed: i + 2, chk: false, mass: 1 }); }
  snapCamera();
}

function updateDig(dt, hold) {
  const E = S.exc;
  if (S.phase === 'enter') {
    S.phaseT += dt; E.off = lerp(-1200, 0, 1 - Math.pow(1 - clamp(S.phaseT / 1.6, 0, 1), 3)); E.tread += (E.off - (E._lo || -1200)) * .5; E._lo = E.off;
    E.tipT = [70, 170]; if (S.phaseT > 1.6) S.phase = 'dig';
  } else if (S.phase === 'dig') {
    toWorld(ptr.x, ptr.y); E.tipT = [clamp(ptr.wx, -230, 330), clamp(ptr.wy, C.BEDROCK, 280)];
    E.digOn = hold;
  } else if (S.phase === 'exit') {
    S.phaseT += dt; E.tipT = [70, 170]; const k = clamp((S.phaseT - .5) / 1.6, 0, 1); E.off = -1200 * k * k; E.tread += (E.off - (E._lo || 0)) * .5; E._lo = E.off;
    S.truck.off = lerp(-1200, 0, 1 - Math.pow(1 - clamp((S.phaseT - .7) / 1.5, 0, 1), 3));
    if (S.phaseT > 2.4) { S.mode = 'pour'; S.pourLevel = C.BEDROCK - 4; S.phase = 'pour'; S.phaseT = 0; S.hintT = 6; banner(T('pour'), ''); }
  }
  // kepçe hareketi
  const dx = E.tipT[0] - E.tip[0], dy = E.tipT[1] - E.tip[1], d = Math.hypot(dx, dy), sp = (S.phase === 'dig' ? 560 : 400) * dt;
  if (d > 0.01) { const k = Math.min(1, sp / d); E.tip[0] += dx * k; E.tip[1] += dy * k; }
  ik(E.tip[0] - 44, E.tip[1] + 36);
  E.bucketRot = lerp(E.bucketRot, E.digOn && S.phase === 'dig' ? -.12 : 0, .15);
  if (S.phase === 'dig' && E.digOn) {
    const rem = digAt(E.tip[0], E.tip[1]);
    if (rem > 0.2) { K.snd.dig(); S.digAcc = (S.digAcc || 0) + rem; if (S.digAcc > 6) { S.digAcc = 0; burst(E.tip[0] + 20, E.tip[1] + 6, 3, { a0: .4, a1: 2.2, sp: 160, life: .8, size: 5, col: '110,80,52', g: 900 }); } if (Math.random() < .35) dustAt(E.tip[0], E.tip[1] + 12, 1, false); }
    if (E.tip[1] <= C.BEDROCK + 1) burst(E.tip[0] + 30, E.tip[1] + 4, 1, { type: 'spark', sp: 140, life: .4, size: 4, col: '255,220,150', g: 300 });
  }
  if (S.phase === 'dig' && digProgressClamped() >= 0.97 && !S.digDone) { S.digDone = 1; banner(T('digDone'), ''); K.snd.milestone(); }
}
function finishDig() {
  if (S.mode !== 'dig' || S.phase !== 'dig') return;
  const avg = digProgress(); S.digQ = clamp((avg - 0.9) / 0.4, 0, 1);
  S.phase = 'exit'; S.phaseT = 0; S.exc.digOn = false; K.snd.click();
}
function updatePour(dt, hold) {
  const T0 = S.truck; T0.off = 0; T0.pouring = hold && S.phase === 'pour'; T0.spin = (T0.spin + dt * (T0.pouring ? 120 : 40)) % 30;
  if (S.phase === 'pour') {
    if (hold) { S.pourLevel = Math.min(24, S.pourLevel + 28 * dt); K.snd.pour(); if (Math.random() < .5) burst(-108, Math.min(S.pourLevel, 2) + 2, 1, { type: 'dust', sp: 40, a0: 0, a1: 3.14, life: .5, size: 18, col: '150,152,156', g: -10, drag: 3 });
      if (S.pourLevel > 0) burst(C.PIT_L + Math.random() * 300, 3, 1, { type: 'chip', a0: 0, a1: 3.14, sp: 80, life: .7, size: 5, col: '150,152,156', g: 500 }); }
    S.wasHold = hold;
    if (S.pourLevel >= 22) endPour();
  } else if (S.phase === 'leave') {
    S.phaseT += dt; T0.off = -1200 * Math.pow(clamp(S.phaseT / 1.6, 0, 1), 2); T0.pouring = false;
    if (S.phaseT > 1.0 && S.craneIn < 1) S.craneIn = Math.min(1, S.craneIn + dt * 1.3);
    if (S.phaseT > 1.9) startBuild(false);
  }
}
function endPour() {
  if (S.phase !== 'pour') return;
  const lv = S.pourLevel, over = Math.max(0, lv - 0.5);
  S.pourQ = lv < -9 ? 0.5 : over > 0 ? Math.max(0.35, 1 - over / 18) : 1;
  S.quality = clamp(0.4 + 0.6 * (0.5 * S.digQ + 0.5 * S.pourQ), 0.4, 1);
  S.pourLevel = Math.min(S.pourLevel, 0); S.phase = 'leave'; S.phaseT = 0; S.truck.pouring = false;
  banner(T('pourDone'), T('quality', { q: Math.round(S.quality * 100) })); K.snd.checkpoint();
}

function updateBuild(dt) {
  const n = S.floors.length, amp = swingAmp(), ω = omega(n + 1), tier = K.tierOf(n + 1);
  const prev = S.hookX;
  if (!S.fall && !S.pending) {
    S.hookT += dt * ω; const mix = tier >= 7 ? .6 : 0;
    S.hookX = amp * ((1 - mix) * Math.sin(S.hookT) + mix * (.7 * Math.sin(S.hookT) + .3 * Math.sin(1.7 * S.hookT + 1)));
  }
  S.hookV = dt > 0 ? (S.hookX - prev) / dt : 0;
  if (S.hang) {
    const h = S.hang; h.x = S.hookX; h.y = lerp(h.y, hangY(), 1 - Math.exp(-8 * dt)); h.scale = Math.min(1, h.scale + dt * 4);
    h.tilt = lerp(h.tilt, clamp(-S.hookV * .00045, -.13, .13), 1 - Math.exp(-10 * dt));
  }
  if (S.fall) {
    const f = S.fall; f.vy -= C.GRAV * dt; f.y += f.vy * dt; f.x += f.vx * dt; f.rot *= Math.exp(-6 * dt);
    const topY = n * H; if (f.y <= topY) { f.y = topY; land(); }
  }
  if (S.pending) {
    if (S.pending.dead) return;
    S.pending.t += dt; K.snd.creak(); S.stress = S.stress; if (S.pending.t > 1.1) startCollapse();
  }
}

/* ---------- çizim döngüsü ---------- */
function frame(ts) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  if (paused) dt = 0;
  update(dt); updateHud();
  ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  const sx = (Math.random() - .5) * S.shake, sy = (Math.random() - .5) * S.shake;
  ctx.save(); ctx.translate(sx, sy); K.render(ctx, S, V); ctx.restore();
}

/* ---------- girdi ---------- */
function setPtr(e) { const r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; toWorld(ptr.x, ptr.y); }
cv.addEventListener('pointerdown', e => {
  K.snd.init(); setPtr(e); ptr.down = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  if (S.mode === 'build') drop();
});
cv.addEventListener('pointermove', e => setPtr(e));
const up = () => { ptr.down = false; if (S.mode === 'pour' && S.phase === 'pour' && S.pourLevel >= -9) endPour(); };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
window.addEventListener('keydown', e => {
  K.snd.init();
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
    if (e.target.tagName === 'BUTTON') return; e.preventDefault();
    if (!e.repeat) { keyHold = true; if (S.mode === 'build') drop(); }
  } else if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); }
  else if (e.code === 'KeyM') { toggleSound(); }
});
window.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') { keyHold = false; if (S.mode === 'pour' && S.phase === 'pour' && S.pourLevel >= -9) endPour(); } });
window.addEventListener('blur', () => { if (S.mode === 'build' || S.mode === 'dig' || S.mode === 'pour') setPause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && (S.mode === 'build' || S.mode === 'dig' || S.mode === 'pour')) setPause(true); });
cv.addEventListener('contextmenu', e => e.preventDefault());

function setPause(v) {
  if (v === paused) return; if (v && !['build', 'dig', 'pour'].includes(S.mode)) return;
  paused = v; if (v) showScreen('scPause'); else hideScreens();
}
function togglePause() { if (!$('scSet').classList.contains('hidden') && paused) { showScreen('scPause'); return; } setPause(!paused); }
function toggleSound() { settings.sound = !settings.sound; K.snd.setOn(settings.sound); saveSettings(); applyLang(); }

/* ---------- düğmeler ---------- */
const click = (id, fn) => $(id).addEventListener('click', e => { K.snd.init(); K.snd.click(); fn(e); });
let setFrom = 'scMenu';
click('btnPlay', () => { paused = false; newRun(); });
click('btnCont', () => { paused = false; resumeRun(); });
click('btnHow', () => showScreen('scHow')); click('btnHowClose', () => showScreen('scMenu'));
click('btnSet', () => { setFrom = 'scMenu'; showScreen('scSet'); }); click('btnPauseSet', () => { setFrom = 'scPause'; showScreen('scSet'); });
click('btnSetClose', () => showScreen(setFrom));
click('tgSound', toggleSound);
click('tgGuide', () => { settings.guide = !settings.guide; S.guide = settings.guide; saveSettings(); applyLang(); });
click('tgLang', () => { settings.lang = settings.lang === 'tr' ? 'en' : 'tr'; K.lang = settings.lang; saveSettings(); lastHud = {}; applyLang(); });
click('btnPause', () => togglePause()); click('btnSound', toggleSound);
click('btnResume', () => setPause(false));
click('btnPauseMenu', () => toMenu());
click('btnOvCont', () => { paused = false; resumeRun(); });
click('btnOvNew', () => { paused = false; newRun(); }); click('btnOvMenu', () => toMenu());
click('btnWnNew', () => { paused = false; newRun(); }); click('btnWnMenu', () => toMenu());
click('btnRoof', () => { if (S.mode === 'dig') finishDig(); else if (S.mode === 'build') finishRoof(false); });
function toMenu() {
  paused = false; updateBest(); S.mode = 'menu'; S.menuInit = false; S.hang = null; S.fall = null; S.debris = []; S.parts = []; S.floaters = []; S.roof = false; S.pending = null; S.col = null;
  S.exc.off = -1200; S.truck.off = -1200; hud.classList.add('hidden'); setHint(''); refreshMenu(); showScreen('scMenu');
}

/* ---------- başlat ---------- */
K.buildArt(); applyLang();
if (DEBUG) window.__katkat = { S, V, K, newRun, resumeRun, drop, analyze, setPause, finishDig, finishRoof, land, update, endRun };
S.mode = 'menu'; showScreen('scMenu'); refreshMenu();
requestAnimationFrame(frame);
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !DEBUG) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
