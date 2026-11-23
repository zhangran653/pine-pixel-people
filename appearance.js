// Versioned appearance recipes and declarative headwear. Usable without a DOM.
const PineLooks = (() => {
  const core = 'pine-core',
    release = '1.0.0';
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
  const shape = {
    height: [0.9, 1.1, 1],
    shoulders: [0.85, 1.15, 1],
    arms: [0.92, 1.08, 1],
    legs: [0.92, 1.08, 1],
    faceWidth: [0.84, 1.16, 1],
    eyeSpacing: [0.8, 1.2, 1],
    jaw: [0.8, 1.2, 1],
    mouthHeight: [-1, 1, 0]
  };
  const slots = {
    hair: { crop: '短碎发', bob: '齐耳发', bun: '盘发' },
    top: { jacket: '拉链夹克', pullover: '套头衫' },
    bottom: { shorts: '短裤', trousers: '长裤' },
    shoes: { sneakers: '运动鞋', boots: '短靴' },
    neck: { none: '无', scarf: '方巾' }
  };
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
  catalog.set(core + '@' + release, sunhat);
  function prepare(raw, source = catalog) {
    fields(
      raw,
      ['format', 'version', 'id', 'label', 'base', 'packs', 'parts', 'shape', 'colors'],
      ['embeddedPacks', 'baseNotice']
    );
    requireThat(raw.baseNotice === undefined || raw.baseNotice === baseNotice, '基础素材许可声明与版本不符');
    requireThat(
      raw.format === 'pine-character' &&
        raw.version === 1 &&
        typeof raw.id === 'string' &&
        lookId.test(raw.id),
      '角色格式、版本或 ID 无效'
    );
    requireThat(['child', 'adult'].includes(raw.base), '不支持的基型');
    const label = short(raw.label, 48),
      working = new Map(source);
    fields(raw.shape, Object.keys(shape));
    fields(raw.colors, Object.keys(colors));
    fields(raw.parts, [...Object.keys(slots), 'hat']);
    const sizes = {},
      palette = {},
      parts = {};
    for (const [key, [lo, hi]] of Object.entries(shape)) sizes[key] = bounded(raw.shape[key], lo, hi);
    for (const key of Object.keys(colors)) {
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
    requireThat(raw.packs[core] === release, '不支持的基础部件版本');
    const pins = { [core]: release };
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
      packs: pins,
      shape: sizes,
      parts,
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
        const x = fit.x + p.center[0] * fit.rx,
          y = fit.y + p.center[1] * fit.ry,
          z = fit.z + p.center[2] * fit.rz;
        const rx = p.size[0] * fit.rx,
          ry = p.size[1] * fit.ry,
          rz = p.size[2] * fit.rz,
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
    return PineMotion.createCharacter({
      id: recipe.id,
      label: recipe.label,
      ...pineDesignerBody.build(recipe, paintHat(hat), hat?.primitives)
    });
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
      'adult',
      ['bun', 'jacket', 'trousers', 'boots', 'scarf', 'none'],
      ['#cc966f', '#493128', '#3c4744', '#586e9e', '#4a585a', '#935c45', '#d99a65'],
      { height: 1.04, shoulders: 1.09, jaw: 0.88 }
    ]
  ];
  const templates = seeds.map(([key, label, base, items, palette, sizes]) => ({
    format: 'pine-character',
    version: 1,
    id: 'look_' + key,
    label,
    base,
    packs: { [core]: release },
    shape: { ...Object.fromEntries(Object.entries(shape).map(([k, v]) => [k, v[2]])), ...sizes },
    parts: Object.fromEntries([...Object.keys(slots), 'hat'].map((k, i) => [k, items[i]])),
    colors: Object.fromEntries(Object.keys(colors).map((k, i) => [k, palette[i]]))
  }));
  return {
    core,
    release,
    shape,
    slots,
    colors,
    catalog,
    templates,
    manifest,
    install,
    prepare,
    build,
    newId
  };
})();
globalThis.PineLooks = PineLooks;
