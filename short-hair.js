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
  return { get };
})();
