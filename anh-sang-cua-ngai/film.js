// "Ánh Sáng Của Ngài" — director's timeline. The six storyboard panels are reference plates:
// each is repainted from palette-knife strokes (paintRef), confined to its value groups, every frame.
import { Impasto, Strokes, hex, KNIFE, DAB } from './engine/impasto.js';
import { Ref, paintRef } from './engine/plate.js';
import { T, XF, LINES, VERSE, DUR, B } from './timeline.js';

const W = 1920, H = 1080, PH = 1080, SC = .6;        // plate units: 1080 tall; reference = .6 px per unit
const TITLE = [890, 120];
const NEVER = 1e6, ALWAYS = -2e6;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = k => k * k * (3 - 2 * k);
const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eo = k => 1 - Math.pow(1 - k, 3);
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const TR = (x, y) => [1, 0, 0, 1, x, y];
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const ROT = (a, px, py) => { const c = Math.cos(a), s = Math.sin(a); return mul(TR(px, py), mul([c, s, -s, c, 0, 0], TR(-px, -py))); };
const U = v => v * PH / 308;                           // storyboard-panel px -> plate units

let E, P = {}, dyn, META, LN = [];
const img = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

// keep-colour test: warm light, the red mantle, the halo — "His" colour in the grey world
const warm = (r, g, b) => r > b + 34 && r > 70;
const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const JESUS_HANDS = [[383, 75], [470, 60], [560, 25], [600, 0], [830, 0], [830, 308], [540, 308], [520, 240], [480, 160], [420, 150], [383, 125]].map(([x, y]) => [U(x), U(y)]);
const TOUCH = [U(381), U(132)];

// build a painted plate from <name>_ref.png + <name>_id.png
async function buildPlate(name, o = {}) {
  const m = META[o.meta || name], w = m.w / SC, h = m.h / SC;
  const R = new Ref(w, h, SC);
  const [ri, ii] = await Promise.all([img(`plates/${name}_ref.png`), img(`plates/${name}_id.png`)]);
  const c = R.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, R.pw, R.ph); c.drawImage(ri, 0, 0, R.pw, R.ph);
  // id map: group g (1..6) x zone z (0/1) -> prop id; zones share the group (strokes may cross) but paint finer
  const t = document.createElement('canvas'); t.width = R.pw; t.height = R.ph; const tx = t.getContext('2d', { willReadFrequently: true });
  tx.imageSmoothingEnabled = false; tx.drawImage(ii, 0, 0, R.pw, R.ph);
  const src = tx.getImageData(0, 0, R.pw, R.ph), d = src.data;
  const NG = 6;
  R.props = [null];
  for (let g = 1; g <= NG; g++) for (let z = 0; z < 2; z++) R.props.push({ dir: null, fallback: o.fallback ?? 0, maxR: z ? (o.zoneR ?? 9) : (o.maxR ?? 70), detail: z ? .45 : 1, type: KNIFE, hgt: 1, jit: .06, len: 1, wid: 1, aj: .45, group: g, follow: 3 });
  for (let i = 0; i < d.length; i += 4) { const g = d[i], z = d[i + 1] ? 1 : 0, a = d[i + 3]; const k = g && a > 127 ? 1 + (g - 1) * 2 + z : 0; d[i] = k; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = a > 127 ? 255 : 0; }
  R.idc.setTransform(1, 0, 0, 1, 0, 0); R.idc.putImageData(src, 0, 0);
  const rd = c.getImageData(0, 0, R.pw, R.ph).data;
  const px = (x, y) => { const i = (Math.min(R.ph - 1, y * SC | 0) * R.pw + Math.min(R.pw - 1, x * SC | 0)) * 4; return [rd[i], rd[i + 1], rd[i + 2]]; };
  const strokes = paintRef(R, {
    R: o.R || [40, 20, 10, 5, 2.6], T: o.T ?? 14, seed: o.seed ?? 3,
    rev: o.rev ? (x, y) => o.rev(x, y, px(x, y)) : undefined,
    // paint-over order: a diagonal knife sweep across the frame, coarse planes first
    app: (x, y, level) => clamp((x / w) * .7 + (y / h) * .15) * XF * .75 + level * .03 + hash(x * .37 + y * .11) * .04,
  });
  return { b: E.batch(strokes.data()), tex: E.texture(R.ctx.canvas), w, h, n: strokes.n };
}

