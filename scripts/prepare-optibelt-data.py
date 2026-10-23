"""Prepare a small, traceable browser dataset from the owner's OPTIBELT archive.

Usage: python scripts/prepare-optibelt-data.py [path/to/OPTIBELT-main.zip]
The source archive stays local; only selected numeric demo data is exported.
"""
import csv
import hashlib
import io
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def prepare(archive):
    result = {"source": "OPTIBELT repository demo datasets", "archive_sha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "motor": {}, "stockpiles": {}}
    with zipfile.ZipFile(archive) as source:
        prefix = next(n[:-len("README.md")] for n in source.namelist() if n.count("/") == 1 and n.endswith("/README.md"))
        for scenario in ("healthy", "warning", "fault"):
            path = f"data/scenarios/motor_replay/scenario_{scenario}.csv"
            rows = list(csv.reader(io.StringIO(source.read(prefix + path).decode("utf-8-sig"))))
            header, rows = [v.lower() for v in rows[0]], rows[1:]
            column = header.index("hi_pct")
            indices = sorted({round(i * (len(rows) - 1) / 120) for i in range(121)})
            samples = [{"row": i + 1, "health": float(rows[i][column])} for i in indices]
            result["motor"][scenario] = {"source": path, "rowCount": len(rows), "samples": samples}
        base = "data/samples/lidar/reference_stockpiles/"
        summaries = csv.DictReader(io.StringIO(source.read(prefix + base + "optibelt_matlab_dataset_summary.csv").decode()))
        for summary in summaries:
            path = base + summary["csv_file"]
            rows = list(csv.DictReader(io.StringIO(source.read(prefix + path).decode())))
            points = [[round(float(row[k]), 2) for k in ("x", "y", "z")] for row in rows]
            result["stockpiles"][summary["state"].lower()] = {
                "source": path, "volumeCm3": float(summary["target_volume_cm3"]),
                "pointCount": int(summary["point_count"]), "points": points,
            }
    return result


if __name__ == "__main__":
    archive = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs/OPTIBELT-main.zip"
    output = ROOT / "js/optibelt-data.js"
    output.write_text("// Generated from repository replay files and synthetic LiDAR references.\nwindow.OPTIBELT_DATA = " + json.dumps(prepare(archive), separators=(",", ":"), allow_nan=False) + ";\n", encoding="utf-8")
    print(f"Prepared {output.name} ({output.stat().st_size:,} bytes)")
