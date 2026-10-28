// "Ánh Sáng Của Ngài" — everything drawn in code (no images). Acting test: two scenes.
// 0-7 s   corridor: He walks out of the light toward us; the man flinches, then lifts his head.
// 7-13 s  blessing: His hand hovers, comes down on the man's head on the beat; He bows His head, eyes closed.
import { Impasto, Strokes, hex, KNIFE, DAB } from './engine/impasto.js';
import { buildCorridor, CW, CH, DOOR, MAN, jesusLive, jesusEyes } from './scenes/corridor.js';
import { buildBless, BW, BH, BNECK, HEAD_TOP, HALO, blessArm, blessEye } from './scenes/bless.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from './scenes/common.js';

const W = 1920, H = 1080, NEVER = 1e6, BEAT = 60 / 96, XF = .55;
export const DUR = 13, CUT = 7;
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const TR = (x, y) => [1, 0, 0, 1, x, y], SC = s => [s, 0, 0, s, 0, 0];
const ROT = (a, px, py) => { const c = Math.cos(a), s = Math.sin(a); return mul(TR(px, py), mul([c, s, -s, c, 0, 0], TR(-px, -py))); };

let E, P = {}, dyn;
export async function setup(canvas) {
  E = new Impasto(canvas, { ss: +(new URLSearchParams(location.search).get('ss') || 1) }); dyn = new Strokes(8192);
  const up = (built, w, h) => {
    const ox = built.ox || 0, oy = built.oy || 0, a = built.strokes.a;
    if (ox || oy) for (let i = 0; i < built.strokes.n; i++) { a[i * 20] -= ox; a[i * 20 + 1] -= oy; }
    return { b: E.batch(built.strokes.data()), tex: E.texture(built.ref.ctx.canvas), w: built.ref.w, h: built.ref.h, ox, oy };
  };
  const c = buildCorridor();
  P.cSet = up(c.set); P.mBody = up(c.manBody); P.mHead = up(c.manHead); P.jBody = up(c.jBody); P.jHead = up(c.jHead);
  const b = buildBless();
  P.bSet = up(b.set); P.bBody = up(b.body); P.bHead = up(b.head); P.bMan = up(b.man);
  // static sets are painted once and sampled by the camera
  const bake = (pl, scale, o) => E.bake(pl.w, pl.h, scale * E.ss / 2, cm => { E.under(pl.tex, pl.w, pl.h, { cam: cm, ...o }); E.draw(pl.b, { cam: cm, appear: -1e6, ...o }); });
  P.cSet.bk = bake(P.cSet, 2.4, { t: 0, grey: 0 });
  P.bSet.bk = bake(P.bSet, 2.4, { t: 0, grey: 0 });
  window.DUR = +(new URLSearchParams(location.search).get('dur') || DUR);
  return frame;
}

const cam = (w, h, x, y, zoom) => { const hw = W / 2 / zoom, hh = H / 2 / zoom; return { x: clamp(x, hw + 2, w - hw - 2), y: clamp(y, hh + 2, h - hh - 2), zoom }; };
function plate(pl, o) {
  const M = o.M || [1, 0, 0, 1, 0, 0], inTrans = o.appear !== undefined && o.t < o.appear + XF + .2;
  if (!inTrans && pl.bk && !o.M) { E.blit(pl.bk, { cam: o.cam }); return; }
  const ua = o.appear === undefined ? 1 : seg(o.t, o.appear + XF * .5, o.appear + XF);
  if (ua > 0 && !o.noUnder) E.under(pl.tex, pl.w, pl.h, { ...o, M: mul(M, TR(-pl.ox, -pl.oy)), alpha: ua });
  E.draw(pl.b, { ...o, M, appear: inTrans ? o.appear : -1e6, appDur: .14 });
}
const flush = o => { if (dyn.n) E.drawNow(dyn.data(), o); dyn.clear(); };

