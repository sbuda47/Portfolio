# Portfolio handover

Status date: 2026-10-08

## Current status

Sprint 3 QA and implementation are complete. The release changes were pushed to `main` in commit `64f5d8a`. GitHub Pages deploys from the main branch; check its Actions workflow after each release.

## Completed

- Repaired the Telemetry gallery navigation and standardized project-page back links and case-study layouts.
- Limited homepage featured work to the CNC Simulator and MD-HI projects; removed the duplicate Telemetry experience entry from Skills.
- Refined portfolio copy and project storytelling. Added the BOCRA-sponsored Best Final Year Project award and completed the Skills orb/domain behavior.
- Reworked Contact with centered rotating typewriter prompts, an accessible contact-form dialog, validation, and themed Email, LinkedIn, and WhatsApp SVG links.
- Connected the static HTML/Vanilla JavaScript form to Formspree at `https://formspree.io/f/xwlvobrr`. Submission states cover pending, success, provider errors, and network errors; fields clear only on success. The owner confirmed real deployed delivery. Browser tests did not submit a real message.
- Corrected page heading semantics and fixed the CNC video path.
- Corrected responsive utility breakpoints so tablet and desktop layouts apply at their intended viewport widths.
- Changed the CNC video to `preload="none"` after finding that `preload="metadata"` fetched the entire 36,813,884-byte file on load.

## Sprint 3 QA record

- Responsive: checked Home, About, Portfolio, Contact, Skills, and all four project pages at 320, 390, 768, and 1280 CSS pixels (36 page/viewport combinations). No horizontal overflow remained. The Home hero and featured-project grid render in two columns at 1280px; About's domain grid renders in three.
- Accessibility structure: all nine pages had exactly one `h1` and one `main`; scans found no duplicate IDs, missing image `alt` attributes, heading-level skips, or unlabeled form fields. Keyboard and interaction checks covered skip-link focus, Contact validation/dialog focus and Escape close, Skills selector behavior, and Telemetry gallery navigation.
- Contrast: the visual contrast review found no confirmed failures; an apparent overlay-button issue was a scanner false positive caused by checking inherited parent color instead of the visible text.
- Performance: Lighthouse could not run because no local Chrome installation was available. The unthrottled local browser timings are not Lighthouse scores and are not presented as controlled lab results. The browser resource check identified the eager CNC video download; after the change to `preload="none"`, page load requested zero video bytes.
- Validation: `node --check js/main.js` and `git diff --check` passed.

See [TODO.md](./TODO.md) for the checklist and the recorded Lighthouse limitation.

## Next

Sprint 3 has no remaining required scope. Analytics remains optional and deferred. Organize the next work as Sprint 4 based on priorities from the owner.

## Technical notes

- This is a static HTML/CSS/Vanilla JavaScript site hosted on GitHub Pages. It does not have a custom application backend.
- The Formspree form ID `xwlvobrr` is a public endpoint identifier. No private Formspree token or account credential is stored in the repository.
- Preserve the existing project page routes, form field names (`name`, `email`, `message`), site palette, and current contact-page layout when making follow-up changes.
