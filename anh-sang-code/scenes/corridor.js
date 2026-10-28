// Scene: the dark corridor. A man sits hunched on a stone ledge; far away an arched door is full of light,
// and He stands in it. Set units: 2112 x 1188 (camera zoom >= .91). Floor line y = 770.
import { Ref, paintRef } from '../engine/plate.js';
import { KNIFE, BRUSH, DAB, LINE, hex, shade, mixc } from '../engine/impasto.js';
import { P, E, lin, rad, lerp, clamp, hash } from './common.js';

export const CW = 2112, CH = 1188, FLOOR = 770;
export const DOOR = { x: 1300, top: 215, bot: 770, hw: 128 };        // opening: centre x, arch top, sill, half width

const arch = (x, top, bot, hw) => c => { c.moveTo(x - hw, bot); c.lineTo(x - hw, top + hw); c.arc(x, top + hw, hw, Math.PI, 0); c.lineTo(x + hw, bot); c.closePath(); };

export function drawSet(R) {
  const c = R.ctx;
  // back wall: cold blue-grey planes, darker toward the edges
  R.fill(P([[0, 0], [CW, 0], [CW, FLOOR + 10], [0, FLOOR + 10]]), lin(0, 0, CW, 0, [[0, '#1e232c'], [.35, '#343c4a'], [.62, '#3e4656'], [1, '#232832']]), { dir: 90, fallback: 90, group: 'wall', maxR: 46, aj: .35, jit: .08 });
  // the door's glow on the wall around it (warm, falling off fast)
  R.tint(P([[900, 0], [1700, 0], [1700, FLOOR], [900, FLOOR]]), rad(DOOR.x, 470, 60, 520, [[0, 'rgba(250,214,140,.85)'], [.45, 'rgba(200,150,90,.35)'], [1, 'rgba(60,60,80,0)']]));
  // stone frame of the arch, warm where the light hits it
  R.fill(arch(DOOR.x, DOOR.top - 70, FLOOR, DOOR.hw + 78), rad(DOOR.x, 470, 80, 420, [[0, '#e8c88c'], [.5, '#a88660'], [1, '#4a4440']]), { dir: { radial: [DOOR.x, 400], off: 90 }, group: 'frame', maxR: 18 });
  // the opening: white-gold light, hottest in the middle
  R.fill(arch(DOOR.x, DOOR.top, FLOOR, DOOR.hw), rad(DOOR.x, 470, 20, 330, [[0, '#fffbea'], [.45, '#fbe7b0'], [.8, '#f0c878'], [1, '#d8a050']]), { dir: { radial: [DOOR.x, 470], off: 90 }, group: 'door', maxR: 22, jit: .05 });
  // pillars: two near the door, the big near ones at the frame edges (cool, lit edge toward the door)
  const pillar = (x0, x1, top, col, lit, g, litLeft) => {
    R.fill(P([[x0, top], [x1, top], [x1, FLOOR + 8], [x0, FLOOR + 8]]), lin(x0, 0, x1, 0, litLeft ? [[0, lit], [.25, col], [1, shade0(col)]] : [[0, shade0(col)], [.75, col], [1, lit]]), { dir: 90, fallback: 90, group: g, maxR: 24, aj: .3 });
  };
  const shade0 = h => '#1a1e26';
  pillar(1000, 1100, 0, '#3a4252', '#8a7c6c', 'pl1', false);
  pillar(1500, 1600, 0, '#3a4252', '#8a7c6c', 'pl2', true);
  pillar(0, 170, 0, '#20242c', '#3e4656', 'pl3', false);
  pillar(1880, 2112, 0, '#20242c', '#3a4250', 'pl4', true);
  // floor: wet stone, pale where it mirrors the door
  R.fill(P([[0, FLOOR], [CW, FLOOR], [CW, CH], [0, CH]]), lin(0, FLOOR, 0, CH, [[0, '#4a5262'], [.4, '#363d4a'], [1, '#22262e']]), { dir: 0, fallback: 0, group: 'floor', maxR: 30, aj: .25, jit: .1 });
  { c.save(); c.filter = 'blur(34px)'; c.globalCompositeOperation = 'source-atop'; c.beginPath(); P([[DOOR.x - 150, FLOOR], [DOOR.x + 150, FLOOR], [DOOR.x + 330, CH], [DOOR.x - 360, CH]])(c);
    c.fillStyle = lin(0, FLOOR, 0, CH, [[0, 'rgba(255,230,170,.95)'], [.4, 'rgba(230,180,110,.55)'], [1, 'rgba(120,110,120,.15)']])(c); c.fill(); c.restore(); }
  for (let k = 0; k < 6; k++) { const y = FLOOR + 40 + k * k * 15; R.tint(P([[0, y], [CW, y], [CW, y + 3 + k], [0, y + 3 + k]]), 'rgba(20,22,30,.5)'); }
  // the ledge he sits on
  R.fill(P([[230, 865], [790, 865], [800, 1010], [220, 1010]]), lin(0, 865, 0, 1010, [[0, '#4e5664'], [.15, '#3a414e'], [1, '#262a34']]), { dir: 0, fallback: 0, group: 'ledge', maxR: 16 });
  R.fill(P([[230, 860], [790, 860], [792, 874], [228, 874]]), '#68707e', { dir: 0, group: 'ledgeTop', maxR: 5 });
}

