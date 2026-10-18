"""Recorta el sello circular del logotipo UTA y deja el exterior transparente.

Uso (requiere Pillow y NumPy):
    python3 scripts/brand/seal.py brand-src/ut-logo-original.jpg public/brand

Genera ut-sello-{1024,512,256}.{png,webp}, apple-touch-icon.png y favicon-64.png.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
src, out_dir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(int)
dark = a.sum(axis=2) < 600   # anillo cromado / texto
ys, xs = np.where(dark)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
r = max(x1 - x0, y1 - y0) / 2
print('circle', cx, cy, r, (x0, x1, y0, y1))
pad = 2
box = (int(cx - r - pad), int(cy - r - pad), int(cx + r + pad), int(cy + r + pad))
crop = im.crop(box)
S = crop.size[0]
# máscara con supermuestreo para borde suave
k = 4
m = Image.new('L', (S * k, S * k), 0)
ImageDraw.Draw(m).ellipse((pad * k, pad * k, (S - pad) * k - 1, (S - pad) * k - 1), fill=255)
m = m.resize((S, S), Image.LANCZOS)
rgba = crop.convert('RGBA')
rgba.putalpha(m)
for size in (1024, 512, 256):
    t = rgba.resize((size, size), Image.LANCZOS)
    t.save(f'{out_dir}/ut-sello-{size}.png', optimize=True)
    t.save(f'{out_dir}/ut-sello-{size}.webp', quality=88, method=6)
rgba.resize((180, 180), Image.LANCZOS).save(f'{out_dir}/apple-touch-icon.png')
rgba.resize((64, 64), Image.LANCZOS).save(f'{out_dir}/favicon-64.png')
