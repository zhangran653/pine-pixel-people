"""End-to-end reconstruction tests. The synthetic reference is ray-cast independently."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "tools" / "turnaround_to_slices.py"
STUDIES = ROOT / "studies" / "turnaround"


def convert(manifest, destination, *options, checked=True):
    return subprocess.run(
        [sys.executable, str(CLI), str(manifest), "--out", str(destination), *options],
        capture_output=True,
        text=True,
        check=checked,
    )


def save_json(path, doc):
    path.write_text(json.dumps(doc), encoding="utf-8")


def reference_view(angle):
    # An off-centre ellipsoid on two unequal legs and a side satchel.
    # Positive X faces the viewer at zero degrees, and projects to the right in profile.
    u = np.arange(56)[None, :] + 0.5 - 28
    z = 36 - (np.arange(42)[:, None] + 0.5)
    theta = np.deg2rad(angle)
    image = np.zeros((42, 56, 4), dtype=np.uint8)
    image[:, :, :3] = [213, 51, 183]  # Nonzero RGB under transparent padding.
    for depth in np.linspace(-20, 20, 221):
        x = np.sin(theta) * u + np.cos(theta) * depth
        y = np.cos(theta) * u - np.sin(theta) * depth
        legs = (((x + 0.5) / 3.7) ** 2 + ((y + 4.2) / 2.6) ** 2 < 1) | (
            ((x - 0.8) / 4.6) ** 2 + ((y - 4) / 2.8) ** 2 < 1
        )
        lower = legs & (z >= 0) & (z < 13)
        body = ((x + 0.7) / 6.5) ** 2 + ((y + 0.3) / 8.2) ** 2 + (
            (z - 16) / 9.5
        ) ** 2 < 1
        head = ((x - 1.2) / 6.1) ** 2 + ((y + 1) / 6.7) ** 2 + ((z - 26) / 6.2) ** 2 < 1
        bag = ((x + 1.6) / 4.15) ** 2 + ((y - 8.0) / 4.4) ** 2 + (
            (z - 18.5) / 4.1
        ) ** 2 < 1
        # Face, rear panel and asymmetric hat stripe distinguish mirrored projections.
        image[lower] = [58, 68, 85, 255]
        image[body] = [65, 124, 117, 255]
        image[body & (x < -3.3) & (z > 15)] = [116, 144, 96, 255]
        image[head] = [166, 103, 82, 255]
        image[head & (z > 28.7)] = [80, 55, 51, 255]
        image[head & (x > 3.5) & (z > 24) & (z < 26.5)] = [204, 139, 91, 255]
        image[bag] = [188, 131, 48, 255]
    return Image.fromarray(image)


def fixture(folder):
    sheet = Image.new("RGBA", (224, 42), (164, 20, 17, 0))
    views = []
    for index, (name, angle) in enumerate(
        [("front", 0), ("profile", 90), ("back", 180), ("oblique", 45)]
    ):
        tile = reference_view(angle)
        sheet.paste(tile, (index * 56, 0))
        views.append(
            dict(
                id=name,
                angle=angle,
                crop=[index * 56, 0, (index + 1) * 56, 42],
                role="holdout" if name == "oblique" else "input",
                originX=0.5,
            )
        )
    sheet.save(folder / "sheet.png")
    doc = dict(format="pine.turnaround/1", source="sheet.png", height=32, views=views)
    save_json(folder / "study.json", doc)
    return doc


class TurnaroundTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temp.name)
        cls.doc = fixture(cls.root)
        cls.manifest = cls.root / "study.json"
        cls.out = cls.root / "original"
        convert(cls.manifest, cls.out, "--colors", "24")

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_identical_drawings_can_describe_different_volumes(self):
        # Two equally coloured cubes. Re-pairing their depth and lateral
        # locations cannot change any cardinal view, but moves their shadows
        # onto completely different rays at 45 degrees.
        def shadow(pairing, angle):
            theta = np.deg2rad(angle)
            return {
                (
                    z,
                    int(
                        np.floor(
                            12.5 + (cx + dx) * np.sin(theta) + (cy + dy) * np.cos(theta)
                        )
                    ),
                )
                for cx, cy in pairing
                for dx in (-1, 0, 1)
                for dy in (-1, 0, 1)
                for z in range(3)
            }

        first = [(4, 4), (-4, -4)]
        second = [(4, -4), (-4, 4)]
        for angle in (0, 90, 180):
            self.assertEqual(shadow(first, angle), shadow(second, angle))
        self.assertFalse(shadow(first, 45) & shadow(second, 45))

    def test_model_and_orthographic_silhouettes(self):
        model = json.loads((self.out / "model.json").read_text())
        self.assertEqual(model["format"], "pine.slices/1")
        nx, ny, nz = model["dimensions"]
        self.assertEqual(nz, 32)
        self.assertGreater(nx, 0)
        self.assertGreater(ny, 0)
        self.assertLessEqual(len(model["palette"]), 24)
        for color in model["palette"]:
            self.assertRegex(color, r"^#[0-9a-fA-F]{6}$")
        voxels = np.full((nz, ny, nx), -1, dtype=np.int16)
        for z, y, start, end, ink in model["runs"]:
            self.assertTrue(0 <= z < nz and 0 <= y < ny and 0 <= start <= end < nx)
            self.assertTrue(0 <= ink < len(model["palette"]))
            self.assertTrue((voxels[z, y, start : end + 1] == -1).all())
            voxels[z, y, start : end + 1] = ink
        occupancy = voxels >= 0
        self.assertGreater(occupancy.mean(), 0.055)
        self.assertLess(occupancy.mean(), 0.78)
        self.assertFalse(np.array_equal(occupancy, occupancy[:, ::-1, :]))
        metrics = json.loads((self.out / "metrics.json").read_text())["views"]
        for name in ["front", "profile", "back", "oblique"]:
            view = metrics[name]
            self.assertEqual(view["role"], "holdout" if name == "oblique" else "input")
            rendered = np.asarray(
                Image.open(self.out / (name + ".png")).convert("RGBA")
            )
            target = np.asarray(
                Image.open(self.out / (name + "-target.png")).convert("RGBA")
            )
            self.assertEqual(rendered.shape, target.shape)
            r = rendered[:, :, 3] > 0
            t = target[:, :, 3] > 0
            overlap = r & t
            union = (r | t).sum()
            iou = overlap.sum() / union
            self.assertAlmostEqual(iou, view["silhouetteIou"], places=4)
            self.assertEqual(int(overlap.sum()), view["overlapPixels"])
            self.assertEqual(int(t.sum()), view["referencePixels"])
            self.assertGreater(iou, 0.73 if name == "oblique" else 0.80, name)
            mae = np.abs(
                rendered[overlap, :3].astype(float) - target[overlap, :3].astype(float)
            ).mean()
            self.assertAlmostEqual(mae, view["colorMae"], places=4)
            self.assertLess(view["colorMae"], 72, name)
            if name in {"front", "profile", "back"}:
                # Cast axis-aligned rays through the *exported* slices, independent
                # of the converter's preview. This catches reversed eyes or axes in
                # the serialized payload even when PNG and metrics agree.
                rays = {
                    "front": voxels[:, :, ::-1],
                    "profile": voxels.transpose(0, 2, 1),
                    "back": voxels[:, ::-1, :],
                }[name]
                valid = (rays >= 0).any(axis=-1)[::-1]
                indices = (rays >= 0).argmax(axis=-1)
                frontmost = np.take_along_axis(rays, indices[..., None], axis=-1)[
                    ::-1, :, 0
                ]
                rgb = np.array(
                    [list(bytes.fromhex(c[1:])) for c in model["palette"]],
                    dtype=np.uint8,
                )
                expected = rgb[frontmost[valid]]
                actual = rendered[r, :3]

                def trim(mask):
                    cols = np.flatnonzero(mask.any(axis=0))
                    return mask[:, cols[0] : cols[-1] + 1]

                np.testing.assert_array_equal(trim(valid), trim(r))
                np.testing.assert_array_equal(expected, actual)

    def test_holdout_never_changes_slices(self):
        isolated = self.root / "isolation"
        isolated.mkdir()
        fixture(isolated)
        image = Image.open(isolated / "sheet.png").convert("RGBA")
        patch = Image.new("RGBA", (56, 42), (2, 88, 31, 0))
        patch.paste((10, 237, 45, 255), (7, 5, 17, 36))
        image.paste(patch, (168, 0))
        image.save(isolated / "sheet.png")
        out = isolated / "out"
        convert(isolated / "study.json", out, "--colors", "24")
        self.assertEqual(
            (self.out / "model.json").read_bytes(), (out / "model.json").read_bytes()
        )
        a = json.loads((self.out / "metrics.json").read_text())["views"]
        b = json.loads((out / "metrics.json").read_text())["views"]
        self.assertEqual(a["front"], b["front"])
        self.assertNotEqual(
            a["oblique"]["silhouetteIou"], b["oblique"]["silhouetteIou"]
        )

    def test_invalid_manifest(self):
        import copy

        cases = []
        bad = copy.deepcopy(self.doc)
        bad["height"] = 0
        cases.append(bad)
        bad = copy.deepcopy(self.doc)
        bad["views"] = [bad["views"][0], bad["views"][2]]
        cases.append(bad)
        bad = copy.deepcopy(self.doc)
        bad["views"][1]["id"] = "front"
        cases.append(bad)
        bad = copy.deepcopy(self.doc)
        bad["views"][1]["crop"] = [-4, 0, 118, 43]
        cases.append(bad)
        bad = copy.deepcopy(self.doc)
        bad["format"] = "pine.turnaround/9"
        cases.append(bad)
        Image.new("L", (17, 19), 255).save(self.root / "wrong.png")
        bad = copy.deepcopy(self.doc)
        bad["alphaMask"] = "wrong.png"
        cases.append(bad)
        for i, case in enumerate(cases):
            with self.subTest(case=i):
                manifest = self.root / f"bad-{i}.json"
                save_json(manifest, case)
                run = convert(manifest, self.root / f"bad-out-{i}", checked=False)
                self.assertNotEqual(run.returncode, 0)
                self.assertFalse((self.root / f"bad-out-{i}" / "model.json").exists())

    def test_real_masked_portrait_is_reproducible(self):
        for age in ["adult", "child", "baby", "smooth-adult", "smooth-baby"]:
            doc = json.loads((STUDIES / (age + ".json")).read_text())
            self.assertEqual(
                [v["angle"] for v in doc["views"] if v["role"] == "holdout"], [45]
            )
            self.assertTrue((STUDIES / doc["source"]).is_file())
        a = self.root / "smooth-a"
        b = self.root / "smooth-b"
        manifest = STUDIES / "smooth-baby.json"
        convert(manifest, a)
        convert(manifest, b)
        self.assertEqual(
            (a / "model.json").read_bytes(), (b / "model.json").read_bytes()
        )
        metrics = json.loads((a / "metrics.json").read_text())["views"]
        self.assertEqual(metrics["oblique"]["role"], "holdout")
        self.assertGreater(metrics["oblique"]["referencePixels"], 60)
        self.assertTrue(0 < metrics["oblique"]["silhouetteIou"] <= 1)


if __name__ == "__main__":
    unittest.main()
