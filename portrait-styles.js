// Portrait profiles are measured in head radii. Pigment marks follow the surface as the head turns.
const pinePortraitStyles = (() => {
  // Brush sizes are fractions of the same head radii used by the skin and rig.
  // The randomizer also uses these dimensions to reserve space between features.
  const proportions = {
    standard: { outlineStrength: 1, eyeCenter: 0.485, eyeWidth: 1, eyeOpen: 1, browWidth: 1, browHeight: 1,
      noseWidth: 1, noseLength: 1, noseReach: 1, lipWidth: 1, lipHeight: 1 },
    baby: { outlineStrength: 0.46, eyeCenter: 0.456, eyeWidth: 1.035, eyeOpen: 1.12, browWidth: 0.80, browHeight: 0.84,
      noseWidth: 0.84, noseLength: 0.68, noseReach: 0.65, lipWidth: 0.78, lipHeight: 0.86 }
  };
  const morphs = {
    cheekHeight: ['颧骨高低', '低', '高'], cheekWidth: ['颧部宽度', '窄', '宽'],
    cheekProjection: ['颧骨前凸', '平缓', '突出'], cheekFullness: ['下颊丰满度', '清瘦', '饱满'],
    eyeDepth: ['眼窝深浅', '浅', '深'], eyeWidth: ['眼裂宽度', '窄', '宽'],
    eyeOpening: ['眼睑开合', '收窄', '舒展'], eyeTilt: ['眼尾倾角', '下垂', '上扬'],
    browHeight: ['眉眼距离', '近', '远'], noseBridge: ['鼻梁前伸', '平缓', '高挺'],
    noseWidth: ['鼻翼宽度', '窄', '宽'], mouthWidth: ['唇宽', '窄', '宽'],
    upperLipFullness: ['上唇厚度', '薄', '厚'], lowerLipFullness: ['下唇厚度', '薄', '厚']
  };
  const profileControls = {
    lipProjection: ['嘴唇前后', '内收', '前伸'],
    jawDefinition: ['下颌线清晰度', '柔和', '清晰']
  };
  const basicNoses = {
    classic: ['', 0.172, 0.197, 0.32, 0.10, 0.48, 0.099],
    button: ['', 0.158, 0.155, 0.26, 0.085, 0.59, 0.122],
    wide: ['', 0.235, 0.191, 0.30, 0.09, 0.82, 0.107],
    bridge: ['', 0.148, 0.255, 0.34, 0.178, 0.37, 0.089]
  };
  // label, half span, upper and lower lids, outer-corner lift, curve, double-lid crease
  const eyes = {
    upturned: ['上挑眼', 0.277, 0.105, 0.06, 0.099, 1.0, 0.047],
    downturned: ['垂眼尾', 0.278, 0.118, 0.075, -0.09, 0.85, 0.032],
    monolid: ['单眼皮', 0.27, 0.072, 0.062, 0.034, 0.78, 0],
    hooded: ['内双眼', 0.256, 0.066, 0.078, -0.008, 1.05, 0.045],
    'double-lid': ['宽双眼皮', 0.265, 0.13, 0.078, 0.032, 0.92, 0.08],
    'deep-set': ['深眼窝', 0.244, 0.093, 0.079, -0.016, 0.75, 0.113],
    'doe-eye': ['鹿眼', 0.233, 0.155, 0.111, 0.043, 0.57, 0.035],
    crescent: ['月牙眼', 0.267, 0.09, 0.037, 0.051, 1.16, 0],
    'long-almond': ['长杏眼', 0.307, 0.087, 0.051, 0.069, 0.89, 0.033],
    sleepy: ['半垂眼睑', 0.269, 0.036, 0.078, -0.036, 0.74, 0.065],
    'soft-oval': ['椭圆眼', 0.251, 0.127, 0.1, -0.025, 0.62, 0],
    'level-eye': ['平眼尾', 0.292, 0.085, 0.081, 0, 0.91, 0]
  };
  // label, half span, baseline, arch, outer lift, thickness, arch peak, texture
  const brows = {
    willow: ['柳叶眉', 0.315, 0.224, 0.078, 0.081, 0.034, 0.23, 'plain'],
    angled: ['眉峰眉', 0.303, 0.214, 0.12, 0.016, 0.055, 0.36, 'peak'],
    feathered: ['野生眉', 0.32, 0.205, 0.051, 0.042, 0.074, 0.06, 'feather'],
    fine: ['细弧眉', 0.29, 0.26, 0.082, 0.008, 0.029, 0.12, 'plain'],
    'short-brow': ['短圆眉', 0.208, 0.244, 0.038, -0.009, 0.063, -0.04, 'plain'],
    tapered: ['渐细长眉', 0.329, 0.19, 0.059, 0.052, 0.059, 0.15, 'taper'],
    descending: ['八字眉', 0.285, 0.231, 0.036, -0.091, 0.06, -0.12, 'plain'],
    lifted: ['上扬剑眉', 0.329, 0.218, 0.022, 0.111, 0.059, 0.3, 'taper'],
    'low-flat': ['低平眉', 0.294, 0.157, 0.012, -0.014, 0.06, 0, 'plain'],
    'brow-slit': ['断眉', 0.3, 0.224, 0.045, 0.043, 0.068, 0.23, 'slit']
  };
  // label, width, reach, tip below the eyes, bridge root, wing strength, tip height
  const noses = {
    straight: ['直鼻', 0.157, 0.211, 0.312, 0.16, 0.39, 0.097],
    upturned: ['微翘鼻', 0.179, 0.23, 0.239, 0.09, 0.55, 0.114],
    slender: ['窄鼻', 0.127, 0.171, 0.339, 0.1, 0.31, 0.083],
    rounded: ['圆润鼻尖', 0.2, 0.227, 0.298, 0.08, 0.64, 0.134],
    aquiline: ['弧形鼻梁', 0.163, 0.262, 0.352, 0.18, 0.45, 0.096],
    broad: ['宽鼻梁', 0.244, 0.168, 0.292, 0.13, 0.7, 0.092],
    short: ['短鼻', 0.152, 0.132, 0.236, 0.057, 0.44, 0.087],
    long: ['长鼻尖', 0.178, 0.256, 0.39, 0.145, 0.49, 0.112]
  };
  // label, half width, upper lip, lower lip, outer lift, cupid's bow, parted lip
  const mouths = {
    bow: ['唇峰唇', 0.251, 0.087, 0.068, 0.019, 0.66, 0],
    thin: ['薄唇', 0.283, 0.037, 0.038, 0.005, 0.17, 0],
    'lower-full': ['下唇丰润', 0.263, 0.042, 0.106, 0.018, 0.32, 0],
    'upper-full': ['上唇丰润', 0.268, 0.095, 0.048, 0.014, 0.41, 0],
    wide: ['宽唇', 0.331, 0.058, 0.059, 0.025, 0.31, 0],
    relaxed: ['放松唇', 0.262, 0.061, 0.067, -0.019, 0.33, 0.024],
    pursed: ['轻抿唇', 0.205, 0.041, 0.038, -0.04, 0.22, 0],
    'soft-smile': ['浅笑唇', 0.294, 0.054, 0.075, 0.08, 0.37, 0.016]
  };
  const outlines = {
    oval: ['鹅蛋脸', 0.025, -0.066, -0.015],
    round: ['圆脸', 0.09, 0.134, -0.018],
    square: ['方圆脸', 0.03, 0.207, 0.035],
    heart: ['心形脸', 0.103, -0.173, 0.065],
    long: ['长窄脸', -0.089, -0.074, -0.064],
    diamond: ['菱形脸', 0.142, -0.123, -0.077],
    pear: ['梨形脸', -0.05, 0.122, -0.068]
  };
  const labels = (profiles) => Object.fromEntries(Object.entries(profiles).map(([id, row]) => [id, row[0]]));
  const features = { eyes: labels(eyes), brows: labels(brows), nose: labels(noses), mouth: labels(mouths) };
  const details = {
    outline: labels(outlines),
    iris: {
      limbal: '深色瞳缘',
      sunburst: '放射纹虹膜',
      'two-tone': '双环虹膜',
      amber: '琥珀内环',
      large: '大瞳仁'
    },
    complexion: {
      freckles: '两颊雀斑',
      sunspots: '鼻梁雀斑',
      'left-mole': '左眼下痣',
      'lip-mole': '唇边痣',
      dimples: '浅酒窝',
      'beauty-spots': '散点美人痣',
      'fine-lines': '眼角细纹',
      'smile-lines': '笑纹',
      birthmark: '面颊胎记',
      'cheek-scar': '浅色颊痕'
    },
    makeup: {
      blush: '桃色腮红',
      draping: '斜扫腮红',
      eyeliner: '细眼线',
      winged: '上扬眼线',
      shadow: '柔雾眼影',
      shimmer: '眼角提亮'
    },
    facialHair: {
      stubble: '短胡茬',
      moustache: '短髭',
      pencil: '细胡须',
      handlebar: '翘角胡',
      goatee: '山羊胡',
      chinstrap: '下颌胡线',
      beard: '短络腮胡',
      sideburns: '长鬓角'
    }
  };
  const dyes = { brow: '眉色', lip: '唇色', leftEye: '左瞳色', makeup: '妆色', beard: '胡须色' };
  function color(colors, key) {
    return (
      colors[key] ||
      { brow: colors.hair, beard: colors.hair, leftEye: colors.eyes, lip: '#ad756d', makeup: '#c28a85' }[key]
    );
  }
  function materials(colors, tint) {
    const ink = {};
    for (const key of Object.keys(dyes)) {
      const base = color(colors, key).slice(1);
      ink[key + 'Pigment'] = base;
      ink[key + 'Deep'] = tint(base, '302935', 0.43);
      ink[key + 'Soft'] = tint(base, colors.skin.slice(1), 0.45);
    }
    ink.mark = tint(colors.skin.slice(1), '6b453c', 0.64);
    ink.skinFold = tint(colors.skin.slice(1), '725854', 0.34);
    ink.skinMark = tint(colors.skin.slice(1), '92574e', 0.5);
    ink.scar = tint(colors.skin.slice(1), 'ead0b7', 0.57);
    ink.makeupGlint = tint(color(colors, 'makeup').slice(1), 'fff0da', 0.67);
    ink.irisGold = tint(colors.eyes.slice(1), 'daae63', 0.6);
    if (colors.lip) {
      ink.upperLip = tint(colors.lip.slice(1), '775054', 0.23);
      ink.lowerLip = tint(colors.lip.slice(1), 'f4cebb', 0.32);
      ink.lipLine = tint(colors.lip.slice(1), '573d42', 0.41);
      ink.lips = ink.upperLip;
    }
    return ink;
  }
  function outlineWidth(row, h) {
    const peak = (at, span) => Math.max(0, 1 - ((h - at) / span) ** 2) ** 2;
    return 1 + row[1] * peak(-0.12, 0.51) + row[2] * peak(-0.57, 0.43) + row[3] * peak(0.45, 0.46);
  }
  function jawBreadth(outline, jaw, h, outlineStrength = 1) {
    const jawScale = 1 + 0.82 * (jaw - 1) * Math.max(0, Math.min(1, -h));
    const width = outline ? outlineWidth(outline, h) : 1;
    return jawScale * (outlineStrength === 1 ? width : 1 + outlineStrength * (width - 1));
  }
  function eye(row, v, h, blink, side, k, irisSpan = 1) {
    const [, width, up, down, tilt, power, crease] = row,
      q = v / width;
    if (Math.abs(q) >= 1) return 0;
    const curve = (1 - q * q) ** power,
      open = 1 - blink,
      pos = h - tilt * q + 0.047 * blink;
    const top = up * curve * open,
      bottom = -down * curve * open;
    if (
      crease &&
      open > 0.24 &&
      Math.abs(pos - top - crease * (0.4 + 0.6 * curve)) < 0.014 &&
      q > -0.78 &&
      q < 0.83
    )
      return k.browSoft;
    if (pos > top + 0.021 || pos < bottom - 0.014) return 0;
    if (blink > 0.86 || pos > top - 0.017) return k.lash;
    if (pos < bottom + 0.012 && q > 0.18) return k.browSoft;
    const iris = (q / (0.5 * irisSpan)) ** 2 + ((pos - 0.009) / 0.127) ** 2;
    if (iris > 1) return k.sclera;
    if (q * side > -0.28 && q * side < -0.085 && pos > 0.014 && pos < 0.06) return k.glint;
    return iris < 0.22 ? k.pupil : pos < -0.015 ? k.irisLight : k.eyes;
  }
  function brow(row, v, h, k) {
    const [, span, base, arch, tilt, thick, peak, cut] = row,
      q = v / span;
    if (Math.abs(q) >= 1 || (cut === 'slit' && q > 0.24 && q < 0.53)) return 0;
    const arc = cut === 'peak' ? 1 - Math.abs(q - peak) * 0.85 : 1 - (q - peak) ** 2 * 0.77;
    const line = base + arch * arc + tilt * q,
      width = thick * (1 - 0.32 * Math.abs(q) - (cut === 'taper' ? 0.5 : 0.23) * Math.max(0, q));
    const d = h - line;
    if (Math.abs(d) > width) return 0;
    if (cut === 'feather' && d > 0 && Math.cos(29 * q - 18 * d) < -0.25) return k.browSoft;
    return d > width * 0.31 ? k.browSoft : k.lash;
  }
  function mouth(row, v, h, k, pixel) {
    const [, width, up, down, lift, bow, gap] = row,
      q = Math.abs(v) / width;
    if (q >= 1) return 0;
    const taper = 1 - q * q,
      mid = lift * q * q - 0.008;
    const upper = up * taper * (1 - bow * Math.min(1, Math.abs(q - 0.35) * 2.25));
    const coverage = pixel * (1 - 0.68 * q);
    if (h > mid + upper + coverage || h < mid - down * taper - coverage) return 0;
    if (Math.abs(h - mid) < (gap || 0.014) * taper + 0.006) return k.lipLine;
    return h > mid ? k.upperLip : k.lowerLip;
  }
  function noseUnderside(row, shapedTip) {
    return Math.max(0.105, shapedTip ? 1.25 * row[6] : Math.min(0.11, row[6]));
  }
  function nose(row, b, k, fit, eyeZ, front, widthScale = 1, bridgeScale = 1, reachScale = 1, shapedTip = false) {
    const [, baseWidth, baseReach, length, start, wingStrength, tipHeight] = row,
      { x: cx, rx, ry, rz } = fit;
    const reach = baseReach * reachScale * (shapedTip ? 0.92 : 1);
    const maxWidth = baseWidth * Math.max(1, widthScale) * ry;
    const root = eyeZ + start * rz,
      tip = eyeZ - length * rz;
    const underside = shapedTip ? noseUnderside(row, true) : 0.11;
    b.stamp(cx + 0.49 * rx, cx + (1.46 + Math.max(0, bridgeScale - 1) * reach) * rx, -maxWidth, maxWidth, tip - underside * rz, root, (x, y, z) => {
      const t = (root - z) / (root - tip);
      const wingBlend = Math.min(1, Math.max(0, (t - 0.15) / 0.65));
      const width = baseWidth * (1 + (widthScale - 1) * wingBlend * wingBlend * (3 - 2 * wingBlend));
      const q = y / (width * ry), h = (z - tip) / rz;
      if (t < 0 || Math.abs(q) >= 1) return 0;
      const bridgeWidth = shapedTip ? 0.49 + 0.20 * t : 0.39 + 0.19 * t;
      const bridge =
        Math.max(0, 1 - (q / bridgeWidth) ** 2) *
        Math.min(1, t) *
        Math.max(0, Math.min(1, (1.19 - t) / 0.29));
      const bulb = Math.max(0, 1 - (q / 0.66) ** 2 - (h / (shapedTip && h < 0 ? underside : tipHeight)) ** 2);
      const wing = Math.max(0, 1 - ((Math.abs(q) - 0.63) / 0.38) ** 2 - ((h + 0.032) / 0.073) ** 2);
      const offset = Math.max(bridge * bridgeScale, bulb, wing * wingStrength),
        surface = front(y, z);
      if (offset < 0.045 || x < surface - 0.12 * rx || x > surface + reach * rx * offset) return 0;
      if (shapedTip && h < -0.029 && h > -0.085 && Math.abs(q) > 0.47 && Math.abs(q) < 0.91 && wing > 0.16)
        return k.noseShade;
      if (wing > 0.25 && h < -0.024 && Math.abs(q) > 0.38 && Math.abs(q) < 0.75) return k.noseShade;
      return h < -0.025 || q > 0.44 ? k.faceEdge : q < -0.19 && q > -0.62 ? k.noseLight : k.faceMid;
    });
  }
  function iris(style, pigment, v, h, side, twoEyes, k) {
    if (pigment !== k.eyes && pigment !== k.irisLight && pigment !== k.pupil && pigment !== k.eyeRim)
      return pigment;
    const dyed = twoEyes && side > 0,
      main = dyed ? k.leftEyePigment : k.eyes,
      dark = dyed ? k.leftEyeDeep : k.pupil;
    const r = (v / 0.137) ** 2 + (h / 0.125) ** 2;
    if (style === 'limbal' && r > 0.46) return dark;
    if (style === 'large' && r < 0.73) return dark;
    if (style === 'two-tone' && r > 0.22 && r < 0.63) return dyed ? k.leftEyeSoft : k.irisLight;
    if (style === 'amber' && r < 0.7 && r > 0.12) return k.irisGold;
    if (style === 'sunburst' && r > 0.18 && Math.cos(9 * Math.atan2(h, v)) > 0.03)
      return dyed ? k.leftEyeSoft : k.irisLight;
    if (!dyed) return pigment;
    return pigment === k.pupil || pigment === k.eyeRim
      ? dark
      : pigment === k.irisLight
        ? k.leftEyeSoft
        : main;
  }
  const dots = [
    [-0.77, -0.17],
    [-0.62, -0.21],
    [-0.54, -0.14],
    [-0.71, -0.27],
    [0.48, -0.19],
    [0.59, -0.13],
    [0.7, -0.24],
    [0.78, -0.18]
  ];
  const bridgeDots = [
    [-0.52, -0.15],
    [-0.36, -0.13],
    [-0.21, -0.12],
    [-0.08, -0.16],
    [0.12, -0.14],
    [0.27, -0.11],
    [0.43, -0.15],
    [0.6, -0.18]
  ];
  function skinInk(face, u, v, h, eyeH, mouthH, eyeOffset, k) {
    const a = Math.abs(v),
      eye = h - eyeH,
      lip = h - mouthH;
    if (face.complexion && u > 0.26 && eye < 0.01 && h > -0.68) {
      const mode = face.complexion;
      const spot = (cy, cz, r) => ((v - cy) / r) ** 2 + ((eye - cz) / (r * 0.86)) ** 2 < 1;
      if (mode === 'fine-lines' && a > 0.64 && a < 0.92) {
        const outward = a - 0.64;
        if (
          Math.abs(eye + 0.088 + 0.37 * outward) < 0.023 ||
          (outward > 0.072 && Math.abs(eye + 0.024 + 0.14 * outward) < 0.018)
        )
          return k.skinFold;
      }
      if (
        mode === 'smile-lines' &&
        eye < -0.23 &&
        lip > -0.09 &&
        Math.abs(a - (0.26 - 0.38 * (eye + 0.23))) < 0.025
      )
        return k.skinFold;
      if (mode === 'birthmark' && (spot(-0.65, -0.27, 0.114) || spot(-0.72, -0.3, 0.088))) return k.skinMark;
      if (mode === 'cheek-scar' && v > 0.44 && v < 0.79 && Math.abs(eye + 0.29 - 0.45 * (v - 0.58)) < 0.028)
        return k.scar;
      if (mode === 'freckles' || mode === 'sunspots') {
        const points = mode === 'freckles' ? dots : bridgeDots;
        for (let i = 0; i < points.length; i++)
          if (spot(points[i][0], points[i][1], i % 3 === 0 ? 0.039 : 0.03)) return k.mark;
      } else if (
        (mode === 'left-mole' && spot(0.64, -0.17, 0.048)) ||
        (mode === 'lip-mole' && Math.hypot(v + 0.34, lip - 0.025) < 0.051)
      )
        return k.mark;
      else if (mode === 'beauty-spots' && (spot(-0.49, -0.16, 0.042) || spot(0.74, -0.36, 0.05)))
        return k.mark;
      else if (
        mode === 'dimples' &&
        Math.abs(a - 0.43) < 0.038 &&
        Math.abs(lip - 0.065 + (a - 0.43) * 0.52) < 0.056
      )
        return k.noseShade;
    }
    if (face.makeup && u > 0.3) {
      const mode = face.makeup,
        q = (a - eyeOffset) / 0.29;
      const blush =
        ((a - (mode === 'draping' ? 0.71 : 0.59)) / 0.23) ** 2 +
        ((eye + 0.28 - (mode === 'draping' ? 0.38 * (a - 0.59) : 0)) / 0.106) ** 2;
      if ((mode === 'blush' || mode === 'draping') && blush < 1)
        return blush < 0.45 ? k.makeupPigment : k.makeupSoft;
      if (mode === 'shimmer' && Math.abs(q + 0.73) < 0.21 && Math.abs(eye - 0.008) < 0.05)
        return k.makeupGlint;
      if (mode === 'shadow' && Math.abs(q) < 1.04 && eye > 0.055 && eye < 0.185 * (1 - 0.56 * q * q))
        return k.makeupSoft;
      if (
        (mode === 'eyeliner' || mode === 'winged') &&
        q > 0.2 &&
        q < (mode === 'winged' ? 1.26 : 1) &&
        Math.abs(eye - (0.094 - 0.055 * q * q + (mode === 'winged' ? 0.1 * q * q : 0))) < 0.03
      )
        return k.makeupDeep;
    }
    if (face.facialHair && u > -0.1) {
      const mode = face.facialHair,
        hair = k.beardPigment,
        shade = k.beardDeep;
      const moustache = lip > 0.068 && lip < 0.159 - 0.045 * a && a < 0.31 && a > 0.02;
      const jaw = h < -0.33 - 0.16 * Math.max(0, 0.8 - a) && h > -0.98;
      const beard = jaw && (a > 0.32 + 0.32 * Math.max(0, h + 0.67) || lip < -0.12);
      if (mode === 'moustache' && moustache) return hair;
      if (mode === 'pencil' && a < 0.3 && a > 0.022 && Math.abs(lip - 0.085 + 0.085 * a) < 0.029)
        return shade;
      if (
        mode === 'handlebar' &&
        ((moustache && a < 0.29) ||
          (a > 0.23 && a < 0.43 && Math.abs(lip - (0.085 + 0.95 * (a - 0.28) ** 2 * 3)) < 0.042))
      )
        return hair;
      if (mode === 'goatee' && a < 0.24 && (moustache || (lip < -0.11 && h > -0.94 && a < 0.28 + 0.18 * h)))
        return shade;
      if (mode === 'sideburns' && a > 0.84 && h < 0.045 && h > -0.43 && u < 0.58) return hair;
      if (mode === 'chinstrap' && jaw && ((a > 0.62 && a < 0.94 && h < -0.3) || (h < -0.73 && lip < -0.2)))
        return hair;
      if (mode === 'beard' && (beard || moustache)) return a > 0.57 || h < -0.72 ? shade : hair;
      if (mode === 'stubble' && beard && Math.cos(v * 79 + h * 31) * Math.cos(h * 68 - v * 24) > 0.09)
        return k.beardSoft;
    }
    return 0;
  }
  return {
    proportions,
    morphs,
    profileControls,
    basicNoses,
    features,
    details,
    dyes,
    color,
    materials,
    eyes,
    brows,
    noses,
    mouths,
    outlines,
    outlineWidth,
    jawBreadth,
    eye,
    brow,
    mouth,
    nose,
    noseUnderside,
    iris,
    skinInk
  };
})();
