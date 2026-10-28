// Acting test: two scenes with cut-out character parts that move (open with ?test=1).
// 0-7 s   corridor: He walks out of the light toward us, mantle stirring; the man hears and lifts his head.
// 7-13 s  blessing: His hand hovers, then comes down on the man's head on the beat; He bows His head.
import { Impasto, Strokes, hex, KNIFE, DAB } from './engine/impasto.js';
import { Ref, paintRef } from './engine/plate.js';

const W = 1920, H = 1080, PH = 1080, SC = .6, NEVER = 1e6, ALWAYS = -2e6;
const BEAT = 60 / 96, DUR = 13, CUT = 7, XF = .55;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = k => k * k * (3 - 2 * k);
const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eo = k => 1 - Math.pow(1 - k, 3);
const back = (k, s = 1.6) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const TR = (x, y) => [1, 0, 0, 1, x, y];
const ROT = (a, px, py) => { const c = Math.cos(a), s = Math.sin(a); return mul(TR(px, py), mul([c, s, -s, c, 0, 0], TR(-px, -py))); };
const SCL = (k, px, py) => mul(TR(px, py), mul([k, 0, 0, k, 0, 0], TR(-px, -py)));
const U = v => v * PH / 308;
const ap = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

let E, P = {}, dyn, META;
const img = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const warm = (r, g, b) => r > b + 34 && r > 70;

async function buildPlate(name, o = {}) {
  const m = META[name], w = m.w / SC, h = m.h / SC, R = new Ref(w, h, SC);
  const [ri, ii] = await Promise.all([img(`plates/${name}_ref.png`), img(`plates/${name}_id.png`)]);
  const c = R.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, R.pw, R.ph); c.drawImage(ri, 0, 0, R.pw, R.ph);
  const t = document.createElement('canvas'); t.width = R.pw; t.height = R.ph; const tx = t.getContext('2d', { willReadFrequently: true });
  tx.imageSmoothingEnabled = false; tx.drawImage(ii, 0, 0, R.pw, R.ph);
  const src = tx.getImageData(0, 0, R.pw, R.ph), d = src.data;
  R.props = [null];
  for (let g = 1; g <= 6; g++) for (let z = 0; z < 2; z++) R.props.push({ dir: null, fallback: o.fallback ?? 0, maxR: z ? (o.zoneR ?? 9) : (o.maxR ?? 70), detail: z ? .45 : 1, type: KNIFE, hgt: 1, jit: .06, len: 1, wid: 1, aj: .45, group: g, run: 0 });
  for (let i = 0; i < d.length; i += 4) { const g = d[i], z = d[i + 1] ? 1 : 0, a = d[i + 3]; const k = g && a > 127 ? 1 + (g - 1) * 2 + z : 0; d[i] = k; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = a > 127 ? 255 : 0; }
  R.idc.setTransform(1, 0, 0, 1, 0, 0); R.idc.putImageData(src, 0, 0);
  const rd = c.getImageData(0, 0, R.pw, R.ph).data;
  const px = (x, y) => { const i = (Math.min(R.ph - 1, y * SC | 0) * R.pw + Math.min(R.pw - 1, x * SC | 0)) * 4; return [rd[i], rd[i + 1], rd[i + 2]]; };
  const s = paintRef(R, {
    R: o.R || [40, 20, 10, 5, 2.6], T: o.T ?? 14, seed: o.seed ?? 3,
    rev: o.rev ? (x, y) => o.rev(x, y, px(x, y)) : undefined,
    app: (x, y, level) => clamp((x / w) * .7 + (y / h) * .15) * XF * .75 + level * .03 + hash(x * .37 + y * .11) * .04,
  });
  return { b: E.batch(s.data()), tex: E.texture(R.ctx.canvas), w, h };
}

export async function setup(canvas) {
  META = await (await fetch('plates/meta.json')).json();
  E = new Impasto(canvas, { ss: +(new URLSearchParams(location.search).get('ss') || 1) }); dyn = new Strokes(8192);
  const keepWarm = (x, y, [r, g, b]) => warm(r, g, b) ? ALWAYS : 0;
  P.door = await buildPlate('door_bg', { rev: keepWarm, fallback: 90 });
  P.jesus = await buildPlate('door_jesus', { rev: keepWarm, zoneR: 6, seed: 7 });
  P.mhead = await buildPlate('door_mhead', { rev: keepWarm, zoneR: 6, seed: 8 });
  P.bless = await buildPlate('bless_bg', { zoneR: 8 });
  P.hand = await buildPlate('bless_hand', { zoneR: 6, seed: 9 });
  P.jhead = await buildPlate('bless_jhead', { zoneR: 7, seed: 10 });
  const bake = (pl, scale, o) => E.bake(pl.w, pl.h, scale * E.ss / 2, c => { E.under(pl.tex, pl.w, pl.h, { cam: c, ...o }); E.draw(pl.b, { cam: c, appear: -1e6, ...o }); });
  P.door.bk = bake(P.door, 2.3, { t: 0, grey: 1, reveal: NEVER });
  P.bless.bk = bake(P.bless, 2.5, { t: 0, grey: 0 });
  window.DUR = DUR;
  return frame;
}

