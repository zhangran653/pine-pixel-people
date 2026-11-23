// Workshop clothing and personal equipment for the editable slice rig.
// Body coordinates use +X forward, +Y left, +Z up. Dyes are stored as RGB in a recipe.
const pineWorkshopWear = (() => {
  const clothes = {
    top: {
      'trail-shell': '拼肩徒步外套',
      'field-jacket': '多袋测绘夹克',
      'striped-cardigan': '条纹内搭长开衫',
      'rain-anorak': '撞色连帽风衣',
      'sailor-knit': '横纹棉衫',
      'snap-knit': '按扣棉开衫'
    },
    bottom: { 'cuffed-denim': '翻边牛仔裤', 'knee-pants': '补膝长裤', 'bib-overalls': '背带工装裤' },
    shoes: {
      'trail-boots': '系带徒步靴',
      'strap-sneakers': '双搭扣运动鞋',
      'canvas-shoes': '包头帆布鞋',
      'soft-booties': '针织软鞋'
    }
  };
  const wearables = {
    bag: { 'trail-pack': '双肩登山包', 'survey-satchel': '帆布测绘挎包', 'school-pack': '拉链书包' },
    attachment: { bedroll: '露营卷垫', 'map-tube': '斜挂图筒' },
    glasses: { round: '圆框眼镜', square: '方框眼镜', shades: '墨镜' },
    ears: { studs: '圆珠耳钉', hoops: '小圈耳环' },
    wrist: { watch: '指针腕表', 'sport-band': '运动手环' },
    bottle: { canteen: '搪瓷水壶', thermos: '旋盖保温杯' },
    phone: { rugged: '防摔手机壳', folio: '皮纹手机套' },
    laptop: { field: '野外加固外壳', stickers: '旅行贴纸外壳' }
  };
  const dyes = {
    hat: '帽色',
    bag: '包色',
    attachment: '外挂颜色',
    glasses: '镜框色',
    ears: '耳饰色',
    wrist: '腕带色',
    bottle: '水壶色',
    device: '设备外壳色'
  };
  const carriedSlots = Object.keys(wearables).filter((k) => k !== 'phone' && k !== 'laptop');
  const outfitDyes = Object.keys(dyes).filter((k) => k !== 'device');
  const defaults = {
    bag: '#aa803e',
    attachment: '#607b75',
    glasses: '#484651',
    ears: '#d5ac59',
    wrist: '#655245',
    bottle: '#477d9a',
    device: '#657f81'
  };
  function color(colors, key) {
    return colors[key] || (key === 'hat' ? colors.accent || '#e6b963' : defaults[key]);
  }
  const hats = [];
  function crown(id, label, strokes) {
    hats.push({
      id,
      label,
      slot: 'hat',
      primitives: strokes.map(([center, size, color, power = 2.6]) => ({
        shape: 'ellipsoid',
        center,
        size,
        color,
        power
      }))
    });
  }
  crown('trail-cap', '徒步者鸭舌帽', [
    [[-0.04, 0, 0.63], [1.01, 1.035, 0.52], 'hatMain'],
    [[-0.04, 0, 0.57], [1.035, 1.045, 0.105], 'hatShade', 3],
    [[0.86, 0, 0.52], [0.71, 0.89, 0.085], 'hatShade', 3],
    [[0.89, 0, 0.56], [0.65, 0.87, 0.06], 'hatMain', 3],
    [[-0.06, 0, 1.135], [0.105, 0.105, 0.067], 'hatTrim']
  ]);
  crown('survey-hat', '测绘员宽檐帽', [
    [[-0.04, 0, 0.55], [1.43, 1.39, 0.1], 'hatShade', 2.5],
    [[-0.05, 0, 0.59], [1.4, 1.36, 0.075], 'hatLight', 2.5],
    [[-0.07, 0, 0.78], [1.01, 1.055, 0.42], 'hatMain', 3],
    [[-0.05, 0, 0.72], [1.035, 1.065, 0.09], 'hatTrim', 3],
    [[-0.03, -0.97, 0.78], [0.42, 0.1, 0.048], 'hatInk', 3]
  ]);
  crown('cotton-cap', '反折棉帽', [
    [[-0.05, 0, 0.6], [1.04, 1.04, 0.58], 'hatMain', 2.4],
    [[-0.03, 0, 0.57], [1.07, 1.07, 0.16], 'hatLight', 2.8],
    [[-0.2, 0, 1.17], [0.16, 0.15, 0.13], 'hatTrim']
  ]);
  function outfit(label, top, bottom, shoes, palette, extras = {}, dyes = {}) {
    return {
      label,
      parts: { top, bottom, shoes, neck: 'none', hat: 'none', ...extras },
      colors: { top: palette[0], bottom: palette[1], shoes: palette[2], accent: palette[3], ...dyes }
    };
  }
  const outfits = {
    hiker: outfit(
      '红帽徒步者',
      'trail-shell',
      'knee-pants',
      'trail-boots',
      ['#38877f', '#3e526b', '#8c593e', '#f1d49d'],
      {
        neck: 'scarf',
        hat: 'pine-core/trail-cap',
        bag: 'trail-pack',
        attachment: 'bedroll',
        bottle: 'canteen'
      },
      { hat: '#cc5946', bag: '#d79b45', attachment: '#8d9a79', bottle: '#4a7e9e' }
    ),
    surveyor: outfit(
      '山野测绘员',
      'field-jacket',
      'cuffed-denim',
      'trail-boots',
      ['#c99545', '#414c5b', '#674a42', '#39868b'],
      {
        neck: 'scarf',
        hat: 'pine-core/survey-hat',
        bag: 'survey-satchel',
        attachment: 'map-tube',
        wrist: 'watch'
      },
      { hat: '#cbaa72', bag: '#61735f', attachment: '#bba278', wrist: '#664936' }
    ),
    mother: outfit(
      '妈妈的条纹开衫',
      'striped-cardigan',
      'cuffed-denim',
      'canvas-shoes',
      ['#cf796a', '#4b6176', '#b26858', '#eee4cc'],
      { ears: 'hoops' },
      { ears: '#d9ad5d' }
    ),
    child: outfit('学童的连帽风衣', 'rain-anorak', 'shorts', 'strap-sneakers', [
      '#438ab4',
      '#374d65',
      '#ac604a',
      '#f0c969'
    ]),
    toddler: outfit('幼儿的背带装', 'sailor-knit', 'bib-overalls', 'strap-sneakers', [
      '#eee4cc',
      '#e3ae4a',
      '#ac604a',
      '#4b8987'
    ]),
    baby: outfit(
      '宝宝的棉针织',
      'snap-knit',
      'knee-pants',
      'soft-booties',
      ['#8fb9a4', '#bdd2bb', '#d8caa3', '#f0e3c4'],
      { hat: 'pine-core/cotton-cap' },
      { hat: '#eadab7' }
    )
  };
  function needsRelease(parts, colors = {}) {
    return (
      Object.entries(clothes).some(([slot, options]) => Object.hasOwn(options, parts[slot])) ||
      Object.keys(wearables).some((key) => Object.hasOwn(parts, key)) ||
      Object.keys(dyes).some((key) => Object.hasOwn(colors, key)) ||
      hats.some((h) => parts.hat === 'pine-core/' + h.id)
    );
  }
  function materials(colors = {}, tint) {
    const ink = {};
    for (const key of Object.keys(dyes)) {
      const base = color(colors, key).slice(1);
      ink[key + 'Main'] = base;
      ink[key + 'Shade'] = tint(base, '263540', 0.46);
      ink[key + 'Light'] = tint(base, 'f5e5bf', 0.36);
    }
    ink.hatLight = tint(ink.hatMain, 'fff2d2', 0.36);
    ink.hatShade = tint(ink.hatMain, '474153', 0.38);
    ink.hatTrim = tint(ink.hatMain, '4c6472', 0.56);
    ink.hatInk = tint(ink.hatMain, '292a39', 0.69);
    return {
      ...ink,
      lining: 'eee2c6',
      brass: 'd2ab66',
      brassShade: '83623e',
      webbing: '60564a',
      darkWebbing: '413d39',
      lens: '384b60',
      lensGlint: '768994'
    };
  }
  // These marks are sampled on the fitted chest surface, including its shoulders and sides.
  function fabric(style, u, v, t, k) {
    const a = Math.abs(v),
      front = u > 0.35,
      outside = u < -0.54 || a > 0.89;
    if (style === 'sailor-knit') {
      if (t > 0.86 + 0.19 * a && front) return k.accent;
      return Math.floor(8 * t) % 2 ? k.top : k.accent;
    }
    if (style === 'striped-cardigan') {
      const opening = 0.21 + 0.29 * t;
      if (front && a < opening) {
        if (t > 0.88 + 0.14 * a) return k.skinLight;
        return Math.floor(t * 9) % 3 === 1 ? k.bottomShade : k.lining;
      }
      if (front && a < opening + 0.09) return k.topLight;
      if (front && a > 0.46 && a < 0.82 && t > 0.15 && t < 0.36)
        return t > 0.31 ? k.topLight : a > 0.76 || t < 0.19 ? k.topShade : k.top;
    } else if (style === 'snap-knit') {
      if (front && a < 0.12) return a > 0.073 ? k.topLight : k.lining;
      if (t > 0.85 + 0.12 * a && front) return k.lining;
      if (front && t > 0.26 && t < 0.4 && v > 0.36 && v < 0.68) return k.topLight;
    } else if (style === 'field-jacket') {
      if (t > 0.21 && t < 0.34) return front && a < 0.15 ? (a < 0.085 ? k.webbing : k.brass) : k.webbing;
      if (front && a > 0.18 && a < 0.72 && t > 0.49 && t < 0.75) {
        if (v > 0 && t > 0.68 && a < 0.57) return k.lining;
        if (t > 0.63) return t < 0.67 ? k.topStitch : k.topLight;
        if (a < 0.23 || a > 0.66 || t < 0.54) return k.topShade;
      }
      if (front && t < 0.2 && a > 0.32 && a < 0.83) return t > 0.14 ? k.topLight : k.topShade;
      if (front && a < 0.048) return k.topStitch;
      if (t > 0.77 && front && Math.abs(a - (t - 0.76) * 2.5) < 0.095) return k.topLight;
    } else if (style === 'rain-anorak' || style === 'trail-shell') {
      if (front && a < 0.063) return style === 'rain-anorak' ? k.accent : k.lining;
      if (front && a > 0.38 && a < 0.81 && Math.abs(t - (0.18 + 0.4 * (a - 0.36))) < 0.038)
        return k.topStitch;
      const seam = style === 'trail-shell' ? 0.76 - 0.1 * a : 0.73 + 0.13 * a;
      if (t > seam) return outside ? k.topShade : k.topLight;
      if (t > seam - 0.026) return k.topShade;
    }
    if (t < 0.065) return k.topShade;
    return outside ? k.topShade : k.top;
  }
  function bib(u, v, t, k) {
    const a = Math.abs(v);
    if (u < 0.34 && u > -0.34) return 0;
    const width = u > 0 ? 0.61 - 0.13 * t : 0.44;
    if (t > 0.66 || a > width) {
      const strap = u > 0 ? 0.46 + 0.13 * (t - 0.63) : 0.2 + 0.72 * (t - 0.63);
      return t >= 0.58 && Math.abs(a - strap) < 0.097 ? k.bottomLight : 0;
    }
    if (u > 0 && t > 0.51 && a > 0.36 && a < 0.52) return k.brass;
    if (u > 0 && a < 0.3 && t > 0.22 && t < 0.44) return t > 0.38 || a > 0.25 ? k.bottomLight : k.bottomShade;
    return t > 0.61 || a > width - 0.05 ? k.bottomLight : k.bottom;
  }
  function straps(bag, attachment, u, v, t, k) {
    if (u < 0.26) return 0;
    if (bag === 'hip-pack') return t > 0.17 && t < 0.25 ? k.bagShade : 0;
    if (bag === 'survey-satchel' || bag === 'messenger' || bag === 'camera' || (!bag && attachment)) {
      const d = Math.abs(v - (0.91 - 1.61 * t));
      if (d < 0.1) return d > 0.066 ? k.bagShade : k.bagMain;
    } else if (bag) {
      const a = Math.abs(v),
        d = Math.abs(a - (0.62 - 0.17 * Math.sin(Math.PI * t)));
      if (d < 0.094 && t > 0.09)
        return t > 0.37 && t < 0.43
          ? k.brass
          : bag === 'trail-pack'
            ? k.webbing
            : d > 0.061
              ? k.bagShade
              : k.bagMain;
    }
    return 0;
  }
  function torsoDetails(style, b, k, d, w, low, tall) {
    if (style === 'rain-anorak') {
      b.blob(
        -0.74 * d,
        0,
        low + 0.81 * tall,
        0.63 * d,
        0.82 * w,
        0.21 * tall,
        (x, y, z) =>
          z > low + 0.86 * tall && Math.abs(y) < 0.63 * w
            ? k.accent
            : z < low + 0.72 * tall
              ? k.topShade
              : k.top,
        2.6
      );
      for (const side of [-1, 1]) {
        b.link(
          [0.16 * d, side * 0.66 * w, low + 0.93 * tall],
          [0.92 * d, side * 0.27 * w, low + 0.79 * tall],
          0.105 * w,
          0.08 * w,
          0.9,
          () => k.accent
        );
      }
    }
    if (style === 'snap-knit') {
      for (const level of [0.22, 0.43, 0.64, 0.84])
        b.blob(0.96 * d, 0, low + level * tall, 0.16 * d, 0.072 * w, 0.027 * tall, k.brassShade);
    }
  }
  function sleeve(style, t, u, v, side, r, fore, k) {
    if (fore && t > 0.76) {
      if (style === 'snap-knit') return k.lining;
      if (style === 'rain-anorak') return t > 0.9 ? k.accent : k.topStitch;
      return t > 0.91 ? k.topLight : k.topShade;
    }
    if (style === 'sailor-knit') return Math.floor(t * 4 + (fore ? 1 : 0)) % 2 ? k.top : k.accent;
    if (!fore && t < 0.28 && (style === 'rain-anorak' || style === 'trail-shell')) return k.topLight;
    if (style === 'field-jacket' && !fore && t > 0.38 && t < 0.63 && side * v > 0.37 * r)
      return t < 0.47 ? k.topLight : k.topShade;
    return side * v < -0.47 * r ? k.topShade : k.top;
  }
  function shoe(style, b, k, foot, knee, side, sx, sy, ankle, radius, forward) {
    const [x, y, z] = foot,
      floor = z - ankle;
    const boot = style === 'trail-boots',
      soft = style === 'soft-booties',
      strap = style === 'strap-sneakers';
    const h = ankle * (boot ? 0.77 : soft ? 0.55 : 0.61),
      toe = x + forward * sx * (soft ? 0.15 : 0.25);
    b.blob(
      toe,
      y,
      floor + h,
      sx * (soft ? 0.9 : 1.02),
      sy,
      h,
      (px, py, pz) => {
        const f = ((px - toe) * forward) / sx,
          a = (py - y) / sy,
          t = (pz - floor) / h;
        if (soft) return t < 0.29 ? k.shoeShade : Math.abs(a) > 0.64 || f < -0.65 ? k.shoeLight : k.shoes;
        if (t < 0.26) return k.outsole;
        if (t < (boot ? 0.45 : 0.53)) return boot ? k.shoeLight : k.rubber;
        if (f > (boot ? 0.61 : 0.49)) return boot ? k.shoeShade : k.rubber;
        if (strap && f > -0.3 && f < 0.42 && Math.abs(a) < 0.81 && t > 1.12) {
          const band = f - 0.1 * a;
          if ((band > -0.29 && band < -0.08) || (band > 0.12 && band < 0.34)) return k.shoeLight;
        }
        if (!boot && !strap && t > 1.35 && Math.abs(a) < 0.44 && Math.abs(Math.sin(10 * f + 1.4 * a)) < 0.46)
          return k.rubber;
        return side * a < -0.53 ? k.shoeShade : k.shoes;
      },
      soft ? 2.5 : 3.15
    );
    // Bring the tongues up the instep so the lacing and closures are visible from the front.
    if (boot || strap) {
      b.blob(
        toe + 0.2 * sx * forward,
        y,
        floor + 1.35 * h,
        0.57 * sx,
        0.73 * sy,
        0.83 * h,
        (px, py, pz) => {
          const f = ((px - toe) * forward) / sx,
            a = (py - y) / sy,
            level = (pz - floor) / h;
          if (level < 1.08) return k.shoeShade;
          if (strap) {
            const at = f - 0.12 * a;
            return (at > -0.18 && at < 0.02) || (at > 0.24 && at < 0.47) ? k.rubber : k.shoes;
          }
          const across = (level + 0.82 * f) * 3.2 + 0.49 * Math.abs(a);
          return Math.abs(a) < 0.61 && Math.abs(across - Math.round(across)) < 0.17 ? k.lining : k.shoes;
        },
        2.65
      );
    }
    if (!boot && !soft) return;
    const shaft = foot.map((v, j) => v + (soft ? 0.24 : 0.4) * (knee[j] - v));
    b.link(foot, shaft, (boot ? 1.18 : 1.12) * radius, (boot ? 1.27 : 1.17) * radius, 1, (t, u, v) => {
      if (t > 0.78) return t > 0.89 ? k.shoeLight : soft ? k.rubber : k.shoeShade;
      if (soft) return Math.abs(v) > 0.55 * radius ? k.shoeLight : k.shoes;
      if (u * forward > 0.32 * radius && Math.abs(v) < 0.83 * radius) {
        const lace = t * 3.7 + Math.abs(v / radius) * 0.45;
        return Math.abs(lace - Math.round(lace)) < 0.19 ? k.rubber : k.shoeShade;
      }
      return side * v < -0.57 * radius ? k.shoeShade : k.shoes;
    });
  }
  function luggage(parts, b, k, depth, width, low, height) {
    const { bag, attachment } = parts;
    if (!bag && !attachment) return;
    const satchel = ['survey-satchel', 'messenger', 'camera', 'hip-pack'].includes(bag),
      school = bag === 'school-pack',
      hip = bag === 'hip-pack',
      camera = bag === 'camera',
      messenger = bag === 'messenger',
      tall = bag === 'rucksack';
    const cx = -depth * (hip ? 0.84 : satchel ? 1.18 : 1.45),
      cy = hip ? 0.87 * width : satchel ? 0.6 * width : 0;
    const cz = low + height * (hip ? 0.19 : camera ? 0.37 : satchel ? 0.3 : 0.49);
    const rx = depth * (hip ? 0.35 : camera ? 0.63 : satchel ? 0.44 : 0.59),
      ry =
        width *
        (hip ? 0.43 : camera ? 0.46 : messenger ? 0.87 : tall ? 0.74 : satchel ? 0.69 : school ? 0.8 : 0.86);
    const rz = height * (hip ? 0.14 : camera ? 0.22 : tall ? 0.49 : satchel ? 0.29 : school ? 0.38 : 0.43);
    if (bag) {
      // The flap and pocket sit on the outward (-X) face of the bag.
      b.blob(
        cx,
        cy,
        cz,
        rx,
        ry,
        rz,
        (x, y, z) => {
          const a = (y - cy) / ry,
            h = (z - cz) / rz;
          if (h < -0.77 || Math.abs(a) > 0.88) return k.bagShade;
          if (h > 0.68 || (x > cx && h > 0.1)) return k.bagLight;
          return k.bagMain;
        },
        school ? 2.65 : 3.6
      );
      b.blob(
        cx - 0.79 * rx,
        cy,
        cz + (school ? -0.24 : 0.33) * rz,
        0.42 * rx,
        0.88 * ry,
        (school ? 0.5 : 0.49) * rz,
        (x, y, z) => {
          const a = (y - cy) / ry,
            h = (z - cz) / rz;
          if (hip || camera) return h > 0.2 && h < 0.39 ? k.webbing : h > 0.65 ? k.bagLight : k.bagMain;
          if (messenger) return h < 0.12 ? k.bagShade : Math.abs(a) < 0.12 && h < 0.47 ? k.brass : k.bagLight;
          if (tall) return h > 0.46 ? (Math.abs(a) < 0.15 ? k.brassShade : k.bagLight) : k.bagMain;
          if (school) return h > 0.03 && h < 0.19 ? k.webbing : h < -0.56 ? k.bagShade : k.bagLight;
          if (h < 0.12) return k.bagShade;
          if (Math.abs(Math.abs(a) - (satchel ? 0.53 : 0.45)) < 0.12 && h < 0.46)
            return h < 0.29 ? k.brass : k.webbing;
          return h > 0.63 ? k.bagLight : k.bagMain;
        },
        3.35
      );
      if (camera)
        b.blob(cx - rx, cy, cz, 0.43 * rx, 0.55 * ry, 0.56 * rz, (x, y, z) => {
          const rr = ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
          return rr < 0.09 ? k.lens : rr < 0.18 ? k.lensGlint : k.bagShade;
        });
      if (tall)
        b.blob(
          cx,
          cy,
          cz + 0.82 * rz,
          0.84 * rx,
          0.85 * ry,
          0.22 * rz,
          (x, y, z) => (Math.abs(Math.sin((y / ry) * 12)) < 0.3 ? k.webbing : k.bagLight),
          3
        );
      if (!satchel) {
        for (const side of [-1, 1]) {
          const sy = side * width;
          b.link(
            [0.54 * depth, 0.61 * sy, low + 0.91 * height],
            [-0.22 * depth, 0.62 * sy, low + 0.978 * height],
            0.102 * width,
            0.095 * width,
            0.85,
            () => k.bagMain
          );
          b.link(
            [-0.22 * depth, 0.62 * sy, low + 0.978 * height],
            [cx, 0.64 * sy, cz + 0.55 * rz],
            0.095 * width,
            0.11 * width,
            0.85,
            () => k.bagShade
          );
        }
        b.blob(
          cx,
          cy,
          cz + 0.92 * rz,
          0.24 * rx,
          0.28 * ry,
          0.19 * rz,
          (x, y, z) => (Math.abs(y - cy) < 0.13 * ry && z < cz + 1.03 * rz ? 0 : k.webbing),
          2.8
        );
      }
    }
    if (!attachment) return;
    const rolled = attachment === 'bedroll';
    let first, last;
    if (rolled) {
      const x = bag ? cx - 0.36 * rx : -1.4 * depth,
        z = bag ? cz + 1.04 * rz : low + 0.78 * height;
      first = [x, -0.98 * width, z];
      last = [x, 0.98 * width, z];
    } else {
      const x = bag ? cx - 0.92 * rx : -1.29 * depth;
      first = [x, 0.77 * width, low + 0.2 * height];
      last = [x, -0.76 * width, low + 0.91 * height];
    }
    const r = width * (rolled ? 0.29 : 0.19);
    b.link(first, last, r, r, 1, (t, u, v) => {
      if (t < 0.044 || t > 0.956) {
        if (!rolled) return k.brass;
        const ring = Math.hypot(u, v) / r;
        return ring > 0.66 || ring < 0.28 ? k.attachmentShade : k.attachmentLight;
      }
      if ((t > 0.16 && t < 0.24) || (t > 0.76 && t < 0.84)) return rolled ? k.webbing : k.brassShade;
      return u > 0.34 * r ? k.attachmentLight : k.attachmentMain;
    });
  }
  function facewear(parts, b, k, fit, eyeY, eyeZ, front) {
    const glasses = parts.glasses,
      ears = parts.ears;
    for (const side of [-1, 1]) {
      if (glasses) {
        const spec = pineEverydayStyles.glasses[glasses];
        const wy = Math.min(0.41 * fit.ry, eyeY * 0.88),
          hz = fit.rz * (spec ? spec[0] : glasses === 'round' ? 0.217 : 0.176);
        const cy = side * eyeY,
          cz = eyeZ + 0.009 * fit.rz,
          plane = (y, z) => front(y, z) + 0.061 * fit.rx;
        const power = spec ? spec[1] : glasses === 'round' ? 2 : 3.8;
        const margin = hz * 1.07 + (spec ? Math.abs(spec[2]) * fit.rz : 0);
        b.stamp(
          fit.x - 0.08 * fit.rx,
          fit.x + 1.43 * fit.rx,
          cy - wy * 1.06,
          cy + wy * 1.06,
          cz - margin,
          cz + margin,
          (x, y, z) => {
            const q = (y - cy) / wy,
              h = (z - cz - (spec ? spec[2] * fit.rz * q * side : 0)) / hz;
            const ring = Math.abs(q) ** power + Math.abs(h) ** power;
            if (
              ring > 1 ||
              x < plane(y, z) - (spec ? 0.063 : 0.035) * fit.rx ||
              x > plane(y, z) + (spec ? 0.076 : 0.041) * fit.rx
            )
              return 0;
            if (glasses === 'rimless')
              return Math.abs(q) > 0.78 && Math.abs(h) < 0.24
                ? k.glassesMain
                : h < -0.6 && ring > 0.75
                  ? k.glassesLight
                  : 0;
            if (glasses === 'browline' && h < 0 && ring < 0.84) return 0;
            if (ring > (glasses === 'shades' || glasses === 'goggles' ? 0.49 : 0.6))
              return z > cz + 0.57 * hz ? k.glassesLight : k.glassesMain;
            return glasses === 'shades' || spec?.[3]
              ? z > cz + 0.23 * hz && (y - cy) * side < 0
                ? k.lensGlint
                : k.lens
              : 0;
          }
        );
        const bridgeHeight = glasses === 'rimless' ? cz + 0.085 * fit.rz : cz;
        const bridge = [
          plane(side * (eyeY - wy * 0.83), bridgeHeight),
          side * (eyeY - wy * 0.83),
          bridgeHeight
        ];
        b.link(
          bridge,
          [front(0, cz) + 0.078 * fit.rx, 0, cz + 0.041 * fit.rz],
          0.038 * fit.ry,
          0.035 * fit.ry,
          1,
          () => k.glassesMain
        );
        const outside = side * (eyeY + wy * 0.91);
        b.link(
          [plane(outside, cz), outside, cz],
          [fit.x + 0.02 * fit.rx, side * 1.016 * fit.ry, cz + 0.014 * fit.rz],
          0.042 * fit.rz,
          0.046 * fit.rz,
          1,
          () => k.glassesMain
        );
      }
      if (Object.hasOwn(pineEverydayStyles.wearables.ears, ears))
        pineEverydayStyles.earring(ears, b, k, fit, side);
      else if (ears) {
        const y = side * fit.ry * 1.015,
          x = fit.x + 0.05 * fit.rx,
          z = fit.z - 0.24 * fit.rz;
        if (ears === 'studs') b.blob(x, y, z, 0.083 * fit.rx, 0.096 * fit.ry, 0.083 * fit.rz, k.earsLight);
        else
          b.stamp(
            x - 0.14 * fit.rx,
            x + 0.14 * fit.rx,
            y - 0.12 * fit.ry,
            y + 0.12 * fit.ry,
            z - 0.26 * fit.rz,
            z + 0.02 * fit.rz,
            (px, py, pz) => {
              const ring =
                ((px - x) / (0.12 * fit.rx)) ** 2 + ((pz - z + 0.115 * fit.rz) / (0.137 * fit.rz)) ** 2;
              return Math.abs(py - y) < 0.063 * fit.ry && ring < 1 && ring > 0.24
                ? pz < z - 0.13 * fit.rz
                  ? k.earsLight
                  : k.earsMain
                : 0;
            }
          );
      }
    }
  }
  function wristwear(style, b, k, arm, r) {
    if (Object.hasOwn(pineEverydayStyles.wearables.wrist, style))
      return pineEverydayStyles.wrist(style, b, k, arm, r);
    const { elbow, wrist } = arm,
      on = (t) => elbow.map((v, i) => v + t * (wrist[i] - v));
    b.link(on(0.73), on(0.95), 1.16 * r, 1.14 * r, 1, (t, u, v) => {
      if (style === 'sport-band') return Math.abs(v) < 0.56 * r && u > 0 ? k.lens : k.wristMain;
      return t < 0.18 || t > 0.81 ? k.wristShade : k.wristMain;
    });
    if (style === 'watch') {
      const at = on(0.84);
      b.blob(at[0] + 0.33 * r, at[1] + 0.84 * r, at[2], 0.71 * r, 0.44 * r, 0.68 * r, (x, y, z) => {
        const u = (x - at[0] - 0.33 * r) / r,
          v = (z - at[2]) / r;
        if (u * u + v * v > 0.21) return k.brass;
        return (Math.abs(u) < 0.09 && v > 0) || (Math.abs(v) < 0.1 && u > 0) ? k.darkWebbing : k.lining;
      });
    }
  }
  return {
    clothes,
    wearables,
    carriedSlots,
    outfitDyes,
    dyes,
    color,
    hats,
    outfits,
    needsRelease,
    materials,
    fabric,
    bib,
    straps,
    torsoDetails,
    sleeve,
    shoe,
    luggage,
    facewear,
    wristwear
  };
})();
