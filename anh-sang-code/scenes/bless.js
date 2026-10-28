// Scene: the blessing. He stands in profile (facing right), head bowed, a gold halo behind Him;
// His right hand comes down on the bowed head of the man (bottom right). Set units 2112 x 1188.
import { Ref, paintRef } from '../engine/plate.js';
import { KNIFE, BRUSH, DAB, hex, shade, mixc } from '../engine/impasto.js';
import { P, E, lin, rad, lerp, clamp, hash } from './common.js';
import { J } from './corridor.js';

export const BW = 2112, BH = 1188;
export const HALO = [930, 400, 330];
export const BNECK = [846, 560];                 // head pivot
export const BSHOULDER = [1030, 650];            // right shoulder (arm root)
export const HEAD_TOP = [1450, 772];             // the man's crown, where the palm lands

export function drawBlessSet(R) {
  // cool grey-blue wall in broad knife planes
  R.fill(P([[0, 0], [BW, 0], [BW, BH], [0, BH]]), lin(0, 0, BW, BH, [[0, '#3e4658'], [.45, '#5c667a'], [1, '#424a5c']]), { dir: -20, fallback: -20, group: 'wall', maxR: 46, aj: .5, jit: .1 });
  R.tint(E(1600, 300, 420, 260), 'rgba(140,150,170,.35)');
  // the halo: a disc of thick gold light, its edge laid in a ring
  const [hx, hy, hr] = HALO;
  R.fill(E(hx, hy, hr, hr), rad(hx, hy, 30, hr, [[0, '#fff4cc'], [.55, '#f6d488'], [.9, '#e8b45c'], [1, '#d09444']]), { dir: { radial: [hx, hy], off: 90 }, group: 'halo', maxR: 22, jit: .05 });
  R.tint(E(hx, hy, hr * .5, hr * .5), 'rgba(255,250,230,.4)');
}
export function drawBlessBody(R) {
  // robe: shoulders and chest, turned toward the man
  R.fill(c => { c.moveTo(340, BH); c.bezierCurveTo(360, 900, 420, 700, 560, 620); c.lineTo(770, 572); c.bezierCurveTo(820, 566, 860, 570, 900, 582); c.bezierCurveTo(1010, 606, 1090, 690, 1110, 800); c.lineTo(1150, BH); c.closePath(); },
    lin(340, 0, 1150, 0, [[0, '#b0a088'], [.35, J.robe], [.7, '#fbf2dc'], [1, '#d8caa8']]), { dir: 80, fallback: 80, group: 'robe', maxR: 22, aj: .35 });
  for (const [x0, y0, x1, y1, a] of [[620, 760, 560, 1188, .3], [760, 700, 760, 1188, .25], [920, 700, 980, 1188, .22]]) R.tint(c => { c.moveTo(x0, y0); c.lineTo(x0 + 18, y0); c.lineTo(x1 + 30, y1); c.lineTo(x1, y1); c.closePath(); }, `rgba(150,128,96,${a})`);
  R.fill(c => { c.moveTo(860, 584); c.lineTo(930, 600); c.lineTo(880, 680); c.closePath(); }, '#8a7258', { dir: 90, group: 'neckline', maxR: 6 });
  // the red mantle over His right shoulder, falling down His back
  R.fill(c => { c.moveTo(790, 560); c.bezierCurveTo(650, 556, 520, 600, 450, 680); c.bezierCurveTo(380, 780, 320, 980, 290, BH); c.lineTo(480, BH); c.bezierCurveTo(490, 1000, 530, 820, 610, 720); c.bezierCurveTo(670, 650, 740, 616, 820, 606); c.closePath(); },
    lin(300, 1000, 800, 580, [[0, J.redD], [.5, J.red], [1, J.redL]]), { dir: 65, fallback: 65, group: 'mantle', maxR: 14, aj: .3 });
  R.fill(c => { c.moveTo(560, 640); c.bezierCurveTo(480, 720, 420, 860, 392, 1000); c.lineTo(410, 1004); c.bezierCurveTo(440, 870, 500, 730, 580, 650); c.closePath(); }, J.redL, { dir: 65, group: 'mantleHl', maxR: 4 });
}
export function drawBlessHead(R) {
  // hair: long, dark brown, falling to the shoulders behind the face
  R.fill(c => { c.moveTo(930, 200); c.bezierCurveTo(860, 160, 760, 190, 730, 270); c.bezierCurveTo(700, 360, 705, 470, 690, 586); c.lineTo(830, 604); c.bezierCurveTo(850, 520, 885, 460, 902, 400); c.bezierCurveTo(916, 330, 926, 262, 952, 230); c.closePath(); },
    lin(700, 200, 950, 560, [[0, J.hairD], [.5, J.hair], [1, '#5a3622']]), { dir: 70, fallback: 70, group: 'hair', maxR: 9, aj: .5 });
  // face in profile, bowed: forehead, brow, nose, lips; lit warm from the halo side
  R.fill(c => { c.moveTo(930, 214); c.bezierCurveTo(966, 224, 986, 258, 990, 294); c.lineTo(982, 306); c.bezierCurveTo(994, 322, 1016, 340, 1032, 358); c.lineTo(1013, 367); c.bezierCurveTo(1011, 376, 1007, 383, 1001, 389); c.lineTo(986, 422); c.bezierCurveTo(950, 442, 920, 424, 900, 392); c.bezierCurveTo(904, 320, 914, 252, 930, 214); c.closePath(); },
    lin(900, 0, 1030, 0, [[0, '#7e5038'], [.45, J.skin], [1, '#dca682']]), { dir: 'edge', fallback: 80, group: 'face', maxR: 5, detail: .55 });
  R.tint(E(950, 330, 26, 40, .2), 'rgba(110,64,44,.45)');           // cheek shadow
  R.tint(E(1004, 330, 9, 22, -.6), 'rgba(250,210,170,.55)');        // lit ridge of the nose
  // beard and moustache: full, dark brown, longer at the chin
  R.fill(c => { c.moveTo(1002, 384); c.bezierCurveTo(1004, 422, 992, 472, 962, 506); c.bezierCurveTo(932, 532, 896, 522, 880, 490); c.bezierCurveTo(870, 450, 884, 410, 904, 392); c.bezierCurveTo(930, 410, 966, 410, 986, 396); c.closePath(); }, lin(880, 380, 1000, 520, [[0, J.hairD], [1, J.beard]]), { dir: 95, fallback: 95, group: 'beard', maxR: 5, aj: .5 });
  R.fill(c => { c.moveTo(1013, 366); c.bezierCurveTo(1004, 372, 994, 376, 984, 378); c.lineTo(990, 388); c.bezierCurveTo(1000, 386, 1008, 380, 1012, 374); c.closePath(); }, J.hairD, { dir: 10, group: 'moust', maxR: 2 });
  // strands catching the halo light, and waves down the back
  for (const [k, x0, y0, dx, w] of [[0, 900, 196, -36, 2.4], [1, 852, 196, -22, 2], [2, 800, 226, -48, 2.6], [3, 770, 300, -30, 2], [4, 880, 230, -12, 1.8]]) R.line(c => { c.moveTo(x0, y0); c.bezierCurveTo(x0 - 30, y0 + 90, x0 + dx, y0 + 200, x0 + dx * 1.6, 570 - k * 6); }, k % 2 ? '#5a3824' : '#684228', w, { dir: 'edge', group: 'strand' + k, maxR: 1.6 });
  R.tint(E(990, 340, 16, 26, .1), 'rgba(70,40,30,.35)');                // eye socket
  R.tint(E(960, 365, 22, 12, .3), 'rgba(240,190,150,.4)');              // cheekbone
  // a lock of hair falling forward over the temple
  R.fill(c => { c.moveTo(934, 206); c.bezierCurveTo(912, 250, 902, 320, 908, 400); c.lineTo(892, 404); c.bezierCurveTo(884, 320, 896, 240, 920, 200); c.closePath(); }, J.hair, { dir: 95, group: 'lock', maxR: 3 });
}
export function drawBlessMan(R) {
  // his back and shoulders (dark suit), bowed head seen from above
  R.fill(c => { c.moveTo(1180, BH); c.bezierCurveTo(1250, 1060, 1400, 990, 1580, 980); c.bezierCurveTo(1740, 960, 1940, 990, BW, 1040); c.lineTo(BW, BH); c.closePath(); }, lin(1180, 980, 2112, 1188, [[0, '#3a4050'], [.4, '#262a34'], [1, '#16181e']]), { dir: 10, fallback: 10, group: 'suit', maxR: 18 });
  R.fill(P([[1540, 1000], [1660, 990], [1640, 1060], [1530, 1060]]), '#6a4432', { dir: 0, group: 'mneck', maxR: 6 });
  // face turned down: we see cheek, jaw and the tip of the nose under the hair
  R.fill(c => { c.ellipse(1575, 985, 108, 76, .35, 0, 7); }, lin(1460, 940, 1660, 1060, [[0, '#d09a72'], [.6, '#a87050'], [1, '#5e3c2c']]), { dir: 'edge', fallback: 25, group: 'mface', maxR: 6, detail: .7 });
  R.fill(c => { c.moveTo(1640, 1030); c.bezierCurveTo(1650, 1050, 1640, 1066, 1620, 1068); c.lineTo(1616, 1050); c.closePath(); }, '#b07a58', { dir: 60, group: 'mnose', maxR: 3 });
  R.fill(c => { c.moveTo(1520, 1050); c.bezierCurveTo(1560, 1080, 1610, 1084, 1640, 1070); c.lineTo(1630, 1052); c.bezierCurveTo(1600, 1062, 1560, 1056, 1530, 1036); c.closePath(); }, '#2a2226', { dir: 10, group: 'mbeard', maxR: 4 });
  R.fill(E(1492, 968, 18, 28, .35), '#a06c50', { maxR: 4, group: 'mear' });
  R.tint(E(1494, 970, 8, 14, .35), 'rgba(80,40,30,.5)');
  R.fill(c => { c.moveTo(1290, 900); c.bezierCurveTo(1290, 790, 1420, 744, 1520, 758); c.bezierCurveTo(1600, 770, 1640, 820, 1630, 880); c.bezierCurveTo(1590, 890, 1550, 900, 1520, 930); c.bezierCurveTo(1490, 960, 1470, 990, 1450, 1005); c.bezierCurveTo(1370, 995, 1300, 960, 1290, 900); c.closePath(); },
    lin(1300, 760, 1680, 1000, [[0, '#423a3e'], [.35, '#1e1a1e'], [1, '#0c0a0e']]), { dir: { radial: [1480, 900], off: 90 }, group: 'mhair', maxR: 8, aj: .6 });
  R.tint(E(1440, 820, 90, 40, -.3), 'rgba(110,100,110,.35)');          // sheen on the crown
}
// His right arm, procedural (two-bone IK) from the shoulder to the hand; hand = palm centre, ha = hand angle
export function blessArm(out, hand, ha, { seed = 1, curl = 0 } = {}) {
  const [sx, sy] = BSHOULDER, l1 = 228, l2 = 222;
  const dx = hand[0] - sx, dy = hand[1] - sy, d = Math.min(Math.hypot(dx, dy), l1 + l2 - 1);
  const a = Math.atan2(dy, dx), cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), e = a + Math.acos(clamp(cosA, -1, 1));             // elbow hangs below the line
  const el = [sx + Math.cos(e) * l1, sy + Math.sin(e) * l1];
  const wr = [hand[0] - Math.cos(ha) * 46, hand[1] - Math.sin(ha) * 46];
  const R0 = hex(J.robe), RS = hex('#c8b898'), RL = hex('#fffaec'), SK = hex(J.skin), SKL = hex('#e2ae88'), SKD = hex(J.skinD);
  const seg = (p, q, w, c, c2, sd, taper = 0, bend = 0) => out.push({ x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, ang: Math.atan2(q[1] - p[1], q[0] - p[0]), len: Math.hypot(q[0] - p[0], q[1] - p[1]) * 1.1, wid: w, c, c2, seed: sd, type: KNIFE, taper, bend, hgt: 1.05 });
  // wide sleeve: body, shade below, lit top edge; the cuff hangs open at the wrist
  // the sleeve is laid as several parallel knife planes along each bone (lit top, body, shaded underside)
  const lane = (p, q, n, w, cols, sd, off0) => { const ang = Math.atan2(q[1] - p[1], q[0] - p[0]), nx = -Math.sin(ang), ny = Math.cos(ang);
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * w * .62 + off0; const k2 = .5; for (let j = 0; j < 2; j++) { const a0 = j / 2, a1 = (j + 1) / 2;
      const A = [lerp(p[0], q[0], a0) + nx * o, lerp(p[1], q[1], a0) + ny * o], B = [lerp(p[0], q[0], a1) + nx * o, lerp(p[1], q[1], a1) + ny * o];
      out.push({ x: (A[0] + B[0]) / 2, y: (A[1] + B[1]) / 2, ang, len: Math.hypot(B[0] - A[0], B[1] - A[1]) * 1.35, wid: w, c: cols[i], c2: cols[Math.min(cols.length - 1, i + 1)], seed: sd + i * 3 + j, type: KNIFE, skew: (hash(sd + i + j) - .5) * .6, hgt: 1.05 }); } } };
  lane([sx - 30, sy - 20], el, 5, 40, [RL, R0, R0, RS, shade(RS, .8)], seed, 0);
  lane(el, wr, 5, 36, [RL, R0, R0, RS, shade(RS, .8)], seed + 20, 6);
  // open cuff hanging below the wrist
  out.push({ x: wr[0] - 6, y: wr[1] + 34, ang: ha + Math.PI / 2 - .3, len: 120, wid: 40, c: R0, c2: RS, seed: seed + 6, type: KNIFE, taper: .5, hgt: 1.1 });
  // hand: palm, four fingers following the curve of the head, thumb
  const ca = Math.cos(ha), sa = Math.sin(ha), at = (u, v) => [hand[0] + ca * u - sa * v, hand[1] + sa * u + ca * v];
  const pc = at(0, 0); out.push({ x: pc[0], y: pc[1], ang: ha, len: 110, wid: 80, c: SK, c2: SKL, seed: seed + 10, type: DAB, hgt: 1 });
  out.push({ x: at(-10, -18)[0], y: at(-10, -18)[1], ang: ha, len: 80, wid: 26, c: SKL, c2: SK, seed: seed + 9, type: KNIFE, hgt: 1.05 });
  for (let k = 0; k < 4; k++) {
    const v = -27 + k * 18, bend = .2 + curl * .4, p0 = at(42, v), dirA = ha + bend * .9 + k * .05, L = 78 - Math.abs(k - 1.3) * 9;
    out.push({ x: p0[0] + Math.cos(dirA) * L / 2, y: p0[1] + Math.sin(dirA) * L / 2, ang: dirA, len: L, wid: 19, c: k % 2 ? SK : SKL, c2: SKD, seed: seed + 11 + k, type: KNIFE, taper: -.3, bend: .18, hgt: 1.05 });
    out.push({ x: p0[0] + Math.cos(dirA) * L * .95, y: p0[1] + Math.sin(dirA) * L * .95, ang: dirA, len: 14, wid: 15, c: SKD, seed: seed + 50 + k, type: DAB, alpha: .5, hgt: .9 });
  }
  const tb = at(8, -44), tA = ha - .65; out.push({ x: tb[0] + Math.cos(tA) * 28, y: tb[1] + Math.sin(tA) * 28, ang: tA, len: 60, wid: 21, c: SKL, c2: SK, seed: seed + 16, type: KNIFE, taper: -.3, hgt: 1 });
  return { el, wr };
}
// eye: closed lid (profile) in set units
export function blessEye(out, { lid = 1, seed = 1 } = {}) {
  out.push({ x: 973, y: 314, ang: .5, len: 22, wid: lerp(7, 3, lid), c: hex('#2a1810'), seed, type: KNIFE, hgt: .6 });
  out.push({ x: 970, y: 296, ang: .25, len: 30, wid: 6, c: hex(J.hairD), seed: seed + 1, type: KNIFE, hgt: .7 });
}

const paint = (R, R0, seed) => paintRef(R, { R: R0, T: 12, seed });
export function buildBless() {
  const set = new Ref(BW, BH, .5); drawBlessSet(set);
  const body = new Ref(BW, BH, .55); drawBlessBody(body);
  const head = new Ref(BW, BH, .9); drawBlessHead(head);
  const man = new Ref(BW, BH, .6); drawBlessMan(man);
  return {
    set: { ref: set, strokes: paint(set, [46, 23, 12, 6, 3], 11) },
    body: { ref: body, strokes: paint(body, [26, 13, 7, 3.5, 2], 12) },
    head: { ref: head, strokes: paint(head, [12, 6, 3, 1.8], 13) },
    man: { ref: man, strokes: paint(man, [20, 10, 5, 2.6], 14) },
  };
}