async function buildTitle() {
  const w = 900, h = 330, R = new Ref(w, h, 1), c = R.ctx;
  const g = (cx) => { const gr = cx.createLinearGradient(0, 30, 0, 300); gr.addColorStop(0, '#5a2a1a'); gr.addColorStop(.6, '#3a1c14'); gr.addColorStop(1, '#2a1410'); return gr; };
  R.text('ÁNH SÁNG', w / 2, 140, '700 136px "Cormorant Garamond"', g, { dir: 0, fallback: 0, maxR: 8, group: 1, follow: 99 });
  R.text('CỦA NGÀI', w / 2, 292, '700 136px "Cormorant Garamond"', g, { dir: 0, fallback: 0, maxR: 8, group: 1, follow: 99 });
  const s = paintRef(R, { R: [7, 3.5, 1.8], T: 10, seed: 11, app: (x, y, l) => x / w * .9 + l * .05 });
  return { b: E.batch(s.data()), tex: E.texture(c.canvas), w, h };
}

export async function setup(canvas) {
  await Promise.all([document.fonts.load('700 150px "Cormorant Garamond"'), document.fonts.load('italic 500 60px "Cormorant Garamond"'), document.fonts.load('500 34px "Cormorant Garamond"')]);
  META = await (await fetch('plates/meta.json')).json();
  E = new Impasto(canvas, { ss: +(new URLSearchParams(location.search).get('ss') || 2) }); dyn = new Strokes(8192);
  const keepWarm = (x, y, [r, g, b]) => warm(r, g, b) ? ALWAYS : 0;
  P.door = await buildPlate('door', { rev: keepWarm, fallback: 90 });
  P.cross = await buildPlate('cross', { rev: keepWarm, fallback: -35 });
  P.face = await buildPlate('face', { rev: keepWarm, zoneR: 7 });
  // hands: grey world; His sleeve and mantle keep their colour; at the touch colour floods out from the fingertips
  const wave = (x, y) => Math.hypot(x - TOUCH[0], (y - TOUCH[1]) * 1.3) / 1500;
  P.hands = await buildPlate('hands', { rev: (x, y) => inPoly(JESUS_HANDS, x, y) ? ALWAYS : wave(x, y), zoneR: 8 });
  P.arm = await buildPlate('hands_arm', { meta: 'hands', rev: (x, y) => wave(x, y), zoneR: 8, seed: 5 });
  P.bless = await buildPlate('bless', { zoneR: 8 });
  P.dawn = await buildPlate('dawn', { fallback: -4, zoneR: 6 });
  P.title = await buildTitle();
  // bake the static paint once per plate, at the resolution its closest camera needs
  const ssv = E.ss / 2, bake = (pl, scale, o) => E.bake(pl.w, pl.h, scale * ssv, c => { E.under(pl.tex, pl.w, pl.h, { cam: c, ...o }); E.draw(pl.b, { cam: c, appear: -1e6, ...o }); });
  const G = { t: 0, grey: 1, reveal: NEVER }, C = { t: 0, grey: 0 };
  P.door.bk = bake(P.door, 2.4, G); P.cross.bk = bake(P.cross, 2.2, G); P.face.bk = bake(P.face, 2.8, G);
  P.hands.bk = bake(P.hands, 2.5, G); P.hands.bkC = bake(P.hands, 2.5, C);
  P.bless.bk = bake(P.bless, 2.7, C); P.dawn.bk = bake(P.dawn, 2.8, C);
  for (const [id, text, t0, t1, x, y, size, align] of [...LINES, [...VERSE, 40, 'center']]) {
    const el = document.createElement('div'); el.className = 'line' + (id === 'v' ? ' small' : ''); el.textContent = text;
    el.style.fontSize = size + 'px'; document.body.appendChild(el);
    const r = el.getBoundingClientRect();
    el.style.left = (x - r.width / 2) + 'px'; el.style.top = (y - r.height / 2) + 'px';
    LN.push({ id, text, t0, t1, el, box: [x - r.width / 2, y - r.height / 2, x + r.width / 2, y + r.height / 2] });
  }
  window.DUR = +(new URLSearchParams(location.search).get('dur') || DUR);
  window.EV = EVENTS;
  window.TEXTS = t => {
    const out = LN.filter(l => t >= l.t0 && t <= l.t1).map(l => ({ id: l.id, text: l.text, x0: l.box[0], y0: l.box[1], x1: l.box[2], y1: l.box[3] }));
    if (t >= T.title) out.push({ id: 'title', text: 'ÁNH SÁNG CỦA NGÀI', x0: TITLE[0], y0: TITLE[1], x1: TITLE[0] + 900, y1: TITLE[1] + 330 });
    return out;
  };
  return frame;
}

