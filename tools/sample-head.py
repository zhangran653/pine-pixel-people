"""Rebuild head-sections.js offline from hm08 and six CC0 targets per younger age.

Usage: python3 tools/sample-head.py path/to/base.obj path/to/macrodetails > head-sections.js
Upstream revision a8bc2d54ff0ac92e78ff71431b1023eda42bf482.
"""

from hashlib import sha256
from pathlib import Path
from statistics import mean
import json
import math
import sys


HEIGHTS = [
    -1,
    -0.97,
    -0.93,
    -0.87,
    -0.80,
    -0.72,
    -0.63,
    -0.54,
    -0.45,
    -0.36,
    -0.27,
    -0.18,
    -0.09,
    0,
    0.10,
    0.18,
    0.26,
    0.34,
    0.43,
    0.52,
    0.62,
    0.72,
    0.81,
    0.88,
    0.935,
    0.97,
    0.987,
    0.997,
    1,
]
LATERAL = [0, 0.2, 0.4, 0.6, 0.76, 0.88]


def interpolate(anchors, x):
    for (a, u), (b, v) in zip(anchors, anchors[1:]):
        if x <= b:
            return u + (v - u) * (x - a) / (b - a)
    return anchors[-1][1]


def read_mesh(path):
    data = path.read_bytes()
    if (
        sha256(data).hexdigest()
        != "8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c"
    ):
        raise ValueError(
            "Expected the hm08 topology and landmark indices from the documented revision"
        )
    points, triangles, group = [], [], ""
    for line in data.decode().splitlines():
        fields = line.split()
        if not fields:
            continue
        if fields[0] == "v":
            points.append(tuple(map(float, fields[1:4])))
        elif fields[0] == "g":
            group = fields[1]
        elif fields[0] == "f" and group == "body":
            face = [int(item.split("/")[0]) - 1 for item in fields[1:]]
            if max(points[i][1] for i in face) >= 6.10:
                triangles.extend(
                    (face[0], face[j], face[j + 1]) for j in range(1, len(face) - 1)
                )
    return points, triangles


def age_vertices(points, directory, age):
    vertices = [list(p) for p in points]
    for population in ("african", "asian", "caucasian"):
        for sex in ("female", "male"):
            path = directory / f"{population}-{sex}-{age}.target"
            for line in path.read_text().splitlines():
                fields = line.split()
                if len(fields) == 4 and fields[0].isdigit():
                    p = vertices[int(fields[0])]
                    for axis, value in enumerate(fields[1:]):
                        p[axis] += float(value) / 6
    return vertices


def cross_section(triangles, height):
    lines = []
    for tri in triangles:
        cuts = []
        for a, b in zip(tri, tri[1:] + tri[:1]):
            if min(a[1], b[1]) <= height < max(a[1], b[1]):
                t = (height - a[1]) / (b[1] - a[1])
                cuts.append((a[0] + t * (b[0] - a[0]), a[2] + t * (b[2] - a[2])))
        if len(cuts) == 2:
            lines.append(cuts)
    return lines


def depths(lines, lateral):
    hits = []
    for a, b in lines:
        if min(a[0], b[0]) <= lateral < max(a[0], b[0]):
            hits.append(a[1] + (lateral - a[0]) * (b[1] - a[1]) / (b[0] - a[0]))
    return sorted(hits)


def height_map(points, age):
    chin, lip, crown = [points[i][1] for i in (991, 455, 881)]
    eye = mean(points[i][1] for i in range(13606, 13614))
    if age == "baby":
        # Preserve the donor's longer vault and short lower face in physical height.
        return [(2 * (y - chin) / (crown - chin) - 1, y) for y in (chin, lip, eye, crown)]
    mouth_h, eye_h = (-0.39, 0.14) if age == "child" else (-0.43, 0.13)
    return [(-1, chin), (mouth_h, lip), (eye_h, eye), (1, crown)]


