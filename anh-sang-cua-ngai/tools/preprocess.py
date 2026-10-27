# Storyboard panels -> reference plates for paintRef():
#   plates/<n>_ref.png  upscaled, lightly sharpened colour reference
#   plates/<n>_id.png   value/colour groups (R = group id, G = detail zone), cleaned with a mode filter
# Run: $LIB/.venv/bin/python -I tools/preprocess.py <project dir>
import sys, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage

D = sys.argv[1]
RH = 648                       # reference height in px (plate is 1080 units tall -> scale .6)
K = 6                          # value/colour groups per plate
# detail zones in source-panel px: (cx, cy, rx, ry) — faces and hands get finer strokes
ZONES = {
  'door':  [(548, 115, 34, 95), (318, 95, 34, 36), (342, 152, 26, 20)],
  'cross': [(268, 488 - 316, 40, 40), (205, 545 - 316, 70, 70)],
  'face':  [(395, 120, 85, 110)],
  'hands': [(445, 110, 70, 50), (312, 170, 75, 55)],
  'bless': [(370, 100, 90, 85), (520, 220, 75, 55)],
  'dawn':  [(330, 120, 45, 120), (440, 150, 40, 110)],
}
# man's arm in the hands panel (source px): split into its own layer so it can reach
ARM = [(0, 234), (100, 228), (188, 203), (232, 194), (256, 175), (298, 142), (321, 122), (384, 143), (370, 178), (345, 212), (305, 244), (274, 262), (246, 308), (0, 308)]

def lab(a):
    a = a / 255.0
    a = np.where(a > .04045, ((a + .055) / 1.055) ** 2.4, a / 12.92)
    M = np.array([[.4124, .3576, .1805], [.2126, .7152, .0722], [.0193, .1192, .9505]])
    xyz = a @ M.T / np.array([.9505, 1.0, 1.089])
    f = np.where(xyz > .008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def kmeans(X, k, it=25, seed=1):
    rng = np.random.default_rng(seed)
    C = X[rng.choice(len(X), k, replace=False)]
    # init spread over lightness
    C = np.quantile(X, np.linspace(.05, .95, k), axis=0)
    for _ in range(it):
        d = ((X[:, None, :] - C[None]) ** 2).sum(-1); l = d.argmin(1)
        for j in range(k):
            if (l == j).any(): C[j] = X[l == j].mean(0)
    return C

def groups(img, k):
    # blur away the tile grout, cluster in Lab (lightness weighted up: value structure first)
    b = np.asarray(img.filter(ImageFilter.MedianFilter(7)).filter(ImageFilter.GaussianBlur(3))).astype(float)
    L = lab(b); X = L.reshape(-1, 3) * np.array([1.6, 1, 1])
    C = kmeans(X[::7], k)
    lbl = ((X[:, None, :] - C[None]) ** 2).sum(-1).argmin(1).reshape(L.shape[:2])
    # mode filter: kill speckles so groups are calm planes with clean borders
    for _ in range(3):
        votes = np.stack([ndimage.uniform_filter((lbl == j).astype(float), 9) for j in range(k)])
        lbl = votes.argmax(0)
    # sort groups by lightness so ids are stable/readable
    order = np.argsort([L[..., 0][lbl == j].mean() if (lbl == j).any() else 0 for j in range(k)])
    remap = np.zeros(k, int); remap[order] = np.arange(k)
    return remap[lbl]

def fill_hole(a, m):
    # diffuse surrounding colour into the masked area (simple inpaint)
    a = a.copy().astype(float); known = ~m
    for s in [41, 21, 11, 5]:
        for _ in range(12):
            w = ndimage.uniform_filter(known.astype(float), s)
            v = np.stack([ndimage.uniform_filter(a[..., c] * known, s) for c in range(3)], -1)
            upd = m & (w > .02)
            a[upd] = v[upd] / w[upd][:, None]
            known = known | upd
    return a

meta = {}
for n, zones in ZONES.items():
    src = Image.open(f'{D}/plates/{n}.png').convert('RGB')
    sw, sh = src.size; RW = round(RH * sw / sh); s = RH / sh
    big = src.resize((RW, RH), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    g = groups(big, K)
    z = np.zeros((RH, RW), np.uint8)
    yy, xx = np.mgrid[0:RH, 0:RW]
    for i, (cx, cy, rx, ry) in enumerate(zones):
        z[((xx - cx * s) / (rx * s)) ** 2 + ((yy - cy * s) / (ry * s)) ** 2 < 1] = 1
    arr = np.asarray(big)
    if n == 'hands':
        im = Image.new('L', (RW, RH), 0); ImageDraw.Draw(im).polygon([(x * s, y * s) for x, y in ARM], fill=255)
        arm = np.asarray(im.filter(ImageFilter.MaxFilter(3))) > 127
        rgba = np.dstack([arr, (arm * 255).astype(np.uint8)])
        Image.fromarray(rgba, 'RGBA').save(f'{D}/plates/hands_arm_ref.png')
        ga = groups(big, 3); ida = np.dstack([(ga + 1) * arm, z * arm, np.zeros_like(z), arm * 255]).astype(np.uint8)
        Image.fromarray(ida, 'RGBA').save(f'{D}/plates/hands_arm_id.png')
        hole = ndimage.binary_dilation(arm, iterations=8)
        f = fill_hole(arr, hole)
        # give the filled area tile-sized value breaks, so the knife has planes to follow
        blk = np.asarray(Image.fromarray((np.random.default_rng(4).random((RH // 14 + 1, RW // 14 + 1)) * 255).astype(np.uint8)).resize((RW, RH), Image.NEAREST)).astype(float)
        blk = ndimage.gaussian_filter(blk, 1.2)[:RH, :RW]
        f[hole] *= (1 + (blk[hole][:, None] / 255 - .5) * .16)
        arr = f.clip(0, 255).astype(np.uint8)
        g = groups(Image.fromarray(arr), K)
    Image.fromarray(arr).save(f'{D}/plates/{n}_ref.png')
    ida = np.dstack([g + 1, z, np.zeros_like(z), np.full_like(z, 255)]).astype(np.uint8)
    Image.fromarray(ida, 'RGBA').save(f'{D}/plates/{n}_id.png')
    meta[n] = {'w': RW, 'h': RH, 'src': [sw, sh]}
    print(n, RW, RH, np.bincount(g.ravel(), minlength=K))
json.dump(meta, open(f'{D}/plates/meta.json', 'w'))
