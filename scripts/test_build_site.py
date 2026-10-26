"""Regression tests for the public/private boundary and project base path."""
import importlib.util
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("build_site", Path(__file__).with_name("build-site.py"))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class PublishingTests(unittest.TestCase):
    def manifest(self, files):
        with tempfile.TemporaryDirectory(prefix="portfolio-manifest-test-") as folder:
            path = Path(folder) / "files.json"
            path.write_text(json.dumps(files), encoding="utf-8")
            return builder.load_manifest(path)

    def test_sources_and_private_documents_rejected(self):
        for path in ["../secret.txt", "/secret.txt", ".env", "assets/docs/private.pdf",
                     "source-assets/images/photo.png", "docs/handover.md",
                     "assets/images/cnc.mp4", "assets/images/normal-images/photo.png"]:
            with self.subTest(path=path), self.assertRaises(ValueError):
                self.manifest([path])

    def test_duplicates_rejected(self):
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            self.manifest(["index.html", "index.html"])

    def test_project_url_resolution(self):
        self.assertEqual(
            builder.resolve_reference("projects/project-cnc-simulator.html", "../portfolio.html"),
            ("portfolio.html", ""),
        )
        self.assertEqual(builder.resolve_reference("404.html", "/Portfolio/"), ("index.html", ""))
        self.assertEqual(
            builder.resolve_reference("index.html", "css/style.css?v=1"), ("css/style.css", "")
        )

    def test_site_root_escape_rejected(self):
        for path in ["/favicon.ico", "../../secret.txt", "javascript:alert(1)", "//evil.example/a.js"]:
            with self.subTest(path=path), self.assertRaises(ValueError):
                builder.resolve_reference("index.html", path)

    def test_only_allowlisted_files_are_copied(self):
        with tempfile.TemporaryDirectory(prefix="portfolio-stage-test-") as folder:
            root = Path(folder)
            source = root / "source"
            source.mkdir()
            (source / "index.html").write_text("public")
            (source / "secret.txt").write_text("not for publication")
            output = root / "output"
            builder.stage_site(source, output, ["index.html"])
            self.assertEqual({p.name for p in output.iterdir()}, {"index.html", ".nojekyll"})

    def test_missing_asset_does_not_create_artifact(self):
        with tempfile.TemporaryDirectory(prefix="portfolio-stage-test-") as folder:
            root = Path(folder)
            output = root / "output"
            with self.assertRaisesRegex(ValueError, "Missing asset"):
                builder.stage_site(root, output, ["missing.html"])
            self.assertFalse(output.exists())

    def test_markup_security_checks(self):
        page = builder.Page()
        page.feed('<script>alert(1)</script><p style="color:red" onclick="alert(1)">Hi</p>')
        self.assertEqual(len(page.errors), 2)

    def test_current_site_builds(self):
        files = builder.load_manifest(builder.ROOT / "scripts/public-files.json")
        with tempfile.TemporaryDirectory(prefix="portfolio-build-test-") as folder:
            output = Path(folder) / "site"
            builder.stage_site(builder.ROOT, output, files)
            self.assertEqual(builder.validate_site(output, files), 12)

    def test_social_icons_on_every_public_page(self):
        class FooterLinks(HTMLParser):
            def __init__(self):
                super().__init__()
                self.links = []
                self.icons = []

            def handle_starttag(self, tag, attributes):
                attributes = dict(attributes)
                if tag == "a" and "contact-social-link" in attributes.get("class", "").split():
                    self.links.append(attributes)
                if tag == "span" and "data-social" in attributes:
                    self.icons.append(attributes)

        expected = ["mailto:s.mpofu.m.01@gmail.com",
                    "https://www.linkedin.com/in/sibusiso-mpofu-595b492bb",
                    "https://wa.me/26775365156",
                    "https://github.com/sbuda47/Portfolio"]
        for name in builder.load_manifest(builder.ROOT / "scripts/public-files.json"):
            if not name.endswith(".html"):
                continue
            with self.subTest(page=name):
                source = (builder.ROOT / name).read_text(encoding="utf-8")
                footer = re.search(r"<footer\b[\s\S]*?</footer>", source)
                self.assertIsNotNone(footer)
                markup = footer.group(0)
                parsed = FooterLinks()
                parsed.feed(markup)
                self.assertEqual([link["href"] for link in parsed.links], expected)
                self.assertTrue(all(link.get("aria-label") for link in parsed.links))
                self.assertEqual([icon["data-social"] for icon in parsed.icons],
                                 ["email", "linkedin", "whatsapp", "github"])
                self.assertTrue(all(icon.get("aria-hidden") == "true" for icon in parsed.icons))
                self.assertEqual("contact-footer-label" in markup, name == "contact.html")


if __name__ == "__main__":
    unittest.main()
