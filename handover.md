# Handover — Portfolio Sprint 3

Date: 2026-09-01T15:12:51+02:00
Author: Copilot CLI (assistant) — AI assistant using Copilot CLI runtime in VS Code

Status update: 2026-10-06
- The telemetry gallery navigation issue described below was fixed in commit `b1aa776` and its next/previous controls were verified.
- Sprint 3 remains in progress; the current checklist is in `TODO.md`.

---

## Executive summary (layman)
- The portfolio layout was upgraded to a consistent case-study pattern for individual project pages (hero image > metrics > narrative sections).
- The telemetry and MD-HI project pages were refactored to this pattern. Metrics were clarified (e.g., "6 dp" → "5.1% mean detection error").
- A simplified gallery was implemented for telemetry: only a single main thumbnail on the page; the rest of the images are intended to appear inside a modal viewer with next/previous controls.
- There is one known functional bug: when the modal opens, the image shows correctly, but the next/previous arrows do not advance beyond the first image.
- A `handover.md` has been added so developers (or you) can pick up work quickly, see what changed, and follow the next steps.

---

## Files changed (high level)
- [index.html](/D:/Portfolio/index.html) — meta tags (meta description, OG, theme-color), preconnect for fonts, favicon & manifest, small SEO/UX improvements.
- [portfolio.html](/D:/Portfolio/portfolio.html) — same header/SEO updates as index.
- [manifest.json](/D:/Portfolio/manifest.json) — baseline web manifest created for PWA/metadata.
- [sitemap.xml](/D:/Portfolio/sitemap.xml) — simple site map with primary pages (update URLs for GitHub Pages path).
- [css/style.css](/D:/Portfolio/css/style.css) — new project layout classes (.project-grid, .project-stat-grid, .project-hero-banner, etc.) and gallery control styling.
- [projects/project-md-hi.html](/D:/Portfolio/projects/project-md-hi.html) — case-study layout applied, metric cards, content reflow.
- [projects/project-telemetry.html](/D:/Portfolio/projects/project-telemetry.html) — case-study layout applied; single main image thumbnail; modal/gallery structure in place.
- [js/main.js](/D:/Portfolio/js/main.js) — gallery logic (media arrays, openGallery(), updateGallery(), prev/next handlers) and other interactive behavior.

Note: Provide quick, plain-language explanations to the non-technical owner whenever a file was edited — see the "Executive summary (layman)" above and the per-file notes in the project README if needed.

---

## What was completed (technical details)
1. Project case-study template
   - Implemented a repeatable HTML structure for project pages: hero banner (full-bleed image), a compact grid of metric cards, and a two-column narrative area (left: What it is / Approach, right: My role / Outcome).
   - CSS: new layout utility classes to support full-bleed hero and card grids while remaining responsive. See [css/style.css](/D:/Portfolio/css/style.css) sections around the project classes.

2. Metrics and content edits
   - Converted ambiguous numeric labels to explicit metrics (e.g., parity / dp → percent error) to be more meaningful to viewers and hiring managers.

3. Gallery system (telemetry)
   - HTML: page shows a single clickable `.gallery-item` containing `tele_1.webp` as the visible thumbnail.
   - Modal: `.gallery-modal` contains an `.gallery-current` <img>, caption and controls `.gallery-prev`, `.gallery-next`, `.gallery-close`.
   - JS: `galleryMedia` is populated based on `document.body.dataset.gallery` (e.g., 'telemetry'), mapping to assets/images/tele_1.webp .. tele_5.webp.
   - `openGallery(index)` calls `updateGallery(0)` and shows modal; `updateGallery(index)` computes `currentGalleryIndex = (index + galleryMedia.length) % galleryMedia.length` and assigns `galleryCurrent.src = current.src` and updates the caption.

4. Accessibility & CLS fixes
   - Removed layout-shifting typing effect: replaced with a CSS-based reveal that retains server-rendered text to avoid cumulative layout shift (CLS). See [js/main.js](/D:/Portfolio/js/main.js) and [css/style.css](/D:/Portfolio/css/style.css) for the reveal state.

