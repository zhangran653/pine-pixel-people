// Short cuts combine a clipped foundation, locks across the crown, and tapered locks
// around the hairline. Their occupied sections are shared across poses and hair dyes.
const pineShortHair = (() => {
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const tau = Math.PI * 2;
  // Each lock runs from a crown or parting through a guide in plan to a tip on the hairline.
  // The tip is given by its azimuth, height, and the lock's flat half-width.
  const crop = [
    [-0.45, 0.13, -0.27, -0.42, -99, -0.13, 0.24],
    [-0.42, 0.03, 0.12, -0.49, -62, 0.22, 0.235],
    [-0.36, 0.1, 0.42, -0.38, -35, 0.39, 0.24],
    [-0.34, 0.16, 0.59, -0.17, -16, 0.49, 0.245],
    [-0.28, 0.19, 0.59, 0.04, 6, 0.42, 0.225],
    [-0.25, 0.25, 0.47, 0.34, 29, 0.49, 0.23],
    [-0.3, 0.32, 0.12, 0.6, 62, 0.15, 0.24],
    [-0.41, 0.28, -0.15, 0.65, 91, -0.04, 0.23]
  ];
  const sidePart = [
    [-0.59, 0.3, -0.36, -0.25, -111, -0.06, 0.265],
    [-0.37, 0.33, -0.13, -0.34, -82, 0.03, 0.29],
    [-0.13, 0.36, 0.12, -0.31, -55, 0.22, 0.31],
    [0.12, 0.39, 0.38, -0.23, -31, 0.37, 0.3],
    [0.32, 0.41, 0.57, -0.08, -12, 0.49, 0.285],
    [0.49, 0.41, 0.72, 0.11, 8, 0.58, 0.25],
    [-0.45, 0.44, -0.22, 0.66, 97, -0.08, 0.2],
    [-0.16, 0.48, 0.16, 0.7, 66, 0.17, 0.22],
    [0.14, 0.48, 0.43, 0.63, 43, 0.37, 0.21]
  ];
  const pixie = [
    [-0.47, 0.04, -0.29, -0.46, -110, -0.17, 0.22],
    [-0.43, -0.02, 0.06, -0.54, -73, -0.13, 0.24],
    [-0.38, 0.04, 0.32, -0.38, -48, 0.22, 0.26],
    [-0.37, 0.09, 0.5, -0.19, -28, 0.3, 0.25],
    [-0.34, 0.16, 0.5, 0.04, -8, 0.36, 0.245],
    [-0.36, 0.22, 0.42, 0.3, 17, 0.42, 0.22],
    [-0.38, 0.24, 0.17, 0.57, 45, 0.52, 0.2],
    [-0.42, 0.27, -0.05, 0.65, 79, -0.11, 0.205]
  ];
  const brushed = [
    [0.62, -0.55, 0.16, -0.67, -143, -0.14, 0.28],
    [0.8, -0.39, 0.24, -0.47, -157, -0.01, 0.28],
    [0.89, -0.17, 0.22, -0.25, -169, 0.11, 0.28],
    [0.91, 0.06, 0.27, 0, 174, 0.19, 0.275],
    [0.83, 0.27, 0.25, 0.21, 157, 0.11, 0.27],
    [0.66, 0.46, 0.17, 0.45, 132, -0.09, 0.245]
  ];
  const back = [
    [-0.39, 0.05, -0.78, -0.12, -160, -0.45, 0.255],
    [-0.41, 0.13, -0.86, 0.18, 171, -0.45, 0.245],
    [-0.47, 0.17, -0.78, 0.42, 148, -0.32, 0.255],
    [-0.46, 0.19, -0.53, 0.66, 118, -0.16, 0.23],
    [-0.41, 0.02, -0.63, -0.52, -128, -0.24, 0.26]
  ];
  const cuts = {
    buzz: { rise: 0.017, side: 0.018, edge: 0.57, fade: 0.16 },
    fade: { rise: 0.058, side: 0.031, edge: 0.55, fade: 0.57, brush: 0.1 },
    crew: { rise: 0.055, side: 0.045, edge: 0.57, fade: 0.29, brush: 0.25 },
    crop: { rise: 0.073, side: 0.071, edge: 0.62, locks: crop, lift: 0.163, tips: 0.063 },
    'side-part': {
      rise: 0.074,
      side: 0.068,
      edge: 0.65,
      locks: sidePart,
      lift: 0.21,
      tips: 0.07,
      part: true
    },
    pixie: { rise: 0.066, side: 0.05, edge: 0.62, locks: pixie, lift: 0.16, tips: 0.088 },
    undercut: {
      rise: 0.083,
      side: 0.033,
      edge: 0.63,
      fade: 0.56,
      locks: sidePart,
      lift: 0.265,
      tips: 0.105,
      part: true
    },
    'slick-back': {
      rise: 0.073,
      side: 0.064,
      edge: 0.55,
      locks: brushed,
      lift: 0.112,
      tips: 0.031,
      combed: true
    },
    quiff: { rise: 0.085, side: 0.07, edge: 0.57, locks: brushed, lift: 0.33, tips: 0.048, combed: true }
  };
  // Extra clipper length at the crown and flanks; loft, sweep (degrees towards the nape),
  // and lift at the free ends distinguish the scissor cuts. All lengths are in head radii.
  const volumes = {
    buzz: { rise: 0.035, side: 0.036 },
    fade: { rise: 0.063, side: 0.082, deck: 0.05 },
    crew: { rise: 0.075, side: 0.113, deck: 0.085 },
    crop: { loft: 0.225, sweep: -12, fringe: 0.15 },
    'side-part': { loft: 0.205, sweep: -28, fringe: 0.125 },
    pixie: { loft: 0.17, sweep: -22, fringe: 0.135 },
    undercut: { loft: 0.19, sweep: -24, fringe: 0.15 },
    'slick-back': { loft: 0.118, sweep: 25, fringe: 0.045 },
    quiff: { loft: 0.165, sweep: 17, fringe: 0.085 }
  };
  // Locks end at different heights around the fringe, in front of and behind the ear,
  // and at the nape. The points above the ears leave room for the exposed pinna.
  // Tip angle, variation in tip height, half-width in degrees, relative thickness.
  const sideGuides = [
    [19, -0.065, 18, 0.86],
    [43, 0.005, 17, 1.05],
    [66, -0.09, 16, 1.08],
    [89, 0.055, 20, 0.96],
    [112, -0.085, 18, 1.02],
    [135, 0.018, 17, 0.86],
    [157, -0.095, 16, 0.72],
    [177, -0.025, 15, 0.61]
  ];
  const angles = 168,
    rows = 168,
    low = -0.86,
    high = 1.48,
    chartDensity = 52;
  const ix = -1.49,
    iy = -1.27,
    nx = 152,
    ny = 134;
  const cache = new Map();
  const domes = new WeakMap();
  function boundary(head, r, c, s, axis = r.axis) {
    let a = 0,
      b = 1.62;
    for (let i = 0; i < 10; i++) {
      const t = (a + b) / 2;
      if (head.inside(r, axis + c * t, s * t)) a = t;
      else b = t;
    }
    return (a + b) / 2;
  }
  function sideLocks(cut, volume, bearings, hat) {
    const depth = new Float32Array(rows * angles),
      gap = new Float32Array(depth.length),
      tone = new Uint8Array(depth.length);
    const edges = bearings.map((b) => b.edge);
    for (const side of [-1, 1]) {
      for (const [index, [end, delta, width, strength]] of sideGuides.entries()) {
        if (end === 177 && side === 1) continue; // One lock crosses the back midline.
        const handed = cut.part || cut === cuts.pixie ? side : 0;
        const endDeg = side * end + 3 * Math.sin(2.1 * index + side);
        const whorl = ease(114, 176, end);
        const direction = mix(side * volume.sweep, cut.combed ? 23 : -18, whorl);
        const startDeg = endDeg - direction + 7 * handed + 5 * Math.sin(1.7 * index);
        const tipIndex = (Math.floor((endDeg * angles) / 360) + angles) % angles;
        // The undercut retains the clipped band under the heavy top. Brushed hair clears the brow.
        const trim = cut === cuts.undercut ? 0.39 : cut.combed ? 0.19 * Math.max(0, 1 - end / 105) : 0;
        const tip = edges[tipIndex] + delta + trim + handed * 0.06 + 0.025 * Math.sin(index + side);
        const start = 0.94 - 0.038 * (index % 3);
        const length = volume.loft * strength * (1 - 0.23 * handed) * (1 - 0.22 * whorl);
        const light = 0.48 * Math.cos((endDeg * tau) / 360) - 0.48 * Math.sin((endDeg * tau) / 360);
        for (let j = 0; j < rows; j++) {
          const h = low + ((j + 0.5) * (high - low)) / rows;
          const t = (start - h) / (start - tip);
          if (t <= 0 || t >= 1) continue;
          const bend = (8 + 4 * Math.sin(index + 2 * side)) * mix(side, 0.4, whorl) * Math.sin(Math.PI * t);
          const middle = ((mix(startDeg, endDeg, ease(0, 1, t)) + bend) * angles) / 360;
          const halfWidth =
            ((width * angles) / 360) * (0.48 + 0.52 * ease(0, 0.27, t)) * (1 - 0.95 * ease(0.55, 1, t));
          const lift =
            length * (0.43 + 0.57 * Math.sin(Math.PI * t)) * (hat ? 0.49 * (1 - ease(0.12, 0.55, h)) : 1);
          for (let col = Math.ceil(middle - halfWidth - 0.5); col <= middle + halfWidth - 0.5; col++) {
            const q = (col + 0.5 - middle) / halfWidth,
              bevel = Math.sqrt(Math.max(0, 1 - q * q));
            const relief = lift * bevel;
            const i = (col + angles) % angles,
              at = j * angles + i;
            if (relief <= depth[at]) continue;
            depth[at] = relief;
            // The last few sections curl away from skin. Preserve air under these tapered ends.
            gap[at] = relief * 0.44 * ease(0.7, 0.97, t);
            const highlight =
              q < -0.12 &&
              q > -0.64 &&
              t > 0.16 &&
              t < 0.54 + 0.12 * Math.sin(index) &&
              (light > -0.34 || index % 3 === 1);
            tone[at] = q > 0.68 || t > 0.89 ? 1 : highlight ? 3 : 2;
          }
        }
      }
    }
    return { depth, gap, tone };
  }
  function shell(head, cut, hat, volume) {
    const radius = new Float32Array(angles * rows),
      colors = new Uint8Array(radius.length),
      axes = new Float32Array(rows);
    const bearings = Array.from({ length: angles }, (_, i) => {
      const theta = (tau * (i + 0.5)) / angles,
        c = Math.cos(theta),
        s = Math.sin(theta);
      const nape = -0.54 + 0.19 * Math.abs(s) + 0.038 * Math.cos(7 * theta + 0.4);
      const ear =
        0.065 + 0.12 * Math.exp(-((c + 0.09) ** 2) / 0.045) - 0.16 * Math.exp(-((c - 0.29) ** 2) / 0.019);
      const fringe =
        cut === cuts.crop
          ? 0.49 + 0.047 * s + 0.035 * Math.cos(8 * theta + 0.4)
          : cut === cuts.pixie
            ? 0.47 + 0.16 * s + 0.035 * Math.cos(7 * theta)
            : cut.part
              ? 0.495 + 0.16 * s + 0.031 * Math.sin(7 * theta - 0.5)
              : cut.edge - 0.045 * Math.cos(2.8 * theta);
      const edge = mix(mix(nape, ear, ease(-0.89, -0.11, c)), fringe, ease(0.3, 0.86, c));
      return { theta, c, s, edge };
    });
    const locks = volume?.loft ? sideLocks(cut, volume, bearings, hat) : null;
    const inner = locks && new Float32Array(radius.length);
    const lowest = bearings.map((b) => b.edge - 0.105);
    for (let j = 0; j < rows; j++) {
      const h = low + ((j + 0.5) * (high - low)) / rows,
        axis = head.row(h).axis;
      axes[j] = axis;
      const stretch = hat ? 0.012 : cut.rise + (volume?.rise || 0);
      const sourceH = h < 0 ? h : h / (1 + stretch);
      if (sourceH >= 1) continue;
      const section = head.row(sourceH);
      for (let i = 0; i < angles; i++) {
        const { theta, c, s, edge } = bearings[i];
        const at = j * angles + i;
        const lockDepth = locks?.depth[at] || 0;
        if (h < edge && !lockDepth) continue;
        const rim = ease(edge, edge + 0.19, h);
        // Clippers graduate from fine stubble near the ear to a fuller ridge above the temples.
        const sideBulk = hat
          ? 0.026
          : cut.side +
            (volume?.side || 0) * (cut === cuts.buzz ? 0.82 : ease(edge + 0.04, edge + (cut.fade || 0.3), h));
        const flow = theta + 0.52 * h - 0.25 * h * h + 0.2 * Math.sin(2 * theta - 1.5 * h);
        const strand = 0.5 + 0.5 * Math.cos(13 * flow + 1.1 * Math.sin(4 * theta + 0.8));
        const root = boundary(head, section, c, s, axis);
        const crownLock = !hat && cut.locks ? 0.038 * rim * strand * ease(-0.4, 0.28, 1 - c) : 0;
        const cover =
          root +
          (sideBulk * (0.38 + 0.62 * rim) * (0.83 + 0.17 * strand) + crownLock) *
            Math.min(1, 6 * (1 - sourceH));
        if (lockDepth) {
          const foundation = h >= edge ? cover : root;
          const outer = foundation + lockDepth;
          radius[at] = outer * outer;
          inner[at] = h >= edge ? 0 : (root + locks.gap[at]) ** 2;
          lowest[i] = Math.min(lowest[i], h - (high - low) / rows);
          colors[at] = locks.tone[at];
          continue;
        }
        radius[at] = cover * cover;
        const fade = cut.fade ? 1 - ease(0, cut.fade, h - edge) : 0;
        const glint = 0.42 * c - 0.35 * s + 0.51 * h;
        const grain = Math.sin(47 * flow + 13 * h) * Math.sin(59 * h - 8 * s + 3 * c);
        // 1–4 select tinted locks from root to highlight, 5–7 select light to dark stubble.
        if (fade > 0.83) colors[at] = grain > 0.56 ? 6 : 5;
        else if (fade > 0.47) colors[at] = grain > 0.62 ? 7 : 6;
        else if (fade > 0.11) colors[at] = grain < -0.46 ? 6 : 7;
        else if (cut === cuts.buzz) colors[at] = grain > 0.6 ? 3 : glint < -0.32 ? 7 : 2;
        else if (volume?.side)
          colors[at] = glint + 0.32 * grain > 0.56 ? 3 : glint + 0.17 * grain < -0.37 ? 1 : 2;
        else
          colors[at] =
            (glint < -0.29 && strand < 0.6) || (strand < 0.15 && h < 0.62)
              ? 1
              : strand > 0.66 && (glint > -0.68 || h > 0.08)
                ? strand > 0.95 && glint > 0.1 && h > 0.05
                  ? 4
                  : 3
                : 2;
      }
    }
    return { radius, colors, axes, inner, lowest };
  }
  function canopy(head, cut, volume, taperedFringe) {
    const hi = new Float32Array(nx * ny).fill(-2),
      lo = new Float32Array(nx * ny).fill(2);
    const shade = new Uint8Array(nx * ny);
    let dome = domes.get(head);
    if (!dome) {
      dome = Float32Array.from({ length: nx * ny }, (_, i) =>
        head.topAt(ix + ((i % nx) + 0.5) / chartDensity, iy + (Math.floor(i / nx) + 0.5) / chartDensity)
      );
      domes.set(head, dome);
    }
    if (cut.brush)
      for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
          const x = ix + (i + 0.5) / chartDensity,
            y = iy + (j + 0.5) / chartDensity,
            n = j * nx + i,
            z = dome[n];
          if (z > 0.36) {
            // The crew cut has a softly clipped deck, rising above the brow at the front.
            const comb = Math.cos(
                29 * y - 4 * x + Math.sin(11 * x) + (volume ? 0.8 * Math.sin(6 * y + 4 * x) : 0)
              ),
              front = ease(-0.82, 0.72, x);
            const gain = cut.brush * (0.36 + 0.8 * front) * ease(0.36, 0.78, z);
            const lift = volume ? volume.deck * (0.58 + 0.42 * front) : 0;
            const deck = (cut === cuts.crew ? 1.085 : 1.052) + 0.108 * x - 0.057 * y * y + lift;
            hi[n] = Math.min(z + gain + lift + 0.018 * comb, deck + 0.012 * comb);
            lo[n] = z - 0.11;
            const bristle = volume ? Math.sin(24 * x + 4 * y + Math.cos(14 * y)) : 0;
            shade[n] = comb > 0.72 && bristle > -0.28 ? 3 : comb < -0.78 && bristle < 0.1 ? 1 : 2;
          }
        }
    if (!cut.locks) return { hi, lo, shade };
    const guides = cut.combed ? cut.locks : [...back, ...cut.locks];
    for (const [index, g] of guides.entries()) {
      const [ax, ay, mx, my, angle, tipHeight, w] = g,
        theta = (angle * Math.PI) / 180,
        c = Math.cos(theta),
        s = Math.sin(theta);
      const forward = ease(-0.1, 0.85, c);
      const stagger = taperedFringe ? forward * (0.046 + 0.080 * Math.sin(2.2 * index)) : 0;
      const h = tipHeight + stagger - (volume ? forward * (0.03 + 0.04 * Math.sin(2.8 * index)) : 0);
      // Scissor-cut tips drop around the forehead at different lengths. Leave loft
      // at the parting and lift each end separately from the hairline.
      const reach = taperedFringe ? 1 - forward * (0.47 + 0.15 * Math.cos(1.9 * index)) : 1;
      const section = head.row(h),
        radius =
          boundary(head, section, c, s) +
          cut.tips +
          (volume ? volume.fringe * reach * (0.31 + 0.69 * forward) * (0.87 + 0.13 * Math.sin(index)) : 0);
      const bx = section.axis + radius * c,
        by = radius * s;
      // A quadratic passing through the guide at its midpoint controls the flow across the head.
      const ctrlX = 2 * mx - (ax + bx) / 2,
        ctrlY = 2 * my - (ay + by) / 2;
      const rear = !cut.combed && index < back.length;
      const path = [];
      for (let n = 0; n <= 16; n++) {
        const t = n / 16,
          rev = 1 - t,
          x = rev * rev * ax + 2 * t * rev * ctrlX + t * t * bx,
          y = rev * rev * ay + 2 * t * rev * ctrlY + t * t * by;
        const surface = head.topAt(x, y),
          fall = ease(cut.combed ? 0.55 : 0.63, 1, t);
        const arch =
          (rear ? 0.073 : cut.lift) +
          (volume ? volume.fringe * (rear ? 0.13 : 0.4 + 0.23 * Math.cos(1.8 * index)) : 0);
        const crown = cut.combed
          ? Math.exp(-(((t - 0.24) / 0.29) ** 2))
          : 0.55 + 0.45 * Math.sin(Math.PI * t);
        const z = mix(Math.max(surface, h) + arch * crown, h, fall);
        path.push({ x, y, z, t, surface, fall });
      }
      for (let n = 1; n < path.length; n++) {
        const a = path[n - 1],
          b = path[n],
          dx = b.x - a.x,
          dy = b.y - a.y,
          L = dx * dx + dy * dy;
        if (L < 1e-8) continue;
        const fromX = clamp(Math.floor((Math.min(a.x, b.x) - w - ix) * chartDensity), 0, nx - 1);
        const toX = clamp(Math.ceil((Math.max(a.x, b.x) + w - ix) * chartDensity), 0, nx - 1);
        const fromY = clamp(Math.floor((Math.min(a.y, b.y) - w - iy) * chartDensity), 0, ny - 1);
        const toY = clamp(Math.ceil((Math.max(a.y, b.y) + w - iy) * chartDensity), 0, ny - 1);
        for (let j = fromY; j <= toY; j++)
          for (let i = fromX; i <= toX; i++) {
            const x = ix + (i + 0.5) / chartDensity - a.x,
              y = iy + (j + 0.5) / chartDensity - a.y;
            const p = clamp((x * dx + y * dy) / L, 0, 1);
            const t = mix(a.t, b.t, p);
            const taper = taperedFringe ? 1 - 0.34 * forward * ease(0.5, 0.95, t) : 1;
            const width = w * (0.49 + 0.51 * ease(0, 0.3, t)) * (0.055 + 0.945 * Math.sqrt(1 - t ** 3)) * taper;
            const q = (Math.sign(dx * y - dy * x || 1) * Math.hypot(x - p * dx, y - p * dy)) / width;
            if (Math.abs(q) >= 1) continue;
            const at = j * nx + i,
              fall = mix(a.fall, b.fall, p);
            const slope = clamp(dome[at] - mix(a.surface, b.surface, p), -0.26, 0.26) * (1 - 0.88 * fall);
            const center = mix(a.z, b.z, p) + slope;
            const rib = Math.sqrt(1 - q * q),
              depth = (rear ? 0.09 : 0.111) * (1 - 0.6 * t);
            const top = center + rib * depth;
            let bottom = center - rib * (0.076 + 0.12 * (1 - fall));
            if (dome[at] > 0.49 && dome[at] > center - 0.27 && fall < 0.64)
              bottom = Math.min(bottom, dome[at] - 0.035);
            lo[at] = Math.min(lo[at], bottom);
            if (top < hi[at]) continue;
            hi[at] = top;
            const shine =
              (q + 0.24 - 0.14 * t) ** 2 / 0.24 + (t - 0.48 - 0.065 * Math.sin(2 * index)) ** 2 / 0.115;
            shade[at] =
              q > 0.82
                ? 1
                : shine < 0.3 && index % 3 !== 1 && !rear
                  ? 4
                  : shine < 1 || (q < -0.39 && q > -0.63 && t < 0.76)
                    ? 3
                    : 2;
          }
      }
    }
    if (cut.part) {
      for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
          const at = j * nx + i,
            x = ix + (i + 0.5) / chartDensity,
            y = iy + (j + 0.5) / chartDensity;
          if (!shade[at] || x < -0.67 || x > 0.78) continue;
          const gap = 0.065 * Math.sin((Math.PI * (x + 0.67)) / 1.45);
          const distance = Math.abs(y - (0.35 + 0.115 * x - 0.094 * x * x));
          if (distance >= gap) continue;
          const part = 1 - distance / gap;
          hi[at] = mix(hi[at], Math.min(hi[at], dome[at] + 0.057), part);
          if (part > 0.32) shade[at] = 1;
        }
    }
    return { hi, lo, shade };
  }
  function get(id, base, hat, layered = false, refitNape = false, naturalProfile = false) {
    if (!Object.hasOwn(cuts, id)) return null;
    const taperedFringe = naturalProfile && layered && !hat && ['crop', 'side-part', 'pixie'].includes(id);
    const key = base + '/' + id + (hat ? '/hat' : '') + (layered ? '/layered' : '') +
      (refitNape ? '/nape' : '') + (taperedFringe ? '/taper' : '');
    if (cache.has(key)) return cache.get(key);
    const head = pineHeadShape.scalp(base, refitNape),
      cut = cuts[id],
      volume = layered ? volumes[id] : null,
      foundation = shell(head, cut, hat, volume);
    const locks = (cut.locks || cut.brush) && !hat ? canopy(head, cut, volume, taperedFringe) : null;
    const read = (x, y, h) => {
      if (h < low || h >= high) return 0;
      const row = Math.floor(((h - low) * rows) / (high - low)),
        dx = x - foundation.axes[row];
      const angle = (Math.floor((Math.atan2(y, dx) * angles) / tau) + angles) % angles;
      if (h < foundation.lowest[angle]) return 0;
      if (locks) {
        const i = Math.floor((x - ix) * chartDensity),
          j = Math.floor((y - iy) * chartDensity);
        if (i >= 0 && i < nx && j >= 0 && j < ny) {
          const at = j * nx + i;
          if (h >= locks.lo[at] && h <= locks.hi[at])
            return h < locks.hi[at] - 0.07 && locks.shade[at] === 4 ? 3 : locks.shade[at];
        }
      }
      const at = row * angles + angle;
      const distance = dx * dx + y * y;
      return distance <= foundation.radius[at] && (!foundation.inner || distance >= foundation.inner[at])
        ? foundation.colors[at]
        : 0;
    };
    cache.set(key, read);
    return read;
  }
  // Each view study is carved into one circular array of sections. Bearing is
  // never an input; the same occupied and dyed cells turn in Canvas and Three.
  const modelCutCache = new Map();
  function modelCut(id, base) {
    if (id !== 'crop' && id !== 'side-part') return null;
    const key = id + '/' + base;
    if (modelCutCache.has(key)) return modelCutCache.get(key);
    const encoded = pineModelShortCuts[id === 'crop' ? 'crop' : 'part'];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const rows = 90, columns = 144, stride = 2 + 2 * columns;
    const cells = new Uint8Array(rows * stride);
    let pos = 0;
    // Every RLE packet is three bytes, which aligns exactly with four Base64 digits.
    for (let i = 0; i < encoded.length; i += 4) {
      const bits = (alphabet.indexOf(encoded[i]) << 18) | (alphabet.indexOf(encoded[i + 1]) << 12) |
        (alphabet.indexOf(encoded[i + 2]) << 6) | alphabet.indexOf(encoded[i + 3]);
      const count = bits >>> 16, a = (bits >>> 8) & 255, b = bits & 255;
      for (let j = 0; j < count; j++) { cells[pos++] = a; cells[pos++] = b; }
    }
    // Fit the sampled coat of hair outside the actual head. The margins and
    // folds come from the illustrated cut; a larger rear skull still gets roots.
    const outer = new Float32Array(rows * columns);
    const head = pineHeadShape.scalp(base);
    for (let j = 0; j < rows; j++) {
      const h = -.66 + (j+.5)*2.09/rows, offset = j*stride;
      const cx = (cells[offset]-128)/80, cy = (cells[offset+1]-128)/80;
      const scalp = head.row(Math.min(.998,h));
      for (let a = 0; a < columns; a++) {
        const address = offset + 2 + 2*a;
        if (!cells[address+1]) continue;
        const theta = a*tau/columns, co = Math.cos(theta), si = Math.sin(theta);
        let lo = 0, hi = 1.7;
        if (h < 1) for (let n = 0; n < 8; n++) {
          const mid = (lo+hi)*.5;
          if (head.inside(scalp, cx+co*mid, cy+si*mid)) lo=mid;
          else hi=mid;
        }
        // The customisable occiput and temples need continuous material at
        // the roots even where the side drawing narrows into its nape.
        const fit = .12 + .09 * Math.max(0,-co);
        const guide = cells[address]/150;
        const skirt = h < .77 ? clamp(guide - lo, .0, .158) : guide-lo;
        const root = lo + fit * (1-ease(.78,1,h));
        const front = Math.max(0, co) * (1-ease(.75,1.05,h));
        const r = Math.max(guide * (1-.052*front), root + .42*Math.max(0,skirt));
        outer[j*columns+a] = r*r;
      }
    }
    function read(x, y, h) {
      const row = Math.floor((h + .66) * rows / 2.09);
      if (row < 0 || row >= rows) return 0;
      const offset = row * stride;
      const dx = x - (cells[offset] - 128) / 80, dy = y - (cells[offset + 1] - 128) / 80;
      const angle = ((Math.round(Math.atan2(dy, dx) * columns / tau) % columns) + columns) % columns;
      const address = offset + 2 + angle * 2;
      const d2 = dx * dx + dy * dy;
      if (d2 > outer[row*columns+angle]) return 0;
      return cells[address + 1];
    }
    modelCutCache.set(key, read);
    return read;
  }
  return { get, modelCut };
})();

