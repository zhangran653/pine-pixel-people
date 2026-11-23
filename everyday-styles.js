// Everyday garments and accessories. The same local-coordinate brushes feed Canvas and Three.js.
const pineEverydayStyles = (() => {
  const clothes = {
    top: {
      oxford: '牛津衬衫',
      blazer: '西装外套',
      polo: '翻领 Polo 衫',
      'denim-jacket': '牛仔夹克',
      'knit-vest': '衬衫配针织背心',
      trench: '双排扣风衣',
      rugby: '宽条纹球衣',
      breton: '海魂衫',
      argyle: '菱格毛衣',
      kimono: '交领上衣'
    },
    bottom: {
      'wide-leg': '阔腿裤',
      pinstripe: '西装条纹裤',
      capris: '七分裤',
      joggers: '束脚运动裤',
      'plaid-skirt': '格纹裙',
      'track-shorts': '运动短裤'
    },
    shoes: {
      loafers: '乐福鞋',
      'mary-janes': '玛丽珍鞋',
      chelsea: '切尔西靴',
      sandals: '交叉带凉鞋',
      runners: '拼面跑鞋',
      oxfords: '牛津皮鞋'
    },
    neck: {
      pendant: '吊坠项链',
      pearls: '珍珠项链',
      tie: '长领带',
      choker: '颈圈',
      'winter-scarf': '针织围巾',
      bolo: '波洛领绳'
    }
  };
  const wearables = {
    glasses: {
      oval: '椭圆细框',
      aviator: '飞行员墨镜',
      'cat-eye': '猫眼镜框',
      browline: '眉线镜框',
      rimless: '无框眼镜',
      geometric: '多边形镜框',
      goggles: '运动护目镜'
    },
    ears: { pearl: '珍珠耳坠', drop: '水滴耳坠', bar: '长条耳饰', huggies: '双圈耳扣', star: '星形耳钉' },
    wrist: { bangle: '金属手镯', beads: '珠串手链', woven: '编绳手链', digital: '电子表', cuff: '宽腕带' },
    bag: { messenger: '邮差包', camera: '相机包', 'hip-pack': '腰包', rucksack: '抽绳双肩包' },
    hairAccessory: {
      band: '布艺发箍',
      ribbon: '侧蝴蝶结',
      clips: '彩色双发夹',
      barrette: '一字发卡',
      flower: '花朵发饰',
      pins: '交叉发针',
      tiara: '小皇冠',
      scrunchie: '发圈'
    },
    audio: {
      headphones: '头戴耳机',
      earbuds: '无线耳塞',
      'ear-hooks': '运动挂耳耳机',
      earmuffs: '绒毛耳罩',
      'hearing-aid': '耳背式助听器'
    },
    belt: { leather: '皮带方扣', woven: '织带腰带', sash: '布腰封', utility: '多袋腰带' },
    brooch: { rosette: '花形胸针', badge: '圆徽章', star: '星形胸针', nameplate: '长方姓名牌' },
    gloves: { fingerless: '露指手套', mittens: '连指手套', leather: '皮手套', knit: '针织手套' }
  };
  const dyes = {
    hairAccessory: '发饰色',
    audio: '耳机与耳罩色',
    belt: '腰带色',
    brooch: '胸针色',
    gloves: '手套色'
  };
  const defaults = {
    hairAccessory: '#ae685d',
    audio: '#52667a',
    belt: '#775b49',
    brooch: '#ce9e54',
    gloves: '#727f7d'
  };
  function materials(colors, tint) {
    const ink = {};
    for (const key of Object.keys(dyes)) {
      const c = (colors[key] || defaults[key]).slice(1);
      ink[key + 'Main'] = c;
      ink[key + 'Shade'] = tint(c, '343340', 0.43);
      ink[key + 'Light'] = tint(c, 'fff1ce', 0.4);
    }
    return ink;
  }
  const hats = [];
  function hat(id, label, ...strokes) {
    hats.push({
      id,
      label,
      slot: 'hat',
      primitives: strokes.map(([x, y, z, rx, ry, rz, color, power = 2.6]) => ({
        shape: 'ellipsoid',
        center: [x, y, z],
        size: [rx, ry, rz],
        color,
        power
      }))
    });
  }
  hat(
    'beret',
    '斜戴贝雷帽',
    [0, 0, 0.56, 1.01, 1.02, 0.12, 'hatShade'],
    [-0.1, 0.16, 0.78, 1.15, 1.18, 0.36, 'hatMain'],
    [-0.14, 0.2, 1.11, 0.075, 0.078, 0.11, 'hatTrim']
  );
  hat(
    'bucket',
    '渔夫帽',
    [0, 0, 0.55, 1.35, 1.31, 0.15, 'hatShade'],
    [-0.03, 0, 0.66, 1.23, 1.18, 0.19, 'hatMain'],
    [-0.05, 0, 0.85, 0.98, 0.96, 0.34, 'hatMain', 3.7],
    [-0.02, 0, 0.72, 1.02, 1.04, 0.067, 'hatTrim']
  );
  hat(
    'pom-beanie',
    '绒球毛线帽',
    [0, 0, 0.67, 1.04, 1.06, 0.57, 'hatMain'],
    [0, 0, 0.56, 1.085, 1.09, 0.15, 'hatShade'],
    [0, 0, 0.62, 1.08, 1.09, 0.044, 'hatLight'],
    [-0.09, 0, 1.27, 0.205, 0.218, 0.19, 'hatLight']
  );
  hat(
    'visor',
    '空顶遮阳帽',
    [-0.04, 0, 0.6, 1.07, 1.055, 0.136, 'hatMain'],
    [0.94, 0, 0.5, 0.79, 0.96, 0.083, 'hatTrim'],
    [1.0, 0, 0.54, 0.7, 0.92, 0.054, 'hatMain']
  );
  hat(
    'newsboy',
    '八角报童帽',
    [-0.13, 0, 0.73, 1.13, 1.13, 0.395, 'hatMain', 3],
    [0, 0, 0.565, 1.05, 1.05, 0.088, 'hatShade'],
    [0.89, 0, 0.53, 0.53, 0.89, 0.09, 'hatTrim'],
    [-0.12, 0, 1.12, 0.09, 0.09, 0.05, 'hatLight']
  );
  hat(
    'fedora',
    '软呢礼帽',
    [-0.06, 0, 0.55, 1.43, 1.32, 0.084, 'hatShade'],
    [-0.08, 0, 0.81, 0.96, 1.01, 0.48, 'hatMain', 3.5],
    [-0.07, 0, 0.7, 0.99, 1.035, 0.104, 'hatTrim', 3.3],
    [-0.1, 0, 1.21, 0.48, 0.12, 0.072, 'hatShade']
  );
  hat(
    'sailor-cap',
    '水手帽',
    [-0.06, 0, 0.66, 1.12, 1.12, 0.38, 'hatLight'],
    [0, 0, 0.6, 1.11, 1.115, 0.15, 'hatMain', 3.2],
    [0, 0, 0.52, 1.07, 1.09, 0.04, 'hatTrim'],
    [-0.73, 0.63, 0.48, 0.25, 0.18, 0.28, 'hatShade']
  );
  function overlay(style, u, v, t, k) {
    const a = Math.abs(v),
      front = u > 0.34,
      side = u < -0.52 || a > 0.88,
      shade = side ? k.topShade : k.top;
    if (style === 'breton' || style === 'rugby') {
      if (t > 0.83 && front && a < 0.44) return style === 'rugby' ? k.lining : k.topLight;
      const stripe = Math.floor(t * (style === 'rugby' ? 6 : 14));
      return stripe % (style === 'rugby' ? 2 : 3) === 1 ? k.accent : shade;
    }
    if (style === 'argyle' && front) {
      const x = v * 1.7,
        y = t * 3.15,
        diamond = Math.abs(x - Math.round(x)) + Math.abs(y - Math.round(y));
      return Math.abs(diamond - 0.57) < 0.05 ? k.lining : diamond < 0.43 ? k.accent : shade;
    }
    if (style === 'kimono') {
      if (front && Math.abs(v - (0.65 - 1.37 * t)) < 0.098) return k.accent;
      if (t > 0.22 && t < 0.38) return t > 0.33 ? k.trimLight : k.accent;
    } else if (style === 'knit-vest') {
      const edge = 0.06 + 0.53 * Math.max(0, (t - 0.53) / 0.47);
      if (front && t > 0.53 && a < edge) return a > edge - 0.082 ? k.accent : k.lining;
      if (a > 0.76 && t > 0.62) return k.lining;
      if (t < 0.12 || (Math.abs(a - 0.57) < 0.04 && t > 0.25 && t < 0.46)) return k.topLight;
    } else if (style === 'blazer' || style === 'trench') {
      if (style === 'trench' && t > 0.25 && t < 0.33) return a < 0.12 && front ? k.brass : k.topStitch;
      if (front) {
        const gap = 0.06 + 0.57 * Math.max(0, (t - 0.39) / 0.61);
        if (a < gap) return k.lining;
        if (t > 0.38 && a < gap + 0.135) return t > 0.7 && a > gap + 0.09 ? k.topStitch : k.topLight;
        if (t < 0.38 && a > 0.39 && a < 0.76 && Math.abs(t - 0.22) < 0.033) return k.topLight;
        const studs = style === 'trench' ? Math.abs(a - 0.25) : Math.abs(v + 0.07);
        if (studs < 0.05 && t < 0.62 && Math.abs(t * 6 - Math.round(t * 6)) < 0.12) return k.brass;
      }
    } else if (style === 'oxford' || style === 'polo' || style === 'denim-jacket') {
      if (front) {
        if (t > 0.75 && Math.abs(a - (t - 0.73) * 1.8) < 0.115)
          return style === 'polo' ? k.accent : k.topLight;
        if (a < 0.052 && (style !== 'polo' || t > 0.53))
          return Math.abs(t * 7 - Math.round(t * 7)) < 0.13 ? k.lining : k.topShade;
        if (style === 'denim-jacket' && t > 0.38 && t < 0.66 && a > 0.25 && a < 0.7)
          return t > 0.57 ? k.topLight : a > 0.62 ? k.topStitch : k.topShade;
        if (style === 'oxford' && v > 0.29 && v < 0.67 && t > 0.44 && t < 0.6)
          return t > 0.55 ? k.topLight : k.topShade;
      }
      if (style === 'denim-jacket' && (Math.abs(t - 0.72) < 0.026 || t < 0.09)) return k.topStitch;
    }
    return t < 0.06 ? k.topShade : shade;
  }
  function sleeve(style, t, u, v, side, r, fore, k) {
    if (style === 'knit-vest') return fore && t > 0.77 ? k.trimLight : k.lining;
    if ((style === 'polo' || style === 'rugby') && fore) return side * v < -0.42 * r ? k.skin : k.skinLight;
    if (style === 'polo' && !fore && t > 0.62) return t < 0.7 ? k.accent : k.skinLight;
    if (style === 'rugby' || style === 'breton')
      return Math.floor((t + (fore ? 1 : 0)) * (style === 'rugby' ? 3 : 6)) % (style === 'rugby' ? 2 : 3) ===
        1
        ? k.accent
        : k.top;
    return fore && t > 0.81 ? k.topLight : side * v < -0.51 * r ? k.topShade : k.top;
  }
  function pants(style, b, thighLink, shinLink, k, hip, knee, foot, side, r, kr, ar) {
    const short = style === 'track-shorts',
      capri = style === 'capris',
      wide = style === 'wide-leg',
      stripe = style === 'pinstripe';
    const end = (a, c, t) => a.map((v, i) => v + (c[i] - v) * t);
    const cloth = (t, u, v) =>
      stripe && Math.abs(Math.sin((v / kr) * 7.8 + (u / kr) * 2)) < 0.19
        ? k.bottomLight
        : style === 'joggers' && side * v > 0.6 * kr
          ? k.accent
          : side * v < -0.58 * kr
            ? k.bottomShade
            : k.bottom;
    thighLink(hip, knee, r, kr, 0.96, short ? () => k.skinLight : cloth);
    if (short)
      thighLink(hip, end(hip, knee, 0.55), 1.12 * r, 1.12 * kr, 1.04, (t, u, v) =>
        t > 0.84 || side * v > 0.68 * r ? k.accent : k.bottom
      );
    shinLink(
      knee,
      foot,
      short || capri ? 0.9 * kr : wide ? 1.17 * kr : kr,
      wide ? 1.61 * ar : ar,
      0.97,
      (t, u, v) => {
        if (short || capri) return t > 0.75 ? k.rubber : k.skinLight;
        if (style === 'joggers' && t > 0.7) return t > 0.8 ? k.bottomLight : k.bottomShade;
        return cloth(t, u, v);
      }
    );
    if (capri)
      shinLink(knee, end(knee, foot, 0.54), 1.08 * kr, 1.16 * ar, 0.98, (t, u, v) =>
        t > 0.83 ? k.bottomLight : cloth(t, u, v)
      );
  }
  function shoe(style, b, k, foot, knee, side, sx, sy, ankle, r, forward) {
    const [x, y, z] = foot,
      floor = z - ankle,
      toe = x + 0.24 * sx * forward;
    const boot = style === 'chelsea',
      sandal = style === 'sandals',
      mary = style === 'mary-janes',
      run = style === 'runners';
    const h = ankle * (boot ? 0.72 : sandal ? 0.39 : mary ? 0.51 : 0.58);
    if (mary || sandal)
      b.blob(toe, y, floor + 0.58 * ankle, 0.84 * sx, 0.78 * sy, 0.48 * ankle, k.skinLight, 2.7);
    b.blob(
      toe,
      y,
      floor + h,
      sx,
      sy,
      h,
      (px, py, pz) => {
        const f = ((px - toe) * forward) / sx,
          a = (py - y) / sy,
          v = (pz - floor) / h;
        if (v < 0.31) return k.outsole;
        if (v < 0.49) return run ? k.rubber : k.shoeLight;
        if (sandal)
          return v < 0.68 || Math.abs(f - 0.26 - 0.47 * a) < 0.17 || Math.abs(f - 0.24 + 0.46 * a) < 0.16
            ? k.shoes
            : 0;
        if (mary && f < 0.32 && f > -0.56 && Math.abs(a) < 0.73 && v > 0.86)
          return Math.abs(f + 0.18) < 0.15 ? k.shoes : 0;
        if (style === 'loafers' && f > -0.05 && f < 0.26 && v > 1.08)
          return Math.abs(a) < 0.21 && v > 1.55 ? k.brass : k.shoeLight;
        if (run && Math.abs(f + 0.06 - 0.5 * a) < 0.22) return k.accent;
        if (style === 'oxfords' && v > 1.27 && Math.abs(a) < 0.54 && f < 0.44)
          return Math.abs(Math.sin(f * 14 + 1.5 * Math.abs(a))) < 0.4 ? k.rubber : k.shoeShade;
        return f > 0.6 && style !== 'loafers' ? k.shoeLight : side * a < -0.6 ? k.shoeShade : k.shoes;
      },
      sandal ? 3.6 : 2.8
    );
    if (boot)
      b.link(
        foot,
        foot.map((v, i) => v + 0.46 * (knee[i] - v)),
        1.18 * r,
        1.23 * r,
        1,
        (t, u, v) => (t > 0.85 ? k.shoeLight : Math.abs(v) > 0.62 * r && t > 0.25 ? k.shoeShade : k.shoes)
      );
  }
  function headItem(slot, style, b, k, f, hat) {
    const { x, z, rx, ry, rz } = f,
      at = (u, v, h) => [x + u * rx, v * ry, z + h * rz];
    const main = k[slot + 'Main'],
      light = k[slot + 'Light'],
      shade = k[slot + 'Shade'];
    const oval = (u, v, h, a, c, d, ink = main) => b.blob(...at(u, v, h), a * rx, c * ry, d * rz, ink);
    const line = (a, c, r, color = main) => b.link(at(...a), at(...c), r * rx, r * rx, 1, () => color);
    if (slot === 'audio') {
      if (style === 'hearing-aid') {
        for (const side of [-1, 1]) {
          oval(-0.22, side * 1.075, -0.03, 0.099, 0.113, 0.184, main);
          line([-0.19, side * 1.11, 0.085], [-0.055, side * 1.17, 0.17], 0.049, light);
          line([-0.055, side * 1.17, 0.17], [0.095, side * 1.11, 0.061], 0.042, light);
          oval(0.1, side * 1.087, -0.025, 0.058, 0.06, 0.087, shade);
        }
        return;
      }
      const large = style === 'headphones' || style === 'earmuffs';
      if (large) {
        let prior = null;
        for (let i = 0; i <= 18; i++) {
          const theta = (Math.PI * i) / 18,
            p = [-0.04, (hat ? 1.15 : 1.09) * Math.cos(theta), -0.04 + (hat ? 1.35 : 1.17) * Math.sin(theta)];
          if (prior) line(prior, p, style === 'earmuffs' ? 0.073 : 0.083, shade);
          prior = p;
        }
      }
      for (const side of [-1, 1]) {
        if (large) {
          oval(
            -0.035,
            side * 1.075,
            -0.06,
            style === 'earmuffs' ? 0.265 : 0.228,
            0.173,
            style === 'earmuffs' ? 0.3 : 0.275,
            shade
          );
          oval(-0.02, side * 1.188, -0.045, 0.18, 0.105, 0.21, main);
          if (style === 'headphones') oval(0.018, side * 1.257, -0.052, 0.087, 0.05, 0.105, light);
        } else {
          oval(0.08, side * 1.073, -0.105, 0.091, 0.085, 0.104, light);
          if (style === 'earbuds')
            line([0.095, side * 1.098, -0.14], [0.102, side * 1.11, -0.32], 0.043, main);
          else {
            line([0.095, side * 1.08, -0.11], [-0.12, side * 1.12, 0.12], 0.052);
            line([-0.12, side * 1.12, 0.12], [-0.23, side * 1.06, -0.1], 0.055);
          }
        }
      }
      return;
    }
    if (style === 'band' || style === 'tiara') {
      let prior = null;
      for (let i = 0; i <= 20; i++) {
        const t = (Math.PI * i) / 20;
        const p =
          style === 'band'
            ? [0.17, 1.068 * Math.cos(t), 0.02 + 1.105 * Math.sin(t)]
            : [0.96 * Math.sin(t) - 0.02, 1.01 * Math.cos(t), 0.31 + 0.24 * Math.sin(t)];
        if (prior) line(prior, p, style === 'band' ? 0.085 : 0.059);
        if (style === 'tiara' && i > 3 && i < 17 && i % 3 === 1) {
          const high = 0.1 + 0.13 * Math.sin(t) ** 6;
          line(p, [p[0] - 0.1, p[1], p[2] + high], 0.052, light);
          oval(p[0] - 0.1, p[1], p[2] + high, 0.056, 0.055, 0.059, k.brass);
        }
        prior = p;
      }
    } else if (style === 'ribbon') {
      oval(0.26, -1.01, 0.46, 0.18, 0.2, 0.2, shade);
      oval(0.27, -1.17, 0.63, 0.13, 0.21, 0.19);
      oval(0.3, -0.86, 0.69, 0.13, 0.21, 0.2);
      line([0.26, -1.01, 0.48], [0.18, -1.14, 0.21], 0.076, light);
    } else if (style === 'flower') {
      for (let i = 0; i < 5; i++)
        oval(0.42 + 0.12 * Math.cos(i * 1.257), -0.98, 0.33 + 0.14 * Math.sin(i * 1.257), 0.12, 0.096, 0.12);
      oval(0.43, -1.049, 0.33, 0.08, 0.07, 0.082, k.brass);
    } else if (style === 'scrunchie') {
      for (let i = 0; i < 9; i++) {
        const t = (2 * Math.PI * i) / 9;
        oval(
          -0.98,
          0.27 * Math.cos(t),
          0.23 + 0.24 * Math.sin(t),
          0.18,
          0.12,
          0.115,
          i % 3 === 0 ? light : main
        );
      }
    } else {
      const sides = style === 'clips' ? [-1, 1] : [-1];
      for (const side of sides) {
        line([0.71, side * 0.76, 0.42], [0.26, side * 1.02, 0.48], style === 'barrette' ? 0.088 : 0.054);
        if (style === 'clips') line([0.64, side * 0.83, 0.29], [0.26, side * 1.05, 0.37], 0.044, light);
        if (style === 'pins') line([0.58, side * 0.87, 0.63], [0.4, side * 0.98, 0.31], 0.047, light);
      }
    }
  }
  const glasses = {
    oval: [0.193, 2.0, 0, false],
    aviator: [0.223, 2.1, -0.075, true],
    'cat-eye': [0.182, 2.5, 0.12, false],
    browline: [0.195, 2.9, 0, false],
    rimless: [0.167, 2.7, 0.025, false],
    geometric: [0.211, 1.3, 0, false],
    goggles: [0.239, 3.5, 0, true]
  };
  function earring(style, b, k, f, side) {
    const { x, z, rx, ry, rz } = f,
      px = x + 0.05 * rx,
      py = side * 1.047 * ry,
      pz = z - 0.23 * rz;
    const bead = (dx, dy, dz, a, c, d, ink) =>
      b.blob(px + dx * rx, py + side * dy * ry, pz + dz * rz, a * rx, c * ry, d * rz, ink);
    if (style === 'pearl' || style === 'drop' || style === 'bar') {
      const bar = style === 'bar',
        offset = bar ? 0.08 : 0;
      b.link(
        [px, py + side * offset * ry, pz],
        [px + 0.025 * rx, py + side * offset * ry, pz - (bar ? 0.42 : 0.22) * rz],
        (bar ? 0.088 : 0.046) * rx,
        (bar ? 0.08 : 0.042) * rx,
        1,
        () => k.earsMain
      );
      if (bar) bead(0.025, offset, -0.38, 0.083, 0.087, 0.106, k.earsLight);
      if (style !== 'bar')
        bead(
          0.025,
          0,
          -0.26,
          style === 'drop' ? 0.1 : 0.119,
          0.09,
          style === 'drop' ? 0.18 : 0.115,
          k.earsLight
        );
    } else if (style === 'huggies') {
      bead(-0.1, 0, 0.075, 0.074, 0.11, 0.114, k.earsLight);
      bead(0.058, 0.023, -0.045, 0.08, 0.104, 0.127, k.earsMain);
    } else {
      for (let i = 0; i < 5; i++)
        bead(0.1 * Math.cos(1.257 * i), 0, 0.1 * Math.sin(1.257 * i), 0.067, 0.068, 0.069, k.earsMain);
      bead(0, 0.027, 0, 0.097, 0.073, 0.098, k.earsLight);
    }
  }
  function wrist(style, b, k, arm, r) {
    const { elbow, wrist } = arm,
      at = (t) => elbow.map((v, i) => v + t * (wrist[i] - v));
    if (style === 'beads') {
      const p = at(0.85),
        delta = wrist.map((v, i) => v - elbow[i]),
        length = Math.hypot(...delta);
      if (!length) return;
      const [dx, dy, dz] = delta.map((n) => n / length),
        horizontal = Math.hypot(dx, dy);
      const tangent = horizontal ? [dy / horizontal, -dx / horizontal, 0] : [1, 0, 0];
      const across = [-dz * tangent[1], dz * tangent[0], dx * tangent[1] - dy * tangent[0]];
      for (let i = 0; i < 10; i++) {
        const t = (2 * Math.PI * i) / 10,
          center = p.map((v, j) => v + r * (tangent[j] * Math.cos(t) + across[j] * Math.sin(t)));
        b.blob(...center, 0.35 * r, 0.35 * r, 0.38 * r, i % 3 ? k.wristMain : k.wristLight);
      }
    } else {
      b.link(at(style === 'cuff' ? 0.57 : 0.74), at(0.96), 1.16 * r, 1.2 * r, 1, (t, u, v) => {
        if (style === 'woven') return Math.sin(t * 15 + (v / r) * 4) > 0 ? k.wristLight : k.wristMain;
        if (style === 'bangle') return t > 0.56 ? k.wristLight : k.wristShade;
        if (style === 'digital' && v > 0.32 * r) return Math.abs(t - 0.5) < 0.22 ? k.lensGlint : k.lens;
        return t < 0.15 || t > 0.85 ? k.wristLight : k.wristMain;
      });
    }
  }
  function hand(style, b, k, arm, r) {
    const { wrist, hand } = arm,
      dir = hand.map((v, i) => v - wrist[i]),
      tip = style === 'fingerless' ? 0.84 : 1.37;
    b.link(
      wrist,
      hand.map((v, i) => wrist[i] + tip * dir[i]),
      r * 1.04,
      r * 0.89,
      0.97,
      (t, u, v) => {
        if (t < 0.32) return style === 'knit' || style === 'mittens' ? k.glovesLight : k.glovesShade;
        return style === 'knit' && Math.sin((v / r) * 11 + t * 4) > 0.5 ? k.glovesLight : k.glovesMain;
      }
    );
    b.blob(
      hand[0] + 0.44 * r,
      hand[1] - 0.48 * r * arm.side,
      hand[2] + 0.16 * r,
      0.54 * r,
      0.47 * r,
      0.63 * r,
      style === 'fingerless' ? k.skinLight : k.glovesMain
    );
  }
  function torso(parts, b, k, d, w, low, tall) {
    const z = (t) => low + t * tall;
    if (parts.belt) {
      const style = parts.belt,
        h = style === 'sash' ? 0.092 : 0.063;
      b.blob(
        0.055 * d,
        0,
        z(0.21),
        1.105 * d,
        1.02 * w,
        h * tall,
        (x, y, pz) => {
          if (Math.abs(y) < 0.15 * w && x > 0.71 * d)
            return style === 'leather' || style === 'utility' ? k.brass : k.beltLight;
          if (style === 'woven' && Math.sin((y / w) * 34 + ((pz - z(0.21)) / tall) * 62) > 0.22)
            return k.beltLight;
          return pz < z(0.21) - 0.56 * h * tall ? k.beltShade : k.beltMain;
        },
        3.7
      );
      if (style === 'utility')
        for (const side of [-1, 1])
          b.blob(0.71 * d, side * 0.76 * w, z(0.19), 0.3 * d, 0.23 * w, 0.085 * tall, k.beltShade, 3.7);
    }
    if (parts.brooch) {
      const bx = 0.97 * d,
        by = 0.5 * w,
        bz = z(0.72),
        r = 0.12 * w,
        style = parts.brooch;
      if (style === 'nameplate') b.blob(bx, by, bz, 0.17 * d, 0.24 * w, 0.038 * tall, k.broochLight, 4);
      else {
        if (style !== 'badge')
          for (let i = 0; i < 5; i++) {
            const t = (2 * Math.PI * i) / 5;
            b.blob(
              bx,
              by + r * Math.cos(t),
              bz + r * Math.sin(t),
              0.125 * d,
              0.74 * r,
              (style === 'star' ? 0.77 : 1.0) * r,
              k.broochMain
            );
          }
        b.blob(bx + 0.043 * d, by, bz, 0.11 * d, r, r, style === 'badge' ? k.broochMain : k.broochLight);
      }
    }
    const style = parts.neck;
    if (!Object.hasOwn(clothes.neck, style)) return;
    if (style === 'winter-scarf') {
      b.blob(
        0.02 * d,
        0,
        z(0.96),
        0.98 * d,
        0.79 * w,
        0.101 * tall,
        (x, y, pz) => (pz > z(0.982) ? k.trimLight : k.accent),
        2.7
      );
      b.link([0.9 * d, -0.33 * w, z(0.93)], [1.09 * d, -0.52 * w, z(0.5)], 0.17 * w, 0.153 * w, 0.73, (t) =>
        t > 0.86 ? k.trimShade : k.accent
      );
      return;
    }
    if (style === 'choker') {
      b.blob(0.04 * d, 0, z(1.004), 0.77 * d, 0.576 * w, 0.043 * tall, k.accent, 2.8);
      return;
    }
    if (style === 'tie') {
      b.blob(1.0 * d, 0, z(0.87), 0.16 * d, 0.145 * w, 0.07 * tall, k.trimShade);
      b.link([1.04 * d, 0, z(0.83)], [1.065 * d, 0, z(0.4)], 0.115 * w, 0.143 * w, 0.92, (t, u) =>
        t > 0.91 || u < 0 ? k.trimShade : k.accent
      );
      return;
    }
    let last;
    for (let i = 0; i <= 14; i++) {
      const q = i / 7 - 1,
        p = [(1.07 - 0.53 * q * q) * d, 0.63 * w * q, z(0.72 + 0.22 * q * q)];
      if (last) b.link(last, p, 0.042 * w, 0.042 * w, 1, () => k.accent);
      if (style === 'pearls' && i % 2 === 0) b.blob(...p, 0.068 * w, 0.069 * w, 0.066 * w, k.trimLight);
      last = p;
    }
    if (style === 'pendant') b.blob(1.1 * d, 0, z(0.67), 0.13 * d, 0.1 * w, 0.076 * tall, k.accent);
    if (style === 'bolo')
      for (const side of [-1, 1])
        b.link([1.07 * d, 0, z(0.73)], [1.1 * d, side * 0.13 * w, z(0.51)], 0.045 * w, 0.049 * w, 1, (t) =>
          t > 0.82 ? k.brass : k.trimShade
        );
  }
  return {
    clothes,
    wearables,
    dyes,
    defaults,
    hats,
    materials,
    overlay,
    sleeve,
    pants,
    shoe,
    headItem,
    glasses,
    earring,
    wrist,
    hand,
    torso
  };
})();
