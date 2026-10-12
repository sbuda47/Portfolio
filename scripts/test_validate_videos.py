"""Small fixture tests for the deployment guard (no third-party dependencies)."""
import importlib.util
from pathlib import Path
import struct
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("validator", Path(__file__).with_name("validate-videos.py"))
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def atom(kind, data=b"test"):
    return struct.pack(">I4s", len(data) + 8, kind) + data


class VideoValidationTests(unittest.TestCase):
    def validate(self, content):
        with tempfile.TemporaryDirectory(prefix="portfolio-video-test-") as folder:
            path = Path(folder) / "fixture.mp4"
            path.write_bytes(content)
            validator.validate(path)

    def test_fast_start(self):
        self.validate(atom(b"ftyp") + atom(b"moov") + atom(b"mdat"))

    def test_metadata_at_end_rejected(self):
        with self.assertRaisesRegex(ValueError, "metadata is at the end"):
            self.validate(atom(b"ftyp") + atom(b"mdat") + atom(b"moov"))

    def test_missing_media_rejected(self):
        with self.assertRaisesRegex(ValueError, "missing MP4"):
            self.validate(atom(b"ftyp") + atom(b"moov"))

    def test_truncated_file_rejected(self):
        with self.assertRaisesRegex(ValueError, "truncated"):
            self.validate(atom(b"ftyp") + atom(b"moov") + atom(b"mdat")[:-1])


if __name__ == "__main__":
    unittest.main()
