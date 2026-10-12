# Portfolio handover

Status date: 2026-10-12

## Current status

Sprint 3 was released in `64f5d8a`; the homepage/navigation update is `2d75408`. The video-delivery and shared-font improvements below are included in this release, with the owner's approval to push to `main` on 2026-10-12. GitHub Pages deploys on pushes to `main`; confirm its Actions workflow succeeds before treating the changes as live. Preserve unrelated existing working-tree changes.

## Video delivery follow-up (2026-10-11)

### What was actually wrong

- `cnc-optimized.mp4` was referenced but did not exist. The old fallback downloaded the 36.8 MB original instead. Bible Quest still used its original recording.
- `preload="none"` was being overridden by connection-aware, near-viewport `preload="auto"`. This could download complete demos without a visitor pressing Play. Connection API support is also inconsistent across browsers.
- The player had little loading/error feedback. CNC's caption could cover native playback controls, and its demo was buried after eight screenshots.
- External Google Fonts stylesheets added a separate network dependency during page startup. Existing licensed local fonts now serve all pages.

### Shipped locally

| Video | Original bytes | Optimized bytes | Reduction | Display format |
| --- | ---: | ---: | ---: | --- |
| CNC | 36,813,884 | 2,842,021 | 92.3% | Landscape, about 65 seconds |
| Bible Quest | 9,669,667 | 1,655,146 | 82.9% | Portrait, about 52 seconds |

- Both optimized MP4s now exist in `assets/images/`. Originals are untouched. Outputs use H.264/yuv420p, optional AAC audio, 30 fps, a 1280px maximum edge, two-second keyframes, and `+faststart` (metadata before video data). Both decode through their full duration; sampled frames remain readable.
- A shared lightweight player attaches **no video source until Play**. Opening a demo shows only its poster, duration, size, and Play button. There is no autoplay or speculative video preloading, regardless of connection type.
- Native controls and inline mobile playback remain. Loading/buffering feedback, a slow-connection message after 12 seconds, retry on error, and an Open MP4 link are provided. Closing the viewer or returning to screenshots pauses playback and removes the source to cancel further fetching. Reopening starts at the beginning; the browser may reuse its HTTP cache.
- CNC has direct Screenshots / Demo video buttons, an unobstructed caption below the frame, and corrected narrow-screen gutters. Bible Quest keeps the portrait format, with gallery arrows outside the player. Gallery focus returns to the opener; Escape closes it and keyboard focus is contained. Video arrow keys no longer change gallery items.
- Homepage navigation styling is shared across all ten content pages, including active underlines, local wordmark font, consistent mobile menu behavior, Escape/outside-click dismissal, and focus styling. Routes, nav labels, contact form integration, and palette are preserved. Poppins and Black Ops One are now served locally; Archivo Black remains homepage-only.
- `scripts/validate-videos.py` fails the GitHub Pages workflow if either optimized asset is missing, malformed at the MP4-container level, lacks fast-start ordering, or exceeds the 15 MB per-demo budget. It does not replace a full decode or visual quality check. No server, paid streaming service, or runtime encoding was added.

### Re-encoding future recordings

Install FFmpeg on your own machine (or pass its executable with `-FfmpegPath`), then run from the repository root:

```powershell
# Encode existing originals once and exit.
powershell -ExecutionPolicy Bypass -File .\scripts\watch-and-compress-videos.ps1 -Once

# After changing encoding settings, regenerate the optimized copies.
powershell -ExecutionPolicy Bypass -File .\scripts\watch-and-compress-videos.ps1 -Once -Force

# Check the assets before release.
python scripts/validate-videos.py
python -m unittest discover -s scripts -p 'test_*.py'
```

