"""Export a bounded, traceable preview without loading the large source datasets.

Only small summary tables and the first 168 rows of four selected segment CSVs
are read. No repository code is executed and no filters are recomputed.
"""
import csv
from datetime import datetime, timedelta
import io
from itertools import islice
import json
import math
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
COUNT = 168
SEGMENTS = {"NO2": 2, "O3": 2, "PM10": 2, "PM2_5": 3}


def prepare(archive):
    result = {"source": "TURDATA project exports", "sensor": "S10", "series": {}}
    with zipfile.ZipFile(archive) as source:
        prefix = next(n.rsplit("/", 1)[0] + "/" for n in source.namelist()
                      if n.count("/") == 1 and n.endswith("/README.md"))
        for pollutant, segment in SEGMENTS.items():
            path = f"data/processed/selected_segments/{pollutant}_S10_segment_{segment}.csv"
            with source.open(prefix + path) as stream:
                rows = list(islice(csv.DictReader(io.TextIOWrapper(stream, encoding="utf-8-sig")), COUNT))
            if len(rows) != COUNT:
                raise ValueError(f"Expected {COUNT} samples in {path}")
            times = [datetime.fromisoformat(row["dt_beg_utc"]) for row in rows]
            if any(b - a != timedelta(hours=1) for a, b in zip(times, times[1:])):
                raise ValueError(f"Non-hourly or duplicated samples in {path}")
            values = [[float(row["value_raw"]), float(row["value_sg"])] for row in rows]
            if not all(math.isfinite(v) for pair in values for v in pair):
                raise ValueError(f"Missing or non-finite values in {path}")
            if any(row["sensor_id"] != "S10" or row["pollutant"] != pollutant for row in rows):
                raise ValueError(f"Mixed signal identities in {path}")
            result["series"][pollutant] = {
                "label": {"NO2": "NO₂", "O3": "O₃", "PM10": "PM₁₀", "PM2_5": "PM₂.₅"}[pollutant],
                "name": {"NO2": "Nitrogen dioxide", "O3": "Ozone", "PM10": "Coarse particulate matter", "PM2_5": "Fine particulate matter"}[pollutant],
                "unit": "ppb" if pollutant in ("NO2", "O3") else "µg/m³",
                "source": path, "sourceCRC": f"{source.getinfo(prefix + path).CRC:08x}",
                "start": times[0].isoformat(), "values": values,
            }
    return result


if __name__ == "__main__":
    archive = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs/telemetry_pbl_group3-master.zip"
    output = ROOT / "js/telemetry-data.js"
    output.write_text("// Selected repository exports; value_raw is already preprocessed.\nwindow.TELEMETRY_DATA = " + json.dumps(prepare(archive), ensure_ascii=False, separators=(",", ":"), allow_nan=False) + ";\n", encoding="utf-8")
    print(f"Prepared {output.name} ({output.stat().st_size:,} bytes; {COUNT} hourly samples per pollutant)")