// ---------------- 1 · corridor
function walk(t) {
  const w = eio(seg(t, 1.0, 5.4)), mv = seg(t, .8, 1.3) * (1 - seg(t, 4.9, 5.5));
  const ph = (t - 1.0) / BEAT * Math.PI;                               // one step per beat
  const s = lerp(1.0, 1.42, w);
  return { w, mv, ph, s, x: DOOR.x - 60 * w + Math.sin(ph) * 5 * mv, y: DOOR.bot + 135 * w - Math.abs(Math.sin(ph)) * 7 * mv, rot: Math.sin(ph) * .016 * mv };
}
function headLift(t) {
  const dip = ss(seg(t, 3.4, 3.85)) * (1 - ss(seg(t, 3.85, 4.2)));    // a small flinch first
  return .05 * dip - .42 * back(seg(t, 3.95, 5.3), 1.3);              // then up toward the light, overshoot, settle
}
function shotCorridor(t, tr) {
  const k = ss(seg(t, 0, CUT));
  const c = cam(CW, CH, lerp(1060, 1120, k), lerp(600, 570, k), lerp(.95, 1.06, k));
  const o = { t, cam: c, grey: 0 };
  plate(P.cSet, { ...o, ...tr });
  const wk = walk(t), M = mul(TR(wk.x, wk.y), mul(SC(wk.s), ROT(wk.rot, 0, 0)));
  // light pooled on the wet floor under Him, broken into horizontal dabs
  for (let i = 0; i < 60; i++) {
    const h1 = hash(i * 2.3), h2 = hash(i * 4.1), y = wk.y + 8 + h2 * 260, spread = 60 * wk.s + (y - wk.y) * .8;
    dyn.push({ x: wk.x + (h1 - .5) * 2 * spread, y, ang: (hash(i * 9) - .5) * .1, len: 40 + h1 * 60, wid: 9 + h2 * 8, c: hex(h1 > .5 ? '#f6dca0' : '#e8b868'), c2: hex('#fff0c8'), type: KNIFE, seed: 400 + i, alpha: (.2 + .3 * (.5 + .5 * Math.sin(t * 2.2 + i * 1.9))) * clamp(1 - (y - wk.y) / 280), hgt: .7 });
  }
  flush({ t, cam: c, grey: 0, run: .3 });
  // a faint halo behind His head
  const hd = [wk.x, wk.y - 440 * wk.s];
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, r = 46 * wk.s; dyn.push({ x: hd[0] + Math.cos(a) * r, y: hd[1] + Math.sin(a) * r, ang: a + Math.PI / 2, len: 14 * wk.s, wid: 6 * wk.s, c: hex('#fff2c8'), type: KNIFE, seed: 300 + i, alpha: .45, hgt: .5 }); }
  flush({ t, cam: c, grey: 0 });
  plate(P.jBody, { ...o, M, run: 0, noUnder: true });
  jesusLive(dyn, { ph: wk.ph, mv: wk.mv, t, seed: 50 }); flush({ t, cam: c, grey: 0, run: 0, M });
  const MH = mul(M, ROT(Math.sin(wk.ph) * .02 * wk.mv, 0, -404));
  plate(P.jHead, { ...o, M: MH, run: 0, noUnder: true });
  jesusEyes(dyn, { lid: .35, seed: 70 }); flush({ t, cam: c, grey: 0, run: 0, M: MH });
  // the man
  const breath = Math.sin(t * 1.6) * .006;
  const MB = ROT(breath, 420, 880);
  plate(P.mBody, { ...o, M: MB, run: 0, noUnder: true });
  plate(P.mHead, { ...o, M: mul(MB, ROT(headLift(t), MAN.neck[0], MAN.neck[1])), run: 0, noUnder: true });
}

