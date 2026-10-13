"""Repository tracking-boundary and credential-pattern regression checks."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("repository", Path(__file__).with_name("validate-repository.py"))
repository = importlib.util.module_from_spec(spec)
spec.loader.exec_module(repository)


class RepositoryTests(unittest.TestCase):
    def test_unintended_file_rejected(self):
        with self.assertRaisesRegex(ValueError, "unexpected"):
            repository.validate_inventory(["index.html", "handover.md"], ["index.html"])

    def test_missing_approved_file_rejected(self):
        with self.assertRaisesRegex(ValueError, "missing"):
            repository.validate_inventory([], ["index.html"])

    def test_duplicates_rejected(self):
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            repository.validate_inventory(["index.html"], ["index.html", "index.html"])

    def test_valid_inventory(self):
        repository.validate_inventory(["index.html", "README.md"], ["README.md", "index.html"])

    def test_common_secret_patterns_detected_without_values(self):
        fixtures = [
            "ghp_" + "a" * 36,
            "github_pat_" + "a" * 36,
            "AKIA" + "A" * 16,
            "AIza" + "a" * 32,
            "sk-" + "proj-" + "a" * 35,
            "-----BEGIN " + "PRIVATE KEY-----",
        ]
        for value in fixtures:
            with self.subTest(kind=value.split("_")[0]):
                labels = repository.find_secrets(value)
                self.assertTrue(labels)
                self.assertNotIn(value, str(labels))

    def test_public_form_endpoint_not_a_secret(self):
        self.assertEqual(repository.find_secrets("https://formspree.io/f/xwlvobrr"), [])


if __name__ == "__main__":
    unittest.main()
