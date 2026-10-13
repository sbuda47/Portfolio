"""Encode source photos/screenshots; thumbnail masters use their own script."""
import argparse
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / 'source-assets' / 'images'
OUTPUT_DIR = ROOT / 'assets' / 'images'

SUPPORTED_EXTENSIONS = {'.png', '.jpg', '.jpeg'}
WEBP_QUALITY = 80

if not IMAGE_DIR.exists():
    raise SystemExit(f'Image directory not found: {IMAGE_DIR}')

converted = []
errors = []
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--force', action='store_true', help='Rebuild existing WebP files')
args = parser.parse_args()
for path in sorted(IMAGE_DIR.iterdir()):
    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        continue
    # Homepage alpha layers have a separate responsive encoder.
    if path.stem == 'home-portrait':
        continue
    webp_path = OUTPUT_DIR / (path.stem + '.webp')
    if webp_path.exists() and not args.force:
        continue
    try:
        with Image.open(path) as image:
            image = ImageOps.exif_transpose(image)
            image = image.convert('RGBA' if image.mode in ('RGBA', 'LA') else 'RGB')
            image.save(webp_path, 'WEBP', quality=WEBP_QUALITY, method=6)
        converted.append(str(webp_path.relative_to(ROOT)))
    except Exception as exc:
        errors.append((path, exc))

print(f'Converted {len(converted)} image(s).')
for converted_path in converted:
    print('  ', converted_path)
if errors:
    print(f'Encountered {len(errors)} error(s):')
    for path, exc in errors:
        print('  ', path, exc)
    raise SystemExit(1)