def sample(points, faces, age):
    triangles = [[points[i] for i in f] for f in faces]
    # X is lateral, Y is up, Z faces forward.
    chin, ear, forehead, crown = (points[i] for i in (991, 12323, 237, 881))
    zmap = height_map(points, age)
    mouth_y, eye_y = zmap[1][0], zmap[2][0]
    baby = age == "baby"
    cut = [(points[i][1], points[i][2]) for i in (991, 7691, 941)]
    # Ear pinnae are painted as separate features; span the two skull widths on either side of the ear.
    ear_lo, ear_hi = points[7612][1], points[7576][1]

    def width_at(y):
        return max(p[0] for seg in cross_section(triangles, y) for p in seg)

    ear_widths = [(ear_lo, width_at(ear_lo)), (ear_hi, width_at(ear_hi))]
    temple_width = width_at(forehead[1])
    forward_scale = 1.18 / (forehead[2] - ear[2])

    def game_x(z):
        return -0.115 + (z - ear[2]) * forward_scale * (1 if z >= ear[2] else 0.94)

    result = []
    for h in HEIGHTS:
        if h in (-1, 1):
            x = game_x((chin if h == -1 else crown)[2])
            result.append([h, 0, x, x, *([x] * len(LATERAL))])
            continue
        y = interpolate(zmap, h)
        lines = cross_section(triangles, y)
        # Trim the neck along the menton, jaw angle and nape. The runtime supplies its own neck.
        throat = interpolate(cut, y) if y < cut[-1][0] else -math.inf
        width = max(
            (p[0] for seg in lines for p in seg if p[1] >= throat), default=0.001
        )
        if ear_lo < y < ear_hi:
            width = min(width, interpolate(ear_widths, y))
        if baby and ear_lo < y < ear_hi:
            # The infant ear flares past the temple. Measure the cheek in front
            # of the pinna, which the renderer adds separately at the ear canal.
            cheek = [p[0] for seg in lines for p in seg if p[1] > ear[2] + 0.38 / forward_scale]
            width = min(width, max(cheek))
        center = depths(lines, 1e-6)
        t = max(0, min(1, (h + 0.92) / 0.47))
        rear = max(throat, center[0]) + (
            center[0] - max(throat, center[0])
        ) * 0.69 * t * t * (3 - 2 * t)

        def front(v):
            hits = depths(lines, max(0.000001, width * v))
            return max(hits) if hits else center[-1]

        # Remove the donor nose and lip projections. The shared skin carries separate, editable features.
        ridge = front(0.38) + 0.070 / forward_scale
        front_row = []
        for v in LATERAL:
            z = front(v)
            if (-0.72 if baby else -0.58) < h < 0.43 and v < 0.38:
                z = min(z, ridge - 0.055 * (v / 0.38) ** 2 / forward_scale)
            # An open eyelid in the skin mesh must not cut a hole in the painted eye socket.
            if (eye_y - 0.09 < h < eye_y + 0.09 if baby else 0.07 < h < 0.23) and 0.17 <= v <= 0.62:
                z = max(z, front(0.7) + 0.10 * (1 - v) / forward_scale)
            front_row.append(game_x(z))
        edge = depths(lines, 0.98 * width)
        axis = (game_x(rear) + front_row[0]) * 0.5
        if edge:
            outer_midpoint = (max(rear, edge[0]) + edge[-1]) * 0.5
            axis += 0.56 * (game_x(outer_midpoint) - axis)
        fullness = 1 + {"adult": 0.045, "child": 0.065, "baby": 0.015}[age] * math.exp(
            -(((h + 0.38) / 0.34) ** 2)
        )
        result.append(
            [h, width / temple_width * fullness, game_x(rear), axis, *front_row]
        )
    # Close the donor's open eyelids with a skin bed. The runtime supplies both eyes.
    low_eye, high_eye = (-0.27, 0) if baby else (0, 0.26)
    below = next(r for r in result if r[0] == low_eye)
    above = next(r for r in result if r[0] == high_eye)
    for row in result:
        if low_eye < row[0] < high_eye:
            for k in range(3, len(row)):
                row[k] = interpolate([(low_eye, below[k]), (high_eye, above[k])], row[0])
                if k in (6, 7):
                    row[k] -= 0.018
    # The pigment representing the lips lies on a continuous dental arch at all mouth settings.
    lo = max(i for i, r in enumerate(result) if r[0] < mouth_y - 0.105)
    hi = min(i for i, r in enumerate(result) if r[0] > mouth_y + 0.105)
    for k in (4, 5):
        high = result[hi][k]
        low = min(result[lo][k], high - 0.014)
        result[lo - 1][k] = min(result[lo - 1][k], low + 0.018)
        for row in result[lo : hi + 1]:
            row[k] = interpolate([(result[lo][0], low), (result[hi][0], high)], row[0])
    return [[round(v, 4) for v in row] for row in result]


