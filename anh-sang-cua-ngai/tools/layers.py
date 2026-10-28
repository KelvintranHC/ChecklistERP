# Cut-out layers for acting: each character part becomes its own reference plate (so it can move),
# and the background plate gets the holes filled behind it.
#   plates/<panel>_<layer>_ref.png / _id.png   (alpha = the part)
#   plates/<panel>_bg_ref.png / _id.png        (background with the parts removed)
# Run: $LIB/.venv/bin/python -I tools/layers.py <project dir>   (after preprocess.py)
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
sys.path.insert(0, sys.argv[1] + '/tools')
from preprocess import groups, fill_hole, ZONES

D = sys.argv[1]; RH = 648
# polygons in storyboard-panel px
LAYERS = {
  'door': {
    'jesus': [(550, 36), (558, 37), (563, 45), (565, 58), (572, 64), (582, 95), (590, 120), (586, 140), (578, 138), (575, 150), (572, 197), (562, 199), (561, 212), (539, 212), (538, 199), (528, 196), (533, 170), (522, 165), (502, 150), (486, 130), (500, 118), (522, 75), (538, 62), (540, 45)],
    'mhead': [(300, 58), (312, 48), (330, 51), (342, 61), (346, 80), (344, 96), (336, 108), (322, 113), (305, 111), (292, 101), (286, 85), (290, 70)],
  },
  'bless': {
    'hand': [(428, 246), (443, 227), (461, 204), (488, 186), (518, 170), (549, 166), (555, 174), (532, 183), (502, 199), (477, 216), (460, 236), (446, 252)],
    'jhead': [(190, 68), (230, 45), (280, 15), (330, 0), (400, 0), (420, 20), (440, 60), (447, 75), (420, 80), (405, 95), (392, 120), (375, 140), (355, 160), (340, 171), (325, 169), (318, 150), (300, 130), (280, 115), (250, 100), (220, 95), (195, 85)],
  },
}
# what lies behind a part where plain diffusion would be wrong: (panel, ellipse cx, cy, rx, ry, colour)
BEHIND = {'bless': [(548, 232, 64, 52, (30, 26, 30))]}     # the man's hair under His fingers

meta = json.load(open(f'{D}/plates/meta.json'))
for n, parts in LAYERS.items():
    src = Image.open(f'{D}/plates/{n}_ref.png').convert('RGB'); RW = src.size[0]; s = RH / 308
    arr = np.asarray(src); hole = np.zeros((RH, RW), bool)
    zid = np.asarray(Image.open(f'{D}/plates/{n}_id.png'))[..., 1]
    for ln, poly in parts.items():
        im = Image.new('L', (RW, RH), 0); ImageDraw.Draw(im).polygon([(x * s, y * s) for x, y in poly], fill=255)
        m = np.asarray(im.filter(ImageFilter.MaxFilter(3))) > 127
        Image.fromarray(np.dstack([arr, (m * 255).astype(np.uint8)]), 'RGBA').save(f'{D}/plates/{n}_{ln}_ref.png')
        g = groups(src, 4)
        Image.fromarray(np.dstack([(g + 1) * m, zid * m, np.zeros_like(zid), m * 255]).astype(np.uint8), 'RGBA').save(f'{D}/plates/{n}_{ln}_id.png')
        meta[f'{n}_{ln}'] = meta[n]
        hole |= ndimage.binary_dilation(m, iterations=7)
    f = fill_hole(arr, hole)
    yy, xx = np.mgrid[0:RH, 0:RW]
    for cx, cy, rx, ry, col in BEHIND.get(n, []):
        e = hole & (((xx - cx * s) / (rx * s)) ** 2 + ((yy - cy * s) / (ry * s)) ** 2 < 1)
        f[e] = np.array(col, float) * (1 + (np.random.default_rng(2).random(e.sum()) - .5) * .5)[:, None]
    bg = f.clip(0, 255).astype(np.uint8)
    Image.fromarray(bg).save(f'{D}/plates/{n}_bg_ref.png')
    g = groups(Image.fromarray(bg), 6)
    Image.fromarray(np.dstack([g + 1, zid, np.zeros_like(zid), np.full_like(zid, 255)]).astype(np.uint8), 'RGBA').save(f'{D}/plates/{n}_bg_id.png')
    meta[f'{n}_bg'] = meta[n]
    print(n, list(parts))
json.dump(meta, open(f'{D}/plates/meta.json', 'w'))