5. SEO & PWA scaffolding
   - Basic SEO tags added, placeholder OG URLs inserted; created a minimal `manifest.json` and `sitemap.xml` — update URLs and icons before launch.

---

## Historical blocker (gallery navigation bug — resolved)
Symptom
- Clicking the page thumbnail opens the modal and shows tele_1.webp as expected.
- Clicking the modal "next" or "prev" controls does not change the displayed image (remains tele_1). No visible JS error in some cases; in other cases console shows errors depending on browser.

Probable causes (investigation checklist)
1. galleryMedia array not populated with all 5 items at runtime.
2. Event listeners for prev/next buttons are not wired to call `updateGallery()` with the right index (or scope captures wrong `currentGalleryIndex`).
3. `galleryCurrent` DOM reference points to a different <img> element than the one visible (duplicate DOM or shadowing).
4. Modal open/close logic re-initializes or resets the index unexpectedly on control events.
5. Assets missing or paths incorrect (tele_2..tele_5 not present), so assigning `src` falls back to the same image or triggers onerror behavior.

Suggested debugging steps (ordered)
1. Confirm asset files exist:
   - Check the repository assets folder for telemetry images: `D:\Portfolio\assets\images\tele_1.webp` ... `tele_5.webp`.
2. Add console debugging to `updateGallery()` (temporary) to log the incoming index, computed currentGalleryIndex, and the `current.src` being assigned.

   Example (add to [js/main.js](/D:/Portfolio/js/main.js) inside updateGallery):
   ```js
   console.log('updateGallery called with', index);
   console.log('computed index', currentGalleryIndex);
   console.log('assigning src', current.src);
   ```

3. Confirm event handlers fire:
   - Using DevTools, set breakpoints or add console.log in the click handlers bound to `.gallery-prev` and `.gallery-next`.
4. Inspect DOM at runtime:
   - Verify there is only one element with class `.gallery-current` and that `galleryCurrent` references it.
5. Reproduce and capture console errors if any.
6. If no errors and handlers fire, test directly in console by running `updateGallery(1)` to see if UI changes. If it does, the problem is with the computed index passed by the click handler.
7. If images fail to load (404s), update paths or copy missing files.
8. Confirm no CSS overlays or z-index issues hide the updated <img>.

Likely fix candidates
- Ensure `galleryMedia` is an array of objects with `src` absolute/relative paths that resolve in the deployed site.
- Make `currentGalleryIndex` a module-scoped variable that all handlers read/update (instead of recomputing from function-local state that may shadow values).
- Bind handlers using named functions (not inline closures) to avoid accidental rebinding or `this` scoping problems.

---

## Recommended immediate tasks (priority order — Quick Wins / Sprint 1 carryover)
1. Fix gallery navigation bug (blocker) — estimate 1–2 hours. Deliverable: modal next/prev cycles through tele_1..tele_5.
2. Verify all `tele_*` images are unique and correctly sized for web (compress to ~80–200 KB each depending on visual fidelity) — estimate 1–2 hours.
3. Push current branch to GitHub and verify GitHub Pages preview (GH Actions warning noted) — estimate 30–60 minutes.
4. Run responsive audit across project pages (desktop/tablet/mobile) and correct spacing/font scaling issues found — estimate 3–6 hours depending on failures.

Deliverables for these tasks
- Working telemetry modal gallery with full image set.
- Compressed, correctly referenced images in assets folder.
- Deployed preview on GitHub Pages with correct base path and sitemap updated.
- Responsive fixes merged into main branch.

KPIs
- Modal gallery: next/prev latency < 50ms locally; no JS errors in console.
- CLS score: keep layout-shift negligible for hero text and banners (Lighthouse target: < 0.1 CLS contribution).
- Mobile performance: Lighthouse performance score > 70 for portfolio pages.

---

## Sprint 3 scope and timeline (proposed)
Sprint length: 2 weeks (10 working days)