// sound/cue events for the mixer (same numbers the picture uses)
const EVENTS = [
  { t: T.door + .05, type: 'open' }, { t: T.cross, type: 'scrape' }, { t: T.face, type: 'scrape' },
  { t: T.hands, type: 'silence' }, { t: T.reachBack, type: 'cloth' }, { t: T.reach, type: 'cloth2' }, { t: T.touch, type: 'touch' },
  { t: T.bless, type: 'scrape' }, { t: T.dawn, type: 'scrape' }, { t: T.title, type: 'title' },
  ...[...LINES, VERSE].map(l => ({ t: l[2], type: 'line', id: l[0], text: l[1], t1: l[3] })),
];

// a camera that never leaves the painted plate
function cam(pl, x, y, zoom) {
  const hw = W / 2 / zoom, hh = H / 2 / zoom;
  return { x: clamp(x, hw + 2, pl.w - hw - 2), y: clamp(y, hh + 2, pl.h - hh - 2), zoom };
}
function plate(pl, o) {
  const M = o.M || [1, 0, 0, 1, 0, 0];
  const inTrans = o.appear !== undefined && o.t < o.appear + XF + .2;
  if (!inTrans && !o.live && pl.bk) { E.blit(o.bake || pl.bk, { cam: o.cam, M }); return; }
  const ua = o.appear === undefined ? 1 : seg(o.t, o.appear + XF * .5, o.appear + XF);
  if (!o.noUnder && ua > 0) E.under(pl.tex, pl.w, pl.h, { ...o, M, alpha: (o.alpha ?? 1) * ua });
  E.draw(pl.b, { ...o, M, appear: inTrans ? o.appear : -1e6, appDur: .14 });
}
const flush = o => { if (dyn.n) E.drawNow(dyn.data(), o); dyn.clear(); };

// warm motes drifting in a light beam (fixed seeds: they never boil)
function motes(t, n, box, col, seed, o = {}) {
  for (let i = 0; i < n; i++) {
    const h1 = hash(seed + i * 1.7), h2 = hash(seed + i * 3.1), h3 = hash(seed + i * 5.3);
    const x = box[0] + h1 * (box[2] - box[0]) + Math.sin(t * .6 + i) * 14 + t * (o.vx ?? 6);
    const y = box[1] + ((h2 * (box[3] - box[1]) - t * (o.vy ?? 9) * (0.5 + h3)) % (box[3] - box[1]) + (box[3] - box[1])) % (box[3] - box[1]);
    const a = (.35 + .4 * Math.sin(t * 1.3 + i * 2.1) ** 2) * (o.alpha ?? 1);
    dyn.push({ x, y, ang: 0, len: 5 + h3 * 7, wid: 4 + h3 * 5, c: col, type: DAB, seed: seed + i, alpha: a, hgt: .6 });
  }
}

