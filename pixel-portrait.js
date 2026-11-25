// Indexed brushes traced from the project's original pixel-face-guide.webp.
// Columns in the eye brushes run from the tear duct to the temple.
const pinePixelPortrait = (() => {
  const brushes = {
    babyEye: [
      '......s...............',
      '....raIIIIIa..........',
      '...saILLLLLLLa........',
      '..rILLLLLLLLLLL.......',
      '.rIKLKKKKKKKLLLK......',
      '.sLKKKasaKKIaKLKK.....',
      '.ILKKK***IKKssKLLK....',
      'rKKKKKs**IKKawrILL....',
      'sIKKKKKKKKIIIWwrKLK...',
      'saKIKKKKKIIIIWwwaLKa..',
      'YaIIIKKKKIIIIWWWrKKKK.',
      'waIaIKKKIaaIIWWWwKKIs.',
      'wsaaAaaaAAAIsWWWWKar..',
      '.wIaAAAAAAAIwWWWwIr...',
      '.YaAAAAAAAIsWWWWYr....',
      '......................',
    ],
    adultEye: [
      '........................',
      '........rrrrrrsa........',
      '......IIKKLLKIIsaa......',
      '.....KLLLLLLLLLLKKa.....',
      '....LLLLLLLLLLLLLLKaa...',
      '...LLKKKKIKKKIKLLLLLKKK.',
      '..KKKKKKa**IIssaKLLLLKK.',
      '.IKsKIIKKIaIIwwwsILKI...',
      '.KrwIaaKKKaaIwWwwKLI....',
      'sswwIaAaIaAAaWWWrKIa....',
      '.wwWsaAAAAAasWWwIas.....',
      '..YYwaaAaaaIrwsI........',
      '........................',
    ],
    babyEyeR: [
      '............a.........',
      '....raIKKIaass........',
      '...saKKLLLLKKIss......',
      '..rKLLLLLLLKKKKsY.....',
      '..ILLKKKKKKKKKLKas....',
      '.sKKKIaIKKKKIKLLLa....',
      '.IKKI***KKKKKsKLLLs...',
      '.KKKI**sKKKKKasILLI...',
      '.IKKKKKKKKKKKarsKLLs..',
      '.sKIIKKKKKKKKsWwaLLsrr',
      '.wIIaIKKKKIIIsWWwKKKK.',
      '.WIaaaKKKIIIIsWWWKKa..',
      '.WsaAAaaaAAaIwWWWKIY..',
      '.wraaAAAAAAaaWWWwaa...',
      '..YsAAAAAaaIwWWwwY....',
      '............r.........',
    ],
    adultEyeR: [
      '........................',
      '.........rrsss..........',
      '.....sIIKLLLLIIIa.......',
      '....IKLLLLLLLLLKKKK.....',
      '...ILLLLLLLLLLLLLLIa....',
      '..IKLKKKKKKKLIKLLLLLKKKI',
      '..KKKI**sKIIKaraKLLLLKK.',
      '.aKsKIIKKKIIIawrsILKIa..',
      'rKsrIaaKKIaaIawwrKLIa...',
      'sswwIaaaIaAaIrwwsLIs....',
      '.wWWaaAAAAAaIwWsKIs.....',
      '.YYYYaAAAAaIsrsIsr......',
      '...........r............',
    ],
    babySmile: [
      '.............l..........',
      '.U....llTuuuuuuulll..lUl',
      'UKUuuUKKKKKKKKKKKUUUUKKl',
      'UKKKKKKKKKKKKKKKKKKKKKK.',
      '.lKKKKKKKKUKKKKKKKKKKKl.',
      '..UKKKKUUUUUUUUUUKKKKT..',
      '..lKKKUUUuTuuuuUUUKKU...',
      '...lKUUuTTTTTTTTuUKKl...',
      '...lTUUTTTTTTTlTuUUll...',
      '....lluUuTTTllTuUTll....',
      '.....lllTuuuuuTTlll.....',
      '......llll+l+++lll......',
      '........ll+++lll........',
      '...........l............',
    ],
    adultSmile: [
      '.............l............',
      '.Ku...Tuuuuuuluuu......lUU',
      '.KKKUUUUuuuuuuuuuuuUUUUKK.',
      '.luKKKUUUUuuuUUUUUUUUKKUl.',
      '..luTTuuuUUUUUUUUUuUuuu...',
      '...lTTTTTlllllllllTTTT....',
      '....lTTTll+++l++llTTT.....',
      '.....lTTTlllllllllTT......',
      '.......llllllTTTTT........',
      '........lluTTTTTu.........',
      '............UU............',
    ],
    ear: [
      '....................',
      '.......LLbsDD.......',
      '....LLLLLLLbDDD.....',
      '...HLbmmbLLLLsDD....',
      '..LbsDDDDsbbLLsss...',
      '.mLsDssssDDbLLbss...',
      '.bbssmmsssDsbbbmsL..',
      '.LmsmLbbmmsDmbLLmL..',
      'DLmsmLLLmsDDsLLLLL..',
      '.LbmbLLmDDDDsLLLLb..',
      '.bbmmLLssssDbLLLLb..',
      '..LmbLLssssDbLLLbb..',
      '..LbmLLssmsssbLLbL..',
      '..bLbbLmsmssDsbLbb..',
      '...LLbbbmsmmsDbLbbb.',
      '...bLLbbbbLLLLLLbbbb',
      '.....LLbbbLbbLLLbbb.',
      '......bLLLLLLLLLmbb.',
      '........bLLLLLLbDm..',
      '............b.......',
    ],
  };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lids = new Map();
  for (const rows of [brushes.babyEye, brushes.babyEyeR, brushes.adultEye, brushes.adultEyeR]) {
    lids.set(
      rows,
      Array.from({ length: rows[0].length }, (_, x) => {
        const top = rows.findIndex((line) => line[x] !== '.');
        if (top < 0) return [0, 0];
        let bottom = rows.length;
        while (bottom > top && rows[bottom - 1][x] === '.') bottom--;
        return [top / rows.length, bottom / rows.length];
      }),
    );
  }
  const lipInks = {
    K: 'lipLine',
    U: 'upperLip',
    u: 'lipBody',
    T: 'lipPetal',
    l: 'lowerLip',
    '+': 'lipGlow',
    '*': 'lipGlow',
  };
  const earInks = { D: 'earFold', s: 'earShade', m: 'earWarm', b: 'earSkin', L: 'earLight', H: 'earGlow' };
  function mark(rows, x, y) {
    if (x < 0 || x >= 1 || y < 0 || y >= 1) return '.';
    return rows[Math.floor(y * rows.length)][Math.floor(x * rows[0].length)];
  }
  // Warp an age-specific open eye to this eye cut. On a blink the upper lid
  // occludes the iris from the top; the iris stays fixed on the eyeball.
  function eye(shape, off, h, blink, side, k, pixel, figure) {
    const q = off / (shape.width * (shape.infant ? 1.05 : 1.12));
    if (Math.abs(q) >= 1.09) return 0;
    const infant = shape.infant;
    const rows = infant
      ? side < 0
        ? brushes.babyEye
        : brushes.babyEyeR
      : side < 0
        ? brushes.adultEye
        : brushes.adultEyeR;
    const up = shape.up * (infant ? 1.1 : 1.18),
      down = shape.down * (infant ? 1.14 : 1.28);
    const u = q / 2.12 + 0.5;
    const cant = shape.tilt * q + (shape.curve - 0.65) * 0.043 * (1 - q * q);
    const v = (up - h + cant) / (up + down);
    const arch = Math.max(0, 1 - q * q);
    const shut = 0.72 + 0.14 * arch - 0.07 * q;
    if (blink > 0.035) {
      const top = 0.03 + 0.48 * (1 - arch) ** 1.8,
        edge = top + (shut - top) * blink;
      const width = 0.06 + Math.min(0.09, pixel / (up + down)) + 0.035 * arch;
      if (Math.abs(q) < 1 && Math.abs(v - edge) < width) return k.lash;
      if (v < edge || blink > 0.9) return 0;
    }
    if (u < 0 || u >= 1) return 0;
    const col = Math.floor(u * rows[0].length),
      bounds = lids.get(rows)[col];
    const outer = clamp((q - 0.42) / 0.6, 0, 1);
    const top = Math.max(bounds[0], 0.03 + 0.53 * outer * outer);
    const bottom = Math.min(bounds[1] - 0.12 * Math.abs(q) ** 1.6, 1 - 0.41 * outer ** 1.4);
    if (bottom <= top || v > bottom) return 0;
    if (v < top && blink < 0.5 && Math.abs(q) < 0.85) {
      const above = top - v;
      return above < 0.12 * arch ? k.lidVeil : 0;
    }
    const glyph = mark(rows, u, v);
    if (glyph === '.') return 0;
    const edge = (v - top) / Math.max(0.06, bottom - top);
    if (edge < 0.1 && (glyph === 's' || glyph === 'r')) return k.lidSkin;
    if (edge < (infant ? 0.185 : 0.235) + 0.105 * Math.max(0, q) || (u > 0.83 && glyph === 'L'))
      return k.lash;
    if (edge > 0.94 && u > 0.68) return k.lidRim;
    // The iris is convex and the lid cuts across it. Keep a single connected
    // amber mass into the visible lateral arc, including at exact profile.
    const ix = (u - (0.47 + 0.019 * side)) / (infant ? 0.31 : 0.292),
      iz = (v - (infant ? 0.63 : 0.65)) / (infant ? 0.5 : 0.51);
    const circle = ix * ix + iz * iz;
    if (circle > 1) return edge < 0.34 || (Math.abs(q) > 0.85 && edge < 0.65) ? k.scleraShade : k.sclera;
    const shine = figure ? clamp((1.3 * pixel) / (up + down), 0.17, 0.36) : 0.17;
    if (blink < 0.5 && ((side * ix + 0.29) / shine) ** 2 + ((iz + 0.32) / (shine * 1.15)) ** 2 < 1)
      return k.glint;
    if (circle > 0.82) return k.irisRim;
    if ((ix / 0.43) ** 2 + ((iz + 0.08) / 0.51) ** 2 < 1) return k.pupil;
    if (iz < -0.2) return k.irisShadow;
    if (iz > 0.14) return ix * side < 0.35 && iz > 0.48 ? k.irisHoney : k.irisLight;
    return k.eyes;
  }
  // The guide's eye has a continuous dark upper arc and one open wedge of white.
  // Evaluate these marks on the adjustable lid surface so they foreshorten at profile.
  function modelEye(shape, off, h, blink, side, k, pitch) {
    const x = off / shape.width;
    if (Math.abs(x) >= 1) return 0;
    const arch = Math.sqrt(1 - x * x);
    const tilt = shape.tilt * x;
    const upper = 1.16 * shape.up * arch + tilt;
    const lower = -1.44 * shape.down * (0.48 * arch + 0.52 * Math.min(1, 2 * arch)) + tilt;
    const closed = 0.22 * upper + 0.78 * lower;
    const lid = upper + blink * (closed - upper);
    const floor = lower + blink * (closed - lower);
    const stroke = Math.max(0.021, Math.min(0.044, 0.67 * pitch)) * (0.73 + 0.27 * arch);
    if (h > lid + stroke || h < floor - stroke * 0.22) return 0;
    if (h > lid - stroke || blink > 0.91) return k.lash;
    const v = (upper - h) / (upper - lower);
    const irisX = (x + 0.10) / (shape.infant ? 0.77 : 0.71);
    if (irisX * irisX + ((v - 0.47) / 0.72) ** 2 > 1)
      return v < 0.26 || x > 0.79 ? k.scleraShade : k.sclera;
    const glint = Math.min(0.25, Math.max(0.115, pitch / (upper - lower)));
    if (blink < 0.36 && ((side * irisX + 0.29) / (glint * 1.4)) ** 2 + ((v - 0.32) / glint) ** 2 < 1)
      return k.glint;
    if (v > 0.72 && Math.abs(irisX) < 0.77) return k.eyes;
    return Math.abs(irisX) < 0.58 ? k.pupil : k.irisShadow;
  }
  function modelMouth(name, row, lateral, h, infant, k, pitch) {
    if (infant && (name === 'smile' || name === 'soft-smile'))
      return mouth(name, row, lateral, h, infant, k);
    const [, width, up, down, lift] = row;
    const x = Math.abs(lateral) / width;
    if (x >= 1) return 0;
    const mass = 1 - x * x;
    const offset = h - lift * x * x;
    const line = Math.max(0.012, Math.min(0.030, pitch * 0.55));
    if (Math.abs(offset) < line) return k.lipLine;
    if (offset > 0 && offset < up * 0.50 * mass) return k.upperLip;
    if (offset < 0 && -offset < down * 0.82 * mass) return k.lowerLip;
    return 0;
  }
  function brow(row, v, h, k, infant, pitch) {
    const [, span, base, arch, tilt, thick, peak, cut] = row,
      q = v / span;
    if (Math.abs(q) >= 1 || (cut === 'slit' && q > 0.23 && q < 0.52)) return 0;
    const bow = cut === 'peak' ? 1 - Math.abs(q - peak) * 0.92 : 1 - (q - peak) ** 2 * 0.72;
    const mid = base - 0.037 + 0.7 * arch * bow + (0.62 * tilt - (infant ? 0.024 : 0.035)) * q;
    const width =
      thick *
      (infant ? 1.65 : 1.31) *
      (1 - 0.39 * q - 0.31 * q * q) *
      (cut === 'taper' && q > 0 ? 1 - 0.38 * q : 1);
    const edge = width - Math.abs(h - mid);
    if (edge < -0.35 * pitch) return 0;
    if (edge < 0.23 * pitch) return k.browVeil;
    return h - mid > 0.35 * width || (cut === 'feather' && Math.cos(23 * q) > 0.65) ? k.browSoft : k.browDeep;
  }
  function mouth(name, row, v, h, infant, k) {
    const [, width, up, down, lift, bow] = row;
    const q = Math.abs(v) / width;
    const open = infant && (name === 'smile' || name === 'soft-smile');
    const rows = open ? brushes.babySmile : brushes.adultSmile;
    const u = 0.5 + q / 2.12;
    const top = up * (open ? 0.98 : 1.06) + 0.025,
      bottom = down * (open ? 2.27 : 1.3) + 0.014;
    const seam = (lift - (open ? 0.07 : 0.06)) * 0.68 * q * q - (open ? 0.003 : 0.006);
    const y = (top - h + seam - bow * 0.012 * Math.max(0, 1 - q * 3)) / (top + bottom);
    const glyph = mark(rows, u, y);
    return glyph === '.' ? 0 : k[lipInks[glyph]];
  }
  function ear(forward, height, outward, k) {
    const glyph = mark(brushes.ear, 0.51 + 0.475 * forward, 0.5 - 0.49 * height);
    if (glyph === '.' || outward < 0.25) return outward < 0 ? k.earShade : k.earSkin;
    return k[earInks[glyph]];
  }
  function dye(m, colors, tint) {
    const skin = colors.skin.slice(1),
      iris = colors.eyes.slice(1),
      hair = colors.hair.slice(1);
    const lip = colors.lip?.slice(1) || tint(skin, 'cf684d', 0.5);
    // Relative pigments keep the highlights, warmth and shadow hues for every skin dye.
    // White and black dye still have visible lit and unlit yarn/locks.
    function scale(hex, r, g, b) {
      return [r, g, b]
        .map((n, i) =>
          Math.min(255, Math.round(parseInt(hex.slice(2 * i, 2 * i + 2), 16) * n))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('');
    }
    const daylight = tint(scale(skin, 1.18, 1.1, 1.0), 'ffe0a9', 0.105);
    const half = tint(skin, scale(skin, 1.13, 0.97, 0.9), 0.64);
    const shadow = tint(scale(skin, 0.66, 0.48, 0.44), '372126', 0.16);
    for (let warmth = 0; warmth < 4; warmth++) {
      const mid = tint(half, scale(half, 1.15, 0.86, 0.78), warmth * 0.26);
      const warmLight = tint(daylight, scale(daylight, 1.06, 0.94, 0.86), warmth * 0.2);
      for (let i = 0; i < 12; i++)
        m['skinPlane' + (12 * warmth + i)] =
          i < 5 ? tint(shadow, mid, i / 5) : tint(mid, warmLight, (i - 5) / 6);
    }
    m.lidVeil = tint(half, shadow, 0.22);
    m.lidSkin = tint(skin, shadow, 0.4);
    m.lidRim = tint(half, lip, 0.32);
    m.lash = tint(scale(iris, 0.29, 0.24, 0.23), '231311', 0.45);
    m.pupil = tint(scale(iris, 0.44, 0.36, 0.31), '22120f', 0.41);
    m.irisShadow = tint(iris, '642f20', 0.38);
    m.eyes = tint(scale(iris, 1.25, 1.13, 0.96), iris, 0.2);
    m.irisLight = tint(iris, 'e7a054', 0.62);
    m.irisHoney = tint(m.irisLight, 'ffd899', 0.43);
    m.glint = 'fff3cf';
    m.sclera = 'ffe6c9';
    m.scleraShade = tint('efcbb2', half, 0.19);
    m.browDeep = tint(colors.brow?.slice(1) || tint(hair, shadow, 0.38), shadow, 0.13);
    m.browSoft = tint(m.browDeep, half, 0.29);
    m.browVeil = tint(m.browDeep, half, 0.65);
    m.lipLine = tint(scale(lip, 0.43, 0.33, 0.36), '45211f', 0.4);
    m.upperLip = tint(scale(lip, 0.79, 0.62, 0.6), shadow, 0.13);
    m.lipBody = tint(m.upperLip, lip, 0.54);
    m.irisRim = tint(iris, '4f2d21', 0.64);
    m.lipPetal = tint(lip, 'cd6952', 0.3);
    m.lowerLip = tint(lip, 'e38d68', 0.41);
    m.lipGlow = tint(m.lowerLip, 'ffd2a3', 0.61);
    m.earFold = tint(shadow, '6d3524', 0.29);
    m.earShade = tint(shadow, half, 0.34);
    m.earWarm = tint(shadow, half, 0.66);
    m.earSkin = tint(half, 'd38358', 0.26);
    m.earLight = tint(daylight, 'efaa76', 0.22);
    m.earGlow = tint(m.earLight, 'ffd29e', 0.32);
    m.wingSkin = tint(half, lip, 0.33);
    m.noseShade = tint(m.wingSkin, shadow, 0.63);
    m.nostril = tint(shadow, '522821', 0.39);
    m.noseLight = tint(daylight, 'ffdc9f', 0.58);
    m.noseGlow = tint(m.noseLight, 'fff1c1', 0.66);
    m.cheekSpark = tint(daylight, 'ffc79b', 0.4);
    for (let i = 0; i < 4; i++) m['neckTone' + i] = tint(shadow, daylight, 0.39 + 0.13 * i);
    const hat = m.hatMain || 'c8ad92';
    for (const [prefix, base] of [
      ['weave', hat],
      ['lock', hair],
    ]) {
      const deep = tint(scale(base, 0.32, 0.25, 0.24), '382323', 0.28);
      const hi = tint(scale(base, 1.25, 1.19, 1.1), 'ffe2bc', 0.28);
      for (let i = 1; i <= 8; i++)
        m[prefix + i] = i <= 5 ? tint(deep, base, (i - 1) / 4) : tint(base, hi, (i - 5) / 3);
    }
    m.hairDepth = tint(m.hairDepth, m.lock2, 0.18);
    m.hairMid = tint(m.hairMid, m.lock3, 0.17);
    m.hairSheen = tint(m.hairSheen, m.lock6, 0.27);
    m.hairHighlight = tint(m.hairHighlight, m.lock8, 0.27);
  }
  function complexion(y, h, light, forward, eyeH, mouthH, infant, k, planes, underside, model = false) {
    const rel = (eyeH - h) / (eyeH - mouthH),
      across = Math.abs(y);
    const cheek = Math.max(0, 1 - ((across - 0.66) / 0.34) ** 2 - ((rel - 0.54) / 0.45) ** 2);
    const temple = Math.max(0, 1 - ((across - 0.49) / 0.38) ** 2 - ((rel + 0.19) / 0.51) ** 2);
    const under = Math.max(0, 1 - ((rel - 1.24) / 0.16) ** 2 - (across / 0.35) ** 2);
    const chin = Math.max(0, 1 - ((rel - (infant ? 1.42 : 1.47)) / 0.29) ** 2 - (across / 0.47) ** 2);
    const cheekGleam = ((across - (y < 0 ? 0.676 : 0.701)) / 0.05) ** 2 + ((rel - 0.424) / 0.033) ** 2;
    if (!model && cheekGleam < 1 && light > 0.35) return k.cheekSpark;
    const turn = Math.max(0, Math.min(1, (0.94 - across) / 0.49));
    const front = clamp((forward + 0.18) / 1.16, 0, 1);
    const jawTurn = clamp((rel - 0.96) / 0.64, 0, 1) * (1 - 0.74 * front);
    const jawLight = rel > 0.81 ? Math.max(light, 0.49) : light;
    const lit = 5.2 + 12.2 * (jawLight - 0.58) + 2.6 * front + 0.85 * turn
      - 2.45 * temple - 1.55 * under + 1.48 * chin + 1.08 * cheek
      - 1.85 * jawTurn - 0.98 * Math.max(0, rel - 1.61);
    const value = clamp(Math.round(lit + (3.5 + 0.88 * front - lit) * underside), 0, 11);
    if (model) {
      // Four large skin planes survive downsampling. Warmth stays below the eye
      // and the lower cheek rolls gradually into the underside of the chin.
      const tone = value <= 2 ? 2 : value <= 4 ? 4 : value <= 7 ? 7 : 10;
      return k[planes[(cheek > 0.53 ? 12 : 0) + tone]];
    }
    return k[planes[12 * Math.round(cheek * 2.9) + value]];
  }
  // The gathered hair has front, oblique and side cuts. Decode
  // their indexed volumes once. A hairstyle change never replaces the face.
  let knotCells;
  function sweptBun(brush, k, fit) {
    const { bounds, size } = pineHeadwearCuts,
      [x0, x1, y0, y1, z0, z1] = bounds,
      [nx, ny, nz] = size;
    if (!knotCells) {
      const cells = new Uint8Array(nx * ny * nz);
      const lengths = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let cursor = 0;
      for (const layer of pineHeadwearCuts.knot) {
        for (let i = 0; i < layer.length; i += 2) {
          const end = cursor + lengths.indexOf(layer[i]) + 1,
            color = layer.charCodeAt(i + 1) - 48;
          if (color) cells.fill(color, cursor, end);
          cursor = end;
        }
      }
      knotCells = cells;
    }
    const inks = Array.from({ length: 9 }, (_, i) => (i ? k['lock' + i] : 0));
    const { x: cx, z: cz, rx, ry, rz } = fit;
    brush.stamp(
      cx + (x0 - 0.18) * rx,
      cx + x1 * rx,
      y0 * ry,
      y1 * ry,
      cz + z0 * rz,
      cz + z1 * rz,
      (x, y, z) => {
        const h = (z - cz) / rz,
          v = y / ry;
        const u = fit.posterior ? fit.posterior.unfit((x - cx) / rx, h) : (x - cx) / rx;
        const i = Math.round(((u - x0) * (nx - 1)) / (x1 - x0)),
          j = Math.round(((v - y0) * (ny - 1)) / (y1 - y0)),
          l = Math.round(((h - z0) * (nz - 1)) / (z1 - z0));
        if (i < 0 || i >= nx || j < 0 || j >= ny || l < 0 || l >= nz) return 0;
        return inks[knotCells[(l * ny + j) * nx + i]];
      },
    );
  }
  function templeLocks(b, k, fit, front) {
    // A tapered S-shaped lock on each temple, clear of the eye and ear canal.
    const { x, z, rx, ry, rz } = fit;
    for (const sign of [-1, 1]) {
      // A broad wave sweeps out from the part before turning down at the
      // temple. Anchor it on this face's forehead so it also fits wider heads.
      const crest =
        sign < 0
          ? [
              [0.035, 0.77],
              [0.27, 1.04],
              [0.52, 0.99],
              [0.63, 0.71],
              [0.72, 0.51],
              [0.89, 0.27],
              [1.04, 0.22],
            ]
          : [
              [0.015, 0.78],
              [0.22, 1.03],
              [0.47, 0.94],
              [0.57, 0.71],
              [0.64, 0.56],
              [0.88, 0.43],
              [1.04, 0.51],
            ];
      let from, thick;
      for (let n = 0; n <= 18; n++) {
        const j = n <= 9 ? 0 : 3,
          t = (n <= 9 ? n : n - 9) / 9,
          s = 1 - t;
        const [v, h] = crest[j].map(
          (a, k) =>
            s * s * s * a +
            3 * s * s * t * crest[j + 1][k] +
            3 * s * t * t * crest[j + 2][k] +
            t * t * t * crest[j + 3][k],
        );
        const py = sign * v * ry,
          pz = z + h * rz,
          px = front(py, pz) + rx * (0.068 + 0.06 * Math.sin((n * Math.PI) / 18));
        const to = [px, py, pz],
          radius = ry * (0.025 + 0.171 * Math.sin(Math.PI * (0.13 + (0.87 * n) / 18)) ** 0.78);
        if (from)
          b.link(from, to, thick, radius, 1.1, (_local, dx, dy, dz) => {
            const plane = (0.8 * dx + 0.62 * dz - 0.27 * dy) / Math.max(radius, 0.01);
            return plane > 0.78
              ? k.lock8
              : plane > 0.42
                ? k.lock7
                : plane > 0.04
                  ? k.lock5
                  : plane > -0.4
                    ? k.lock4
                    : k.lock2;
          });
        from = to;
        thick = radius;
      }
      const ctrl = [
        [0.62, 0.54, 0.83],
        [0.65, 0.84, 0.69],
        [0.51, 0.98, 0.4],
        [0.42, 1.03, 0.18],
        [0.33, 1.06, 0.01],
        [0.45, 1.08, -0.18],
        [0.39, 1.12, -0.27],
        [0.34, 1.14, -0.4],
        [0.19, 1.09, -0.46],
        [0.22, 1.05, sign < 0 ? -0.61 : -0.53],
      ];
      let prev, radius;
      for (let i = 0; i <= 21; i++) {
        const j = Math.min(2, Math.floor(i / 7)) * 3,
          t = (i - (j / 3) * 7) / 7,
          s = 1 - t;
        const p = ctrl[j].map(
          (a, k) =>
            s * s * s * a +
            3 * s * s * t * ctrl[j + 1][k] +
            3 * s * t * t * ctrl[j + 2][k] +
            t * t * t * ctrl[j + 3][k],
        );
        const next = [x + p[0] * rx, sign * p[1] * ry, z + p[2] * rz];
        const r = (0.014 + 0.112 * (1 - (i / 21) ** 1.3)) * ry;
        if (prev)
          b.link(prev, next, radius, r, 1.02, (_t, dx, dy, dz) =>
            dx > 0.27 * r && sign * dy > -0.1 * r
              ? dz > 0
                ? k.lock7
                : k.lock6
              : sign * dy > 0
                ? k.lock5
                : k.lock3,
          );
        prev = next;
        radius = r;
      }
    }
  }
  const painted = [
    'earFold',
    'earShade',
    'earWarm',
    'earSkin',
    'earLight',
    'earGlow',
    'irisHoney',
    'lidVeil',
    'browVeil',
    'lipBody',
    'lipPetal',
    'noseGlow',
    'cheekSpark',
    ...Array.from({ length: 8 }, (_, i) => 'weave' + (i + 1)),
    ...Array.from({ length: 8 }, (_, i) => 'lock' + (i + 1)),
  ];
  return { eye, modelEye, modelMouth, brow, mouth, ear, dye, complexion, sweptBun, templeLocks, painted };
})();