// ---------------- 2 · the blessing
const T_TOUCH = CUT + 4 * BEAT;
function handPose(t) {
  const down = eio(seg(t, T_TOUCH - 1.3, T_TOUCH)), hover = Math.sin((t - CUT) * 3.1) * 6 * (1 - down);
  const press = Math.sin(Math.PI * seg(t, T_TOUCH, T_TOUCH + .35)) * 8;
  const raised = [1360, 640], rest = [HEAD_TOP[0] - 20, HEAD_TOP[1] + 10];
  return { p: [lerp(raised[0], rest[0], down), lerp(raised[1], rest[1], down) + hover + press], a: lerp(-.15, .32, down), curl: down };
}
function shotBless(t, tr) {
  const k = eio(seg(t, CUT, DUR));
  const c = cam(BW, BH, lerp(1180, 1010, k), lerp(760, 560, k), lerp(1.12, 1.04, k));
  const o = { t, cam: c, grey: 0 };
  plate(P.bSet, { ...o, ...tr });
  // the halo breathes; after the touch it swells
  const glow = .3 + .25 * Math.sin((t - CUT) * Math.PI / (2 * BEAT)) ** 2 + .4 * Math.exp(-Math.max(0, t - T_TOUCH) * 1.2) * (t > T_TOUCH);
  for (let i = 0; i < 70; i++) { const a = i / 70 * Math.PI * 2, r = HALO[2] - 8 + hash(i) * 14; dyn.push({ x: HALO[0] + Math.cos(a) * r, y: HALO[1] + Math.sin(a) * r, ang: a + Math.PI / 2, len: 40, wid: 16, c: hex('#ffe9a8'), c2: hex('#fff6d8'), type: KNIFE, seed: 800 + i, alpha: glow, hgt: .6 }); }
  flush({ t, cam: c, grey: 0 });
  plate(P.bMan, { ...o, ...tr, run: 0 });
  plate(P.bBody, { ...o, ...tr, run: 0 });
  const nod = ss(seg(t, T_TOUCH - .4, T_TOUCH + 1.4)) * .06 + Math.sin((t - CUT) * 1.2) * .004;
  const MH = ROT(nod, BNECK[0], BNECK[1]);
  plate(P.bHead, { ...o, ...(tr.appear ? { appear: tr.appear - .1 } : {}), M: MH, run: 0 });
  if (!(tr.appear && t < tr.appear + XF)) {
    blessEye(dyn, { lid: lerp(.6, 1, ss(seg(t, T_TOUCH - .3, T_TOUCH + .4))), seed: 90 }); flush({ t, cam: c, grey: 0, run: 0, M: MH });
    const hp = handPose(t); blessArm(dyn, hp.p, hp.a, { seed: 100, curl: hp.curl }); flush({ t, cam: c, grey: 0, run: 0 });
  }
  if (t > T_TOUCH - .03) {
    const kk = seg(t, T_TOUCH - .03, T_TOUCH + 1.5);
    for (let i = 0; i < 36; i++) {
      const an = -Math.PI * (.05 + .9 * hash(i * 1.3)), d = eo(kk) * (40 + hash(i * 2.7) * 280);
      dyn.push({ x: HEAD_TOP[0] + Math.cos(an) * d, y: HEAD_TOP[1] - 20 + Math.sin(an) * d * .8, ang: an, len: 22 + hash(i) * 26, wid: 10 + hash(i * 5) * 10, c: hex('#fff2c4'), c2: hex('#f6c860'), type: KNIFE, seed: 900 + i, alpha: (1 - kk) * .8, hgt: .9 });
    }
    flush({ t, cam: c, grey: 0, run: .3 });
  }
}

function frame(t) {
  E.begin();
  const post = { expo: 1.02, sat: 1, contrast: 1.05, vig: .32, spec: .24, shin: 26, lift: [.015, .015, .025] };
  if (t < CUT) { shotCorridor(t, {}); post.expo *= lerp(.35, 1.02, ss(seg(t, 0, 1.1))); }
  else {
    if (t < CUT + XF + .2) shotCorridor(t, {});
    shotBless(t, t < CUT + XF + .2 ? { appear: CUT } : {});
    if (t > T_TOUCH) { const k = ss(seg(t, T_TOUCH, T_TOUCH + 2)); post.light = [lerp(-.95, -.55, k), lerp(-.2, -.6, k), lerp(.22, .7, k)]; post.norm = lerp(7, 3.4, k); post.expo = lerp(1.14, 1.03, k); post.lightCol = [1, .92, .78]; }
  }
  E.finish(post);
}
