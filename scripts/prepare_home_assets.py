"""Encode the approved generated homepage layers for web delivery.

Only resizes/encodes; preserves the portrait's alpha channel and artwork.
Usage: python scripts/prepare_home_assets.py PORTRAIT_PNG TEXTURE_PNG
"""
import sys
from pathlib import Path
from PIL import Image

destination = Path(__file__).resolve().parents[1] / 'assets' / 'images'
portrait = Image.open(sys.argv[1]).convert('RGBA')
for width in (640, 1024):
    size = (width, round(portrait.height * width / portrait.width))
    portrait.resize(size, Image.Resampling.LANCZOS).save(
        destination / f'home-portrait-{width}.webp', quality=88, method=6
    )
texture = Image.open(sys.argv[2]).convert('RGB')
texture.save(destination / 'home-halftone.webp', quality=84, method=6)
