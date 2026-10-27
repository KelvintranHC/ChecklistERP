# "Ánh Sáng Của Ngài" — score. 96 BPM, felt in half time. D minor (alone) -> silence -> F / Bb / C (the touch) -> D major (dawn).
# Run from the library root: $LIB/.venv/bin/python <project>/music/score.py
import sys, os
sys.path.insert(0, os.environ.get('LIB', os.getcwd()))
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR
HERE = os.path.dirname(os.path.abspath(__file__))
BEAT = 60 / 96; b = lambda n: n * BEAT
DUR = 31.5
S.seed(3)
ev = []
def E(beat, inst, pitch, beats, vel, pan=0., **k): ev.append(dict(t=b(beat), inst=inst, pitch=pitch, dur=None if beats is None else b(beats), vel=vel, pan=pan, **k))

# ---------- A · alone (beats 0-16): solo cello over a low string bed; the phrase hangs on E (unresolved)
for beat, p, d, v in [(.5, 'A3', 3, .55), (3.5, 'D4', 2, .62), (5.5, 'C4', 1, .55), (6.5, 'A#3', 1.5, .58), (8, 'A3', 3.5, .6), (11.5, 'F3', 1.5, .52), (13, 'G3', 1, .55), (14, 'A3', 2, .6), (16, 'E3', 5.6, .5)]:
    E(beat, 'cellos', p, d * .97, v, -.15)
for beat, ch, d in [(0, ['D2'], 8), (8, ['A#1'], 8)]:
    for p in ch: E(beat, 'contrabass', p, d, .42, .05, attack=1.2)
for beat, ch, d in [(0, ['F3', 'A3'], 8), (8, ['F3', 'A#3'], 8), (16, ['E3', 'A3'], 6)]:
    for p in ch: E(beat, 'violas', p, d, .3, .25, attack=1.5)
partA = S.render(ev, dur=DUR); ev.clear()

# ---------- B · He sees (beats 16-22): harp opens up, violins rise
for k, bt in enumerate([16, 18, 20]):
    ch = [['A#2', 'D3', 'F3', 'A#3', 'D4', 'F4'], ['G2', 'D3', 'G3', 'A#3', 'D4', 'G4'], ['A2', 'E3', 'A3', 'C#4', 'E4', 'A4']][k]
    for j, p in enumerate(ch): E(bt + j * .25, 'harp', p, 2, .45 + j * .03, -.35)
E(16, 'violins', 'D5', 6, .34, .3, attack=2.5)
E(19, 'violins', 'E5', 3, .38, .3, attack=1.0)
partB = S.render(ev, dur=DUR); ev.clear()

# ---------- C · the touch (beat 26) and the blessing: F -> Bb -> C, violin melody
for j, p in enumerate(['F4', 'A4', 'C5', 'F5', 'A5', 'C6', 'F6']): E(26 + j * .09, 'harp', p, 2.5, .55 + j * .04, -.3)
E(26, 'glockenspiel', 'A5', 4, .55, .15); E(26, 'glockenspiel', 'F6', 4, .4, .2)
for bt, bass, ch in [(26, 'F2', ['F3', 'C4', 'A4']), (30, 'A#1', ['F3', 'D4', 'A#4']), (34, 'C2', ['G3', 'E4', 'C5'])]:
    E(bt, 'contrabass', bass, 4, .5, 0, attack=.4)
    E(bt, 'cellos', bass.replace('2', '3').replace('1', '2'), 4, .45, -.15, attack=.4)
    E(bt, 'violas', ch[0], 4, .38, .2, attack=.5); E(bt, 'violas', ch[1], 4, .35, .2, attack=.5)
for beat, p, d in [(26.5, 'A4', 2.5), (29, 'G4', 1), (30, 'F4', 2), (32, 'D5', 2), (34, 'C5', 2.5), (36.5, 'E5', 1.5)]:
    E(beat, 'violins', p, d * .98, .5, .3, attack=.15)
for bt in [30, 32, 34, 36]:
    for j, p in enumerate((['A#2', 'F3', 'A#3', 'D4'] if bt < 34 else ['C3', 'G3', 'C4', 'E4'])): E(bt + j * .5, 'harp', p, 1.5, .4, -.35)
E(36, 'timpani', 'D2', 2, .35, 0); E(36.5, 'sus_cymbal', None, None, .28, .1)

# ---------- D · dawn (beat 38): D major — the phrase that hung on E resolves to D
for bt in [38, 42, 44]:
    E(bt, 'contrabass', 'D2', 48 - bt, .55, 0, attack=.2)
E(38, 'cellos', 'D3', 10, .55, -.15, attack=.2); E(38, 'cellos', 'A3', 10, .45, -.15, attack=.2)
E(38, 'violas', 'F#3', 10, .42, .2, attack=.3); E(38, 'violas', 'D4', 10, .4, .2, attack=.3)
E(38, 'horn', 'D4', 4, .4, -.05, attack=.3); E(42, 'horn', 'A3', 3, .36, -.05); E(45, 'horn', 'D4', 3, .36, -.05)
for beat, p, d in [(38, 'F#5', 2), (40, 'E5', 1), (41, 'D5', 1), (42, 'A4', 2), (44, 'B4', 1), (45, 'C#5', 1), (46, 'D5', 2.4)]:
    E(beat, 'violins', p, d * .98, .56, .3, attack=.1)
E(38, 'timpani', 'D2', 1, .55, 0)
for bt in range(38, 47, 2):
    for j, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']): E(bt + j * .2, 'harp', p, 1.6, .38 + j * .02, -.35)
E(41, 'glockenspiel', 'D6', 4, .5, .15); E(41.02, 'glockenspiel', 'A6', 4, .35, .2)
E(46, 'harp', 'D3', 3, .5, -.3); E(46, 'glockenspiel', 'F#6', 3, .3, .2)
partC = S.render(ev, dur=DUR); ev.clear()

mix = partA + partB + partC
# the hard silence: digital zero from the cut (beat 22) to the touch (beat 26), with a 60 ms tail
c0, c1 = int(b(22) * SR), int(b(26) * SR) - 32
mix[c0:c0 + int(.06 * SR)] *= np.linspace(1, 0, int(.06 * SR))[:, None]; mix[c0 + int(.06 * SR):c1] = 0
mix = S.room(mix, size=.6, mix=.26)
mix[c0 + int(.06 * SR):c1] = 0
fo = int((DUR - 1.6) * SR); mix[fo:] *= np.linspace(1, 0, len(mix) - fo)[:, None] ** 2
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR)
print('score', len(mix) / SR, 's peak', float(np.abs(mix).max()))
print(S.credits(['cellos', 'contrabass', 'violas', 'violins', 'harp', 'glockenspiel', 'timpani', 'sus_cymbal', 'horn']))
