// A haircut combines a strand-carved scalp, a silhouette and, for long hair, locks bound to head and shoulders.
const pineHairStyles = (() => {
  const styles = {
    bald: { label: '光头', group: '短发', base: 'crop', shave: 'bare' },
    buzz: { label: '圆寸', group: '短发', base: 'crop', shave: 'buzz' },
    fade: { label: '渐层寸头', group: '短发', base: 'crop', shave: 'fade' },
    crew: { label: '平头', group: '短发', base: 'crop', shave: 'crew' },
    pixie: { label: '精灵短发', group: '短发', base: 'side-part', fringe: 'pixie' },
    quiff: { label: '蓬松飞机头', group: '短发', base: 'side-part', fringe: 'quiff' },
    undercut: { label: '两侧铲青', group: '短发', base: 'side-part', shave: 'undercut', fringe: 'sweep' },
    'slick-back': { label: '后梳短发', group: '短发', base: 'bun', fringe: 'slick' },
    'french-bob': { label: '法式短波波', group: '中长发', base: 'bob', fringe: 'blunt', length: 1.04 },
    'angled-bob': {
      label: '不对称波波头',
      group: '中长发',
      base: 'side-part',
      length: 1.31,
      asym: 0.38,
      fringe: 'pixie'
    },
    lob: { label: '锁骨直发', group: '中长发', base: 'shoulder-length', length: 1.55, hem: 0.11 },
    wolf: { label: '狼尾层次剪', group: '中长发', base: 'crop', length: 1.63, hem: 0.52, fringe: 'shag' },
    mullet: { label: '短鬓长后尾', group: '中长发', base: 'crop', length: 1.83, nape: true },
    curtain: {
      label: '八字刘海长发',
      group: '中长发',
      base: 'shoulder-length',
      length: 2.06,
      fringe: 'curtain'
    },
    hime: { label: '姬发式', group: '中长发', base: 'bob', length: 2.32, fringe: 'hime' },
    'waist-length': { label: '及腰直发', group: '中长发', base: 'shoulder-length', length: 2.78, hem: 0.12 },
    'beach-waves': { label: '海浪卷', group: '卷发', base: 'long-waves', length: 2.3, wave: 1.5, hem: 0.25 },
    'curly-lob': { label: '齐肩羊毛卷', group: '卷发', base: 'crop', curls: 'shoulder' },
    afro: { label: '蓬松非洲卷', group: '卷发', base: 'crop', curls: 'afro' },
    'tapered-coils': { label: '渐层短卷', group: '卷发', base: 'crop', shave: 'fade', curls: 'taper' },
    'low-bun': { label: '低发髻', group: '束发', base: 'bun', bun: 'low' },
    'top-knot': { label: '高丸子头', group: '束发', base: 'bun', bun: 'high' },
    'space-buns': { label: '双丸子头', group: '束发', base: 'bun', bun: 'twin' },
    'low-pony': { label: '低马尾', group: '束发', base: 'bun', tail: 'low' },
    'side-pony': { label: '侧马尾', group: '束发', base: 'side-part', tail: 'side' },
    'bubble-pony': { label: '泡泡辫', group: '编发', base: 'bun', tail: 'bubble' },
    fishtail: { label: '鱼骨辫', group: '编发', base: 'bun', tail: 'fish' },
    'box-braids': { label: '多股编发', group: '编发', base: 'bun', tail: 'braids' },
    locs: { label: '绳状锁发', group: '编发', base: 'bun', tail: 'locs' },
    'crown-braid': { label: '环绕冠辫', group: '编发', base: 'bun', bun: 'crown' }
  };
  const groups = {
    crop: '短发',
    'side-part': '短发',
    bob: '中长发',
    'shoulder-length': '中长发',
    'long-waves': '卷发',
    'half-up': '束发',
    bun: '束发',
    ponytail: '束发',
    'twin-tails': '束发',
    braid: '编发',
    'twin-braids': '编发',
    curly: '卷发'
  };
  const choices = Object.fromEntries(Object.entries(styles).map(([id, p]) => [id, p.label]));
  for (const [id, p] of Object.entries(styles)) groups[id] = p.group;
  function cropped(kind, dx, v, h, k) {
    if (kind === 'bare') return 0;
    const r = dx * dx + v * v,
      theta = Math.atan2(v, dx),
      front = Math.cos(theta),
      side = Math.sin(theta);
    const edge = -0.43 + 0.98 * Math.max(0, front) ** 1.55 + 0.22 * side * side;
    if (h < edge || r + h * h < 0.81) return 0;
    let top = kind === 'crew' ? 1.09 : kind === 'undercut' ? 1.055 : 1.022;
    if (kind === 'crew' && h > 0.92) top -= 0.04 * Math.max(0, h - 0.92) * 5;
    if (r + (h / top) ** 2 > 1.049) return 0;
    const fade = (kind === 'fade' || kind === 'undercut') && h < edge + (kind === 'fade' ? 0.49 : 0.43);
    const grain = Math.sin(42 * v + 16 * h) * Math.cos(51 * h - 26 * dx);
    if (fade)
      return h < edge + 0.11
        ? grain > 0.13
          ? k.hairMid
          : k.skinShade
        : grain > 0.16
          ? k.hairSheen
          : k.hairMid;
    return grain > 0.48 ? k.hairSheen : grain < -0.41 ? k.hairDepth : k.hair;
  }
  function draw(p, b, k, f, hat, worldPoint) {
    const { x, z, rx, ry, rz } = f,
      at = (u, v, h) => [x + u * rx, v * ry, z + h * rz];
    const hair = (t, u, v) =>
      v > 0.05 * ry && v < 0.12 * ry ? k.hairSheen : u < -0.11 * rx ? k.hairDepth : k.hair;
    const blob = (u, v, h, a, c, d, seed = 0) => {
      const center = at(u, v, h);
      b.blob(
        ...center,
        a * rx,
        c * ry,
        d * rz,
        (px, py, pz) => {
          const across = (py - center[1]) / (c * ry),
            vertical = (pz - center[2]) / (d * rz);
          const flute = Math.cos(6.2 * across + 2.8 * vertical + seed);
          return vertical < -0.56 || flute < -0.78
            ? k.hairDepth
            : flute > 0.58 && vertical > -0.18
              ? k.hairSheen
              : k.hair;
        },
        2.24
      );
    };
    if (p.fringe && (!hat || ['blunt', 'hime', 'curtain', 'shag', 'pixie'].includes(p.fringe))) {
      if (['slick', 'quiff', 'sweep'].includes(p.fringe)) {
        for (let i = -2; i <= 2; i++) {
          const crest = p.fringe === 'quiff' ? 1.11 : p.fringe === 'slick' ? 0.89 : 1.0;
          blob(
            p.fringe === 'slick' ? -0.18 : 0.28,
            i * 0.245,
            crest - 0.13 * Math.abs(i),
            p.fringe === 'slick' ? 0.73 : 0.58,
            0.253,
            p.fringe === 'quiff' ? 0.29 : 0.21,
            i * 0.43
          );
        }
      } else {
        for (let i = -3; i <= 3; i++) {
          const side = i / 3,
            sweep = p.fringe === 'pixie' ? 0.25 : p.fringe === 'curtain' ? 0.18 * Math.sign(side) : 0;
          const start = at(0.49 - 0.12 * Math.abs(side), side * 0.6 - sweep, 0.81 - 0.12 * Math.abs(side));
          const tip =
            p.fringe === 'curtain'
              ? 0.65 - 0.56 * Math.abs(side)
              : p.fringe === 'pixie'
                ? 0.37 + 0.23 * side
                : p.fringe === 'shag'
                  ? 0.31 + 0.12 * Math.cos(4 * i)
                  : 0.37 + 0.05 * side * side;
          const end = at(0.97 - 0.25 * side * side, side * 0.72 + sweep * 0.29, tip);
          b.link(
            start,
            end,
            0.166 * rx,
            (p.fringe === 'hime' || p.fringe === 'blunt' ? 0.102 : 0.043) * rx,
            1.17,
            hair
          );
        }
      }
    }
    if (p.bun) {
      if (p.bun === 'crown') {
        for (let i = 0; i < 24; i++) {
          const angle = (2 * Math.PI * i) / 24,
            r = hat ? 0.97 : 0.89;
          blob(
            r * Math.cos(angle),
            r * Math.sin(angle),
            0.46 + 0.15 * Math.cos(angle) + (i % 2) * 0.065,
            0.18,
            0.18,
            0.15,
            i
          );
        }
      } else {
        const twin = p.bun === 'twin',
          high = p.bun === 'high';
        for (const sign of twin ? [-1, 1] : [1]) {
          const u = hat ? -0.94 : high ? -0.23 : twin ? -0.35 : -0.99,
            v = twin ? 0.78 * sign : 0.04,
            h = hat ? 0.09 : high ? 1.09 : twin ? 0.78 : -0.19;
          blob(u, v, h, high ? 0.47 : 0.41, twin ? 0.38 : 0.47, high ? 0.43 : 0.36, sign);
          blob(u - 0.08, v + 0.17, h + 0.08, 0.29, 0.27, 0.25, 1.2);
        }
      }
    }
    if (p.curls) {
      const afro = p.curls === 'afro',
        shoulder = p.curls === 'shoulder',
        taper = p.curls === 'taper';
      const rows = hat ? 2 : afro ? 6 : shoulder ? 6 : 4;
      for (let row = 0; row < rows; row++) {
        const h = hat
          ? 0.16 - 0.38 * row
          : shoulder
            ? 1.01 - 0.335 * row
            : taper
              ? 0.97 - 0.215 * row
              : 1.12 - 0.21 * row;
        const count = row === 0 && !hat ? 8 : 15;
        for (let j = 0; j < count; j++) {
          const ang = (2 * Math.PI * (j + 0.4 * row)) / count,
            front = Math.cos(ang),
            side = Math.sin(ang);
          const zh = h + 0.095 * Math.sin(3 * j + row);
          if ((front > 0.42 && zh < 0.4 + 0.12 * front) || (hat && front > 0.3)) continue;
          const radius =
            (afro ? 1.13 : shoulder ? 1.02 : 0.87) *
            Math.sqrt(Math.max(0.12, 1 - (Math.max(0, h) / 1.27) ** 2));
          const curl = (afro ? 0.3 : shoulder ? 0.236 : 0.2) * (1 + 0.09 * Math.cos(j * 2.1));
          blob(
            (front < 0 ? 1.1 : 1) * front * radius - 0.073,
            side * radius,
            zh,
            curl,
            curl * (afro ? 1.14 : 1),
            curl * (shoulder ? 1.37 : 1),
            j * 0.51
          );
        }
      }
    }
    if (!p.tail) return;
    // Long ends follow the upper torso while the tied roots rotate with the head.
    b.frame(null);
    const style = p.tail,
      many = style === 'locs' || style === 'braids',
      count = many ? (style === 'locs' ? 11 : 15) : 1;
    for (let j = 0; j < count; j++) {
      const theta = many ? 0.85 + ((Math.PI * 2 - 1.7) * j) / (count - 1) : Math.PI;
      const vx = Math.cos(theta),
        vy = Math.sin(theta),
        lean = style === 'side' ? 0.91 : 0;
      const z0 = hat ? -0.09 : style === 'side' ? 0.13 : many ? 0.27 : -0.29;
      const segments = style === 'fish' ? 10 : style === 'bubble' ? 5 : many ? 6 : 5;
      const root = (t, i) => {
        const wave =
          (style === 'fish' ? 0.124 : style === 'braids' ? 0.049 : 0) *
          (i % 2 ? 1 : -1) *
          Math.sin(t * Math.PI);
        return worldPoint(
          vx * (0.89 + 0.3 * Math.sin(Math.PI * t * 0.76)) - 0.15 * t,
          vy * (0.92 + 0.18 * Math.sin(t * 4)) + lean * (0.63 + 0.49 * t) + wave,
          z0 - t * (many ? 1.75 + 0.22 * Math.cos(3 * theta) : 1.73)
        );
      };
      for (let i = 0; i < segments; i++) {
        const t = i / segments,
          t2 = (i + 1) / segments;
        const r = many ? (style === 'locs' ? 0.117 : 0.086) : style === 'fish' ? 0.3 : 0.32;
        const a = r * (1 - 0.49 * t),
          c = r * (1 - 0.49 * t2);
        b.link(
          root(t, i),
          root(t2, i + 1),
          a * rx,
          (i === segments - 1 ? 0.42 : 1) * c * rx,
          many ? 1.1 : 1.23,
          hair
        );
        if (style === 'bubble') b.blob(...root(t2, i + 1), c * 0.79 * rx, c * ry, 0.06 * rz, k.accent);
        if (style === 'fish')
          b.blob(...root(t, i), a * 0.84 * rx, a * 1.18 * ry, 0.16 * rz, i % 2 ? k.hairMid : k.hairSheen);
      }
    }
  }
  return { styles, choices, groups, cropped, draw };
})();
