#!/usr/bin/env python3
"""
Build index.html from the four source parts plus the default photo.

    python3 src/build.py

The app ships as one self contained file so it can be opened straight from a
folder, emailed, or dropped on a USB stick with no server and no install. The
parts here are only for editing comfort:

    1-paper-and-ui.css.html   the CV styles and the editor chrome
    2-markup.html             the panel and canvas shell
    3-engine.js.html          data model, templates, renderer, pagination
    4-app.js.html             typing, panel wiring, exports, start up

The photo is embedded as base64 so the finished file has no dependencies.
Replace src/photo.jpg to change the picture the app starts with.
"""

import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
PARTS = [
    "1-paper-and-ui.css.html",
    "2-markup.html",
    "3-engine.js.html",
    "4-app.js.html",
]
TOKEN = "__PHOTO_B64__"


def main() -> int:
    html = "".join((SRC / part).read_text(encoding="utf-8") for part in PARTS)

    photo = SRC / "photo.jpg"
    if TOKEN in html:
        if not photo.exists():
            print(f"missing {photo}", file=sys.stderr)
            return 1
        html = html.replace(TOKEN, base64.b64encode(photo.read_bytes()).decode())

    out = ROOT / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}  ({len(html):,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
