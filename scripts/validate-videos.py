"""Fail deployment if a required progressive MP4 is missing or not fast-start."""
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
VIDEOS = ("cnc-optimized.mp4", "BibleQuest-optimized.mp4")


def validate(path):
    size = path.stat().st_size
    atoms = {}
    with path.open("rb") as stream:
        offset = 0
        while offset + 8 <= size:
            stream.seek(offset)
            length, kind = struct.unpack(">I4s", stream.read(8))
            header = 8
            if length == 1:
                length = struct.unpack(">Q", stream.read(8))[0]
                header = 16
            elif length == 0:
                length = size - offset
            if length < header or offset + length > size:
                raise ValueError(f"{path.name}: truncated/invalid MP4 atom")
            atoms.setdefault(kind, offset)
            offset += length
    if not all(kind in atoms for kind in (b"ftyp", b"moov", b"mdat")):
        raise ValueError(f"{path.name}: missing MP4 headers/media")
    if atoms[b"moov"] > atoms[b"mdat"]:
        raise ValueError(f"{path.name}: metadata is at the end; encode with +faststart")
    if size > 15_000_000:
        raise ValueError(f"{path.name}: exceeds the 15 MB project-demo budget")
    print(f"OK {path.name}: {size:,} bytes; metadata before video data")


if __name__ == "__main__":
    for name in VIDEOS:
        path = ROOT / "assets" / "images" / name
        if not path.is_file():
            raise SystemExit(f"Missing {path}. Run the video encoder and commit both optimized MP4s.")
        validate(path)
