# Sibusiso Mpofu — engineering portfolio

A static HTML/CSS/vanilla JavaScript website, hosted at
[GitHub Pages](https://sbuda47.github.io/Portfolio/).

The repository contains the reviewed site and a strict public-file boundary.
Original media and local working records are deliberately not versioned.

## Repository layout

```text
*.html                 Main pages, privacy notice, and custom 404
projects/              Four active case studies
assets/
  fonts/               Self-hosted fonts and their licenses
  icons/               Contact SVGs
  images/              Optimized screenshots, portraits, thumbnails, and MP4s
  docs/                Approved public CV only
source-assets/         Local originals/design references; ignored by Git
docs/
  design/              Style guide and design tokens; not deployed
  archive/             Local historical TODO and QCar draft; ignored by Git
  internal/            Existing private working notes; ignored by Git
scripts/               Asset preparation, build, repository policy, and tests
output/                Local QA, generation records, and previous builds; ignored
_site/                 Generated website artifact; ignored by Git
```

The repository itself is public. Excluding a tracked file from Pages does not
make it private or erase its Git history. Never commit credentials, private
messages, unpublished research, or confidential client information.

## Build and test

Python 3.13 is used in CI. The publishing build needs no third-party packages.

```powershell
python -m unittest discover -s scripts -p "test_*.py" -v
python scripts/validate-repository.py
python scripts/validate-videos.py
python scripts/build-site.py
node --check js/main.js
node --check js/home.js
node scripts/serve-preview.cjs
```

Open `http://127.0.0.1:4176/Portfolio/`. The preview serves only `_site`,
supports MP4 byte ranges, and tests the same `/Portfolio/` base path as Pages.
It binds only to the local computer; another device cannot use that loopback URL.
Press Ctrl+C to stop. Rebuild after editing; reload the browser to see changes.

`scripts/public-files.json` is the explicit publishing allowlist. Adding a page
or asset requires adding it there and updating its links and sitemap. It must also be
added to `scripts/repository-files.json` before staging and committing. The build
validates HTML/CSS dependencies, generated gallery paths, security metadata,
canonical URLs, privacy links, the web manifest, and sitemap. It fails rather
than publishing missing dependencies or accidental extra files. Old builds are
preserved under `output/previous-site-*`, not removed.

## GitHub Pages

The workflow validates pull requests without deploying. A push to `main` or
manual dispatch builds and uploads **only `_site`**, then deploys it. Actions
are pinned to verified commit SHAs; permissions are scoped to each job.
Deployment no longer installs Pillow or runs media conversion. Optimized assets
must be prepared locally and committed before release. Dependabot proposes
monthly Actions and local media-dependency updates; review them before merging.

The owner reported configuring repository **Settings → Pages → Build and
deployment → Source → GitHub Actions** and **Enforce HTTPS** on 14 October 2026.
Do not restore a branch-root publisher alongside the allowlisted workflow.

## Preparing assets

Only the local image tools need Pillow:

```powershell
python -m pip install -r requirements-media.txt
python scripts/convert-images.py
python scripts/prepare-project-thumbnails.py
```

A fresh clone can build and deploy using the committed optimized assets.
Regenerating media requires restoring your locally backed-up `source-assets/`;
this folder is ignored and is not part of a fresh clone. Keep an independent
backup of originals and generated-art masters before changing machines.

The first script reads photos/screenshots from `source-assets/images/`, skips
existing WebP outputs unless `--force` is supplied, and never converts the
thumbnail masters or design-reference folder. The thumbnail script builds
640×360 and 1440×810 WebP variants from the approved masters.

Videos remain explicit-play-only progressive MP4s, not external embeds.
Put originals in `source-assets/videos/`; the local FFmpeg watcher writes
optimized copies into `assets/images/`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/watch-and-compress-videos.ps1 -Once
python scripts/validate-videos.py
```

Omit `-Once` to watch, or use `-Force` after changing encoding settings.
FFmpeg is required locally; Pages does not encode videos. Update the duration
and size labels in `js/main.js` when replacing a recording.

## Tracking and security

`scripts/repository-files.json` lists the files approved for public Git tracking.
Run `python scripts/validate-repository.py` after staging and before committing
or pushing. It checks the Git index and common credential patterns without
printing credential values. CI repeats the check before deployment.

CI runs after a push, so it cannot undo an accidental upload to GitHub. The
local check and `.gitignore` help prevent that first exposure; do not bypass
them with forced adds. Credential-pattern checks are not exhaustive.

## Handoff

`TODO.md` and `handover.md` are local working records, intentionally untracked.
They remain available in the owner's checkout, not in a fresh clone.
[Security and release notes](docs/security-and-release.md) explain remaining
account checks, protection limits, and the public-repository boundary.
