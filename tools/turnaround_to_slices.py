"""Reconstruct a color-indexed slice volume from registered orthographic drawings.

Usage: python tools/turnaround_to_slices.py MANIFEST --out DIR [--rounding 0.75]
Dependencies: Pillow and NumPy. Angles increase from the face toward a profile
with the nose pointing screen-right. Each drawing has its own ground and scale.
"""

import argparse
from dataclasses import dataclass
import json
from math import ceil
from pathlib import Path
import re
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image


@dataclass
class View:
    id: str
    role: str
    angle: float
    rgb: np.ndarray
    mask: np.ndarray
    origin: float

    @property
    def axis(self):
        radians = np.radians(self.angle)
        return np.round([np.sin(radians), np.cos(radians)], 12)


def bounded_int(value, low, high, name):
    if type(value) is not int or not low <= value <= high:
        raise ValueError(f"{name} must be an integer in [{low}, {high}]")
    return value


def read_view(entry, document, directory, height):
    def setting(key, default=None):
        return entry.get(key, document.get(key, default))

    source = setting("source")
    if not isinstance(source, str) or not source:
        raise ValueError(f"{entry['id']}: missing source")
    with Image.open(directory / source) as image:
        bounds = entry.get("crop")
        if not (
            isinstance(bounds, list)
            and len(bounds) == 4
            and all(type(n) is int for n in bounds)
        ):
            raise ValueError(f"{entry['id']}: crop requires four integer coordinates")
        x0, y0, x1, y1 = bounds
        if not (0 <= x0 < x1 <= image.width and 0 <= y0 < y1 <= image.height):
            raise ValueError(f"{entry['id']}: crop outside source image")
        full_size = image.size
        pixels = np.array(image.crop(tuple(bounds)).convert("RGBA"))

    alpha = pixels[:, :, 3]
    if setting("alphaMask") is not None:
        with Image.open(directory / setting("alphaMask")) as matte:
            if matte.size != full_size:
                raise ValueError(
                    f"{entry['id']}: alphaMask must have the dimensions of source"
                )
            foreground = np.asarray(matte.crop(tuple(bounds)).convert("L")) > 127
        foreground &= alpha >= 128
    elif np.any(alpha < 128):
        foreground = alpha >= 128
    else:
        rgb = pixels[:, :, :3].astype(np.int16)
        background = setting("background", {})
        edge = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
        paper = np.asarray(background.get("rgb", np.median(edge, axis=0)), dtype=float)
        tolerance = float(background.get("tolerance", 30))
        if (
            paper.shape != (3,)
            or not np.all((paper >= 0) & (paper <= 255))
            or not 0 <= tolerance <= 255
        ):
            raise ValueError("invalid background RGB or tolerance")
        foreground = np.max(np.abs(rgb - paper), axis=2) > tolerance
    ys, xs = np.nonzero(foreground)
    if not len(xs):
        raise ValueError(f"{entry['id']}: empty foreground")
    left, right = int(xs.min()), int(xs.max()) + 1
    top, bottom = int(ys.min()), int(ys.max()) + 1
    width = max(1, round((right - left) * height / (bottom - top)))
    if width * height > 2_000_000:
        raise ValueError("drawing too wide for the selected height")
    pivot = (right + left) / 2
    if "originX" in entry:
        u = float(entry["originX"])
        if not 0 <= u <= 1:
            raise ValueError("originX must be a fraction of the full crop width")
        pivot = u * pixels.shape[1]
    pixels[:, :, 3] = np.where(foreground, alpha, 0)
    # Pillow resizes RGBA through premultiplied alpha. The matte color cannot
    # contaminate skin or light clothing on the edge of an antialiased image.
    rgba = np.asarray(
        Image.fromarray(pixels[top:bottom, left:right]).resize(
            (width, height), Image.Resampling.LANCZOS
        )
    )
    return View(
        entry["id"],
        entry["role"],
        float(entry["angle"]),
        rgba[:, :, :3],
        rgba[:, :, 3] >= 128,
        (pivot - left) * width / (right - left),
    )