// ================= SHOTS =================
// 1 · the dark corridor; light at the far door. Push in through the silence of the room.
function shotDoor(t, tr) {
  const k = ss(seg(t, 0, T.cross + XF));
  const c = cam(P.door, lerp(1480, 1720, k), lerp(540, 500, k), lerp(1.0, 1.2, k));
  plate(P.door, { t, cam: c, grey: 1, reveal: NEVER, ...tr });
  // the wet floor answers the doorway: short horizontal knife dabs, breaking and fading
  for (let i = 0; i < 70; i++) {
    const h1 = hash(i * 2.3), h2 = hash(i * 4.1), y = U(212) + h2 * U(92), spread = U(30) + (y - U(212)) * .9;
    const x = U(548) + (h1 - .5) * 2 * spread;
    const fl = .5 + .5 * Math.sin(t * 2.2 + i * 1.9);
    dyn.push({ x, y, ang: (hash(i * 9) - .5) * .12, len: 26 + h1 * 40, wid: 7 + h2 * 6, c: hex(h1 > .5 ? '#f6dca0' : '#e8b868'), c2: hex('#fff0c8'), type: KNIFE, seed: 400 + i, alpha: (.25 + .35 * fl) * (1 - (y - U(212)) / U(110)), hgt: .7 });
  }
  motes(t, 26, [U(495), U(20), U(605), U(210)], hex('#fff2cc'), 30, { vy: 6, vx: 0 });
  flush({ t, cam: c, grey: 0, run: .3 });
}
// 2 · the hill and the cross; we truck with the beam until it finds him
function shotCross(t, tr) {
  const k = eio(seg(t, T.cross - .2, T.face + XF));
  const c = cam(P.cross, lerp(1980, 1120, k), 540, 1.05);
  plate(P.cross, { t, cam: c, grey: 1, reveal: NEVER, ...tr });
  // the beam: long translucent knife planes sliding slowly along its axis
  const ang = Math.atan2(U(270) - U(0), U(290) - U(720));
  for (let i = 0; i < 16; i++) {
    const h1 = hash(i * 7.7 + 1), u = ((h1 + t * .045) % 1), x = lerp(U(720), U(260), u) + (hash(i * 3.3) - .5) * U(70), y = lerp(U(-10), U(280), u);
    dyn.push({ x, y, ang, len: 260 + h1 * 260, wid: 40 + hash(i) * 60, c: hex('#fbe8b8'), c2: hex('#f2d090'), type: KNIFE, seed: 600 + i, alpha: .1 + .1 * Math.sin(t * .9 + i) ** 2, hgt: .25 });
  }
  motes(t - T.cross, 34, [U(300), U(40), U(700), U(260)], hex('#fff0c0'), 70, { vy: 4, vx: -5 });
  flush({ t, cam: c, grey: 0, run: .8 });
}
// 3 · His face in profile: pull back from the eye — the one who sees
function shotFace(t, tr) {
  const k = eo(seg(t, T.face, T.hands));
  const c = cam(P.face, lerp(U(398), 1450, k), lerp(U(110), 540, k), lerp(1.38, 1.02, k));
  plate(P.face, { t, cam: c, grey: 1, reveal: NEVER, ...tr });
  // the halo breathes: a ring of warm dabs swelling on the half-bar
  const cx = U(372), cy = U(118), r0 = U(178), br = .5 + .5 * Math.sin((t - T.face) * Math.PI / B(2));
  for (let i = 0; i < 90; i++) {
    const a = i / 90 * Math.PI * 2 + hash(i) * .05, r = r0 + (hash(i * 3) - .5) * 30 + br * 8;
    if (Math.cos(a) < -.35 && Math.sin(a) > .2) continue;          // behind the hair and shoulder
    dyn.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, ang: a + Math.PI / 2, len: 34 + hash(i * 5) * 20, wid: 14, c: hex('#f8d68a'), c2: hex('#fff0c0'), type: KNIFE, seed: 800 + i, alpha: .18 + br * .22, hgt: .6 });
  }
  flush({ t, cam: c, grey: 0, run: .2 });
}
// 4 · the hands. Hard cut into near-silence; he draws back, reaches; the touch re-lays the world in colour
function armPos(t) {
  const back = ss(seg(t, T.hands, T.reachBack)), go = eio(seg(t, T.reach, T.touch)), settle = ss(seg(t, T.touch, T.touch + .5));
  const x = lerp(-150, -190, back) + (60 + 190) * go - 8 * settle, y = lerp(95, 120, back) - (120 + 22) * go + 4 * settle;
  return { x: x * 1.0, y, rot: lerp(.05, .07, back) - .07 * go };
}
function shotHands(t, tr) {
  const k = ss(seg(t, T.hands, T.bless + XF));
  const c = cam(P.hands, lerp(1460, TOUCH[0] + 60, k), lerp(560, TOUCH[1] + 20, k), lerp(1.0, 1.22, k));
  const o = { t, cam: c, grey: 1, reveal: T.touch, revDur: .35 };
  plate(P.hands, { ...o, ...tr, bake: t < T.touch ? P.hands.bk : P.hands.bkC, live: t >= T.touch - .05 && t < T.touch + 1.7 });
  const a = armPos(t), M = mul(TR(a.x, a.y), ROT(a.rot, 0, PH));
  plate(P.arm, { ...o, M, noUnder: false, ...tr });
  // the touch: a burst of warm paint at the fingertips, then a glow that stays
  if (t > T.touch - .05) {
    const kk = seg(t, T.touch - .05, T.touch + 1.6);
    for (let i = 0; i < 40; i++) {
      const an = hash(i * 1.3) * Math.PI * 2, d = eo(kk) * (40 + hash(i * 2.7) * 230);
      dyn.push({ x: TOUCH[0] + 10 + Math.cos(an) * d, y: TOUCH[1] + 6 + Math.sin(an) * d * .8, ang: an, len: 20 + hash(i) * 26, wid: 10 + hash(i * 5) * 10, c: hex('#fff2c4'), c2: hex('#f6c860'), type: KNIFE, seed: 900 + i, alpha: (1 - kk) * .85, hgt: .9 });
    }
    dyn.push({ x: TOUCH[0] + 10, y: TOUCH[1] + 6, ang: 0, len: 120, wid: 100, c: hex('#fff6d8'), type: DAB, seed: 990, alpha: .55 * (1 - .5 * kk), hgt: .3 });
    flush({ t, cam: c, grey: 0, run: .3 });
  }
}
// 5 · the blessing: tilt up from his bowed head to His face
function shotBless(t, tr) {
  const k = eio(seg(t, T.bless, T.dawn));
  const c = cam(P.bless, lerp(U(505), U(360), k), lerp(U(225), U(105), k), lerp(1.32, 1.16, k));
  plate(P.bless, { t, cam: c, grey: 0, ...tr });
  motes(t - T.bless, 30, [U(200), U(10), U(560), U(240)], hex('#fff0c0'), 120, { vy: 5, vx: 2, alpha: .8 });
  flush({ t, cam: c, grey: 0 });
}
// 6 · dawn: pull back from the two of them to the whole sky; the title is knifed into the light
function shotDawn(t, tr) {
  const k = eo(seg(t, T.dawn, T.dawn + 3.6)), drift = seg(t, T.dawn + 3.6, DUR);
  const c = cam(P.dawn, lerp(U(388), 1900, k) - drift * 30, lerp(U(175), 560, k), lerp(1.62, 1.0, k) + drift * .012);
  plate(P.dawn, { t, cam: c, grey: 0, ...tr });
  if (t > T.title) plate(P.title, { t, cam: { x: W / 2, y: H / 2, zoom: 1 }, M: TR(TITLE[0], TITLE[1]), grey: 0, appear: T.title, appDur: 1.0, noUnder: true });
}

