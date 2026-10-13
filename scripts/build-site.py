"""Stage only reviewed public files; reject broken links and unsafe markup.

Uses only Python's standard library. Previous builds are archived, not deleted.
"""
from collections import Counter
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import tempfile
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE_URL = "https://sbuda47.github.io/Portfolio/"
PUBLIC_PREFIX = "/Portfolio/"


def is_link(path):
    return path.is_symlink() or getattr(path, "is_junction", lambda: False)()


def load_manifest(path):
    files = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(files, list) or not files:
        raise ValueError("The public-file manifest must be a nonempty list")
    if any(not isinstance(item, str) for item in files):
        raise ValueError("Manifest paths must be strings")
    if len(files) != len(set(files)):
        raise ValueError("Duplicate public-file path")
    for item in files:
        parts = PurePosixPath(item).parts
        if (not parts or "\\" in item or ":" in item or item.startswith("/")
                or ".." in parts or any(part.startswith(".") for part in parts)
                or item != PurePosixPath(item).as_posix()):
            raise ValueError(f"Unsafe manifest path: {item}")
        if parts[0] not in {"assets", "css", "js", "projects"} and len(parts) > 1:
            raise ValueError(f"Development folder cannot be published: {item}")
        if item.startswith("assets/docs/") and item != "assets/docs/Sibusiso_Mpofu_CV.pdf":
            raise ValueError("Only the approved CV can be published from assets/docs")
        if any(part in {"normal-images", "style_examples"} for part in parts):
            raise ValueError(f"Source material cannot be published: {item}")
        if item.endswith(".mp4") and not item.endswith("-optimized.mp4"):
            raise ValueError(f"Original video cannot be published: {item}")
        if Path(item).suffix not in {
            ".html", ".css", ".js", ".json", ".txt", ".xml", ".ico", ".png",
            ".webp", ".svg", ".woff2", ".ttf", ".mp4", ".pdf",
        }:
            raise ValueError(f"Unapproved public file type: {item}")
    return files


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.counts = Counter()
        self.refs = []
        self.images = []
        self.meta = {}
        self.links = {}
        self.forms = []
        self.inputs = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.counts[tag] += 1
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if "style" in attrs or any(key.startswith("on") for key in attrs):
            self.errors.append("Inline style/event handler is incompatible with CSP")
        if tag == "script" and not attrs.get("src"):
            self.errors.append("Inline script is not allowed")
        if tag == "img":
            self.images.append(attrs)
        if tag == "form":
            self.forms.append(attrs)
        if tag == "input":
            self.inputs.append(attrs)
        if tag == "meta":
            key = attrs.get("name") or attrs.get("property") or attrs.get("http-equiv")
            self.meta[key] = attrs.get("content", "")
        if tag == "link":
            self.links[attrs.get("rel")] = attrs.get("href", "")
        if tag == "a" and attrs.get("target") == "_blank":
            if "noopener" not in attrs.get("rel", "").split():
                self.errors.append("External new-tab link is missing noopener")
        for name in ("href", "src", "poster", "action"):
            if attrs.get(name):
                self.refs.append(attrs[name])
        for candidate in attrs.get("srcset", "").split(","):
            if candidate.strip():
                self.refs.append(candidate.strip().split()[0])


def resolve_reference(page, reference):
    url = urlsplit(reference)
    if url.scheme:
        if url.scheme not in {"https", "mailto", "tel", "data"}:
            raise ValueError(f"{page}: unsafe URL scheme in {reference}")
        if url.scheme != "https" or url.netloc != "sbuda47.github.io":
            return None, ""
        path = unquote(url.path)
    elif url.netloc:
        raise ValueError(f"{page}: protocol-relative URL is not allowed")
    else:
        path = unquote(url.path)
    if path.startswith("/"):
        if not path.startswith(PUBLIC_PREFIX):
            raise ValueError(f"{page}: root URL misses /Portfolio/: {reference}")
        path = path[len(PUBLIC_PREFIX):]
        target = PurePosixPath(path or "index.html")
    elif not path:
        target = PurePosixPath(page)
    else:
        target = PurePosixPath(page).parent / path
    parts = []
    for part in target.parts:
        if part == "..":
            if not parts:
                raise ValueError(f"{page}: link escapes the website")
            parts.pop()
        elif part != ".":
            parts.append(part)
    return "/".join(parts), unquote(url.fragment)