Week 1 (Days 1–5):
- Day 1: Fix gallery bug; validate assets; quick deploy to GitHub Pages preview.
- Day 2: Responsive audit (mobile first), fix layout breakages and spacing.
- Day 3: Content review + rewrite for MD-HI and Telemetry (tone/clarity), finalize metric labels.
- Day 4: Implement image lightbox accessibility (keyboard navigation, ARIA labels) and test with keyboard-only navigation.
- Day 5: Buffer / QA / small fixes.

Week 2 (Days 6–10):
- Day 6: Apply pattern to next 1–2 project pages (CNC Simulator, QCar).
- Day 7: Performance tuning (image formats, preconnect, critical CSS review).
- Day 8: Accessibility testing (contrast, semantics, skip links) and fixes.
- Day 9: Final polish, deploy to GitHub Pages, update sitemap & manifest.
- Day 10: Launch checklist and soft launch; monitor for issues.

Adjust estimates if scope increases; if you want a stricter schedule, reduce tasks per sprint.

---

## Deployment & GitHub Pages notes
- Ensure repository settings point GitHub Pages to the branch and folder (most common: gh-pages branch or main/docs).
- Update `sitemap.xml` and OG URLs to your GitHub Pages base URL (e.g., `https://<username>.github.io/<repo>/...`).
- Verify Actions runner: you mentioned older version flagged in Actions tab — review the workflow `.github/workflows/*` for deprecated actions or Node versions and update as needed before trusting automated deploys.

Quick checklist before push:
- Confirm base path for assets if site is served from sub-path (GitHub Pages repo path). If using a base path, prefixed asset URLs may be required.
- Confirm manifest/icons are present and referenced paths resolve.
- Test locally with a simple static server (e.g., `python -m http.server` or Live Server) to simulate relative paths.

---

## Tests & validation
- Manual: open telemetry page, open gallery, use prev/next, keyboard left/right, escape to close; check for console errors.
- Lighthouse: run audits on home, portfolio, MD-HI, telemetry pages; address critical failures.
- Responsive: test at 320, 375, 768, 1024, 1440 widths.
- Accessibility: run axe or Lighthouse accessibility checks; fix semantic issues.

---

## TODO list snapshot (suggested prioritization)
High priority
- Fix telemetry gallery navigation (blocker).
- Verify and compress telemetry images tele_1..tele_5.
- Push current branch and validate GitHub Pages preview.

Medium
- Apply case-study layout to remaining projects.
- Responsive fixes across pages.
- Accessibility improvements (ARIA, keyboard navigation).

Low
- PWA improvements and manifest icons.
- Add analytics / contact form validation.

(If you want, the next step is to update the repository `todos` table with these items and set the first one to `in_progress` so our session DB tracks progress.)

---

## Implementation notes for dev who picks this up
1. JS gallery
   - Primary file: [js/main.js](/D:/Portfolio/js/main.js). Focus on `galleryMedia`, `openGallery()`, `updateGallery()` and event listener bindings for `.gallery-prev` and `.gallery-next` (search for `updateGallery` and `.gallery-next` in file).

2. HTML
   - Telemetry page: [projects/project-telemetry.html](/D:/Portfolio/projects/project-telemetry.html) — the body has `data-gallery="telemetry"` which drives which media set to load.

3. CSS
   - Gallery controls styling in [css/style.css](/D:/Portfolio/css/style.css) — ensure `pointer-events` and `z-index` are not preventing clicks.

4. Assets
   - Check `D:\Portfolio\assets\images\` for `tele_*.webp` files. If missing, add them and commit.

5. Debugging pattern
   - Add `console.log` dumps liberally while reproducing; remove after fix. Keep changes minimal and targeted.

---

## Final notes & handover contact
- This handover collects the current state at the end of the Sprint 3 work-in-progress session. It is meant to be a living document — updates should be committed to the repository as progress is made.
- If you want, mark the gallery bug as in-progress in the session DB (`todos`) and it can be tracked programmatically.

--

Created at D:\Portfolio\handover.md
