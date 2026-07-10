#!/usr/bin/env python3
"""Cut the headshot out of its dark background as a clean circular transparent PNG."""
from PIL import Image, ImageDraw

SRC = "/root/.claude/uploads/228e3010-f326-574a-b879-002d7fe07536/d748a5d2-IMG_0830.jpeg"
OUT = "/home/user/ClaudePersonal/assets/kasper-portrait.png"

im = Image.open(SRC).convert("RGB")
W, H = im.size
px = im.load()

def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]

# Detect the bright circle: scan the centre row for its horizontal extent,
# then the centre column for its top, and derive centre + radius.
y0 = H // 2
xs = [x for x in range(W) if lum(px[x, y0]) > 150]
left, right = min(xs), max(xs)
cx = (left + right) // 2
R = (right - left) // 2

x0 = cx
ys = [y for y in range(H) if lum(px[x0, y]) > 150]
top = min(ys)
cy = top + R

# keep the crop square and inside the image
R = min(R, cx, cy, W - 1 - cx, H - 1 - cy)
box = (cx - R, cy - R, cx + R, cy + R)
print("W,H=", (W, H), "center=", (cx, cy), "R=", R, "box=", box)

crop = im.crop(box)
SIZE = 480
crop = crop.resize((SIZE, SIZE), Image.LANCZOS)

# supersampled circular mask, trimmed ~1.5% to shave the dark anti-aliased rim
ss = 4
big = Image.new("L", (SIZE * ss, SIZE * ss), 0)
d = ImageDraw.Draw(big)
pad = int(SIZE * ss * 0.015)
d.ellipse((pad, pad, SIZE * ss - pad, SIZE * ss - pad), fill=255)
mask = big.resize((SIZE, SIZE), Image.LANCZOS)

out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
out.paste(crop, (0, 0), mask)
out.save(OUT)

import os
print("saved", OUT, os.path.getsize(OUT), "bytes")