const cam = (pl, x, y, zoom) => { const hw = W / 2 / zoom, hh = H / 2 / zoom; return { x: clamp(x, hw + 2, pl.w - hw - 2), y: clamp(y, hh + 2, pl.h - hh - 2), zoom }; };
function plate(pl, o) {
  const M = o.M || [1, 0, 0, 1, 0, 0];
  const inTrans = o.appear !== undefined && o.t < o.appear + XF + .2;
  if (!inTrans && pl.bk) { E.blit(pl.bk, { cam: o.cam }); return; }
  const ua = o.appear === undefined ? 1 : seg(o.t, o.appear + XF * .5, o.appear + XF);
  if (ua > 0) E.under(pl.tex, pl.w, pl.h, { ...o, M, alpha: ua });
  E.draw(pl.b, { ...o, M, appear: inTrans ? o.appear : -1e6, appDur: .14 });
}
const flush = o => { if (dyn.n) E.drawNow(dyn.data(), o); dyn.clear(); };

// ---------------- scene 1 · the corridor
const FEET = [U(550), U(211)], NECK = [U(308), U(113)];
function walk(t) {
  const w = eio(seg(t, 1.0, 5.2)), moving = seg(t, .9, 1.3) * (1 - seg(t, 4.7, 5.3));
  const ph = (t - 1.0) / BEAT * Math.PI;                        // one step per beat
  return { w, ph, moving, s: 1 + .32 * w, dx: -U(14) * w, dy: U(32) * w, bob: -Math.abs(Math.sin(ph)) * 7 * moving, sway: Math.sin(ph) * .014 * moving };
}
function headLift(t) {
  const dip = ss(seg(t, 3.5, 3.95)) * (1 - ss(seg(t, 3.95, 4.3)));   // anticipation: a small flinch down
  const up = back(seg(t, 4.0, 5.3), 1.2);                            // lift toward the light, overshoot, settle
  return .05 * dip - .3 * up;
}
function shotDoor(t, tr) {
  const k = ss(seg(t, 0, CUT));
  const c = cam(P.door, lerp(1480, 1560, k), lerp(540, 500, k), lerp(1.0, 1.12, k));
  const o = { t, cam: c, grey: 1, reveal: NEVER };
  plate(P.door, { ...o, ...tr });
  const wk = walk(t);
  const MJ = mul(TR(wk.dx, wk.dy + wk.bob), mul(SCL(wk.s, FEET[0], FEET[1]), ROT(wk.sway, FEET[0], FEET[1])));
  // light on the wet floor follows Him as He comes out of the door
  const fx = ap(MJ, FEET[0], FEET[1]);
  for (let i = 0; i < 70; i++) {
    const h1 = hash(i * 2.3), h2 = hash(i * 4.1), y = fx[1] + h2 * U(92) * (1 - .3 * wk.w), spread = U(26) * wk.s + (y - fx[1]) * .9;
    const fl = .5 + .5 * Math.sin(t * 2.2 + i * 1.9);
    dyn.push({ x: fx[0] + (h1 - .5) * 2 * spread, y, ang: (hash(i * 9) - .5) * .12, len: 26 + h1 * 40, wid: 7 + h2 * 6, c: hex(h1 > .5 ? '#f6dca0' : '#e8b868'), c2: hex('#fff0c8'), type: KNIFE, seed: 400 + i, alpha: (.25 + .35 * fl) * clamp(1 - (y - fx[1]) / U(110)), hgt: .7 });
  }
  flush({ t, cam: c, grey: 0, run: .3 });
  plate(P.jesus, { ...o, M: MJ, run: 0 });
  // the mantle stirs as He walks: red knife strokes rippling along its free edge
  const edge = [[530, 66], [518, 86], [505, 108], [490, 128], [505, 148], [522, 162], [536, 168]];
  for (let i = 0; i < edge.length - 1; i++) for (let j = 0; j < 3; j++) {
    const u = (i + j / 3) / (edge.length - 1), [x0, y0] = edge[i], [x1, y1] = edge[i + 1], f = j / 3;
    const x = U(lerp(x0, x1, f)), y = U(lerp(y0, y1, f)), wave = Math.sin(wk.ph * .5 * Math.PI - u * 5) * U(3.2) * u * (wk.moving * .8 + .2 + .2 * Math.sin(t * 1.7));
    const p = ap(MJ, x - wave, y + wave * .3);
    dyn.push({ x: p[0], y: p[1], ang: Math.atan2(y1 - y0, x1 - x0), len: U(5) * wk.s, wid: U(3.2) * wk.s, c: hex(j % 2 ? '#c0352a' : '#d9503a'), c2: hex('#8e2420'), type: KNIFE, seed: 500 + i * 3 + j, alpha: .7, hgt: 1 });
  }
  // feet: one lifts on each step
  for (const [s, fx0] of [[0, 545], [1, 556]]) {
    const lift = Math.max(0, Math.sin(wk.ph + s * Math.PI)) * wk.moving, p = ap(MJ, U(fx0), U(209) - lift * U(2.2));
    dyn.push({ x: p[0], y: p[1], ang: 0, len: U(6.5) * wk.s, wid: U(3.2) * wk.s, c: hex('#5a3a28'), c2: hex('#3a2618'), type: DAB, seed: 520 + s, alpha: 1, hgt: .9 });
  }
  flush({ t, cam: c, grey: 0, run: 0 });
  // the man: a throat in shadow under the jaw (seen when he lifts his head), then the head itself
  for (let i = 0; i < 8; i++) dyn.push({ x: U(318 + (i % 4) * 5), y: U(104 + (i >> 2) * 6), ang: 1.1, len: U(9), wid: U(5), c: hex('#2c2426'), c2: hex('#3a2c28'), type: KNIFE, seed: 540 + i, hgt: .8 });
  flush({ t, cam: c, grey: 1, reveal: NEVER, run: 0 });
  plate(P.mhead, { ...o, M: ROT(headLift(t), NECK[0], NECK[1]), run: 0 });
}

