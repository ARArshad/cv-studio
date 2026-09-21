#!/usr/bin/env python3
"""
Draw the placeholder portrait the app starts with.

    python3 src/make-placeholder-photo.py

No real person ships with this project, so the starting photo is a plain
drawn avatar: a soft gradient behind a head and shoulders silhouette. Anyone
using the app replaces it in one click with Change photo.

Needs Pillow:  python3 -m pip install Pillow
"""

import pathlib

from PIL import Image, ImageDraw

OUT = pathlib.Path(__file__).resolve().parent / "photo.jpg"
SIZE = 760
SCALE = 4  # draw big, shrink down, so the curves come out smooth

TOP = (226, 233, 243)      # gradient, top
BOTTOM = (193, 206, 224)   # gradient, bottom
FIGURE = (140, 156, 178)   # the silhouette


def main() -> None:
    side = SIZE * SCALE
    img = Image.new("RGB", (side, side), TOP)
    draw = ImageDraw.Draw(img)

    for y in range(side):
        t = y / (side - 1)
        draw.line(
            [(0, y), (side, y)],
            fill=tuple(round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)),
        )

    cx = side / 2
    head_r = side * 0.158
    head_cy = side * 0.375
    draw.ellipse(
        [cx - head_r, head_cy - head_r, cx + head_r, head_cy + head_r],
        fill=FIGURE,
    )

    # shoulders: a wide rounded arch that runs off the bottom edge
    body_w = side * 0.62
    body_top = side * 0.615
    draw.rounded_rectangle(
        [cx - body_w / 2, body_top, cx + body_w / 2, side * 1.25],
        radius=body_w / 2,
        fill=FIGURE,
    )

    img.resize((SIZE, SIZE), Image.LANCZOS).save(OUT, quality=92)
    print(f"wrote {OUT.name}  ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
