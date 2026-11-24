// Reconstruct the CC0 reference sections in the character’s head frame.
// Positive X faces forward; the lower face is fitted to the character's own neck.
const pineHeadShape = (() => {
  const count = 600,
    lateralSteps = 96;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lateral = [0, 0.2, 0.4, 0.6, 0.76, 0.88, 1];
  // Monotone Hermite interpolation avoids a corner at the brow or a bump at the jaw.
  function slopes(points, channel) {
    const sec = points.slice(1).map((p, i) => (p[channel] - points[i][channel]) / (p[0] - points[i][0]));
    return points.map((_, i) => {
      if (!i) return sec[0];
      if (i === sec.length) return sec[i - 1];
      return sec[i] * sec[i - 1] > 0 ? 2 / (1 / sec[i] + 1 / sec[i - 1]) : 0;
    });
  }
  function curve(a, b, m0, m1, d, t) {
    return (
      (1 + 2 * t) * (1 - t) ** 2 * a +
      t * (1 - t) ** 2 * d * m0 +
      t * t * (3 - 2 * t) * b +
      t * t * (t - 1) * d * m1
    );
  }
  function sample(points, derivatives, interval, channel, h) {
    const a = points[interval],
      b = points[interval + 1],
      d = b[0] - a[0];
    return curve(a[channel], b[channel], derivatives[interval], derivatives[interval + 1], d, (h - a[0]) / d);
  }
  // The reference mesh was cut at the jaw to remove its neck. The pixel rig has a shorter
  // neck, so carry the underside of the chin back to the throat in the same cross-section.
  // Height, half-width, back of the throat, widest lateral point, front of the chin.
  function jawSections(reference, child) {
    const lower = [
      [-1, 0.37, -0.415, -0.04, 0.32],
      [-0.96, 0.38, -0.42, -0.035, 0.325],
      [-0.925, 0.392, -0.42, -0.022, 0.35],
      [-0.904, 0.407, -0.415, 0.005, 0.42],
      [-0.886, 0.426, -0.405, 0.045, 0.63],
      [-0.864, 0.452, -0.4, 0.082, 0.804],
      [-0.835, 0.485, -0.38, 0.12, 0.915],
      [-0.795, 0.535, -0.35, 0.18, 0.985],
      [-0.745, 0.594, -0.321, 0.24, 1.017],
      [-0.69, 0.66, -0.288, 0.31, 1.001],
      [-0.635, 0.717, -0.265, 0.363, 0.974],
      [-0.59, 0.755, -0.279, 0.383, 0.998]
    ];
    const chinArc = [1, 0.978, 0.892, 0.739, 0.546, 0.357];
    const rings = lower.map(([h, width, back, side, front]) => {
      const t = clamp((h + 1) / 0.41, 0, 1);
      // A child's chin pad is shallower and the underside turns into the neck a little sooner.
      if (child) {
        front -= 0.055 * Math.sin(Math.PI * t) + 0.018 * (1 - t);
        width *= 1 + 0.04 * Math.sin(Math.PI * t);
        back += 0.025;
      }
      const surface = chinArc.map((w, i) => {
        const round = Math.sqrt(1 - lateral[i] ** 2);
        const weight = round + (w - round) * t;
        return side + (front - side) * weight;
      });
      return [h, width, back, side, ...surface];
    });
    return [...rings, ...reference.filter(([h]) => h >= -0.54)];
  }
  function profile(child, fittedJaw = false) {
    const reference = pineHeadSections[child ? 'child' : 'adult'];
    const sections = fittedJaw ? jawSections(reference, child) : reference;
    const gradients = sections[0].map((_, i) => slopes(sections, i));
    const neutral = posterior(1);
    const angles = lateral.map(Math.asin);
    const meridians = Array.from({ length: lateralSteps + 1 }, (_, j) => {
      const angle = Math.asin(j / lateralSteps);
      let interval = 0;
      while (interval < angles.length - 2 && angle > angles[interval + 1]) interval++;
      return { interval, angle };
    });
    let section = 0;
    const rows = Array.from({ length: count + 1 }, (_, i) => {
      const h = (2 * i) / count - 1;
      while (section < sections.length - 2 && h > sections[section + 1][0]) section++;
      const value = (k) => sample(sections, gradients[k], section, k, h);
      let width = value(1),
        back = value(2),
        side = value(3);
      const front = lateral.slice(0, -1).map((_, j) => value(4 + j));
      // Seat the measured chin on the shorter neck of the pixel rig.
      const underChin = clamp((-h - 0.65) / 0.35, 0, 1);
      const inset = fittedJaw ? 0 : (child ? 0.13 : 0.19) * underChin * underChin * (3 - 2 * underChin);
      back -= inset;
      side -= inset;
      front.forEach((_, j) => (front[j] -= inset));
      // Reconstruct the last few polygon rings as a smooth cap around the measured vertex.
      if (h > 0.88) {
        const reference = sections.find((r) => r[0] === 0.88);
        const q = Math.sqrt(Math.max(0, (1 - h * h) / (1 - 0.88 * 0.88)));
        const top = 0.55 * sections.at(-1)[4] + 0.45 * reference[3];
        width = reference[1] * q;
        back = top + (reference[2] - top) * q;
        side = top + (reference[3] - top) * q;
        front.forEach((v, j) => (front[j] = top + (reference[j + 4] - top) * q));
      }
      // Authoring coordinates also fit hair and headwear. At the neutral setting the two
      // transforms cancel exactly, restoring the measured profile in physical head space.
      const axis = neutral.unfit(side, h),
        rear = axis - neutral.unfit(back, h);
      const outline = [...front, side].map((v, j) => [angles[j], neutral.unfit(v, h)]);
      const tangent = slopes(outline, 1);
      tangent[0] = 0;
      const face = Float32Array.from(meridians, ({ interval, angle }) =>
        sample(outline, tangent, interval, 1, angle)
      );
      return { axis, rear, fore: face[0] - axis, width, face };
    });
    const row = (h) => rows[clamp(Math.round(((h + 1) * count) / 2), 0, count)];
    function frontAt(r, v) {
      const sample = clamp(Math.abs(v), 0, 1) * lateralSteps,
        i = Math.min(lateralSteps - 1, Math.floor(sample));
      return r.face[i] + (r.face[i + 1] - r.face[i]) * (sample - i);
    }
    // Two components of the normalized surface normal, with a soft light above and in front.
    // Per-height lookup avoids evaluating normals for every voxel in every animation frame.
    for (const [i, r] of rows.entries()) {
      const lo = Math.max(0, i - 10),
        hi = Math.min(count, i + 10),
        below = rows[lo],
        above = rows[hi];
      r.frontLight = new Float32Array(lateralSteps + 1);
      r.sideLight = new Float32Array(lateralSteps + 1);
      for (let j = 0; j <= lateralSteps; j++) {
        const v = j / lateralSteps,
          y = v * r.width;
        const left = Math.max(0, j - 3),
          right = Math.min(lateralSteps, j + 3);
        const dxdy =
          ((r.face[right] - r.face[left]) * lateralSteps) / ((right - left) * Math.max(0.01, r.width));
        const dxdh =
          ((frontAt(above, y / Math.max(0.001, above.width)) -
            frontAt(below, y / Math.max(0.001, below.width))) *
            count) /
          (2 * (hi - lo));
        const normal = 1 / Math.hypot(1, dxdy, 0.85 * dxdh);
        const ambient = 0.53 + 0.18 * Math.sqrt(1 - v * v) + 0.075 * ((2 * i) / count - 1);
        r.frontLight[j] = 0.58 * (0.74 - 0.53 * dxdh) * normal + 0.42 * ambient;
        r.sideLight[j] = 0.085 * dxdy * normal;
      }
    }
    function insideSkin(r, x, y) {
      if (r.width < 0.001 || Math.abs(y) > r.width) return false;
      const v = y / r.width,
        dx = x - r.axis;
      if (dx < 0) return dx * dx <= r.rear * r.rear * (1 - v * v);
      return x <= frontAt(r, v);
    }
    function topAt(x, y) {
      // Binary search the upper dome once when authoring the short-hair map.
      let lo = 0.2,
        hi = 1;
      if (!insideSkin(row(lo), x, y)) return lo;
      for (let n = 0; n < 9; n++) {
        const mid = (lo + hi) / 2;
        if (insideSkin(row(mid), x, y)) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    }
    // Transfer the existing long-hair scalp map to these sections, preserving its locks and parts.
    const charts = rows.map((r, i) => {
      const h = (2 * i) / count - 1,
        at = clamp(h, -0.91, 0.92),
        support = row(at),
        ring = Math.sqrt(1 - at * at);
      return {
        axis: r.axis,
        fore: support.fore / ring,
        rear: support.rear / ring,
        width: support.width / ring
      };
    });
    // Raise only the vault above the brow. Locks and hats above the vertex keep their own thickness.
    const rise = child ? 0.125 : 0.14,
      browHeight = 0.3,
      gain = 1 + rise / (1 - browHeight);
    const crown = {
      rise,
      raise: (h) => (h <= browHeight ? h : h >= 1 ? h + rise : browHeight + (h - browHeight) * gain),
      lower: (h) => (h <= browHeight ? h : h >= 1 + rise ? h - rise : browHeight + (h - browHeight) / gain)
    };
    return {
      crown,
      row,
      frontAt,
      insideSkin,
      lateralSteps,
      inside: insideSkin,
      topAt,
      chart: (h) => charts[clamp(Math.round(((h + 1) * count) / 2), 0, count)]
    };
  }
  // Anchor the adjustment at the ears. The lower occiput tucks further in than the crown;
  // the ends of long hair gradually regain their original reach at the shoulders.
  function posterior(depth) {
    const ear = -0.115;
    const levels = [
      [-2.2, 1, 0],
      [-1.55, 0.91, 0.25],
      [-0.96, 0.7, 0.82],
      [-0.6, 0.675, 1],
      [-0.36, 0.617, 1],
      [-0.12, 0.587, 1],
      [0.0, 0.589, 1],
      [0.12, 0.6, 1],
      [0.36, 0.66, 1],
      [0.6, 0.749, 0.98],
      [0.82, 0.8, 0.9],
      [1.15, 0.85, 0.76],
      [1.55, 0.89, 0.66]
    ];
    const start = levels[0][0],
      end = levels.at(-1)[0],
      n = 400;
    const tangents = slopes(levels, 1);
    let j = 0;
    const widths = Float32Array.from({ length: n + 1 }, (_, i) => {
      const h = start + ((end - start) * i) / n;
      while (j < levels.length - 2 && h > levels[j + 1][0]) j++;
      const a = levels[j],
        b = levels[j + 1],
        t = (h - a[0]) / (b[0] - a[0]),
        u = t * t * (3 - 2 * t);
      return (
        curve(a[1], b[1], tangents[j], tangents[j + 1], b[0] - a[0], t) *
        (1 + (depth - 1) * (a[2] + (b[2] - a[2]) * u))
      );
    });
    const width = (h) => widths[clamp(Math.round(((h - start) * n) / (end - start)), 0, n)];
    return {
      fit: (x, h) => (x >= ear ? x : ear + (x - ear) * width(h)),
      unfit: (x, h) => (x >= ear ? x : ear + (x - ear) / width(h))
    };
  }
  const jaws = new Map();
  function withJaw(base) {
    if (!jaws.has(base)) jaws.set(base, profile(base === 'child', true));
    return jaws.get(base);
  }
  return { adult: profile(false), child: profile(true), posterior, withJaw };
})();
