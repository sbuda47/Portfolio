from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
IMAGE_DIR = ROOT / 'assets' / 'images'

SUPPORTED_EXTENSIONS = {'.png', '.jpg', '.jpeg'}
WEBP_QUALITY = 80

if not IMAGE_DIR.exists():
    raise SystemExit(f'Image directory not found: {IMAGE_DIR}')

converted = []
errors = []
for path in sorted(IMAGE_DIR.rglob('*')):
    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        continue
    webp_path = path.with_suffix('.webp')
    if webp_path.exists():
        continue
    try:
        with Image.open(path) as image:
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
