#!/usr/bin/env python3
"""Build normalized master, preview and soft face mask for a child template."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps


CANVASES = {
    "legacy": {
        "master_size": (3072, 3840),
        "preview_size": (600, 750),
        "master_file": "master.png",
        "master_format": "PNG",
    },
    "a4": {
        "master_size": (2480, 3508),
        "preview_size": (600, 849),
        "master_file": "master.jpg",
        "master_format": "JPEG",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--center-x", type=float, required=True)
    parser.add_argument("--center-y", type=float, required=True)
    parser.add_argument("--face-width", type=float, required=True)
    parser.add_argument("--face-height", type=float, required=True)
    parser.add_argument("--feather", type=float, default=0.018)
    parser.add_argument("--canvas", choices=sorted(CANVASES), default="legacy")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    canvas = CANVASES[args.canvas]
    master_size = canvas["master_size"]
    preview_size = canvas["preview_size"]

    with Image.open(args.source) as source:
        master = ImageOps.fit(source.convert("RGB"), master_size, Image.Resampling.LANCZOS)

    master_options = {"dpi": (300, 300)}
    if canvas["master_format"] == "JPEG":
        master_options.update({"quality": 94, "subsampling": 0, "optimize": True, "progressive": True})
    else:
        master_options.update({"optimize": True})
    master.save(args.output_dir / canvas["master_file"], format=canvas["master_format"], **master_options)
    master.resize(preview_size, Image.Resampling.LANCZOS).save(
        args.output_dir / "preview.webp",
        format="WEBP",
        quality=84,
        method=6,
    )

    width, height = master_size
    left = (args.center_x - args.face_width / 2) * width
    top = (args.center_y - args.face_height / 2) * height
    right = (args.center_x + args.face_width / 2) * width
    bottom = (args.center_y + args.face_height / 2) * height
    mask = Image.new("L", master_size, 0)
    ImageDraw.Draw(mask).ellipse((left, top, right, bottom), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=args.feather * min(master_size)))
    mask.save(args.output_dir / "face-mask.png", format="PNG", optimize=True)


if __name__ == "__main__":
    main()
