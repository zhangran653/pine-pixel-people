// Each look is assembled from ordinary catalog IDs. Roles describe people and never gate an action.
const pineWorldWardrobe = (() => {
  const tops = {
    apron: '围裙工作服',
    scrubs: 'V 领洗手服',
    'chef-coat': '双排扣厨师服',
    'lab-coat': '白大褂',
    'hi-vis': '反光工作背心',
    uniform: '肩章制服',
    'cross-robe': '交领长衫',
    brocade: '织锦袍',
    mantle: '扣襟披肩',
    flightsuit: '分体航行服',
    mechanic: '连体检修服',
    ...pineCollectionWardrobe.tops
  };
  const bags = { briefcase: '硬壳公文包', tote: '开口帆布袋', pouch: '束口药囊', ...pineCollectionWardrobe.bags };
  const charms = {
    jade: '双环玉佩',
    tassel: '编结流苏',
    compass: '黄铜罗盘',
    vial: '小玻璃药瓶',
    pass: '挂绳证件',
    ...pineCollectionWardrobe.charms
  };
  const tools = [
    'guide-flag',
    'scanner',
    'clipboard',
    'scroll',
    'quill',
    'fan',
    'mug',
    'lantern',
    'astrolabe',
    'prism',
    'probe',
    'notebook'
  ];
  const wearables = {
    bag: bags,
    bottle: { gourd: '束腰葫芦壶', flask: '扁身旅行水瓶', elixir: '棱纹药剂瓶' },
    charm: charms,
    implement: Object.fromEntries(tools.map((id) => [id, PineWorld.items.get(id).label]))
  };
  const dyes = { charm: '佩饰色' };
  const hats = [];
  function hat(id, label, strokes) {
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
  hat('chef-toque', '褶边厨师帽', [
    [0, 0, 0.72, 1, 1, 0.32, 'hatMain', 4],
    [0, 0, 0.97, 1.13, 1.13, 0.31, 'hatLight'],
    [-0.12, -0.39, 1.17, 0.62, 0.6, 0.29, 'hatLight'],
    [0.18, 0.45, 1.15, 0.62, 0.63, 0.31, 'hatMain']
  ]);
  hat('hardhat', '工程安全帽', [
    [0, 0, 0.75, 1.08, 1.09, 0.55, 'hatMain'],
    [0.13, 0, 0.54, 1.24, 1.13, 0.105, 'hatShade'],
    [0, 0, 1.16, 0.74, 0.16, 0.17, 'hatLight']
  ]);
  hat('scholar-cap', '方巾冠', [
    [0, 0, 0.73, 1.04, 1.06, 0.28, 'hatTrim', 4],
    [-0.12, 0, 1, 0.81, 0.83, 0.42, 'hatMain', 4],
    [0, 0, 1.39, 0.7, 0.74, 0.08, 'hatLight', 4]
  ]);
  hat('reed-hat', '编竹斗笠', [
    [0, 0, 0.57, 1.5, 1.48, 0.1, 'hatShade'],
    [0, 0, 0.73, 1.29, 1.27, 0.2, 'hatMain'],
    [0, 0, 0.91, 0.87, 0.85, 0.2, 'hatLight'],
    [0, 0, 1.08, 0.47, 0.45, 0.17, 'hatMain']
  ]);
  // Narrow overlapping strips lift the felt brim at either side. Two crown
  // ridges leave a central crease in profile without painting a black stripe.
  const westernBrim = [];
  for (let i=-7; i<=7; i++) {
    const t=i/7;
    westernBrim.push([.035,t*1.46,.57+.30*t**4,1.52*Math.sqrt(1-.84*t*t),.22,.112,'hatMain',2.8]);
  }
  hat('western-felt','卷檐西部毡帽', [
    ...westernBrim, [-.035,0,.83,1.01,.88,.32,'hatMain',3],
    [-.10,-.36,1.055,.88,.45,.37,'hatMain',2.5], [-.10,.36,1.055,.88,.45,.37,'hatMain',2.5],
    [-.026,0,.742,1.012,.894,.088,'hatTrim',3.4]
  ]);
  hat('star-hat', '斜尖星帽', [
    [0, 0, 0.57, 1.44, 1.38, 0.11, 'hatShade'],
    [0, 0, 0.83, 1.05, 1.02, 0.36, 'hatMain'],
    [-0.13, 0, 1.15, 0.78, 0.74, 0.31, 'hatMain'],
    [-0.37, 0.05, 1.46, 0.52, 0.46, 0.3, 'hatMain'],
    [-0.69, 0.08, 1.67, 0.36, 0.26, 0.18, 'hatTrim']
  ]);
  function fabric(style, u, v, t, k) {
    if (pineCollectionWardrobe.fabrics[style]) return pineCollectionWardrobe.fabrics[style](u,v,t,k);
    const a = Math.abs(v),
      front = u > 0.15,
      edge = u < -0.6 || a > 0.9,
      field = edge ? k.topShade : k.top;
    if (style === 'apron') {
      if (front && (a < 0.57 || t < 0.49) && t < 0.84) {
        if (t > 0.26 && t < 0.47 && a < 0.38) return t > 0.43 ? k.trimLight : k.topShade;
        return k.accent;
      }
      return field;
    }
    if (style === 'scrubs') {
      if (front && t > 0.73 + a * 0.38) return k.skin;
      if (front && a > 0.28 && a < 0.62 && t > 0.51 && t < 0.62) return k.topLight;
      return field;
    }
    if (style === 'chef-coat') {
      if (front && Math.abs(a - 0.32) < 0.09 && [0.32, 0.52, 0.72].some((h) => Math.abs(t - h) < 0.042))
        return k.accent;
      return front && Math.abs(v + 0.46) < 0.058 ? k.topShade : field;
    }
    if (style === 'lab-coat') {
      if (front && a < 0.14 + 0.35 * Math.max(0, t - 0.48)) return k.accent;
      if (front && t > 0.3 && t < 0.44 && a > 0.36 && a < 0.75) return t > 0.4 ? k.topShade : k.topLight;
      return field;
    }
    if (style === 'hi-vis') {
      if ((t > 0.31 && t < 0.42) || (t > 0.55 && t < 0.63) || (a > 0.42 && a < 0.56 && t > 0.4))
        return k.trimLight;
      return front && a < 0.08 ? k.topShade : field;
    }
    if (style === 'uniform') {
      if ((t > 0.85 && a > 0.51) || (front && v > 0.23 && v < 0.64 && t > 0.61 && t < 0.69)) return k.accent;
      return front && a < 0.055 ? k.topLight : field;
    }
    if (style === 'cross-robe' || style === 'brocade') {
      if ((t > 0.3 && front && Math.abs(v - (t - 0.78) * 2.4) < 0.15) || (t > 0.25 && t < 0.34))
        return k.accent;
      if (style === 'brocade' && Math.cos(v * 15 + t * 26) * Math.cos(t * 28 - v * 9) > 0.52)
        return k.trimLight;
      return field;
    }
    if (style === 'mantle') {
      if (t > 0.56 - 0.19 * a) return t < 0.62 - 0.19 * a ? k.accent : k.topShade;
      return front && a < 0.12 ? k.trimLight : field;
    }
    if (style === 'flightsuit') {
      if (t > 0.6 && t < 0.77 && a < 0.67 && front) return v > 0.31 ? k.trimLight : k.accent;
      if ((t > 0.19 && t < 0.27) || (a > 0.71 && a < 0.82)) return k.topLight;
      return field;
    }
    return front && a < 0.07
      ? k.trimLight
      : front && a > 0.35 && a < 0.69 && t > 0.47 && t < 0.61
        ? k.accent
        : field;
  }
  function sleeve(style, t, u, v, side, r, fore, k) {
    if (Object.hasOwn(pineCollectionWardrobe.tops,style)) return pineCollectionWardrobe.sleeve(style,t,u,v,side,r,fore,k);
    if ((style === 'scrubs' || style === 'apron') && (fore || t > 0.69)) return k.skin;
    if ((style === 'hi-vis' && t > 0.52 && t < 0.68) || (style === 'uniform' && !fore && t < 0.26))
      return k.trimLight;
    if (fore && t > 0.82)
      return ['cross-robe', 'brocade', 'mantle', 'flightsuit'].includes(style) ? k.accent : k.topShade;
    return side * v < -0.38 * r ? k.topShade : k.top;
  }
  function carried(parts, b, k, d, w, low, h, figure = false) {
    if (Object.hasOwn(pineCollectionWardrobe.bags,parts.bag)) pineCollectionWardrobe.bag(parts.bag,b,k,d,w,low,h);
    else if (bags[parts.bag]) {
      const x = -0.45 * d,
        y = 1.12 * w,
        z = low + h * 0.24,
        bag = parts.bag;
      const rx = d * (bag === 'tote' ? 1.03 : bag === 'briefcase' ? 1.18 : 0.59),
        rz = h * (bag === 'tote' ? 0.27 : bag === 'briefcase' ? 0.21 : 0.17);
      b.blob(
        x,
        y,
        z,
        rx,
        w * 0.27,
        rz,
        (px, py, pz) =>
          pz > z + rz * 0.68
            ? k.bagShade
            : bag === 'briefcase' && Math.abs(px - x) < rx * 0.18 && pz > z
              ? k.brass
              : k.bagMain,
        bag === 'pouch' ? 2 : 4.5
      );
      for (const dx of [-1, 1])
        b.link(
          [x + dx * 0.67 * rx, y, z + rz * 0.68],
          [x + dx * 0.24 * rx, y, z + rz * 1.6],
          w * 0.065,
          w * 0.065,
          1,
          () => k.bagShade
        );
      b.link(
        [x - rx * 0.24, y, z + rz * 1.6],
        [x + rx * 0.24, y, z + rz * 1.6],
        w * 0.07,
        w * 0.07,
        1,
        () => k.bagShade
      );
    }
    if (!parts.charm) return;
    if (Object.hasOwn(pineCollectionWardrobe.charms,parts.charm)) return pineCollectionWardrobe.charm(parts.charm,b,k,d,w,low,h);
    const kind = parts.charm,
      badge = kind === 'pass',
      x = (badge ? 0.99 : 0.92) * d,
      y = badge ? -0.25 * w : -0.71 * w,
      z = low + h * (badge ? 0.61 : 0.23),
      r = w * 0.19;
    for (const sign of [-1, 1])
      b.link(
        [x * 0.54, y + sign * (badge ? 0.58 : 0.21) * w, z + h * (badge ? 0.37 : 0.14)],
        [x, y, z],
        r * 0.22,
        r * 0.23,
        1,
        () => k.charmShade
      );
    if (kind === 'tassel') {
      for (const n of [-2, -1, 0, 1, 2])
        b.link(
          [x, y, z],
          [x + 0.22 * r, y + n * 0.27 * r, z - 2.2 * r],
          r * 0.24,
          r * 0.14,
          1,
          () => k.charmMain
        );
    } else {
      b.blob(
        x,
        y,
        z - r * 0.68,
        r * 0.48,
        r * (badge ? 1.3 : 1),
        r * (badge ? 1.65 : kind === 'vial' ? 1.42 : 1),
        (px, py, pz) => {
          if (figure && badge) {
            const u = (py - y) / r, v = (pz - z + r * 0.68) / r;
            if (px < x || Math.abs(u) > 1.07 || Math.abs(v) > 1.43) return k.charmShade;
            if (v > 1.02 || v < -1.03) return k.charmMain;
            if (u < -0.08 && ((u + 0.56) ** 2 + (v - 0.32) ** 2 < 0.12 ||
              ((u + 0.56) / 0.46) ** 2 + ((v + 0.35) / 0.38) ** 2 < 1)) return k.charmShade;
            if (u > 0.13 && u < 0.87 && (Math.abs(v - 0.24) < 0.12 || Math.abs(v + 0.29) < 0.11)) return k.charmMain;
            return k.lining;
          }
          if (kind === 'jade' && Math.hypot(py - y, pz - z + r * 0.68) < 0.39 * r) return 0;
          if (badge && pz > z - r * 0.72) return k.lining;
          if (kind === 'compass' && Math.abs(py - y - (pz - z + r * 0.68) * 0.45) < r * 0.26) return k.brass;
          return kind === 'vial' && pz > z ? k.brassShade : k.charmMain;
        },
        badge ? 5 : 2
      );
    }
  }
  // id, Chinese role, profile, haircut, top, bottom, shoes, top colour, accent, independent gear.
  const roster = {
    modern: [
      [
        'programmer',
        '程序员',
        'female',
        'shoulder-length',
        'hoodie',
        'trousers',
        'sneakers',
        '516a85',
        '88bdad',
        { glasses: 'round', audio: 'headphones', bag: 'rucksack', laptop: 'stickers' }
      ],
      [
        'developer',
        '软件开发工程师',
        'male',
        'side-part',
        'oxford',
        'cargo',
        'runners',
        '628d88',
        'e3bf83',
        { glasses: 'square', charm: 'pass', wrist: 'digital', laptop: 'field' }
      ],
      [
        'manager',
        '项目经理',
        'female',
        'low-bun',
        'blazer',
        'pinstripe',
        'loafers',
        '655a75',
        'dbab78',
        { bag: 'briefcase', ears: 'pearl', wrist: 'watch', implement: 'clipboard' }
      ],
      [
        'cashier',
        '超市售货员',
        'male',
        'crop',
        'apron',
        'trousers',
        'canvas-shoes',
        '718b73',
        'b96855',
        { brooch: 'nameplate', implement: 'scanner' }
      ],
      [
        'guide',
        '城市导游',
        'female',
        'ponytail',
        'polo',
        'capris',
        'runners',
        'b25b49',
        'fad68a',
        { hat: 'pine-core/visor', bag: 'hip-pack', bottle: 'flask', implement: 'guide-flag' }
      ],
      [
        'teacher',
        '中学教师',
        'male',
        'slick-back',
        'knit-vest',
        'pinstripe',
        'oxfords',
        '837659',
        'ecbf78',
        { glasses: 'oval', bag: 'tote', implement: 'notebook' }
      ],
      [
        'nurse',
        '医院护理师',
        'male',
        'crop',
        'scrubs',
        'joggers',
        'sneakers',
        '548a99',
        'c5e6d7',
        { charm: 'pass', wrist: 'watch' }
      ],
      [
        'chemist',
        '实验室研究员',
        'female',
        'twin-braids',
        'lab-coat',
        'trousers',
        'loafers',
        'd4d6c6',
        '547980',
        { glasses: 'goggles', implement: 'clipboard' }
      ],
      [
        'chef',
        '餐厅厨师',
        'male',
        'crop',
        'chef-coat',
        'pinstripe',
        'canvas-shoes',
        'dfd6bc',
        '963e40',
        { hat: 'pine-core/chef-toque', belt: 'sash' }
      ],
      [
        'barista',
        '咖啡师',
        'female',
        'french-bob',
        'apron',
        'wide-leg',
        'loafers',
        'cfba95',
        '64745e',
        { bag: 'pouch', implement: 'mug' }
      ],
      [
        'electrician',
        '设备检修员',
        'female',
        'braid',
        'mechanic',
        'cargo',
        'boots',
        '4b7380',
        'efa44e',
        { hat: 'pine-core/hardhat', belt: 'utility', gloves: 'fingerless' }
      ],
      [
        'builder',
        '建筑工程师',
        'male',
        'curly',
        'hi-vis',
        'cargo',
        'trail-boots',
        'cb8b47',
        'f2de89',
        { hat: 'pine-core/hardhat', implement: 'clipboard' }
      ],
      [
        'courier',
        '快递员',
        'female',
        'ponytail',
        'uniform',
        'joggers',
        'runners',
        '577bb3',
        'e6b852',
        { hat: 'pine-core/trail-cap', bag: 'messenger', bottle: 'flask' }
      ],
      [
        'pilot',
        '民航飞行员',
        'female',
        'low-bun',
        'uniform',
        'pinstripe',
        'oxfords',
        '414e67',
        'ddba68',
        { neck: 'tie', brooch: 'star', bag: 'briefcase' }
      ],
      [
        'librarian',
        '图书管理员',
        'male',
        'side-part',
        'cardigan',
        'trousers',
        'loafers',
        '8f796d',
        'e7cd99',
        { glasses: 'browline', implement: 'notebook' }
      ],
      [
        'vendor',
        '市集摊主',
        'female',
        'long-waves',
        'apron',
        'plaid-skirt',
        'sandals',
        'a98168',
        '6d8262',
        { bag: 'tote', ears: 'hoops' }
      ],
      [
        'designer',
        '产品设计师',
        'male',
        'tapered-coils',
        'denim-jacket',
        'wide-leg',
        'canvas-shoes',
        '667394',
        'cf9775',
        { audio: 'earbuds', implement: 'clipboard' }
      ],
      [
        'reporter',
        '现场记者',
        'female',
        'bob',
        'trench',
        'trousers',
        'chelsea',
        'aa916d',
        '895464',
        { bag: 'camera', charm: 'pass' }
      ]
    ],
    historic: [
      [
        'scholar',
        '游学书生',
        'male',
        'bun',
        'cross-robe',
        'wide-leg',
        'flats',
        '698785',
        'd4c7a0',
        { hat: 'pine-core/scholar-cap', implement: 'scroll', charm: 'jade' }
      ],
      [
        'scribe',
        '抄书人',
        'female',
        'low-bun',
        'cross-robe',
        'plaid-skirt',
        'flats',
        '8a788d',
        'dad2a2',
        { implement: 'quill', bag: 'pouch' }
      ],
      [
        'merchant',
        '行旅商贩',
        'male',
        'braid',
        'brocade',
        'wide-leg',
        'boots',
        '9f6851',
        'dbb56b',
        { hat: 'pine-core/reed-hat', bag: 'tote', bottle: 'gourd' }
      ],
      [
        'herbalist',
        '采药人',
        'female',
        'twin-braids',
        'cross-robe',
        'cargo',
        'sandals',
        '657e56',
        'd8bb8e',
        { hat: 'pine-core/reed-hat', bag: 'pouch', bottle: 'gourd', charm: 'vial' }
      ],
      [
        'artisan',
        '织锦匠人',
        'female',
        'crown-braid',
        'brocade',
        'wide-leg',
        'flats',
        '946477',
        'e0b965',
        { implement: 'fan', belt: 'sash' }
      ],
      [
        'lanternkeeper',
        '守灯人',
        'male',
        'bun',
        'mantle',
        'trousers',
        'boots',
        '666888',
        'edbb75',
        { implement: 'lantern', bag: 'pouch' }
      ],
      [
        'poet',
        '游园诗人',
        'female',
        'long-waves',
        'brocade',
        'plaid-skirt',
        'flats',
        '64938a',
        'efd1ac',
        { implement: 'fan', charm: 'tassel', ears: 'drop' }
      ],
      [
        'apprentice',
        '书院小徒',
        'child',
        'twin-tails',
        'cross-robe',
        'knee-pants',
        'canvas-shoes',
        '72969c',
        'e5bd82',
        { bag: 'school-pack', implement: 'notebook' }
      ]
    ],
    fantasy: [
      [
        'mage',
        '星图法师',
        'female',
        'long-waves',
        'mantle',
        'wide-leg',
        'boots',
        '72618f',
        'e4bf73',
        { hat: 'pine-core/star-hat', implement: 'prism', charm: 'compass' }
      ],
      [
        'alchemist',
        '旅行炼金师',
        'male',
        'curly',
        'lab-coat',
        'cargo',
        'chelsea',
        '89977d',
        '806098',
        { glasses: 'goggles', bottle: 'elixir', charm: 'vial' }
      ],
      [
        'ranger',
        '林地巡护人',
        'female',
        'braid',
        'mantle',
        'trousers',
        'trail-boots',
        '517d69',
        'c5b777',
        { bag: 'rucksack', bottle: 'gourd', charm: 'jade' }
      ],
      [
        'oracle',
        '月庭占星师',
        'male',
        'shoulder-length',
        'brocade',
        'wide-leg',
        'flats',
        '565f87',
        'd5b678',
        { implement: 'astrolabe', charm: 'tassel', ears: 'star' }
      ],
      [
        'bard',
        '巡游吟游诗人',
        'female',
        'curly',
        'cross-robe',
        'plaid-skirt',
        'boots',
        'a56660',
        'e9be79',
        { hat: 'pine-core/beret', bag: 'messenger', charm: 'compass' }
      ],
      [
        'sprite',
        '花灵学徒',
        'child',
        'space-buns',
        'mantle',
        'plaid-skirt',
        'sandals',
        '82966c',
        'dba5a0',
        { hairAccessory: 'flower', implement: 'prism', bottle: 'elixir' }
      ]
    ],
    scifi: [
      [
        'astronaut',
        '轨道航行员',
        'female',
        'crop',
        'flightsuit',
        'cargo',
        'trail-boots',
        'b6c4c1',
        '6388a0',
        { belt: 'utility', charm: 'pass', implement: 'probe' }
      ],
      [
        'engineer',
        '星港机械师',
        'male',
        'tapered-coils',
        'mechanic',
        'cargo',
        'boots',
        '637c87',
        'd69e56',
        { glasses: 'goggles', wrist: 'cuff', bag: 'rucksack' }
      ],
      [
        'xenobotanist',
        '异星植物学家',
        'male',
        'side-part',
        'lab-coat',
        'joggers',
        'runners',
        '86a793',
        '8d75ae',
        { implement: 'probe', bottle: 'elixir' }
      ],
      [
        'navigator',
        '深空导航员',
        'female',
        'half-up',
        'uniform',
        'pinstripe',
        'chelsea',
        '555e85',
        '78c6c4',
        { audio: 'ear-hooks', implement: 'astrolabe', wrist: 'digital' }
      ],
      [
        'roboticist',
        '机器人维护师',
        'female',
        'french-bob',
        'hi-vis',
        'joggers',
        'high-tops',
        '997385',
        'a7dbcf',
        { belt: 'utility', implement: 'clipboard', gloves: 'fingerless' }
      ],
      [
        'cadet',
        '空间站学员',
        'child',
        'crop',
        'flightsuit',
        'joggers',
        'runners',
        '6989aa',
        'f0c479',
        { audio: 'earbuds', bag: 'school-pack' }
      ]
    ]
  };
  return { tops, bags, wearables, dyes, hats, fabric, sleeve, carried, roster };
})();