// [start, fn, paint-over in (0 = hard cut), look]
const POST = {
  night: { expo: 1.02, sat: 1, contrast: 1.05, vig: .34, spec: .26, shin: 26, lift: [.015, .015, .025] },
  gold: { expo: 1.03, sat: 1.04, contrast: 1.03, vig: .26, spec: .22, shin: 26 },
};
const EDIT = [[T.door, shotDoor, 0, 'night'], [T.cross, shotCross, XF, 'night'], [T.face, shotFace, XF, 'night'], [T.hands, shotHands, 0, 'night'], [T.bless, shotBless, XF, 'gold'], [T.dawn, shotDawn, XF, 'gold']];

function frame(t) {
  let i = 0; while (i < EDIT.length - 1 && t >= EDIT[i + 1][0]) i++;
  E.begin();
  const [t0, fn, d, look] = EDIT[i];
  const post = { ...POST[look] };
  if (d > 0 && t < t0 + d + .2 && i > 0) { EDIT[i - 1][1](t, {}); fn(t, { appear: t0 }); } else fn(t, {});
  // opening: the room is dark; the door's light comes up out of black
  if (fn === shotDoor) post.expo *= lerp(.35, 1.02, ss(seg(t, 0, 1.1)));
  // the touch: light drops to a grazing angle so every ridge catches it, then settles
  if (fn === shotHands && t > T.touch) {
    const k = ss(seg(t, T.touch, T.touch + 2.2));
    post.light = [lerp(-.95, -.55, k), lerp(-.2, -.6, k), lerp(.22, .7, k)]; post.norm = lerp(7, 3.4, k); post.expo = lerp(1.15, 1.04, k); post.lightCol = [1, .92, .78];
  }
  // ending: the low sun rakes the paint, then the light sinks
  if (fn === shotDawn) {
    const k = ss(seg(t, T.dawn + .3, T.dawn + 3));
    post.light = [lerp(-.55, -.9, k), lerp(-.6, -.25, k), lerp(.7, .3, k)]; post.norm = lerp(3.2, 5.5, k); post.lightCol = [1, .9, .74];
    post.expo *= lerp(1, .9, ss(seg(t, DUR - 1.2, DUR)));
  }
  E.finish(post);
  for (const l of LN) {
    const wipe = seg(t, l.t0, l.t0 + .8), out = 1 - seg(t, l.t1 - .35, l.t1);
    l.el.style.opacity = String(Math.min(1, wipe * 3) * out);
    l.el.style.clipPath = `inset(0 ${(1 - eo(wipe)) * 100}% 0 0)`;
  }
}
