"""Reconstruct the removable swept bun from the three views in pixel-face-guide.webp.
Run from any directory with Python, Pillow and NumPy. The renderer needs only the generated JS.
"""

from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
image = Image.open(ROOT / "pixel-face-guide.webp").convert("RGB")
rgb = np.asarray(image, dtype=np.int32)
# In each drawing the hair overlaps a different part of the face. These
# landmarks follow the painted hairline. The paper supplies the outer silhouette.
hair_lines = [
    [
        (44, 857),
        (108, 875),
        (144, 861),
        (134, 826),
        (155, 801),
        (173, 793),
        (179, 765),
        (185, 742),
        (184, 712),
        (171, 718),
        (158, 732),
        (171, 699),
        (187, 682),
        (198, 658),
        (206, 628),
        (215, 610),
        (233, 598),
        (254, 600),
        (270, 612),
        (285, 600),
        (302, 597),
        (313, 608),
        (325, 636),
        (341, 658),
        (371, 675),
        (400, 677),
        (382, 687),
        (357, 694),
        (369, 710),
        (388, 722),
        (408, 734),
        (413, 748),
        (400, 754),
        (390, 777),
        (412, 790),
        (415, 808),
        (399, 828),
        (400, 850),
        (414, 859),
        (431, 864),
        (474, 870),
    ],
    [
        (531, 872),
        (644, 874),
        (672, 849),
        (673, 821),
        (705, 809),
        (719, 789),
        (722, 770),
        (710, 752),
        (708, 726),
        (726, 710),
        (752, 690),
        (768, 660),
        (781, 625),
        (793, 612),
        (815, 598),
        (836, 601),
        (853, 610),
        (865, 649),
        (886, 674),
        (901, 698),
        (916, 721),
        (924, 744),
        (919, 753),
        (914, 778),
        (939, 801),
        (929, 825),
        (920, 846),
        (922, 867),
        (976, 879),
    ],
    [
        (1038, 817),
        (1140, 831),
        (1239, 831),
        (1264, 804),
        (1277, 785),
        (1282, 767),
        (1281, 749),
        (1290, 719),
        (1313, 700),
        (1340, 676),
        (1353, 642),
        (1368, 616),
        (1384, 602),
        (1405, 597),
        (1408, 625),
        (1416, 656),
        (1429, 678),
        (1448, 688),
        (1475, 681),
    ],
]
# Side drawing x is forward. Front drawing x is anatomical left. Coordinates
# in the runtime are relative to the ear, head centre and head radii.
hair = dict(
    lines=hair_lines,
    crop=[(64, 467), (547, 967), (1039, 1488)],
    eye=[707, 706, 703],
    front=274,
    ear=1259,
    oblique=751,
    lateral=128,
    depth=155,
    vertical=155,
    eye_h=0.129,
    palette=[
        (42, 29, 24),
        (64, 45, 38),
        (86, 64, 55),
        (110, 84, 72),
        (135, 106, 93),
        (161, 131, 114),
        (190, 159, 138),
        (217, 186, 159),
    ],
)
# Uniform sculpting grid in head radii. Each row of the payload is one horizontal
# cross-section. A run stores an occupancy length (1..64) and its dye index.
bounds = [-1.67, 1.41, -1.66, 1.66, -1.0, 1.65]
nx, ny, nz = 105, 111, 100
alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"


