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
    'rugby', 'quilt-jacket', 'deck-jumper'
  ]);
  const newCuts = silhouette => Object.keys(pinePatternWardrobe.tops).filter(id=>pinePatternWardrobe.tops[id][2]===silhouette);
  for (const style of newCuts('knit')) knitwear.add(style);
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
  const longCoats = new Set(['trench', 'cross-robe', 'brocade', 'lab-coat', 'apron', 'mantle', 'kimono', 'tunic', 'moth-cape', 'kiln-smock']);
  const highWaists = new Set(['oxford', 'polo', 'blazer', 'knit-vest']);
  for (const style of newCuts('long')) longCoats.add(style);
  function hem(style, base, proportionStudy = false) {
    if (longCoats.has(style)) return 0;
    const lift = tucked.has(style) ? 0.24 : knitwear.has(style) ? 0.17 : 0.115;
    const highWaist = proportionStudy && base === 'adult' && highWaists.has(style);
    return lift * { adult: 1, child: 0.87, toddler: 0.58, baby: 0.43 }[base] + (highWaist ? .07 : 0);
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
  function brushedHair(k, plane, u, v, h, brush) {
    // Follow the painted lock. A broken ribbon of light crosses neighbouring
    // locks at the crown and narrows on the side facing away from the light.
    const crest = (brush === 'line' ? .72 : .55) + .25*v - .16*u - .18*v*v;
    const spread = brush === 'wash' ? .29 : brush === 'cel' ? .16 : .095;
    const crown = Math.abs(h-crest) < spread * (1-.22*v) && u-.51*v > -.46;
    const lit = .45*u - .73*v + .34*h;
    const mass = brush === 'wash' ? .80*plane+.60 : plane < 1.9 ? .7 : plane < 3.5 ? 2.45 : plane < 5.1 ? 4.1 : 5.3;
    const glint = crown && plane > 2.7 ? (brush === 'wash' ? .83 : brush === 'line' ? 2.3 : 1.7) : 0;
    return swatch(inks(k).set.strand, mass + lit + glint);
  }
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

  // Front widths and side depths at the hem, waist, rib cage, shoulder and neck.
  // Each row is a measured cross-section of the common body in joint space.
  // Tabulate the profiles once; sampling a pose should not interpolate a spline per voxel.
  function cutRings(rows) {
    let j = 0;
    return Array.from({ length: 97 }, (_, i) => {
      const t = i / 96;
      while (j < rows.length - 2 && t > rows[j + 1][0]) j++;
      const a = rows[j], b = rows[j + 1], u = smooth(t, a[0], b[0]);
      return a.slice(1).map((n, column) => mix(n, b[column + 1], u));
    });
  }
  const shirtCut = cutRings([[0, .93, .94], [.23, .97, .95], [.42, .95, .92],
    [.67, 1.025, 1.04], [.85, 1.025, 1.0], [.95, .89, .92], [1, .65, .77]]);
  const knitCut = cutRings([[0, .93, .94], [.17, 1.045, 1.05], [.42, 1.04, .99],
    [.70, 1.04, 1.04], [.85, 1.03, 1.0], [.95, .94, .92], [1, .69, .83]]);
  const coatCut = cutRings([[0, 1.07, 1.04], [.26, 1.01, 1.0], [.48, .97, .99],
    [.70, 1.02, 1.04], [.87, 1.035, 1.0], [.95, .94, .94], [1, .68, .81]]);
  const nurseryCut = cutRings([[0, 1.025, 1.02], [.22, 1.055, 1.12], [.46, 1.04, 1.105],
    [.70, .995, 1.04], [.85, .985, .99], [.96, .84, .87], [1, .71, .79]]);
  const workCoats = new Set(['chef-coat', 'uniform', 'flightsuit', 'mechanic', 'field-jacket', 'denim-jacket',
    'jacket', 'trail-shell', 'rain-anorak', 'hi-vis', 'blazer', 'thermal-shell', 'utility-gilet', 'frog-coat', ...longCoats]);
  // The front drawing sets width. The profile sets separate depths behind and
  // in front of the body axis. Heights run from the pelvis to the neck.
  const panelDrawings = Object.fromEntries(Object.entries({
    adult: [[0,.98,.91,1.01,-.04],[.21,1.00,.96,1.02,-.02],[.42,.89,.88,.87,.015],
      [.64,1.01,1.085,.99,.01],[.78,1.055,1.06,1.055,-.035],[.86,1.015,.94,1.00,-.046],
      [.93,.79,.72,.78,-.024],[.975,.53,.48,.55,0],[1,.34,.37,.43,0]],
    child: [[0,.97,.95,1.00,-.025],[.19,.99,1.015,1.00,.015],[.40,.94,.96,.92,.03],
      [.61,1.00,1.04,.985,0],[.77,1.035,1.02,1.025,-.022],[.86,.976,.90,.96,-.035],
      [.93,.73,.67,.75,-.02],[.975,.50,.47,.52,0],[1,.335,.37,.42,0]],
    toddler: [[0,1.01,1.02,1.04,-.012],[.20,1.055,1.09,1.025,.03],[.40,1.03,1.08,.96,.05],
      [.60,1.015,1.04,.98,.018],[.75,1.015,1.00,1.015,-.012],[.85,.94,.88,.95,-.02],
      [.93,.70,.67,.73,-.014],[.975,.50,.49,.54,0],[1,.35,.39,.43,0]],
    baby: [[0,1.015,1.02,1.065,-.035],[.18,1.065,1.08,1.04,.018],[.37,1.08,1.13,.985,.052],
      [.57,1.035,1.06,.965,.025],[.73,.995,.975,.985,0],[.84,.915,.875,.945,-.018],
      [.92,.72,.69,.77,-.016],[.974,.52,.52,.57,0],[1,.375,.415,.455,0]]
  }).map(([base, rows]) => [base, cutRings(rows)]));
  // The pattern is measured over the finished body. Bodice rows start at the
  // cloth hem, sleeves at the shoulder and elbow. Cloth keeps its own shape
  // between joints; the wristband and the neck return to the wearer's size.
  const topPatterns = {
    tucked: {
      hem:.37,
      bodice:cutRings([[0,.87,.90],[.13,.99,1.025],[.28,1.03,1.04],[.55,1.015,1.025],[.80,.99,.99],[1,1,1]]),
      upperArm:cutRings([[0,.84,.93],[.26,1.03,1.035],[.64,.98,1.04],[1,1.02,1.01]]),
      forearm:cutRings([[0,1.02,1.01],[.25,1.055,1.065],[.58,.97,.99],[.85,.91,.94],[1,.86,.89]])
    },
    bloused: {
      hem:.085,
      bodice:cutRings([[0,.955,.95],[.075,.985,1.00],[.22,1.16,1.14],[.52,1.17,1.13],[.73,1.105,1.06],[.88,.975,1.00],[1,1,1]]),
      upperArm:cutRings([[0,.95,1.01],[.26,1.19,1.15],[.60,1.25,1.19],[1,1.18,1.13]]),
      forearm:cutRings([[0,1.18,1.13],[.28,1.26,1.20],[.58,1.32,1.22],[.76,1.29,1.19],[.90,.93,.95],[1,.87,.90]])
    },
    straight: {
      hem:.125,
      bodice:cutRings([[0,1.12,1.09],[.25,1.105,1.065],[.50,1.085,1.065],[.70,1.025,1.035],[.88,1.015,1.01],[1,1,1]]),
      upperArm:cutRings([[0,.93,.99],[.25,1.09,1.10],[.66,1.075,1.07],[1,1.055,1.065]]),
      forearm:cutRings([[0,1.055,1.065],[.32,1.07,1.08],[.72,1.11,1.08],[.89,1.14,1.09],[1,1.07,1.03]])
    }
  };
  // Thigh breadth follows the body; the shin and hem are measured from the
  // knee. A straight seam can therefore hang past a narrow ankle.
  const legPatterns = {
    tapered: {
      thigh:cutRings([[0,1.03,1.05],[.32,1.08,1.10],[.68,1.035,1.06],[1,1.02,1.04]]),
      shin:cutRings([[0,1.02,1.04],[.27,1.02,1.08],[.58,.89,.93],[.77,.86,.86],[.91,.68,.73],[1,.65,.69]])
    },
    straight: {
      thigh:cutRings([[0,1.02,1.05],[.30,1.055,1.08],[.70,1.075,1.065],[1,1.085,1.055]]),
      shin:cutRings([[0,1.085,1.055],[.30,1.08,1.09],[.64,1.045,1.025],[.84,1.09,1.055],[1,1.025,.99]])
    },
    wide: {
      thigh:cutRings([[0,1.035,1.055],[.30,1.10,1.105],[.69,1.155,1.105],[1,1.20,1.12]]),
      shin:cutRings([[0,1.20,1.12],[.31,1.23,1.175],[.64,1.30,1.20],[.85,1.39,1.24],[1,1.35,1.195]])
    }
  };
  const longPants = new Set(['trousers','joggers','pinstripe','wide-leg','cuffed-denim','cargo','bib-overalls','knee-pants','panel-culottes','banded-trousers']);
  for (const style of newCuts('coat')) workCoats.add(style);
  for (const [style,cut] of Object.entries(pinePatternWardrobe.bottoms)) if(!cut[4]) longPants.add(style);
  function patternFor(style, bottom, base, fit) {
    const top = topPatterns[fit.top || (highWaists.has(style) && style !== 'blazer' ? 'tucked' :
      knitwear.has(style) || style === 'snap-knit' ? 'bloused' : 'straight')];
    const leg = longPants.has(bottom) ? legPatterns[fit.legs ||
      (bottom === 'wide-leg' || bottom === 'bib-overalls' ? 'wide' :
        bottom === 'joggers' || bottom === 'knee-pants' ? 'tapered' : 'straight')] : null;
    const strength = {adult:1, child:.93, toddler:.68, baby:.46}[base];
    const hemline = longCoats.has(style) ? 0 : mix(hem(style,base,true),top.hem*({adult:1,child:.94,toddler:.72,baby:.54}[base]),strength);
    return {top, leg, strength, hemline};
  }
  function garmentCut(style, base, drawn = false, pattern = null) {
    const nursery = base === 'baby' || base === 'toddler';
    const knit = knitwear.has(style) || style === 'snap-knit';
    const coat = workCoats.has(style);
    return {
      rings: nursery ? nurseryCut : knit ? knitCut : coat ? coatCut : shirtCut,
      drawing: drawn ? panelDrawings[base] : null,
      knit, coat, nursery, pattern, fold: base === 'baby' ? .24 : base === 'toddler' ? .45 : base === 'child' ? .78 : 1
    };
  }
  function bodyPanels(garment, anatomy, shoulder, chest, hipDepth) {
    const at = h => anatomy.section(mix(anatomy.low, anatomy.high, h));
    const hip = at(.20), waist = at(.43), rib = at(.72);
    const ribWidth = mix(rib.width, shoulder, .38);
    const waistRatio = waist.width / mix(hip.width, rib.width, .43);
    return garment.drawing.map(([span, front, back, offset], i) => {
      const t = i / 96, chestWeight = smooth(t,.19,.79);
      const middle = 1 - smooth(Math.abs(t-.43), .02, .30);
      const hem = 1 - smooth(t,.05,.37);
      const loose = garment.knit ? .095 : garment.coat ? .075 : .016;
      let width = mix(hip.width,ribWidth,chestWeight) * span *
        (1 + (waistRatio - .87) * middle + loose * (.79*middle+.42*hem));
      let depth = mix(hipDepth, rib.front, chestWeight) * (1 + .53*loose*middle);
      if (garment.pattern) {
        const {top, strength, hemline} = garment.pattern;
        const h = clamp((t-hemline)/(1-hemline));
        const [w,d] = top.bodice[Math.round(h*96)];
        const seam = strength * smooth(t,hemline-.065,hemline+.022);
        width *= mix(1,w,seam);
        depth *= mix(1,d,seam);
      }
      const belly = 1 - smooth(Math.abs(t-.33),.03,.43);
      const blade = 1 - smooth(Math.abs(t-.65),.035,.34);
      return {width, front:depth*front, back:depth*back, axis:offset*chest,
        lapFront:.17*depth*belly, lapBack:.065*depth*blade,
        lapWidth:.06*width*belly, lapAxis:chest*(.095*belly-.045*blade)};
    });
  }
  // The open throat and pointed collar share the shirt surface in every direction.
  function shirt(k, u, v, h) {
    const a = Math.abs(v);
    if (u < -.35 && Math.abs(h - .79 + .06 * v * v) < .015) return k.topShade;
    if (u < .25) return k.top;
    if (a < .36 && h > .755 + .62 * a) return k.skin;
    const tip = a < .31 ? .85 - .39 * (a - .055) : .75 + 1.11 * (a - .31);
    if (a > .055 && a < .46 && h > tip && h < .85 + .33 * (a - .055))
      return h < tip + .028 ? k.topStitch : k.topLight;
    if (v > .28 && v < .62 && h > .45 && h < .65) {
      if (h > .62) return k.topLight;
      if (v > .59 || h < .47 + .055 * Math.abs(v - .45)) return k.topShade;
    }
    if (a < .048 && h < .79 && h > .04) {
      if (a < .032 && Math.abs((h - .075) * 5.3 - Math.round((h - .075) * 5.3)) < .065) return k.lining;
      return v > .011 ? k.topShade : k.topLight;
    }
    return k.top;
  }
  function skirtPanel(k, value, t, u, v, fold) {
    const {set,types,bias}=inks(k),group=types[value];
    if(!group) return value;
    const light=.80*u-1.22*v+.23*(1-t);
    const pleat=fold*(.12+.34*t);
    return swatch(set[group],3.65+light+.75*bias[value]-pleat-(t>.95?.62:0));
  }
  function cutTorso(k, value, garment, u, v, h) {
    const { set, types, bias } = inks(k), group = types[value];
    if (!group) return value;
    const flank = Math.abs(v);
    // One broad underarm shadow, a quieter front and a single drag fold above the hem.
    const key = .79 * u - 1.58 * v + .57 * h;
    if (group === 'flesh' || group === 'leather') return swatch(set[group], 3.7 + key + bias[value]);
    const pit = smooth(flank, .52, .94) * (1 - smooth(Math.abs(h - .64 + .08 * v), .04, .27));
    const direction = h - (.16 + .24 * (1 - flank) + .055 * v);
    const pull = (1 - smooth(Math.abs(direction), .012, .068)) * smooth(flank, .22, .8);
    const hem = 1 - smooth(h, .005, garment.knit ? .075 : .036);
    const level = 3.63 + key + bias[value] - 1.36 * pit -
      garment.fold * (garment.coat ? .71 : 1.28) * pull - .76 * hem;
    if (!garment.drawing || group !== 'cloth') return swatch(set[group], level);
    if (garment.pattern) {
      const {top, strength} = garment.pattern;
      const front = smooth(u,-.2,.65);
      const chestLight = front * (1-smooth(Math.abs(v+.27),.25,.52)) *
        smooth(h,.24,.47) * (1-smooth(h,.72+.08*v,.90+.08*v));
      const sideTurn = smooth(flank,.51,.92) * (1-smooth(h,.73,.94));
      let seam;
      if (top === topPatterns.bloused) {
        const band = .095 + .045*v*v - .015*v;
        const lip = 1-smooth(Math.abs(h-band),.015,.047);
        const fullness = smooth(h,band,band+.10) * (1-smooth(h,.27,.42));
        seam = .74*fullness*front - 1.26*lip - .68*(1-smooth(h,0,band));
      } else if (top === topPatterns.tucked) {
        const pleat = .12 + .39*(flank-.32);
        seam = -1.42*front*smooth(flank,.26,.56)*(1-smooth(Math.abs(h-pleat),.016,.075));
      } else {
        const facing = 1-smooth(Math.abs(h-.055-.02*v*v),.012,.043);
        seam = -.98*facing - .48*sideTurn;
      }
      return swatch(set.cloth,3.85+key+bias[value]-1.12*pit-.43*sideTurn +
        strength*(1.08*chestLight + seam));
    }
    // Paint the turn below the shoulder, the lit chest panel and one drag fold
    // over the waistband. Their boundaries run across the fabric as it turns.
    const forward = smooth(u,-.05,.64);
    const shoulder = smooth(h,.65+.10*v,.77+.10*v) * (1-smooth(h,.89,.99));
    const lightEdge = -.08 + .27*(h-.51);
    const chest = smooth(v,-.88,-.64) * (1-smooth(v,lightEdge,lightEdge+.21)) *
      smooth(h,.30-.13*v,.41-.13*v) * (1-smooth(h,.73+.05*v,.85+.05*v));
    const drapeLine = .34+.21*v+.12*v*v;
    const drape = (1-smooth(Math.abs(h-drapeLine),.019,.092)) * smooth(v,-.23,.23);
    const scale = garment.nursery ? .66 : garment.knit ? .88 : 1;
    return swatch(set[group],level+scale*(.80*shoulder*(.8-.33*v)+forward*(1.05*chest-1.16*drape)));
  }

  // Each section gives lateral width, front-to-back depth, shift to the front and shift to the outside.
  // These profiles follow a limb as it bends. The joint ends receive separate cap lengths.
  const cuts = {
    upperArm: cutRings([[0, .82, .86, -.055, -.12], [.21, .91, .95, -.055, -.07],
      [.41, .97, 1.02, .035, .015], [.71, .92, .945, .025, .02], [1, .86, .91, -.055, 0]]),
    forearm: cutRings([[0, .86, .91, -.055, 0], [.22, .97, 1.015, .05, .015],
      [.58, .9, .96, .045, 0], [.84, .83, .87, 0, 0], [1, .81, .86, 0, 0]]),
    thigh: cutRings([[0, .96, 1.04, -.025, -.04], [.24, 1.05, 1.10, .07, .035],
      [.56, 1.015, .99, .055, .02], [.84, .915, .94, .03, 0], [1, .89, .95, .025, 0]]),
    shin: cutRings([[0, .89, .95, .025, 0], [.25, 1.005, 1.02, -.07, .015],
      [.43, 1.035, 1.04, -.12, .04], [.72, .94, .90, -.07, .015], [1, .86, .88, 0, 0]])
  };
  const widePants = new Set(['wide-leg', 'cuffed-denim', 'cargo', 'bib-overalls', 'panel-culottes']);
  // Cloth spans a bent joint. Sleeve and trouser ends share a width at the
  // elbow and knee instead of tracing two separate muscle bellies.
  const clothSections = {
    upperArm: cutRings([[0,.89,.93,-.035,-.10],[.20,1.015,1.05,-.018,-.04],
      [.48,.975,1.005,.025,0],[.75,.955,.98,.01,.015],[1,.96,.98,-.025,0]]),
    forearm: cutRings([[0,.96,.98,-.025,0],[.25,.99,1.01,.012,.01],
      [.60,.95,.965,.028,.01],[.84,.92,.93,0,0],[1,.88,.90,0,0]]),
    thigh: cutRings([[0,1.00,1.055,-.04,-.035],[.22,1.045,1.08,.045,.018],
      [.52,1.02,1.02,.045,.018],[.81,.98,1.00,.03,0],[1,.965,.995,.015,0]]),
    shin: cutRings([[0,.965,.995,.015,0],[.28,1.005,1.055,-.055,.012],
      [.53,1.01,1.035,-.07,.018],[.78,.985,.97,-.04,.01],[1,.955,.94,0,0]])
  };
  // Pigments are taken after the face has been dyed. Warm half-tones wrap
  // around a limb, with the same daylight and deep shadow as its owner's cheek.
  function skinPalette(materials) {
    const tones = [12, 14, 15, 16, 17, 6, 8, 10];
    for (const [i, tone] of tones.entries()) {
      if (materials['skinPlane' + tone]) materials['fleshInk' + i] = materials['skinPlane' + tone];
    }
  }
  const skinStrokes = {
    // Each mark is a tapered band on a moving section. Height, tilt and width
    // place the elbow turn, wrist, knee and ankle in local coordinates.
    upperArm: [.86, .16, .15], forearm: [.1, -.21, .16],
    thigh: [.89, -.12, .17], shin: [.15, .20, .18]
  };
  function limbSkin(ramp, region, t, outer, front, key, contact, bend, age) {
    const [height, tilt, spread] = skinStrokes[region];
    const turn = 1 - smooth(Math.abs(t - height - tilt * outer), .03, spread);
    const elbow = region === 'upperArm' || region === 'forearm';
    const facesMark = elbow ? smooth(-front, -.42, .49) : smooth(front, -.26, .58);
    const youth = age === 'baby' ? .48 : age === 'toddler' ? .64 : age === 'child' ? .82 : 1;
    // An open knee catches light above its small shadow. The inside of a bent
    // arm is quiet at rest and develops a short warm fold as it closes.
    const joint = elbow ? -turn * (.62 + .76 * bend) : turn * (.63 - 1.55 * smooth(t, height - .03, height + .12));
    const taper = region === 'shin' || region === 'forearm' ? smooth(t, .62, .96) : 0;
    const underside = 1 - smooth(key, -.95, -.24);
    return swatch(ramp, 3.72 + 2.05 * key - 1.05 * contact - .75 * underside +
      youth * (facesMark * joint - .69 * taper * smooth(outer, -.35, .46)));
  }
  function cutLink(brush, torso, paint, a, b, r0, r1, width, pigment) {
    const { k, region, side, style, garment, bend, seated = 0 } = paint;
    const { types, set, bias } = inks(k);
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const length = Math.hypot(dx, dy, dz);
    if (length < .0001) return brush.blob(...a, r0, r0 * width, r0, pigment(0, 0, 0, 0));
    const ax = dx / length, ay = dy / length, az = dz / length;
    let lx = torso[1], ly = torso[5], lz = torso[9];
    let dot = lx * ax + ly * ay + lz * az;
    if (Math.abs(dot) > .98) {
      lx = torso[2]; ly = torso[6]; lz = torso[10];
      dot = lx * ax + ly * ay + lz * az;
    }
    lx -= dot * ax; ly -= dot * ay; lz -= dot * az;
    const inv = 1 / Math.hypot(lx, ly, lz);
    lx *= inv; ly *= inv; lz *= inv;
    const fx = ay * lz - az * ly, fy = az * lx - ax * lz, fz = ax * ly - ay * lx;
    const sleeve = region === 'upperArm' || region === 'forearm';
    const upper = region === 'upperArm' || region === 'thigh';
    const section = cuts[region], fabric = garment.drawing && clothSections[region], wide = !sleeve && widePants.has(style);
    const gathered = style === 'joggers' || (sleeve && garment.knit);
    const straight = style === 'trousers' || style === 'pinstripe';
    const rolled = region === 'forearm' && style === 'oxford';
    const muscle = paint.anatomy?.muscleSection;
    const belly = muscle && section.map((_, i) => muscle(region, i / 96, bend));
    // A short sleeve ends at the upper arm's breadth, shorts at the thigh's.
    // The cuff can stand clear of skin even as the elbow or knee swings.
    const end = paint.end;
    const coverage = (paint.paintedBody || fabric) && end && end !== b
      ? clamp(length / Math.hypot(end[0] - a[0], end[1] - a[1], end[2] - a[2])) : 1;
    const shortHem = coverage < 1;
    const pattern = garment.pattern;
    const fitted = pattern && (sleeve ? pattern.top : pattern.leg)?.[region];
    // Sewn leg openings are independent of the item's original ankle taper.
    // Only those two leg segments need a conversion to local radius.
    const legScale = fitted && !sleeve && fitted.map((_, index) => {
      const t = index/96;
      return (upper ? mix(paint.thighRadius,paint.kneeRadius,t) : paint.kneeRadius) / mix(r0,r1,t);
    });
    const fullPattern = fitted && pattern.strength === 1;
    const limit = Math.max(r0, r1, fitted && !sleeve ? paint.kneeRadius : 0);
    const pad = limit * Math.max(width, 1) * (fitted || belly ? 1.58 : 1.43);
    brush.stamp(Math.min(a[0], b[0]) - pad, Math.max(a[0], b[0]) + pad,
      Math.min(a[1], b[1]) - pad, Math.max(a[1], b[1]) + pad,
      Math.min(a[2], b[2]) - pad, Math.max(a[2], b[2]) + pad, (x, y, z) => {
        const px = x - a[0], py = y - a[1], pz = z - a[2];
        const along = px * ax + py * ay + pz * az, t = clamp(along / length);
        const cx = px - t * dx, cy = py - t * dy, cz = pz - t * dz;
        const onLimb = shortHem ? t * coverage : t;
        const index = Math.round(onLimb * 96);
        const coreRadius = mix(r0, r1, onLimb);
        const muscleRadius = coreRadius * (belly ? belly[index] : 1);
        const bound = fabric ? Math.max(muscleRadius,coreRadius) : muscleRadius;
        const envelope = fitted ? Math.max(bound, !sleeve ? paint.kneeRadius : 0) : bound;
        if (cx * cx + cy * cy + cz * cz > (fitted ? 2.84 : fabric ? 2.45 : 2.1) * envelope * envelope) return 0;
        const material = pigment(t, cx, cy / width, cz);
        if (!material) return 0;
        const skin = types[material] === 'flesh';
        const dressed = fabric && !skin;
        const row = dressed ? fabric[index] : section[index];
        const r = dressed ? coreRadius : muscleRadius;
        const lateral = (cx * lx + cy * ly + cz * lz) / r;
        const towards = (cx * fx + cy * fy + cz * fz) / r;
        const outer = side * lateral;
        // Flatten the sleeve over the outer shoulder and turn its crown towards the collar.
        // A shirt cuff and a trouser hem have a shallow end, unlike a bare joint.
        const nearCap = sleeve && upper ? (dressed ? clamp(.86-.38*outer,.39,1.16) : clamp(.65 - .48 * outer, .2, 1.12)) : .73;
        const farCap = shortHem ? .10 : skin ? .64 : upper ? .38 : straight || wide ? .43 : .18;
        const cap = along < 0 ? along / (r * nearCap) : along > length ? (along - length) / (r * farCap) : 0;
        if (Math.abs(cap) > 1) return 0;
        const band = 1 - smooth(Math.abs(t - (rolled ? .26 : .87)), .048, .13);
        const hemBreak = !upper && !sleeve && !garment.nursery && !skin
          ? 1 - smooth(Math.abs(t - .77 + .12 * outer), .035, .16) : 0;
        const lap = dressed && region === 'thigh' ? seated*(1-smooth(Math.abs(t-.41),.12,.55)) : 0;
        let span = row[0], depth = row[1];
        if (!fullPattern || !dressed) {
          const loft = skin ? 0 : sleeve ? (garment.knit ? .11 : garment.coat ? .06 : .035) :
            wide ? .18 : gathered || straight ? .12 : .045;
          const hem = !upper && !skin
            ? (rolled ? .245 : gathered ? -.045 : wide ? .09 : 0) * band +
              (straight ? .29 * t * t : 0) + .115 * hemBreak : 0;
          const ease = loft * (upper ? smooth(t, .07, .52) : 1 - .3 * t);
          const fall = dressed && !sleeve ? (wide ? .10 : straight ? .13 : gathered ? -.035 : .025) * (upper ? .55*t : 1-.28*t) : 0;
          const excess = ease + (dressed && !sleeve ? .38*hem : hem) + fall;
          const gatheredCotton = dressed && garment.nursery && sleeve
            ? (upper ? -.06*(1-t) : .072*(1-smooth(t,.42,.85)) - .066*smooth(t,.78,1)) : 0;
          span = dressed ? row[0]+excess+gatheredCotton+.15*lap : row[0]+ease+hem;
          depth = dressed ? row[1]+excess+gatheredCotton-.055*lap : row[1]+ease+hem;
        }
        if (dressed && fitted) {
          const [w,d] = fitted[index], scale = legScale ? legScale[index] : 1, turn = rolled ? .17*band : 0;
          const cutWidth = w*scale + turn + .15*lap, cutDepth = d*scale + turn - .055*lap;
          span = fullPattern ? cutWidth : mix(span,cutWidth,pattern.strength);
          depth = fullPattern ? cutDepth : mix(depth,cutDepth,pattern.strength);
        }
        const across = (lateral - side * row[3]) / (width * span);
        const front = (towards - row[2]) / depth;
        if (across * across + front * front + cap * cap > 1) return 0;
        const group = types[material];
        if (!group) return material;
        // Fixed light in body space, expressed on the actual section normal.
        const nx = across * lx + front * fx + cap * ax;
        const ny = across * ly + front * fy + cap * ay;
        const nz = across * lz + front * fz + cap * az;
        const key = .77 * (nx * torso[0] + ny * torso[4] + nz * torso[8]) -
          1.13 * (nx * torso[1] + ny * torso[5] + nz * torso[9]) +
          .94 * (nx * torso[2] + ny * torso[6] + nz * torso[10]);
        const occlusion = (1 - smooth(outer, -.86, -.14)) * (sleeve ? 1.12 : .72);
        if (shortHem && t > .91) {
          const cloth = sleeve ? set.cloth : set.trouser;
          return swatch(cloth, 2.6 + key - .7 * occlusion - .8 * smooth(t, .96, 1));
        }
        if (skin) {
          if (paint.paintedBody) return limbSkin(set.flesh, region, t, outer, front, key, occlusion, bend, paint.base);
          return swatch(set.flesh, 4.15 + key - occlusion * .7 + .42 * bias[material]);
        }
        // Creases start at the compressed elbow or knee. The long lit plane stays uninterrupted.
        const crease = upper ? t - (.9 - .19 * outer + .04 * front) : t - (.13 - .16 * outer);
        const jointFold = (1 - smooth(Math.abs(crease), .025, .15)) * smooth(outer, -.88, .22);
        const pressing = !sleeve && !upper ? smooth(outer, -.67, .36) * hemBreak : 0;
        const rim = smooth(Math.abs(across), .78, .99) * (key < 0 ? .88 : .48);
        // Where a soft trouser leg folds up against the bodice, a curved
        // contact shadow separates the thigh even in a one-colour playsuit.
        const lapFold = seated ? seated * smooth(nz, .46, .84) * smooth(outer, -.43, .48) *
          (1 - smooth(t, .62, .96)) : 0;
        const cuff = !upper && !skin && (rolled || gathered || style === 'cuffed-denim');
        const edge = cuff ? 1 - smooth(Math.abs(t - (rolled ? .35 : .91) + .025 * outer), .014, .045) : 0;
        const creaseWeight = dressed ? (fitted ? .24+1.54*bend : .48+1.91*bend) : 1.25+1.35*bend;
        const outerPlane = dressed ? smooth(front,.20,.76) *
          (1-smooth(Math.abs(across+.17-.14*t),.19,.57)) * (.82-.24*bend) : 0;
        return swatch(set[group], 3.9 + key - occlusion + .78 * bias[material] -
          garment.fold * (creaseWeight * jointFold + (fitted ? .85 : 1.58) * pressing) - rim -
          1.88 * lapFold + (cuff ? .46 * band - 1.37 * edge : 0) + outerPlane);
      });
  }

  const collared = new Set(['oxford', 'polo', 'rugby', 'denim-jacket', 'field-jacket']);
  const crew = new Set(['pullover', 'tee', 'argyle', 'breton', 'sailor-knit', 'knit-vest']);
  function panelDetail(k, style, u, v, h) {
    if (style === 'tee' && u > .53 && v > .18 && v < .61) {
      const bottom = .446 + .045*Math.abs(v-.39)/.22;
      if (h > bottom && h < .64) {
        if (h > .604) return k.topLight;
        if (v > .555 || v < .22 || h < bottom+.023) return k.topShade;
        return k.top;
      }
    }
    if (style === 'oxford' || (!crew.has(style) && !collared.has(style))) return 0;
    const drop = Math.max(0,u), band = .959 - .106*drop*drop;
    if (h > band-.025 && h < band+.021)
      return h < band-.008 ? k.topShade : k.topLight;
    if (collared.has(style) && u > .38) {
      const a = Math.abs(v), tip = .80 + Math.abs(a-.33)*.42;
      if (a > .08 && a < .59 && h > tip && h < band)
        return h < tip+.025 ? k.topShade : k.topLight;
    }
    return 0;
  }
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
  function hand(brush, k, torso, side, wrist, grip, size, infant, tailored = false, paintedBody = false, thumb) {
    const length = Math.hypot(...grip.map((v, i) => v - wrist[i])) || 1;
    const axis = grip.map((v, i) => (v - wrist[i]) / length);
    // The rig supplies a continuous thumb direction. Older authored poses use the torso axes.
    let forward = thumb || [torso[0], torso[4], torso[8]];
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
    // Rest the palm obliquely against the thigh so the thumb reads in front view.
    if (tailored) {
      const angle = infant ? .16 : .36;
      const c = Math.cos(angle), s = Math.sin(angle);
      const plane = forward;
      forward = plane.map((n, i) => n * c + across[i] * s);
      for (let i = 0; i < 3; i++) across[i] = across[i] * c - plane[i] * s;
    }
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
      if (paintedBody) {
        // The back of the hand is one lit cluster. One shadow joins the
        // fingertips and the thumb web, which still reads on a four-pixel palm.
        const sideLight = -.94 * side * v + .7 * u;
        const knuckle = (1 - smooth(Math.abs(h - .18 + .17 * u), .09, .33)) * smooth(v, -.16, .27);
        const tip = smooth(h, .42, 1.05);
        return swatch(ramp, 3.85 + 1.84 * sideLight + .72 * knuckle - 1.22 * tip -
          (seam ? 1.5 : 0) - (tipShade && !infant ? .7 : 0));
      }
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
  // The heel and the buttocks support a floor sitter. Rotate the last about the
  // anatomical ankle. Leave links (boot shafts) on the lower leg so their cuffs
  // continue to meet the shin when the baby flexes a foot.
  function seatedFoot(brush, foot, forward, weight, pitch = .82) {
    const flex = studioRig.frame(foot, [0, 0, 0], 0, -pitch * forward * weight, 0);
    function rolled(method, args) {
      brush.frame(flex);
      method(...args);
      brush.frame(null);
    }
    return {
      ...brush,
      stamp(...args) { rolled(brush.stamp, args); },
      blob(...args) { rolled(brush.blob, args); }
    };
  }

  // A padded seat resting on the floor has a low, broad contact patch. Sample
  // in a horizontal frame even as the torso rolls with the baby's breathing.
  const seatSections = cutRings([[0, .56, .55, .08], [.09, .81, .80, .06],
    [.28, 1.0, 1.0, .035], [.49, 1.06, .99, .01],
    [.73, .94, .91, 0], [.90, .74, .71, 0], [1, .41, .46, 0]]);
  function infantLap(k, u, v, h, structured) {
    // Knit pants meet the belly in a soft fold, with the dye continuous over the hip.
    const shadow = (1 - smooth(h, .04, .49)) * .45;
    const hemShadow = structured ? 1.85 * smooth(h, .65, .94) * (.70 + .30 * u) : 0;
    return swatch(inks(k).set.trouser, 3.72 + .78 * u - 1.25 * v + .26 * h - shadow - hemShadow);
  }
  function infantSeat(brush, k, pose, rig, depth, width, hipHeight, load) {
    const hip = studioRig.point(pose.torso, rig.pelvis);
    const fx = pose.torso[0], fy = pose.torso[4], horizontal = Math.hypot(fx, fy) || 1;
    const co = fx / horizontal, si = fy / horizontal;
    const floor = Math.min(pose.feet[0][2], pose.feet[1][2]) - rig.ankle;
    const bottom = mix(hip[2] - .79 * hipHeight, floor, load);
    const top = hip[2] + .86 * hipHeight;
    if (top <= bottom) return;
    const center = .25 * depth * load, reach = 1.37 * Math.max(depth, width);
    const ramp = inks(k).set.trouser;
    brush.frame(null);
    brush.stamp(hip[0] - reach, hip[0] + reach, hip[1] - reach, hip[1] + reach, bottom, top,
      (x, y, z) => {
        const h = (z - bottom) / (top - bottom);
        const row = seatSections[clamp(Math.round(96*h), 0, 96)];
        const dx = x - hip[0], dy = y - hip[1];
        const front = (dx*co + dy*si - center - row[2]*depth) / (depth * row[0]);
        const side = (-dx*si + dy*co) / (width * row[1]);
        if (front*front + side*side > 1) return 0;
        const contact = (1 - smooth(h, .04, .28)) * 1.15;
        return swatch(ramp, 3.85 + .72 * front - 1.19 * side + .65 * h - contact);
      });
  }
  function shoeBrush(brush, k, foot, length, width, ankle, direction, side, style, tailored = false,
    turnout = tailored ? .245 : .17) {
    const { set, types, bias } = inks(k);
    const floor = foot[2] - ankle;
    const laced = ['sneakers', 'runners', 'trail-boots', 'strap-sneakers', 'high-tops', 'oxfords'].includes(style);
    const angle = side * direction * turnout,
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
          const roof = tailored ? 1.04 - .46 * smooth(f, -.16, .93) : 1.06 - .33 * smooth(f, .08, .95);
          const arch = f < -0.55 ? 0 : (1 - smooth(Math.abs(f + 0.34), 0.06, 0.36)) * Math.max(0, -a * side);
          if (h < 0.11 * arch) return 0;
          if (h > roof || Math.abs(a) > 1 - 0.19 * smooth(f, 0.36, 1)) return 0;
          const value = typeof pigment === 'function' ? pigment(x, y, z) : pigment;
          if (!value) return 0;
          if (tailored && style === 'soft-booties') {
            // A knitted slipper turns in one soft plane across the toes.
            return swatch(set.hide, 4.1 + 0.72 * h - 1.30 * a - (h < 0.15 ? 1.1 : 0));
          }
          if (tailored && style === 'canvas-shoes' && value === k.rubber && f > 0.42 && h > 0.22) {
            // The rubber foxing curves up only at the tip, leaving the dyed vamp visible.
            const rim = 0.22 + 0.13 * smooth(f, 0.53, 0.99) + 0.055 * Math.abs(a);
            return h < rim ? k.rubber : swatch(set.hide, 3.85 + h - 1.20 * a);
          }
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
    skinPalette,
    bodyPanels,
    patternFor,
    longPants,
    panelDetail,
    garmentCut,
    cutLink,
    cutTorso, skirtPanel,
    shirt,
    lighting: { painted, metal: fasteners },
    hem,
    drape,
    hair,
    brushedHair,
    waist,
    torso,
    limb,
    neckline,
    hand,
    shoeBrush,
    infantSeat,
    infantLap,
    seatedFoot,
    luggageBrush
  };
})();