def grid_for(views, height):
    # Intersections of the finite projection strips bound x and y independently
    # of any evaluation image, even when neither input is exactly frontal.
    normals, limits = [], []
    for view in views:
        axis = view.axis
        normals.extend([axis, -axis])
        limits.extend([view.mask.shape[1] - view.origin, view.origin])
    normals = np.array(normals)
    limits = np.array(limits)
    vertices = []
    for i, a in enumerate(normals):
        for j, b in enumerate(normals[:i]):
            pair = np.array([a, b])
            if abs(np.linalg.det(pair)) < 1e-6:
                continue
            vertex = np.linalg.solve(pair, limits[[i, j]])
            if np.all(normals @ vertex <= limits + 1e-7):
                vertices.append(vertex)
    if not vertices:
        raise ValueError(
            "at least two non-parallel, overlapping input projection axes are required"
        )
    rx, ry = np.ceil(np.max(np.abs(vertices), axis=0)).astype(int)
    if height * (2 * rx + 1) * (2 * ry + 1) > 16_000_000:
        raise ValueError(
            "reconstruction exceeds the CPU voxel budget; lower height or separate camera angles"
        )
    return np.meshgrid(np.arange(-rx, rx + 1), np.arange(-ry, ry + 1))


def projection(view, x, y):
    s, c = view.axis
    u = np.floor(view.origin + s * x + c * y + 1e-10).astype(int)
    return u, c * x - s * y


def run_radius(mask):
    """Normalized distance from the middle of each contiguous horizontal run."""
    columns = np.arange(mask.shape[1])
    left = np.maximum.accumulate(np.where(mask, -1, columns), axis=1) + 1
    right = (
        np.minimum.accumulate(np.where(mask, mask.shape[1], columns)[:, ::-1], axis=1)[
            :, ::-1
        ]
        - 1
    )
    return (2 * columns - left - right) / np.maximum(1, right - left + 1)


def rounded_slice(mask, amount, columns):
    if not amount or not mask.any():
        return mask
    radius = run_radius(mask) ** 2 + run_radius(mask.T).T ** 2
    result = mask & (radius <= 2 - amount)
    # In oblique or disconnected slices rounding can erase a slim ray. Keep
    # one sample on each formerly occupied input ray, never outside the hull.
    for u in columns:
        missed = np.setdiff1d(u[mask], u[result], assume_unique=False)
        for value in missed:
            candidates = np.flatnonzero(mask & (u == value))
            result.flat[candidates[np.argmin(radius.flat[candidates])]] = True
    return result


def reconstruct(views, height, rounding):
    x, y = grid_for(views, height)
    projections = [projection(v, x, y) for v in views]
    columns = [p[0] for p in projections]
    masks = []
    for v, u in zip(views, columns):
        width = v.mask.shape[1]
        masks.append((u >= 0) & (u < width))
    volume = np.empty((height, *x.shape), dtype=bool)
    for z in range(height):
        row = height - 1 - z
        slab = np.ones_like(x, dtype=bool)
        for v, u, valid in zip(views, columns, masks):
            slab &= valid & v.mask[row, u.clip(0, v.mask.shape[1] - 1)]
        volume[z] = rounded_slice(slab, rounding, columns)
    if not volume.any():
        raise ValueError("empty reconstruction; check alignment and angles")
    return volume, x, y, projections


def surface_colors(volume, views, projections):
    out = np.zeros((*volume.shape, 3), np.uint8)
    for z, slab in enumerate(volume):
        # Smooth the occupancy only to estimate a surface normal. Hard pixel
        # clusters and the exported silhouettes stay on the discrete grid.
        soft = np.pad(slab.astype(np.float32), 2)
        soft = (soft[:, :-2] + 2 * soft[:, 1:-1] + soft[:, 2:]) * 0.25
        soft = (soft[:-2] + 2 * soft[1:-1] + soft[2:]) * 0.25
        dy, dx = [gradient[1:-1, 1:-1] for gradient in np.gradient(-soft)]
        length = np.maximum(0.001, np.hypot(dx, dy))
        dx, dy = dx / length, dy / length
        best = np.full(slab.shape, -np.inf)
        row = len(volume) - 1 - z
        for v, (u, depth) in zip(views, projections):
            front = np.full(v.mask.shape[1], -np.inf)
            np.maximum.at(front, u[slab], depth[slab])
            col = u.clip(0, len(front) - 1)
            gap = np.maximum(0, front[col] - depth)
            s, c = v.axis
            facing = dx * c - dy * s
            # Facing and first-hit visibility decide which view supplies a mark.
            # Interior/hidden samples favor a nearby observed surface; a side
            # drawing can also texture its unobserved mirror side.
            priority = facing * 0.85 - gap / 2.4
            if abs(s) > 0.8:
                has_opposite = any(v.axis @ other.axis < -0.97 for other in views)
                if not has_opposite:
                    priority = np.maximum(priority, -1.4 - facing * 0.57)
            replace = slab & (priority > best)
            out[z, replace] = v.rgb[row, col[replace]]
            best[replace] = priority[replace]
    return out


