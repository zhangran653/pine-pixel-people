// Versioned appearance recipes and declarative headwear. Usable without a DOM.
const PineLooks = (() => {
  const core = 'pine-core',
    originalRelease = '1.0.0',
    styleRelease = '1.1.0',
    profileRelease = '1.2.0',
    proportionRelease = '1.3.0',
    hairRelease = '1.4.0',
    headRelease = '1.5.0',
    strandRelease = '1.6.0',
    contourRelease = '1.6.1',
    wardrobeRelease = '1.7.0',
    collectionRelease = '1.8.0',
    sculptRelease = '1.9.0',
    volumeRelease = '1.9.1',
    jawRelease = '1.9.2',
    neckRelease = '1.10.0',
    mandibleRelease = '1.10.1',
    release = '1.11.0';
  const releases = [
    originalRelease,
    styleRelease,
    profileRelease,
    proportionRelease,
    hairRelease,
    headRelease,
    strandRelease,
    contourRelease,
    wardrobeRelease,
    collectionRelease,
    sculptRelease,
    volumeRelease,
    jawRelease,
    neckRelease,
    mandibleRelease,
    release
  ];
  function hasRoundedHead(recipe) {
    return releases.indexOf(recipe.packs[core]) > releases.indexOf(hairRelease);
  }
  function hasSculptedHead(recipe) {
    return releases.indexOf(recipe.packs[core]) >= releases.indexOf(sculptRelease);
  }
  function hasMandible(recipe) {
    return releases.indexOf(recipe.packs[core]) >= releases.indexOf(mandibleRelease);
  }
  const shape = pineDesignerBody.shapeRanges;
  const optionalShape = ['occiput', 'headDepth', 'faceRelief', ...pineHeadShape.controls];
  const requiredShape = Object.keys(shape).filter((key) => !optionalShape.includes(key));
  const jawPresets = {
    natural: { label: '自然短颌', shape: {} },
    soft: {
      label: '柔圆下巴',
      shape: {
        chinHeight: 0.4,
        chinProjection: -0.18,
        chinRoundness: 0.72,
        jawPosition: 0.35,
        jawAngle: 0.15,
        jawNeck: 0.4
      }
    },
    tapered: {
      label: '微尖下巴',
      shape: {
        chinHeight: -0.25,
        chinProjection: 0.24,
        chinRoundness: -0.68,
        jawPosition: 0.4,
        jawAngle: 0.3,
        jawNeck: -0.25
      }
    },
    square: {
      label: '方正下颌',
      shape: {
        chinHeight: 0.05,
        chinProjection: 0.3,
        chinRoundness: 0.68,
        jawPosition: -0.58,
        jawAngle: -0.44,
        jawNeck: -0.32
      }
    }
  };
  const previousBodyRanges = {
    height: [0.9, 1.1],
    shoulders: [0.85, 1.15],
    arms: [0.92, 1.08],
    legs: [0.92, 1.08]
  };
  function usesExtendedShape(sizes) {
    return Object.entries(previousBodyRanges).some(([key, [lo, hi]]) => sizes[key] < lo || sizes[key] > hi);
  }
  const baseNotice = `MIT License

Copyright (c) 2026 zhangran653 and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
  const bodyProfiles = {
    female: { base: 'adult', gender: 'female', label: '女性' },
    male: { base: 'adult', gender: 'male', label: '男性' },
    baby: { base: 'baby', gender: 'unspecified', label: '婴儿' },
    toddler: { base: 'toddler', gender: 'unspecified', label: '幼儿' },
    child: { base: 'child', gender: 'unspecified', label: '儿童' }
  };
  function bodyProfileOf(recipe) {
    if (recipe.base !== 'adult') return recipe.base;
    return recipe.gender === 'female' || recipe.gender === 'male' ? recipe.gender : null;
  }
  function withBodyProfile(recipe, profile) {
    if (!Object.hasOwn(bodyProfiles, profile)) throw new Error('未知的默认体型');
    const { base, gender } = bodyProfiles[profile];
    const next = JSON.parse(JSON.stringify(recipe));
    next.base = base;
    next.gender = gender;
    next.packs[core] = editingRelease(next);
    return next;
  }
  const originalSlots = {
    hair: { crop: '短碎发', bob: '齐耳发', bun: '盘发' },
    top: { jacket: '拉链夹克', pullover: '套头衫' },
    bottom: { shorts: '短裤', trousers: '长裤' },
    shoes: { sneakers: '运动鞋', boots: '短靴' },
    neck: { none: '无', scarf: '方巾' }
  };
  const additionalHair = {
    'shoulder-length': '披肩长发',
    'long-waves': '长波浪',
    'half-up': '半扎长发',
    'twin-braids': '双麻花辫',
    'side-part': '偏分短发'
  };
  const hairColors = {
    墨黑: '#28262c',
    深棕: '#49352f',
    栗棕: '#82513b',
    铜红: '#ad563e',
    蜜金: '#d2a763',
    银灰: '#c1c2c6',
    雾蓝: '#637f9b',
    莓紫: '#895a80',
    乌木黑: '#201e23',
    巧克力: '#624339',
    焦糖棕: '#a36d49',
    栗红: '#893e40',
    亚麻金: '#c9b389',
    浅铂金: '#e8d9ba',
    赤铜: '#be744a',
    浅灰白: '#e0ddd4',
    橄榄灰: '#7f826c',
    烟粉: '#bf8793',
    深靛蓝: '#39445e',
    墨绿: '#416055'
  };
  const colorPresets = {
    skin: {
      冷瓷: '#f6d8ca',
      暖瓷: '#efd2b4',
      淡桃: '#efc4ac',
      米杏: '#e1b798',
      暖沙: '#d6a17c',
      蜜杏: '#ca906c',
      橄榄棕: '#b68b68',
      琥珀棕: '#ab7657',
      古铜: '#93644e',
      红棕: '#855744',
      胡桃: '#714c3f',
      深栗: '#5b4039',
      乌木棕: '#47332f'
    },
    eyes: {
      深棕: '#3e342f',
      茶褐: '#705139',
      琥珀: '#a17d43',
      榛绿: '#77764a',
      苔绿: '#536b55',
      灰绿: '#70857a',
      深蓝: '#40576c',
      湖蓝: '#668b9b',
      雾灰: '#858b8c',
      暖黑: '#29272a'
    },
    lip: {
      裸杏: '#b98470',
      豆沙: '#ad756d',
      玫瑰: '#b96872',
      珊瑚: '#c67a6c',
      砖红: '#a95d52',
      莓果: '#934f61',
      深梅: '#7a4b5b',
      暖棕: '#936852'
    }
  };
  const slots = {
    hair: {
      ...originalSlots.hair,
      ...additionalHair,
      ponytail: '单马尾',
      'twin-tails': '双马尾',
      braid: '编发辫',
      curly: '短卷发'
    },
    top: {
      ...originalSlots.top,
      tee: '短袖 T 恤',
      hoodie: '连帽卫衣',
      cardigan: '针织开衫',
      ...pineWorldWardrobe.tops,
      ...pineWorkshopWear.clothes.top
    },
    bottom: { ...originalSlots.bottom, skirt: '百褶裙', cargo: '工装裤', ...pineWorkshopWear.clothes.bottom },
    shoes: {
      ...originalSlots.shoes,
      'high-tops': '高帮鞋',
      flats: '浅口鞋',
      ...pineWorkshopWear.clothes.shoes
    },
    neck: { ...originalSlots.neck, bow: '领结' }
  };
  const features = {
    eyes: { classic: '自然眼', round: '圆眼', almond: '杏眼', narrow: '细长眼' },
    brows: { classic: '自然眉', straight: '平眉', arched: '弯眉', thick: '浓眉' },
    nose: { classic: '自然鼻', button: '圆鼻头', bridge: '高鼻梁', wide: '宽鼻翼' },
    mouth: { classic: '自然唇', smile: '微笑唇', full: '饱满唇', small: '小巧唇' }
  };
  for (const [slot, options] of Object.entries(pineEverydayStyles.clothes))
    Object.assign(slots[slot], options);
  Object.assign(slots.hair, pineHairStyles.choices);
  for (const [slot, options] of Object.entries(pinePortraitStyles.features))
    Object.assign(features[slot], options);
  const faceDetails = pinePortraitStyles.details;
  const wearables = { ...pineWorkshopWear.wearables };
  for (const [slot, options] of Object.entries(pineEverydayStyles.wearables))
    wearables[slot] = { ...wearables[slot], ...options };
  for (const [slot, options] of Object.entries(pineWorldWardrobe.wearables))
    wearables[slot] = { ...wearables[slot], ...options };
  const gearColors = { ...pineWorldWardrobe.dyes, ...pineWorkshopWear.dyes, ...pineEverydayStyles.dyes };
  const optionalColors = { ...gearColors, ...pinePortraitStyles.dyes };
  const carriedSlots = Object.keys(wearables).filter((k) => k !== 'phone' && k !== 'laptop');
  const outfitDyes = Object.keys(gearColors).filter((k) => k !== 'device');
  function gearColor(colors, key) {
    if (key === 'charm') return colors.charm || '#bf9a66';
    if (Object.hasOwn(pinePortraitStyles.dyes, key)) return pinePortraitStyles.color(colors, key);
    if (Object.hasOwn(pineEverydayStyles.dyes, key)) return colors[key] || pineEverydayStyles.defaults[key];
    return pineWorkshopWear.color(colors, key);
  }
  function usesCollection({ parts, face, colors }) {
    return (
      Object.hasOwn(pineHairStyles.choices, parts.hair) ||
      Object.entries(pineEverydayStyles.clothes).some(([k, v]) => Object.hasOwn(v, parts[k])) ||
      Object.entries(pineEverydayStyles.wearables).some(([k, v]) => Object.hasOwn(v, parts[k])) ||
      Object.entries(face || {}).some(
        ([k, v]) => Object.hasOwn(faceDetails, k) || Object.hasOwn(pinePortraitStyles.features[k] || {}, v)
      ) ||
      Object.keys(colors).some(
        (k) => Object.hasOwn(pineEverydayStyles.dyes, k) || Object.hasOwn(pinePortraitStyles.dyes, k)
      ) ||
      pineEverydayStyles.hats.some((h) => parts.hat === core + '/' + h.id)
    );
  }
  const facePresets = {
    classic: {
      label: '自然五官',
      face: { eyes: 'classic', brows: 'classic', nose: 'classic', mouth: 'classic' }
    },
    cheerful: { label: '圆眼微笑', face: { eyes: 'round', brows: 'arched', nose: 'button', mouth: 'smile' } },
    almond: {
      label: '平眉杏眼',
      face: { eyes: 'almond', brows: 'straight', nose: 'bridge', mouth: 'small' }
    },
    bold: { label: '浓眉细眼', face: { eyes: 'narrow', brows: 'thick', nose: 'wide', mouth: 'full' } },
    gentle: { label: '弯眉小嘴', face: { eyes: 'round', brows: 'arched', nose: 'classic', mouth: 'small' } }
  };
  for (const [id, label, eyes, brows, nose, mouth] of [
    ['clear', '清朗眉眼', 'monolid', 'tapered', 'straight', 'thin'],
    ['warm', '柔和垂眼', 'downturned', 'willow', 'rounded', 'soft-smile'],
    ['bright', '明亮圆眼', 'doe-eye', 'short-brow', 'short', 'bow'],
    ['sharp', '利落眉峰', 'upturned', 'angled', 'aquiline', 'wide'],
    ['calm', '沉静眉眼', 'hooded', 'low-flat', 'broad', 'relaxed'],
    ['mellow', '舒展长眼', 'long-almond', 'feathered', 'slender', 'lower-full']
  ])
    facePresets[id] = { label, face: { eyes, brows, nose, mouth } };
  // Everyday outfits replace clothing. Workshop outfits include a complete set of personal equipment.
  const outfits = {
    track: {
      label: '球场短袖',
      parts: { top: 'tee', bottom: 'shorts', shoes: 'high-tops', neck: 'none' },
      colors: { top: '#4e8c89', bottom: '#435775', shoes: '#dcd4b7', accent: '#eab857' }
    },
    choir: {
      label: '合唱开衫',
      parts: { top: 'cardigan', bottom: 'skirt', shoes: 'flats', neck: 'bow' },
      colors: { top: '#a25749', bottom: '#495c71', shoes: '#684d48', accent: '#dec18c' }
    },
    camp: {
      label: '露营卫衣',
      parts: { top: 'hoodie', bottom: 'cargo', shoes: 'boots', neck: 'none' },
      colors: { top: '#ad7945', bottom: '#536856', shoes: '#685445', accent: '#c7dab1' }
    },
    work: {
      label: '工装夹克',
      parts: { top: 'jacket', bottom: 'cargo', shoes: 'high-tops', neck: 'scarf' },
      colors: { top: '#526e86', bottom: '#77644c', shoes: '#81594f', accent: '#dbac6a' }
    }
  };
  for (const [id, label, top, bottom, shoes, neck, palette] of [
    [
      'commute',
      '通勤西装',
      'blazer',
      'pinstripe',
      'oxfords',
      'tie',
      ['#495967', '#48535f', '#624c42', '#ae6a60']
    ],
    [
      'weekend',
      '海边周末',
      'breton',
      'capris',
      'sandals',
      'none',
      ['#eee6cb', '#8d9a9b', '#aa835e', '#456077']
    ],
    [
      'campus',
      '校园菱格',
      'argyle',
      'plaid-skirt',
      'mary-janes',
      'none',
      ['#946c63', '#657365', '#614947', '#d7c2a0']
    ],
    [
      'relay-track',
      '田径训练',
      'rugby',
      'track-shorts',
      'runners',
      'none',
      ['#537591', '#445e72', '#e6dfcd', '#e8b865']
    ],
    [
      'autumn',
      '秋日风衣',
      'trench',
      'wide-leg',
      'chelsea',
      'winter-scarf',
      ['#bd9e70', '#5d635c', '#57483b', '#ae574c']
    ]
  ])
    outfits[id] = {
      label,
      parts: { top, bottom, shoes, neck },
      colors: { top: palette[0], bottom: palette[1], shoes: palette[2], accent: palette[3] }
    };
  Object.assign(outfits, pineWorkshopWear.outfits);
  function applyOutfit(recipe, outfit) {
    if (Object.hasOwn(outfit.parts, 'hat')) {
      for (const key of carriedSlots) delete recipe.parts[key];
      for (const key of outfitDyes) delete recipe.colors[key];
      recipe.packs = { [core]: recipe.packs[core] };
      delete recipe.embeddedPacks;
    }
    Object.assign(recipe.parts, outfit.parts);
    Object.assign(recipe.colors, outfit.colors);
    recipe.packs[core] = editingRelease(recipe);
    return recipe;
  }
  function needsNewCore(parts, face) {
    return (
      face !== undefined ||
      Object.entries(originalSlots).some(([key, values]) => !Object.hasOwn(values, parts[key]))
    );
  }
  function editingRelease(recipe) {
    const pin = recipe.packs[core];
    let needed = originalRelease;
    if (['headDepth', 'faceRelief'].some((key) => recipe.shape[key] !== undefined && recipe.shape[key] !== 1))
      needed = release;
    else if (
      pineHeadShape.controls.some((key) => recipe.shape[key] !== undefined && recipe.shape[key] !== 0) ||
      recipe.identity !== undefined ||
      ['toddler', 'baby'].includes(recipe.base) ||
      Object.hasOwn(pineWorldWardrobe.tops, recipe.parts.top) ||
      Object.entries(pineWorldWardrobe.wearables).some(([key, values]) =>
        Object.hasOwn(values, recipe.parts[key])
      ) ||
      Object.hasOwn(recipe.colors, 'charm') ||
      pineWorldWardrobe.hats.some((h) => recipe.parts.hat === core + '/' + h.id)
    )
      needed = neckRelease;
    else if (recipe.shape.occiput !== undefined && recipe.shape.occiput !== 1) needed = sculptRelease;
    else if (usesCollection(recipe)) needed = collectionRelease;
    else if (pineWorkshopWear.needsRelease(recipe.parts, recipe.colors)) needed = wardrobeRelease;
    else if (Object.hasOwn(additionalHair, recipe.parts.hair)) needed = hairRelease;
    else if (usesExtendedShape(recipe.shape)) needed = proportionRelease;
    else if (recipe.gender !== undefined) needed = profileRelease;
    else if (needsNewCore(recipe.parts, recipe.face)) needed = styleRelease;
    return releases.indexOf(pin) >= releases.indexOf(needed) ? pin : needed;
  }
  const colors = {
    skin: '肤色',
    hair: '发色',
    eyes: '瞳色',
    top: '上衣',
    bottom: '下装',
    shoes: '鞋色',
    accent: '配饰'
  };
  const inks = ['hatMain', 'hatShade', 'hatLight', 'hatTrim', 'hatInk'];
  const slug = /^[a-z][a-z0-9-]{0,39}$/,
    semver = /^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})$/;
  const lookId = /^look_[a-z0-9][a-z0-9_-]{0,63}$/;
  const catalog = new Map();
  function requireThat(test, message) {
    if (!test) throw new Error(message);
  }
  function fields(obj, keys, optional = []) {
    requireThat(obj && typeof obj === 'object' && !Array.isArray(obj), '需要一个 JSON 对象');
    requireThat(
      keys.every((k) => Object.hasOwn(obj, k)) &&
        Object.keys(obj).every((k) => keys.includes(k) || optional.includes(k)),
      '字段缺失或含未知字段'
    );
  }
  function short(value, limit) {
    requireThat(
      typeof value === 'string' && value.trim().length && [...value].length <= limit,
      '名称或声明长度无效'
    );
    return value.trim();
  }
  function bounded(n, low, high) {
    requireThat(Number.isFinite(n) && n >= low && n <= high, '数值超出允许范围 ' + low + ' … ' + high);
    return n === 0 ? 0 : n;
  }
  function vector(input, low, high) {
    requireThat(Array.isArray(input) && input.length === 3, '部件坐标需要三个数值');
    return input.map((n) => bounded(n, low, high));
  }
  function manifest(raw) {
    fields(raw, ['format', 'version', 'id', 'release', 'title', 'author', 'license', 'parts'], ['notice']);
    requireThat(
      raw.format === 'pine-parts' &&
        raw.version === 1 &&
        typeof raw.id === 'string' &&
        slug.test(raw.id) &&
        typeof raw.release === 'string' &&
        semver.test(raw.release),
      '未知的部件格式、包名或版本'
    );
    requireThat(
      Array.isArray(raw.parts) && raw.parts.length > 0 && raw.parts.length <= 32,
      '每个包需要 1 至 32 个部件'
    );
    const seen = new Set();
    const parts = raw.parts.map((part) => {
      fields(part, ['id', 'label', 'slot', 'primitives']);
      requireThat(
        typeof part.id === 'string' && slug.test(part.id) && !seen.has(part.id) && part.slot === 'hat',
        '帽饰部件标识重复或无效'
      );
      seen.add(part.id);
      requireThat(
        Array.isArray(part.primitives) && part.primitives.length > 0 && part.primitives.length <= 96,
        '每个帽饰需要 1 至 96 个笔画'
      );
      const primitives = part.primitives.map((p) => {
        fields(p, ['shape', 'center', 'size', 'color'], p.shape === 'ellipsoid' ? ['power'] : []);
        requireThat(['box', 'ellipsoid'].includes(p.shape) && inks.includes(p.color), '未知的笔画或帽饰色槽');
        const entry = {
          shape: p.shape,
          center: vector(p.center, -2, 2),
          size: vector(p.size, 0.005, 2),
          color: p.color
        };
        if (p.power !== undefined) entry.power = bounded(p.power, 2, 6);
        return entry;
      });
      return { id: part.id, label: short(part.label, 60), slot: 'hat', primitives };
    });
    return {
      format: 'pine-parts',
      version: 1,
      id: raw.id,
      release: raw.release,
      title: short(raw.title, 80),
      author: short(raw.author, 160),
      license: short(raw.license, 80),
      ...(raw.notice === undefined ? {} : { notice: short(raw.notice, 8000) }),
      parts
    };
  }
  function install(raw, target = catalog) {
    const pack = manifest(raw),
      key = pack.id + '@' + pack.release,
      old = target.get(key);
    requireThat(pack.id !== core || old, 'pine-core 是保留的部件包');
    requireThat(!old || JSON.stringify(old) === JSON.stringify(pack), '同一包版本已有不同内容 · ' + key);
    target.set(key, pack);
    return pack;
  }
  const sunhat = manifest({
    format: 'pine-parts',
    version: 1,
    id: core,
    release,
    title: '松溪基础部件',
    author: 'zhangran653 and contributors',
    license: 'MIT',
    notice: baseNotice,
    parts: [
      {
        id: 'sunhat',
        label: '圆檐野餐帽',
        slot: 'hat',
        primitives: [
          { shape: 'ellipsoid', center: [0, 0, 0.55], size: [1.38, 1.32, 0.13], color: 'hatShade', power: 3 },
          { shape: 'ellipsoid', center: [0, 0, 0.61], size: [1.37, 1.31, 0.11], color: 'hatLight', power: 3 },
          { shape: 'ellipsoid', center: [0, 0, 0.82], size: [1.03, 1.06, 0.51], color: 'hatMain', power: 3 },
          { shape: 'ellipsoid', center: [0, 0, 0.71], size: [1.055, 1.08, 0.115], color: 'hatTrim', power: 4 }
        ]
      }
    ]
  });
  for (const pin of releases) {
    const parts =
      releases.indexOf(pin) >= releases.indexOf(wardrobeRelease)
        ? [...sunhat.parts, ...pineWorkshopWear.hats]
        : sunhat.parts;
    const hats =
      releases.indexOf(pin) >= releases.indexOf(collectionRelease)
        ? [...parts, ...pineEverydayStyles.hats]
        : parts;
    catalog.set(
      core + '@' + pin,
      manifest({
        ...sunhat,
        release: pin,
        parts: releases.indexOf(pin) >= releases.indexOf(neckRelease) ? [...hats, ...pineWorldWardrobe.hats] : hats
      })
    );
  }
  function prepare(raw, source = catalog) {
    fields(
      raw,
      ['format', 'version', 'id', 'label', 'base', 'packs', 'parts', 'shape', 'colors'],
      ['embeddedPacks', 'baseNotice', 'face', 'gender', 'identity']
    );
    requireThat(raw.baseNotice === undefined || raw.baseNotice === baseNotice, '基础素材许可声明与版本不符');
    requireThat(
      raw.format === 'pine-character' &&
        raw.version === 1 &&
        typeof raw.id === 'string' &&
        lookId.test(raw.id),
      '角色格式、版本或 ID 无效'
    );
    requireThat(['child', 'adult', 'toddler', 'baby'].includes(raw.base), '不支持的基型');
    let identity;
    if (raw.identity !== undefined) {
      fields(raw.identity, [], ['era', 'role']);
      identity = {};
      if (raw.identity.era !== undefined) {
        requireThat(Object.hasOwn(PineWorld.realms, raw.identity.era), '未知时代');
        identity.era = raw.identity.era;
      }
      if (raw.identity.role !== undefined) identity.role = short(raw.identity.role, 48);
    }
    const label = short(raw.label, 48),
      working = new Map(source);
    fields(raw.shape, requiredShape, optionalShape);
    fields(raw.colors, Object.keys(colors), Object.keys(optionalColors));
    fields(raw.parts, [...Object.keys(slots), 'hat'], Object.keys(wearables));
    const sizes = {},
      palette = {},
      parts = {};
    for (const key of requiredShape) sizes[key] = bounded(raw.shape[key], shape[key][0], shape[key][1]);
    for (const key of optionalShape) {
      if (!Object.hasOwn(raw.shape, key)) continue;
      const [lo, hi, normal] = shape[key],
        value = bounded(raw.shape[key], lo, hi);
      if (value !== normal) sizes[key] = value;
    }
    for (const key of [
      ...Object.keys(colors),
      ...Object.keys(optionalColors).filter((k) => Object.hasOwn(raw.colors, k))
    ]) {
      requireThat(
        typeof raw.colors[key] === 'string' && /^#[\da-f]{6}$/i.test(raw.colors[key]),
        '颜色需要六位 RGB · ' + key
      );
      palette[key] = raw.colors[key].toLowerCase();
    }
    for (const [slot, values] of Object.entries(slots)) {
      requireThat(
        typeof raw.parts[slot] === 'string' && Object.hasOwn(values, raw.parts[slot]),
        '未知部件 · ' + slot
      );
      parts[slot] = raw.parts[slot];
    }
    for (const [slot, values] of Object.entries(wearables)) {
      if (!Object.hasOwn(raw.parts, slot)) continue;
      requireThat(
        typeof raw.parts[slot] === 'string' && Object.hasOwn(values, raw.parts[slot]),
        '未知配件 · ' + slot
      );
      parts[slot] = raw.parts[slot];
    }
    parts.hat = raw.parts.hat;
    let owner = core,
      hat;
    if (parts.hat !== 'none') {
      requireThat(
        typeof parts.hat === 'string' &&
          parts.hat.split('/').length === 2 &&
          parts.hat.split('/').every((s) => slug.test(s)),
        '帽饰需要 包名/部件名'
      );
      [owner] = parts.hat.split('/');
    }
    fields(raw.packs, owner === core ? [core] : [core, owner]);
    const pin = raw.packs[core];
    requireThat(releases.includes(pin), '不支持的基础部件版本');
    const required = editingRelease(raw);
    requireThat(pin === required, '所选形象需要 pine-core ' + required);
    const hasProfiles = releases.indexOf(pin) >= releases.indexOf(profileRelease);
    const gender = raw.gender === undefined ? 'unspecified' : raw.gender;
    requireThat(['female', 'male', 'unspecified'].includes(gender), '未知的性别值');
    requireThat(raw.base === 'adult' || gender === 'unspecified', '儿童使用中性体型');
    const pins = { [core]: pin };
    let face;
    if (pin !== originalRelease) {
      const selected = raw.face === undefined ? facePresets.classic.face : raw.face;
      fields(selected, Object.keys(features), Object.keys(faceDetails));
      face = {};
      for (const [key, values] of Object.entries({ ...features, ...faceDetails })) {
        if (Object.hasOwn(faceDetails, key) && !Object.hasOwn(selected, key)) continue;
        requireThat(
          typeof selected[key] === 'string' && Object.hasOwn(values, selected[key]),
          '未知五官款式 · ' + key
        );
        face[key] = selected[key];
      }
    }
    if (owner !== core) {
      requireThat(
        typeof raw.packs[owner] === 'string' && semver.test(raw.packs[owner]),
        '请指定帽包的准确版本'
      );
      pins[owner] = raw.packs[owner];
    }
    if (raw.embeddedPacks !== undefined) {
      requireThat(
        Array.isArray(raw.embeddedPacks) && raw.embeddedPacks.length <= (owner === core ? 0 : 1),
        '只可内嵌使用中的外部帽包'
      );
      for (const pack of raw.embeddedPacks) {
        requireThat(pack?.id === owner && pack.release === pins[owner], '内嵌部件包与版本引用不符');
        install(pack, working);
      }
    }
    const pack = working.get(owner + '@' + pins[owner]);
    requireThat(pack, '缺少部件包 · ' + owner + '@' + pins[owner]);
    if (parts.hat !== 'none') {
      hat = pack.parts.find((p) => p.id === parts.hat.split('/')[1]);
      requireThat(hat, '帽包中没有此款式 · ' + parts.hat);
    }
    const recipe = {
      format: 'pine-character',
      version: 1,
      id: raw.id,
      label,
      base: raw.base,
      ...(identity ? { identity } : {}),
      ...(hasProfiles ? { gender } : {}),
      packs: pins,
      shape: sizes,
      parts,
      ...(face ? { face } : {}),
      colors: palette,
      baseNotice
    };
    // Portable recipes carry only the one external package they actually wear.
    if (owner !== core) recipe.embeddedPacks = [pack];
    return { recipe, hat };
  }
  function paintHat(part) {
    if (!part) return null;
    return (_pose, b, ink, fit) => {
      for (const p of part.primitives) {
        const xmin = p.center[0] - p.size[0],
          xmax = p.center[0] + p.size[0];
        const left = fit.posterior ? fit.posterior.fit(xmin, p.center[2]) : xmin;
        const right = fit.posterior ? fit.posterior.fit(xmax, p.center[2]) : xmax;
        const bottom = fit.crown?.raise(p.center[2] - p.size[2]),
          top = fit.crown?.raise(p.center[2] + p.size[2]);
        const x = fit.x + (fit.posterior ? (left + right) * 0.5 : p.center[0]) * fit.rx,
          y = fit.y + p.center[1] * fit.ry,
          z = fit.z + (fit.crown ? (top + bottom) * 0.5 : p.center[2]) * fit.rz;
        const rx = (fit.posterior ? (right - left) * 0.5 : p.size[0]) * fit.rx,
          ry = p.size[1] * fit.ry,
          rz = (fit.crown ? (top - bottom) * 0.5 : p.size[2]) * fit.rz,
          color = ink[p.color];
        if (p.shape === 'ellipsoid') b.blob(x, y, z, rx, ry, rz, color, p.power);
        else
          b.stamp(x - rx, x + rx, y - ry, y + ry, z - rz, z + rz, (px, py, pz) =>
            Math.abs(px - x) <= rx && Math.abs(py - y) <= ry && Math.abs(pz - z) <= rz ? color : 0
          );
      }
    };
  }
  function build(raw, source) {
    const { recipe, hat } = prepare(raw, source);
    const actor = PineMotion.createCharacter({
      id: recipe.id,
      label: recipe.label,
      ...pineDesignerBody.build(
        recipe,
        paintHat(hat),
        hat?.primitives,
        hasRoundedHead(recipe),
        releases.indexOf(recipe.packs[core]) >= releases.indexOf(strandRelease),
        releases.indexOf(recipe.packs[core]) >= releases.indexOf(contourRelease),
        hasSculptedHead(recipe),
        releases.indexOf(recipe.packs[core]) >= releases.indexOf(volumeRelease),
        releases.indexOf(recipe.packs[core]) >= releases.indexOf(jawRelease)
      )
    });
    actor.recipeId = recipe.id;
    actor.gender = recipe.gender ?? 'unspecified';
    return actor;
  }
  function newId() {
    const bytes = new Uint8Array(12);
    globalThis.crypto.getRandomValues(bytes);
    return 'look_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  const seeds = [
    [
      'fern',
      '溪谷学童',
      'child',
      ['crop', 'jacket', 'shorts', 'sneakers', 'scarf', 'none'],
      ['#d4946f', '#463831', '#343a38', '#498879', '#54566b', '#b47d4d', '#efba64'],
      {}
    ],
    [
      'maple',
      '枫林信使',
      'child',
      ['bob', 'pullover', 'trousers', 'boots', 'none', 'pine-core/sunhat'],
      ['#a56b50', '#392d38', '#403448', '#b55f44', '#536b70', '#624750', '#edc583'],
      { height: 0.94, faceWidth: 1.11, eyeSpacing: 1.15, jaw: 1.13, mouthHeight: -0.45 }
    ],
    [
      'ridge',
      '山野访客',
      'female',
      ['bun', 'jacket', 'trousers', 'boots', 'scarf', 'none'],
      ['#cc966f', '#493128', '#3c4744', '#586e9e', '#4a585a', '#935c45', '#d99a65'],
      { height: 1.04, shoulders: 1.09, jaw: 0.88 }
    ]
  ];
  const templates = seeds.map(([key, label, profile, items, palette, sizes]) => ({
    format: 'pine-character',
    version: 1,
    id: 'look_' + key,
    label,
    base: bodyProfiles[profile].base,
    gender: bodyProfiles[profile].gender,
    packs: { [core]: release },
    shape: { ...Object.fromEntries(requiredShape.map((k) => [k, shape[k][2]])), ...sizes },
    parts: Object.fromEntries([...Object.keys(slots), 'hat'].map((k, i) => [k, items[i]])),
    colors: Object.fromEntries(Object.keys(colors).map((k, i) => [k, palette[i]]))
  }));
  const additions = [
    {
      key: 'chorus',
      label: '合唱队员',
      profile: 'child',
      hair: 'twin-tails',
      face: 'cheerful',
      outfit: 'choir',
      shape: { height: 0.94, eyeSpacing: 1.08, faceWidth: 1.06 },
      skin: '#d69979',
      hairColor: '#533630',
      eyes: '#514137'
    },
    {
      key: 'relay',
      label: '接力跑手',
      profile: 'child',
      hair: 'ponytail',
      face: 'almond',
      outfit: 'track',
      shape: { height: 1.08, legs: 1.05, jaw: 0.94 },
      skin: '#ad765a',
      hairColor: '#422d32',
      eyes: '#3b353a'
    },
    {
      key: 'camper',
      label: '露营领队',
      profile: 'male',
      hair: 'braid',
      face: 'bold',
      outfit: 'camp',
      shape: { height: 1.07, shoulders: 1.08, faceWidth: 1.03 },
      skin: '#b98569',
      hairColor: '#4b352e',
      eyes: '#514533'
    },
    {
      key: 'painter',
      label: '街角画师',
      profile: 'female',
      hair: 'curly',
      face: 'gentle',
      outfit: 'work',
      shape: { height: 0.96, jaw: 0.94 },
      skin: '#985f49',
      hairColor: '#392d33',
      eyes: '#41333c'
    }
  ];
  for (const style of additions) {
    const outfit = outfits[style.outfit],
      seed = templates[0];
    templates.push({
      ...seed,
      id: 'look_' + style.key,
      label: style.label,
      base: bodyProfiles[style.profile].base,
      gender: bodyProfiles[style.profile].gender,
      packs: { [core]: release },
      shape: { ...seed.shape, ...style.shape },
      parts: { hair: style.hair, ...outfit.parts, hat: 'none' },
      face: { ...facePresets[style.face].face },
      colors: { skin: style.skin, hair: style.hairColor, eyes: style.eyes, ...outfit.colors }
    });
  }
  // Same clothes, neutral pose and 100% height make the two adult silhouettes directly comparable.
  for (const profile of ['female', 'male']) {
    const model = withBodyProfile(templates[0], profile);
    templates.push({
      ...model,
      id: 'look_body_' + profile,
      label: bodyProfiles[profile].label + '体型样本',
      parts: { ...model.parts, hair: 'crop', top: 'tee', bottom: 'trousers', neck: 'none' },
      colors: { ...model.colors, top: '#59877b', bottom: '#526174', shoes: '#83664d' }
    });
  }
  const workshopProfiles = {
    hiker: ['male', 'crop', 'classic'],
    surveyor: ['female', 'braid', 'almond'],
    mother: ['female', 'bun', 'gentle'],
    child: ['child', 'crop', 'cheerful'],
    toddler: ['toddler', 'curly', 'cheerful'],
    baby: ['baby', 'crop', 'gentle']
  };
  for (const [id, outfit] of Object.entries(pineWorkshopWear.outfits)) {
    const [profile, hair, face] = workshopProfiles[id];
    const model = withBodyProfile(templates[0], profile);
    model.id = 'look_workshop_' + id;
    model.label = outfit.label;
    model.parts.hair = hair;
    model.face = { ...facePresets[face].face };
    const palettes = {
      hiker: ['dc9a70', '493a39', '2a333a'],
      surveyor: ['c88a66', '393139', '674f3d'],
      mother: ['cf916c', '3e3036', '674a3d'],
      child: ['cf916c', '443335', '674a3d'],
      toddler: ['cf916c', '3e3036', '674a3d'],
      baby: ['d89f82', '3e3036', '674a3d']
    };
    const [skin, hairDye, eye] = palettes[id];
    Object.assign(model.colors, { skin: '#' + skin, hair: '#' + hairDye, eyes: '#' + eye });
    templates.push(applyOutfit(model, outfit));
  }
  for (const [id, label, body, hair, faceId, outfit, details, gear, dyes] of [
    [
      'reader',
      '书店店员',
      'female',
      'french-bob',
      'warm',
      'commute',
      { outline: 'oval', complexion: 'freckles' },
      { glasses: 'oval', brooch: 'rosette' },
      { hair: '#644438', top: '#617970', accent: '#c9a887' }
    ],
    [
      'musician',
      '周末乐手',
      'male',
      'tapered-coils',
      'calm',
      'weekend',
      { outline: 'square', facialHair: 'goatee', iris: 'amber' },
      { audio: 'headphones', wrist: 'beads' },
      { skin: '#976954', hair: '#352b2a' }
    ],
    [
      'runner',
      '田径少年',
      'child',
      'space-buns',
      'bright',
      'relay-track',
      { outline: 'round', complexion: 'sunspots' },
      { hairAccessory: 'clips', bag: 'hip-pack' },
      { hair: '#573b35', top: '#4f8093' }
    ],
    [
      'florist',
      '花店花艺师',
      'female',
      'crown-braid',
      'mellow',
      'campus',
      { outline: 'heart', makeup: 'blush' },
      { ears: 'pearl', hairAccessory: 'flower' },
      { hair: '#8b634b', top: '#9a706d' }
    ],
    [
      'walker',
      '街头摄影师',
      'male',
      'slick-back',
      'sharp',
      'autumn',
      { outline: 'diamond', facialHair: 'stubble' },
      { bag: 'camera', glasses: 'browline' },
      { hair: '#443b37', skin: '#bb8564' }
    ],
    [
      'gardener',
      '社区园丁',
      'female',
      'low-bun',
      'warm',
      'camp',
      { outline: 'pear', complexion: 'fine-lines' },
      { top: 'oxford', audio: 'hearing-aid', bag: 'messenger' },
      { hair: '#bab1a6', skin: '#c29577', top: '#8f9c71', audio: '#aa8d71' }
    ]
  ]) {
    const model = withBodyProfile(templates[0], body);
    model.id = 'look_style_' + id;
    model.label = label;
    model.parts.hair = hair;
    model.face = { ...facePresets[faceId].face, ...details };
    applyOutfit(model, outfits[outfit]);
    Object.assign(model.parts, gear);
    Object.assign(model.colors, dyes);
    templates.push(model);
  }
  const skinDyes = ['#d9a083', '#af7657', '#e1b491', '#925f48', '#c88d68', '#ab775f'];
  const hairDyes = ['#493634', '#352e35', '#69513e', '#443438', '#554238', '#453b39'];
  const faceKeys = ['warm', 'calm', 'gentle', 'almond', 'bright', 'mellow'];
  let n = 0;
  for (const [era, rows] of Object.entries(pineWorldWardrobe.roster)) {
    for (const [key, label, profile, hair, top, bottom, shoes, cloth, trim, gear] of rows) {
      const doc = withBodyProfile(templates[0], profile);
      doc.id = 'look_' + key;
      doc.label = label;
      doc.identity = { era, role: label };
      doc.parts = { hair, top, bottom, shoes, neck: 'none', hat: 'none', ...gear };
      doc.shape = {
        ...doc.shape,
        height: [1, 0.98, 1.035, 0.96, 1.02][n % 5],
        faceWidth: [1.01, 0.97, 1.05][n % 3]
      };
      doc.face = { ...facePresets[faceKeys[n % faceKeys.length]].face };
      Object.assign(doc.colors, {
        skin: skinDyes[n % 6],
        hair: hairDyes[n % 6],
        top: '#' + cloth,
        accent: '#' + trim,
        bottom: ['#494f60', '#586068', '#535660', '#664e52'][n % 4],
        shoes: ['#654e43', '#52454a', '#716052'][n % 3]
      });
      if (doc.parts.hat !== 'none')
        doc.colors.hat =
          top === 'chef-coat'
            ? '#e6e0cc'
            : doc.parts.hat.endsWith('hardhat')
              ? '#e8b751'
              : era === 'historic'
                ? '#9a825e'
                : '#736d8a';
      if (gear.charm)
        doc.colors.charm = gear.charm === 'jade' ? '#93bda0' : gear.charm === 'vial' ? '#8cc1c2' : '#d7b26c';
      templates.push(doc);
      n++;
    }
  }
  const templateById = new Map(templates.map((doc) => [doc.id, doc]));
  return {
    core,
    release,
    originalRelease,
    styleRelease,
    profileRelease,
    proportionRelease,
    hairRelease,
    headRelease,
    strandRelease,
    contourRelease,
    wardrobeRelease,
    collectionRelease,
    sculptRelease,
    volumeRelease,
    jawRelease,
    neckRelease,
    mandibleRelease,
    jawPresets,
    jawControls: pineHeadShape.controls,
    hasRoundedHead,
    hasSculptedHead,
    hasMandible,
    editingRelease,
    usesExtendedShape,
    bodyProfiles,
    bodyProfileOf,
    withBodyProfile,
    features,
    facePresets,
    outfits,
    workshopOutfits: pineWorkshopWear.outfits,
    wearables,
    carriedSlots,
    outfitDyes,
    gearColors,
    gearColor,
    faceDetails,
    portraitColors: pinePortraitStyles.dyes,
    hairGroups: pineHairStyles.groups,
    applyOutfit,
    needsNewCore,
    shape,
    slots,
    colors,
    hairColors,
    colorPresets,
    catalog,
    templates,
    templateById,
    manifest,
    install,
    prepare,
    build,
    newId
  };
})();
globalThis.PineLooks = PineLooks;

// Old score IDs and public preset IDs both resolve to the very same editable recipe.
for (const doc of PineLooks.templates) {
  let built;
  const resolve = () => built || (built = PineLooks.build(doc));
  const expose = (id) =>
    PineMotion.characters.set(id, {
      id,
      label: doc.label,
      recipeId: doc.id,
      gender: doc.gender,
      tags: PineLooks.hasMandible(doc) ? [doc.base, 'mandible'] : [doc.base],
      get rig() {
        return resolve().rig;
      },
      get sockets() {
        return resolve().sockets;
      },
      get body() {
        return resolve().body;
      }
    });
  if (doc.id.startsWith('look_workshop_')) expose(doc.id.slice('look_workshop_'.length));
  expose(doc.id);
}
