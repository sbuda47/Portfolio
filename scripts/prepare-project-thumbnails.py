"""Build responsive WebP card images from the approved PNG masters.

Requires Pillow. Run from any directory; paths are relative to this script.
"""

import argparse
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "source-assets" / "images" / "project-thumbnails"
OUTPUT_DIR = ROOT / "assets" / "images" / "project-thumbnails"
PROJECTS = ("cnc-simulator", "mdhi", "telemetry", "bible-quest")
WIDTHS = (640, 1440)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--illustrations", action="store_true", help="Build the cream diagram card set without overwriting the original thumbnails")
    args = parser.parse_args()
    projects = ("optibelt", *PROJECTS) if args.illustrations else PROJECTS
    source_dir = SOURCE_DIR / "illustrations" if args.illustrations else SOURCE_DIR
    suffix = "-illustration" if args.illustrations else ""
    sources = [source_dir / f"{project}.png" for project in projects]
    missing = [str(source) for source in sources if not source.is_file()]
    if missing:
        raise SystemExit("Missing thumbnail masters: " + ", ".join(missing))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    for project, source in zip(projects, sources):
        with Image.open(source) as master:
            master = ImageOps.exif_transpose(master).convert("RGB")
            for width in WIDTHS:
                height = width * 9 // 16
                # The generated masters are almost 16:9. Fit removes only the
                # fractional edge mismatch and keeps the composition centered.
                thumbnail = ImageOps.fit(
                    master, (width, height), method=Image.Resampling.LANCZOS
                )
                output = OUTPUT_DIR / f"{project}{suffix}-{width}.webp"
                thumbnail.save(output, "WEBP", quality=86, method=6)
                size = output.stat().st_size
                total += size
                print(f"{output.relative_to(ROOT)}: {width}x{height}, {size:,} bytes")
    print(f"Total responsive assets: {total:,} bytes")


if __name__ == "__main__":
    main()