def index_colors(volume, rgb, count):
    colors = rgb[volume]
    # One median-cut atlas is fitted on occupied voxels only. Padding repeats
    # input samples rather than adding a new background pigment.
    width = min(1024, len(colors))
    height = ceil(len(colors) / width)
    pixels = np.resize(colors, (height * width, 3)).reshape(height, width, 3)
    quantized = Image.fromarray(pixels).quantize(
        colors=count, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    )
    indices = np.asarray(quantized).ravel()[: len(colors)]
    keys, inverse = np.unique(indices, return_inverse=True)
    palette = np.array(quantized.getpalette(), dtype=np.uint8).reshape(-1, 3)[keys]
    labels = np.full(volume.shape, -1, np.int16)
    labels[volume] = inverse
    return labels, palette


def encode(labels, palette):
    nz, ny, nx = labels.shape
    runs = []
    for z, slab in enumerate(labels):
        for y, row in enumerate(slab):
            boundaries = np.r_[0, np.flatnonzero(row[1:] != row[:-1]) + 1, nx]
            for start, stop in zip(boundaries[:-1], boundaries[1:]):
                value = row[start]
                if value >= 0:
                    runs.append([z, y, int(start), int(stop - 1), int(value)])
    return {
        "format": "pine.slices/1",
        "dimensions": [nx, ny, nz],
        "palette": ["#%02x%02x%02x" % tuple(c) for c in palette],
        "runs": runs,
    }


def render_pair(labels, palette, x, y, view):
    u, depth = projection(view, x, y)
    present = np.any(labels >= 0, axis=0)
    # Expand the comparison canvas if a projection extends outside its target.
    # Clipping those false-positive pixels would artificially inflate IoU.
    left = min(0, int(u[present].min()))
    right = max(view.mask.shape[1], int(u[present].max()) + 1)
    target = np.zeros((len(labels), right - left, 4), dtype=np.uint8)
    target[:, -left : view.mask.shape[1] - left, :3] = view.rgb
    target[:, -left : view.mask.shape[1] - left, 3] = view.mask * 255
    projected = np.zeros_like(target)
    # Last sample on a camera ray is the one closest to the viewer.
    order = np.argsort(depth.ravel(), kind="stable")
    columns = u.ravel()[order] - left
    for z, slab in enumerate(labels):
        source = slab.ravel()[order]
        occupied = source >= 0
        cols = columns[occupied]
        if len(cols):
            # Reverse first-occurrence indices implement a deterministic z buffer.
            screen, back_index = np.unique(cols[::-1], return_index=True)
            source_index = len(cols) - 1 - back_index
            line = projected[len(labels) - 1 - z]
            line[screen, :3] = palette[source[occupied][source_index]]
            line[screen, 3] = 255
    return projected, target


def compare(projected, target):
    a, b = projected[:, :, 3] > 0, target[:, :, 3] > 0
    intersection, union = a & b, a | b
    common = int(intersection.sum())
    color_error = np.abs(
        projected[intersection, :3].astype(float) - target[intersection, :3]
    )
    return {
        "silhouetteIou": common / int(union.sum()) if union.any() else 0.0,
        "colorMae": float(color_error.mean()) if common else None,
        "overlapPixels": common,
        "referencePixels": int(b.sum()),
        "renderedPixels": int(a.sum()),
    }