// ---------------- scene 2 · the blessing
const ELBOW = [U(440), U(246)], JNECK = [U(300), U(140)], TOUCH = [U(522), U(176)];
const T_TOUCH = CUT + 4 * BEAT;                                    // the hand lands on the 4th beat of the scene
function handRot(t) {
  const hover = Math.sin((t - CUT) * 3.1) * .012 * (1 - seg(t, T_TOUCH - .9, T_TOUCH - .6));
  const down = eio(seg(t, T_TOUCH - 1.25, T_TOUCH));
  const press = Math.sin(Math.PI * seg(t, T_TOUCH, T_TOUCH + .35)) * .018;   // follow-through: settles onto the head
  return lerp(-.34, 0, down) + hover + press;
}
function shotBless(t, tr) {
  const k = eio(seg(t, CUT, DUR));
  const c = cam(P.bless, lerp(U(470), U(395), k), lerp(U(205), U(130), k), lerp(1.24, 1.12, k));
  const o = { t, cam: c, grey: 0 };
  plate(P.bless, { ...o, ...tr });
  const nod = ss(seg(t, T_TOUCH - .3, T_TOUCH + 1.4)) * .05 + Math.sin((t - CUT) * 1.2) * .004;
  plate(P.jhead, { ...o, ...(tr.appear ? { appear: tr.appear - .12 } : {}), M: ROT(nod, JNECK[0], JNECK[1]), run: 0 });
  plate(P.hand, { ...o, ...(tr.appear ? { appear: tr.appear - .12 } : {}), M: ROT(handRot(t), ELBOW[0], ELBOW[1]), run: 0 });
  // the touch: warm paint bursts from under His palm
  if (t > T_TOUCH - .03) {
    const kk = seg(t, T_TOUCH - .03, T_TOUCH + 1.5);
    for (let i = 0; i < 36; i++) {
      const an = -Math.PI * (.05 + .9 * hash(i * 1.3)), d = eo(kk) * (40 + hash(i * 2.7) * 260);
      dyn.push({ x: TOUCH[0] + Math.cos(an) * d, y: TOUCH[1] + Math.sin(an) * d * .8, ang: an, len: 20 + hash(i) * 26, wid: 10 + hash(i * 5) * 10, c: hex('#fff2c4'), c2: hex('#f6c860'), type: KNIFE, seed: 900 + i, alpha: (1 - kk) * .8, hgt: .9 });
    }
  }
  for (let i = 0; i < 26; i++) {
    const h1 = hash(120 + i * 1.7), h2 = hash(120 + i * 3.1), tt = t - CUT;
    const x = U(200) + h1 * U(360) + Math.sin(tt * .6 + i) * 14, y = U(10) + ((h2 * U(230) - tt * 6 * (.5 + h1)) % U(230) + U(230)) % U(230);
    dyn.push({ x, y, ang: 0, len: 6 + h1 * 6, wid: 5 + h2 * 4, c: hex('#fff0c0'), type: DAB, seed: 120 + i, alpha: .3 + .3 * Math.sin(tt * 1.3 + i) ** 2, hgt: .6 });
  }
  flush({ t, cam: c, grey: 0, run: .3 });
}

function frame(t) {
  E.begin();
  const post = { expo: 1.02, sat: 1, contrast: 1.05, vig: .32, spec: .26, shin: 26, lift: [.015, .015, .025] };
  if (t < CUT) { shotDoor(t, {}); post.expo *= lerp(.35, 1.02, ss(seg(t, 0, 1.1))); }
  else {
    if (t < CUT + XF + .2) shotDoor(t, {});
    shotBless(t, t < CUT + XF + .2 ? { appear: CUT } : {});
    if (t > T_TOUCH) { const k = ss(seg(t, T_TOUCH, T_TOUCH + 2)); post.light = [lerp(-.95, -.55, k), lerp(-.2, -.6, k), lerp(.22, .7, k)]; post.norm = lerp(7, 3.4, k); post.expo = lerp(1.14, 1.03, k); post.lightCol = [1, .92, .78]; }
  }
  E.finish(post);
}
