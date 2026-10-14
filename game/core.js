'use strict';
/* Kat Kat — çekirdek: sabitler, yardımcılar, dil, malzemeler, ses.  MIT Lisansı © 2026 Fix One */
const K = window.K = {};

K.C = {
  FLOOR_H: 52, BASE_W: 200, FOUND_W: 300, PIT_DEPTH: 70, BEDROCK: -96,
  MAX_FLOORS: 10000, CHECK_EVERY: 25, GRAV: 2400,
  DX: 6, TX0: -600, TX1: 600, PIT_L: -150, PIT_R: 150,
};
K.C.NCOL = (K.C.TX1 - K.C.TX0) / K.C.DX + 1;

/* ---------- yardımcılar ---------- */
K.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
K.lerp = (a, b, t) => a + (b - a) * t;
K.smooth = (a, b, v) => { const t = K.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
K.rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
K.hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
K.mix = (a, b, t) => { const A = K.hex(a), B = K.hex(b); return `rgb(${A[0] + (B[0] - A[0]) * t | 0},${A[1] + (B[1] - A[1]) * t | 0},${A[2] + (B[2] - A[2]) * t | 0})`; };
K.mixRGB = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
K.rgb = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
K.fmt = n => Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* ---------- malzemeler (kata göre) ---------- */
K.MATS = [
  { from: 1,    k: 'brick',    c: '#b4492f', w: 1.00, d: 1.00, n: { tr: 'Kırmızı Tuğla',      en: 'Red Brick' } },
  { from: 12,   k: 'wood',     c: '#b07a45', w: 1.08, d: 0.55, n: { tr: 'Ahşap Panel',        en: 'Timber Panel' } },
  { from: 30,   k: 'stone',    c: '#8d8a84', w: 0.94, d: 1.70, n: { tr: 'Doğal Taş',          en: 'Natural Stone' } },
  { from: 60,   k: 'concrete', c: '#b3b6b9', w: 1.12, d: 1.50, n: { tr: 'Betonarme',          en: 'Reinforced Concrete' } },
  { from: 120,  k: 'steel',    c: '#6b7b8c', w: 1.22, d: 2.00, n: { tr: 'Çelik Kiriş',        en: 'Steel Girder' } },
  { from: 250,  k: 'glass',    c: '#7fc4dc', w: 0.90, d: 0.70, n: { tr: 'Cam Cephe',          en: 'Glass Curtain Wall' } },
  { from: 500,  k: 'marble',   c: '#e8e6e1', w: 0.92, d: 1.80, n: { tr: 'Mermer',             en: 'Marble' } },
  { from: 1000, k: 'alu',      c: '#c3cad2', w: 1.00, d: 0.60, n: { tr: 'Alüminyum Panel',    en: 'Aluminium Panel' } },
  { from: 2000, k: 'carbon',   c: '#2b2e33', w: 0.86, d: 0.50, n: { tr: 'Karbon Fiber',       en: 'Carbon Fibre' } },
  { from: 3500, k: 'titan',    c: '#8794a6', w: 0.84, d: 2.20, n: { tr: 'Titanyum',           en: 'Titanium' } },
  { from: 5500, k: 'quantum',  c: '#19e0ff', w: 0.78, d: 1.20, n: { tr: 'Kuantum Alaşım',     en: 'Quantum Alloy' } },
  { from: 8000, k: 'cosmic',   c: '#b06cff', w: 0.72, d: 1.00, n: { tr: 'Yıldız Tozu Kompozit', en: 'Stardust Composite' } },
];
K.tierOf = floor => { let t = 0; for (let i = 0; i < K.MATS.length; i++) if (floor >= K.MATS[i].from) t = i; return t; };

/* ---------- dil ---------- */
K.TXT = {
  tr: {
    sub: 'Temelden Zirveye · 10.000 Katlı Ev İnşaatı', play: 'Yeni İnşaat', cont: 'Devam Et · Kat {n}', how: 'Nasıl Oynanır', set: 'Ayarlar',
    best: 'En iyi: {n} kat · Skor {s}', ok: 'Tamam', floor: 'KAT', wind: 'Rüzgâr', stab: 'Denge', resume: 'Devam', pauseT: 'Duraklatıldı', menu: 'Ana Menü',
    sound: 'Ses', guide: 'Rehber çizgisi', lang: 'Dil', langName: 'Türkçe', roof: 'Çatıyı Kapat', settingsT: 'Ayarlar', howT: 'Nasıl Oynanır',
    dig: 'Kazı', pour: 'Temel Dökümü', digHint: 'Sürükle: kepçeyi yönlendir · Basılı tut: kaz', pourHint: 'Basılı tut: beton dök · Yeşil bantta bırak',
    buildHint: 'Dokun / Boşluk: bloğu bırak', digDone: 'Çukur hazır!', pourDone: 'Temel hazır', quality: 'Temel kalitesi %{q}',
    perfect: 'MÜKEMMEL', great: 'Güzel', combo: 'x{n} kombo', miss: 'Iskaladın!', lives: 'Hak', checkpoint: 'KONTROL NOKTASI', checkpointS: 'Kat {n} güvende · haklar yenilendi',
    newMat: 'YENİ MALZEME', collapsedT: 'Bina yıkıldı!', collapsedM: 'Üstteki katların ağırlık merkezi taşıyıcı yüzeyin dışına çıktı.',
    missT: 'Şantiye kapandı', missM: 'Tüm haklarını kaybettin. Bloklar boşluğa düştü.', contFrom: 'Kontrol noktasından devam · Kat {n}', newGame: 'Yeni İnşaat',
    floors: 'Kat', meters: 'Yükseklik', score: 'Skor', badgeCol: 'YIKILDI', badgeMiss: 'HAK BİTTİ', doneT: 'Ev tamamlandı!', doneM: 'Çatı kapandı, anahtar teslim! {n} katlı evin hazır.',
    topT: 'ZİRVE!', topM: '10.000 kata ulaştın. Efsane bir usta oldun!', badgeDone: 'TAMAMLANDI', badgeTop: 'EFSANE', milestone: '{n}. KAT', tier: 'Seviye {n}',
    lean: 'sol', stOk: 'Dengeli', stWarn: 'Eğiliyor', stBad: 'Yıkılmak üzere!', gust: 'Rüzgâr', left: 'Sol', right: 'Sağ', fill: 'Dolum',
    h1: '<b>Kazı:</b> Parmağını ya da fareni sürükleyerek kepçeyi yönlendir, basılı tutarak kaz. Çukuru hedef çizgisine kadar derinleştir.',
    h2: '<b>Temel:</b> Basılı tutarak beton dök, seviye yeşil banda gelince bırak. Taşırma, eksik de bırakma.',
    h3: '<b>İnşaat:</b> Vinç sallanan bloğu taşır. Dokun ya da Boşluk tuşuyla bırak. Bloğu alttakinin üstüne tam oturt.',
    h4: '<b>Denge:</b> Üstteki katların ağırlık merkezi alttaki katın taşıyıcı yüzeyinden çıkarsa bina yıkılır. Göstergeyi izle; sola eğildiysen bir sonrakini sağa koy.',
    h5: '<b>Rüzgâr:</b> Yükseldikçe rüzgâr bırakılan bloğu savurur. Sağlam kazılmış ve düzgün dökülmüş temel rüzgârı azaltır.',
    h6: '<b>Kontrol noktası:</b> Her 25. kat geniş bir taşıyıcı kattır. Yıkılırsan buradan devam edersin. Iskalarsan hak kaybedersin (3 hak).',
    h7: '<b>Malzemeler:</b> Tuğladan yıldız tozuna kadar her seviyede farklı ağırlık, genişlik ve hız. 10.000. kata ulaşabilir misin?',
  },
  en: {
    sub: 'From Foundation to Summit · A 10,000-Storey House', play: 'New Build', cont: 'Continue · Floor {n}', how: 'How to Play', set: 'Settings',
    best: 'Best: {n} floors · Score {s}', ok: 'OK', floor: 'FLOOR', wind: 'Wind', stab: 'Balance', resume: 'Resume', pauseT: 'Paused', menu: 'Main Menu',
    sound: 'Sound', guide: 'Drop guide', lang: 'Language', langName: 'English', roof: 'Finish Roof', settingsT: 'Settings', howT: 'How to Play',
    dig: 'Excavation', pour: 'Foundation Pour', digHint: 'Drag: steer the bucket · Hold: dig', pourHint: 'Hold: pour concrete · Release in the green band',
    buildHint: 'Tap / Space: drop the block', digDone: 'Pit ready!', pourDone: 'Foundation set', quality: 'Foundation quality {q}%',
    perfect: 'PERFECT', great: 'Nice', combo: 'x{n} combo', miss: 'Missed!', lives: 'Lives', checkpoint: 'CHECKPOINT', checkpointS: 'Floor {n} secured · lives restored',
    newMat: 'NEW MATERIAL', collapsedT: 'The tower collapsed!', collapsedM: 'The centre of mass of the floors above left the supporting surface.',
    missT: 'Site closed', missM: 'You ran out of lives. The blocks fell away.', contFrom: 'Continue from checkpoint · Floor {n}', newGame: 'New Build',
    floors: 'Floors', meters: 'Height', score: 'Score', badgeCol: 'COLLAPSED', badgeMiss: 'OUT OF LIVES', doneT: 'House complete!', doneM: 'Roof on, keys handed over! Your {n}-storey house is ready.',
    topT: 'SUMMIT!', topM: 'You reached floor 10,000. A true master builder!', badgeDone: 'COMPLETE', badgeTop: 'LEGEND', milestone: 'FLOOR {n}', tier: 'Level {n}',
    lean: 'left', stOk: 'Stable', stWarn: 'Leaning', stBad: 'About to fall!', gust: 'Wind', left: 'Left', right: 'Right', fill: 'Fill',
    h1: '<b>Dig:</b> Drag your finger or mouse to steer the bucket, hold to dig. Deepen the pit down to the target line.',
    h2: '<b>Foundation:</b> Hold to pour concrete and release when the level reaches the green band. Don\'t overfill.',
    h3: '<b>Build:</b> The crane swings the block. Tap or press Space to drop it. Line it up on top of the floor below.',
    h4: '<b>Balance:</b> If the centre of mass of the floors above leaves the supporting surface below, the tower collapses. Watch the gauge; if it leans left, place the next one right.',
    h5: '<b>Wind:</b> The higher you build, the more the wind pushes the falling block. A well-dug, well-poured foundation reduces it.',
    h6: '<b>Checkpoints:</b> Every 25th floor is a wide load-bearing slab. If you collapse you resume from there. Missing costs a life (3 lives).',
    h7: '<b>Materials:</b> From brick to stardust, every level changes weight, width and speed. Can you reach floor 10,000?',
  },
};
K.lang = 'tr';
K.t = (key, o) => {
  let s = (K.TXT[K.lang] && K.TXT[K.lang][key]) || K.TXT.tr[key] || key;
  if (o) for (const k in o) s = s.replace('{' + k + '}', o[k]);
  return s;
};

/* ---------- kayıt ---------- */
K.store = {
  get(k, d) { try { const v = localStorage.getItem('katkat.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('katkat.' + k, JSON.stringify(v)); } catch (e) { /* kota / gizli mod */ } },
  del(k) { try { localStorage.removeItem('katkat.' + k); } catch (e) {} },
};

/* ---------- ses (tamamen sentez; harici dosya yok) ---------- */
K.snd = (() => {
  let ac = null, master = null, ambGain = null, noiseBuf = null, on = true, last = {};
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = on ? 0.8 : 0; master.connect(ac.destination);
      const len = ac.sampleRate * 2; noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.5;
      ambGain = ac.createGain(); ambGain.gain.value = 0;
      src.connect(bp); bp.connect(ambGain); ambGain.connect(master); src.start();
    } catch (e) { ac = null; }
  }
  function tone(f, d, type = 'sine', v = 0.2, slide = 0, delay = 0) {
    if (!ac || !on) return; const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
  }
  function noise(d, freq, v = 0.3, type = 'lowpass', delay = 0, sweep = 0) {
    if (!ac || !on) return; const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t + d);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + d + 0.05);
  }
  const limit = (k, ms) => { const n = performance.now(); if (last[k] && n - last[k] < ms) return false; last[k] = n; return true; };
  return {
    init, get on() { return on; },
    setOn(v) { on = v; if (master) master.gain.value = v ? 0.8 : 0; },
    ambient(a) { if (ambGain) ambGain.gain.setTargetAtTime(on ? a : 0, ac.currentTime, 0.4); },
    click() { tone(560, 0.07, 'triangle', 0.12); },
    drop() { if (limit('drop', 60)) { tone(420, 0.12, 'triangle', 0.08, -200); } },
    land(h = 1) { noise(0.22, 520, 0.5 * h); tone(80, 0.22, 'sine', 0.55 * h, -40); },
    perfect(n = 1) { const b = 660 * Math.pow(1.0595, Math.min(12, n * 2)); tone(b, 0.18, 'sine', 0.16); tone(b * 1.5, 0.22, 'sine', 0.13, 0, 0.07); tone(b * 2, 0.3, 'sine', 0.1, 0, 0.14); },
    miss() { tone(300, 0.4, 'sawtooth', 0.12, -200); noise(0.3, 900, 0.2); },
    dig() { if (limit('dig', 90)) noise(0.14, 700, 0.16, 'lowpass', 0, -400); },
    pour() { if (limit('pour', 110)) noise(0.2, 380, 0.17, 'lowpass'); },
    creak() { if (limit('creak', 380)) { tone(95 + Math.random() * 25, 0.5, 'sawtooth', 0.06, -30); tone(180, 0.3, 'square', 0.025, -60, 0.1); } },
    collapse() { noise(2.4, 700, 0.8, 'lowpass', 0, -500); tone(55, 1.6, 'sine', 0.7, -25); noise(1.2, 220, 0.6, 'lowpass', 0.5); },
    thud() { if (limit('thud', 120)) { noise(0.25, 300, 0.35); tone(60, 0.25, 'sine', 0.35, -20); } },
    milestone() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.45, 'triangle', 0.16, 0, i * 0.09)); },
    checkpoint() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'sine', 0.14, 0, i * 0.08)); },
    win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.7, 'triangle', 0.15, 0, i * 0.12)); },
  };
})();