def convert(manifest, out, rounding=0.75, colors=64):
    """Build the model from inputs; open holdout drawings only during evaluation."""
    path = Path(manifest)
    doc = json.loads(path.read_text(encoding="utf-8"))
    if doc.get("format") != "pine.turnaround/1":
        raise ValueError("unknown manifest format")
    height = bounded_int(doc.get("height", 96), 4, 256, "height")
    bounded_int(colors, 1, 256, "colors")
    if not 0 <= rounding <= 1:
        raise ValueError("rounding must be in [0, 1]")
    entries = doc.get("views")
    if not isinstance(entries, list) or not entries:
        raise ValueError("views must be a non-empty list")
    names, directions = set(), set()
    for entry in entries:
        name = entry.get("id")
        if (
            not isinstance(name, str)
            or not re.fullmatch(r"[A-Za-z0-9_-]+", name)
            or name in names
            or name + "-target" in names
            or name.removesuffix("-target") in names
        ):
            raise ValueError("invalid, colliding, or duplicate view ID")
        names.add(name)
        if entry.get("role") not in {"input", "holdout"} or not np.isfinite(
            float(entry.get("angle", np.nan))
        ):
            raise ValueError("each view needs a role and a finite angle")
        if entry["role"] == "input":
            angle = float(entry["angle"]) % 360
            if angle in directions:
                raise ValueError("duplicate input direction")
            directions.add(angle)
    inputs = [
        read_view(e, doc, path.parent, height) for e in entries if e["role"] == "input"
    ]
    volume, x, y, projections = reconstruct(inputs, height, rounding)
    rgb = surface_colors(volume, inputs, projections)
    labels, palette = index_colors(volume, rgb, colors)
    model = encode(labels, palette)
    held = [
        read_view(e, doc, path.parent, height)
        for e in entries
        if e["role"] == "holdout"
    ]
    results = {}
    images = {}
    for view in inputs + held:
        rendered, target = render_pair(labels, palette, x, y, view)
        images[f"{view.id}.png"] = rendered
        images[f"{view.id}-target.png"] = target
        results[view.id] = {
            "role": view.role,
            "angle": view.angle,
            **compare(rendered, target),
        }
    summary = {}
    for role in ["input", "holdout"]:
        rows = [row for row in results.values() if row["role"] == role]
        if rows:
            maes = [row["colorMae"] for row in rows if row["colorMae"] is not None]
            summary[role] = {
                "silhouetteIou": float(np.mean([r["silhouetteIou"] for r in rows])),
                "colorMae": float(np.mean(maes)) if maes else None,
            }
    metrics = {
        "height": height,
        "rounding": rounding,
        "voxels": int(volume.sum()),
        "paletteSize": len(palette),
        "views": results,
        "summary": summary,
    }
    # An invalid final holdout or a failed image encoding must leave an earlier
    # run untouched. Stage on the destination filesystem before publishing;
    # the metrics file is the last file installed for a successful run.
    directory = Path(out)
    directory.mkdir(parents=True, exist_ok=True)
    names = ["model.json", *images, "metrics.json"]
    sources = {path.resolve()}
    for entry in entries:
        for key in ("source", "alphaMask"):
            name = entry.get(key, doc.get(key))
            if name:
                sources.add((path.parent / name).resolve())
    for name in names:
        destination = directory / name
        if destination.is_dir() or destination.resolve() in sources:
            raise ValueError(
                f"unsafe destination for {name}; use a separate output directory"
            )
    with TemporaryDirectory(dir=directory, prefix=".pine-build-") as temporary:
        stage = Path(temporary)
        (stage / "model.json").write_text(
            json.dumps(model, separators=(",", ":")) + "\n", encoding="utf-8"
        )
        for name, pixels in images.items():
            Image.fromarray(pixels).save(stage / name)
        (stage / "metrics.json").write_text(
            json.dumps(metrics, indent=2, allow_nan=False) + "\n", encoding="utf-8"
        )
        for name in names:
            (stage / name).replace(directory / name)
    return metrics


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("manifest", type=Path)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--rounding", type=float, default=0.75)
    ap.add_argument("--colors", type=int, default=64)
    args = ap.parse_args()
    try:
        result = convert(args.manifest, args.out, args.rounding, args.colors)
        print(json.dumps(result["summary"], indent=2))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        ap.exit(2, f"{ap.prog}: {exc}\n")


if __name__ == "__main__":
    main()
