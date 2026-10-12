# Portfolio Website

This repository contains a static portfolio website for Sibusiso M. Mpofu.

## Image optimization

A Python script is provided to convert source PNG/JPG images to WebP for faster loading.

- Original images are stored in `assets/images/normal-images/`
- Optimized WebP images are stored in `assets/images/`

To generate WebP images locally after adding new PNG/JPG files:

```bash
python convert_images.py
```

## GitHub Pages deployment

The repository includes a GitHub Actions workflow at `.github/workflows/github-pages.yml`.

- On every push to `main`, the workflow will:
  1. set up Python
  2. install Pillow
  3. run `python convert_images.py`
  4. validate the optimized project videos (existence, MP4 headers, fast-start, size budget)
  5. upload the site artifact
  6. deploy to GitHub Pages

This means image conversion happens automatically during deployment, so you do not need to remember it before pushing changes.

## Project videos

Videos are static, progressive MP4s, requested only after the visitor presses Play.
The originals are preserved; the site uses `cnc-optimized.mp4` and
`BibleQuest-optimized.mp4`. Commit those outputs with the website.

With FFmpeg installed, encode locally with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\watch-and-compress-videos.ps1 -Once
python scripts/validate-videos.py
```

Omit `-Once` to keep watching; use `-Force` to rebuild after changing settings.
GitHub Pages does not run the encoder. See [handover.md](handover.md) for settings,
measured size savings, QA results, and the phone/cellular testing checklist.
