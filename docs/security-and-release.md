# Security and release readiness

Audit/update date: 14 October 2026. This is a practical static-site review,
not a penetration-test or legal-compliance certificate. The owner approved the
reviewed site's release and repository cleanup on 14 October 2026.

## Implemented protections

- Publishing uses `scripts/public-files.json`, not a recursive upload of the
  repository. The generated artifact contains 71 files (including `.nojekyll`)
  and approximately 7 MB, including the two optimized demos and CV.
- Original recordings/photos and design references are preserved locally in
  ignored `source-assets/`, not re-added to the public repository.
  Existing ignored working notes remain ignored in `docs/internal/`.
  QA outputs and build backups are ignored in `output/`. Working handover/TODO
  files and archived drafts are also ignored. Approved code and public developer
  documentation remain versioned.
- Every public HTML page has a meta Content Security Policy. Scripts/styles,
  fonts, images, and media are self-hosted. Connections/form submissions are
  restricted to this origin and Formspree; inline scripts/event handlers,
  plugin objects, and arbitrary base URLs are not allowed.
- `strict-origin-when-cross-origin` limits cross-origin referrer detail while
  preserving the origin required by Formspree's domain filter.
- Contact feedback uses `textContent`, not HTML insertion. The form has a
  `_gotcha` honeypot and reasonable input lengths. Unicode names are accepted.
  Native POST allows Formspree's hosted CAPTCHA and confirmation flow. There
  are no on-site CAPTCHA scripts or keys; returning with Back restores the
  button but does not claim successful delivery or erase the visitor's input.
  Client-side validation/honeypots are not a substitute for provider-side spam
  filtering or a security boundary against determined automated submissions.
- CI deploys only after validation; pull-request jobs cannot deploy.
  Direct Actions are pinned to verified official-repository commit SHAs.
  Only the deployment job receives Pages-write/OIDC permissions. Checkout does
  not persist credentials; no package installation occurs during publishing.
- Dependabot configuration provides ongoing dependency-review proposals once
  committed. It does not automatically approve or merge updates.

## Checks and limits

The preceding audit scanned current text files and 109 available Git commits
for common credential patterns and found no matches. This is not a guarantee:
unusual secrets, personal information, binary assets, unavailable Git history,
and provider account settings need separate review. The CV was checked for
obvious private-identifier/reference headings and active PDF actions; its copy
is unchanged. The owner must approve its contents for public download.

58 source/served PNG, JPG, and WebP images were checked for GPS EXIF; none was
found. This does not rule out sensitive information visible in an image or
other metadata. 33 relocated tracked media/icon files match their original Git
blobs exactly; originals were moved, not deleted or recompressed.

Nineteen Python regression tests cover the publication boundary, traversal,
missing dependencies, inline markup checks, relative project URLs, a complete
site build, and MP4 container/fast-start failures. Both MP4s pass their real-file
checks. Browser checks covered all 11 public HTML pages at 320, 390, 768, and
1280 CSS pixels, plus key interactions. Ten additional dependency-free Node
tests exercise the native contact handoff, validation, endpoint/method checks,
repeat-submit prevention, and restored-page state. Both demos played after pressing Play,
and each had no attached video source before that action. No real contact POST
was sent. Physical-device, provider-delivery, and deployed performance checks
remain post-release checks unless the owner has explicitly confirmed them.

GitHub Pages does not provide this project with arbitrary response-header
configuration. A meta CSP cannot set `frame-ancestors`, HTTP-only cookies,
report-only policies, or headers such as `X-Frame-Options`. Do not add a
`_headers` file and assume Pages enforces it. The policy reduces risk but does
not establish same-origin isolation from other applications on the same host.
Preview-only `nosniff` headers are not claimed as production headers.

## Repository boundary

`scripts/repository-files.json` additionally controls which files are approved
for Git tracking: public site assets, code, font licenses, build/tests, and
public developer documentation. `scripts/validate-repository.py` checks the
staged index for unapproved/missing files and common credential patterns;
CI repeats it before deployment. Run it locally before committing/pushing:
CI cannot prevent an initial exposure after a file is already pushed.

## Public repository versus published website

The GitHub repository is public. Tracked notes and originals remain accessible
through GitHub and its history even when absent from the website artifact.
This cleanup does not rewrite history or make tracked files confidential.
Never put private client data, passwords, account credentials, unpublished
results, or visitor enquiries in this repository. If an actual credential is
ever exposed, revoke/rotate it first; deleting a file alone is insufficient.

## Account settings and release checks

- On 14 October 2026 the owner reported completing the GitHub Pages Source and
  HTTPS checks. This is owner confirmation, not a direct account-settings read.
- The owner approved the privacy notice, video quality/loading, and other page
  layouts. The first Formspree screenshot showed Form Enabled, Formshield,
  and CAPTCHA enabled; a later project-settings screenshot showed
  `sbuda47.github.io` in Restrict to Domain. Saved provider settings were not
  directly inspected. No provider settings were changed by the agent.
- The owner confirmed messages were delivered after they disabled CAPTCHA.
  The previous AJAX handler did not supply a CAPTCHA response or show the
  hosted challenge. The revised native POST flow follows Formspree's documented
  hosted verification approach; unit/UI checks are not a live-delivery proof.
- Keep the receiving inbox correct and Formshield enabled. Re-enable CAPTCHA,
  send one non-sensitive enquiry from the published Contact page, complete any
  challenge, and confirm Formspree's confirmation, submission list, and inbox
  delivery (including spam). The owner must complete this final verification;
  automated QA does not solve CAPTCHA or send real enquiries.
- Confirm **Deploy GitHub Pages** succeeds for the release commit. Verify the
  privacy page, CV download, and that former notes/original-video URLs return
  404 rather than their original contents.
- Source media and working records are removed only from the latest tree.
  Old commits and the existing feature branch remain public; no force push,
  branch deletion, or history purge is performed for ordinary cleanup.

## References

- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Meta CSP support and limitations](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [Formspree domain restriction and referrer requirements](https://help.formspree.io/articles/form-and-project-settings/restrict-to-domain/)
- [Formspree honeypot filtering](https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering)
- [Formspree hosted CAPTCHA settings](https://help.formspree.io/articles/form-and-project-settings/recaptcha-settings/)
- [Formspree privacy](https://formspree.io/legal/privacy-policy/)
- [GitHub Pages IP logging](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)
