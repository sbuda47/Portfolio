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
  4. upload the site artifact
  5. deploy to GitHub Pages

This means image conversion happens automatically during deployment, so you do not need to remember it before pushing changes.