// ---------------- the man: seated, side view facing right, hunched, hands clasped; two plates (body, head)
export const MAN = { neck: [552, 612], suit: '#262a34', suit2: '#363c4a', suitD: '#16181e', skin: '#b07a5c', skinD: '#6e4a3a', hair: '#17141a' };
export function drawManBody(R) {
  const S = MAN;
  // thigh, from hip to knee (raised: feet are below the ledge front)
  R.fill(P([[420, 815], [700, 770], [726, 836], [436, 890]]), lin(0, 770, 0, 890, [[0, S.suit2], [1, S.suitD]]), { dir: -10, fallback: -10, group: 'thigh', maxR: 12 });
  // shin + shoe
  R.fill(P([[668, 806], [730, 800], [742, 1000], [690, 1006]]), lin(668, 0, 742, 0, [[0, S.suit], [1, S.suitD]]), { dir: 88, fallback: 88, group: 'shin', maxR: 10 });
  R.fill(E(742, 1012, 62, 21, .05), '#121014', { maxR: 7, group: 'shoe' });
  R.fill(E(722, 1000, 34, 8, 0), '#3a3a44', { maxR: 3, group: 'shoeHl' });
  // torso: rounded, hunched back lit by the cold room; chest folded over the thighs
  R.fill(c => { c.moveTo(392, 880); c.bezierCurveTo(378, 780, 400, 680, 450, 628); c.bezierCurveTo(488, 592, 540, 588, 580, 606); c.bezierCurveTo(612, 640, 622, 700, 600, 770); c.bezierCurveTo(580, 830, 520, 870, 470, 884); c.closePath(); },
    lin(390, 0, 620, 0, [[0, '#4c5464'], [.25, S.suit2], [.7, S.suit], [1, S.suitD]]), { dir: 70, fallback: 70, group: 'torso', maxR: 16 });
  // collar / shirt line at the neck
  R.fill(P([[536, 604], [574, 608], [568, 626], [540, 622]]), '#c8c4c0', { dir: 0, group: 'collar', maxR: 3 });
  // upper arm: shoulder down to the elbow on the knee
  R.fill(c => { c.moveTo(508, 620); c.bezierCurveTo(560, 640, 610, 700, 646, 768); c.lineTo(612, 790); c.bezierCurveTo(580, 730, 530, 680, 486, 662); c.closePath(); }, lin(490, 620, 640, 790, [[0, S.suit2], [1, S.suit]]), { dir: 55, fallback: 55, group: 'uarm', maxR: 10 });
  // forearm: elbow up to the clasped hands in front of the face
  R.fill(c => { c.moveTo(614, 792); c.bezierCurveTo(640, 760, 668, 720, 690, 690); c.lineTo(722, 708); c.bezierCurveTo(700, 744, 676, 784, 652, 808); c.closePath(); }, lin(614, 0, 722, 0, [[0, S.suit], [1, S.suitD]]), { dir: -55, fallback: -55, group: 'farm', maxR: 9 });
  // clasped hands: knuckles toward us
  R.fill(c => { c.ellipse(708, 680, 34, 28, -.5, 0, 7); }, lin(680, 650, 740, 710, [[0, '#d09a74'], [1, S.skinD]]), { dir: 'edge', fallback: 30, group: 'hands', maxR: 6, detail: .6 });
  R.tint(E(722, 668, 16, 8, -.6), 'rgba(250,200,160,.6)');
  for (let k = 0; k < 3; k++) R.tint(E(692 + k * 11, 690 - k * 9, 5, 3, -.6), 'rgba(90,50,40,.6)');
}
export function drawManHead(R) {
  const S = MAN;
  R.fill(P([[536, 612], [570, 612], [588, 590], [548, 584]]), S.skinD, { dir: 60, group: 'neck', maxR: 5 });
  // head bowed: face turned down toward the hands
  R.fill(E(600, 566, 54, 62, .6), lin(560, 520, 650, 620, [[0, '#9a6c52'], [.6, S.skin], [1, S.skinD]]), { dir: 'edge', fallback: 60, group: 'face', maxR: 6, detail: .7 });
  // hair: dark mass over the crown and the back of the head
  R.fill(c => { c.moveTo(546, 566); c.bezierCurveTo(534, 516, 566, 490, 612, 496); c.bezierCurveTo(650, 504, 664, 534, 654, 566); c.bezierCurveTo(636, 552, 614, 550, 598, 560); c.bezierCurveTo(586, 578, 566, 592, 550, 598); c.closePath(); }, lin(540, 490, 660, 600, [[0, '#2e2a30'], [.4, S.hair], [1, '#0c0a0e']]), { dir: 30, fallback: 30, group: 'hair', maxR: 6 });
  // ear, brow shadow, nose, short beard along the jaw
  R.fill(E(590, 574, 10, 15, .4), '#8a5a44', { maxR: 3, group: 'ear' });
  R.fill(c => { c.moveTo(646, 586); c.bezierCurveTo(654, 596, 658, 608, 652, 616); c.lineTo(642, 612); c.closePath(); }, '#a87656', { dir: 60, group: 'nose', maxR: 2.5 });
  R.fill(c => { c.moveTo(594, 604); c.bezierCurveTo(606, 626, 632, 634, 650, 622); c.lineTo(644, 612); c.bezierCurveTo(628, 616, 612, 608, 604, 594); c.closePath(); }, '#2a2024', { dir: 20, group: 'beard', maxR: 3 });
  R.tint(E(630, 584, 16, 6, .7), 'rgba(40,24,24,.65)');
}