def bake(p):
    r, g, b = rgb.transpose(2, 0, 1)
    solid = ~((g > r * 1.017) & (b > r * 1.007))
    palette = np.asarray(p["palette"])
    filt = np.asarray(image.filter(ImageFilter.GaussianBlur(2.2)), dtype=float)
    tones = (
        np.argmin(
            np.sum(
                (filt[:, :, None, :] - palette) ** 2 * np.array([0.32, 0.5, 0.18]),
                axis=3,
            ),
            axis=2,
        )
        + 1
    )
    masks = []
    for view, line in enumerate(p["lines"]):
        left, right = p["crop"][view]
        top = 480
        m = Image.new("L", image.size)
        ImageDraw.Draw(m).polygon([(left, top), (right, top)] + line[::-1], fill=255)
        cut = np.asarray(m) > 0
        # Only use the original paper as a contour near a silhouette; interior
        # dyed highlights and low-luminance hair roots remain on the solid.
        fiber = (r - g < 0.27 * r + 3) & (g - b < 0.22 * g + 5)
        alpha = solid & cut & fiber
        # Fill sub-pixel antialias gaps between dyed strands before carving.
        alpha = (
            Image.fromarray(alpha.astype("uint8") * 255)
            .filter(ImageFilter.MaxFilter(7))
            .filter(ImageFilter.MinFilter(7))
        )
        masks.append(np.asarray(alpha) > 0)
    x = np.linspace(bounds[0], bounds[1], nx)[None, :]
    v = np.linspace(bounds[2], bounds[3], ny)[:, None]
    z = np.linspace(bounds[4], bounds[5], nz)
    # Allow a little space for strand volume above the scalp.
    rel = z - 0.03 * np.clip((z - 0.15) / 1.12, 0, 1)
    bulk = 1.0 + 0.014 * np.clip((z - 0.08) / 0.7, 0, 1)
    sourceY = np.round(
        np.array(p["eye"])[:, None] + (p["eye_h"] - rel) * p["vertical"]
    ).astype(int)
    points = []
    for j in range(nz):
        ext = []
        for view in [0, 2]:
            lo, hi = p["crop"][view]
            y = sourceY[view, j]
            band = (
                solid[np.clip(y, 0, 1023), lo:hi]
                if (0 <= y < 1024)
                else np.zeros(hi - lo, bool)
            )
            ids = np.flatnonzero(band)
            ext.extend([lo + ids[0], lo + ids[-1]] if len(ids) else [np.nan, np.nan])
        points.append(ext)
    points = np.array(points)
    # Smooth the supporting oval only. Fine silhouettes and separated locks are
    # subsequently cut back by the original per-view foreground masks.
    filled = np.array(
        [
            np.interp(
                np.arange(nz), np.flatnonzero(np.isfinite(vs)), vs[np.isfinite(vs)]
            )
            for vs in points.T
        ]
    )
    kernel = np.exp(-0.5 * (np.arange(-5, 6) / 1.8) ** 2)
    kernel /= kernel.sum()
    envelope = np.array(
        [np.convolve(np.pad(a, 5, mode="edge"), kernel, mode="valid") for a in filled]
    )
    out = np.zeros((nz, ny, nx), dtype=np.uint8)
    for j, h in enumerate(z):
        if not np.isfinite(points[j]).all():
            continue
        xx = x / bulk[j]
        vv = v / bulk[j]
        left, right, back, front = envelope[:, j]
        axis = ((back + front) / 2 - p["ear"]) / p["depth"] - 0.115
        d = max(0.03, (front - back + 1) / 2 / p["depth"])
        w = np.where(
            vv < 0,
            max(0.03, (p["front"] - left) / p["lateral"]),
            max(0.03, (right - p["front"]) / p["lateral"]),
        )
        a = (xx - axis) / d
        t = vv / w
        rad = a * a + t * t
        ang = np.degrees(np.arctan2(np.abs(t), a))
        frontMix = np.clip((55 - ang) / 25, 0, 1)
        sideMix = np.clip((ang - 58) / 29, 0, 1)
        weights = [frontMix, 1 - frontMix - sideMix, sideMix]
        px = [
            p["front"] + vv * p["lateral"],
            p["oblique"]
            + ((xx + 0.115) * p["depth"] - abs(vv) * p["lateral"]) * 0.7071,
            p["ear"] + (xx + 0.115) * p["depth"],
        ]
        coverage = 0.0
        shade = 0.0
        outer = rad <= 1.13
        masks_at = []
        for view, weight in enumerate(weights):
            u = np.rint(px[view]).astype(int).clip(0, 1535)
            y = sourceY[view, j]
            if not 0 <= y < 1024:
                outer[:] = False
                continue
            c = masks[view][y, u]
            masks_at.append(c)
            color = tones[y, u]
            shade += weight * c * color
            coverage += weight * c
            if view != 1:
                lo, hi = p["crop"][view]
                outer &= (u >= lo) & (u < hi) & solid[y, u]
        # Where a lock is visible against the open background in front/profile,
        # carve the void right through instead of stretching one source pixel
        # into an entire horizontal ring. Retain an oval central core.
        shade /= np.maximum(0.001, coverage)
        # The unseen back should also have strands running across it. Map the
        # rolled locks behind the ear around the rear cap in its transverse
        # coordinate; using only the side projection repeats a pixel all the
        # way across a horizontal slice.
        rear_blend = np.clip((ang - 112) / 43, 0, 1)
        rear_blend = rear_blend**2 * (3 - 2 * rear_blend)
        across = np.clip(t, -1, 1)
        rear_u = np.rint(
            back + (front - back) * (0.34 + 0.23 * across + 0.05 * across**2)
        ).astype(int).clip(0, 1535)
        row_y = int(np.clip(sourceY[2, j], 0, 1023))
        strands = np.cos(12 * across + 2.4 * np.sin(2.1 * h) + 3.1 * across**2)
        fallback = 3.7 + 1.35 * strands + 0.52 * h
        rear_tone = np.where(
            masks[2][row_y, rear_u],
            0.83 * tones[row_y, rear_u] + 0.17 * fallback,
            fallback,
        )
        shade += rear_blend * (rear_tone - shade)
        inside = (rad > 0.47) | (h > 0.86)
        occ = outer & inside & (coverage >= 0.49)
        if h < 0.79 and len(masks_at) == 3:
            # Keep the face and pinna clear from either orthogonal view. A
            # far-side strand cannot paint over the near eyelid or ear canal.
            occ &= masks_at[2] | (xx < -0.30) | (abs(vv) < 0.23)
            occ &= masks_at[0] | (xx < 0.15)
        # Loose strands are sculpted separately. End the main mass at the ear
        # and nape, leaving both irises and ear canals visible.
        hairline = np.interp(
            ang,
            [0, 22, 43, 62, 79, 96, 118, 145, 180],
            [0.67, 0.60, 0.40, 0.20, 0.14, 0.08, -0.30, -0.52, -0.60],
        )
        occ &= h >= hairline
        if h < 0.40:
            occ &= (xx < 0.52) | masks_at[2]
        out[j] = np.where(
            occ,
            np.clip(np.rint(shade - 0.48 * np.clip((0.94 - rad) / 0.28, 0, 1)), 1, 8),
            0,
        )
    # Close pinholes left by paper along the roots while retaining the large
    # open spaces between locks. Newly occupied cells inherit nearby dye.
    for axis in (0, 1, 2):
        planes = np.moveaxis(out, axis, 0)
        for i, plane in enumerate(planes):
            mask = Image.fromarray((plane > 0).astype("uint8") * 255)
            coverage = (
                mask.filter(ImageFilter.MaxFilter(5))
                .filter(ImageFilter.MinFilter(5))
                .filter(ImageFilter.GaussianBlur(0.85))
            )
            dense = np.asarray(coverage) > 111
            light = np.asarray(
                Image.fromarray(plane * 27).filter(ImageFilter.GaussianBlur(2)), float
            )
            mass = np.asarray(mask.filter(ImageFilter.GaussianBlur(2)), float) / 255
            inferred = np.clip(np.rint(light / (27 * np.maximum(0.002, mass))), 1, 8)
            planes[i] = np.where(dense, np.where(plane, plane, inferred), 0)
    encoded = []
    for layer in out:
        line = []
        flat = layer.flatten()
        steps = np.flatnonzero(np.r_[True, flat[1:] != flat[:-1], True])
        for i in range(len(steps) - 1):
            run = int(steps[i + 1] - steps[i])
            c = int(flat[steps[i]])
            while run:
                n = min(64, run)
                line.append(alphabet[n - 1] + str(c))
                run -= n
        encoded.append("".join(line))
    return encoded


out = [
    "// Generated by tools/bake-pixel-headwear.py from pixel-face-guide.webp.",
    "const pineHeadwearCuts = {",
    "  bounds: " + json.dumps(bounds) + ",",
    f"  size: [{nx}, {ny}, {nz}],",
]
out.append("  knot: [")
out.extend("    " + json.dumps(row) + "," for row in bake(hair))
out.append("  ],")
out.append("};\n")
(ROOT / "pixel-headwear.js").write_text("\n".join(out))