Omit `-Once` to watch new or replaced source files. The watcher ignores its own generated files and encodes into a temporary file before replacing an existing good output. `-Crf` controls quality/size (lower means higher quality and larger files); `-MaxWidth` bounds both dimensions without upscaling. Defaults are CRF 23, slow preset, 1280px. Update the player's displayed duration/size in `js/main.js` when replacing a demo, and refresh its cache version when changing delivery code. Add new demo names to the validator if more videos are introduced.

FFmpeg was supplied for this session by a temporary `imageio-ffmpeg` package, not a permanent PATH installation. The finished MP4s have no dependency on that tool. **Both optimized MP4s are included with the code and scripts in this release**: GitHub Pages serves files and does not execute the local watcher. The owner authorized the release push on 2026-10-12; verify deployment success in Actions.

### Verification record

- Both MP4s passed fast-start validation and full FFmpeg decoding. Four validator fixture tests passed. JavaScript syntax, PowerShell parsing, and whitespace checks passed.
- Local browser: verified poster-only state with `src` absent, successful playback of both demos, advancing playback time, CNC native-keyboard seeking, error/retry presentation while its optimized file was still absent, and stopped/released sources when exiting either player. Gallery image navigation and focus return also passed.
- Visual checks covered desktop 1280px and mobile 390px/320px. All ten content pages have the shared header; no horizontal overflow was observed at 320px. Mobile menu and Escape were exercised on About, CNC, Skills, and Portfolio. No physical iPhone/Android test has been performed here.
- Local Lighthouse (headless Edge, simulated mobile, initial page load): CNC **99 performance / 100 accessibility**, LCP 2.0s, CLS 0; Bible Quest **96 / 100**, LCP 2.6s, CLS 0. Both audits recorded **zero MP4 requests on initial load**. These are local lab results, not measured GitHub Pages/cellular startup times or a complete accessibility certification. Reports/screenshots are in `output/video-qa/`.
- Python's simple local server does not emulate GitHub Pages byte-range delivery; validate seeking on the deployed site too.

### Easy visual test on another device

1. Review and commit the local changes, including both optimized videos, then push `main`. Wait for **Deploy GitHub Pages** in GitHub Actions to turn green. Open the deployment URL shown by Actions or Settings > Pages. Do not use `127.0.0.1`/`localhost`: those addresses refer to the device you open them on.
2. On another phone/laptop, use a fresh private/incognito session over Wi-Fi. Visit Portfolio > CNC. The screenshot should appear without waiting for a video download. Tap **Demo video**: expect a poster and **65 seconds / 2.84 MB**. This label also confirms the updated build.
3. Tap **Play demo** and time how long until the first moving frame. Expect loading feedback followed by normal controls, not a blank frame or an indefinite spinner. Watch for 15 seconds, seek forward, pause/resume, and try fullscreen/phone rotation. Return to Screenshots: playback/audio should stop.
4. Repeat for Bible Quest > Watch demo > Play demo. Expect **52 seconds / 1.66 MB**, a portrait player without stretching, and playback stopping when you close the viewer.
5. Close all private tabs, open a new private session, switch from Wi-Fi to mobile data, and repeat. Record first-frame delay and any stalls. A later warm-cache visit is not a fair first-load test. No fixed start time is guaranteed on every connection.
6. If playback fails, use **Retry video** or **Open MP4**. If the direct MP4 is also missing, check that both assets were committed and the latest deployment succeeded. If old controls/labels remain, close the private session and retry after the deployment/cache has refreshed.

Optional deeper desktop check: DevTools > Network > Disable cache, filter `mp4`, reload. There should be **no MP4 request** until Play, then only the `*-optimized.mp4` file (never the original). Test with throttling and seek partway through; partial delivery may appear as `206 Partial Content` responses. Stop/close the player and confirm no continued playback. You can also try Offline before Play, then restore the connection and Retry to exercise recovery.