def sagittal_landmark(vertices, age, indices):
    y, z = [mean(vertices[i][axis] for i in indices) for axis in (1, 2)]
    ear, forehead = [vertices[i] for i in (12323, 237)]
    height = interpolate([(y, h) for h, y in height_map(vertices, age)], y)
    forward_scale = 1.18 / (forehead[2] - ear[2])
    forward = -0.115 + (z - ear[2]) * forward_scale * (1 if z >= ear[2] else 0.94)
    return [round(forward, 4), round(height, 4)]


if __name__ == "__main__":
    base, faces = read_mesh(Path(sys.argv[1]))
    subjects = {"adult": base, **{age: age_vertices(base, Path(sys.argv[2]), age) for age in ("child", "baby")}}
    print(
        "// Generated by tools/sample-head.py from the CC0 MakeHuman hm08 mesh, child and baby targets."
    )
    print(
        "// Height, half-width, rear, temple axis, then front depths at 0, .2, .4, .6, .76 and .88 of half-width."
    )
    print("const pineHeadSections = {")
    for name, vertices in subjects.items():
        print("  " + name + ": [")
        print(
            ",\n".join(
                "    " + json.dumps(row)
                for row in sample(vertices, faces, name)
            )
        )
        print("  ]" + ("," if name != "baby" else ""))
    print("};")

    print()
    print("// Sagittal positions [forward, height] of the head joint, in the same hm08 coordinates.")
    pivots = {name: sagittal_landmark(v, name, range(14070, 14078)) for name, v in subjects.items()}
    print("const pineHeadPivots = " + json.dumps(pivots) + ";")
    # default.mhskel places jaw____head on the midline of the opening axis.
    # 7691 is the lateral jaw angle also used to trim the head from the neck.
    jaw, sagittal_units = {}, {}
    for name, v in subjects.items():
        triangles = [[v[i] for i in face] for face in faces]
        half_width = max(p[0] for seg in cross_section(triangles, v[237][1]) for p in seg)
        # The section tables normalize the ear-to-forehead span to 1.18 and
        # transverse distances to one temple half-width. Retain their real unit ratio.
        sagittal_units[name] = round((v[237][2] - v[12323][2]) / (1.18 * half_width), 4)
        jaw[name] = {
            "hinge": sagittal_landmark(v, name, range(14590, 14598)),
            "angle": [*sagittal_landmark(v, name, [7691]), round(abs(v[7691][0]) / half_width, 4)],
        }
    print("// Mandibular hinge axis and lateral jaw angle, independent of the head/neck pivot.")
    print("const pineMandibleLandmarks = " + json.dumps(jaw) + ";")
    print("// Physical length of a sagittal table unit relative to one transverse table unit.")
    print("const pineSagittalUnits = " + json.dumps(sagittal_units) + ";")
    landmarks = {key: sagittal_landmark(subjects["baby"], "baby", indices)[1]
                 for key, indices in {"eye": range(13606, 13614), "mouth": [455], "ear": [12323]}.items()}
    print("const pineInfantLandmarks = " + json.dumps(landmarks) + ";")