def validate_site(folder, files):
    expected = set(files) | {".nojekyll"}
    actual = {path.relative_to(folder).as_posix() for path in folder.rglob("*") if path.is_file()}
    if actual != expected:
        raise ValueError(f"Artifact differs from allowlist: extra={actual - expected}, missing={expected - actual}")
    pages = {}
    errors = []
    for name in files:
        path = folder / name
        if path.suffix != ".html":
            continue
        parser = Page()
        parser.feed(path.read_text(encoding="utf-8"))
        pages[name] = parser
        if parser.counts["h1"] != 1 or parser.counts["main"] != 1:
            errors.append(f"{name}: expected one h1 and one main")
        if len(parser.ids) != len(set(parser.ids)):
            errors.append(f"{name}: duplicate element IDs")
        if any("alt" not in image for image in parser.images):
            errors.append(f"{name}: missing image alt")
        policy = parser.meta.get("Content-Security-Policy", "")
        if not all(value in policy for value in (
            "script-src 'self'", "style-src 'self'", "object-src 'none'",
            "base-uri 'self'", "connect-src 'self' https://formspree.io",
        )) or "'unsafe-inline'" in policy or "'unsafe-eval'" in policy:
            errors.append(f"{name}: security policy missing or weakened")
        if parser.meta.get("referrer") != "strict-origin-when-cross-origin":
            errors.append(f"{name}: referrer policy missing")
        if name != "404.html":
            canonical = SITE_URL + ("" if name == "index.html" else name)
            if parser.links.get("canonical") != canonical:
                errors.append(f"{name}: incorrect canonical URL")
            if not parser.meta.get("description"):
                errors.append(f"{name}: missing description")
            if not any(ref.endswith("privacy.html") for ref in parser.refs):
                errors.append(f"{name}: privacy link missing")
        errors.extend(f"{name}: {error}" for error in parser.errors)
    for name, page in pages.items():
        for reference in page.refs + [page.meta.get("og:image", "")]:
            if not reference:
                continue
            try:
                target, fragment = resolve_reference(name, reference)
                if target is not None and target not in expected:
                    errors.append(f"{name}: missing published dependency {reference}")
                if fragment and target in pages and fragment not in pages[target].ids:
                    errors.append(f"{name}: broken fragment {reference}")
            except ValueError as error:
                errors.append(str(error))
    for name in ("css/style.css", "css/home.css"):
        css = (folder / name).read_text(encoding="utf-8")
        for reference in re.findall(r"url\(['\"]?([^)'\"\s]+)", css):
            target, _ = resolve_reference(name, reference)
            if target and target not in expected:
                errors.append(f"{name}: missing CSS asset {reference}")
    # Galleries use JS template paths instead of literal HTML src attributes.
    js = (folder / "js/main.js").read_text(encoding="utf-8")
    token = "$" + "{n}"
    for reference in re.findall(r"['\x60](\.\./assets/[^'\x60]+)['\x60]", js):
        count = {"tele": 5, "BQ": 6, "CNC": 8}
        variants = [reference]
        if token in reference:
            prefix = reference.rsplit("/", 1)[-1].split("_")[0]
            variants = [reference.replace(token, str(n)) for n in range(1, count[prefix] + 1)]
        for variant in variants:
            target, _ = resolve_reference("projects/gallery.html", variant)
            if target not in expected:
                errors.append(f"main.js: missing gallery media {variant}")
    contact = pages["contact.html"]
    if not any(field.get("name") == "_gotcha" and field.get("type") == "hidden" for field in contact.inputs):
        errors.append("Contact form is missing its honeypot")
    if not contact.forms or contact.forms[0].get("action") != "https://formspree.io/f/xwlvobrr":
        errors.append("Unexpected contact endpoint")
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("scope") != "./" or manifest.get("start_url") != "./index.html":
        errors.append("Web manifest escapes the project base path")
    for icon in manifest.get("icons", []):
        target, _ = resolve_reference("manifest.json", icon["src"])
        if target not in expected:
            errors.append("Web manifest icon is missing")
    urls = [node.text for node in ET.parse(folder / "sitemap.xml").iter()
            if node.tag.endswith("}loc")]
    expected_urls = {SITE_URL + ("" if name == "index.html" else name)
                     for name in pages if name != "404.html"}
    if set(urls) != expected_urls:
        errors.append("Sitemap differs from public page routes")
    if SITE_URL + "sitemap.xml" not in (folder / "robots.txt").read_text():
        errors.append("robots.txt sitemap URL is incorrect")
    if errors:
        raise ValueError("\n".join(errors))
    return len(pages)


def stage_site(source, destination, files):
    if destination.exists():
        raise ValueError("Staging directory must not already exist")
    for name in files:
        path = source / name
        if not path.is_file() or any(is_link(part) for part in [path, *path.parents]):
            raise ValueError(f"Missing asset or symlink is forbidden: {name}")
    destination.mkdir()
    for name in files:
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / name, target)
    (destination / ".nojekyll").touch()


def main():
    files = load_manifest(ROOT / "scripts/public-files.json")
    output = ROOT / "_site"
    archive = ROOT / "output"
    for path in (output, archive):
        if is_link(path) or (path.exists() and not path.is_dir()):
            raise ValueError(f"Unsafe build destination: {path}")
    if output.exists() and any(is_link(path) for path in output.rglob("*")):
        raise ValueError("Symlink/junction in previous build; refusing to follow it")
    archive.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="_site-build-", dir=ROOT) as temporary:
        staging = Path(temporary) / "site"
        stage_site(ROOT, staging, files)
        count = validate_site(staging, files)
        if output.exists():
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
            previous = archive / f"previous-site-{stamp}"
            shutil.copytree(output, previous)
            # Preserve any files removed from the allowlist in the backup.
            # Move individual stale files rather than recursively deleting a tree.
            for old_file in output.rglob("*"):
                if is_link(old_file):
                    raise ValueError(f"Symlink in previous build: {old_file}")
                if old_file.is_file() and old_file.relative_to(output).as_posix() not in set(files) | {".nojekyll"}:
                    retained = previous / "removed" / old_file.relative_to(output)
                    retained.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(old_file), retained)
        # Copying is portable across Windows filesystem boundaries and runners.
        shutil.copytree(staging, output, dirs_exist_ok=True)
        validate_site(output, files)
    size = sum((output / name).stat().st_size for name in files)
    print(f"PASS: {count} pages, {len(files) + 1} published files, {size:,} bytes")
    print("Development notes, source originals, scripts, and drafts are not published.")


if __name__ == "__main__":
    main()
