# Sound design + final mix: room hiss and drips, wind, palette-knife scrapes, cloth, the touch, birds at dawn; score on top.
# (the file runs 3.3 s past the picture: mux cuts it at the last frame; mux's decode check needs the tail)
# Run from the library root: $LIB/.venv/bin/python <project>/mix.py   (needs events.json from events.mjs)
import sys, os, json
sys.path.insert(0, os.environ.get('LIB', os.getcwd()))
import numpy as np, soundfile as sf
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, noise, brown, norm, thump, whoosh, add, limit
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(5)
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EVJ['dur'] + 3.3; N = int(DUR * SR)
ev = {}
for e in EVJ['ev']: ev.setdefault(e['type'], []).append(e['t'])
music, _ = sf.read(os.path.join(HERE, 'music/score.wav')); music = music[:N]
if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
fx = np.zeros((N, 2)); amb = np.zeros((N, 2))
def put(buf, x, at, g=1., pan=0.): add(buf, x if x.ndim == 1 else x.mean(1), at, g, pan)
def fade(d, a, r):
    x = np.ones(int(d * SR)); na, nr = int(a * SR), int(r * SR)
    x[:na] = np.linspace(0, 1, na); x[len(x) - nr:] = np.linspace(1, 0, nr); return x

# ---------- materials
def scrape(v=1., d=.5):                 # palette knife dragged across wet paint
    tt = t_(d); grain = (np.abs(lp(noise(d), 40)) * 6).clip(0, 1)
    x = bp(noise(d), 1800, 5200) * grain * np.sin(np.pi * tt / d) ** .7 + bp(noise(d), 300, 900) * env_exp(d, .12) * .4
    return norm(x) * v
def drip(v=1.):
    d = .25; tt = t_(d); f = 1300 * (1 + .9 * np.exp(-tt / .01))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .04) + hp(noise(d), 4000) * env_exp(d, .003) * .3) * v
def cloth(v=1., d=.45):
    tt = t_(d); return norm(bp(noise(d), 500, 3500) * np.sin(np.pi * tt / d) ** 2 * (.6 + .4 * np.abs(lp(noise(d), 18)) * 4).clip(0, 1.5)) * v
def shimmer(v=1., d=3.2):
    tt = t_(d); x = np.zeros_like(tt)
    for k, f in enumerate([1760, 2217, 2637, 3520, 4434]): x += np.sin(2 * np.pi * f * tt + k) * env_exp(d, .5 + k * .25) * (1 - np.exp(-tt / (.01 + k * .04))) / (1 + k * .4)
    return norm(x) * v
def bird(v=1.):
    d = .22; tt = t_(d); f = 3200 + 1400 * np.sin(np.pi * tt / d) + 300 * np.sin(2 * np.pi * 28 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2 * v
def light_swell(v=1., d=1.6):            # the door's light coming up: a breath of air, rising
    tt = t_(d); return norm(lp(noise(d), 900) * (tt / d) ** 1.5 * env_exp(d, 2)) * v

# ---------- beds
T = {k: v[0] for k, v in ev.items()}
sc = sorted(ev['scrape']); T.update(cross=sc[0], face=sc[1], bless=sc[2], dawn=sc[3])
cut = lambda k: T[k]
room = lp(brown(cut('silence')), 700); put(amb, norm(room) * fade(len(room) / SR, .8, .05), 0, .05, 0)
wind = bp(noise(cut('silence') - 4.6), 180, 1400) * (.6 + .4 * np.sin(np.linspace(0, 9, int((cut('silence') - 4.6) * SR))))
put(amb, norm(wind) * fade(len(wind) / SR, 1.0, .05), 4.6, .06, -.2)                      # J-cut: wind before the hill
warm = lp(brown(DUR - cut('touch')), 500); put(amb, norm(warm) * fade(len(warm) / SR, 2.0, 1.5), cut('touch'), .04, .1)
dawnw = bp(noise(DUR - cut('dawn') + .6), 250, 2200); put(amb, norm(dawnw) * fade(len(dawnw) / SR, 1.2, 1.5), cut('dawn') - .6, .05, .2)

# ---------- foley
put(fx, light_swell(), 0.0, .25, .25)
for t, p in [(1.45, .3), (3.1, -.2), (4.35, .4)]: put(fx, drip(), t, .12, p)
for k in ('scrape',):
    for t in ev.get(k, []): put(fx, scrape(1, .55), t - .03, .22, .1)
for t in ev.get('line', []): put(fx, scrape(1, .7), t, .07, -.1)
put(fx, scrape(1, 1.0), cut('title'), .2, .2)                                              # the title laid in with the knife
put(fx, cloth(1, .5), cut('cloth'), .22, -.4); put(fx, cloth(1, .7), cut('cloth2'), .28, -.3)
put(fx, shimmer(1), cut('touch'), .2, .1); put(fx, thump(.6, 60)[: int(.4 * SR)], cut('touch'), .25, 0)
for i in range(9):
    t = cut('bless') + 1.2 + i * 1.25 + rng.random() * .6
    if t < DUR - 1: put(fx, bird(), t, .03 + .02 * rng.random(), rng.random() * 1.4 - .7)

# ---------- master: true silence holds (only the cloth) between the cut and the touch
c0, c1 = int(cut('silence') * SR), int(cut('touch') * SR)
amb[c0:c1] = 0
mix = music * 1.0 + fx + amb
mix = limit(mix, .95)
json.dump([{'t0': e['t'], 't1': e['t1'], 'text': e['text']} for e in EVJ['ev'] if e['type'] == 'line'] + [{'t0': T['title'], 't1': EVJ['dur'], 'text': 'ÁNH SÁNG CỦA NGÀI'}], open(os.path.join(HERE, 'out/cues.json'), 'w'), ensure_ascii=False)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
print('mix', DUR, 's peak', float(np.abs(mix).max()))
