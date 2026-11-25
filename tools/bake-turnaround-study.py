"""Rebuild browser samples and both ablations from the original drawings.

Run from any directory with the converter's NumPy and Pillow dependencies.
The portable, uncompressed JSON remains available via the individual CLI.
"""

import gzip
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from turnaround_to_slices import convert

STUDY = Path(__file__).resolve().parents[1] / "studies" / "turnaround"
SAMPLES = ("smooth-baby", "smooth-adult", "adult", "child", "baby")


def main():
    previews = STUDY / "previews"
    previews.mkdir(exist_ok=True)
    results = {}
    with TemporaryDirectory() as tmp:
        for name in SAMPLES:
            manifest = STUDY / f"{name}.json"
            area = Path(tmp) / name
            hull = convert(manifest, area / "hull", rounding=0)
            selected = convert(manifest, area / "rounded", rounding=0.75)
            results[name] = {**selected, "uncutHull": hull["summary"]}
            with (previews / f"{name}.json.gz").open("wb") as out:
                with gzip.GzipFile(
                    filename="", mode="wb", fileobj=out, mtime=0, compresslevel=7
                ) as archive:
                    archive.write((area / "rounded" / "model.json").read_bytes())
    (STUDY / "results.json").write_text(
        json.dumps(results, indent=2, allow_nan=False) + "\n"
    )


if __name__ == "__main__":
    main()
