// Cloth and leather are lit in garment coordinates so their painted folds move with the actor.
const pineFigurePaint = (() => {
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const mix = (a, b, t) => a + (b - a) * t;
  function smooth(v, lo, hi) {
    const t = clamp((v - lo) / (hi - lo));
    return t * t * (3 - 2 * t);
  }
  const groups = ['cloth', 'trouser', 'hide', 'flesh', 'trim', 'leather', 'strand'];
  const painted = groups.flatMap((name) => Array.from({ length: 8 }, (_, i) => name + 'Ink' + i));
  const knitwear = new Set([
    'pullover',
    'hoodie',
    'cardigan',
    'sailor-knit',
    'striped-cardigan',
    'argyle',
    'knit-vest',
    'breton',
    'rugby'
  ]);
  const fasteners = ['brass', 'brassShade', 'lensGlint', 'steel', 'spout'];
  const tones = {
    cloth: { shadow: [0.3, 0.34, 0.38], lit: [235, 225, 183], lift: 0.44 },
    trouser: { shadow: [0.31, 0.29, 0.36], lit: [217, 199, 181], lift: 0.43 },
    hide: { shadow: [0.39, 0.27, 0.26], lit: [255, 207, 144], lift: 0.62 },
    trim: { shadow: [0.35, 0.27, 0.3], lit: [255, 222, 157], lift: 0.56 },
    strand: { shadow: [0.4, 0.33, 0.39], lit: [247, 222, 197], lift: 0.72 },
    leather: { shadow: [0.36, 0.24, 0.25], lit: [253, 195, 127], lift: 0.57 }
  };
  const steps = [0, 0.25, 0.49, 0.74, 1, 1.37, 1.7, 2];
  const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const hex = (values) =>
    values
      .map((v) =>
        Math.round(clamp(v, 0, 255))
          .toString(16)
          .padStart(2, '0')
      )
      .join('');
  function dyed(hexColor, material) {
    const base = rgb(hexColor),
      { shadow, lit, lift } = tones[material];
    const value = (0.24 * base[0] + 0.58 * base[1] + 0.18 * base[2]) / 255;
    const dark = base.map((v, i) => v * shadow[i] + [9, 7, 10][i] * (1 - value));
    const peak = Math.max(1, ...base);
    const gloss = material === 'strand' ? 0.46 + 0.54 * smooth(value, 0.06, 0.58) : 1;
    const light = base.map((v, i) => {
      const reflected = v + (255 - v) * (0.46 + (0.54 * v) / peak);
      return mix(v, Math.max(v, 0.7 * reflected + 0.3 * lit[i]), lift * gloss * (0.66 + 0.34 * Math.sqrt(value)));
    });
    return steps.map((s) => hex(base.map((v, i) => (s < 1 ? mix(dark[i], v, s) : mix(v, light[i], s - 1)))));
  }
  function palette(m, colors, tint) {
    const pigments = {
      cloth: m.top,
      trouser: m.bottom,
      hide: m.shoes,
      trim: m.accent,
      strand: colors.hair.slice(1),
      leather: m.bagMain || colors.bag?.slice(1) || '945e43'
    };
    for (const [group, color] of Object.entries(pigments)) {
      dyed(color, group).forEach((c, i) => {
        m[group + 'Ink' + i] = c;
      });
    }
    // Reuse the portrait's own complexion for exposed arms, calves and knuckles.
    const skin = rgb(colors.skin.slice(1));
    const dark = hex(skin.map((v, i) => v * [0.67, 0.47, 0.42][i]));
    const day = hex(skin.map((v, i) => v * [1.2, 1.09, 0.99][i]));
    const flesh = [0, 2, 3, 5, 6, 8, 10, 11];
    flesh.forEach((v, i) => {
      m['fleshInk' + i] =
        m['skinPlane' + v] ||
        (i <= 4
          ? tint(dark, colors.skin.slice(1), i / 4)
          : tint(colors.skin.slice(1), tint(day, 'ffd0a2', 0.24), (i - 4) / 3));
    });
    m.topShade = m.clothInk2;
    m.topStitch = m.clothInk0;
    m.topLight = m.clothInk6;
    m.bottomShade = m.trouserInk1;
    m.bottomLight = m.trouserInk5;
    m.shoeShade = m.hideInk1;
    m.shoeLight = m.hideInk6;
    m.trimShade = m.trimInk1;
    m.trimLight = m.trimInk6;
    if (m.bagMain) {
      m.bagShade = m.leatherInk1;
      m.bagLight = m.leatherInk6;
    }
    for (const group of [
      'hat',
      'attachment',
      'glasses',
      'wrist',
      'ears',
      'bottle',
      'brooch',
      'hairpiece',
      'belt',
      'audio',
      'gloves',
      'charm',
      'device'
    ]) {
      if (!m[group + 'Main']) continue;
      const ramp = dyed(
        m[group + 'Main'],
        ['ears', 'wrist', 'charm', 'brooch'].includes(group) ? 'trim' : 'cloth'
      );
      if (m[group + 'Shade']) m[group + 'Shade'] = ramp[1];
      if (m[group + 'Light']) m[group + 'Light'] = ramp[6];
    }
    const locks = Array.from({ length: 8 }, (_, i) => m['strandInk' + i]);
    for (const [name, level] of Object.entries({
      hairRoot: 0,
      hairDepth: 1,
      hairShade: 2,
      hairMid: 3,
      hairPlane: 4,
      hairLight: 5,
      hairSheen: 5,
      hairHighlight: 6
    })) {
      if (m[name]) m[name] = locks[level];
    }
    m.outsole = tint(m.hideInk0, '352a29', 0.42);
    m.rubber = tint('eee7d7', m.shoes, 0.115);
    if (m.brass) {
      m.brass = 'e8ac61';
      m.brassShade = '865029';
    }
    if (m.lining) m.lining = 'f4deba';
    if (m.webbing) {
      m.webbing = tint(m.leatherInk1, '534235', 0.58);
      m.darkWebbing = tint(m.leatherInk0, '352c29', 0.53);
    }
  }

  const bindings = new WeakMap();
  function inks(k) {
    if (bindings.has(k)) return bindings.get(k);
    const set = {};
    for (const group of groups) set[group] = Array.from({ length: 8 }, (_, i) => k[group + 'Ink' + i]);
    const types = [],
      bias = [];
    const assign = (group, names) => {
      for (const [name, shade] of Object.entries(names))
        if (k[name]) {
          types[k[name]] = group;
          bias[k[name]] = shade;
        }
    };
    assign('cloth', { top: 0, topShade: -0.75, topLight: 0.85 });
    assign('trouser', { bottom: 0, bottomShade: -0.68, bottomLight: 0.85 });
    assign('hide', { shoes: 0, shoeShade: -0.82, shoeLight: 0.91 });
    assign('trim', { accent: 0, trimShade: -1.1, trimLight: 1.1 });
    assign('flesh', { skin: -0.3, skinLight: 0.28, skinShade: -1.0 });
    assign('leather', { bagMain: 0, bagShade: -1, bagLight: 1.1 });
    const binding = { set, types, bias };
    bindings.set(k, binding);
    return binding;
  }
  const swatch = (ramp, level) => ramp[clamp(Math.round(level), 0, 7)];
  // A fold has a valley, a shorter lit edge and two tapered ends. Each pattern is
  // drawn for this garment in normalized coordinates, independently of any dye.
  function foldStudy(lines) {
    const size = 48,
      values = new Float32Array(size * size);
    for (const [x0, y0, x1, y1, bend, radius, weight] of lines) {
      const dx = x1 - x0,
        dy = y1 - y0,
        length = Math.hypot(dx, dy);
      for (let j = 0; j < size; j++)
        for (let i = 0; i < size; i++) {
          const x = (i + 0.5) / size - x0,
            y = (j + 0.5) / size - y0;
          const t = (x * dx + y * dy) / (length * length);
          if (t <= 0 || t >= 1) continue;
          const envelope = 4 * t * (1 - t);
          const distance = ((dx * y - dy * x) / length - bend * envelope) / (radius * (0.16 + 0.84 * envelope));
          const valley = Math.max(0, 1 - Math.abs(distance));
          const ridge = Math.max(0, 1 - Math.abs(distance + 1.08) / 0.84);
          values[j * size + i] += weight * (0.76 * ridge - 1.42 * valley) * Math.sqrt(envelope);
        }
    }
    return values;
  }
  const charts = {
    knit: foldStudy([
      [0.06, 0.19, 0.41, 0.4, 0.043, 0.067, 1.12],
      [0.65, 0.38, 0.96, 0.18, 0.024, 0.05, 0.94],
      [0.02, 0.53, 0.47, 0.82, 0.075, 0.061, 1.35],
      [0.4, 0.88, 0.93, 0.65, 0.039, 0.07, 1.22],
      [0.19, 0.95, 0.37, 0.74, -0.045, 0.047, 0.82]
    ]),
    shirt: foldStudy([
      [0.0, 0.18, 0.35, 0.46, 0.019, 0.034, 1.38],
      [0.63, 0.44, 0.98, 0.25, 0.015, 0.046, 1.08],
      [0.12, 0.57, 0.42, 0.93, 0.037, 0.051, 1.7],
      [0.53, 0.95, 0.84, 0.59, -0.018, 0.063, 1.34],
      [0.03, 0.78, 0.31, 0.94, 0.03, 0.035, 0.96]
    ]),
    sleeve: foldStudy([
      [0.06, 0.18, 0.74, 0.39, 0.045, 0.055, 1.42],
      [0.22, 0.5, 0.98, 0.29, 0.042, 0.06, 1.34],
      [0.01, 0.59, 0.69, 0.72, 0.022, 0.069, 1.52],
      [0.37, 0.81, 0.98, 0.67, 0.03, 0.04, 1.16]
    ]),
    trouser: foldStudy([
      [0.15, 0.03, 0.49, 0.41, 0.029, 0.054, 1.54],
      [0.7, 0.05, 0.51, 0.35, 0.019, 0.065, 0.97],
      [0.04, 0.38, 0.7, 0.57, 0.026, 0.048, 1.81],
      [0.43, 0.63, 0.96, 0.48, 0.022, 0.054, 1.35],
      [0.14, 0.92, 0.79, 0.74, 0.029, 0.052, 1.48],
      [0.42, 0.94, 0.97, 0.85, 0.014, 0.038, 1.25]
    ])
  };
  function study(chart, x, y) {
    return chart[clamp(Math.floor(y * 48), 0, 47) * 48 + clamp(Math.floor(x * 48), 0, 47)];
  }
  const tucked = new Set(['oxford', 'knit-vest', 'polo', 'blazer', 'tee', 'rugby', 'breton']);
  const longCoats = new Set(['trench', 'cross-robe', 'brocade', 'lab-coat', 'apron', 'mantle', 'kimono', 'tunic']);
  function hem(style, base) {
    if (longCoats.has(style)) return 0;
    const lift = tucked.has(style) ? 0.24 : knitwear.has(style) ? 0.17 : 0.115;
    return lift * { adult: 1, child: 0.87, toddler: 0.58, baby: 0.43 }[base];
  }
  function drape(style, t, hemline) {
    const h = (t - hemline) / (1 - hemline);
    const gathering = knitwear.has(style) || tucked.has(style) ? 1 : 0.56;
    const ease = 1 - smooth(Math.abs(h - 0.24), 0, 0.27);
    const hemBand = 1 - smooth(Math.abs(h - 0.015), 0, 0.115);
    return 1 + gathering * (0.095 * ease - 0.061 * hemBand) - 0.046 * smooth(h, 0.74, 1);
  }
  const shortPlanes = [0, 1.25, 3.45, 4.6, 5.55];
  const longPlanes = [0, 1.0, 2.45, 3.85, 5.15, 6.05];
  function hair(k, tone, u, v, h, short, fallback) {
    const planes = short ? shortPlanes : longPlanes;
    if (!tone || tone >= planes.length) return fallback[tone];
    const band = 1 - smooth(Math.abs(h - (0.54 + 0.19 * v - 0.125 * u)), 0.055, 0.3);
    const wrap = 0.42 * u - 0.72 * v + 0.48 * h;
    return swatch(inks(k).set.strand, planes[tone] + wrap + band * (tone < 2 ? 0.22 : 1.29));
  }
  function waist(k, u, v, t) {
    const ramp = inks(k).set.trouser,
      a = Math.abs(v);
    const belt = t > 0.72,
      side = 0.9 * u - 1.05 * v;
    const pocket = u > 0.26 && a > 0.45 && Math.abs(a - 0.47 - 0.45 * (1 - t)) < 0.07;
    const fly = u > 0.5 && Math.abs(v - 0.053 * t) < 0.052;
    return swatch(
      ramp,
      3.65 + side - (pocket || fly ? 1.75 : 0) - (belt ? 1.26 : 0) + (t > 0.76 && t < 0.84 ? 1.12 : 0)
    );
  }
  function torso(k, value, style, u, v, h) {
    const { types, set, bias } = inks(k),
      group = types[value];
    if (!group || group === 'hide') return value;
    const light = 1.04 * u - 1.62 * v;
    if (group === 'flesh') return swatch(set.flesh, 4.0 + light + bias[value]);
    if (group === 'leather') return swatch(set.leather, 3.5 + light + bias[value]);
    const knit = knitwear.has(style);
    const chart = knit ? charts.knit : charts.shirt;
    const side = clamp(v * 0.47 + 0.5),
      front = smooth(u, -0.4, 0.6);
    const folds = study(chart, u < 0 ? 1 - side : side, 1 - h) * (0.39 + 0.51 * front);
    // Two folds grow out of the armhole and waist. Their widths taper into the lit plane.
    const flank = Math.abs(v),
      diagonal = h - (0.18 + 0.22 * (1 - flank) + 0.043 * v);
    const hemFold = flank > 0.25 && diagonal > 0 && diagonal < 0.11 * flank;
    const pit = smooth(flank, 0.48, 0.94) * (1 - smooth(Math.abs(h - 0.6 + 0.07 * v), 0.04, 0.21));
    const tone =
      3.7 + light + 0.51 * h + folds + bias[value] - 1.61 * pit - (hemFold ? 1.4 : 0) - (h < 0.036 ? 1.02 : 0);
    return swatch(set[group], tone);
  }

  // Fixed transverse axes keep a crease on the same sleeve as the elbow flexes.
  function limb(k, torso, side, dx, dy, dz, region, style, base) {
    const { set, types, bias } = inks(k),
      length = Math.hypot(dx, dy, dz) || 1;
    const ax = dx / length,
      ay = dy / length,
      az = dz / length;
    let sx = torso[1],
      sy = torso[5],
      sz = torso[9];
    const along = sx * ax + sy * ay + sz * az;
    sx -= along * ax;
    sy -= along * ay;
    sz -= along * az;
    const width = Math.hypot(sx, sy, sz);
    if (width < 0.12) {
      const forward = torso[0] * ax + torso[4] * ay + torso[8] * az;
      sx = torso[0] - forward * ax;
      sy = torso[4] - forward * ay;
      sz = torso[8] - forward * az;
    }
    const inv = 1 / (Math.hypot(sx, sy, sz) || 1);
    sx *= inv;
    sy *= inv;
    sz *= inv;
    const fx = ay * sz - az * sy,
      fy = az * sx - ax * sz,
      fz = ax * sy - ay * sx;
    const sleeve = region === 'upperArm' || region === 'forearm',
      fore = region === 'forearm';
    const lower = region === 'shin' || fore;
    const rolled = fore && style === 'oxford';
    const joint = sleeve ? 0.78 : 0.85;
    const softness = base === 'baby' ? 0.62 : base === 'toddler' ? 0.8 : 1;
    const loft = sleeve
      ? knitwear.has(style)
        ? 0.17
        : 0.1
      : ['wide-leg', 'cargo', 'cuffed-denim'].includes(style)
        ? 0.17
        : 0.085;
    return {
      radius(material, t, x, y, z) {
        const across = (x * sx + y * sy + z * sz) * side;
        const deltoid =
          sleeve && !fore && t === 0
            ? smooth(-(x * ax + y * ay + z * az), 0.15, 0.88) * (0.14 + 0.11 * Math.max(0, across)) * softness
            : 0;
        if (types[material] === 'flesh') {
          const taper = fore ? 0.89 + 0.11 * (1 - smooth(t, 0.24, 0.91)) : 1;
          return taper + 0.056 * (1 - smooth(Math.abs(t - 0.32), 0.02, 0.3)) - deltoid;
        }
        const middle = 1 - (2 * t - 1) ** 2;
        const rollAt = rolled ? 0.56 : lower ? 0.83 : joint;
        const fold = t - rollAt + 0.11 * across;
        const ridge = 1 - smooth(Math.abs(fold), 0.028, 0.135);
        const gather = 1 - smooth(Math.abs(fold + 0.14), 0.015, 0.13);
        const cap = sleeve && !fore ? 1 - smooth(t, 0.04, 0.39) : 0;
        const thigh = region === 'thigh' ? 0.07 * (1 - smooth(t, 0.19, 0.85)) : 0;
        return (
          1 + loft * (0.8 * middle + softness * (0.83 * ridge - 0.5 * gather)) + 0.041 * cap + thigh - deltoid
        );
      },
      color(material, t, x, y, z, r) {
        const group = types[material];
        if (!group) return material;
        const lateral = (x * sx + y * sy + z * sz) / r,
          front = (x * fx + y * fy + z * fz) / r;
        const outward = lateral * side,
          cap = z / r;
        const lit = 1.15 * front - 1.44 * lateral + 0.58 * cap;
        const contact = (1 - smooth(outward, -0.83, -0.18)) * (sleeve ? 1.1 : 0.65);
        const shoulder = !fore && sleeve ? 1 - smooth(t, 0.02, 0.34) : 0;
        if (group === 'flesh') {
          const rim = 1 - smooth(front * 0.48 - lateral * 0.76, -0.75, -0.22);
          return swatch(set.flesh, 4.28 + lit - 1.49 * rim - 0.55 * contact + bias[material]);
        }
        const chart = sleeve ? charts.sleeve : charts.trouser;
        const height = lower ? 0.48 + 0.52 * t : 0.58 * t;
        const pigment = study(chart, 0.5 + 0.42 * outward, height);
        const crease = t - (rolled ? 0.49 : lower ? 0.77 : joint) + 0.15 * outward - 0.055 * front;
        const tuck = (1 - smooth(Math.abs(crease), 0.014, lower ? 0.11 : 0.17)) * (0.5 + 0.5 * Math.abs(lateral));
        const cuff =
          (rolled && t > 0.48 && t < 0.69) ||
          (lower && t > 0.73 && t < 0.94 && (style === 'cuffed-denim' || (fore && knitwear.has(style))));
        const rib = cuff ? (Math.floor(8 * lateral + front) % 3 === 0 ? -0.58 : 0.37) + 0.66 : 0;
        const armSeam = shoulder * (1 - smooth(Math.abs(outward - 0.49 - 0.38 * t + 0.12 * front), 0.03, 0.13));
        const edge = (1 - smooth(front - 0.55 * lateral, -1.13, -0.53)) * 0.86;
        return swatch(
          set[group],
          3.89 +
            lit +
            softness * (pigment * (sleeve ? 1.0 : 0.72) - (sleeve ? 1.77 : 1.47) * tuck) +
            bias[material] +
            rib +
            0.45 * shoulder -
            1.04 * armSeam -
            contact -
            edge
        );
      }
    };
  }

  const collared = new Set(['oxford', 'polo', 'rugby', 'denim-jacket', 'field-jacket']);
  const crew = new Set(['pullover', 'tee', 'argyle', 'breton', 'sailor-knit', 'knit-vest']);
  function neckline(brush, k, style, d, w, low, tall) {
    if (!collared.has(style) && !crew.has(style)) return;
    const shirt = collared.has(style),
      knit = knitwear.has(style),
      ramp = inks(k).set.cloth;
    const lowEdge = shirt ? 0.7 : 0.8;
    brush.stamp(-0.82 * d, 1.16 * d, -0.68 * w, 0.68 * w, low + lowEdge * tall, low + 1.055 * tall, (x, y, z) => {
      const u = x / d,
        v = y / w,
        h = (z - low) / tall,
        a = Math.abs(v);
      // A folded collar frames the neck even from the back. Two tapered leaves turn over at the front.
      const ring = (u / (u > 0 ? 0.98 : 0.74)) ** 2 + (v / 0.54) ** 2;
      const drop = Math.max(0, u);
      const band = 0.985 - (shirt ? 0.104 : 0.149) * drop * drop;
      const bias = shirt ? -0.9 : -0.2;
      if (ring < 1.16 && ring > (knit ? 0.57 : 0.67) && h > band - 0.025 && h < band + (shirt ? 0.061 : 0.027)) {
        const lip = (h - band) / (shirt ? 0.061 : 0.027);
        return swatch(ramp, 3.25 + 0.82 * u - 1.5 * v + bias + 1.12 * lip - (ring > 1.01 ? 1.35 : 0));
      }
      if (!shirt || u < 0.45 || a < 0.061 || a > 0.57) return 0;
      const boundary = 0.71 + (0.33 * Math.abs(a - 0.36)) / (a < 0.36 ? 0.3 : 0.22);
      if (h < boundary || h > 0.974 || u > 1.07 - 0.48 * a * a - 0.26 * (h - 0.8)) return 0;
      return swatch(ramp, h < boundary + 0.022 ? 1.7 : 5.25 - 1.6 * v + 1.2 * (h - 0.76));
    });
    if (style === 'oxford')
      for (const h of [0.24, 0.47, 0.68]) {
        brush.blob(
          d * (h < 0.3 ? 0.952 : 1.015),
          0,
          low + h * tall,
          0.086 * d,
          0.052 * w,
          0.021 * tall,
          (x, y, z) => (z > low + h * tall ? k.lining : k.trimShade)
        );
      }
  }
  function hand(brush, k, torso, side, wrist, grip, size, infant) {
    const length = Math.hypot(...grip.map((v, i) => v - wrist[i])) || 1;
    const axis = grip.map((v, i) => (v - wrist[i]) / length);
    // The thumb faces forward. Project that direction into the palm as the wrist swings.
    let forward = [torso[0], torso[4], torso[8]];
    const project = (v) => v.reduce((sum, n, i) => sum + n * axis[i], 0);
    let dot = project(forward);
    if (Math.abs(dot) > 0.92) {
      forward = [torso[2], torso[6], torso[10]];
      dot = project(forward);
    }
    forward = forward.map((n, i) => n - dot * axis[i]);
    const scale = Math.hypot(...forward);
    forward = forward.map((n) => n / scale);
    const across = [
      forward[1] * axis[2] - forward[2] * axis[1],
      forward[2] * axis[0] - forward[0] * axis[2],
      forward[0] * axis[1] - forward[1] * axis[0]
    ].map((n) => n * side);
    const ramp = inks(k).set.flesh,
      pad = 1.68 * size;
    brush.stamp(...grip.flatMap((n) => [n - pad, n + pad]), (x, y, z) => {
      const dx = (x - grip[0]) / size,
        dy = (y - grip[1]) / size,
        dz = (z - grip[2]) / size;
      const h = dx * axis[0] + dy * axis[1] + dz * axis[2];
      const u = dx * forward[0] + dy * forward[1] + dz * forward[2];
      const v = dx * across[0] + dy * across[1] + dz * across[2];
      const thumb = ((u - 0.7 + h * 0.24) / 0.44) ** 2 + ((v + 0.28) / 0.44) ** 2 + ((h - 0.01) / 0.74) ** 2;
      const tips = infant ? 0 : 0.075 * (1 + Math.cos((u + 0.16) * 10.8)) * smooth(h, 0.48, 0.96);
      const edge = 1.1 - 0.16 * Math.abs(u - 0.11) + tips;
      const curl = 0.18 * smooth(h, 0.2, 1.15);
      const palm =
        (u / (infant ? 1.01 : 0.96)) ** 2 +
        ((v + curl) / (infant ? 0.77 : 0.63)) ** 2 +
        ((h - 0.05) / (h < 0 ? 1.1 : edge)) ** 4;
      if (thumb > 1 && palm > 1) return 0;
      const seam = thumb <= 1 && u < 0.63 && h > -0.08 && v < 0.1;
      const tipShade = h > 0.48 && v < 0.04 && Math.cos((u + 0.16) * 10.8) < -0.79;
      return swatch(ramp, 4.2 + 0.91 * u + 1.14 * v - 0.68 * h - (seam || tipShade ? 1.55 : 0));
    });
  }
  function luggageBrush(brush, k) {
    const { set, types, bias } = inks(k);
    return {
      ...brush,
      blob(cx, cy, cz, rx, ry, rz, pigment, power) {
        brush.blob(
          cx,
          cy,
          cz,
          rx,
          ry,
          rz,
          (x, y, z) => {
            const value = typeof pigment === 'function' ? pigment(x, y, z) : pigment;
            if (types[value] !== 'leather') return value;
            const u = (x - cx) / rx,
              v = (y - cy) / ry,
              h = (z - cz) / rz;
            const seam = u < -0.36 && Math.abs(Math.max(Math.abs(v), Math.abs(h)) - 0.785) < 0.062;
            const glint = u < -0.42 && h > 0.42 && v < 0.36;
            return swatch(
              set.leather,
              3.8 - 0.69 * u - 0.95 * v + 1.27 * h + bias[value] + (glint ? 0.71 : 0) - (seam ? 1.8 : 0)
            );
          },
          power
        );
      }
    };
  }
  function shoeBrush(brush, k, foot, length, width, ankle, direction, side, style) {
    const { set, types, bias } = inks(k);
    const floor = foot[2] - ankle;
    const laced = ['sneakers', 'runners', 'trail-boots', 'strap-sneakers', 'high-tops', 'oxfords'].includes(style);
    const angle = side * direction * 0.17,
      ca = Math.cos(angle),
      sa = Math.sin(angle);
    // Turn the last out around the planted ankle. The toe, heel and straps share one frame.
    const turn = ([x, y, z]) => [
      foot[0] + (x - foot[0]) * ca - (y - foot[1]) * sa,
      foot[1] + (x - foot[0]) * sa + (y - foot[1]) * ca,
      z
    ];
    return {
      ...brush,
      link(a, b, r0, r1, w, pigment) {
        brush.link(turn(a), turn(b), r0, r1, w, (t, x, y, z) =>
          pigment(t, ca * x + sa * y * w, ca * y - (sa * x) / w, z)
        );
      },
      blob(cx, cy, cz, rx, ry, rz, pigment, power = 2) {
        const [cx2, cy2] = turn([cx, cy, cz]),
          wideX = rx * ca + ry * Math.abs(sa),
          wideY = ry * ca + rx * Math.abs(sa);
        const main = rx > 0.68 * length && ry > 0.6 * width && rz > 0.3 * ankle;
        brush.stamp(cx2 - wideX, cx2 + wideX, cy2 - wideY, cy2 + wideY, cz - rz, cz + rz, (wx, wy, z) => {
          const x = cx + (wx - cx2) * ca + (wy - cy2) * sa,
            y = cy - (wx - cx2) * sa + (wy - cy2) * ca;
          if (
            Math.abs((x - cx) / rx) ** power +
              Math.abs((y - cy) / ry) ** power +
              Math.abs((z - cz) / rz) ** power >
            1
          )
            return 0;
          if (!main) return typeof pigment === 'function' ? pigment(x, y, z) : pigment;
          const f = ((x - cx) * direction) / rx,
            a = (y - cy) / ry,
            h = (z - floor) / (2 * rz);
          const roof = 1.06 - 0.33 * smooth(f, 0.08, 0.95);
          const arch = f < -0.55 ? 0 : (1 - smooth(Math.abs(f + 0.34), 0.06, 0.36)) * Math.max(0, -a * side);
          if (h < 0.11 * arch) return 0;
          if (h > roof || Math.abs(a) > 1 - 0.19 * smooth(f, 0.36, 1)) return 0;
          const value = typeof pigment === 'function' ? pigment(x, y, z) : pigment;
          if (!value) return 0;
          if (value === k.outsole) return h < 0.106 ? set.hide[0] : k.outsole;
          const group = types[value];
          if (value === k.rubber && f > 0.38 && h > 0.29 && laced)
            return h < 0.42 || f > 0.75 ? k.rubber : set.hide[5];
          if (!group) return value;
          if (group === 'flesh') return swatch(set.flesh, 4.7 - 0.85 * a);
          if (laced && f > -0.3 && f < 0.4 && Math.abs(a) < 0.47 && h > 0.68) {
            const thread = (f + 0.28) * 4.1 + 0.5 * Math.abs(a);
            if (Math.abs(thread - Math.round(thread)) < 0.14) return k.rubber;
          }
          const seam = Math.abs(h - 0.36 - 0.15 * Math.max(f, 0)) < 0.052 && Math.abs(a) > 0.63;
          const toeGlint = ((f - 0.57) / 0.32) ** 2 + ((a + 0.39) / 0.46) ** 2 < 1 && h > 0.51;
          return swatch(
            set[group],
            3.6 + 1.15 * h - 1.28 * a + bias[value] + (toeGlint ? 1.4 : 0) - (seam ? 1.5 : 0)
          );
        });
      }
    };
  }
  return {
    palette,
    lighting: { painted, metal: fasteners },
    hem,
    drape,
    hair,
    waist,
    torso,
    limb,
    neckline,
    hand,
    shoeBrush,
    luggageBrush
  };
})();