// Generated by tools/bake-model-short-hair.py from figure-model-guide.webp.
const pineModelShortCuts = {
  part: [
    'AYCAkAAAAYCAkAAAAYCAkAAAAXh+kAAAAXt+RQAAAVIHSgAAAYZ+QwAAAVQDAVUDAVMGAVYEAVcEAVgGRwAAAYx/QAAAAVYHAVYEAVcCAVUDAlYDAlgDAVkFAVsEAVwI',
    'AQAAAVsIAVoIAVkIQQAAAZB+OgAAAVMBAVQBAVYBAVgDAVoFAVwGAVgGAVgDAVkCAVgCAVkCAVoCAlsCAVsDAVwEAV4HAWAEAVwHAVsHAVoHAVwDAVoBAVkBAVgBAVcB',
    'AVYBAVQBAVMBOQAAAZJ+NwAAAVQBAVUBAVYBAVUBAVYBAVcBAVkDAVsEAV0FAVsDAVsCAl0DAV4DBF8DAWADAWAEAWEDAV8CAV4CAV0CAV0DAVwBAVsBAVoBAVkBAVcB',
    'AVYBAVUBOQAAAZB+NgAAAVcDAVUBAVYBAVgBAVcBAVkBAVoBAVwBAV0CAV8DAV4BAV8CAWEDAWIDAmMDBGQDAWQCAWMCAWIBAWEBAmABAV4BAV0BAVwBAVsBAVoBAVkC',
    'AlgCOAAAAY9/NgAAAVgDAVcBAVgBAVoBAVsBAVwBAV0BAV8BAWABAWICAWIBAWMBAWUDAWYDAmcDBGgDAWcCAmYBAWUBAWQBAWMBAWIBAWEBAWABAV4BAV0BAV0DAVsD',
    'AVoDOAAAAY2ANgAAAVkBAVoBAVsBAVwBAV4BAV8BAWABAWEBAWMCAWQCAWUBAWYBAWgDAmkDA2oDAWsDAWoDAWoCAmkBAWcBAWYBAWYCAWUBAWQBAWIBAWEBAWABAWAD',
    'AV4EAV0EOAAAAY2ANgAAAVsBAVwBAV0BAV8BAWABAWEBAWICAWMCAWQCAWYDAWcCAWgDAWkDAmoDAWsDA2wDAWsDAWsCAmoCAWkBAmgBAWYCAWUBAWQBAWMBAWIBAWEC',
    'AWADAWAEOAAAAY2ANgAAAV0BAV4BAV8BAWECAmICAmQCAWUCAWcCAWgDAWkDAmoDAmsDA2wDA2sCAWoCAmkCAWgCAmcCAWUCAWQBAWMBAWIBAWIDAmEENwAAAY9+NgAA',
    'AWADAWEDAWIDAWMDAWQDAWQCAWUCAWYCAWcCAWgDAWkDAmoDA2sDAmwDBGsCAmoCAmkCAWgCAWgDAWcDAWYDAWUCAWQBAWQCAmMENwAAAY9+NgAAAmQDAWUDAWYDAmcD',
    'AmgDAWkDAmoDAWsDAmwDAmwCAW0CAW0DAW0CBGwCAmsCAWoCAmoDAmkDAWgDAWcDAWYCAWYDAWYEAQAAAWgHNQAAAY5+NAAAAnADAmkDAWoDAmsDAmwDAm0DA24DA28D',
    'AW8CAXACAnADBm8CAW4CAm4DAm0DAWwDAWsDAmoCAWoEAQAAAWsGAXACAXADMwAAAYt+MgAAAnQDAXEDAXIDAW8DAnADAnEDA3IDAnMCA3QCCnUCA3QCAXQDAnMDA3ID',
    'AXACAnADAQAAAW8DAXECAXEDAnQDMQAAAYl/MAAAAnkDAXYDAXcDAXUDAXYDAXUDAXYDAncDAXgDAXgCAnkDAXoDBHoCC3sCA3oCAnoDAnkDAXgDA3YCAQAAAnUCAXUD',
    'AnYDAnkDLwAAAYd/LgAAAn8DAnsDA3oDAXsCAXsDAXwDAn0DAn4DAX8DA4ADAYACAoECC4ICAoECAYACAYEDAYADAn8DAX4DAX0BAXwBAXwCAQAAAnsDA3oDAnsDAn8D',
    'LQAAAYN/LgAAAoADA38DAYADAoACAYECAoIDAYMDAoQDAYUDA4YDAYYCAocCCogCAYgDAYcDAYcCAYYCAYYDAoUCAYQCAYMBAoIBAYMEAQAAAYECAoACBH8DAoADLQAA',
    'AYJ/LQAAAYQCAYIDBIMDAYQDAYQCAoUCAYYCAYcCAYcDAogDAooDAYsDA4sCA4wCB40CAo0DAYwDA4sCAYoCAYkBAogBAYcBAYcCAYkGAQAAAYUBAYUCAYQCAYMCBIMD',
    'AYIDAYQCLAAAAYF/LQAAAYUCA4YDAYcDAYcCAYgDAYgCAokCAooCAYsCAowCAY4DAY4CA48DAY8CA5ACBZECApEDAZECApADAo8CAo4CAY0BAYwBA4sBAY0GAQAAAokC',
    'AYgCAocCAYcDA4YDAYUCLAAAAYF/LQAAAYgCAokDA4oCAosCAYwCAo0CAo4CAY8CAZACAZEDApIDApMDApMCBZQCApUCA5UDApQCAZMCApICAZECAZABAo8BAo4BAZEG',
    'AQAAAYwBAYwCAosCA4oCAokDAYgCLAAAAYF/LQAAA4wCAo0CAo4CAo8CAZACApECAZICApMCAZQCAZUDApYDAZcDAZcCAZcDA5cCBJgCAZkDApgDApcCApYCAZUCAZQB',
    'ApMBApIBAZICAZQFAQAAAZACAo8CAo4CAo0CA4wCLAAAAYJ/LQAAAZAEAo4CAo8CAZACApECAZICApMCApQCAZUCAZYCAZcCApgCAZkDApoDBJoCApsCA5wDApsDApoC',
    'ApkCAZgBAZcBApYBApUBAZQBAZYEAQAAAZMCAZICApECAZACAo8CAo4CAY8ELAAAAYJ/LQAAAZMHAo8BApECAZICApMCAZQCApUCAZYCAZcCApgCAZkCAZoCAZsCAZsD',
    'ApwDAZwCBJ0CAZ4CAp8DAp4DAp0CApwCAZsCAZoBApkBAZgBAZgCAZcCAZYBAZcDAQAAAZUCAZQCApMCAZICApECAo8BAZIHLAAAAYF/HwAAAZcIAZYHDAAAAZQGApEB',
    'ApMCAZQCApUCAZYCAZcCApgCAZkCApoCApsCAZ0DAZ0CA54CAZ8CA6ACAaADAqEDAqADAZ8DAZ8CAp4CAZ0CAZwCAZwBAZsBApoCAZkCAZgBAZkCAQAAAZcCAZYCApUC',
    'AZQCApMCAZEBAZABAZIIDQAAAYoHHgAAAX99HgAAAZcFAZYHAZYGCwAAAZsIAZQCAZMBAZMCApUCApYCAZcCApgCApoDAZsCA5wCAZ0CAp4CAp8CAaACAaEDAqMEAaIE',
    'A6IDAaEDAqECAqACAp8CAp4CAZ0CAZwCAZ0DAZsBAZoCAZwEAQAAApgCAZcCApYCApUCAZMCAZABAZEGDQAAAYkGAYkDHQAAAX58HgAAAZgEAZcDAZcECwAAAZoHAZUB',
    'ApYCApcCApgCApkCAZoCA5wDAp0DAZ0CAp4CA58CAaACAaIEAqQFAaIEA6IDAqECA6ACA58CAZ4CA54DAZwBAZwDAZ4GAQAAApoCAZkCApgCApcCAZUCAZIBAZECAZQI',
    'CwAAAYkCAooDHQAAAX16HgAAA5kDAZwDCQAAAaAHAZkDAZcBApgCA5kCApoCApsCBJ0DA50CA54CAZ8CAaACAaIFAaQHAaIFA6EDAaECAaACB58CAp4CAp4DAZwCAZwD',
    'AaAGAQAAApsCApoCA5kCAZgCAZUCAZMBAZUHAZgHCgAAAYsCAYwDAY0CHQAAAXt5HgAAApwDAZwEAZ0DCQAAAZ8GAZoBAZoCBZsCA5wCAZwDAZ0DAZ4EAp0DBZ0CAZ0B',
    'AZ4CAZ8EAaEGAaIHAaAEAp8DAZ4CAp8DAp0BAZ0CAp4CBZ4DAZ0DAZwCAZwBAaAGAZwDAp0DAZwDAZwCA5sCAZoCAZkCAZcCAZYCAZgGCQAAAZIDAY8EAZEEAZABHQAA',
    'AXt5HgAAAaAFAp8EAZ8DCQAAAZ8CAZwBCJ0CA54DAZ8EAp4DAZ0CBZwCAZ4EAZ8FAqEHAZ4EAZ0EAp0DAp4EAZwCAZsBApwCBp0DAZ0CAZwCAZwBAZ8EAp0DAZ4DB50C',
    'AZsCAZoBAZkCCQAAAZQDAZQEAZYEAZQBHQAAAXp6HgAAAaMGAqIEAaEDAaYEBgAAAakHAaIBAaABAZ8BB58CAZ4CAZ8DAp8EAaAEAZ8DAZ4DAZ0DAp0CAZwCAZwBAZ0D',
    'AZ4FAZ8GAaAHAaEHAZ4EAZ0DAZwDAp0EAZ4EAZ0DA5wCAZ0EAZ0DAp4DAp0DAp0CAZwBAZ4CAZ0CAZ4BAp8DB58CAZ0BAZsBAZ4BBwAAAZwEAZcDAZgEAZoEAZkBHQAA',
    'AXp7HgAABKQEAaYEAagFBQAAAagGAaMBAaEBAqICBKECAaEDAaECAaACAaEDAaEEAqEFAaADAp8DAZ4DAp8CAZwBAZ4EAZ8FAaAGAaEGAaEHAZ4EAZ4DAZ0DAp4EAZ8F',
    'AZ4EAZ0DAZwCAZ0DAZ4DAZ4EAZ8EAZ8DAaACAZ8CAZ4CAp0BAZ4CAZ8CAZ8BAqACAaECAaEDBqECAp4BAaAEBQAAAZ4FAZwEAZsEAZwEAZ0EAZ0CHQAAAXl7HgAAAaQD',
    'A6UEAaUDAacFBAAAAqYEBKMCAaICAqMCAaMDBKIDAaMEAqMFAaEDAqADAaACAqICAaACAaAEAaEFAqIGAaIHAaAFAp8EAaAEAaAFAaEFAaAFAaAEAZ4DAp8DAaAFAaEF',
    'AaQCAaMCAaICAZ8CAZ4BAp8BAaACAaEDBKIDAaMDAqMCAaICAqMCAaECAZ8BAZ8DAaEHBAAAAZ0FAZwDAZwEAZ4EAZ8EAZ8CHQAAAXh7HgAAAaQCBKUDAaYEA6UEAaMC',
    'AaUEAaUCAaQCBKMCAaQCAqQDBKMDA6QEAaICAqIDAaUEAacEAaYEAaUEAaUCBKQGA6IEAaIFBKMFAaIEAqEDAaIEAaUEAagEAacEAaUEAaICAaABAaECAaEBAaECBaMD',
    'AqQDAaQCA6MCAaECAZ8CAZ4CAaAGAZwDBJwEAZsCAZ0DAZ4DAZ8DAZ8CHQAAAXZ6HgAAAaMCAaQCAqQDAqQCAqQDAaQEAaMCAqQDAaQCA6MCAaQDAaUEAaYFAaUEBKQD',
    'A6UEAaMCAaQDAaYEAakEAawEAasEAaoEAaoCAacGAqYGAaYFAqUEAaUFA6YFAacGAacHAqUEAaMDAaUEAasEAa0EAasEAagEAaYCAaICAaMCAaIBAaMCAaUEBKQDAaUE',
    'AaYFAaUEAaQDAqMCAaECAaACAp4DAZwDAZsEApsDApsCAZwCAZ0DAZ4CAZ8CHQAAAXV6HgAAAaMCBKQDAaQCAqMCAqQCA6QDA6QCAaUDAacFAagGAaYEAqUDAqYDA6cE',
    'AaUCAaYDAasEAa4EAbIEAbEEAa8EAbAEAa0CAqoFBakFAaoFAaoGAqsHAaoGAakGAacDAasEAa8EAbEEAbAEAa0EAawEAakCAaYDAaQBAaUCAaYEAqYDAqUDAaYEAagG',
    'AacFAaUDAqQCAaICAaADAZ8DAZ4DAZwCBJsCAZsDAZwDAZ0CAZ4CAZ8CHQAAAXV7HgAAAaMBA6QCAqQDAqMBAaQCAaQDA6UDAqQCAaUCAaYDAagFAakGAagEBKcDAqkE',
    'AakDAagDAa0EAbEEAbMEAbcEAbYEAbUEAbQEAbICBK0FAqwFAa0FAq4GAq8HAq4GAasDAbAEAbQEArUEAbMEAbIEAa8EAaoCAaYBAacDAagEBKcDAagEAakGAagFAaYD',
    'AaUCAaQCAaMCAaIDAaADAZ8DAZ0DAZwCApsBApwDAZ0CAZ4CAZ8CAaABHQAAAXZ8HgAABKQBAaQCAaUCAaQDAaQCAaUDAqUCBaYDAacDAakEAqsGAaoEAakEAqoDAqsE',
    'AawEAbEEAbIEAbYEAbgEArwEAboEAbgEAbcCAbIGAbEFAbAEAbEEAa8DAbADAbEEAbIGAbMHArQHAbMHAbIGAbAEAbUEAbkEAbsEAboEAbgEAbcEAbUEAbICAaoCAakC',
    'A6oDAakEAaoEAqsGAakEAacDAqYDAaUDAaQDAaIDAaEDAZ8CAZ4DAZ0CAZ0DAp4CAZ4BAZ8BAaECAaIBHQAAAXd9HgAAAaYBAaUCAaUBA6UCAaYDAaUDAqYDAacDAaYD',
    'A6cDAagDAakEAaoDAawGAa0GAawFAqwEAasDAa0EAa4EAbMEArgEAboEAb0EAb8EAcAEAb8EAbwEAboCAbUGAbQFArMEAbEBAbICAbMEAbQEAbYGArcHAbYHAbUGAbMF',
    'AbkEAb0EAb4EAb8EAb0EAbsEAbkEAbgEAbECAawCAawDAasDAqwEAawFAa0GAawGAaoDAakEAagDAqcDAaYDAaQDAaMDAaIDAaEDAqADAqACAaEBAaIBAaMCAaUCHQAA',
    'AXl/HgAAA6cCAacDBKcCAqcDAagEAqgDAqkDAqoEAasEAa0GAq4GAa0EAq0DAa8EAbQEAbkEAbsEAr0EAb4EAcAEAcIEAcEEAb8EAbsCAbcGAbYFAbUEAbQDArIBAbQD',
    'AbUDAbcFAbcGAbgGAbgHAbcGAbUFAboEAb4EAcAEAcIEAcEEAcAEAb0EAbsEAbcEAbMCAa0CAq0DAa0EAq4GAa0GAasEAqoEAqkDAagDAaYDAaYEAaQDAaMDBKMCAaQD',
    'AaQCAaYCAacCAakCAaoCGwAAAX2BHAAAAasCAasDCakDAakCAakDA6oDAasDAawEAasDAawEAa4GA68FAa8EAa4DAbUEAbkEAb0EAb4EA78EAcEEAcIEAcEEAb8CAbsC',
    'AbcGAbYFAbQDAbMBArIBAbMBAbQDAbUEAbYEAbYFArgHAbYGAbsEAb4EAcAEAcMEAsIEAcAEAb4EAboEAbkEAbYCAa4DAa8EA68FAa4GAawEAasDAawEAasDAqoDAakD',
    'AagDAaYCAqYDA6UDAaYDAacDAqkDAaoCAqsCAawDGQAAAX+BGgAAAbAFAa0DAawCAawDA6sDAawDA6sDAawEAasEAqsCAqwDBK0EAa0DAa8FAbAGA7AFAbYEAboEAb0E',
    'AcAEAsEEAb8EAcAEAcIEAcEEAcAEAbwCArYGAbUFArMCBLIBAbMDAbQDAbUEArcHAbYGAbkEAb0EAcAEAcEEAsMEAcIEAb8EAr0EAboEAbcCA7AFAbAGAa8FAa0DBK0E',
    'AawDAasDAaoCAakCAqgEA6gDAakDAaoDAqsDAawDAqwCAa4EArEGAbAFFgAAAYGBGAAAArIEAbEFBK4DAa0DA64DAa4CAa8CAa4EAa0EAa0DAa0CAq4DAa8EArAEAq8D',
    'AbEFAbEGAbEFAbEEAbgEAbsEAb0GAcAGAsIGAcMEAsAEAcEEAcAEAb4CAboCAbYGAbYFAbUFAbICArMDAbICA7IBAbMDAbQEAbYGAbcHAbYGAbUFAbsEAb8EAcEEAcIE',
    'AcQEAcIEAcAEAr8EAb4EAbwEAbkCAbEEAbEFAbEGAbEFAq8DArAEAa8EAq4DAawCAasDAaoEAasEAaoEAasEAaoDAasDAawDAa0DAa4DAa4EAq4DAbAFAbEGAbIGAbEF',
    'AbIEAbMEFAAAAYJ/FgAAArQEArMEAbIDAbEDAbEEArADAbACAbEDArEEAbMCAbUCAbQCAq8CAbADArEEAbIEArMGAbIEAbMFAbQGAbMFAbQEAbkEAb0EAb8GAcEGAcMG',
    'AcQGAcQEAcMEA8IEAb8CAbwCArcGAbcFAbYFAbQEA7UEAbQDAbMCAbMBAbMCAbQDAbYFAbcGArYFAboEAb8EAcIEAsQGAcMGAcIEAcMEAcQEAcIEAcEEAb8EAbkCArMF',
    'AbQGAbMFAbIEArMGAbIEAbEEAbAEAa4DAa0CAawCAa0EAawEAq0EAa4EAa4DAa8CAbADAbEDAbEEAbADAbEDAbIEAbMFAbIEAbMEAbQEAbUEAbQCAbMBAbMCEAAAAYJ+',
    'EwAAAbQCAbcEAbgEArUEArQEArMDAbQDAbMDArICArMEAbIEAbgEAbkEAbgEAbUCAbECAbIDAbQEAbUEAbUFArYHAbUEAbYGAbcGAbgEAbwEAb8EAcIGAcQGAcUGAccG',
    'AccEAsYEAcMEAcQEAcMCAb8CBLkGArgFAbkFAbgFAbkFArcEAbYCAbUBAbYDAbgEAbkGA7gFAb4EAcIEAcQGAcUGAcQGAcYGAscEAcYEAcUEAcMEAb8EAbwCAbcCAbcG',
    'AbYGAbUEArYHAbUFAbQEAbIEArECAa8CAq4EAa8FAq8EAbAEAbEDAbECAbMEAbQDAbMDAbMCAbQDArQEAbUEArYEAbUDAbQBAbQCAQAAArgCDQAAAYJ9DwAAAbkDAbgD',
    'AQAAAbkDAbUCAbgEAbkEArcEAbYDAbUCArUDAbYEAbUDAbMCAbMDArQEAbgEAbwEAb0EAbwEAbkEAbQCAbQFAbYFAbcGArgGAbkGAbgGAbkGAbsEAb8EAcEEAcQGAccG',
    'AcgGAccGA8kEAcgEAcUEAcQCAcMCAb0HA70GAb0FBLwFAb0GAbwFAbsEAboEAbgBAbkCBLwFAbsFAbsEAcIEAcUEAsYGAsoGAcoEAsgEAcYEAcQEAcEEAb8CAboCAbkG',
    'AbgGAbkGArgGAbcGAbQFArcCAbQCA7AFAbEFAbEEAbIEAbIDAbMCAbUDAbYEArUDArUCAbYDAbcEArgEAbkEAbcDAbcCAQAAArkCAwAAAr8FAbwCAbsBAb4EAbsBAb4D',
    'AwAAAYJ8CgAAAb4DAwAAAb8HAboDAbkDAQAAAboEAbcCAroEAbkEAbgEAbcDAbYCArYDAbcEAbUCAbQCAbMDAbMEAbgEAbwEAr4EAb0EAbsEAbcCAbQFAbYFAbgGArkG',
    'AroGAb0EAcEEAcQEAcUGAccGAckGAcoGAckEA8oEAckEAcUCAcMCAcAHBMAGAsAFAcAGAsAFAcAGAb8FAr4EAbsBAb0DAb4EBL8FAb4FAcAEAcQEAcYEAcgGAcoGAcsG',
    'AcwGAsoEAckEAcgEAcUEAcQEAcECAbsCAroGArkGAbgGAbsEArwEAbkEAbYCArEFArIFAbMEAbQEAbQCAbUCAbcEAbYEAbYDAbcDAbYCAbcDAbgEAbkEAboEAbsFAboE',
    'AboDAQAAAbsDAboCAwAAAb8FAcAFAb0CAbwBAb8EAb0BAb8DAwAAAYN8CQAAAcIFAb8DAwAAAb4GArsEAQAAAbsFAbkDAbsGAboEAbkEAbgEAbYCArYDArYEAbQDAbMD',
    'AbIEAbcEAbsEAbwEAr0EAbwEAboEAbYCAbEFAbMFAbYGAbcGAbgGAbkGAbsEAcEEAcMEAcUGAcYGAckGAcoGAcoEAckEAcgEAckEAcoEAcgCAcMCAb4EAcEHAsEGBMIG',
    'A8MGAcMFAcIFAsEEAb8CAb8DAcADAsEFA8EGAcAFAcAEAcQEAccEAcoGAssGAckGAcoEAckEAcoEAccEAcYEAcQEAcECArkGArgGAbkEAb4EAr8EAb0EAbsEAbYCAbEE',
    'AbIFAbMFAbQFAbQEAbQDAbUDAbYEA7YDArYCAbgDAboEAbsFAbwGAbsFAbwFAQAAAbwEAbwDAwAAAsAFAb8DAb0BAcEFAb8DAcAEAwAAAYN/CQAAAcEEAcAEAwAAAb0F',
    'AbsEAbwFAbsHAroFAboGAbkGAbcFArUDAbQDArQEAbMEAbEDAbAFAbYEAbkEA7sEAboEAbgEAbYEAbMCAawDAa4EAbIGAbQGAbYGAbgEAb0EAcAEAcMGAcQGAcUGAccG',
    'AsgEAccEAsYEAcUCAcQCAb8GAb8FAcEFAsIGAsMGA8QGA8UGAsQFAcMEAcEDAcABAb8CAcMFAsMGAsIGAcEGAb4EAb8EAcQEAccEA8gGAckGAskEAcYEAcUEAcMEAcAC',
    'Ab0CAbcGArYGAbkEAb0EA78EAb4EAbsEAbUCAbEFAbIFA7MFAbMDAbQFArQEAbUEAbQDAbUCAbYEAbkFAboGArsGAbwFAb0GAbwEAbsDAwAAAcAFAcEFAcADAb4BAcIF',
    'AcEEAcEDAQAAAsICAYOAAcECCAAAAb8DAcAFAwAAAbsDAbsEAbsGAbkGAbkFAbkGAbgGAbcGAbQEArIDAbIEArEEAa8EAa4FAbYEAbgEAboEAbsEAboEAbkEAbgEAbYE',
    'AbMEAa8CAagDAasEAa0FAbAGAbIGAbgEAbwEAb4GAcAGAsIGAcQEAcUEAsQEAcMEAsACAb4GAb8GAb8FAcAEAcEGAcIGAcMGAcQGA8UGA8YGAsUFAcQEAcMEAcABAb8B',
    'AcMFAcQGAcMGAcIGAsEGAb4EArwEAcIEAcQEA8UGAcYGAcYEAcQEAcMEAcEEAb8EAbwCAbgCArIGAbUEAboEAb0EAr8EAb4EAbwEAbkEAbUCAa8FBLAFAbAEArEEAbIE',
    'ArIDAbQEAbcGAbgGAbkGAbkFAboGAbsGAbsEAboCAwAAAcAFAcAEAcADAb4CAcIEAcMEAcIDAQAAAsUCAYOBAcoECAAAAb4DAcAFAwAAAbkDArkFAbYEAbYFAbYGAbUG',
    'AbQGAbADAa4DAa8EAa4EAa4FAa0FAa8EAbYEAbkEA7oEAbgEAbcEAbYEAbMEAbACAasCAaYEAagEAaoFAawGAbIEAbUEAbgGAboGAbsGAb0GAb4EA8AEAb4EAb0CAboC',
    'AbsGAbwGAb0GAb4GAb4FAcAGAcEGAcMGAcQGA8UGA8YGA8UFAcQFAcEDAcABAcMFAcQGAcMGAcIGAcAGAb8GAb0FAboDAboEAboFAb4EAcAEA8EGAcIGAcAEAb8EAb0E',
    'AbsEAbkEAbYCAbICAa0GAa8EAbYEAbkEAbwEAb0EArwEAboEAbcEAbQCAasFA6wFAawEAa0FAq4EAa8EAa8DAbAEAbQGAbUGAbYGAbYFAbcEArkFAbkDAbsGAgAAAcAF',
    'AsAEAb8CAcIEAcMEAcIDAcYEAswEAYOAAcsEAccCBwAAAb4EAb4FAwAAAbcDAbgCAbcCAbICAbQFAbMFAbIGAbAFAa0DAasDAasEAqsFAa8EAbUEAbgEAbkEAroEAbkE',
    'ArYEAbQEAbEEAawCAaQFAaUFAaYFAacFAaoEAa8EAbIGAbQGAbYGAbcGAbgEAbkEAboEAbkEAboEAbkCAbYGAbcGAbkGAboGAbsGAb0GAb0FAb8FAcAFAcIGAcMGAsQG',
    'AcUGAcYGBcUFAcQFAcEDAcADAcMGAcQHAcIGAcAGAb8GAb0FAbsFAbgDAbgEAbgFAbYFAboEAbwEAb0GA7wGAbsEAboEAbgEAbYEAbMEAbACAasCAagFAbAEAbUEAbcE',
    'AboEAbsEAboEAbkEAbcEAbUEAbICAakCAagFA6kFAaoFAasFAasEAawDAa0DAbAFAbIGAbMFAbQFAbMDAbYEArcEAboGAgAAAb4FAb8FAb8EAb4CAcAEAcMFAcIEAcYE',
    'As0EAYN/AcwEAckEBwAAAb0EAbwEAwAAAbQCAbcCAbYCAa8CAbEFAbAFAa8FAa4FAaoDAagDAagEAagFAbAEAbQEAbcGAbgGAbkGAboGAbgEAbcEAbUEAbIEAbAEAawC',
    'AaIFAqMFAaQFAaUFAagEAawEAq8EAbEEAbIEA7QEArQCAbIGAbQGAbUGAbcGAbgGAbkFAbsFAbwFAb4GAb8GAcEHAcIGAsMGAcQGAcUGBcQFAcMEAcEDAcADAcMGAcMH',
    'AcAGAb8GAb0FAbsFAbkEAbcDAbYEAbYGAbQFAbQGAbUEAbcEA7cGAbYGAbQEAbMEAbEEAbAEAa4EAakCAaUFAacEAa4EAbMEAbYEAbcEAbgEAbcEAbYEAbUEAbMEAbEC',
    'AaoCAaUFAaYFAaYEAacFAagFAqkEAaoDAawEAa8GAbAFAbEFAbEEAbIEAbQEAbYEAbcEAgAAAb0FAb4GAb4EAb4DAb8DAcIFAcIEAckEAs4EAYR+AcwEAckEAcQCBgAA',
    'Ab0GAboDAwAAAbICArYEAbEEAq4FAawGAasGAagDAaYDAagEAa8EAbMEAbUGArgGArcEAbQEAbMEAbAEAa0EAaoCAaACA6AFAaEFAaMEAaYEAakEAqsEAawEAa0EAa4E',
    'Aa8EAa4CAawCAa8HAa8GAbEGAbMGAbUGAbUFAbcFAbkFAbsHAb0HAb4HAcAHAcAGAsIGA8MGAcMFAsQFAcQGAcIFAcAEAb8EAcIHAcEHAb8GAb0FAbsFAbkEAbYDAbUE',
    'AbUFAbQGAbIFAbEGAa8GAa8EArEEAbIGAbEGAbAGAa8EAa4EAa0EAasEAacCAaMCAaAFAaQEAasEAa8GAbEGArMGArMEArIEAa8EAawCAaQGAaMEAaQFAaUFAaYFAaYE',
    'AacCAakEAawGAa4GAa8FAa8EAa8CAbIEAbQEAbUDAgAAAbsFAb0FAb4FAb0DAb0CAcAFAcYEAcoEAs0EAYR8AcsEAcgEAcQCBgAAAb0HAbgDAwAAAbMEAbcEAbYEAbEE',
    'Aa4CAasGAaoGAagGAaUFAakEAa8EAbEEAbMGAbQGAbYGAbUEAbMEAbEEAa4EAa0EAaoEAaUCApwFA50FAZ4FAaAEAaMEAqUEAaYEAacEAqkEAakCAakGAaoGAawGAa0G',
    'Aa8GAbEHAbMHAbMFAbUFAbgHAbkHAbwHAb0HAb4HAb8HAcEHAcEGAcIGAsIFAsMGAcMHAcQHAcAEAr8EAcEHAb8GAb0FAbsFAbkFAbcEAbQDAbQFAbQGAbMGAbAFAa8G',
    'Aa0GAawGAaoGBKwEAaoEAakEAagEAacEAaQEAaACAZwFAZoFAZ8EAaYEAakEAawGAa0GAa8GAa4EAa8EArAEAa8EAasCAaQCAaEFAaIFAqQFAaQDAaYDAaoGAawGAa0G',
    'Aa4FAawBAbAEAbIFAbMDAgAAAbkFAbsGAb0GAbwEAbsCAcIEAckEAcsEAswEAYV8AcoEAccEAcMCBgAAAbsIAbYEAwAAAbUEAbcEAbYEAbEEAa4CAakGAagGAaYFAaoE',
    'Aa0EAbAGAbEGArIGAbMEAbEEAa8EAawEAacEAaUCAaECAZkFBZoFAZsFAZ0EAZ8EAaAEAaIEAqMEAaQEAaQCAaUGAaYGAagHAaoGAasGAa0HAa8HAbEHAbIGAbQHAbYH',
    'AbgHAboHAbsHAb0HAb4HAr8GAcAGAcAFAcEFAcIGA8MHAb8EAb4EAb4FAb8GAbwFAbsFAbkFAbcEAbUEAbICAbMFAbIHAbEGAa4FAa0GAasGAakGAagHAaYGA6cEAqYE',
    'AaQEAaIEAaAEAZwCAZkCAZYFAZUFAZgEAZ8EAaMEAaYGAqkGAaoEAa0EAq4EAa0EAaoCAaYCAaAFAaEFAqIEAaQEAacGAakGAasGAawGAaoCAa4EAbEFAbEEAgAAAbgF',
    'AboGAbsGAbsFAboCAcUEAckEAcwEAssEAYV8AckEAcYEAcICBgAAAbkHAbQEAgAAAbQEAbYEAbcEAbYEAbIEAa4CAacGAaYGAawEAa0EAa4GA7AGAa8EAa4EAa0EAakE',
    'AaYEAaECAZwCB5gFAZkFAZoFAZsEAZ0EAZ4EAp8EAaAGAaEGAaIGAaQGAaYHAagHAakGAasHAa4HAa8HAbEHAbIHAbMGAbYHAbgHAbkHAbsHAbwHAb0GAb4GAb8GAb4F',
    'Ab8FAcAGA8EHAb4FAbwEAb4HAb0GAboFAbkFAbcFAbUEAbIEAbADAbEGAbEHAa8HAa0HAasGAakGAacGAaYHAaQGAaIGAaIEAaMEAqIEAaAEAZ4EAZsEAZgCAZUCAZMF',
    'ApIFAZEFAZkEAZ4EAaMGAaQGAaUGAakEAasEAawEAq0EAaoEAaYCAZ8FAaAFAaEEAaIEAaYGAacGAakGAaoGAakCAa0FAa8FAa8EAgAAAbYFAbgGAbkFAboFAb8EAccE',
    'AcsEAcwEAcsEAcoEAYV9AckEAcYEAcICBAAAAbcHAbIEAbUEAbIDAQAAAbIEAbgEAbcEAbgEAbYEAbIEAa4CAaYHAa0EAa4EAq4GAa8GAa8EAa4EAawEAaoEAagEAaME',
    'AZ4CAZYEApcFA5cGA5cFAZgGAZkGAZoGAZsGAZwGAZ0GAZ4GAZ8GAaAGAaEFAaEEAaQHAaYHAagHAaoHAawIAa4IAbAIAbEHAbEFAbMFAbUGAbcGAbkHAroGAbwGA70G',
    'Ab4GAb8GAr8IAb4HAboEAbsGAbsHAbgFAbcFAbUEAbMEAbADAa8EAa4FAa8HAa0HAasHAaoHAagHAaYHAaQHAaEEAaEFAaAGA58EAZ0EAZsEAZkEAZUEAZMCAZEFApAF',
    'AZAGAY8GAZUEAZsEAZ4GAaEGAaQGAacGAaoEAasEAa0EAawEAaoEAacCAaACAaAFAaEEAaQGAaYHAagHAakGAagEAawGAa4GAa4EAgAAAbQFAbYFAbcFAb0EAcIEAcgE',
    'AsoEAcsEAcoEAYV+AccEAcQEAb8CAwAAAbQFAbUGAbADAbACAbAFAQAAAbYEAbgEArcEAbQEAbAEAa0CAasEAa0EAa0GAawGAa0GAa4EAa0EAasEAakEAaYEAaICAZwC',
    'ApYEApYFAZcGAZYGAZcGAZYFAZYGAZcGAZgGApkGAZoGAZsGAZwGAZ0GAZ0FAZ4FAaAFAaAEAaMFAaUHAagIAakHAaoHAa0IAa4IAa8HAbAGAbAEAbMGAbUHAbYGAbcG',
    'AbgGAbkGAroGArsGArwHAb0IAbwIAbcDAbgFAbkHAbcFAbUGAbQFAbEEAa8EAa0EAawEAawGAawHAaoHAagHAacHAaUHAaMFAaAEAaAFAZ4FAZ0FAZ0GAZwEAZsEAZgE',
    'AZYEAZQCAZIGAZEGAZAGAZAFAZAGAY8GAZAGAY8FAZcEAZwEAZ8GAaMGAacGAaoEAq0EAawEAasEAacCAaECAaAEAaQGAaUHAacGAagGAacEAasGAawGAawEAgAAAbIF',
    'AbQFAbcEAb8EAcMEAccEAcoEAcgEAcoEAckEAYV/Ab4EAcECAbkCAa8BAbEDAa8CAbIEAbADAawCAasDAasFAaYEAacEAbQEAbUEAbQEAa8EAa0EAakEAaoEAawGAqoG',
    'AasEAaoEAagEAacEAaQEAZ8CAZkHAZcFAZUEApUFAZUGBJUHAZUGAZYGAZcGApgGAZoGAZsGApwGAZ0FAZ4FAZ8FAZ8EAaEFAaQHAaYIAagHAakHAasHAawHAa0HAa8H',
    'Aa0EAbAGAbIGAbQGArUGAbYGAbcGA7gGAbkGAbkHAroIAbYEAbUEAbcHAbUHAbQGAbMHAbAEAa0DAasDAaoEAaoFAaoHAagHAacHAaYHAaQGAaEFAZ8EAZ8FAZ4FAZ0F',
    'ApwGAZsGAZgGAZUGAZQGAZIGAZEGAZAGApAHAY8HAZAHAY8GAZAFAZMEAZkEAZ8GAaQGAacGAaoEA6sEAakEAaYCAaICAaMHAaUHAaYHAacGAaYEAqoGAaoEAqwFAa8F',
    'AbMEAbsEAcAEAcMGAccGAckGAcYEAccEAcIEAYeBAbwEAboCAbECAa4BAbADAq0CAakBAaYBAaQCAakEAqgEAa0EAa4EAa0EAakEAaYEAaMEBKUEAacEAaYEAaMEAaEC',
    'AZwCAZkHAZgHAZYGAZMEAZIEAZIHAZMHA5IHApMHAZQHAZUHAZYHAZYFAZkHAZoHAZsGApwGAZwFAZ0FAZ4EAaAFAaIGAaUHAaYHAacHAakHAaoHAawHAa0HAasEAa0E',
    'Aa8FAbEGAbIGAbIFAbMGAbQFAbUGBbYGAbcHAbQGAbIEAbQHAbQIAbIHAbIIAa8GAasEAakDAakEAagFAakGAacGAaUFAaQGAaIGAZ8EAZ4EAZ0FAZwFApwGAZsGAZoH',
    'AZgHAZQFAZQHAZIHApAHBY8HAZAHAY8EAZAEAZgEAZ4EAaMGAaYGAagGA6kEAaYEAaUCAaIIAaMIAaQHAaUGAaYGAakHAagFAagDAaoEAasFAa0EAbcEAbwEAb8GAcMG',
    'AcYGAcYEAcIEAcMEAcAEAYiBAbgCAbMCAa4BAa0BAa4DAasDAacCAaMBAaACAaQEAqYEAaUEAaYEAagEAacEAaIEAZ8EAZwEAZ0EA54EAp8EAZwCAZoHAZkGAZcHAZUH',
    'AZMGAZAEAZAFApAHA48HApAHAZEGAZIHAZMHAZQFAZcHApkHApoGAZsFAZwFAZwEAZ4FAaAGAaIHAaQHAaUGAacHAagHAakHAaoHAakEAaoEAawEAa4FAa8FArAFAbEF',
    'AbIFA7MGArIFAbMGAbIGAa8EAbIHAbIIArAIAa0IAakEAacEAaYEAaYFAaYHAaQGAaMFAaEGAZ8FAZ0EAZwEAZwFAZsFApoGAZkHAZgHAZYHAZIFAZIHAZAHAY4GAo4H',
    'A40HAo4HAY0FAY4EAZEGAZQHAZwEAaEEAaMEAaQEAqYEAaQEAaUEAaQCAaIHAaIGAaMGAaQGAaYHAaUEAaUCAacDAagEAbAEAbcEAbwGAb0GAcEGAcMEAcQEAb8EAb4E',
    'AbwEAYmBAbECAa0DAawCAaoBAasDAagEAaMDAZ8CAaIEAaQEAqQGAaMGAqEEAaAEAZsEAZYEAZUEAZYEApcEAZYEAZcCAZYIApcHAZYHAZQHAZMHAZEGAY8FAY0FAo4H',
    'A40HAo4HAY4FAZAGAZAFAZEFAZQHA5cHAZgGAZgFAZkFAZoEAZwFAZ0FAZ8GAaEGAaIGAaMHAaQGAaYHAacGAaYEAacEAagEAaoEAasEAq0FAa4FAa8FArAGBK8FAa4F',
    'Aa0FAa8HAa8IAa4IAa0IAasIAaYEAaUEAaQEAaQFAaMHAaEGAaAFAZ4FAZwEApoEAZkFAZgFAZgGApcHAZYHAZMHAZAFAY8FAY0GAYsFAYwHBYsHAYwHAYoEAYwEAY8G',
    'AZIHAZQIAZgEAZwEAZ4EAaAEAaEEAZ8EAaIEAaICAZ8CAaAHAaEGAaIHAaQHAaEDAaIDAaQCAasEAbEEAbYGAbkGAbwGAb4GAcEEAcAEAbsEAbkEAbcCAYx/AqkDAakC',
    'AqgCAaUEAaEDAaIEAaQEAaQGAaMGAaIGAaAEAZ4EAZ0EAZoEAZYCAY8EAZAEA5EEAZACAZEHAZMHApQHAZMHAZIHAZAHAY8HAY4GAYsEAY0HBYwHAY0HAYwEAY0FAo4F',
    'AZEGAZMHApQHAZQGAZUGAZUFAZYEAZgFAZkFAZsGAZ0GAZ4GAZ8GAaAFAaIHAaMFAaIEAaMDAaUDAaYDAacEAakFAaoFAasFAqwGBKwFAasFAasEAasGAqwIAaoIAakI',
    'AacHAaMEAaIEAaEEAaAGAZ8GAZ0FAZwEAZoEAZgEAZcDAZYEAZUFAZUGAZQGApQHAZMHAZAGAYwEAYsFAYkEAYcEAYkHBYgHAYkHAYgFAYkFAYwHAY4HAZAHAZMHAZQH',
    'AZcEAZkEAZoEAZgEAZsEAZwEAZwCAZwHAZ0HAZ8HAaAHAZ0CAZ4CAaMEAasEAbAEAbUGAbcGAbkGAbsEAb0EAbsEAbcEAbUEAa8CAY5+AqYCAqUCAaQCAaMDAaUEAacE',
    'AacGAaYGAaQGAaIEAaAEAZwEAZkEAZYCAY8HAo4GAY4HAY8HAY8GAY4FAZAGAZEHAZIHAZEHAZAHAY8IAY4HAY0GAYwGAYoEAowHA4sHAowHAYoEAYsFAowEAY4GAZAH',
    'AZEHAZIHAZIGAZMGAZIEAZMEAZUEAZYFAZgGAZoGApsFAZwFAZ4FAZ8EAZ8DAaACAaEDAaIDAaQEAaYEAacFAqgFAqkFA6gFAagEAagGAakHAagHAagIAacIAaYIAaIF',
    'AaEFAaAFAZ4FAZwFAZsEAZoEAZgEAZYDAZUDAZQDAZMEAZIEAZMGAZIGAZIHAZEHAZAHAY0GAYoEAYgFAYYEAYUEAoYHA4UHAoYHAYUEAYcGAYkHAYsHAY4HAZAHAZEH',
    'AZIHAZMHAZQEAZIEAZQEAZYCAZgHAZkHAZoGAZwHAZ0HAZsDAZwCAaQEAaoEAa4GAbEGAbQGAbUEAbYEAbcEAbYEAbMEAa4CAaYCAY98AqMCA6ICAaUEAaoEAqoGAagG',
    'AaUEAaIEAZ4EAZsEAZYCAY8CAZAGBY8GAY8EApAFAZAHAY8HAY4HAo0HAYwGAYsGAYkEAYoGAYsHBIoHAYoGAYkEAYoEAYoFAYsEAY0GAY4HAY8HAZAHAZAGAZAFAZAE',
    'AZEEAZMEAZQEAZYGAZcGAZgFAZkFAZoEAZsDApwDAZ0DAZ8DAZ8CAaEEAaMFAaQFAqUFA6YFAaUFAqYFA6YHAaUIAaQHAaIHAZ8FAZ4GAZ0GAZsFAZkEAZgEAZcEAZUD',
    'AZQDAZICApEDAZAEAZAFAZAGAZAHAY8HAY4HAYsGAYcEAYYFAYQEAYMEAYQGBYMHAYQGAYMEAYUFAYcGAYkGAYsGAY0GAY8HApAHAZEHAZAEAZEEAZQGAZUGAZcGAZgG',
    'AZoGAZsHAZoEAZ8EAaQEAagGAawGAa4GAbAEAbEEArIEAbAEAa0CAaUEAaQCAZB5AqECAaABAaACAaMEAagEAasGAawGAasGAakEAaYEAaIEAZ0EAZkCAZECAY4BBJEG',
    'AZAFAZAGAo8FAY4FAo4GAY0HAYwHAYsGAYoGAokEB4kFAYgEAokEAYoFAYwGAY0GAo4GAY4FAo8EAZAEAZEEAZIEAZQEAZUEAZcFAZcEAZgDAZkDAZoDAZoCAZwDAZ0D',
    'AZ4DAZ8EAaEFAqIFA6MFAqMEAaUGAaQHAaUHAaQHAaMIAaMHAaEGAaAGAZ0FAZwGAZoFAZkFAZcFApUFAZQEAZIEAZEDAZADAZAEAo8EAY4FAo4GAYwGAYkGAYYFAYQE',
    'AYMEAYEEAoIFA4EFA4IFAYMEAYUFAYcGAYkGAYsGAo4GAY8HAZAHAZAFAZAEAZIEAZMFAZUGAZcGAZgGAZoHAZ0EAaIEAaMGAaYGAagGAasEAawEAa0EAa4EAasEAaoC',
    'AaQFAaQGAaMEAY94AaADAZ8CAZ4BAaAEAaYEAagGAasGAawGAqkEAaUEAaAEAZoCAZMCAZEBAZABAZMGAZIGA5EGAZAGAo4FAY0FAY0GAYwGAYsGAooGAYkFAYgEAYgF',
    'AYgGAYgFA4cFBIcEAYgFAYkFAYoGAYsGAowGAY0GAY0FAo4EAY8EAZEEAZIEAZQEApUEAZYEAZcEAZgEAZkDAZoDAZsDAZwDAZ4EAp8EAqAEAqEEAaIEAaIFA6MHAaIH',
    'AaEHAaAGAZ4GAZ0FAZsFAZkFAZgFAZYFAZQFAZMFApIFAZEEAY8DAY4DAo4EAY0FAY0GAowGAYoGAYgGAYUFAYMEAYEEAYAEAX8EBH8FAYAFAYAGAYEFAYIEAYMEAYUG',
    'AYgGAYkFAowGAY0GAY4GAo8FAZAEAZEEAZMGAZUHAZYHAZgHAZ4EAaEEAaIGAaUGAaYGAacEA6gEAaYCAqIGAaMHAaIGAY53AZ8EAp0CAaQEAaYGAagGAaoGAaoEAacE',
    'AaYEAaEEAZsCAZMCAZICAZIDAZEDAZIHAZEGApAGAY8GAY0GAYwFAYsGAooGAYkGAYgGAYcGAYYFAYYEAYUFAoUGBIQFAYQEAoUEAYUFAYYFAYcFAogGAokGAYoGAYoF',
    'AYsEAYwDAY0DAY4EAY8EAZEFAZIEAZMEAZQEAZUEAZYEAZcDAZgDAZkDAZoDAZsDAp0EAp4EAp8EAaAFAaEGAqEHAqAHAZ8GAZ4GAZwFAZoFAZkFAZYFAZUFAZMFAZEE',
    'AZAEApAFAY4EAY0DAowDAYsEAYoFAYoGAokGAYcGAYUGAYIFAYAFAX8EAn0EAXwEA3wFAX0FAX0GAX4GAX8GAYAEAYIFAYUGAYcGAYkFAYoFAYsGAowGAY0FAY4FAY8F',
    'AZEFAZIGAZQGAZkEAZ0EAZ8GAaEGAaIGAaQEAqMEAaIEAaECAZ8GAZ8FAaAGAaEGAaEHAYl4AZ4GAZsDAZ8EAaIEAaQGAaUGAaYEAaQEAaAEAZ4EAZgCAZIBAZECAY8D',
    'AZAFAY4FAY8GAY0GAYwGAYsGAYoGAYgFAYcGAYYGAYUGAoQGAYIFAoEFAYAFAYAGAn8FAn4FA34EAn8FAYAFAYAGAYEGAoIGAYMGAYQFAYQEAYUEAYYEAYcEAYgEAYkE',
    'AYoEAYwEAY0EAY4EAY8EAZADAZEDAZMDAZUEAZYDAZcEAZgEAZkEApoDAZsDAZwFAZ0FAZ0GAp4GAZ0GAZwFAZwGAZsGAZoGAZkFAZcFAZUFAZMFAZEFAY8EAY0CAYwD',
    'AYsEAYwGAYoEAYkEAocEAYYEAYUEAYQEAYQFAYMGAYEGAX8GAX0GAXsGAXoGAngFA3cEAncFAXgFAXkFAXoGAXsGAX0GAX8GAYEGAYMFAYQFAYUFAYYFAYcGAYgGAYkG',
    'AYoGAYwFAY0FAY4FAZQEAZgEAZsEAZwEA54EAZwEAZsCAZkEAZsFAZwFAZ0FAZ4GAZ8GAYd6AZoGAZsEAZ8EAqAGAqAEAZ0EAZkEAZUCAY4CAY0CAYwDAYsEAYoFAYkG',
    'AYgGAYcHAYUGAYMGAYIGAYAGAX8GAX4GAX0GAXwFAXsFAXoFAnkGAXgGAncFAXYFA3YEAnYFA3cGAngGAXoGAXoFAXsFAXwFAXwEAX0EAX4FAX8FAYAFAYIEAYMEAYQD',
    'AYUDAYcDAYgCAYkBAYsBAY4DAZAEAZEEAZIEAZQEAZUEAZUDAZYDAZcEAZgEApkFAZoFAZkFAZgEAZcEAZcFAZYGAZUGAZQGAZIFAZAFAY4FAY0EAYoEAYgDAYcFAoUF',
    'AYMEAYIFAoAFAX4FAX0EAXwEAXwFAXsFAXgFAXcGAXUGAnMGAXEGAXAGAXAFAW8FA28EAXAFAXEFAXMGAXQGAXUGAXcGAXkGAXsGAXwFAX0FAX4GAX8FAYEGAYIGAYQH',
    'AYUHAYYGAYgFAY0EAZAEAZMEAZUEA5cEAZQCAZMDAZUEAZcFAZgFAZkFApoGAYN/AZYEAZoEAZwGAZsGAZsEAZkEAZcEAZUEAZACAYoEAYgDAYcEAYYFAYQFAYIFAYEF',
    'AX8FAX0GAXwGAXoGAXgGAnYGAXQFAXMFAXIGAXEGAXAGAW8GAm4GAW0FAmwEAWsEAWwFAmsFAmwFAm0FAm4FAXAGAXAFAXEGAXIGAXMFAXQFAXUFAXYEAXcEAXgDAXoC',
    'AXsCAX0CAX4CAYABAYEBAYMBAYcDAYkEAYsEAY0EAY4EAZAEAZEEAZIEAZMEAZQEA5UEAZQEAZMDApIEAZAEAZAGAY4GAYwGAYoGAYgGAYYFAYQFAYEEAYAFAX0DAXwD',
    'AXoEAXkFAXgFAXYFAXUFAXQFAXMFAXIGAXEGAW4FAW0FAWsFAWoFAWkFAWgFAWcFBGYFAmYEAWcEAWkFAWoGAWsGAW0GAW8HAXEGAXIGAXMGAXQFAXUFAXcGAXgGAXoG',
    'AXwHAX4HAYAEAYQEAYcEAYoEAYwEAo0EAY0CAYwEAY4EAZAEAZIFAZMGAZQGAZUFAZYFAYJ/AZUEApYEAZUEAZQEAZEEAY0EAYkCAYYFAYMEAYEEAX8FAX4FAXsEAXoE',
    'AXgFAXYFAXQFAXMFAXEGAW8FAW0EAWwFAWsGAmkGAWcGAWYGAWUGAWUFAWQFAWMEAmIEAWIDBWIEAWMFAWQGAmQFAWYHAWcHAWgHAWkHAWoHAWsGAWwGAW0EAW4EAXAE',
    'AXEDAXICAXUCAXYBAXgBAXoBAX0CAYEEAYMEAYUEAYcEAYkEAYsEAYwEAY0EAY4DAY8EApAEAY8EAY4EAY0EAYwEAYoEAYkEAYcFAYUFAYQGAYIGAYAGAX0GAXwGAXkF',
    'AXcFAXQDAXICAXEDAXAEAW8FAW4FAWwGAWsGAWoHAWgHAWcHAWUHAWMGAWEFAWAFAWAGAV4FAV4EBF0EAVwDAV0EAV4EAV8EAWAFAWEFAWMGAWUGAWcHAWgGAWkGAWsG',
    'AWwGAW0FAW8FAXEGAXMGAXUGAXcEAXsEAXwEAYAEAYIEAYQEAYQCAYYFAYcEAYkEAYoEAY0FAY8GAZAFAZEGAZEFAYN/Ao4EAY0EAYsEAYgEAYQCAYAFAX0FAXsFAXgF',
    'AXcEAXUEAXQGAXEEAW8FAW4FAWwEAWsEAWkFAWcFAWYFAWQEAWMFAWIFAWAGAV8GAV4GAV0FAVwFAVsFAloEA1kEA1gEAVkEAVkFAVoGAlsHAVwHAV0HAV4HAV8HAWAH',
    'AWEHAWIGAWMHAWQGAWYFAWgFAWkFAWsFAW0FAW4DAXEDAXMDAXYEAXoFAXwFAX4FAYAFAYMFAYUFAYYEAYgEAYgDAooEAYkEAYcEAYUEAYMEAYEEAYAFAX4FAXwFAXoF',
    'AXgGAXYGAXQGAXIFAXAGAW4FAWwFAWoEAWgDAWgEAWcFAWYGAWUGAWMHAWEGAWAHAV8HAV0HAVsHAVoHAVgHAVcHAVYHAVUGAVQFBFQEAVMEAlQEAVYEAVcEAVcFAVkF',
    'AVsFAVwGAV4GAV8GAWEGAWIFAWQFAWYEAWgFAWoFAWsFAW4FAXAEAXIEAXQEAXcEAXoFAXwFAX4FAYAEAYIEAYQEAYYEAYgEAYoFAosFAYl8AYMEAYEEAX4EAXoEAXgC',
    'AXMEAXEGAW8GAW0GAWoFAWkFAWcFAWYFAWQEAWMEAmEEAWAEAV8EAV0EAVwEAVoEAVkEAVgFAVcFAVYGAVUFAVQGAVMFAVIEAVEFAVEEBVAEAlAFAVAGAVEGAVIHAlMH',
    'AVQHAVUHAVYHAVcHAVgHAVkHAVoHAVsGAV0GAV8GAWAFAWIFAWQGAWYFAWgFAWsGAW4GAXEHAXMHAXYHAXgFAXoFAXwEAX4EAX8EAYADAYIDAYEDAX8EAXsEAXgEAXYE',
    'AXMEAXEEAW4FAWwEAWoFAWgFAWcFAWUFAWMEAWIEAWAEAV8EAV4EAV0DAV4FAl0GAVwHAVoHAVgHAVYHAVQHAVMHAVEHAVAHAU8HAU4HAU0GAUwGAUsGAksFA0oEAksE',
    'AUwEAU0FAU4EAU8FAVAFAVIGAVMFAVUGAVcGAVkFAVsFAVwFAV4EAWAEAWIEAWQEAWYEAWgEAWsFAW4FAXEFAXMFAXUEAXgFAXoFAXwFAX4FAYAEAYEEAoIEAY16AXME',
    'AXEEAW0EAWkCAWYEAWQEAWIGAWAGAV4GAVwGAVsGAVkFAVgFAVcFAVYEA1UEAVQEAVMEAVIEAlEEAVAFAU8FAU4FAU0FAUwFAUsEAkoEA0kEAUkFAkgEAUgFAUkFAUkG',
    'AkoGAksGAUwHAU0HAU4HAU8HAVAHAVEHAVIHAVQHAVUHAVcGAVgGAVoGAVwGAV4HAWAHAWMHAWUHAWgHAWoHAWwHAW8GAXEFAXIEAXQEAXYEAXcEAngEAXUEAXEFAW0E',
    'AWoFAWcEAWUFAWIFAWAFAV4FAVwFAVsFAVoFAVgEAVcDAVYDAVUCAVQCAVQDAVUFAVUGAVQHAVMHAVEHAU8HAU0HAUwHAUoHAUgHAUcHAUYGAkUGAkQGAkMFAkIEAkMF',
    'AUMEAUQFAkUEAUYEAUcEAUkFAUsFAUwFAU4FAVAFAVIFAVQFAVYFAVgFAVkEAVsEAV0EAV8EAWIEAWUFAWcFAWkFAWwFAW8GAXEGAXMGAXUGAXcFAXcEAXgFAXcEAZJ6',
    'AWUEAWEEAV0EAVoFAVgFAVUFAVQFAVIGAVAGAU8GAk0GAksGAUoGA0kGAUkFBEgFAkcFAkYFAUUFAkQEAUMEAUIEAUIDAkIEA0IFAUIGA0MGAkQGAUUGAUYGAUcHAUgH',
    'AUkHAUoHAUsHAUwHAU0HAU8HAVAGAVIHAVQGAVYGAVgGAVoGAVwGAV8GAWAFAWMFAWUFAWcFAWgEAWoEAWwEAW4FAW8FAW8GAW0GAWkFAWYFAWMFAWAFAV0EAVoEAVgE',
    'AVYEAVUEAVQEAVIEAVEDAVADAk8DAU4DAU4EAU4GAU4HAU0HAUsHAUkHAUcHAUUHAUQHAUIHAUEGAUAGAj8GAT4GAj0GATwGAzwFAzwEAT0EAT4EAj8EAUAEAUIFAUMF',
    'AUUFAUYFAUgFAUoFAU0FAU4FAVAFAVIFAVMFAVUFAVcFAVoFAVwGAV4GAWAGAWIGAWUGAWcGAWkGAWsGAW0GAmwGAWkFAZZ7AVYGAVMGAVAFAU0FAUsGAUkGAUcFAUYF',
    'AUQFAUMGAUIFAUEFAkAGBD8HAz4GAT8GAT4GAj4FAT4EAT8EAj4DAT0DATwDATwCATwDAjwEATsEAzwFATwGAj0GAj4GAj8GAUAHAUEHAUIHAUMHAUQHAUUHAUYGAUcG',
    'AUkFAUoFAUsFAU4FAU8EAVIFAVMFAVUFAVcFAVkFAVwFAV4FAV8FAWEFAWMGAWUGAmYHAWUHAWMGAWEGAV4FAVsFAVgEAVUCAVQCAVICAVACAU8CAU4CAkwCAUsCAUoE',
    'AUkFAUgFAUgHAUcHAUYHAUQHAUIHAUAHAT8HAT0HATwHATsGAToGATkGAjgGAjcGAjcFATYFATYEAjcEAzcDATgDATkDAToDATsEAT0EAT4FAUAFAUEFAUMFAUUFAUcG',
    'AUkGAUoGAUwFAU0FAU8FAVIGAVQGAVUFAVcFAVkFAVsEAV4EAWAFAmIHAWAGAV4GAVoGAZd7AUoGAUcGAUQGAUIGAUAGAT4FAT0EATsEAToEATkEATgEATgFATcEATYE',
    'BjYGBDYFAzcEAjcDAjYDBTUCAzUEAjYEAjYFAjcFATgFATkFAjoFATsFATwFAT0FAT4EAT8EAUADAUIDAUMCAUUEAUcEAUkEAUoEAUwEAU4FAVAFAVIFAVQFAVUFAVcF',
    'AVkGAVoGA1wHAVsGAVoGAVcFAVQFAVEEAU8DAU0CAUsCAUoCAUkCAUgCAUcCAUYCAUUCAUQDAUMFAUIGAUEGAT8FAT4FATwFAToFATgFATcFATYFATUFATQFATMFAjIF',
    'AjEEBDAEBDACATECATEDAjIDATMDATQEATYEATcEATgFAToFATsGAT0GAT8GAUEGAUIGAUMGAUUFAUcGAUkFAUoFAUwEAU4DAVADAVIDAVQEAVYFAVgGAVcGAVQGAVEG',
    'AU0GAZZ8AT4EATwEATsEATgEATcEATUEATQEATMEATIEATEEAjAEAi8DAy4EBC4FAi4EAS8FAy8EAy8DBC4CBS0CAi4CAS4DAy8DATADAjEDATIDAjMDATQDATUDATYC',
    'ATcCATgCATkBATsDAT0DAT4DAT8DAUEDAUMEAUUEAUYEAUgEAUkEAUsEAUwEAU0EBE8FAU4EAUwEAUkEAUcDAUUDAUQDAUIDAUEDAkADAT8EAT4EATwEATsDAToEATkE',
    'ATcEATUDATQDATIDATADAS8DAS4DAS0DAiwDASsDAioDBikCASgCBCkCASoCASoDAisDASwEAS0EAS4EAS8FATEFATIEATQEATUFATcFATkEAToEATsFAT0EAT4EAUAE',
    'AUEDAUMDAUQDAUYDAUgEAUoEAUwFAUoEAUcEAUQEAUEEAZB8ATUCATMCATICATECAS8CAS4CAS0DAS0EASwDASsDAioDAikCBCgCASgDAicDAicCAigEBicDASYDAyYE',
    'ASYDBiYEAycEAigEAikEAioEASsEASwEAiwDAS0DAS4CAS8CATACATECATICATMCATUCATYCATcCATgCATkCAjsCATwCAj0CAT4CAj8CAT0CATwCAToCATgCATcCATYC',
    'ATYEATUEATQEATMGATMHATIHATAEAS8EATEDASwEASsEASkEASgEAScEASYEAiUEASQEAiMEAiIEByEEASEDAiEEASEDAyIDASMDAiQDASUDASYEAScDASgCASkCASsD',
    'ASwDAS4CAS8CATACATECAjMCATUCATYCATcCATkCAToDATsDAT0EATwCATsCATgCATcCAYt9AS4DAS0DAiwDASoDASkDAigDAScDASYEASYDAyUDAyQDAiMDASMEAiMD',
    'ASIDASIEASIFAyEEAyEFBSAGBiAHAyEHAiIHAyMHASQHAiQGASUFASIGASMFAiQEASUEAiYEAScEASgEAikEAioEAywEAy0EAjIDATEDATADAS8DAS4DAS0DASwDASwE',
    'ASsEASoEASoFASoHASkHASgGAScHAQAAASQHASMHASIHAiEHASAHAR8HAR4HAx0HBhwHAxsHAhsGAhwGAxwFAh0EAR4EAh8EASAEASEDASIDASMEASQDASYDAicDASgD',
    'AioDASsDASwDAS0DAS4DAS8EATAEATEEAjADAi8DAYZ+NgAAARsIARsHARwHBR0HAR4HBB8HBiAHRwAAAYF/kAAAAYCAkAAAAYCAkAAAAYCAkAAA'
  ].join(''),
  crop: [
    'AYCAkAAAAYCAkAAAAYCAkAAAAYGAkAAAAYKAkAAAAYWAkAAAAYiAQgAAAjkFCTkEATkFQgAAAY2AOwAAAUQBAUUBAUYBAUcBAUkEAUoEAUsEAj4FAT4DAT4EBT8EAj4E',
    'AT0EAUkDAUYBAUUCAUUEAUMEAQAAAUIEAUEEAUADAT8DAT8CNwAAAZN/OAAAAUgBAUoBAUsBAUYBAUcBAUgBAUkBAUsDAUwDAU0DAUcEAUgDAUgCAUgDBEkDAUgDAUcD',
    'AUYCAUUCAUoDAUcBAUYCAUUEAUQEAUQDAUIDAkEDAUADAUACNwAAAZR/OAAAAUoBAUwBAU0BAUsBAUwBAU0BAU4BAVACAVECAVICAlECAVIDAlMDAlQDAVMDAVIDAU8C',
    'AU0BAkwBAUkBAUgBAUcDAUYDAUUDAUQCAUMCAUIBAkEBNwAAAZN/NwAAAVECAU8BAVABAVEBAVIBAVMBAVQBAVUBAVYBAVcBAVgBAVkBAVoCAVsDBFwDAVsDAVoDAVcD',
    'AVUCAVIBAVABAU4BAU0BAUsBAUoBAUkBAUgBAkcBAkYBNwAAAZN/NwAAAVYEAlYBAVcBAVgBAVkBAVoBAVsBAVwCAV4CAV4BAV8BAWADAWEDBGIDAWEDAWADAV8DAVwC',
    'AVoCAVgBAVYBAVQBAVMBAVIBAVABAVACAk4BAU0BAU0CNwAAAZOANwAAAVwFAVwDAV0CAV0BAV4BAV8BAWABAWEBAWIBAmMCAWQCAWUDB2YDAWUDAWMCAWICAWECAV4B',
    'AV0BAVwBAVsBAlkCAVcCAVYBAVYCAVYDNwAAAZOANgAAAWgDAWMEAWQDAWQCAWQBAmUBAmYBAWcBAmgCAWkDAWoDB2sDAWoDAmkCAWgCAWYBAWUBAWUCAWMCAWICAWEC',
    'AWACAV8BAV4BAV4DAWMGNgAAAZCANAAAAXQDAXYFAW0DAWsEAWwEAWwDAWsBAWwBAW0CAm0BAm4CAm8CAXACA3ADA3EDAXADAXACA28CAW4CAW0CAWwCAWoCAWkDAWgD',
    'AWcDAWYBAWUBAWUDAWYFAWUENQAAAY2AMgAAAnoDAXYDAXgFAXQDAXMEAXQDAXMDAnMBAnQCBHUCAnYCAXcDAXYDBXcDBHYCAXUCAXMCAXECAXACAW4DAW0DAWwDAWsD',
    'AWoBAWkCAWoEAWkEAm0DMwAAAYuAMAAAAoIDAnwDAXsDAXwEAnsEAXoDAnoBAXsCAXsDBnwCAXwDAX0DAXwDBH0DAX0CBHwCAXsCAXkCAXcCAXUDAXMDAXIDAXEDAXAD',
    'AW8CAW4BAW4DAW4EAnADAXcDAngDMAAAAYiALwAAAYUDAoMDAoADAoACAYEDAoACAYABAYACAoEDBoIDAYICAYIDAYECAYICAoIDAoICBYECAX8CAX0CAXsDAXkDAXgD',
    'AXcCAXYDAXQCAXMCAXQCAXQDAXUDAXUEAnkDAXoDAX4DLwAAAYeALwAAAYYDAoUDAYQDA4QCAYUCAYQCAYQBAYQCA4UDCIYDAYUCBYYCBYUCAYQCAYMCAYECAX8CAX0C',
    'AXwCAXoCAXoBAngBAXkCAnoDAXsDAXwDAX0DAYADAYQDLgAAAYeALgAAAYsBAYkDAogDBYgCAYgDAYcBBIgCAYkCB4kDBIgCA4kCBYgCAYcCAYUCAYQCAYICAYACAX8C',
    'AX4BAn0BAX4DAn4CAX8CAYADAYEDAYMDAYYDAYoBLQAAAYaALgAAAYwBAosDBosCAYsDAYoBAYsBAYoBAYsBBIsCAYsDBIwDBIsCA4sDBYsCAYoCAYkCAYgCAYYCAYUB',
    'AYMBAYIBAoEBAYIDAYECAoICAYQCAYUDAYcDAYgCAYwBLQAAAYaALgAAAY4DBY4CAY0CAY4CAo4DA40BAY4CAY0BA40CAY4CBI4DAY4CAY4DAo4CA44DBo0CAY0BAYwC',
    'AYoBAYkBAYgCAYcBAYYBAYYCAYcDAYYCAocCAYgCAYkCAYsDAYwCAY4DLQAAAYWALQAAAZgHAZADBJACAZECAZABBJECApABApECA5ACAZECC5EDB5ACAZABAY4BAY4C',
    'AY0CA4wCAYwDAYsBA4wCAY0CAY4CAY8CAZADAZgHLAAAAYR/LQAAAZcGA5IBAZMBA5MCBJQDApQCAZUCA5QCAZUCAZUDC5YDBpUCBJQCAZMCAZICAZIDAZMEBZECAZEB',
    'A5IBAZcGLAAAAYN/LAAAApYDAZMBApQBApUCApYCAZcDAZcCAZcDApgDA5gCA5kCApoCAZoDCZsDBJoCBJkCAZgCAZgDA5cDAZgEAZYCBJUCAZQCApQBAZMBApYDKwAA',
    'AYB/LAAAAZYDAZUBAZQBAZUBApYCApcCAZgCAZkDAZkCApoCApsCApwCA50CAp4CAZ8CAZ8DA6ADAaEEAaEDA6ADAZ8CBJ4CA50CApwCApsCAZoBAZwEAZkCApgCApcC',
    'ApYCAZUBAZQBAZUBAZYDKwAAAX9/KwAAAZoIAZUDApUBApYCAZcCAZgCApkCAZsDAZoCAZsCAZsBAZwBAZ0CAp4CAp8CAaACAqECAaICAaIDAqMDAaQDAaYEAaUEAqQD',
    'AaMDAqICA6ECAaACAp8CAp4CAZ0BAZwBAZsBAZ0FAZwDAZoCApkCAZgCAZcCApYCApUBAZUDAZkIKgAAAX5/HgAAAZMBAZIBCwAAAZgHApUBAZUCAZYCAZcCApgCAZkC',
    'AZoCAZsDApsCAZwBAZ0BAZ4CAZ8CAqACAaECA6ICAaMCAaQCAaUDAaYDAacEAakGAacEAqYDAaUDAaQCA6MCAqICAaECAqACAZ8CAZ4BAZ0BAZwBAp0EAZsDAZoCAZkC',
    'ApgCAZcCAZYCAZUCApUBAZgHCwAAAY8BAZEBHQAAAXx/HgAAAZMBAZEBCgAAAZcHAZUEAZQBAZQCAZUCApYCAZcCAZgCAZkDAZoDAZoCAZsCApsBAZwBAZ4BAZ8CAqAC',
    'AaECAqICAaMBAqQCAaUDAacEAakGAaoHAqcEAaYDAaUCAaQCAqQBAaMCAaMDAaIDAaECAqACAZ8CAZ4BAZ0BAZwBAZwCAZwDAZsDAZoDAZkDAZgCAZcCApYCAZUCAZQC',
    'AZQBAZUEAZUHCgAAAY8BAZEBHQAAAXt/HgAAAZIBAZEBCgAAAZUHAZMBApMCApQCAZUCAZYDAZcDAZkEAZkDAZkCApoCAZsBAZwBAZ0BAZ4CAp8CAaACAaECAqICAqMC',
    'AaUEAacFAqkHAqYEAaUDAqQCAqMCA6ICAaACA58CAZ0CAZwCAZsCAZoBAZoCAZoEAZkDAZgDAZcDAZYDAZUCApQCApMCAZIBAZQHCgAAAY4BAZABHQAAAXp/HgAAAZEC',
    'AZABAY0CCAAAAY4DAZMFAZABAZEDAZICApMCAZQCAZUDAZUCAZcDAZgDApgCAZkCAZoCAZwCAZ0DAp0CAZ4CAZ8CAqACAaABAaEBAaICAaQEAaYGAacHAacGAaUEAqQD',
    'AaMCAaICAaECAaICAqECAaACAZ8CAZ4CAZ0CAZ0DAZwCAZsCAZoCAZkCAZgCAZkDAZgDAZcDAZUCAZUDAZQCApMCAZICAZEDAZABAZIFAY4DCAAAAY0CAY4BAZACHQAA',
    'AXh/HgAAAZADAY8DAY4CBwAAAZAFAY4DAZADAY8CAZADAZACAZECApICApMCAZUDAZYDAZcDAZcCAZgDAZoEApwFAZwDApwCAZ0CAZ4CAp8CAZ8BAaEDAaMEAaQFAqUF',
    'AaMEAaIEAaIDAaECAaABAZ8BAaACAaADAp8DAZ4DAZwCAZsBAZsCAZoCAZoDAZkDAZgDApcDAZYDAZUDApMCApICAZECAZACAZADAY8CAZADAY4DAZAFBwAAAY4CAY4D',
    'AZADHQAAAXh+HgAAAZEDAZADAY8DAY8CBgAAAZAEAY4BBJACA5ICApMCAZUDAZYDAZcEAZcDAZgDAZoEAZwGAZwFAZsDAZsCApwCAZ4DAZ4CAp8CAaEEAaIFA6MFAaEE',
    'AaEDAaADAaACAZ8BAZ4BAZ8DAZ8CAZ4DAp4EAZwCAZsBAZsCApoDAZkDAZgDAZcDAZcEAZcDAZUDApMCA5ICBJACAY4BAZAEBgAAAZACAY8DAZADAZEDHQAAAXh+HgAA',
    'AZMEApIDAZECAZIBBAAAAZMBAZECAZABAZECA5ICAZMCA5QCAZUCAZYDAZgEApgDAZoEAZwGAZ0GAZwEAZwDApwCAZ0CAp4DAp8DAaEEBKIFAaADAaACAp8CAZ4CAZ4B',
    'AZ8DAZ8CAZ4CAZ4EAZ8EAZ4EAZwCApsDApoDAZkDApgDAZgFAZYDAZUCA5QCAZMCA5ICAZECAZABAZECAZQBBAAAAZQBAZECApIDAZMEHQAAAXh+HgAAApUCAZUDAZQD',
    'AZMBAZUBAgAAAZUBA5QBAZQCA5UCApcDAZYCApcCAZkEApoEAZsEAZwFAp4GAZ0EAZwDAZ0DAZ4CAZ8CAZ4DAp8DAaAEAaIGAqIFAqEEAZ8BAZ8CAZ4BAZ8CAZ4BAZ4C',
    'Ap8DAZ4CAZ4DAZ8FAaICAZ4CA5wDAZsDApoDAZoEAZsFAZkEApcCAZYCApcDA5UCAZQCApQBAZUBAZYBAgAAApUBAZQDAZUDApUCHQAAAXh+HgAAAZcBAZgCApgDApYB',
    'ApgBApYBAZcBApcCA5gCApoDApkCAZoCAZsEAZwEAp0EAZ4GAZ8GAZ4FAZ4EAZ0DAZ4CAaECAaICAaECAZ8DAaAEAaEFAqIGAaEFAaAEAZ8CBZ4BAp4CAaAEAp8DAaMC',
    'AaUCAaICBJ0DApwDAZwEAZ0FAZsEAZoCApkCApoDA5gCApcCBZYBAZUBAZYBAZcDApgDAZcBHQAAAXh+HgAAAZoBA5sDAZkDAZkBApoBApkBA5oCApsCAZsDAZwDAZ0E',
    'A5wDAp0EAZ8EAZ4EAZ8FAaAGAZ4EAp4DAaEEA6QEAaMCAaEFAaIGAaMHAaIGAaEFAZ8DAZ4BAZ0BAZ4BAZ0BAZ4BAZ4CAZ4BAZ4CAqAEAaEEAaUEAacEAaUEAaECA54D',
    'Ap0DAZ4EAZ4FAZ0EA5wDAZ0EAZwDAZsDAZsCApoCApkCAZgBA5cBAZYBApgDApoDAZkBHQAAAXh+HgAAAZwCA50CAZ0DAZsBBZwCA50CAp4EAp8EA54DAp8EAaAFAaAE',
    'AaAFAaEFAp4CAaAEAaQEAaYEAacEAaYEAaYCAaIGAqMHAaEFAaADAZ4CBJ4BAZ4CAZ4BAZ4CAZ8CAaEEAaEFAaUEAagEAaoEAagEAaQCBZ8DAaAEAaAFAZ8EA54DAp8E',
    'Ap4EAZ0CAZwCAZoCAZkCAZgCA5cCAZYBAZgDAZgCAZoCApsCHQAAAXh+HgAAAZ4CCp8CAaACAaADA6EEAaIEAaEEA6ADAqEEAaIFAaEEAaIEAaIFAp8BAaQEAacEAaoE',
    'AawEAqoEAacCAqQHAaIEAaADAZ8BBJ4BAp8BAZ8CAaACAaIEAaYEAagEAaoEAa0EAasEAakEAaQCBKADAaEEAaIFAaEEA6ADAaEEAaIEAaEEAaAEAZ4EAZ0DAZsCAZkC',
    'AZgCA5cCAZYCApgCAZkCAZoCAZsCHQAAAXd9HgAAAqEBAaECAaICAqECBaICAaMDA6QEAaUEAaUFAaQEAaMDAaIDAaMDAaQEAaMEAaQFAaMEAaQEAaUFAaICAaUEAakE',
    'AasEAa4EAbAEAa4EAa0EAasCAacHAaUGAaMDAaICAaEBBKABAaEBAaABAaECAaIDAaUGAasEAa0EAa4EAbAEAa8EAawEAakEAaQCA6IDAaMEAaQEAaQFAaMDAaIDAaMD',
    'AaQEAaUFAaMEAaEEAZ8EAZ0EAZsDAZkCAZgCAZcCA5YCApcCAZgCAZkBAZsBHQAAAXV8HgAAA6QBAaUCAaQBA6UCAqYDAaYEA6cEAagEAakGAaoHAagEAqYDAqcEAqYD',
    'AaYEAacEAagFAasEAawEAa4EAbEEAbMEAbUEAbMEAbEEAa8CAaoHAacEAqYDAaUCBKQBAaQCAaQBAaUCAaYEAakGAa8EAbEEArQEAbMEAbEEAa4EAawCAaYCAqQCAaUD',
    'AaYEAqcEAaUDAaYDAagEAagHAaUGAaEEAZ8EAZ0EAZsEAZkEAZgDAZcDA5YCAZYBAZcCAZcBAZkBAZoBHQAAAXR8HgAAA6cBAagBAacBAagBAqkCAaoDAqoEA6sEAawE',
    'Aa0HAa4HAasFAqkDAasFAaoEAqkDAqoEAbAEArMEAbQEAbYEAbcEAbkEAbcEAbUEAbECAawGAaoDAqoEAakEAagCAagBAqcBAacCAacBAagCAaoEAawGAbMEAbYEAbcE',
    'AbgEAbcEAbQEAbIEAbEEAawCAqYCAaYDAqgEAakFAqgDAasFAasHAagGAaMEAaEEAZ8EAZ0EAZsEAZoEA5gCApcBAZgBAZkBAZoBAZwBHQAAAXR8HgAAAasBAaoBAasC',
    'BawCAa0DAa4EAa0EA64EAbAGArEHAa4EAawDAa0EAq4FAawDAawCAa0DAbIEAbcEAbgEArkEAroEAbwEAboEAbgEAbQCAa8GAa0EA60FAawEAawDAasCAqoBAaoCAasC',
    'Aa0EAa8GAbUEAbkEAroEAbkEAbcEAbUEAbMEAbAEAasCAaUDAaYDAacEAagFAakEAagDAaoDAawEAa0HAawHAagFAaUEAaMEAaEEAZ8EAZ4EA5wCAZsCAZwCAZ0CAZ4C',
    'AZ8BAaABAawDAa4DGwAAAXR+HAAAArEDAq4CAa8DA7AEAbADAbAEArEEAbADAbEEAbAEAbIGArMHAbMGAbEFAa8DA7AEAa4CAa4DAbUEAbgEAbwEA70EArwEAb4EAbwE',
    'AbkCAbUCAbEGBLAFAa8FAbAFAa4EAa0DAqwBAawCAa4EAbEGAbcEArsEAbwEAboEAbgEAbcEAbQEAbEEAa8EAasCAaUDAaYEAacEAagEAagCAasEAa0FAa8GAbEHAa8G',
    'AasFAagEAacEAaUDAaQEAaMEA6IDAqMEAaQDAaUCAaYCAa0DAa8DAbEDAbIEGQAAAXR+GgAAAbMEAbECAbEDAbIDAbEDAbACAbIEA7IFArIEAbMFAbMEAbIEAbMEAbIE',
    'AbQGAbUHAbUGAbQGAbMFBLEEAbADAbYEAboEAbwEAb8EAsAEAb8EAb4EAbwEAb4EAbsEAbcCArIGAbEFAbAFArEGAbAFAbEGAbAFAa4DAa0CAqwBAa4DAbEFAbUEAboE',
    'AbwEAbsEAbwEArkEAbYEAbQEAbMEAa8EAa0CAacEAqgEAakCAawFAa4FAbEGAbQGAbMHAbAFAa4EAawEAasEAaoEAakFA6gEAqkFAaoEAasCAawCArADAbEDAbIEAbID',
    'Aq8BFgAAAXZ/GAAAAbIEAbEDAbIDAbECAbIDArMEAbIDArMEAbMFAbICAbMCAbMEAbMFArQFArQEAbUFAbYGAbUGAbUFAbQFBLIEAbgEAboEAbwGAb4GAsAGAcEEAb8E',
    'Ab0EAboEAbwEAbgCAbQCArEGB7AGAa4EAa0DAqsBAawCArAFAbcEAbsEAbwEAbsEAbwEAboEAbkEAbcEAbYEAbUEAbMEAbACAaoEAasEAawEAa4FAbEFAbMGArUGAbMF',
    'AbIEAbEEAbAFAq4FA6wEAa0FAa4EAa8EAbADAbEEAbIEAbEDAbECAbIEAbEDArACArIFFAAAAXp/FgAAAbEEAbMFAbIEAbEDAbACArEDBLQFAbMEAbIEAbMCArUCAbIE',
    'AbQFAbUFA7UGAbUFArUGAbQGArMFAbMEAbkEAbsEAbwGAb0GAb4GAcEGAcAEAb8EAb4EAbsEAbcEAbgCAbQCAa4FCK8GAa8HAa4FAawEAaoCAqoBAq4FAbMEAbgEAboE',
    'A7wGA7wEArsEAbgEAbUCAa8EAbAFAbEFAbMGAbQGAbUGAbUFArUGAbQGAbMFAbEFAbAEAq8EAa8DArAEAbIEArMFAbQFAbIDAbEDAbECAbACAbEDAbIEArIFAbAEAa8D',
    'Aa0CEQAAAXx/EwAAAasBAa8EAbAEAbEEAbIFAbEEAbADAbACAbEDAbECAbMEAbMFArQFAbMEAbEDAbUEArcEAbUCAbMFAbQFAbUGAbYHAbUHArUGAbUHAbQGAbMGAbQE',
    'AbkEAbsEAr0GAb4GAb8GAcAEAb8EAb4EAbwEAbkEAbQCAbMCAq0FA64GBK0GAa4GAa4HAa0GAawFAaoCAqgBAawEAq0FAbQEAbgEAboGAbwGAr0GAb0EAb4EAr8EAbwE',
    'AbsEAbgCAbMCArMGAbUHArUGAbUHAbYHAbUGArUCAbICAbAEAa8DArADAbEDAbMFAbQFArMFArEDAbABAbACAbAEArEFAbEEAbAEAa8DAqwCAwAAAakBDAAAAX9/EQAA',
    'AqoBAasBAq8EArAEAa8DAq8CArACAbEDAbEEAbMFAbIEAbEEAbUEAbgEArkEAbcEAbMCAbMFAbQFAbUGAbQGA7QHAbMGAbQEAbkEAbsEAb0GAr4GAb0GAb0EAb4EAb0E',
    'AbsEAboEAbYCAbACAawEAawFAa0FBK0GA6wGAa0HAa0GAawGAasEAaoEAqcBAasEAqwFAa0EAbQEAbgEAbsGAbwGAb0GAb4GAb4EAsAEAr4EAbsEAbkCAbMCAbMGA7QH',
    'AbQGAbUGAbQFArgCAbUCA68DAbADAbEEAbIEAbMFAbEEAbIDArACAa8CAa8DAa8CAbADArAEAa8EAa4DAasBAawCAawDAQAAAawDAqkBAQAAAakCAa4HCAAAAYB/DgAA',
    'AasDAa4FAa0FA6oBBK4EAq0CAa4DAa4CAq8DAa8CAbADAa8DAbQEAbkEA7sEAbkEAbUCAbEEAbIFAbMGArIGArIHAbQEAbgEAbsEAbwGA70GA7wEAbsEAbkEAbYCAbMC',
    'AasDAawEAawFBa0GA6wGAa0HAqwGAasFAaoEAqgBAasEAqwFAa0FAa8EAbQEAbgEAboGAbsGAbwGAb4GAcAEAb8EAr4EAbwEAbsEAbgCAbICArIHA7IGAbgEAbkEAbgE',
    'AbcEAbICA60DAa4DAq8DAa4CAq8DAa4CAa4DAa4CAq0CA64EAa0DAasBAawCAawDAQAAAawEAaoBAakBAQAAAakCAa0GCAAAAYF+AawDBwAAAbEIAa0EAwAAAqwEAa0E',
    'AawEAqsCAaoCAa0EAa0FAawEAasCAasDAasCAq0DAq0EAawCAa0CAbIEAbgEAboEArwEAbsEAboEAbUCAa4EA7AGAa8GAbAGAbIEAbYEAbgEAboGAbwGAb0GAbwGAbsE',
    'A7oEAbkEAbYCAbMCAa0FAawEAq0FBa4GA60GAa4HA60GAasEAqkBAawEBK0FAbAEAbUEAbYEAbgGAbsGAb0GAb4GAb4EAb0EAb4EAb0EAbsEAbkEAbYCArAGAq8GAbEE',
    'AbcEArgEAbYEAbQEAa4CAaoEAqoDAaoCAqsCAq0EAq0DAawDAasDAasCAawDAawEAa0FAawEAaoCAqwDAasDAawEAasDAaoDAQAAAaoDAqwDAgAAAa0FAasCAbAHAgAA',
    'AYF9Aa0DAbAEAa8DBQAAAbAHAa0EAwAAAawEAa0FAa0EAasDAqsEAaoDAawEAasEAaoCAqkCAaoDBKsFAakDAbEEAbUEAboEAbsEAbwEAbsEAboEAbcEAbMCAawFBK0G',
    'Aa4EAbMEAbYEAbkGAroGAbsGAroEA7cEAbUCAbICAa4GAa4FAa0FAq4FAa8FAa8GAbAGAa8GAbAGA68GAbAGAq8GAa8FAa0DAqsCBK4FAq8GAbAEAbMEAbYEAbkGAboG',
    'ArwGAr0EArsEAbkEAbYCAbMCAq0GAawGAbAEAbQEAbYEArUEAbMEAa8EAaoCAaUFAaYEAaUCAacDAacCBKsFAasEAakCAqoCAaoDAasEAawEAaoDAawFAawEAasDAqwE',
    'AasDAQAAAqwDAa0DAa8EAQAAAawDAawCAa8GAbACAa4CAYJ9Aa8CAbEEAbADAbUGBAAAAbAEAa4DAwAAA60EAawEAqwFAaoDAasEAakDAagBA6gDAaoFA6kFAbAEAbQE',
    'AbcEAboEAbwEAbsEAbkEAbgEAbUEAbACAakGAaoFA6oGAbAEAbMEAbUGAbcGArgGAbgEAbkEAbgEArUEAbMCAbICA68GAq8FAbAFArEGCbIGAbEFAa8EAa4DAa8EAbEF',
    'ArAFA7AGAa8GAa0EAbMEAbcEAbgGAbkGAboGAbsGAroEAbkEAbgEAbYEAbMCAbACAaoGAakGAawEAbAEArMEAbQEAbIEAa8EAa0EAakCAaIFAaIEAaMEAaQDAagFAqkF',
    'AaoFAakEAqkDAqgCAaoDAqsEAq0FAawDAq0EAa0DAQAAAa4EAa4DAa4CAbAEAQAAAa4CAa0BAbADArMCAYN9AbYEAbMEAbMDAbUGBAAAAbACAa8DAwAAAq0DAa4EAa0E',
    'Aa0FAawFAaoEAakEAagCAacCAacDAagEAacEAqgFAaoEAbIEAbUEAbYEAbkEArsEAbkEAbcEAbUEAbECAasCAqcGAqgGAawEAa8EAbEGArQGAbYGA7cEAbYEAbMEAbEC',
    'Aa4CAa8GAbEHA7EGAbEFAbMFBLQGCLUGAbIEAbEDAbMFAbQGArMGArIGAbEGAa8EAa4DAa4EAbMEAbUEAbcGAbgGArkGAbkEAbgEAbYEAbUEAbIEAbACAawCAacGAagE',
    'Aa4EAbAEArIEAbEEAbAEAa8EAa4EAakCAaAFAaEFAaIEAaYFAacFAqgFAacEAagFAagDAqgCAakCAaoDAasEAa0FAa4FAa0EAa4EAa0EAa4DAQAAAbAEAbEEArEDAbIE',
    'AbACAa8BAbIEArgEAYR+AbwEAbgCAbUEAbYEBAAAAbIDAbEDAgAAAbIGAa4CAa0CAbACAa8CAa4FAa0FAaoEAakCAagCAagDAqgEAacEAacFAa0EAbIEAbYEAbcEAbkE',
    'AboEAbsEAboEAbcEAbUEAbIEAa0CAaUFAqYGAacGAakEAawEAa8GAbEGArIGAbMEArUEAbQEAbMEAbECAa0EAa4EAbAGAbIHAbMHArMGAbQGAbUHAbcIAbYHArcHBbcG',
    'AbcFAbgGAbcGArQEAbYGAbYHArUGAbQGAbMGAbEFAq8EAq8FAbIEAbQEAbYGArcGAbgGAbYEAbUEAbQEAbMEAbAEAa0CAagCAaQGAasEAa8EAbAEArMEAbIEArEEAbAE',
    'AawCAaMCAaIEAaUFAaYFAqcFAacDAagFAagEAakEAagDAagCAaoDAasDAq4FAa8FAa8EAq4CAbIGAbIFAbQGAbMFAbMEAbMDAbMEAbICAbcEAbsEAcAEAYR+Ab8EAb0E',
    'AbcFAbcEAboHAwAAAbQEAbIDAgAAAbIFAa8CAa4CArMCAa8CAa4FAasDAqkCAakDAakEAakFAagEAbEEAbYEAbgGAboGAbsGAbwGAb0EAbwEAbsEAbYEAbMEAbACAqYF',
    'AacGAqgGAasEAa4EArEEAbIEAbMEA7QEAbMCAbACAa4GAa8GAa8EAbAFAbMHArQHAbUHAbYHAbcHAbkIArgHAbkHA7gGArkGAbgGAboHAbkHArYEArgHAbcHAbYGAbUG',
    'AbQGAbIEAbADAbEFAbAFAbAGAa8FAbAEAbMEArYGAbcGAbYGAbUEAbQEAbMEAbIEAbAEAawCAaYGAacEAa4EAbEEAbMEA7UEArYEAbQEAbACAaoCAacFAacEAagEAagF',
    'AagEAakFAakEAasFAaoDAakCAaoCAawEAa8FArAFAbEEAa8CAbACAbMFAbQGAbYGArUFAbQDAbUFAbMEAbwEAb4EAcEEAYR+AcIEAcAEAbwCAbcEAboHAwAAAbUEAbMD',
    'AbcGAbMDAbIDAbEDAbADArYEAbUEAbAFAa0DAasCAawDAawEAawFAa8EAbQEAboEAbwGAb4GAb8GAb4EAb8EAcAEAb4EAboEAbUEAbICAakCAqgFAaoGAasGAasEAa4E',
    'AbEEAbIEBLMEAbQEAbMCAbACAa8GAbAGAbEGAbEFAbIFAbQHAbUHAbYGArcHAbkIAboIArkHAboHBLkGAboGAbkGAbsIAboHAbcEAbcFArkHArgHAbYGAbUFAbIDAbED',
    'AbIFAbEFAbEGAbAFAa4EAa8EAbQEAbUEAbcGArYGArYEAbQEAbMEAbACAawCAagGAasEAbAEAbMGAbYGArgGAboEAbwEAbsEAbkEAbYEAbMCAaoFAaoEAasFAaoEAawF',
    'AawEAa4GAa0EAawDAawCAa4EArEFArIFAbEDAbIDAbMDAbUFAbcGAbYFAbcFAbYDAbYEAbkEAb8EAsEEAYR+AcMEAcIEAb8CAbcEAbkGAwAAAbYEAbQDAbcGAbMDAbMC',
    'AbMEAbQEAroEAbkEAbQCAbADAa4CAbAEAbAFAbYEAbsEAb0EAcEGAcIGAcMGAcMEA8EEAb8EAbsEAbUCBK0FAa4GAa8GAbAEAbIEBLQEArUEAbUCArIGAbEEAbMFAbQG',
    'AbMFAbQFArYGAbcHAbkIAbgHAbkIAboIA7oHAbkGAboGAbkGAbkFAroGAbwIAbsHAbcEAbkHAroHArkHAbcFAbYFAbMDAbMEAbMFAbIFAbEFAbEGAa8EAa4DAbAFAbQE',
    'AbcEArgEA7cEAbYEAbQEAbECAawGAaoGAa4EAbQEAbcEAboGAbsGAb4GAcAEAcEEAcAEAb8EAb4EAbkCAbICAa8FAa4EAa8EAa8FAbEGAbEFAbAEAa8DAbACArMFArQF',
    'AbMDAbQEAbQCAbYFAbgGAbcEAbgFAbcFAbkEAb4EAcIEAcQEAcMEAYR+AcQEAcMEAcACAbcEAbgGAwAAAbYEArUDAbMBAbQEAbUFAboEAr0EAbwEAbgCAbECAbEDAbMF',
    'AbkEAb4EAcAGAcIGAcQGAcUGAcYEAcUEAcMEAcIEAcAEAb0CAbcCAa8EBLAFAbEFAbIGAbMEAbQEAbUEAbYEArUEAbYEAbUCAbUHAbMFArMEAbQFAbUFAbUGAbYFA7cG',
    'AbkIArkHBLoHArkGAbkFAbkGAroGAbsIAboHAbcEAbsIAboIAroHAbkHAbcFAbYFAbQEAbMFAbIFAbEFAbAFAbAGAa4EAa4DAa8EAbIGAbUEAbcEAbkEAbcEA7gEAbYE',
    'AbQCAbECAa4FAawFAa4EAbUEAbkEAbsGAb8GAcIGAsQEAcUEAcQEAcEEAb4CAbgCAbADAbEEAbIFAbQGArMFAbIDAbECAbQFA7UFAbQDAbYFAbUEAbUDAbgGAbcFArgF',
    'Ab4EAcEEAcQEAcYEAcQEAYV+AcUEAcMEAcACAbcEAbYEArMCAbQDAbUEAbUDAbQBAbMBAbUEAboEAbwEAr8EAb4EAbkCAbECAbIEAbwEAcAEAcMGAsQGAcYGAcYEAccE',
    'AcUEAcIEAcAEAb0CAbcCAbMFAbEEArMFAbMGAbMFA7QGAbUEAbYEAbUEArQEA7YHAbQEArMEAbUFAbYFAbYGAbcFAbgHArcFArgHA7kHAroHArkGAbgFA7kGAroHAbcE',
    'AbsIAboIAroHAbkHAbYFAbUFAbMEAbIFAbEFAq8FAa4FAa0EAawEAa0EAbAGAbIHAbQEAbcEAbYEAbcEAbgEAbkEAbgEAbYCAbMCAbAGAa8FAa4FAa0FAbUEAbgEAb8G',
    'AcEGAcQGAcUEA8cEAcQEAcAEAboCAbMEAbQFAbUFArQFAbMEAbICAbUEAbUFArYFAbUEAbYFAbYEAbQCAbYFAbcFAbgFAb4EAcEEAcQEAcYEAcgEAcYEAYV+AcQEAcME',
    'Ab4CAbYEAbQCArMCAbQDAbUDAbQDAbIBAbMBAbcEAb0EAr8EAb4EAb0EAbgCAa8CAbkEAb8EAcIGAcQGAcUGAcQEAsUEAcQEAcIEAb4EAboCArMFAbQGAbIEAbMGAbQG',
    'A7UHAbYHAbUHArYHAbQFArMEArYHAbUGAbMEAbMDAbMEAbUFA7cHAbgHAbYFAbcFAbYFArcFAbgGAbgHArkHBrgGArkHAbYEBLoIAbkHAbUFAbQFAbEFAbAFAa4FAa0F',
    'AqwFAqoEAasEAa0FAbAHAbEHAbIEAbMEAbUEAbYEArgEAbUEAbMCAbIHAbAHAa8HAa4GAa0GAbEEAboEAb0GAcEGAcMGAcYGAcgEAccEAcYEAcMEAb8EAb0CAbYCArQF',
    'AbQEAbMEAbICAbQEAbUEArUFAbUEAbYEAbYFAbMCAbUDAbcFAbwEAcEEAcQEAcUEAcYEAckEAccEAYZ+AcQEAcEEAbwCAbUEAbICAbMDAbICA7MDAbEBAbIDAbwEAr4E',
    'Ab8EAb0EAboEAbcCAbQEAbkEAb0GAb8GAcIGAcIEAcAEAb8EAcAEAb4EAboCAbUCA7EGAbIHAa8EAbEGAbIGAbMIAbMHAbMIAbQIAbMGArMHAbIGAbAEAbEEAbMGAbQH',
    'AbIFAbEEAbADAbIEAbMFAbUHArYIAbYHAbUGAbYHAbUFAbQEAbUEAbUFAbYFArcHBbcGA7gHAbUEAbgHA7gIAbgHAbQFAbEFAa8FAa4FAawFAasFAaoFAakFA6gEAaoE',
    'Aa0HAa4HAa4FAa8EAbAEAbIEArMEAbICAbEIAbAIAa4HAa4IAawGAasGAaoEAa0HAbUEAbsEAb0GAcEGAcIGAsQEAcEEAr4EAbwCAbQCAbIFArIEAbEDArMEAbQEAbQF',
    'AbQEAbQFAbUFArMDAbkEAcAEAcMEAcQEAsYEAcgEAccEAYZ+AcIEAb8CAbgCAbQEAbABArECArEDAbADAa8CAbgEAbwEA70EAboEAbcEAbIEAbMEAbYGAbgGAboGAbsE',
    'AboEAbcEArYEAbICAqwGAasFA6wHAakEAasFAawHAq0IBK0HAa0GAawGAqsEAa0EAa4GAa0FAqwDAa4EAbAGAbIHArMIA7MHAbIFAbEEArIEAbMEA7UGAbUFArUGAbYG',
    'ArcHAbUHAbMEAbUHAbYHA7YIAbIFAa8FAa0FAawFAaoFAakFAagFAacFAqYEAaYDAacEAakHAakFAakEAaoEAasEAawGAa0GAq0HAawHAaoHAqkIAacHAaYFAaUEAagH',
    'AakHAa0EAbIEAbgGAboGAbwGAbsEAboEA7kEAbYCAbACAa4FAq4EAa8FAbAFA7EFArIFAbEEAbIEAb0EAcEEAcQGAsUGA8YEAYZ/AcAEAboCAbMGAbIFAq4BAa4CAa4D',
    'Aq0DAbMEAbkEArsEAroEAbYEAbMEAa4EAa8EAbEEA7IEAbAEAawEAaoCAaYCAaUHAqQHAaMGAqMHAaIGAaAEAaIGA6MHBKQHA6MFAaMEAaQEAqYFAaUEAaYDAagEAaoG',
    'AasHAq0HAa4HAa4GAa8GAa4FA64EAa8EAbAEAbEEAbIGA7MGA7QHAbIFAbAEAbIFArMHAbMIAbIIAa8GAawFAasFAaoGAagFAacFAaYFAaUFAaQEAaMEAaIDAaMEAaQF',
    'A6MEA6MFAqQHAaMHAaIHAaEHAaAHAZ8HAZ4GAZ0EAZ8GAaEHAaIHAaMHAagEAawEArAGAbEGArEEAbIEAbEEAa4CAagFAacEAagEAasGAqwHAawFAq4GAa4FAa8FAbYE',
    'Ab0EAcAGAcMGAcUGAcIEAsQEAcMEAYZ/AboCAbMCAbAGAa4EAasBAasCAqsDAaoDAa8EAbUEA7gEAbcEAbUEAbEEAa0EAqgEAqoEAakEAacEAaUEAaACAZ0FAZ0GAp0H',
    'ApwHAZsHAZoGAZkEAZgEAZoGAZoHApoGA5sGAZwGA5sEAZwEAZ0EAZ4EAZ8EAZ4DAaAEAaIFAaQGAaUGAacHAacGAagGAakGAqoGAqoEAasEAasDAawDAa0EAa8FAbAG',
    'AbEGAbEHArIHAbEHAa8FAa4EAq4FAa8HAa8IAa8HAasFAakFAagFAacGAaYGAaUGAaQGAaIFAaEFAaAEAp4DAZ4EAZ0EApwEA5sEAZwGApsGAZoGAZkGAZgGAZgHAZcG',
    'AZUEAZYEAZgGAZoHAZsHAZwHAZ0HAaIEAaUEAaYEAqcEAqoEAakEAacCAaEEAaIEAaUHAacHAqgHAaoHAaoGAaoFAbEEAbYEAbsGAb4GAcAGAcIEA8AEAb4EAYV/AbIC',
    'Aq0GAasDAakCAqgDAacDAawEAbEEAbQGArUGAbQEAbMEAbAEAasEAaUEAaIEAaEEAaMEAaIEAaAEAZ0CAZkGAZgHAZcGApcHApYHApUHAZIFApEEAZIGA5MGAZQGA5UG',
    'AZQEAZUEAZUDAZYEAZcEAZgEAZkEAZkDAZsEAZwFAZ4GAaAGAaEGAaIGAaMGAaQFAaUFAqYFAaYEAqcDAagDAaoEAasFAawGBK4HAa0GAawFAaoEAasFAaoFAaoGAasH',
    'AaoIAacFAaYFAaYHAaUGAaMGAaIGAaAGAZ8GAZ4GAZwEAZoDAZkDAZkEAZgEAZcEAZYEAZUDAZUEAZQEA5UGApMGApIGAZEGAY8EAZAEAZIFAZQHApUHAZYHAZcHAZkE',
    'AZwEAZ4EAZ8EAaEEAqMEAaICAZwCAZ0EAaAHAaIHAaMHAaQHAaUHAaUFAasEAbIEAbUGAbkGAbwGAb0GAb8EAb0EAbwEAboEAbgCAYWAAqkGAqgFAacFAaUDAaQDAagE',
    'Aa0EAa8GArEGArAEAa4EAakEAaQCApwEAZsEAZwEAZsEAZgCAZYHApQGAZMGAZMHApIHApEHAZAHAo0EAYwEAY0GAo4GAo8GApAGApAFAZAEApEDAZIDAZMEApQDAZYE',
    'AZgEAZoFAZsFAZ0GAp4FAZ8FAaAFAaEEAaIEAqMEAaQEAaQDAqYEAagFAakHA6oHAagFAacEAqcFAaYFAaUFAaYHAaUHAqIFAaIHAaEIAaAIAZ8HAZ0GAZsFAZoFAZcE',
    'AZYEAZUDAZQDAZMEAZIDApEDAZAEApAFApAGAY8GAY4GAo0GAYwGAosEAY0EAY8HApEHApIHAZMHAZMGAZYEAZcEAZoEAZsEApwEAZoCAZkFAZsFAZ0GAZ4GAaAHAaEG',
    'AaQEAasEAbAEAbMGAbYGAbgGAbkEAboEAbcEAbUEAbQEAbACAYWAAqUGAaQFAaQGAaQHAaEDAaUEAakEAa0GAq4GAq0EAaoEAacEAaICAZkGAZcFAZYFAZYHAZYIAZUI',
    'AZMHAZIGAZEGAZAHAY8HAY8GAY4HA40GAYwHAokEAYgEAYkFAooGAYsGAYwGAo0GA40FAY0EAY0DAY4DAY8DAZADAZEDAZMEAZQEAZUFAZcGAZgGAZkGAZoGAZsEAZwE',
    'AZ0EAp4EAZ8EAaAEAaADAqIEAaMEAqUGAqUFAaQEAaMEAqMFAaIFAaEFAaEGAaAFAZ4EAZ4FAZ4HAZ4IAZwIAZsIAZgGAZcFAZYFAZQEAZIEAZEEAZADAY8DAY4DAY0D',
    'AY0EA40FAo0GAosGAooGAYkFAogEAYkEAYwHA40GAY4HAY8GAY8HAZAHAZAGAZEEAZMEAZUEAZYCAZYHAZYFAZcFAZkHAZoGAZwHAZ0HAaQEAakEAawGAa8GAbIGAbIE',
    'AbQEAbMEAbEEAa4EAawCAaUGAYWAAaAGAaAFAZ8EAqAGAaIEAaYEAagGAqsGAaoEAagEAacEAaQEAZ8CAZgCAZUGAZMFAZIFAZMHAZIHAZAHAY8HAY4GAY0GAY0HAYwH',
    'AYsGAYoGAYkGAogFAYgGAoYEAYUEAoYFAYcGAogGAokGAokFAYoFAooEAYsEAYsDAYwDAY0DAY8EAZAEAZEEAZMFAZQFAZUFAZYFAZYEApgEAZkEAZoEApsEAZwEA54E',
    'A58EAaAEAaAFAp8FAp4FAZ0FAZwFAZsEAZoEAZoGAZoHAZkIAZgHAZYHAZQFAZIFAZEEAZAEAY8EAY0DAYwDAYsDAYsEAooEAYoFAokFAokGAogGAYcGAYYFAYUFAoUE',
    'AYYEAYgGAogFAYkGAYoGAYsGAYwHAY0HAY0GAY4GAY8HAZAHAZIHAZMHAZIFAZMFAZUHAZYGAZcGAZ0EAaIEAaUGAakGAasGA60EAawEAaoEAaYCAqAGAYWAAZwFApsF',
    'AZsGAZ8EAaMEAaUGAaYGAacGAaYEAaUEAaMEAZ8EAZsCAZQCAZEGAZAGAY4FAY4GAY8IAY0HAYwGAYoFAYkGAYkHAYgGAYcGAoYGAYUFAoQFA4MFA4IEAYMFAYQGAYQH',
    'AoUHAYUGAYYGA4YFAYcFAYgEAYgDAYkDAYoEAYsEAYwEAY4EAY8EAZAEAZEEAZIEAZMEAZQDApUDAZYDAZcDAZgEA5kEA5oEAZsFAZwGAZsGAZoFApkFAZgFAZcEAZYE',
    'AZYFAZUFAZUGAZQGAZIFAZEFAY8EAY4EAYwEAYsEAYoDAYkDAYgDAYgEAYcFA4YFAYYGAYUGAoUHAYQHAYQGAYMFA4IEAYIFAoMFAoQFAYUFAoYGAYcGAYgGAYkHAYkG',
    'AYoFAYsGAY0HAY8IAY8HAY4FAZAGAZEGAZYEAZwEAZ4GAaEGAaMGAaUEA6YEAaMEAaECAZsGApwFAYd/A5cFAZkEAZ8EAaEGAqIGAaIEAaAEAZ4EAZwEAZcCAZACAY4G',
    'AY0GAYwFAooFAYoHAYkHAYcGAYYFAoUGAYQGAYMGAoIGAoEFAoAFA38FAn4EAX8EAYAFAoAGAYIGAYEGAYIHAYIGAYIFAoMEAYQEAYQDAYUDAYYEAogEAYoEAYsEAYwE',
    'AY0EAY4EAY8EAZAEAZEEAZEDAZIDAZMEApQEApUEAZYEAZUDAZYEApcGApYFAZUFApQEAZMFAZIFAZIGAZEFAZAFAY8FAY4FAYwEAYsEAYoEAYgEAYcDAYYDAYUDAYQD',
    'AYQEAoMEAYIFAYIGAYIHAYEGAYIGAoAGAYAFAX8EAn4EA38FAoAFAoEFAoIGAYMFAYQGAoUGAYYFAYcFAYkHAYoHAYsHAYoFAYwGAY0FAZQEAZcEAZoGAZ0GAZ4GA58E',
    'AZ4EAZsCApYFAZcGAZcFAYl+AZIGApMGAZkEAZwGAp4GAZ4EAZ0EAZoEAZcEAZMCAYwFAYsFAYoFAYkGAYgGAYcFAYYFAYYGAYUGAYQFAoIFAYEFAYEGAYAGAX8FAX8G',
    'AX4GAX4FA30FAXwFAXwGAnwFAXwEA30FAn4FAn8GAn8EAYAEAoEEAYIDAYMDAYQEAYUEAYYEAYcEAYgEAYkEAYoEAYsEAYwEAo0EAY4EAZAFApAEA5EEAZEDA5IEApEE',
    'ApAEAZAFAZAGAY8GAY4GAY0GAYwFAYsFAYoFAYgEAYcFAYYEAYUDAYQDAYMDAYIDAoEEAYAEAn8EAn8GAn4FA30FAXwEAnwFAXwGAXwFA30FAX4FAX4GAX8GAX8FAYAF',
    'AYEGAYIGAYEFAYIFAYMFAYQGAYYGAYcGAYYFAYgFAYwEAZEEAZMGAZYGAZcGApkEApgEAZUCAZEFBJIFAY98AY4FAY8GAZQEAZcEApkGAZkEAZgEAZYEAZMEAY8CAYkF',
    'AYgFAYcFAoYFAYQFAYMFAYIFAYIEAYEEAYEGAYAGAX8FAn4FAX0FAXwFAXwGAXwFAnsFBXoFAnoGAnsGAXoFAnsFAnwFAXwEAX0DAX0EAX4EAX8EAYAEAYEEAoIEAYME',
    'AYQEAYUEAYYEAYcEAogEAooEAYsFAY0GAY0FA40EAo0DAo4DAo0DAY4EAY0EAY4GAY0GAY0HAYwHAYsHAYoGAYkGAocFAYUEAYQEAYMEAoIEAYEEAYAEAX8EAX4EAX0E',
    'AX0DAXwEAnwFAnsFAXoFAnsGAnoGBXoFAnsFAXwFAXwGAn0GAX4FA38FAYAFAYEFAYMGAYMFAYMEAYUFAYoEAY0EAZAEAZEEA5MEAZIEAZACAo4FBI4EAZB6AYwDAZAE',
    'AZQEAZYGAZcGAZYEAZUEAZQEAZEEAY0CAYgFAYYFAYUFAYQEAYQFAYMFAYEFAoAEAX8DAX8EAX8FAn4FAn0FAXwFAXsFAXsGAXsFAnoFBXkFBnoGAXoFAnsFAXsEAnwE',
    'AX0EAX4EAX8EAYAEAoEEAYIEAYMEAYQEAYUEAYYEAYYDAYcEAYgEAYkEAYsGAYwHAYwFAowEBowDAY0EAo0FAY0HAowHAYsHAYoHAYkGAYgGAYYFAYUFAYQFAYMEAYIE',
    'AoEEAYAEAX8EAX4EAX0EAnwEAXsEAnsFAXoFBnoGBXkFAnoFAXsFAXsGAnwGAX0GAn4FAX4EAX8EAYAEAYEFAYIFAYIEAYMEAYgEAYoEAYwEAY4EA48EAY0CAowFAY0F',
    'A40EAYwDAY95AY0EAZMEAZUGAZYGAZUEAZQEAZMEAZEEAYwCAYgFAYYGAYUGAYMFAYIFAYEFAYAFAX8EAX0DAX4DAX0DA34EAX4FAn0FAX0GAnwGAnsGAXoFAXkFAXkG',
    'AXkFAnkGBXoGAnoFAXoEAnsEAXwEAX0EAX4EAX4FAX8FAYAFAYEFAYEEAYIDAYMEAYQEAYUEAocEAYgFAYkEAYoEAYwFAY0GAY0FAY0EAo0DAY0EA44EAY4FAY8GAY8H',
    'Ao4HAYwGAYsFAYkFAYgFAYcFAYYFAYUEAYQEAYMEAYIFAYADAoAFAX8FAn4FAX0EAnwEAnsEAXoEAnoFBXoGAnkGAXkFAXkGAXkFAXoFAnsGAnwGAn0GAX4GAX8GAX8F',
    'AYAFAYAEAYEEAoIEAYQEAYcEAYkEAYsEAowEAY0EAYwCAowGAY0GAo4GAo4FAY0DAY15AZIEAZQEAZUEAZYEAZUEAZMEAZEEAYwCAYkEAYgFAYYFAYQFAYIEAoAEAX8E',
    'AX0DAXwCA30DA34EAX4FAX0GAX0HAnwGAnsGA3oGAXkGCHoGAXoEAnsEAXwEAXwFAX0FAX4FAn8FAYAEAYEEAYECAYIDAYMDAYUEAYYEAYgFAYkFAYoFAYoEAYsEAYwF',
    'A44FAY4EAY4DAY4EAo4FAY0FAY4GAY4HAY0HAYwHAYoHAYcFAYYEAYQEAYMEAYIEAYEEAX8EAX4EAX0EAX0GAnsDAnsEBHoFAXkFA3kEAXgEBXkGBHgGA3kGAnoGAXsG',
    'AXwGAn0GAX4GAX8GAYAGAYEGAYEFAoIEAYMDAYQEAYYEAYcEAYkEAYoEAYsEAYoCAYwFAo0GAY4GAo8GApAGAY8EAYx5AZEEAZMEAZQEAZMEAZEEAY8CAYwEAYsFAYkF',
    'AYcFAYUFAYMFAYEEAYAEAX8EAX4DAX0DAXwEBH0EAX4FAX0FAn0GAXwGAXsGAXsHAXoGAXoHAnkGB3gGAnkGAnkFAnoFAXsFAXwFAX0GAX0FAX4FAX4EAX8DAYADAYAB',
    'AYIDAYMDAYQEAYYFAYcGAYgFAokFAYoEAYsFAYwFAo0FAY0EAo0DAYwFAYoFAYgFAYgGAYcGAYUHAYIHAYAHAX0FAXoEAXkEAXcEAXYEAXQEAXMEAXIEAXEDAXEEAXAE',
    'AXAFAXAEAnAFAXEGAXEFAXIGAXIFAXMFAXIFAnMFAXQFBHUGBXQGAXUGAXYGAXYHAXcGAXgHAXkGAXoFAXsFAXwFAX0FAX8GAYAGAYEGAYEFAYIFAoMEAYQEAYUEAYYE',
    'AYcEAYgEAYkEAosFAYwFAY0GAY4FAY8GAo8FAY8GAYp5AYwEAo4EAYwEAYsCAYgEAYkFAYcFAYYFAYQFAYMEAYEEAYADAX4DAX4EAX0EAnwEAXwFAXwGAXsFAnsGAXoG',
    'AXsGAXoGAXkHAXgGAXgHAXcGAXYGA3UGAnQGAnQHAnUHAnUGAXYGAXYFAncFAXgFAnkFAXoEAXsEAXoCAXsCAX0FAX0CAX8EAYAEAYEFAYIFAYMFAYQFAYQEAYQCAYUD',
    'AYcEAogFA4kEAYcEAYMEAX8EAXwEAXoEAXcFAXUFAXIFAW8FAWwFAWoFAWgFAWcEAWUEAWQEAWMEAmIEAWEDAmEEAmEFAWIFAmMFAWQFAWUFAmYFAWgFAWkGAWoGAmwG',
    'AmwHAmsHA2sGAWwGAW0GAW4GAW8HAXAGAXEGAXMGAXQFAXYFAXgFAXoGAXsGAX0GAX4GAX8HAYAGAYEGAYEFAYEEAoMEAYQEAYUDAYYEAYcEAYgEAYgFAYoFAYoGA4oF',
    'AYd6AYIEAoMEAYICAYEFAYAFAYEGAYAGAX8FAX0FAXwFAXsEAXoEAXkEAXkFAXgEAXcEAXYEAXYFAXYGAnUGAXUHAXQGAXQHAXMHAXIHAXEGAXAGAW8GAW4GA20GAWwG',
    'A2wHAm0HAW0GAW4GAm4FAXAFAXAEAnEEAXIEAXIDAXMEAXMDAXQEAXUDAXYEAXgFAXkGAXoFAXsGAXsFAXwFAXsCAXsBAXwBAX4EAX8FAYAFAoAEAYEFAX0EAXgEAXQD',
    'AXADAW0EAWoEAWcEAWQEAWEEAV8EAV0EAVsEAVoDAVgDAlcDBVUDAVUFAlUEAlYEAlgFAVkFAVoFAVwFAV0FAV4GAV8GAWAHBF8HAl4GAV4FAV8FAWAFAWEGAWIGAWMG',
    'AWQGAWYGAWgFAWoGAWwGAW8HAXEGAXQHAXUGAXcHAnkGAXoGAXoEAXsFAXsEAXwEAn0EAX4DAX8EAYAEAYEEAYEFA4EEAYV7BHUFAXQFAXQEAXQFAnMFAXIFAXEEAXAE',
    'Am8EAm4FAW0FAWwFAmsFAWoFAmoGAWgFAmgGAmYFAWQFAWMFAmIFAmEFAmAGBWEGAWIGAmMFAWQFAWQDAWUDA2YCAmcCAWkCAWoDAWsFAW0GAm4GAXAGAm8EAW8CAW8B',
    'AXABAXIEAnMEA3QEAXEFAW0FAWkEAWYEAWMEAWAEAV0EAVsEAVgDAVYDAVUCAVMCAVICAVECAVACAU8DAU4CAk4DAU4EAU4DAU0DAk0CAU4DAU0DAU4EA08FAVAFAVEF',
    'AVEGAlIGBFEGAlAGAVAFAlIFAVMFAVQFAVUFAVYFAVgFAVoFAVwFAV4GAWEHAWMGAWYHAWgGAWsGAW0GAW4GAm4FAnAFAXEEAXAEAnEDAXIDAXMEA3QEAXUEAXUDAYmB',
    'AmUFAmUEAWQEA2MDAWIDAWIEAmEFAWAFAV8FAV8GAV4FAV4GAV0FAlwFAVsFAloFAVkEAVkFAVgEAVcDAVcEAVYEAlUEAlQEAVMDB1MEAVQEAlUEAVUDAVYDAVYCAlcC',
    'AVcBAVgBAVkCAVoCAVsEAVwFAV0GAV4GAV8GAWAIAV8DAV8CAWADAWACAWECAWIFBGMDAWQEAWMFAWAEAV8EAV4FAVsFAVkFAVcFAVYFAVMEAVIEAVEEAU8CAU4CAU0D',
    'AU0FAUwEA0sDAkoEA0kBAUkCAUgCAkgDAUcDA0cEA0YEBkUEAUUDAkYEAUcEAUgEAUkFAUoEAUsEAU0EAU8FAVAFAVMGAVUGAVcGAVkGAVsFAV0GAV4GAV4FAV8GAmAF',
    'AWEEAmEDAmIDAWMFA2QFAmUFAY+DAVMFAlIEAVIFAVIEAVEDAlEEAVAEAVAFAlAEAk8FAU8GAk4GAk0GAkwHBEsGA0oFBEkFAUgDBUgCBkgDAkkDBEkCAkoCAUoDAkwE',
    'AU0FAU0GAU4GAU8HAU8GAU4BAU8GAlAFAlEGAVEEAlECAVEDAVIEAVEEAVEFAVAFAU8FAU4FAU0FAUwGAUsFAkoGAUkEAUgDAUcDAkcGAUYFAkYGAUUDAUUCBEQCAUMC',
    'AkICA0EDAkADAz8DBD4DAj8DAT8EAkAGAkEGAUIGAUMGAUQGAUUGAUYGAUcGAUgGAUoGAUsGAUwGAU0GAU0FAk4FBE8EAlAEAlEFA1IFAlMFAZeDAz8EAz8FAj8GAj0E',
    'AjwDAjwEAT0FATwFAT0GBDwGATwFAj0GAT0HAj8GAj4GAj8GAT8FAT8EAkADA0ACAkAEAj8EAz4EAT0EAT8EAj4EAz0DAT0EAT4EAjwDAjwEAT0EATwEATsCATwEAz0E',
    'AT8HAT8DAj4BAT4CBD8EAT8FBD4FAT0GATwGAjsFAToEAjsFAToDATsGATsFAjoEATsEATwEAjwDATsDAjwDATwEAToEBTsEAzwEAjwFATwGATwFBDsGATsFATsGAj0H',
    'AT0GAT0HAjsGAzwGATwFATwEAzwDATwEAT0EAz0FBT8FAj8EAaaBAy0CAS0DAi0EAi4FASkFAykEAioEAioFASsFASsGASwGASwDAi0DAS4EAS8FATAIATcIATcEATME',
    'ATIEATUFATYEATgEAjkEAToFATwFAT0FATwFATsGAjkGATgGATYGATUGATQGATIGATcGATYGATQFAjMCATICAjECAisDBCoDAikDASoHASkHASkEAS4FAS0ECC0DAy0E',
    'Ai4EAikFASoFASkEASoEASoFASoEBCsFAjEFATIEATMEATMDATQCATUCATYEATIGATMGATQGATUGATYGAjgGATkGAjsGAjoGATgFATgEATYEATUEATQEATEEATIFATcI',
    'ATYIATUEATQFAi4GAS0GAS0HASwHASwFASsFASoFAyoEASkFAykEAi4EAS0EAy0DAS0CAaZ/CAAAARsGAhsFAhwFARwEAh0FAh4FAR8FASAGAiEGASIHASMHASUIAgAA',
    'ASkHASUFAS0GAS8DATECATQCATIEATQEAzgFATUFATEEATQFATEFAS8FAS0FASsEASkECAAAAh8HAR4HAx0HAhwHARwIARsIARsHDwAAAhsHARwHAxwEAh0EAh4EAR8E',
    'CAAAASkFASsFAS0FAS8FATEFATQFATEGATUGATgFATcFATgFATUFATEEATMDATECAS4CAS0DASUFASkGBAAAASMHASIHASEHASAIAh8HAR4HAR0GAR0FAhwFARwGAhsE',
    'ARsDBwAAAZ9+HAAAARoFBAAAASoHAS4CATUHATIHATUHAS8HASgCQQAAASoHAS8HATUFATEFATUHAS8HASgCBAAAARoFGwAAAYl+JAAAASkIRwAAASkEIwAAAYN/kAAA',
    'AYF/kAAAAYCAkAAA'
  ].join(''),
};