// ---------------- Jesus, frontal, walking out of the light. Local units: origin = between the feet on the ground, y up negative.
// Height ~470 at scale 1. Two plates: body (robe, mantle, left arm) and head (hair, face, beard; pivots at the neck).
export const J = { robe: '#efe4cc', robeS: '#bfae90', robeL: '#fff8e6', red: '#c8342a', redD: '#7e1c18', redL: '#e65a3c', skin: '#b07856', skinD: '#7a4c36', hair: '#3a2418', hairD: '#24160e', beard: '#45291a' };
export const JOX = 220, JOY = 540;                          // ref canvas origin offset (local -> ref)
const inJ = f => c => { c.save(); c.translate(JOX, JOY); f(c); c.restore(); };
export function drawJesusBody(R) {
  const L = (path, fill, props) => R.fill(inJ(path), fill, props);
  // robe: long, slightly flared; light comes from behind (rim) and a little from the corridor (front is softer)
  L(c => { c.moveTo(-34, -402); c.bezierCurveTo(-60, -400, -76, -388, -78, -360); c.bezierCurveTo(-84, -260, -92, -120, -96, -16); c.bezierCurveTo(-40, -6, 40, -6, 96, -16); c.bezierCurveTo(92, -120, 84, -260, 78, -360); c.bezierCurveTo(76, -388, 60, -400, 34, -402); c.closePath(); },
    lin(-96, 0, 96, 0, [[0, J.robeS], [.3, J.robe], [.6, '#e6d8bc'], [1, J.robeS]]), { dir: 90, fallback: 90, group: 'robe', maxR: 12, aj: .3 });
  // folds of the robe
  for (const [x0, x1, a] of [[-30, -44, .35], [18, 30, .3], [52, 66, .28]]) R.tint(inJ(c => { c.moveTo(x0, -300); c.lineTo(x0 + 6, -300); c.lineTo(x1 + 8, -22); c.lineTo(x1, -22); c.closePath(); }), `rgba(150,128,96,${a})`);
  // a cord at the waist
  L(P([[-60, -236], [62, -236], [60, -226], [-58, -226]]), '#a8865a', { dir: 0, group: 'cord', maxR: 3 });
  // the red mantle: over His right shoulder (screen left), falling to the knee and lifting away behind
  L(c => { c.moveTo(-10, -398); c.bezierCurveTo(-50, -404, -84, -390, -96, -350); c.bezierCurveTo(-118, -300, -150, -230, -168, -176); c.bezierCurveTo(-140, -168, -110, -150, -84, -128); c.bezierCurveTo(-60, -150, -44, -200, -34, -260); c.bezierCurveTo(-26, -320, -18, -370, -10, -398); c.closePath(); },
    lin(-168, -300, -20, -200, [[0, J.redD], [.45, J.red], [1, J.redL]]), { dir: 75, fallback: 75, group: 'mantle', maxR: 10, aj: .3 });
  L(c => { c.moveTo(-96, -350); c.bezierCurveTo(-112, -300, -136, -240, -150, -196); c.lineTo(-140, -192); c.bezierCurveTo(-124, -240, -104, -300, -88, -346); c.closePath(); }, J.redL, { dir: 70, group: 'mantleHl', maxR: 3 });
  // left forearm + open hand peeking from under the mantle
}
export function drawJesusHead(R) {
  const L = (path, fill, props) => R.fill(inJ(path), fill, props);
  L(P([[-12, -412], [12, -412], [14, -396], [-14, -396]]), J.skinD, { dir: 90, group: 'neck', maxR: 3 });
  // hair falling behind the shoulders (parted in the middle)
  L(c => { c.moveTo(0, -478); c.bezierCurveTo(-26, -478, -36, -462, -36, -440); c.bezierCurveTo(-37, -414, -44, -394, -54, -374); c.bezierCurveTo(-40, -370, -26, -376, -18, -392); c.lineTo(18, -392); c.bezierCurveTo(26, -376, 40, -370, 54, -374); c.bezierCurveTo(44, -394, 37, -414, 36, -440); c.bezierCurveTo(36, -462, 26, -478, 0, -478); c.closePath(); }, lin(-54, 0, 54, 0, [[0, J.hairD], [.5, J.hair], [1, J.hairD]]), { dir: 90, fallback: 90, group: 'hair', maxR: 4 });
  // face (backlit: warm shadow with a lit rim)
  L(c => { c.ellipse(0, -436, 20, 27, 0, 0, 7); }, lin(-24, 0, 24, 0, [[0, '#9a6448'], [.5, J.skin], [1, '#8a5a40']]), { dir: 'edge', fallback: 90, group: 'face', maxR: 4, detail: .6 });
  // beard + moustache
  L(c => { c.moveTo(-19, -432); c.bezierCurveTo(-21, -408, -10, -392, 0, -390); c.bezierCurveTo(10, -392, 21, -408, 19, -432); c.bezierCurveTo(12, -422, 6, -420, 0, -424); c.bezierCurveTo(-6, -420, -12, -422, -19, -432); c.closePath(); }, J.beard, { dir: 90, group: 'beard', maxR: 2.5 });
  L(c => { c.ellipse(0, -421, 6, 2.2, 0, 0, 7); }, '#7a4a36', { maxR: 1.5, group: 'mouth' });
  // hair framing the face in front of the shoulders
  L(c => { c.moveTo(0, -466); c.bezierCurveTo(-14, -466, -22, -456, -24, -440); c.lineTo(-20, -446); c.bezierCurveTo(-14, -458, -6, -460, 0, -458); c.bezierCurveTo(6, -460, 14, -458, 20, -446); c.lineTo(24, -440); c.bezierCurveTo(22, -456, 14, -466, 0, -466); c.closePath(); }, J.hair, { dir: 0, group: 'fringe', maxR: 2 });
  // strands: lighter brown lines catching the backlight
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) R.line(inJ(c => { const x0 = s * (8 + k * 7); c.moveTo(x0, -474 + k * 2); c.bezierCurveTo(s * (30 + k * 3), -460, s * (30 + k * 4), -420, s * (36 + k * 5), -380); }), k % 2 ? '#5a3822' : '#4a2e1c', 1.3, { dir: 'edge', group: 'strand' + s + k, maxR: 1.2 });
  R.tint(inJ(c => { c.ellipse(0, -428, 4, 9, 0, 0, 7); }), 'rgba(210,150,110,.6)');   // nose bridge
}
// procedural parts of Jesus in local units. ph = step phase, mv = 0..1 walking amount
export function jesusLive(out, { ph = 0, mv = 0, t = 0, seed = 1 } = {}) {
  const R0 = hex(J.robe), RS = hex(J.robeS), RED = hex(J.red), RD = hex(J.redD), SK = hex(J.skin);
  // feet, one forward per step (seen under the hem)
  for (const s of [-1, 1]) {
    const fw = Math.max(0, Math.sin(ph + (s > 0 ? 0 : Math.PI))) * mv;
    out.push({ x: s * 20, y: -4 + fw * 6, ang: 0, len: 26 + fw * 8, wid: 13, c: shade(SK, .8), c2: hex(J.skinD), seed: seed + s, type: DAB, hgt: .9 });
  }
  // the hem swings with the step: the robe's lower edge is re-laid each frame
  const sw = Math.sin(ph) * mv;
  for (let i = 0; i < 9; i++) {
    const u = -1 + i / 4, x = u * 92 + sw * 8 * (1 - Math.abs(u)), y = -30 - Math.abs(u) * 4 + Math.cos(ph * 2 + u) * 2 * mv;
    out.push({ x, y, ang: Math.PI / 2 + sw * .12, len: 30, wid: 16, c: shade(i % 3 ? R0 : RS, .93), c2: RS, seed: seed + 10 + i, type: KNIFE, hgt: 1, alpha: .9 });
  }
  // His left arm (screen right): hangs a little open, palm out; swings with the step
  const sh = [70, -372], a = -.32 + sw * .1, el = [sh[0] + Math.sin(-a) * 92, sh[1] + Math.cos(a) * 92], a2 = a - .28;
  const hd = [el[0] + Math.sin(-a2) * 84, el[1] + Math.cos(a2) * 84];
  const seg = (p, q, w, c, c2, sd) => out.push({ x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, ang: Math.atan2(q[1] - p[1], q[0] - p[0]), len: Math.hypot(q[0] - p[0], q[1] - p[1]) * 1.12, wid: w, c, c2, seed: sd, type: KNIFE, hgt: 1 });
  seg(sh, el, 34, R0, RS, seed + 30); seg(el, hd, 30, R0, RS, seed + 31);
  seg([sh[0] + 10, sh[1]], [el[0] + 12, el[1]], 10, hex('#fff6dc'), R0, seed + 32);            // rim light from the door
  out.push({ x: hd[0] + 4, y: hd[1] + 14, ang: Math.PI / 2 + a2, len: 30, wid: 20, c: SK, c2: hex(J.skinD), seed: seed + 33, type: DAB, hgt: .9 });
  // the mantle's free edge lifts and ripples as He walks
  const edge = [[-96, -350], [-120, -296], [-144, -240], [-168, -176], [-130, -160], [-96, -134]];
  for (let i = 0; i < edge.length - 1; i++) for (let j = 0; j < 4; j++) {
    const f = j / 4, x = lerp(edge[i][0], edge[i + 1][0], f), y = lerp(edge[i][1], edge[i + 1][1], f), u = (i + f) / (edge.length - 1);
    const wv = Math.sin(t * 5.2 - u * 4.5) * (3 + 9 * u) * (.35 + .65 * mv);
    out.push({ x: x - wv, y: y + wv * .3, ang: Math.atan2(edge[i + 1][1] - edge[i][1], edge[i + 1][0] - edge[i][0]), len: 20, wid: 9, c: j % 2 ? RED : hex('#a82820'), c2: RD, seed: seed + 40 + i * 4 + j, type: KNIFE, hgt: 1.05, alpha: .85 });
  }
  // rim light: the door behind Him outlines the silhouette
  for (const [x0, y0, x1, y1] of [[-34, -404, -76, -380], [34, -404, 76, -380], [80, -350, 92, -40], [-30, -478, 30, -478]]) out.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, ang: Math.atan2(y1 - y0, x1 - x0), len: Math.hypot(x1 - x0, y1 - y0), wid: 5, c: hex('#fff4d4'), seed: seed + 60 + x0, type: KNIFE, alpha: .8, hgt: .8 });
}
// eyes in head-local units (frontal): open .. closed
export function jesusEyes(out, { lid = 0, seed = 1 } = {}) {
  for (const s of [-1, 1]) out.push({ x: s * 9, y: -444, ang: 0, len: 8, wid: Math.max(1.4, 4.5 * (1 - lid)), c: hex('#24140e'), seed: seed + s, type: DAB, hgt: .5 });
  for (const s of [-1, 1]) out.push({ x: s * 9.5, y: -451, ang: s * -.12, len: 11, wid: 2.6, c: hex(J.hairD), seed: seed + 5 + s, type: KNIFE, hgt: .6 });
}

// ---------------- plates
const paint = (R, R0, seed, opts = {}) => paintRef(R, { R: R0, T: 12, seed, ...opts });
export function buildCorridor() {
  const set = new Ref(CW, CH, .5); drawSet(set);
  const mb = new Ref(CW, CH, .8); drawManBody(mb);
  const mh = new Ref(CW, CH, .9); drawManHead(mh);
  const jb = new Ref(440, 580, 1.6); drawJesusBody(jb);
  const jh = new Ref(440, 580, 2.2); drawJesusHead(jh);
  return {
    set: { ref: set, strokes: paint(set, [44, 22, 11, 5.5, 3], 1) },
    manBody: { ref: mb, strokes: paint(mb, [16, 8, 4, 2.2], 2) },
    manHead: { ref: mh, strokes: paint(mh, [10, 5, 2.6, 1.6], 3) },
    jBody: { ref: jb, strokes: paint(jb, [16, 8, 4, 2.2], 4), ox: JOX, oy: JOY },
    jHead: { ref: jh, strokes: paint(jh, [10, 5, 2.6, 1.6], 5), ox: JOX, oy: JOY },
  };
}
