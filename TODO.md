# Portfolio Todo

## Sprint 2: Design system and hero polish

- [x] Establish brand tokens for colors, typography, spacing, radius, and shadows.
- [x] Create a living style guide page (`styleguide.html`) and reference tokens with a `tokens.json` file.
- [x] Polish the homepage hero: refine image proportion, typography, and layout balance.
- [x] Improve responsive typography and type hierarchy across the main pages.
- [x] Establish a stronger, reusable button system and consistent hover/focus CTA states.
- [x] Tighten homepage and section spacing.
- [x] Standardize project detail pages with a consistent CTA style, heading hierarchy, and accessible structure.
- [x] Fix nav hover contrast issues and add visible current-page state on the primary menu.
- [x] Add skip links plus `main` anchors for accessibility across the site.

### Delivered in Sprint 2

- Refined the homepage hero image proportion and heading hierarchy.
- Built reusable `.btn`, `.btn-primary`, `.btn-secondary`, and `.btn-outline` styles.
- Updated project pages and portfolio cards to use shared design tokens and button styles.
- Added skip links, main-content anchors, and current-page navigation styling.

## Sprint 3: polish, copy, and release readiness

Status: complete. Main page structure and content, contact form delivery, accessibility/responsive QA, performance follow-up, and GitHub Pages deployment have been completed. Analytics remains deferred and is not a Sprint 3 blocker.

- [x] Audit responsive layouts across mobile and tablet, then fix breakpoints for the hero, project cards, nav, and form pages.
- [x] Review and refine site copy and project storytelling, including the homepage, project pages, and Skills content.
- [x] Run browser-based performance/resource checks on the homepage, Portfolio, Contact, and representative project pages. Record the Lighthouse limitation and fix the measured CNC video preload issue.
- [x] Complete accessibility QA across key pages: keyboard use, focus visibility, contrast, semantics, form feedback, and modal behavior.
- [x] Confirm the GitHub Pages workflow and deployment settings are correct after the workflow fix.
- [x] Improve contact conversion and functionality: centered CTA, dialog form, input validation, and Formspree delivery. Owner confirmed the deployed form works.
- [x] Do a final visual consistency check at representative mobile, tablet, and desktop widths; fix confirmed issues.
- [x] Update this checklist with QA results, then commit and push the current local portfolio changes.
- [ ] Add optional analytics or tracking only if visit/behavior measurement is wanted. This is deferred and not a Sprint 3 blocker.

### Sprint 3 completion criteria

- Performance/resource-check results and the missing-Chrome Lighthouse limitation are recorded; the measured 36.8 MB eager video download was prevented.
- Accessibility QA and final responsive/visual checks are recorded, with confirmed issues fixed.
- Current portfolio changes are committed and pushed; deployment status should be confirmed from the Pages workflow.

### Final QA results

- Responsive check: nine pages at 320, 390, 768, and 1280 CSS pixels (36 page/viewport combinations) showed no horizontal overflow. The homepage hero and selected-project grid render in two columns at 1280px; the About skills grid renders in three.
- Accessibility structure check: all nine pages had one `h1` and one `main`, no duplicate IDs, missing image alt attributes, skipped heading levels, or unlabeled form fields. Earlier keyboard and interaction checks covered focus visibility, Contact form validation/dialog behavior, Skills domain selection, and Telemetry gallery navigation.
- Performance limitation: Lighthouse CLI was available, but could not run because no local Chrome installation was present. Local unthrottled browser timings are not treated as Lighthouse scores.
- Performance fix: the CNC video is 36,813,884 bytes. `preload="metadata"` caused the browser to fetch the full file during page load; changing it to `preload="none"` was verified to result in zero video bytes requested until playback.
- JavaScript syntax and `git diff --check` passed.

See [handover.md](./handover.md) for the delivered work, verification notes, and current handoff context.
