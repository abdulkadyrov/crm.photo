#!/usr/bin/env python3
"""Build normalized master, preview and soft face mask for a child template."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps


MASTER_SIZE = (3072, 3840)
PREVIEW_SIZE = (600, 750)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--center-x", type=float, required=True)
    parser.add_argument("--center-y", type=float, required=True)
    parser.add_argument("--face-width", type=float, required=True)
    parser.add_argument("--face-height", type=float, required=True)
    parser.add_argument("--feather", type=float, default=0.018)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(args.source) as source:
        master = ImageOps.fit(source.convert("RGB"), MASTER_SIZE, Image.Resampling.LANCZOS)

    master.save(args.output_dir / "master.png", format="PNG", optimize=True)
    master.resize(PREVIEW_SIZE, Image.Resampling.LANCZOS).save(
        args.output_dir / "preview.webp",
        format="WEBP",
        quality=84,
        method=6,
    )

    width, height = MASTER_SIZE
    left = (args.center_x - args.face_width / 2) * width
    top = (args.center_y - args.face_height / 2) * height
    right = (args.center_x + args.face_width / 2) * width
    bottom = (args.center_y + args.face_height / 2) * height
    mask = Image.new("L", MASTER_SIZE, 0)
    ImageDraw.Draw(mask).ellipse((left, top, right, bottom), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=args.feather * min(MASTER_SIZE)))
    mask.save(args.output_dir / "face-mask.png", format="PNG", optimize=True)


if __name__ == "__main__":
    main()