References: [FFmpeg fast-start MP4](https://www.ffmpeg.org/ffmpeg-formats.html), [MDN video loading attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video). `preload` is only a browser hint; withholding `src` until user intent is the primary control here.

## Completed

- Repaired the Telemetry gallery navigation and standardized project-page back links and case-study layouts.
- Limited homepage featured work to the CNC Simulator and MD-HI projects; removed the duplicate Telemetry experience entry from Skills.
- Refined portfolio copy and project storytelling. Added the BOCRA-sponsored Best Final Year Project award and completed the Skills orb/domain behavior.
- Reworked Contact with centered rotating typewriter prompts, an accessible contact-form dialog, validation, and themed Email, LinkedIn, and WhatsApp SVG links.
- Connected the static HTML/Vanilla JavaScript form to Formspree at `https://formspree.io/f/xwlvobrr`. Submission states cover pending, success, provider errors, and network errors; fields clear only on success. The owner confirmed real deployed delivery. Browser tests did not submit a real message.
- Corrected page heading semantics and fixed the CNC video path.
- Corrected responsive utility breakpoints so tablet and desktop layouts apply at their intended viewport widths.
- Changed the CNC video to `preload="none"` after finding that `preload="metadata"` fetched the entire 36,813,884-byte file on load.
- Initially added connection-aware preloading; **superseded by explicit-play-only loading** in the follow-up above.
- Added `scripts/watch-and-compress-videos.ps1`, a local PowerShell/FFmpeg watcher for `assets/images`. It processes existing and newly added video files into separate `*-optimized.mp4` copies using H.264/AAC and `+faststart`; originals are preserved. Requires FFmpeg on PATH and must remain running to watch for new files.
- Reworked the CNC hero media area into a carousel of eight screenshots and a demo. The follow-up adds a direct demo selector and removes the original-file fallback now that the optimized asset exists.
- Updated shared JavaScript cache-busting query strings after changes.

## Sprint 3 QA record

- Responsive: checked Home, About, Portfolio, Contact, Skills, and all four project pages at 320, 390, 768, and 1280 CSS pixels (36 page/viewport combinations). No horizontal overflow remained. The Home hero and featured-project grid render in two columns at 1280px; About's domain grid renders in three.
- Accessibility structure: all nine pages had exactly one `h1` and one `main`; scans found no duplicate IDs, missing image `alt` attributes, heading-level skips, or unlabeled form fields. Keyboard and interaction checks covered skip-link focus, Contact validation/dialog focus and Escape close, Skills selector behavior, and Telemetry gallery navigation.
- Contrast: the visual contrast review found no confirmed failures; an apparent overlay-button issue was a scanner false positive caused by checking inherited parent color instead of the visible text.
- Performance: Lighthouse could not run because no local Chrome installation was available. The unthrottled local browser timings are not Lighthouse scores and are not presented as controlled lab results. The browser resource check identified the eager CNC video download; after the change to `preload="none"`, page load requested zero video bytes.
- Validation: `node --check js/main.js` and `git diff --check` passed.
- Historical video/gallery QA (before this follow-up): verified 3G behavior, carousel wrapping, and the original-file fallback. FFmpeg was unavailable at that stage. The new verification record above supersedes that limitation and fallback behavior.

See [TODO.md](./TODO.md) for the checklist and the recorded Lighthouse limitation.

## Next

Sprint 3 has no remaining required scope. Analytics remains optional and deferred. Organize the next work as Sprint 4 based on priorities from the owner.

## Technical notes

- This is a static HTML/CSS/Vanilla JavaScript site hosted on GitHub Pages. It does not have a custom application backend.
- The Formspree form ID `xwlvobrr` is a public endpoint identifier. No private Formspree token or account credential is stored in the repository.
- Preserve the existing project page routes, form field names (`name`, `email`, `message`), site palette, and current contact-page layout when making follow-up changes.
- To generate compressed project videos, install FFmpeg, then run `powershell -ExecutionPolicy Bypass -File .\scripts\watch-and-compress-videos.ps1` from the repository root. The optimized output must be added to Git and deployed with the site; GitHub Pages does not run this local encoding script.
